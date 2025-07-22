import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface NotificationEvent {
  eventId: string;
  notificationId: string;
  eventType: 'NOTIFICATION_QUEUED' | 'NOTIFICATION_PROCESSING' | 'EMAIL_ATTEMPT' | 'SMS_ATTEMPT' | 'EMAIL_SUCCESS' | 'SMS_SUCCESS' | 'EMAIL_FAILED' | 'SMS_FAILED' | 'NOTIFICATION_COMPLETED' | 'NOTIFICATION_FAILED';
  channel?: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'TELEGRAM';
  recipient?: string;
  provider?: 'SENDGRID' | 'TWILIO' | 'DEBUG';
  providerId?: string; // SendGrid message ID or Twilio SID
  providerStatus?: string; // Provider-specific status
  errorCode?: string;
  errorMessage?: string;
  metadata?: any; // Additional provider-specific data
  timestamp: string;
  processingTimeMs?: number;
}

export class EventLogger {
  private static EVENTS_TABLE = process.env.NOTIFICATION_EVENTS_TABLE || 'NotificationEvents';

  /**
   * Log a notification event
   */
  static async logEvent(event: Omit<NotificationEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const eventRecord: NotificationEvent = {
      ...event,
      eventId: `${event.notificationId}-${event.eventType}-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    try {
      const command = new PutCommand({
        TableName: this.EVENTS_TABLE,
        Item: eventRecord
      });

      await docClient.send(command);
      console.log(`📝 Event logged: ${event.eventType} for notification ${event.notificationId}`);
    } catch (error) {
      console.error('❌ Failed to log event:', error);
      // Don't throw - event logging shouldn't break notification processing
    }
  }

  /**
   * Log notification queued event
   */
  static async logNotificationQueued(notificationId: string, channels: string[], metadata?: any): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'NOTIFICATION_QUEUED',
      metadata: { channels, ...metadata }
    });
  }

  /**
   * Log notification processing started
   */
  static async logNotificationProcessing(notificationId: string): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'NOTIFICATION_PROCESSING'
    });
  }

  /**
   * Log email attempt
   */
  static async logEmailAttempt(notificationId: string, recipient: string): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'EMAIL_ATTEMPT',
      channel: 'EMAIL',
      recipient,
      provider: 'SENDGRID'
    });
  }

  /**
   * Log email success with SendGrid response
   */
  static async logEmailSuccess(
    notificationId: string, 
    recipient: string, 
    messageId: string, 
    statusCode: number,
    processingTimeMs: number
  ): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'EMAIL_SUCCESS',
      channel: 'EMAIL',
      recipient,
      provider: 'SENDGRID',
      providerId: messageId,
      providerStatus: `${statusCode}`,
      processingTimeMs,
      metadata: { statusCode }
    });
  }

  /**
   * Log email failure with SendGrid error
   */
  static async logEmailFailed(
    notificationId: string, 
    recipient: string, 
    errorCode: string, 
    errorMessage: string,
    processingTimeMs: number
  ): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'EMAIL_FAILED',
      channel: 'EMAIL',
      recipient,
      provider: 'SENDGRID',
      errorCode,
      errorMessage,
      processingTimeMs
    });
  }

  /**
   * Log SMS attempt
   */
  static async logSMSAttempt(notificationId: string, recipient: string): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'SMS_ATTEMPT',
      channel: 'SMS',
      recipient,
      provider: 'TWILIO'
    });
  }

  /**
   * Log SMS success with Twilio response
   */
  static async logSMSSuccess(
    notificationId: string, 
    recipient: string, 
    sid: string, 
    status: string,
    processingTimeMs: number
  ): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'SMS_SUCCESS',
      channel: 'SMS',
      recipient,
      provider: 'TWILIO',
      providerId: sid,
      providerStatus: status,
      processingTimeMs
    });
  }

  /**
   * Log SMS failure with Twilio error
   */
  static async logSMSFailed(
    notificationId: string, 
    recipient: string, 
    errorCode: string, 
    errorMessage: string,
    processingTimeMs: number
  ): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'SMS_FAILED',
      channel: 'SMS',
      recipient,
      provider: 'TWILIO',
      errorCode,
      errorMessage,
      processingTimeMs
    });
  }

  /**
   * Log notification completed successfully
   */
  static async logNotificationCompleted(
    notificationId: string, 
    totalProcessingTimeMs: number,
    successfulChannels: string[],
    failedChannels: string[]
  ): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'NOTIFICATION_COMPLETED',
      processingTimeMs: totalProcessingTimeMs,
      metadata: { successfulChannels, failedChannels }
    });
  }

  /**
   * Log notification failed completely
   */
  static async logNotificationFailed(
    notificationId: string, 
    errorMessage: string,
    totalProcessingTimeMs: number
  ): Promise<void> {
    await this.logEvent({
      notificationId,
      eventType: 'NOTIFICATION_FAILED',
      errorMessage,
      processingTimeMs: totalProcessingTimeMs
    });
  }
}