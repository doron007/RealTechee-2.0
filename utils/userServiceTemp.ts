import { fetchUserAttributes } from 'aws-amplify/auth';

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

/**
 * Temporary UserService that doesn't rely on custom attributes
 * Uses localStorage for development testing until custom attributes are deployed
 */
export class UserServiceTemp {
  
  private static getStorageKey(email: string): string {
    return `user_prefs_${email.replace(/[@.]/g, '_')}`;
  }
  
  private static getDefaultPreferences(): NotificationPreferences {
    return {
      emailNotifications: true,
      smsNotifications: false
    };
  }
  
  /**
   * Get current user profile with notification preferences
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const attributes = await fetchUserAttributes();
      
      if (!attributes.email) {
        return null;
      }
      
      // Get stored preferences from localStorage
      const storageKey = this.getStorageKey(attributes.email);
      const stored = localStorage.getItem(storageKey);
      const preferences = stored ? JSON.parse(stored) : this.getDefaultPreferences();
      
      // Determine role based on email and stored preferences
      let role: UserRole = 'guest';
      if (attributes.email === 'info@realtechee.com') {
        role = 'super_admin';
      } else if (stored && JSON.parse(stored).role) {
        role = JSON.parse(stored).role;
      }
      
      return {
        email: attributes.email,
        phoneNumber: attributes.phone_number,
        givenName: attributes.given_name,
        familyName: attributes.family_name,
        role,
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        contactId: stored ? JSON.parse(stored).contactId : undefined,
        membershipTier: stored ? JSON.parse(stored).membershipTier : undefined,
        companyId: stored ? JSON.parse(stored).companyId : undefined
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }
  
  /**
   * Update notification preferences (stored in localStorage temporarily)
   */
  static async updateNotificationPreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      const attributes = await fetchUserAttributes();
      if (!attributes.email) {
        return false;
      }
      
      const storageKey = this.getStorageKey(attributes.email);
      const existing = localStorage.getItem(storageKey);
      const currentData = existing ? JSON.parse(existing) : {};
      
      const updatedData = {
        ...currentData,
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      
      console.log('✅ Notification preferences updated (localStorage):', preferences);
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }
  
  /**
   * Update user profile fields
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const attributes = await fetchUserAttributes();
      if (!attributes.email) {
        return false;
      }
      
      const storageKey = this.getStorageKey(attributes.email);
      const existing = localStorage.getItem(storageKey);
      const currentData = existing ? JSON.parse(existing) : {};
      
      const updatedData = {
        ...currentData,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      
      console.log('✅ User profile updated (localStorage):', updates);
      return true;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  }
  
  /**
   * Check if user has specific role
   */
  static async hasRole(role: UserRole): Promise<boolean> {
    const profile = await this.getUserProfile();
    return profile?.role === role;
  }
  
  /**
   * Initialize user with default values
   */
  static async initializeNewUser(role: UserRole = 'guest'): Promise<boolean> {
    try {
      const attributes = await fetchUserAttributes();
      if (!attributes.email) {
        return false;
      }
      
      const storageKey = this.getStorageKey(attributes.email);
      const existing = localStorage.getItem(storageKey);
      
      if (!existing) {
        const defaultData = {
          role,
          emailNotifications: true,
          smsNotifications: false,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(defaultData));
        console.log('✅ User initialized with defaults');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize user:', error);
      return false;
    }
  }
  
  /**
   * Set user role (for admin use)
   */
  static async setUserRole(email: string, role: UserRole): Promise<boolean> {
    try {
      const storageKey = this.getStorageKey(email);
      const existing = localStorage.getItem(storageKey);
      const currentData = existing ? JSON.parse(existing) : {};
      
      const updatedData = {
        ...currentData,
        role,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      
      console.log('✅ User role updated (localStorage):', { email, role });
      return true;
    } catch (error) {
      console.error('Failed to set user role:', error);
      return false;
    }
  }
}