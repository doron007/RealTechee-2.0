/**
 * RealTechee Notification Service
 * 
 * Handles sending internal staff notifications for form submissions
 * Supports both email and SMS notifications using AWS SES and SNS
 * Includes production-ready recipient validation with environment safety
 */

// Templates now come from Dynamo table - removing static import
// Types moved to respective API files for form data structures
export type ContactFormData = {
  formType: string;
  submissionId: string;
  submittedAt: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  urgency?: string;
  preferredContact?: string;
  testData?: boolean;
  leadSource?: string;
};

export type GetQualifiedFormData = {
  formType: string;
  submissionId: string;
  submittedAt: string;
  name: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  brokerage?: string;
  yearsExperience?: string;
  specialties?: string[];
  marketAreas?: string[];
  currentVolume?: string;
  goals?: string;
  testData?: boolean;
  leadSource?: string;
};

export type AffiliateFormData = {
  formType: string;
  submissionId: string;
  submittedAt: string;
  companyName?: string;
  contactName: string;
  email: string;
  phone?: string;
  serviceType?: string;
  businessLicense?: string;
  insurance?: boolean;
  bonded?: boolean;
  yearsInBusiness?: string;
  serviceAreas?: string[];
  certifications?: string[];
  portfolio?: string;
  testData?: boolean;
  leadSource?: string;
};
import { AdminService, CognitoUser } from '@/utils/adminService';
import logger from '@/lib/logger';

// AWS SDK v3 imports
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export type NotificationRecipient = {
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'ae' | 'manager' | 'support' | 'super_admin';
  userId?: string;
  active?: boolean;
};

export type EnvironmentConfig = {
  environment: 'development' | 'staging' | 'production';
  debugEmail?: string;
  debugPhone?: string;
  debugNotifications?: boolean;
};

export type RecipientValidationResult = {
  validRecipients: NotificationRecipient[];
  filteredCount: number;
  environmentOverride: boolean;
  debugMode: boolean;
  validationLog: string[];
};

export type NotificationChannel = 'email' | 'sms' | 'both';

export type SendNotificationParams = {
  templateType: 'contactUs' | 'getQualified' | 'affiliate';
  data: ContactFormData | GetQualifiedFormData | AffiliateFormData;
  recipients: NotificationRecipient[];
  channels: NotificationChannel;
  priority?: 'low' | 'medium' | 'high';
};

export class NotificationService {
  private static instance: NotificationService;
  private ses: SESClient;
  private sns: SNSClient;

