import { SESClient, SendEmailCommand, SendRawEmailCommand, GetSendQuotaCommand } from '@aws-sdk/client-ses';
import { SecureConfigClient } from '../utils/secureConfigClient';
import { EventLogger } from '../utils/eventLogger';
import { SuppressionListService } from '../services/suppressionListService';

export interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  from?: string;
  notificationId?: string;
}

export class SESEmailHandler {
  private sesClient: SESClient;
  private secureConfigClient: SecureConfigClient;
  private suppressionListService: SuppressionListService;

  constructor() {
    this.secureConfigClient = SecureConfigClient.getInstance();
    this.suppressionListService = new SuppressionListService();
    // Initialize SES client - it will use IAM role credentials automatically
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-west-1',
    });
    console.log('✅ AWS SES email handler initialized');
  }

  async sendEmail(params: EmailParams): Promise<void> {
    const startTime = Date.now();
    const { to, subject, htmlContent, textContent, from, notificationId } = params;

    // Check suppression list first
    const suppressionCheck = await this.suppressionListService.isEmailSuppressed(to);
    if (suppressionCheck.suppressed) {
      const errorMessage = `Email suppressed: ${suppressionCheck.reason} (${suppressionCheck.suppressionType})`;
      console.warn(`🚫 Skipping email to ${to}: ${errorMessage}`);
      
      // Log suppression event
      if (notificationId) {
        await EventLogger.logEmailFailed(
          notificationId,
          to,
          'EMAIL_SUPPRESSED',
          errorMessage,
          Date.now() - startTime
        );
      }
      
      throw new Error(errorMessage);
    }

    // Log email attempt
    if (notificationId) {
      await EventLogger.logEmailAttempt(notificationId, to);
    }
    
    // Get from email from secure config
    const config = await this.secureConfigClient.getConfig();
    const fromEmail = from || config.ses.fromEmail;

    // Use AWS SES SendEmailCommand - optimized by AWS for Gmail compatibility
    // This is simpler and more reliable than manual MIME construction
    const sendEmailCommand = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: textContent,
            Charset: 'UTF-8',
          },
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
        },
      },
      Tags: [
        {
          Name: 'source',
          Value: 'realtechee-notifications',
        },
        {
          Name: 'version',
          Value: '1.0.0',
        },
        {
          Name: 'notificationId',
          Value: notificationId || 'unknown',
        },
      ],
    });

    try {
      console.log(`📧 Sending email via AWS SES (SendEmailCommand) to ${to}: ${subject}`);
      
      const response = await this.sesClient.send(sendEmailCommand);
      const processingTime = Date.now() - startTime;
      const messageId = response.MessageId || 'unknown';
      
      console.log(`✅ Email sent successfully via SES`, {
        to,
        messageId,
        processingTimeMs: processingTime,
        method: 'SendEmailCommand'
      });

      // Log email success
      if (notificationId) {
        await EventLogger.logEmailSuccess(
          notificationId,
          to,
          messageId,
          200, // SES doesn't return HTTP status codes, but success is implied
          processingTime
        );
      }

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      const errorCode = error.name || error.code || 'UNKNOWN';
      const errorMessage = error.message || 'Unknown SES error';

      console.error('❌ AWS SES error:', {
        error: errorMessage,
        code: errorCode,
        to,
        subject,
        processingTimeMs: processingTime
      });

      // Log detailed error for debugging
      if (error.$metadata) {
        console.error('SES error details:', error.$metadata);
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
    try {
      // Test SES connection by checking send quota
      const command = new GetSendQuotaCommand({});
      const response = await this.sesClient.send(command);
      
      console.log('SES connection test successful:', {
        max24HourSend: response.Max24HourSend,
        maxSendRate: response.MaxSendRate,
        sentLast24Hours: response.SentLast24Hours
      });
      
      return true;
    } catch (error) {
      console.error('SES connection test failed:', error);
      return false;
    }
  }

  async getSendQuota() {
    try {
      const command = new GetSendQuotaCommand({});
      return await this.sesClient.send(command);
    } catch (error) {
      console.error('Failed to get SES send quota:', error);
      return null;
    }
  }
}