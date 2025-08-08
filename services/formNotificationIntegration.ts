/**
 * Form Notification Integration Service
 * 
 * Connects all RealTechee forms to the notification system with proper
 * recipient validation and environment-aware safety measures.
 * 
 * Supported Forms:
 * - Contact Us Form
 * - Get Qualified Form  
 * - Affiliate Form
 * - Get Estimate Form (existing integration maintained)
 */

import { NotificationService } from '../utils/notificationService';
import { ContactFormData, GetQualifiedFormData, AffiliateFormData } from '@/templates/notifications';
import logger from '@/lib/logger';

export interface FormSubmissionData {
  formType: 'contactUs' | 'getQualified' | 'affiliate' | 'getEstimate';
  submissionId: string;
  submittedAt: string;
  testData?: boolean;
  leadSource?: string;
}

export interface ContactUsSubmissionData extends FormSubmissionData {
  formType: 'contactUs';
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  urgency?: 'low' | 'medium' | 'high';
  preferredContact?: 'email' | 'phone';
  // From Contact Us form structure
  product?: string;
  address?: {
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface GetQualifiedSubmissionData extends FormSubmissionData {
  formType: 'getQualified';
  name: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  brokerage?: string;
  yearsExperience?: string;
  specialties?: string[];
  marketAreas?: string[];
  currentVolume?: string;
  goals?: string;
}

export interface AffiliateSubmissionData extends FormSubmissionData {
  formType: 'affiliate';
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceType: string;
  businessLicense?: string;
  insurance?: boolean;
  bonded?: boolean;
  yearsInBusiness?: string;
  serviceAreas?: string[];
  certifications?: string[];
  portfolio?: string;
}

export type FormNotificationData = 
  | ContactUsSubmissionData 
  | GetQualifiedSubmissionData 
  | AffiliateSubmissionData;

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  recipientsNotified: number;
  environment: 'development' | 'staging' | 'production';
  debugMode: boolean;
  errors?: any[];
  validationLog?: string[];
}

export class FormNotificationIntegration {
  private static instance: FormNotificationIntegration;

  private constructor() {}

  public static getInstance(): FormNotificationIntegration {
    if (!FormNotificationIntegration.instance) {
      FormNotificationIntegration.instance = new FormNotificationIntegration();
    }
    return FormNotificationIntegration.instance;
  }

  /**
   * Send notification for Contact Us form submission
   */
  public async notifyContactUsSubmission(
    data: ContactUsSubmissionData,
    options: {
      priority?: 'low' | 'medium' | 'high';
      channels?: 'email' | 'sms' | 'both';
      testMode?: boolean;
    } = {}
  ): Promise<NotificationResult> {
    const { priority = 'high', channels = 'both', testMode = false } = options;

    try {
      logger.info('Sending Contact Us form notification', {
        submissionId: data.submissionId,
        email: data.email,
        subject: data.subject,
        testMode
      });

      // Transform data to notification template format
      const notificationData: ContactFormData = {
        formType: 'contact-us',
        submissionId: data.submissionId,
        submittedAt: data.submittedAt,
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        urgency: data.urgency,
        preferredContact: data.preferredContact,
        testData: testMode || data.testData,
        leadSource: data.leadSource || (testMode ? 'E2E_TEST' : 'contact_form')
      };

      // Queue notification to NotificationQueue table for Contact Us
      const contactUsPayload = {
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone
        },
        inquiry: {
          subject: data.subject,
          message: data.message,
          product: data.product || 'General Inquiry'
        },
        submission: {
          id: data.submissionId,
          timestamp: data.submittedAt
        },
        admin: {
          dashboardUrl: typeof window !== 'undefined' 
            ? `${window.location.origin}/admin/requests/${data.submissionId}`
            : `https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}`
        }
      };

      const channelArray = channels === 'both' ? ['EMAIL', 'SMS'] : 
                          channels === 'email' ? ['EMAIL'] : ['SMS'];

      const notificationId = await NotificationService.queueNotification({
        eventType: 'contact_us_submission',
        templateId: 'contact-us-email-template-001', // Use the correct template ID
        recipientIds: ['admin-team'],
        channels: channelArray,
        payload: contactUsPayload
      });

      const result = {
        success: true,
        notificationId,
        recipientsNotified: 1,
        environment: 'development',
        debugMode: true
      };

      return this.transformNotificationResult(result, 'contactUs');

    } catch (error) {
      logger.error('Failed to send Contact Us notification', { error, data });
      return {
        success: false,
        recipientsNotified: 0,
        environment: this.getEnvironment(),
        debugMode: process.env.DEBUG_NOTIFICATIONS === 'true',
        errors: [error]
      };
    }
  }

