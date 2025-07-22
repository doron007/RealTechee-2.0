import sgMail from '@sendgrid/mail';
import { SecureConfigClient } from '../utils/secureConfigClient';
import { EventLogger } from '../utils/eventLogger';

export interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  from?: string;
  notificationId?: string; // Add for event logging
}

export class EmailHandler {
  private initialized = false;
  private secureConfigClient: SecureConfigClient;

  constructor() {
    this.secureConfigClient = SecureConfigClient.getInstance();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const config = await this.secureConfigClient.getConfig();
      const apiKey = config.sendgrid.apiKey;
      
      if (!apiKey) {
        console.warn('⚠️ SendGrid API key not found in secure configuration. Email sending will fail.');
        return;
      }

      sgMail.setApiKey(apiKey);
      this.initialized = true;
      console.log('✅ SendGrid email handler initialized with secure configuration');
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid email handler:', error);
    }
  }

  async sendEmail(params: EmailParams): Promise<void> {
    const startTime = Date.now();
    const { to, subject, htmlContent, textContent, from, notificationId } = params;

    if (!this.initialized) {
      // Try to initialize again in case it failed before
      await this.initialize();
      if (!this.initialized) {
        throw new Error('SendGrid not initialized. Check secure configuration.');
      }
    }

    // Log email attempt
    if (notificationId) {
      await EventLogger.logEmailAttempt(notificationId, to);
    }
    
    // Get from email from secure config
    const config = await this.secureConfigClient.getConfig();
    const fromEmail = from || config.sendgrid.fromEmail;

    const msg = {
      to,
      from: fromEmail,
      subject,
      text: textContent,
      html: htmlContent,
      // Add tracking and branding
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false
        },
        openTracking: {
          enable: true
        },
        subscriptionTracking: {
          enable: false
        }
      },
      // Custom headers for identification
      customArgs: {
        source: 'realtechee-notifications',
        version: '1.0.0',
        notificationId: notificationId || 'unknown'
      }
    };

    try {
      console.log(`📧 Sending email to ${to}: ${subject}`);
      
      const [response] = await sgMail.send(msg);
      const processingTime = Date.now() - startTime;
      const messageId = response.headers['x-message-id'] || response.headers['X-Message-Id'] || 'unknown';
      
      console.log(`✅ Email sent successfully`, {
        to,
        statusCode: response.statusCode,
        messageId,
        processingTimeMs: processingTime
      });

      // Log email success
      if (notificationId) {
        await EventLogger.logEmailSuccess(
          notificationId,
          to,
          messageId,
          response.statusCode,
          processingTime
        );
      }

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      const errorCode = error.code || error.statusCode || 'UNKNOWN';
      const errorMessage = error.message || 'Unknown SendGrid error';

      console.error('❌ SendGrid error:', {
        error: errorMessage,
        code: errorCode,
        statusCode: error.statusCode,
        to,
        subject,
        processingTimeMs: processingTime
      });

      // Log detailed error for debugging
      if (error.response?.body) {
        console.error('SendGrid error details:', error.response.body);
      }

      // Log email failure
      if (notificationId) {
        await EventLogger.logEmailFailed(
          notificationId,
          to,
          errorCode,
          errorMessage,
          processingTime
        );
      }

      throw new Error(`Failed to send email to ${to}: ${errorMessage}`);
    }
  }

  async validateEmail(email: string): Promise<boolean> {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async testConnection(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
      if (!this.initialized) {
        return false;
      }
    }

    try {
      // SendGrid doesn't have a direct test endpoint, so we'll just verify the key format
      const config = await this.secureConfigClient.getConfig();
      const apiKey = config.sendgrid.apiKey;
      return apiKey?.startsWith('SG.') || false;
    } catch (error) {
      console.error('SendGrid connection test failed:', error);
      return false;
    }
  }
}