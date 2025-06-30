import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Contact, LinkingResult, NotificationPreferences } from '../types';
import { RoleAssignmentService, type UserRole } from '../../../../../utils/roleAssignmentService';

export class ContactLinkingService {
  private dynamoClient: DynamoDBDocumentClient;
  private cognitoClient: CognitoIdentityProviderClient;
  private contactsTable: string;
  
  constructor() {
    const dynamoBaseClient = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoBaseClient);
    this.cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
    this.contactsTable = process.env.CONTACTS_TABLE || 'Contacts';
  }
  
  /**
   * Main method to link user to contact after confirmation
   */
  async linkUserToContact(
    userPoolId: string, 
    userId: string, 
    email: string, 
    givenName?: string, 
    familyName?: string
  ): Promise<LinkingResult> {
    
    try {
      console.log(`🔗 Starting user-contact linking for ${email}`);
      
      // Step 1: Normalize email for consistent lookup
      const normalizedEmail = this.normalizeEmail(email);
      
      // Step 2: Look for existing contact
      const existingContact = await this.findContactByEmail(normalizedEmail);
      
      let contact: Contact;
      let isNewContact = false;
      
      if (existingContact) {
        console.log(`✅ Found existing contact: ${existingContact.id}`);
        contact = existingContact;
      } else {
        console.log(`➕ Creating new contact for ${normalizedEmail}`);
        contact = await this.createContactFromUser(normalizedEmail, givenName, familyName);
        isNewContact = true;
      }
      
      // Step 3: Determine appropriate role
      const roleResult = RoleAssignmentService.determineUserRole({
        email: normalizedEmail,
        company: contact.company,
        brokerage: contact.brokerage,
        firstName: contact.firstName,
        lastName: contact.lastName
      });
      const assignedRole = roleResult.role;
      const explanation = roleResult.explanation;
      
      // Step 4: Update user attributes in Cognito
      await this.updateUserAttributes(userPoolId, userId, {
        contactId: contact.id,
        role: assignedRole,
        emailNotifications: contact.emailNotifications !== false, // Default true
        smsNotifications: contact.smsNotifications || false // Default false
      });
      
      console.log(`✅ Successfully linked user ${userId} to contact ${contact.id} with role ${assignedRole}`);
      console.log(`📋 ${explanation}`);
      
      return {
        success: true,
        contactId: contact.id,
        isNewContact,
        assignedRole,
        explanation
      };
      
    } catch (error) {
      console.error(`❌ Failed to link user to contact:`, error);
      return {
        success: false,
        isNewContact: false,
        assignedRole: 'guest',
        explanation: 'Failed to link user to contact',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Find existing contact by email
   */
  private async findContactByEmail(normalizedEmail: string): Promise<Contact | null> {
    try {
      // Note: DynamoDB doesn't have case-insensitive search, so we scan and filter
      // In production, consider adding a GSI on normalized email for better performance
      const command = new ScanCommand({
        TableName: this.contactsTable,
        FilterExpression: '#email = :email',
        ExpressionAttributeNames: {
          '#email': 'email'
        },
        ExpressionAttributeValues: {
          ':email': normalizedEmail
        },
        Limit: 1
      });
      
      const result = await this.dynamoClient.send(command);
      
      if (result.Items && result.Items.length > 0) {
        return result.Items[0] as Contact;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding contact by email:', error);
      return null;
    }
  }
  
  /**
   * Create new contact from user signup data
   */
  private async createContactFromUser(email: string, givenName?: string, familyName?: string): Promise<Contact> {
    const now = new Date().toISOString();
    const contactId = this.generateId();
    
    const contact: Contact = {
      id: contactId,
      email: email,
      firstName: givenName,
      lastName: familyName,
      fullName: this.buildFullName(givenName, familyName),
      emailNotifications: true, // Default opt-in for email
      smsNotifications: false,  // Default opt-out for SMS
      createdAt: now,
      updatedAt: now
    };
    
    const command = new PutCommand({
      TableName: this.contactsTable,
      Item: contact
    });
    
    await this.dynamoClient.send(command);
    console.log(`✅ Created new contact: ${contactId}`);
    
    return contact;
  }
  
  /**
   * Update user attributes in Cognito
   */
  private async updateUserAttributes(
    userPoolId: string, 
    userId: string, 
    attributes: {
      contactId: string;
      role: UserRole;
      emailNotifications: boolean;
      smsNotifications: boolean;
    }
  ): Promise<void> {
    
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: userId,
      UserAttributes: [
        {
          Name: 'custom:contactId',
          Value: attributes.contactId
        },
        {
          Name: 'custom:role',
          Value: attributes.role
        },
        {
          Name: 'custom:emailNotifications',
          Value: attributes.emailNotifications ? 'true' : 'false'
        },
        {
          Name: 'custom:smsNotifications',
          Value: attributes.smsNotifications ? 'true' : 'false'
        }
      ]
    });
    
    await this.cognitoClient.send(command);
  }
  
  /**
   * Normalize email for consistent comparison
   */
  private normalizeEmail(email: string): string {
    if (!email) return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^\w@.-]/g, '');
  }
  
  /**
   * Build full name from first and last name
   */
  private buildFullName(givenName?: string, familyName?: string): string | undefined {
    if (!givenName && !familyName) return undefined;
    return `${givenName || ''} ${familyName || ''}`.trim();
  }
  
  /**
   * Generate unique ID for new contacts
   */
  private generateId(): string {
    return `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}