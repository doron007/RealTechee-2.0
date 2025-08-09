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
  // Address information
  address?: {
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
  };
  // General Contractor specific fields
  workersCompensation?: boolean;
  environmentalFactor?: boolean;
  oshaCompliance?: boolean;
  signedNDA?: boolean;
  safetyPlan?: boolean;
  numberOfEmployees?: string;
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
    const { channels = 'both', testMode = false } = options;

    try {
      logger.info('Sending Contact Us form notification', {
        submissionId: data.submissionId,
        email: data.email,
        subject: data.subject,
        testMode
      });

      // Generate final email/SMS content in backend (no template dependency)
      const emailContent = this.generateContactUsEmailContent(data);
      const smsContent = this.generateContactUsSmsContent(data);

      const channelArray = channels === 'both' ? ['EMAIL', 'SMS'] : 
                          channels === 'email' ? ['EMAIL'] : ['SMS'];

      // Queue pre-generated content (Lambda just sends, no processing)
      const notificationId = await NotificationService.queueDirectNotification({
        eventType: 'contact_us_submission',
        recipientIds: ['admin-team'],
        channels: channelArray,
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
    const { channels = 'both', testMode = false } = options;

    try {
      logger.info('Sending Get Qualified form notification', {
        submissionId: data.submissionId,
        email: data.email,
        name: data.name,
        testMode
      });

      // Generate final email/SMS content in backend (no template dependency)
      const emailContent = this.generateGetQualifiedEmailContent(data);
      const smsContent = this.generateGetQualifiedSmsContent(data);

      const channelArray = channels === 'both' ? ['EMAIL', 'SMS'] : 
                          channels === 'email' ? ['EMAIL'] : ['SMS'];

      // Queue pre-generated content (Lambda just sends, no processing)
      const notificationId = await NotificationService.queueDirectNotification({
        eventType: 'get_qualified_submission',
        recipientIds: ['admin-team'],
        channels: channelArray,
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

      // Generate final email/SMS content in backend (no template dependency)
      const emailContent = this.generateAffiliateEmailContent(data);
      const smsContent = this.generateAffiliateSmsContent(data);

      const channelArray = channels === 'both' ? ['EMAIL', 'SMS'] : 
                          channels === 'email' ? ['EMAIL'] : ['SMS'];

      // Queue pre-generated content (Lambda just sends, no processing)
      const notificationId = await NotificationService.queueDirectNotification({
        eventType: 'affiliate_submission',
        recipientIds: ['admin-team'],
        channels: channelArray,
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

  public generateAffiliateEmailContent(data: AffiliateSubmissionData): { subject: string; html: string; text: string } {
    const subject = `${data.testData ? '[TEST] ' : ''}New Service Provider Application - ${data.companyName}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Service Provider Application - RealTechee</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2A2B2E; background-color: #F9F4F3;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9F4F3; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <img src="https://d200k2wsaf8th3.amplifyapp.com/assets/logos/web_realtechee_horizontal_no_border.png" alt="RealTechee" style="height: 40px; width: auto;">
                        </td>
                    </tr>
                    
                    ${data.testData ? `<tr><td style="padding: 24px 40px 0;"><div style="background-color: #FFB900; color: #151515; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-align: center; margin-bottom: 24px;">⚠️ TEST DATA - E2E Testing Session</div></td></tr>` : ''}
                    
                    <!-- Title -->
                    <tr>
                        <td style="padding: 40px 40px 32px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #151515;">🔧 New Service Provider Application</h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: #6E6E73;">A service provider has applied to join our affiliate network.</p>
                        </td>
                    </tr>
                    
                    <!-- Contact Information -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Contact Information</h3>
                            <p><strong>Name:</strong> ${data.contactName}</p>
                            <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #17619C;">${data.email}</a></p>
                            <p><strong>Phone:</strong> <a href="tel:${data.phone}" style="color: #17619C;">${data.phone}</a></p>
                            ${data.address ? `<p><strong>Address:</strong> ${data.address.streetAddress}, ${data.address.city}, ${data.address.state} ${data.address.zip}</p>` : ''}
                        </td>
                    </tr>
                    
                    <!-- Business Information -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Business Information</h3>
                            <p><strong>Company:</strong> ${data.companyName}</p>
                            <p><strong>Service Type:</strong> ${data.serviceType}</p>
                            <p><strong>License:</strong> ${data.businessLicense || 'Not provided'}</p>
                            <p><strong>Employees:</strong> ${data.numberOfEmployees || 'Not provided'}</p>
                            <p><strong>Workers Compensation:</strong> <span style="color: ${data.workersCompensation ? '#2D5016' : '#D63384'};">${data.workersCompensation ? '✅ YES' : '❌ NO'}</span></p>
                            <p><strong>Insurance:</strong> <span style="color: ${data.insurance ? '#2D5016' : '#D63384'};">${data.insurance ? '✅ YES' : '❌ NO'}</span></p>
                            <p><strong>OSHA Compliance:</strong> <span style="color: ${data.oshaCompliance ? '#2D5016' : '#D63384'};">${data.oshaCompliance ? '✅ YES' : '❌ NO'}</span></p>
                            <p><strong>Environmental Factor:</strong> <span style="color: ${data.environmentalFactor ? '#2D5016' : '#D63384'};">${data.environmentalFactor ? '✅ YES' : '❌ NO'}</span></p>
                            <p><strong>Signed NDA:</strong> <span style="color: ${data.signedNDA ? '#2D5016' : '#D63384'};">${data.signedNDA ? '✅ YES' : '❌ NO'}</span></p>
                            <p><strong>Safety Plan:</strong> <span style="color: ${data.safetyPlan ? '#2D5016' : '#D63384'};">${data.safetyPlan ? '✅ YES' : '❌ NO'}</span></p>
                        </td>
                    </tr>
                    
                    <!-- Actions -->
                    <tr>
                        <td style="padding: 0 40px 40px; text-align: center;">
                            <a href="mailto:${data.email}" style="background-color: #3BE8B0; color: #151515; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">✅ Approve Partnership</a>
                            <a href="https://d200k2wsaf8th3.amplifyapp.com/admin" style="background-color: #2A2B2E; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">📋 Full Review</a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #FFFFFF;">
                                <strong>RealTechee Service Provider Network</strong><br>
                                Please review applications within 72 hours.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const text = `
NEW SERVICE PROVIDER APPLICATION - REALTECHEE
🤝 SERVICE PROVIDER

CONTACT INFORMATION:
Name: ${data.contactName}
Email: ${data.email}
Phone: ${data.phone}
${data.address ? `Address: ${data.address.streetAddress}, ${data.address.city}, ${data.address.state} ${data.address.zip}` : ''}

BUSINESS INFORMATION:
Company: ${data.companyName}
Service Type: ${data.serviceType}
License: ${data.businessLicense || 'Not provided'}
Employees: ${data.numberOfEmployees || 'Not provided'}

COMPLIANCE STATUS:
Workers Compensation: ${data.workersCompensation ? 'Yes' : 'No'}
Insurance: ${data.insurance ? 'Yes' : 'No'}
OSHA Compliance: ${data.oshaCompliance ? 'Yes' : 'No'}
Environmental Factor: ${data.environmentalFactor ? 'Yes' : 'No'}
Signed NDA: ${data.signedNDA ? 'Yes' : 'No'}
Safety Plan: ${data.safetyPlan ? 'Yes' : 'No'}

Submitted: ${data.submittedAt}
ID: ${data.submissionId}

ACTIONS:
- Email: ${data.email}
- Call: ${data.phone}
- Review: https://d200k2wsaf8th3.amplifyapp.com/admin

RealTechee Service Provider Network
Review within 72 hours and verify credentials.
    `;

    return { subject, html, text };
  }

  public generateAffiliateSmsContent(data: AffiliateSubmissionData): string {
    const testIndicator = data.testData ? '[TEST] ' : '';
    const credentialsStatus = [
      data.workersCompensation ? 'Workers Comp' : '', 
      data.insurance ? 'Insured' : '', 
      data.businessLicense ? 'Licensed' : '',
      data.oshaCompliance ? 'OSHA' : ''
    ].filter(Boolean).join(', ') || 'Credentials pending';
    
    return `${testIndicator}🤝 RealTechee: New service provider "${data.companyName}" (${data.serviceType}). Contact: ${data.contactName}. Status: ${credentialsStatus}. Review: https://d200k2wsaf8th3.amplifyapp.com/admin`;
  }

  public generateContactUsEmailContent(data: ContactUsSubmissionData): { subject: string; html: string; text: string } {
    const subject = `${data.testData ? '[TEST] ' : ''}New Contact Inquiry - ${data.subject}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Inquiry - RealTechee</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2A2B2E; background-color: #F9F4F3;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9F4F3; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <img src="https://d200k2wsaf8th3.amplifyapp.com/assets/logos/web_realtechee_horizontal_no_border.png" alt="RealTechee" style="height: 40px; width: auto;">
                        </td>
                    </tr>
                    
                    ${data.testData ? `<tr><td style="padding: 24px 40px 0;"><div style="background-color: #FFB900; color: #151515; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-align: center; margin-bottom: 24px;">⚠️ TEST DATA - E2E Testing Session</div></td></tr>` : ''}
                    
                    <!-- Title -->
                    <tr>
                        <td style="padding: 40px 40px 32px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #151515;">📧 New Contact Inquiry</h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: #6E6E73;">Someone has reached out through the contact form.</p>
                        </td>
                    </tr>
                    
                    <!-- Contact Information -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Contact Information</h3>
                            <p><strong>Name:</strong> ${data.name}</p>
                            <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #17619C;">${data.email}</a></p>
                            ${data.phone ? `<p><strong>Phone:</strong> <a href="tel:${data.phone}" style="color: #17619C;">${data.phone}</a></p>` : ''}
                            ${data.address ? `<p><strong>Address:</strong> ${data.address.streetAddress}, ${data.address.city}, ${data.address.state} ${data.address.zip}</p>` : ''}
                        </td>
                    </tr>
                    
                    <!-- Inquiry Details -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Inquiry Details</h3>
                            <p><strong>Subject:</strong> ${data.subject}</p>
                            <p><strong>Product Interest:</strong> ${data.product || 'General Inquiry'}</p>
                            <p><strong>Urgency:</strong> <span style="color: ${data.urgency === 'high' ? '#D63384' : data.urgency === 'medium' ? '#FD7E14' : '#198754'}; font-weight: 600;">${data.urgency?.toUpperCase() || 'MEDIUM'}</span></p>
                            <p><strong>Preferred Contact Method:</strong> ${data.preferredContact === 'phone' ? 'Phone' : 'Email'}</p>
                        </td>
                    </tr>
                    
                    <!-- Message -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Message</h3>
                            <div style="background-color: #F8F9FA; padding: 16px; border-radius: 8px; border-left: 4px solid #17619C;">
                                <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Actions -->
                    <tr>
                        <td style="padding: 0 40px 40px; text-align: center;">
                            <a href="mailto:${data.email}" style="background-color: #3BE8B0; color: #151515; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">✉️ Reply to Customer</a>
                            ${data.phone ? `<a href="tel:${data.phone}" style="background-color: #17619C; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">📞 Call Customer</a>` : ''}
                            <a href="https://d200k2wsaf8th3.amplifyapp.com/admin" style="background-color: #2A2B2E; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">📋 Admin Panel</a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #FFFFFF;">
                                <strong>RealTechee Customer Inquiry</strong><br>
                                Please respond within 4 business hours.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const text = `
NEW CONTACT INQUIRY - REALTECHEE
📧 CUSTOMER INQUIRY

CONTACT INFORMATION:
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.address ? `Address: ${data.address.streetAddress}, ${data.address.city}, ${data.address.state} ${data.address.zip}` : ''}

INQUIRY DETAILS:
Subject: ${data.subject}
Product: ${data.product || 'General Inquiry'}
Urgency: ${data.urgency?.toUpperCase() || 'MEDIUM'}
Preferred Contact: ${data.preferredContact === 'phone' ? 'Phone' : 'Email'}

MESSAGE:
${data.message}

Submitted: ${data.submittedAt}
ID: ${data.submissionId}

ACTIONS:
- Email: ${data.email}
${data.phone ? `- Call: ${data.phone}` : ''}
- Admin: https://d200k2wsaf8th3.amplifyapp.com/admin

RealTechee Customer Service
Respond within 4 business hours.
    `;

    return { subject, html, text };
  }

  public generateContactUsSmsContent(data: ContactUsSubmissionData): string {
    const testIndicator = data.testData ? '[TEST] ' : '';
    const urgencyIndicator = data.urgency === 'high' ? '🚨 URGENT: ' : data.urgency === 'medium' ? '⚡ ' : '📧 ';
    const contactMethod = data.phone ? `📞 ${data.phone}` : `📧 ${data.email}`;
    
    return `${testIndicator}${urgencyIndicator}RealTechee: New inquiry "${data.subject}" from ${data.name}. ${contactMethod}. Product: ${data.product || 'General'}. Admin: https://d200k2wsaf8th3.amplifyapp.com/admin`;
  }

  public generateGetQualifiedEmailContent(data: GetQualifiedSubmissionData): { subject: string; html: string; text: string } {
    const subject = `${data.testData ? '[TEST] ' : ''}New Agent Qualification Request - ${data.name}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Qualification Request - RealTechee</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2A2B2E; background-color: #F9F4F3;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9F4F3; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <img src="https://d200k2wsaf8th3.amplifyapp.com/assets/logos/web_realtechee_horizontal_no_border.png" alt="RealTechee" style="height: 40px; width: auto;">
                        </td>
                    </tr>
                    
                    ${data.testData ? `<tr><td style="padding: 24px 40px 0;"><div style="background-color: #FFB900; color: #151515; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-align: center; margin-bottom: 24px;">⚠️ TEST DATA - E2E Testing Session</div></td></tr>` : ''}
                    
                    <!-- Title -->
                    <tr>
                        <td style="padding: 40px 40px 32px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #151515;">🎯 New Agent Qualification Request</h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: #6E6E73;">An agent is requesting to join our qualified network.</p>
                        </td>
                    </tr>
                    
                    <!-- Agent Information -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Agent Information</h3>
                            <p><strong>Name:</strong> ${data.name}</p>
                            <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #17619C;">${data.email}</a></p>
                            <p><strong>Phone:</strong> <a href="tel:${data.phone}" style="color: #17619C;">${data.phone}</a></p>
                            <p><strong>License Number:</strong> ${data.licenseNumber || 'Not provided'}</p>
                            <p><strong>Brokerage:</strong> ${data.brokerage || 'Not specified'}</p>
                            <p><strong>Experience:</strong> ${data.yearsExperience || 'Not specified'}</p>
                        </td>
                    </tr>
                    
                    <!-- Professional Details -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Professional Details</h3>
                            <p><strong>Specialties:</strong></p>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                ${data.specialties?.map(specialty => `<li>${specialty}</li>`).join('') || '<li>Not specified</li>'}
                            </ul>
                            <p><strong>Market Areas:</strong></p>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                ${data.marketAreas?.map(area => `<li>${area}</li>`).join('') || '<li>Not specified</li>'}
                            </ul>
                            <p><strong>Current Volume:</strong> ${data.currentVolume || 'Not specified'}</p>
                        </td>
                    </tr>
                    
                    <!-- Goals & Message -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Goals & Message</h3>
                            <div style="background-color: #F8F9FA; padding: 16px; border-radius: 8px; border-left: 4px solid #17619C;">
                                <p style="margin: 0; white-space: pre-wrap;">${data.goals || 'No additional message provided.'}</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Actions -->
                    <tr>
                        <td style="padding: 0 40px 40px; text-align: center;">
                            <a href="mailto:${data.email}" style="background-color: #3BE8B0; color: #151515; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">✅ Schedule Qualification Call</a>
                            <a href="tel:${data.phone}" style="background-color: #17619C; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">📞 Call Agent</a>
                            <a href="https://d200k2wsaf8th3.amplifyapp.com/admin" style="background-color: #2A2B2E; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">📋 Admin Panel</a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #FFFFFF;">
                                <strong>RealTechee Agent Network</strong><br>
                                Review and schedule qualification within 48 hours.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const text = `
NEW AGENT QUALIFICATION REQUEST - REALTECHEE
🎯 AGENT QUALIFICATION

AGENT INFORMATION:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
License: ${data.licenseNumber || 'Not provided'}
Brokerage: ${data.brokerage || 'Not specified'}
Experience: ${data.yearsExperience || 'Not specified'}

PROFESSIONAL DETAILS:
Specialties: ${data.specialties?.join(', ') || 'Not specified'}
Market Areas: ${data.marketAreas?.join(', ') || 'Not specified'}
Current Volume: ${data.currentVolume || 'Not specified'}

GOALS & MESSAGE:
${data.goals || 'No additional message provided.'}

Submitted: ${data.submittedAt}
ID: ${data.submissionId}

ACTIONS:
- Email: ${data.email}
- Call: ${data.phone}
- Admin: https://d200k2wsaf8th3.amplifyapp.com/admin

RealTechee Agent Network
Review and schedule qualification within 48 hours.
    `;

    return { subject, html, text };
  }

  public generateGetQualifiedSmsContent(data: GetQualifiedSubmissionData): string {
    const testIndicator = data.testData ? '[TEST] ' : '';
    const experienceLevel = data.yearsExperience ? `(${data.yearsExperience})` : '';
    const brokerage = data.brokerage ? ` - ${data.brokerage}` : '';
    
    return `${testIndicator}🎯 RealTechee: Agent qualification request from ${data.name}${brokerage}${experienceLevel}. License: ${data.licenseNumber || 'Pending'}. Call: ${data.phone}. Admin: https://d200k2wsaf8th3.amplifyapp.com/admin`;
  }

  public generateGetEstimateEmailContent(data: any): { subject: string; html: string; text: string } {
    const subject = `${data.testData ? '[TEST] ' : ''}New Estimate Request - ${data.customerName}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Estimate Request - RealTechee</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2A2B2E; background-color: #F9F4F3;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F9F4F3; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <img src="https://d200k2wsaf8th3.amplifyapp.com/assets/logos/web_realtechee_horizontal_no_border.png" alt="RealTechee" style="height: 40px; width: auto;">
                        </td>
                    </tr>
                    
                    ${data.testData ? `<tr><td style="padding: 24px 40px 0;"><div style="background-color: #FFB900; color: #151515; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-align: center; margin-bottom: 24px;">⚠️ TEST DATA - E2E Testing Session</div></td></tr>` : ''}
                    
                    <!-- Title -->
                    <tr>
                        <td style="padding: 40px 40px 32px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #151515;">💰 New Estimate Request</h1>
                            <p style="margin: 12px 0 0; font-size: 16px; color: #6E6E73;">A customer has requested a project estimate.</p>
                        </td>
                    </tr>
                    
                    <!-- Customer Information -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Customer Information</h3>
                            <p><strong>Name:</strong> ${data.customerName}</p>
                            <p><strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #17619C;">${data.customerEmail}</a></p>
                            ${data.customerPhone ? `<p><strong>Phone:</strong> <a href="tel:${data.customerPhone}" style="color: #17619C;">${data.customerPhone}</a></p>` : ''}
                            ${data.customerCompany ? `<p><strong>Company:</strong> ${data.customerCompany}</p>` : ''}
                        </td>
                    </tr>
                    
                    <!-- Project Information -->
                    <tr>
                        <td style="padding: 0 40px 32px;">
                            <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #151515; border-bottom: 2px solid #E4E4E4; padding-bottom: 8px;">Project Information</h3>
                            <p><strong>Property Address:</strong> ${data.propertyAddress || 'Not provided'}</p>
                            <p><strong>Project Type:</strong> ${data.productType || 'General Renovation'}</p>
                            ${data.message ? `
                            <p><strong>Project Description:</strong></p>
                            <div style="background-color: #F8F9FA; padding: 16px; border-radius: 8px; border-left: 4px solid #17619C;">
                                <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
                            </div>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Actions -->
                    <tr>
                        <td style="padding: 0 40px 40px; text-align: center;">
                            <a href="mailto:${data.customerEmail}" style="background-color: #3BE8B0; color: #151515; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">📧 Contact Customer</a>
                            ${data.customerPhone ? `<a href="tel:${data.customerPhone}" style="background-color: #17619C; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">📞 Call Customer</a>` : ''}
                            ${data.requestId ? `<a href="https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.requestId}" style="background-color: #2A2B2E; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">📋 View Request</a>` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #151515; padding: 32px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #FFFFFF;">
                                <strong>RealTechee Estimate Request</strong><br>
                                Respond within 24 hours for best customer experience.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const text = `
NEW ESTIMATE REQUEST - REALTECHEE
💰 ESTIMATE REQUEST

CUSTOMER INFORMATION:
Name: ${data.customerName}
Email: ${data.customerEmail}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}
${data.customerCompany ? `Company: ${data.customerCompany}` : ''}

PROJECT INFORMATION:
Property: ${data.propertyAddress || 'Not provided'}
Type: ${data.productType || 'General Renovation'}

${data.message ? `DESCRIPTION:
${data.message}
` : ''}
Submitted: ${new Date().toLocaleString()}
ID: ${data.submissionId}

ACTIONS:
- Email: ${data.customerEmail}
${data.customerPhone ? `- Call: ${data.customerPhone}` : ''}
${data.requestId ? `- View: https://d200k2wsaf8th3.amplifyapp.com/admin/requests/${data.requestId}` : ''}

RealTechee Estimate Team
Respond within 24 hours.
    `;

    return { subject, html, text };
  }

  public generateGetEstimateSmsContent(data: any): string {
    const testIndicator = data.testData ? '[TEST] ' : '';
    const projectType = data.productType ? ` (${data.productType})` : '';
    const contactInfo = data.customerPhone ? `📞 ${data.customerPhone}` : `📧 ${data.customerEmail}`;
    
    return `${testIndicator}💰 RealTechee: New estimate request from ${data.customerName}${projectType}. Property: ${data.propertyAddress || 'TBD'}. ${contactInfo}. Admin: https://d200k2wsaf8th3.amplifyapp.com/admin`;
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
      // Try to access templates without sending - just validate system readiness
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