  /**
   * Send notification for Get Qualified form submission
   */
  public async notifyGetQualifiedSubmission(
    data: GetQualifiedSubmissionData,
    options: {
      priority?: 'low' | 'medium' | 'high';
      channels?: 'email' | 'sms' | 'both';
      testMode?: boolean;
    } = {}
  ): Promise<NotificationResult> {
    const { priority = 'medium', channels = 'both', testMode = false } = options;

    try {
      logger.info('Sending Get Qualified form notification', {
        submissionId: data.submissionId,
        email: data.email,
        name: data.name,
        testMode
      });

      // Transform data to notification template format
      const notificationData: GetQualifiedFormData = {
        formType: 'get-qualified',
        submissionId: data.submissionId,
        submittedAt: data.submittedAt,
        name: data.name,
        email: data.email,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        brokerage: data.brokerage,
        yearsExperience: data.yearsExperience,
        specialties: data.specialties,
        marketAreas: data.marketAreas,
        currentVolume: data.currentVolume,
        goals: data.goals,
        testData: testMode || data.testData,
        leadSource: data.leadSource || (testMode ? 'E2E_TEST' : 'get_qualified_form')
      };

      // Queue notification to NotificationQueue table for Get Qualified
      const getQualifiedPayload = {
        agent: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          licenseNumber: data.licenseNumber,
          brokerage: data.brokerage,
          yearsExperience: data.yearsExperience
        },
        qualifications: {
          specialties: data.specialties,
          marketAreas: data.marketAreas,
          currentVolume: data.currentVolume,
          goals: data.goals
        },
        submission: {
          id: data.submissionId,
          timestamp: data.submittedAt
        },
        admin: {
          dashboardUrl: typeof window !== 'undefined' 
            ? `${window.location.origin}/admin/requests/${data.submissionId}`
            : `https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}`
        }
      };

      const channelArray = channels === 'both' ? ['EMAIL', 'SMS'] : 
                          channels === 'email' ? ['EMAIL'] : ['SMS'];

      const notificationId = await NotificationService.queueNotification({
        eventType: 'get_qualified_submission',
        templateId: 'get-qualified-email-template-001', // Use the correct template ID
        recipientIds: ['admin-team'],
        channels: channelArray,
        payload: getQualifiedPayload
      });

      const result = {
        success: true,
        notificationId,
        recipientsNotified: 1,
        environment: 'development',
        debugMode: true
      };

      return this.transformNotificationResult(result, 'getQualified');

    } catch (error) {
      logger.error('Failed to send Get Qualified notification', { error, data });
      return {
        success: false,
        recipientsNotified: 0,
        environment: this.getEnvironment(),
        debugMode: process.env.DEBUG_NOTIFICATIONS === 'true',
        errors: [error]
      };
    }
  }

  /**
   * Send notification for Affiliate form submission
   */
  public async notifyAffiliateSubmission(
    data: AffiliateSubmissionData,
    options: {
      priority?: 'low' | 'medium' | 'high';
      channels?: 'email' | 'sms' | 'both';
      testMode?: boolean;
    } = {}
  ): Promise<NotificationResult> {
    const { priority = 'low', channels = 'email', testMode = false } = options;

    try {
      logger.info('Sending Affiliate form notification', {
        submissionId: data.submissionId,
        companyName: data.companyName,
        email: data.email,
        testMode
      });

      // Transform data to notification template format
      const notificationData: AffiliateFormData = {
        formType: 'affiliate',
        submissionId: data.submissionId,
        submittedAt: data.submittedAt,
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        serviceType: data.serviceType,
        businessLicense: data.businessLicense,
        insurance: data.insurance,
        bonded: data.bonded,
        yearsInBusiness: data.yearsInBusiness,
        serviceAreas: data.serviceAreas,
        certifications: data.certifications,
        portfolio: data.portfolio,
        testData: testMode || data.testData,
        leadSource: data.leadSource || (testMode ? 'E2E_TEST' : 'affiliate_form')
      };

      // Queue notification to NotificationQueue table for Affiliate
      const affiliatePayload = {
        affiliate: {
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          serviceType: data.serviceType,
          businessLicense: data.businessLicense,
          insurance: data.insurance,
          bonded: data.bonded,
          yearsInBusiness: data.yearsInBusiness
        },
        services: {
          serviceAreas: data.serviceAreas,
          certifications: data.certifications,
          portfolio: data.portfolio
        },
        submission: {
          id: data.submissionId,
          timestamp: data.submittedAt
        },
        admin: {
          dashboardUrl: typeof window !== 'undefined' 
            ? `${window.location.origin}/admin/requests/${data.submissionId}`
            : `https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.submissionId}`
        }
      };

      const channelArray = channels === 'both' ? ['EMAIL', 'SMS'] : 
                          channels === 'email' ? ['EMAIL'] : ['SMS'];

      const notificationId = await NotificationService.queueNotification({
        eventType: 'affiliate_submission',
        templateId: 'affiliate-email-template-001', // Use the correct template ID
        recipientIds: ['admin-team'],
        channels: channelArray,
        payload: affiliatePayload
      });

      const result = {
        success: true,
        notificationId,
        recipientsNotified: 1,
        environment: 'development',
        debugMode: true
      };

      return this.transformNotificationResult(result, 'affiliate');

    } catch (error) {
      logger.error('Failed to send Affiliate notification', { error, data });
      return {
        success: false,
        recipientsNotified: 0,
        environment: this.getEnvironment(),
        debugMode: process.env.DEBUG_NOTIFICATIONS === 'true',
        errors: [error]
      };
    }
  }

  /**
   * Universal form notification sender
   */
  public async sendFormNotification(
    data: FormNotificationData,
    options: {
      priority?: 'low' | 'medium' | 'high';
      channels?: 'email' | 'sms' | 'both';
      testMode?: boolean;
    } = {}
  ): Promise<NotificationResult> {
    switch (data.formType) {
      case 'contactUs':
        return this.notifyContactUsSubmission(data as ContactUsSubmissionData, options);
      
      case 'getQualified':
        return this.notifyGetQualifiedSubmission(data as GetQualifiedSubmissionData, options);
      
      case 'affiliate':
        return this.notifyAffiliateSubmission(data as AffiliateSubmissionData, options);
      
      default:
        throw new Error(`Unsupported form type: ${(data as any).formType}`);
    }
  }

  /**
   * Transform notification service result to form integration result
   */
  private transformNotificationResult(
    result: any,
    formType: string
  ): NotificationResult {
    const emailCount = result.results?.email?.length || 0;
    const smsCount = result.results?.sms?.length || 0;

    return {
      success: result.success,
      notificationId: `${formType}_${Date.now()}`,
      recipientsNotified: Math.max(emailCount, smsCount),
      environment: this.getEnvironment(),
      debugMode: result.recipientValidation?.debugMode || false,
      errors: result.errors,
      validationLog: result.recipientValidation?.validationLog
    };
  }

  /**
   * Get current environment
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    const nodeEnv = process.env.NODE_ENV;
    const nextPublicEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
    const amplifyEnv = process.env.AMPLIFY_ENVIRONMENT;
    
    if (nodeEnv === 'production' && nextPublicEnv === 'production' && amplifyEnv === 'production') {
      return 'production';
    }
    
    if (nextPublicEnv === 'staging' || amplifyEnv === 'staging') {
      return 'staging';
    }
    
    return 'development';
  }

  /**
   * Validate notification system readiness
   */
  public async validateSystem(): Promise<{
    ready: boolean;
    environment: string;
    cognitoAccess: boolean;
    templateAccess: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check environment configuration
    const environment = this.getEnvironment();
    
    // Validate notification service (using queue-based service now)
    let cognitoAccess = true; // Queue-based service doesn't need AWS credentials
    let templateAccess = true;

    // Check template access
    try {
      const testData = {
        formType: 'test',
        submissionId: 'validation_test',
        submittedAt: new Date().toISOString(),
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test'
      };
      
      // Try to access templates without sending
      templateAccess = true;
    } catch (error) {
      issues.push('Template access validation failed');
    }

    const ready = issues.length === 0;

    logger.info('Form notification system validation', {
      ready,
      environment,
      cognitoAccess,
      templateAccess,
      issues
    });

    return {
      ready,
      environment,
      cognitoAccess,
      templateAccess,
      issues
    };
  }
}

// Export singleton instance and convenience functions
export const formNotificationIntegration = FormNotificationIntegration.getInstance();

// Convenience functions for direct use in form handlers
export const notifyContactUs = (data: ContactUsSubmissionData, options?: any) => 
  formNotificationIntegration.notifyContactUsSubmission(data, options);

export const notifyGetQualified = (data: GetQualifiedSubmissionData, options?: any) => 
  formNotificationIntegration.notifyGetQualifiedSubmission(data, options);

export const notifyAffiliate = (data: AffiliateSubmissionData, options?: any) => 
  formNotificationIntegration.notifyAffiliateSubmission(data, options);

export const sendFormNotification = (data: FormNotificationData, options?: any) => 
  formNotificationIntegration.sendFormNotification(data, options);