  private constructor() {
    // Initialize AWS services with credentials from environment
    this.ses = new SESClient({ 
      region: process.env.AWS_REGION || 'us-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    this.sns = new SNSClient({ 
      region: process.env.AWS_REGION || 'us-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send notification to internal staff with environment-aware recipient validation
   */
  public async sendNotification(params: SendNotificationParams): Promise<{
    success: boolean;
    results: {
      email?: any[];
      sms?: any[];
    };
    errors?: any[];
    recipientValidation?: RecipientValidationResult;
  }> {
    const { templateType, data, recipients, channels, priority = 'medium' } = params;

    try {
      const results: { email?: any[]; sms?: any[] } = {};
      const errors: any[] = [];

      // Step 1: Validate and filter recipients based on environment and roles
      const recipientValidation = await this.validateAndFilterRecipients(recipients, data);
      const validRecipients = recipientValidation.validRecipients;

      // Log recipient validation results
      logger.info('Notification recipient validation completed', {
        templateType,
        originalCount: recipients.length,
        validCount: validRecipients.length,
        environmentOverride: recipientValidation.environmentOverride,
        debugMode: recipientValidation.debugMode
      });

      // Step 2: Filter recipients based on priority and role
      const filteredRecipients = this.filterRecipientsByPriority(validRecipients, priority);

      if (channels === 'email' || channels === 'both') {
        try {
          results.email = await this.sendEmailNotifications(templateType, data, filteredRecipients);
        } catch (error) {
          errors.push({ channel: 'email', error });
        }
      }

      if (channels === 'sms' || channels === 'both') {
        try {
          results.sms = await this.sendSMSNotifications(templateType, data, filteredRecipients);
        } catch (error) {
          errors.push({ channel: 'sms', error });
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
        recipientValidation
      };

    } catch (error) {
      console.error('NotificationService error:', error);
      return {
        success: false,
        results: {},
        errors: [{ general: error }]
      };
    }
  }

  /**
   * Send email notifications to recipients
   */
  private async sendEmailNotifications(
    templateType: string, 
    data: any, 
    recipients: NotificationRecipient[]
  ): Promise<any[]> {
    // Templates now retrieved from Dynamo table
    const template = await this.getEmailTemplate(templateType, data);
    const results: any[] = [];

    for (const recipient of recipients) {
      try {
        // Mock implementation - replace with actual AWS SES call
        const result = await this.sendEmail({
          to: recipient.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });
        
        results.push({
          recipient: recipient.email,
          status: 'sent',
          messageId: result?.MessageId || `mock_${Date.now()}`
        });
      } catch (error) {
        results.push({
          recipient: recipient.email,
          status: 'failed',
          error: error
        });
      }
    }

    return results;
  }

  /**
   * Send SMS notifications to recipients
   */
  private async sendSMSNotifications(
    templateType: string, 
    data: any, 
    recipients: NotificationRecipient[]
  ): Promise<any[]> {
    // Templates now retrieved from Dynamo table
    const message = await this.getSMSTemplate(templateType, data);
    const results: any[] = [];

    for (const recipient of recipients.filter(r => r.phone)) {
      try {
        // Mock implementation - replace with actual AWS SNS call
        const result = await this.sendSMS({
          to: recipient.phone!,
          message: message
        });
        
        results.push({
          recipient: recipient.phone,
          status: 'sent',
          messageId: result?.MessageId || `mock_sms_${Date.now()}`
        });
      } catch (error) {
        results.push({
          recipient: recipient.phone,
          status: 'failed',
          error: error
        });
      }
    }

    return results;
  }

  /**
   * Validate and filter recipients based on environment and role requirements
   */
  private async validateAndFilterRecipients(
    recipients: NotificationRecipient[],
    data: any
  ): Promise<RecipientValidationResult> {
    const environment = this.getEnvironment();
    const validationLog: string[] = [];
    
    // Get environment configuration
    const envConfig: EnvironmentConfig = {
      environment,
      debugEmail: process.env.DEBUG_EMAIL || 'info@realtechee.com',
      debugPhone: process.env.DEBUG_PHONE || '+17135919400',
      debugNotifications: process.env.DEBUG_NOTIFICATIONS === 'true'
    };
    
    validationLog.push(`Environment: ${environment}`);
    validationLog.push(`Debug mode: ${envConfig.debugNotifications}`);
    
    // DEVELOPMENT/STAGING SAFETY: Override all recipients with debug email
    if (environment !== 'production' || envConfig.debugNotifications) {
      validationLog.push('DEVELOPMENT/DEBUG MODE: Redirecting all notifications to debug email');
      
      return {
        validRecipients: [{
          name: 'Development Debug Recipient',
          email: envConfig.debugEmail!,
          phone: envConfig.debugPhone,
          role: 'admin',
          active: true
        }],
        filteredCount: recipients.length - 1,
        environmentOverride: true,
        debugMode: true,
        validationLog
      };
    }
    
    // PRODUCTION MODE: Get real admin/AE users from Cognito
    try {
      validationLog.push('PRODUCTION MODE: Querying admin and AE users from Cognito');
      const adminUsers = await this.getAdminAndAEUsers();
      
      // Convert Cognito users to notification recipients
      const validRecipients: NotificationRecipient[] = adminUsers.map(user => ({
        name: user.givenName && user.familyName 
          ? `${user.givenName} ${user.familyName}` 
          : user.email.split('@')[0],
        email: user.email,
        phone: user.phoneNumber,
        role: this.mapCognitoRoleToNotificationRole(user.role),
        userId: user.userId,
        active: user.status === 'CONFIRMED'
      }));
      
      // Filter out inactive users
      const activeRecipients = validRecipients.filter(r => r.active);
      
      validationLog.push(`Found ${adminUsers.length} admin/AE users, ${activeRecipients.length} active`);
      
      // Mark test data if applicable
      if (data.testData || data.leadSource === 'E2E_TEST') {
        validationLog.push('TEST DATA: Marking notification as test data');
      }
      
      return {
        validRecipients: activeRecipients,
        filteredCount: recipients.length - activeRecipients.length,
        environmentOverride: false,
        debugMode: false,
        validationLog
      };
    } catch (error) {
      validationLog.push(`Error querying users: ${error}`);
      logger.error('Failed to query admin/AE users, falling back to default recipients', { error });
      
      // Fallback to provided recipients but log the issue
      return {
        validRecipients: recipients.filter(r => ['admin', 'ae', 'super_admin'].includes(r.role)),
        filteredCount: 0,
        environmentOverride: false,
        debugMode: false,
        validationLog
      };
    }
  }
  
  /**
   * Get current environment from various sources
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    // Check multiple environment indicators
    const nodeEnv = process.env.NODE_ENV;
    const nextPublicEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
    const amplifyEnv = process.env.AMPLIFY_ENVIRONMENT;
    
    if (nodeEnv === 'production' && nextPublicEnv === 'production' && amplifyEnv === 'production') {
      return 'production';
    }
    
    if (nextPublicEnv === 'staging' || amplifyEnv === 'staging') {
      return 'staging';
    }
    
    // Default to development for safety
    return 'development';
  }
  
  /**
   * Query admin and AE users from Cognito
   */
  private async getAdminAndAEUsers(): Promise<CognitoUser[]> {
    try {
      // Get all users from AdminService
      const usersResponse = await AdminService.listUsers(100); // Get up to 100 users
      
      // Filter for admin and AE roles
      const adminAndAEUsers = usersResponse.users.filter(user => {
        const role = user.role.toLowerCase();
        const groups = user.groups.map(g => g.toLowerCase());
        
        return (
          ['admin', 'super_admin', 'ae', 'account_executive'].includes(role) ||
          groups.some(group => ['admin', 'super_admin', 'ae', 'account_executive'].includes(group))
        );
      });
      
      logger.info('Queried admin/AE users for notifications', {
        totalUsers: usersResponse.users.length,
        adminAEUsers: adminAndAEUsers.length,
        roles: adminAndAEUsers.map(u => ({ email: u.email, role: u.role }))
      });
      
      return adminAndAEUsers;
    } catch (error) {
      logger.error('Failed to query admin/AE users from Cognito', { error });
      throw error;
    }
  }
  
  /**
   * Map Cognito role to notification role
   */
  private mapCognitoRoleToNotificationRole(cognitoRole: string): NotificationRecipient['role'] {
    const role = cognitoRole.toLowerCase();
    
    if (role === 'super_admin') return 'admin';
    if (role === 'admin') return 'admin';
    if (role === 'ae' || role === 'account_executive') return 'ae';
    if (role === 'manager') return 'manager';
    if (role === 'support') return 'support';
    
    // Default to admin for unknown roles in production
    return 'admin';
  }
  
  /**
   * Filter recipients based on notification priority
   */
  private filterRecipientsByPriority(recipients: NotificationRecipient[], priority: string): NotificationRecipient[] {
    // For high priority, notify everyone
    if (priority === 'high') {
      return recipients;
    }
    
    // For medium priority, notify admins, super_admins, and AEs
    if (priority === 'medium') {
      return recipients.filter(r => ['admin', 'super_admin', 'ae'].includes(r.role));
    }
    
    // For low priority, notify only admins and super_admins
    return recipients.filter(r => ['admin', 'super_admin'].includes(r.role));
  }

  /**
   * Send email using AWS SES
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<any> {
    try {
      const command = new SendEmailCommand({
        Source: process.env.NOTIFICATION_FROM_EMAIL || 'info@realtechee.com',
        Destination: { ToAddresses: [params.to] },
        Message: {
          Subject: { Data: params.subject },
          Body: {
            Html: { Data: params.html },
            Text: { Data: params.text }
          }
        }
      });
      
      const result = await this.ses.send(command);
      logger.info('Email sent successfully via AWS SES', {
        messageId: result.MessageId,
        to: params.to,
        subject: params.subject
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to send email via AWS SES', {
        error,
        to: params.to,
        subject: params.subject
      });
      
      // Fallback to console log in development
      if (this.getEnvironment() === 'development') {
        console.log(`[FALLBACK EMAIL] To: ${params.to}, Subject: ${params.subject}`);
        return Promise.resolve({ MessageId: `fallback_email_${Date.now()}` });
      }
      
      throw error;
    }
  }

  /**
   * Send SMS using AWS SNS
   */
  private async sendSMS(params: {
    to: string;
    message: string;
  }): Promise<any> {
    try {
      const command = new PublishCommand({
        Message: params.message,
        PhoneNumber: params.to,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      });
      
      const result = await this.sns.send(command);
      logger.info('SMS sent successfully via AWS SNS', {
        messageId: result.MessageId,
        to: params.to,
        messageLength: params.message.length
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to send SMS via AWS SNS', {
        error,
        to: params.to,
        messageLength: params.message.length
      });
      
      // Fallback to console log in development
      if (this.getEnvironment() === 'development') {
        console.log(`[FALLBACK SMS] To: ${params.to}, Message: ${params.message}`);
        return Promise.resolve({ MessageId: `fallback_sms_${Date.now()}` });
      }
      
      throw error;
    }
  }

  /**
   * Get default notification recipients for different form types
   * In production, this will be overridden by Cognito user queries
   */
  public getDefaultRecipients(formType: 'contactUs' | 'getQualified' | 'affiliate' | 'getEstimate'): NotificationRecipient[] {
    // Fallback recipients - only used if Cognito query fails
    const baseRecipients: NotificationRecipient[] = [
      {
        name: 'RealTechee Admin',
        email: 'info@realtechee.com',
        phone: '+17135919400',
        role: 'admin',
        active: true
      }
    ];

    // In production, recipients are dynamically queried from Cognito
    // These are fallback configurations for development/testing
    switch (formType) {
      case 'contactUs':
        return [
          ...baseRecipients,
          {
            name: 'Customer Support',
            email: 'support@realtechee.com',
            phone: '+17135919401',
            role: 'support',
            active: true
          }
        ];

      case 'getQualified':
        return [
          ...baseRecipients,
          {
            name: 'Agent Relations',
            email: 'agents@realtechee.com',
            phone: '+17135919402',
            role: 'ae',
            active: true
          }
        ];

      case 'affiliate':
        return [
          ...baseRecipients,
          {
            name: 'Partnerships Team',
            email: 'partnerships@realtechee.com',
            phone: '+17135919403',
            role: 'manager',
            active: true
          }
        ];

      case 'getEstimate':
        return [
          ...baseRecipients,
          {
            name: 'Estimates Team',
            email: 'estimates@realtechee.com',
            phone: '+17135919404',
            role: 'manager',
            active: true
          }
        ];

      default:
        return baseRecipients;
    }
  }
  
  /**
   * Get dynamic recipients from Cognito for production use
   */
  public async getDynamicRecipients(
    formType: 'contactUs' | 'getQualified' | 'affiliate' | 'getEstimate'
  ): Promise<NotificationRecipient[]> {
    const environment = this.getEnvironment();
    
    // In development, use static recipients for safety
    if (environment !== 'production') {
      return this.getDefaultRecipients(formType);
    }
    
    try {
      // Query live admin/AE users from Cognito
      const adminAEUsers = await this.getAdminAndAEUsers();
      
      // Convert to notification recipients
      return adminAEUsers.map(user => ({
        name: user.givenName && user.familyName 
          ? `${user.givenName} ${user.familyName}` 
          : user.email.split('@')[0],
        email: user.email,
        phone: user.phoneNumber,
        role: this.mapCognitoRoleToNotificationRole(user.role),
        userId: user.userId,
        active: user.status === 'CONFIRMED'
      }));
    } catch (error) {
      logger.error('Failed to get dynamic recipients, falling back to defaults', { error });
      return this.getDefaultRecipients(formType);
    }
  }

  /**
   * Quick send method for common use cases with dynamic recipient resolution
   */
  public async quickSend(
    templateType: 'contactUs' | 'getQualified' | 'affiliate',
    data: any,
    options: {
      priority?: 'low' | 'medium' | 'high';
      channels?: NotificationChannel;
      customRecipients?: NotificationRecipient[];
      testMode?: boolean;
    } = {}
  ) {
    const {
      priority = 'medium',
      channels = 'both',
      customRecipients,
      testMode = false
    } = options;

    // Mark test data if in test mode
    if (testMode) {
      data.testData = true;
      data.leadSource = 'E2E_TEST';
    }

    // Get recipients - either custom, dynamic (production), or default (development)
    const recipients = customRecipients || await this.getDynamicRecipients(templateType);

    return await this.sendNotification({
      templateType,
      data,
      recipients,
      channels,
      priority
    });
  }

  /**
   * Get email template from Dynamo table
   */
  private async getEmailTemplate(templateType: string, data: any): Promise<{
    subject: string;
    html: string;
    text: string;
  }> {
    // TODO: Retrieve template from Dynamo table
    // For now, return a basic template structure
    return {
      subject: `${templateType} notification - ${data.name || data.contactName || 'New submission'}`,
      html: `<p>New ${templateType} submission received.</p><pre>${JSON.stringify(data, null, 2)}</pre>`,
      text: `New ${templateType} submission received: ${JSON.stringify(data, null, 2)}`
    };
  }

  /**
   * Get SMS template from Dynamo table
   */
  private async getSMSTemplate(templateType: string, data: any): Promise<string> {
    // TODO: Retrieve template from Dynamo table
    // For now, return a basic SMS message
    return `RealTechee: New ${templateType} submission from ${data.name || data.contactName || 'customer'}`;
  }

  /**
   * Enhanced queue-based notification system
   * Combines quickSend's recipient logic with proper queue-based architecture
   */
  public async queueNotification(
    templateType: 'contactUs' | 'getQualified' | 'affiliate' | 'getEstimate',
    data: any,
    options: {
      priority?: 'low' | 'medium' | 'high';
      channels?: NotificationChannel;
      customRecipients?: NotificationRecipient[];
      testMode?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    notificationId?: string;
    recipientsQueued: number;
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
    error?: string;
  }> {
    const {
      priority = 'medium',
      channels = 'both',
      customRecipients,
      testMode = false
    } = options;

    try {
      logger.info('=== QUEUE-BASED NOTIFICATION SYSTEM ===', {
        templateType,
        priority,
        channels,
        testMode,
        timestamp: new Date().toISOString()
      });

      // Mark test data if in test mode
      if (testMode) {
        data.testData = true;
        data.leadSource = 'E2E_TEST';
      }

      // Step 1: Use quickSend's recipient logic (validated, environment-aware)
      const recipients = customRecipients || await this.getDynamicRecipients(templateType);
      const recipientValidation = await this.validateAndFilterRecipients(recipients, data);
      const validRecipients = recipientValidation.validRecipients;

      logger.info('Queue notification recipient validation completed', {
        templateType,
        originalCount: recipients.length,
        validCount: validRecipients.length,
        environmentOverride: recipientValidation.environmentOverride,
        debugMode: recipientValidation.debugMode
      });

      // Step 2: Pre-render content using existing templates (client-side generation)
      const preRenderedContent = await this.generatePreRenderedContent(templateType, data, channels);

      // Step 3: Queue notification with pre-rendered content
      const notificationId = await this.queuePreRenderedNotification({
        eventType: `${templateType}_submission`,
        recipientIds: validRecipients.map(r => r.email), // Use email as ID for now
        channels: this.getChannelArray(channels),
        content: preRenderedContent,
        priority: priority.toUpperCase(),
        metadata: {
          formType: templateType,
          environment: this.getEnvironment(),
          testMode,
          submissionTimestamp: new Date().toISOString()
        }
      });

      logger.info('Notification queued successfully', {
        notificationId,
        templateType,
        recipientsQueued: validRecipients.length,
        channels,
        priority
      });

      return {
        success: true,
        notificationId,
        recipientsQueued: validRecipients.length,
        environment: this.getEnvironment(),
        debugMode: recipientValidation.debugMode || false
      };

    } catch (error) {
      logger.error('Failed to queue notification', {
        templateType,
        error: error instanceof Error ? error.message : error
      });

      return {
        success: false,
        recipientsQueued: 0,
        environment: this.getEnvironment(),
        debugMode: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate pre-rendered content for all requested channels
   */
  private async generatePreRenderedContent(
    templateType: 'contactUs' | 'getQualified' | 'affiliate' | 'getEstimate',
    data: any,
    channels: NotificationChannel
  ): Promise<any> {
    const content: any = {};

    if (channels === 'email' || channels === 'both') {
      const emailTemplate = await this.getEmailTemplate(templateType, data);
      content.email = {
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };
    }

    if (channels === 'sms' || channels === 'both') {
      const smsMessage = await this.getSMSTemplate(templateType, data);
      content.sms = {
        message: smsMessage
      };
    }

    return content;
  }

  /**
   * Queue notification with pre-rendered content
   */
  private async queuePreRenderedNotification(params: {
    eventType: string;
    recipientIds: string[];
    channels: string[];
    content: any;
    priority: string;
    metadata: any;
  }): Promise<string> {
    // Import the queue API dynamically to avoid circular dependencies
    const { notificationQueueAPI } = await import('../utils/amplifyAPI');

    try {
      logger.info('Queueing pre-rendered notification', {
        eventType: params.eventType,
        recipientCount: params.recipientIds.length,
        channels: params.channels,
        priority: params.priority
      });

      const result = await notificationQueueAPI.create({
        eventType: params.eventType,
        recipientIds: JSON.stringify(params.recipientIds),
        channels: JSON.stringify(params.channels),
        directContent: JSON.stringify(params.content), // Use directContent for pre-rendered
        status: 'PENDING',
        priority: params.priority,
        retryCount: 0,
        owner: 'system',
        // Metadata for debugging and tracking
        payload: JSON.stringify(params.metadata)
      });

      const notificationId = result.id;
      logger.info('✅ Notification queued successfully', {
        notificationId,
        eventType: params.eventType
      });

      return notificationId;

    } catch (error) {
      logger.error('❌ Failed to queue notification', {
        eventType: params.eventType,
        error: error instanceof Error ? error.message : error
      });
      throw new Error(`Failed to queue ${params.eventType} notification: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Convert channel string to array format
   */
  private getChannelArray(channels: NotificationChannel): string[] {
    switch (channels) {
      case 'email': return ['EMAIL'];
      case 'sms': return ['SMS'];
      case 'both': return ['EMAIL', 'SMS'];
      default: return ['EMAIL', 'SMS'];
    }
  }
  
  /**
   * Validate notification environment and log current configuration
   */
  public async validateEnvironment(): Promise<{
    environment: string;
    debugMode: boolean;
    recipientValidation: boolean;
    cognitoAccess: boolean;
  }> {
    const environment = this.getEnvironment();
    const debugMode = process.env.DEBUG_NOTIFICATIONS === 'true';
    
    let cognitoAccess = false;
    try {
      const testUsers = await AdminService.listUsers(1);
      cognitoAccess = true;
    } catch (error) {
      logger.warn('Cognito access test failed', { error });
    }
    
    const validation = {
      environment,
      debugMode,
      recipientValidation: true,
      cognitoAccess
    };
    
    logger.info('Notification service environment validation', validation);
    return validation;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Example usage functions
export const sendContactNotification = (data: ContactFormData, priority: 'low' | 'medium' | 'high' = 'medium') => {
  return notificationService.quickSend('contactUs', data, { priority });
};

export const sendQualificationNotification = (data: GetQualifiedFormData) => {
  return notificationService.quickSend('getQualified', data, { priority: 'medium' });
};

export const sendAffiliateNotification = (data: AffiliateFormData) => {
  return notificationService.quickSend('affiliate', data, { priority: 'low' });
};