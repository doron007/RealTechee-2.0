import { 
  CognitoIdentityProviderClient, 
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AdminGetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';

interface UserAdminEvent {
  action: 'listUsers' | 'updateUser' | 'assignRole' | 'removeRole' | 'getUserDetails';
  userId?: string;
  attributes?: Record<string, string>;
  role?: string;
  limit?: number;
  nextToken?: string;
  requesterEmail?: string;
}

interface CognitoUser {
  userId: string;
  email: string;
  role?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
  contactId?: string;
  membershipTier?: string;
  companyId?: string;
  status: string;
  lastLogin?: string;
  groups: string[];
}

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const USER_POOL_ID = process.env.USER_POOL_ID;

// Super admin check
const isSuperAdmin = (email: string): boolean => {
  return email === 'info@realtechee.com';
};

// Check if user has admin privileges
const hasAdminAccess = (groups: string[], email: string): boolean => {
  return isSuperAdmin(email) || groups.includes('super_admin') || groups.includes('admin');
};

export const handler = async (event: UserAdminEvent) => {
  console.log('User Admin Lambda invoked:', JSON.stringify(event, null, 2));

  if (!USER_POOL_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'USER_POOL_ID not configured' })
    };
  }

  try {
    // Verify requester has admin access
    if (!event.requesterEmail) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Requester email required' })
      };
    }

    // For super admin, skip additional checks
    if (!isSuperAdmin(event.requesterEmail)) {
      // TODO: Verify requester has admin role by checking their Cognito groups
      // For now, we'll trust the frontend authorization check
    }

    switch (event.action) {
      case 'listUsers':
        return await listUsers(event.limit, event.nextToken);
      
      case 'updateUser':
        if (!event.userId || !event.attributes) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'userId and attributes required' })
          };
        }
        return await updateUser(event.userId, event.attributes);
      
      case 'assignRole':
        if (!event.userId || !event.role) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'userId and role required' })
          };
        }
        return await assignRole(event.userId, event.role);
      
      case 'removeRole':
        if (!event.userId || !event.role) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'userId and role required' })
          };
        }
        return await removeRole(event.userId, event.role);
      
      case 'getUserDetails':
        if (!event.userId) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'userId required' })
          };
        }
        return await getUserDetails(event.userId);
      
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    console.error('User Admin Lambda error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function listUsers(limit = 25, nextToken?: string): Promise<any> {
  const command = new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Limit: limit,
    PaginationToken: nextToken
  });

  const response = await cognitoClient.send(command);
  
  const users: CognitoUser[] = [];
  
  if (response.Users) {
    for (const user of response.Users) {
      // Get user groups
      const groupsCommand = new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.Username!
      });
      
      let groups: string[] = [];
      try {
        const groupsResponse = await cognitoClient.send(groupsCommand);
        groups = groupsResponse.Groups?.map(g => g.GroupName!).filter(Boolean) || [];
      } catch (error) {
        console.warn('Failed to get groups for user:', user.Username, error);
      }

      // Parse user attributes
      const attributes: Record<string, string> = {};
      user.Attributes?.forEach(attr => {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      });

      const cognitoUser: CognitoUser = {
        userId: user.Username!,
        email: attributes.email || '',
        role: attributes['custom:role'] || groups.find(g => 
          ['super_admin', 'admin', 'accounting', 'srm', 'agent', 'homeowner', 'provider'].includes(g)
        ) || 'guest',
        emailNotifications: attributes['custom:emailNotifications'] !== 'false',
        smsNotifications: attributes['custom:smsNotifications'] === 'true',
        givenName: attributes.given_name,
        familyName: attributes.family_name,
        phoneNumber: attributes.phone_number,
        contactId: attributes['custom:contactId'],
        membershipTier: attributes['custom:membershipTier'],
        companyId: attributes['custom:companyId'],
        status: user.UserStatus || 'UNKNOWN',
        lastLogin: user.UserLastModifiedDate?.toISOString(),
        groups
      };

      users.push(cognitoUser);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      users,
      nextToken: response.PaginationToken,
      hasMore: !!response.PaginationToken
    })
  };
}

async function updateUser(userId: string, attributes: Record<string, string>): Promise<any> {
  const userAttributes = Object.entries(attributes).map(([key, value]) => ({
    Name: key,
    Value: value
  }));

  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: USER_POOL_ID,
    Username: userId,
    UserAttributes: userAttributes
  });

  await cognitoClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'User updated successfully' })
  };
}

async function assignRole(userId: string, role: string): Promise<any> {
  // Update custom:role attribute
  await updateUser(userId, { 'custom:role': role });

  // Add to group if it exists
  const validGroups = ['super_admin', 'admin', 'accounting', 'srm', 'agent', 'homeowner', 'provider', 'guest'];
  if (validGroups.includes(role)) {
    try {
      const command = new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId,
        GroupName: role
      });
      await cognitoClient.send(command);
    } catch (error) {
      console.warn('Failed to add user to group:', error);
      // Continue - the custom attribute is more important than group membership
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Role assigned successfully' })
  };
}

async function removeRole(userId: string, role: string): Promise<any> {
  // Remove from group
  try {
    const command = new AdminRemoveUserFromGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      GroupName: role
    });
    await cognitoClient.send(command);
  } catch (error) {
    console.warn('Failed to remove user from group:', error);
  }

  // Set role to guest
  await updateUser(userId, { 'custom:role': 'guest' });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Role removed successfully' })
  };
}

async function getUserDetails(userId: string): Promise<any> {
  const command = new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: userId
  });

  const response = await cognitoClient.send(command);
  
  // Get user groups
  const groupsCommand = new AdminListGroupsForUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: userId
  });
  
  let groups: string[] = [];
  try {
    const groupsResponse = await cognitoClient.send(groupsCommand);
    groups = groupsResponse.Groups?.map(g => g.GroupName!).filter(Boolean) || [];
  } catch (error) {
    console.warn('Failed to get groups for user:', userId, error);
  }

  // Parse attributes
  const attributes: Record<string, string> = {};
  response.UserAttributes?.forEach(attr => {
    if (attr.Name && attr.Value) {
      attributes[attr.Name] = attr.Value;
    }
  });

  const userDetails: CognitoUser = {
    userId: response.Username!,
    email: attributes.email || '',
    role: attributes['custom:role'] || groups.find(g => 
      ['super_admin', 'admin', 'accounting', 'srm', 'agent', 'homeowner', 'provider'].includes(g)
    ) || 'guest',
    emailNotifications: attributes['custom:emailNotifications'] !== 'false',
    smsNotifications: attributes['custom:smsNotifications'] === 'true',
    givenName: attributes.given_name,
    familyName: attributes.family_name,
    phoneNumber: attributes.phone_number,
    contactId: attributes['custom:contactId'],
    membershipTier: attributes['custom:membershipTier'],
    companyId: attributes['custom:companyId'],
    status: response.UserStatus || 'UNKNOWN',
    lastLogin: response.UserLastModifiedDate?.toISOString(),
    groups
  };

  return {
    statusCode: 200,
    body: JSON.stringify({ user: userDetails })
  };
}