import { generateClient } from 'aws-amplify/api';
import { createNotificationQueue } from '../mutations';
import { GetEstimatePayload } from '../amplify/functions/notification-processor/src/types';
import { type Schema } from '../amplify/data/resource';
import { UserService, type UserProfile } from './userService';
import { FormNotificationIntegration } from '../services/formNotificationIntegration';

// Initialize Amplify GraphQL client with API key for anonymous access
const client = generateClient<any>({
  authMode: 'apiKey'
});

interface ContactNotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  phone?: string;
}

interface NotificationRecipient {
  type: 'user' | 'contact';
  id: string;
  email: string;
  phone?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export class NotificationService {
  
  /**
   * Get notification settings from authenticated user
   */
  static async getCurrentUserSettings(): Promise<NotificationRecipient | null> {
    try {
      const userProfile = await UserService.getUserProfile();
      if (!userProfile) {
        return null;
      }

      return {
        type: 'user',
        id: userProfile.email, // Use email as user ID
        email: userProfile.email,
        phone: userProfile.phoneNumber,
        emailNotifications: userProfile.emailNotifications,
        smsNotifications: userProfile.smsNotifications
      };
    } catch (error) {
      console.error('Failed to get current user settings:', error);
      return null;
    }
  }

  /**
   * Get notification settings from contact record
   */
  static async getContactSettings(contactId: string): Promise<NotificationRecipient | null> {
    try {
      const result = await client.graphql({
        query: `query GetContact($id: ID!) {
          getContacts(id: $id) {
            id
            emailNotifications
            smsNotifications
            phone
          }
        }`,
        variables: { id: contactId }
      }) as any;
      
      const contact = result.data?.getContacts;
      
      if (contact) {
        return {
          type: 'contact',
          id: contact.id,
          email: contact.email,
          phone: contact.phone,
          emailNotifications: contact.emailNotifications ?? true,
          smsNotifications: contact.smsNotifications ?? false
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get contact settings:', error);
      return null;
    }
  }

  /**
   * Get user notification settings (legacy method for backward compatibility)
   */
  static async getUserSettings(contactId: string): Promise<ContactNotificationSettings | null> {
    const recipient = await this.getContactSettings(contactId);
    if (!recipient) return null;
    
    return {
      emailNotifications: recipient.emailNotifications,
      smsNotifications: recipient.smsNotifications,
      phone: recipient.phone
    };
  }

  /**
   * Filter channels based on user settings
   */
  static filterChannelsBySettings(
    requestedChannels: string[], 
    settings: ContactNotificationSettings | null
  ): string[] {
    if (!settings) {
      return ['EMAIL']; // Default to email only if no settings
    }

    const allowedChannels: string[] = [];
    
    requestedChannels.forEach(channel => {
      switch (channel.toLowerCase()) {
        case 'email':
          if (settings.emailNotifications) {
            allowedChannels.push(channel);
          }
          break;
        case 'sms':
          if (settings.smsNotifications && settings.phone) {
            allowedChannels.push(channel);
          }
          break;
        default:
          // Unknown channels are not allowed
          break;
      }
    });

    // Always include email as fallback if no channels enabled
    if (allowedChannels.length === 0 && settings.emailNotifications) {
      allowedChannels.push('EMAIL');
    }

    return allowedChannels;
  }

  /**
   * Queue a "Get Estimate" notification using new decoupled architecture
   */
  static async queueGetEstimateNotification(data: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerCompany?: string;
    propertyAddress?: string;
    productType?: string;
    message?: string;
    submissionId?: string;
    contactId?: string; // Add contact ID to respect preferences
    requestId?: string; // Add request ID for admin link
  }): Promise<string> {
    
    try {
      console.log('📬 Queueing Get Estimate notification (new decoupled architecture):', {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        productType: data.productType,
        requestId: data.requestId
      });

      // Get notification integration service instance
      const notificationIntegration = FormNotificationIntegration.getInstance();
      
      // Generate final email/SMS content in backend (no template dependency)
      const emailContent = (notificationIntegration as any).generateGetEstimateEmailContent({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerCompany: data.customerCompany,
        propertyAddress: data.propertyAddress,
        productType: data.productType,
        message: data.message,
        submissionId: data.submissionId,
        requestId: data.requestId,
        testData: false
      });
      
      const smsContent = (notificationIntegration as any).generateGetEstimateSmsContent({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerCompany: data.customerCompany,
        propertyAddress: data.propertyAddress,
        productType: data.productType,
        message: data.message,
        submissionId: data.submissionId,
        requestId: data.requestId,
        testData: false
      });

      // Get user settings if contact ID is provided
      let settings: ContactNotificationSettings | null = null;
      if (data.contactId) {
        settings = await this.getUserSettings(data.contactId);
        console.log('📋 Retrieved customer notification settings:', {
          contactId: data.contactId,
          emailNotifications: settings?.emailNotifications,
          smsNotifications: settings?.smsNotifications,
          phone: settings?.phone ? 'present' : 'missing'
        });
      } else {
        console.log('📋 No contact ID provided - using default channels only');
      }

      // Default channels (admin will always get EMAIL and SMS notifications)
      let channels = ['EMAIL', 'SMS'];
      console.log('📧📱 Admin will always receive EMAIL and SMS notifications');
      
      // If we have customer settings, add their preferred channels
      if (settings) {
        const allowedChannels = this.filterChannelsBySettings(['EMAIL', 'SMS'], settings);
        console.log('📱 Customer allowed channels based on preferences:', allowedChannels);
        
        if (allowedChannels.length > 0) {
          channels = Array.from(new Set([...channels, ...allowedChannels])); // Remove duplicates
          console.log('📬 Final notification channels:', channels);
        } else {
          console.log('🚫 Customer has disabled all notifications - admin will still receive EMAIL and SMS');
        }
      } else {
        console.log('📬 Using default channels (no customer preferences found):', channels);
      }

      // Queue pre-generated content (Lambda just sends, no processing)
      const notificationId = await this.queueDirectNotification({
        eventType: 'get_estimate_request',
        recipientIds: ['admin-team'],
        channels: channels,
        content: {
          email: {
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            to: 'info@realtechee.com'
          },
          sms: {
            message: smsContent,
            to: process.env.DEBUG_PHONE || ''
          }
        }
      });
      
      console.log('✅ Get Estimate notification queued successfully:', notificationId);
      return notificationId;

    } catch (error) {
      console.error('❌ Failed to queue Get Estimate notification:', error);
      throw new Error(`Failed to queue Get Estimate notification: ${(error as any).message}`);
    }
  }

  /**
   * Queue a generic notification
   */
  static async queueNotification(params: {
    eventType: string;
    templateId: string;
    recipientIds: string[];
    channels: string[];
    payload: any;
    scheduledAt?: Date;
  }): Promise<string> {
    
    try {
      console.log(`📬 Queueing ${params.eventType} notification`);

      const result = await client.graphql({
        query: createNotificationQueue,
        variables: {
          input: {
            eventType: params.eventType,
            payload: JSON.stringify(params.payload),
            recipientIds: JSON.stringify(params.recipientIds),
            channels: JSON.stringify(params.channels),
            templateId: params.templateId,
            scheduledAt: params.scheduledAt?.toISOString(),
            status: 'PENDING' as any,
            retryCount: 0,
            owner: 'anonymous'
          }
        }
      });

      const notificationId = result.data?.createNotificationQueue?.id;
      console.log('✅ Notification queued successfully:', notificationId);
      
      return notificationId;

    } catch (error) {
      console.error('❌ Failed to queue notification:', error);
      throw new Error(`Failed to queue notification: ${(error as any).message}`);
    }
  }

  /**
   * Queue a notification with pre-generated content (no template processing needed)
   */
  static async queueDirectNotification(params: {
    eventType: string;
    recipientIds: string[];
    channels: string[];
    content: {
      email?: {
        subject: string;
        html: string;
        text: string;
        to: string;
      };
      sms?: {
        message: string;
        to: string;
      };
    };
    scheduledAt?: Date;
  }): Promise<string> {
    
    try {
      console.log(`📬 Queueing ${params.eventType} direct notification (pre-generated content)`);

      const result = await client.graphql({
        query: createNotificationQueue,
        variables: {
          input: {
            eventType: params.eventType,
            recipientIds: JSON.stringify(params.recipientIds),
            channels: JSON.stringify(params.channels),
            directContent: JSON.stringify(params.content), // Store as directContent instead of payload
            status: 'PENDING' as any,
            priority: 'MEDIUM' as any,
            scheduledAt: params.scheduledAt?.toISOString(),
            retryCount: 0,
            owner: 'anonymous'
          }
        }
      });

      const notificationId = result.data.createNotificationQueue.id;
      console.log(`✅ Notification queued successfully: ${notificationId}`);
      
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to queue direct notification:', error);
      throw new Error(`Failed to queue ${params.eventType} notification: ${(error as any).message}`);
    }
  }

  /**
   * Test notification system by sending a test email
   */
  static async sendTestNotification(recipientEmail: string): Promise<string> {
    const testPayload = {
      customer: {
        name: 'Test Customer',
        email: recipientEmail,
        phone: '(555) 123-4567'
      },
      property: {
        address: '123 Test Street, Test City, CA 90210'
      },
      project: {
        product: 'Kitchen Renovation',
        message: 'This is a test notification from the RealTechee notification system.'
      },
      submission: {
        id: `TEST-${Date.now()}`,
        timestamp: new Date().toLocaleString()
      },
      admin: {
        dashboardUrl: typeof window !== 'undefined' 
          ? `${window.location.origin}/admin/test`
          : 'https://localhost:3000/admin/test' // Fallback for server-side
      }
    };

    return this.queueNotification({
      eventType: 'test_notification',
      templateId: 'get-estimate-template', // Reuse the Get Estimate template for testing
      recipientIds: ['test-recipient'],
      channels: ['EMAIL'],
      payload: testPayload
    });
  }
}

// Convenience function for legacy code
export const queueGetEstimateNotification = NotificationService.queueGetEstimateNotification;