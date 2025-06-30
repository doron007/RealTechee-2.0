import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

export interface CognitoUser {
  userId: string;
  email: string;
  role: string;
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

export interface UsersResponse {
  users: CognitoUser[];
  nextToken?: string;
  hasMore: boolean;
}

export class AdminService {
  private static async getRequesterEmail(): Promise<string> {
    const attributes = await fetchUserAttributes();
    return attributes.email || '';
  }

  private static async invokeLambda(payload: any): Promise<any> {
    try {
      // Note: In a real implementation, this would call the Lambda function
      // For now, we'll simulate the response since we can't directly invoke Lambda from frontend
      console.log('Lambda payload:', payload);
      
      // Return mock data for development
      switch (payload.action) {
        case 'listUsers':
          return {
            statusCode: 200,
            body: JSON.stringify({
              users: [
                {
                  userId: 'user_1735603200000_abc123def',
                  email: 'info@realtechee.com',
                  role: 'super_admin',
                  emailNotifications: true,
                  smsNotifications: false,
                  givenName: 'RealTechee',
                  familyName: 'Admin',
                  status: 'CONFIRMED',
                  groups: ['super_admin'],
                  lastLogin: new Date().toISOString(),
                  contactId: undefined
                },
                {
                  userId: 'user_1735603260000_xyz789abc',
                  email: 'doron.hetz@gmail.com',
                  role: 'guest',
                  emailNotifications: true,
                  smsNotifications: false,
                  givenName: 'Doron',
                  familyName: 'Hetz',
                  status: 'CONFIRMED',
                  groups: ['guest'],
                  lastLogin: new Date().toISOString(),
                  contactId: undefined
                }
              ],
              hasMore: false
            })
          };
        
        case 'updateUserAttribute':
        case 'assignRole':
        case 'removeRole':
        case 'updateUser':
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Operation completed successfully' })
          };
          
        default:
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Operation completed' })
          };
      }
    } catch (error) {
      console.error('Lambda invocation error:', error);
      throw new Error('Failed to invoke admin operation');
    }
  }

  /**
   * List all Cognito users with pagination
   */
  static async listUsers(limit = 25, nextToken?: string): Promise<UsersResponse> {
    const requesterEmail = await this.getRequesterEmail();
    
    const payload = {
      action: 'listUsers',
      limit,
      nextToken,
      requesterEmail
    };

    const response = await this.invokeLambda(payload);
    
    if (response.statusCode !== 200) {
      throw new Error('Failed to list users');
    }

    return JSON.parse(response.body);
  }

  /**
   * Update user attributes
   */
  static async updateUser(userId: string, attributes: Record<string, string>): Promise<void> {
    const requesterEmail = await this.getRequesterEmail();
    
    const payload = {
      action: 'updateUser',
      userId,
      attributes,
      requesterEmail
    };

    const response = await this.invokeLambda(payload);
    
    if (response.statusCode !== 200) {
      throw new Error('Failed to update user');
    }
  }

  /**
   * Assign role to user
   */
  static async assignRole(userId: string, role: string): Promise<void> {
    const requesterEmail = await this.getRequesterEmail();
    
    const payload = {
      action: 'assignRole',
      userId,
      role,
      requesterEmail
    };

    const response = await this.invokeLambda(payload);
    
    if (response.statusCode !== 200) {
      throw new Error('Failed to assign role');
    }
  }

  /**
   * Remove role from user
   */
  static async removeRole(userId: string, role: string): Promise<void> {
    const requesterEmail = await this.getRequesterEmail();
    
    const payload = {
      action: 'removeRole',
      userId,
      role,
      requesterEmail
    };

    const response = await this.invokeLambda(payload);
    
    if (response.statusCode !== 200) {
      throw new Error('Failed to remove role');
    }
  }

  /**
   * Update user attribute
   */
  static async updateUserAttribute(userId: string, attributeName: string, attributeValue: string | null): Promise<void> {
    const requesterEmail = await this.getRequesterEmail();
    
    const payload = {
      action: 'updateUserAttribute',
      userId,
      attributeName,
      attributeValue,
      requesterEmail
    };

    const response = await this.invokeLambda(payload);
    
    if (response.statusCode !== 200) {
      throw new Error('Failed to update user attribute');
    }
  }

  /**
   * Get detailed user information
   */
  static async getUserDetails(userId: string): Promise<CognitoUser> {
    const requesterEmail = await this.getRequesterEmail();
    
    const payload = {
      action: 'getUserDetails',
      userId,
      requesterEmail
    };

    const response = await this.invokeLambda(payload);
    
    if (response.statusCode !== 200) {
      throw new Error('Failed to get user details');
    }

    const result = JSON.parse(response.body);
    return result.user;
  }

  /**
   * Link contact to user account
   */
  static async linkContactToUser(contactId: string, userId: string): Promise<void> {
    try {
      // Update contact with linked user ID (if we add this field to schema)
      // For now, we'll update the user's custom:contactId attribute
      await this.updateUser(userId, {
        'custom:contactId': contactId
      });
    } catch (error) {
      console.error('Failed to link contact to user:', error);
      throw new Error('Failed to link contact to user');
    }
  }

  /**
   * Create silent user for contact
   */
  static async createSilentUser(contactEmail: string, contactName?: string): Promise<string> {
    // This would require additional Lambda function to create users
    // For now, return placeholder
    console.log('Creating silent user for:', contactEmail, contactName);
    throw new Error('Silent user creation not implemented yet');
  }

  /**
   * Check if current user is super admin
   */
  static async isSuperAdmin(): Promise<boolean> {
    const requesterEmail = await this.getRequesterEmail();
    const isSuperAdminEmail = requesterEmail === 'info@realtechee.com';
    
    // Also check for super_admin role
    try {
      const { AuthorizationService } = await import('./authorizationHelpers');
      const hasSuperAdminRole = await AuthorizationService.hasMinimumRole('super_admin');
      return isSuperAdminEmail || hasSuperAdminRole;
    } catch {
      return isSuperAdminEmail;
    }
  }
}