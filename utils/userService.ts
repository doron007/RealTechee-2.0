import { fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { listContacts, getContacts } from '../queries';
import { createContacts, updateContacts } from '../mutations';
import { RoleAssignmentService, type ContactInfo } from './roleAssignmentService';

export type UserRole = 'super_admin' | 'admin' | 'accounting' | 'srm' | 'agent' | 'homeowner' | 'provider' | 'guest';

export interface UserProfile {
  email: string;
  phoneNumber?: string;
  givenName?: string;
  familyName?: string;
  role?: UserRole;
  contactId?: string;
  membershipTier?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  companyId?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const client = generateClient();

export class UserService {
  
  /**
   * Format phone number to E.164 format for Cognito
   */
  private static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and has 11 digits (US number with country code)
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    }
    
    // If it has 10 digits (US number without country code)
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    
    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Default: assume US number and add +1
    return `+1${digitsOnly}`;
  }

  /**
   * Validate phone number format
   */
  private static isValidPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(formatted);
  }
  
  /**
   * Get current user profile with notification preferences
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const attributes = await fetchUserAttributes();
      
      return {
        email: attributes.email || '',
        phoneNumber: attributes.phone_number,
        givenName: attributes.given_name,
        familyName: attributes.family_name,
        role: attributes['custom:role'] as UserRole,
        contactId: attributes['custom:contactId'],
        membershipTier: attributes['custom:membershipTier'],
        emailNotifications: attributes['custom:emailNotifications'] === 'false' ? false : true, // Default true
        smsNotifications: attributes['custom:smsNotifications'] === 'true' ? true : false, // Default false
        companyId: attributes['custom:companyId']
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      await updateUserAttributes({
        userAttributes: {
          'custom:emailNotifications': preferences.emailNotifications ? 'true' : 'false',
          'custom:smsNotifications': preferences.smsNotifications ? 'true' : 'false'
        }
      });
      
      console.log('✅ Notification preferences updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update notification preferences:', error);
      return false;
    }
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const userAttributes: { [key: string]: string } = {};
      
      if (updates.phoneNumber !== undefined) {
        if (updates.phoneNumber) {
          // Validate and format phone number
          if (!this.isValidPhoneNumber(updates.phoneNumber)) {
            throw new Error(`Invalid phone number format: ${updates.phoneNumber}. Please use format: (123) 456-7890 or +1234567890`);
          }
          userAttributes.phone_number = this.formatPhoneNumber(updates.phoneNumber);
        } else {
          // Allow clearing phone number
          userAttributes.phone_number = '';
        }
      }
      if (updates.givenName !== undefined) {
        userAttributes.given_name = updates.givenName;
      }
      if (updates.familyName !== undefined) {
        userAttributes.family_name = updates.familyName;
      }
      if (updates.role !== undefined) {
        userAttributes['custom:role'] = updates.role;
      }
      if (updates.contactId !== undefined) {
        userAttributes['custom:contactId'] = updates.contactId;
      }
      if (updates.membershipTier !== undefined) {
        userAttributes['custom:membershipTier'] = updates.membershipTier;
      }
      if (updates.companyId !== undefined) {
        userAttributes['custom:companyId'] = updates.companyId;
      }
      if (updates.emailNotifications !== undefined) {
        userAttributes['custom:emailNotifications'] = updates.emailNotifications ? 'true' : 'false';
      }
      if (updates.smsNotifications !== undefined) {
        userAttributes['custom:smsNotifications'] = updates.smsNotifications ? 'true' : 'false';
      }

      await updateUserAttributes({ userAttributes });
      
      console.log('✅ User profile updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      return false;
    }
  }

  /**
   * Check if user has required role(s)
   */
  static async hasRole(requiredRoles: UserRole | UserRole[]): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      if (!profile || !profile.role) {
        return false;
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return roles.includes(profile.role);
    } catch (error) {
      console.error('Failed to check user role:', error);
      return false;
    }
  }

  /**
   * Check if user has admin privileges
   */
  static async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }

  /**
   * Check if user has back-office access (admin, accounting, srm)
   */
  static async hasBackOfficeAccess(): Promise<boolean> {
    return this.hasRole(['admin', 'accounting', 'srm']);
  }

  /**
   * Get user display name
   */
  static getUserDisplayName(profile: UserProfile): string {
    if (profile.givenName && profile.familyName) {
      return `${profile.givenName} ${profile.familyName}`;
    }
    if (profile.givenName) {
      return profile.givenName;
    }
    return profile.email.split('@')[0]; // Fallback to email username
  }

  /**
   * Initialize new user with default settings
   */
  static async initializeNewUser(role: UserRole = 'guest', contactId?: string): Promise<boolean> {
    try {
      const updates: Partial<UserProfile> = {
        role,
        emailNotifications: true, // Default: email notifications enabled
        smsNotifications: false, // Default: SMS notifications disabled
      };

      if (contactId) {
        updates.contactId = contactId;
      }

      return await this.updateUserProfile(updates);
    } catch (error) {
      console.error('❌ Failed to initialize new user:', error);
      return false;
    }
  }

  /**
   * Find contact by normalized email
   */
  static async findContactByEmail(email: string): Promise<any | null> {
    try {
      const normalizedEmail = this.normalizeEmail(email);
      
      const result = await client.graphql({
        query: listContacts,
        variables: {
          filter: {
            email: { eq: normalizedEmail }
          },
          limit: 1
        }
      });

      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return null;
      }

      const contacts = result.data.listContacts?.items || [];
      return contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      console.error('Error finding contact by email:', error);
      return null;
    }
  }

  /**
   * Create new contact from user profile
   */
  static async createContactFromUser(profile: UserProfile): Promise<any | null> {
    try {
      const now = new Date().toISOString();
      
      const contactInput = {
        email: this.normalizeEmail(profile.email),
        firstName: profile.givenName,
        lastName: profile.familyName,
        fullName: this.buildFullName(profile.givenName, profile.familyName),
        phone: profile.phoneNumber,
        emailNotifications: profile.emailNotifications,
        smsNotifications: profile.smsNotifications
      };

      const result = await client.graphql({
        query: createContacts,
        variables: {
          input: contactInput
        }
      });

      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        return null;
      }

      console.log('✅ Created new contact from user profile');
      return result.data.createContacts;
    } catch (error) {
      console.error('Error creating contact from user:', error);
      return null;
    }
  }

  /**
   * Link user to existing contact
   */
  static async linkUserToContact(contactId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) {
        console.error('No user profile found');
        return false;
      }

      return await this.updateUserProfile({ contactId });
    } catch (error) {
      console.error('Error linking user to contact:', error);
      return false;
    }
  }

  /**
   * Auto-link user to contact or create new contact
   */
  static async autoLinkToContact(): Promise<{ success: boolean; contactId?: string; isNewContact: boolean; assignedRole?: UserRole }> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) {
        return { success: false, isNewContact: false };
      }

      // Skip if already linked
      if (profile.contactId) {
        console.log('User already linked to contact:', profile.contactId);
        return { success: true, contactId: profile.contactId, isNewContact: false };
      }

      // Look for existing contact
      let contact = await this.findContactByEmail(profile.email);
      let isNewContact = false;

      if (!contact) {
        // Create new contact
        contact = await this.createContactFromUser(profile);
        if (!contact) {
          return { success: false, isNewContact: false };
        }
        isNewContact = true;
      }

      // Determine appropriate role based on contact
      const contactInfo: ContactInfo = {
        email: profile.email,
        company: contact.company,
        brokerage: contact.brokerage,
        firstName: contact.firstName,
        lastName: contact.lastName
      };

      const roleResult = RoleAssignmentService.determineUserRole(contactInfo);
      const assignedRole = roleResult.role;

      // Update user with contact link and role
      const updateSuccess = await this.updateUserProfile({
        contactId: contact.id,
        role: assignedRole,
        emailNotifications: contact.emailNotifications !== false,
        smsNotifications: contact.smsNotifications || false
      });

      if (updateSuccess) {
        console.log(`✅ User auto-linked to contact ${contact.id} with role ${assignedRole}`);
        console.log(`📋 ${roleResult.explanation}`);
        return { 
          success: true, 
          contactId: contact.id, 
          isNewContact, 
          assignedRole 
        };
      }

      return { success: false, isNewContact };
    } catch (error) {
      console.error('Error in auto-link to contact:', error);
      return { success: false, isNewContact: false };
    }
  }

  /**
   * Get suggested role for current user based on contact
   */
  static async getSuggestedRole(): Promise<{ role: UserRole; explanation: string; confidence: string } | null> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) return null;

      let contact = null;
      if (profile.contactId) {
        // Get linked contact
        const result = await client.graphql({
          query: getContacts,
          variables: { id: profile.contactId }
        });
        contact = result.data.getContacts;
      } else {
        // Look for contact by email
        contact = await this.findContactByEmail(profile.email);
      }

      if (!contact) return null;

      const contactInfo: ContactInfo = {
        email: profile.email,
        company: contact.company,
        brokerage: contact.brokerage,
        firstName: contact.firstName,
        lastName: contact.lastName
      };

      const roleResult = RoleAssignmentService.determineUserRole(contactInfo);
      return {
        role: roleResult.role,
        explanation: roleResult.explanation,
        confidence: roleResult.confidence
      };
    } catch (error) {
      console.error('Error getting suggested role:', error);
      return null;
    }
  }

  /**
   * Normalize email for consistent comparison
   */
  private static normalizeEmail(email: string): string {
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
  private static buildFullName(givenName?: string, familyName?: string): string | undefined {
    if (!givenName && !familyName) return undefined;
    return `${givenName || ''} ${familyName || ''}`.trim();
  }
}