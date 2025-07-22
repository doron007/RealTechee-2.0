import { Twilio } from 'twilio';
import { SecureConfigClient } from '../utils/secureConfigClient';
import { EventLogger } from '../utils/eventLogger';

export interface SMSParams {
  to: string;
  body: string;
  notification?: any;
  recipient?: any;
  notificationId?: string; // Add for event logging
}

export class SMSHandler {
  private client: Twilio | null = null;
  private fromNumber: string = '';
  private debugMode: boolean = false;
  private debugPhone: string = '';
  private initialized: boolean = false;
  private secureConfigClient: SecureConfigClient;

  constructor() {
    this.secureConfigClient = SecureConfigClient.getInstance();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const config = await this.secureConfigClient.getConfig();
      
      const accountSid = config.twilio.accountSid;
      const authToken = config.twilio.authToken;
      this.fromNumber = config.twilio.fromPhone;
      this.debugMode = config.notifications.debugMode;
      this.debugPhone = config.notifications.debugPhone;

      if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured in secure storage');
      }

      this.client = new Twilio(accountSid, authToken);
      this.initialized = true;
      console.log('✅ Twilio SMS handler initialized with secure configuration');
    } catch (error) {
      console.error('❌ Failed to initialize Twilio SMS handler:', error);
      throw error;
    }
  }

  async sendSMS(params: SMSParams): Promise<void> {
    const startTime = Date.now();
    const { to, body, notification, recipient, notificationId } = params;

    if (!this.initialized || !this.client) {
      // Try to initialize again
      await this.initialize();
      if (!this.initialized || !this.client) {
        throw new Error('SMS handler not initialized. Check Twilio configuration.');
      }
    }

    // Log SMS attempt
    if (notificationId) {
      await EventLogger.logSMSAttempt(notificationId, to);
    }

    let finalTo = to;
    let finalBody = body;

    // Debug mode: redirect to debug phone with envelope info
    if (this.debugMode && this.debugPhone) {
      finalTo = this.debugPhone;
      
      // Add debug envelope information
      const debugInfo = `[DEBUG SMS]\nOriginal To: ${recipient?.name || 'Unknown'} (${to})\nNotification: ${notification?.id || 'N/A'}\nEvent: ${notification?.eventType || 'N/A'}\n\n--- MESSAGE ---\n`;
      finalBody = debugInfo + body;
    }

    // Determine if we should use MMS (for messages with line breaks or longer content)
    const hasLineBreaks = finalBody.includes('\n');
    const isLongMessage = finalBody.length > 160;
    const shouldUseMMS = hasLineBreaks || isLongMessage;
    
    if (shouldUseMMS && finalBody.length <= 1600) {
      console.log(`📱 Using MMS for better formatting (${finalBody.length} chars, line breaks: ${hasLineBreaks})`);
      // Send as single MMS message
      await this.sendSingleMessage(finalTo, finalBody, true, notificationId, startTime);
      return;
    }
    
    // SMS chunking: split messages longer than 160 characters into multiple parts
    const maxLength = 150; // Leave room for "1/2", "2/2" indicators
    const messages = this.chunkMessage(finalBody, maxLength);

    if (messages.length > 1) {
      console.log(`📱 Long SMS detected: splitting into ${messages.length} messages`);
    }

    // Send multiple SMS parts
    await this.sendMultipartSMS(finalTo, messages, notificationId, startTime);
  }

  /**
   * Send a single message (SMS or MMS)
   */
  private async sendSingleMessage(to: string, body: string, useMMS: boolean = false, notificationId?: string, startTime?: number): Promise<void> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      console.log(`📱 Sending single ${useMMS ? 'MMS' : 'SMS'} to ${to}`);
      console.log(`📏 Message length: ${body.length} characters`);
      console.log(`📝 Content preview: ${body.substring(0, 100)}...`);

      const message = await this.client!.messages.create({
        body: body,
        from: this.fromNumber,
        to: to
      });

      console.log(`✅ ${useMMS ? 'MMS' : 'SMS'} queued successfully`, {
        to: to,
        sid: message.sid,
        status: message.status,
        messageLength: body.length,
        type: useMMS ? 'MMS' : 'SMS'
      });

      // Log success if this is part of a tracked notification
      if (notificationId && startTime) {
        const processingTime = Date.now() - startTime;
        await EventLogger.logSMSSuccess(
          notificationId,
          to,
          message.sid,
          'queued', // Standard Twilio queued status
          processingTime
        );
      }

      // Check status after delay
      setTimeout(async () => {
        try {
          if (!this.client) return;
          const updatedMessage = await this.client.messages(message.sid).fetch();
          console.log(`📊 ${useMMS ? 'MMS' : 'SMS'} status update for ${message.sid}:`, {
            status: updatedMessage.status,
            errorCode: updatedMessage.errorCode,
            errorMessage: updatedMessage.errorMessage
          });
          
          if (updatedMessage.status === 'failed' || updatedMessage.status === 'undelivered') {
            console.error(`❌ ${useMMS ? 'MMS' : 'SMS'} delivery failed for ${message.sid}:`, {
              errorCode: updatedMessage.errorCode,
              errorMessage: updatedMessage.errorMessage,
              messageLength: body.length
            });
          }
        } catch (statusError) {
          console.warn(`⚠️  Could not check ${useMMS ? 'MMS' : 'SMS'} status:`, statusError);
        }
      }, 10000);

    } catch (error: any) {
      console.error(`❌ Failed to send ${useMMS ? 'MMS' : 'SMS'}:`, error);
      
      if (error.code) {
        console.error(`  - Twilio Error Code: ${error.code}`);
        console.error(`  - Twilio Error Message: ${error.message}`);
        console.error(`  - Message Length: ${body.length} characters`);
      }

      // Log failure if this is part of a tracked notification
      if (notificationId && startTime) {
        const processingTime = Date.now() - startTime;
        const errorCode = error.code || 'SMS_SEND_FAILED';
        const errorMessage = error.message || `${useMMS ? 'MMS' : 'SMS'} delivery failed`;
        await EventLogger.logSMSFailed(
          notificationId,
          to,
          errorCode,
          errorMessage,
          processingTime
        );
      }
      
      throw new Error(`${useMMS ? 'MMS' : 'SMS'} delivery failed: ${error.message} (Length: ${body.length} chars)`);
    }
  }

  /**
   * Send multiple SMS parts
   */
  private async sendMultipartSMS(to: string, messages: string[], notificationId?: string, startTime?: number): Promise<void> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      console.log(`📱 Sending ${messages.length} SMS message(s) to ${to}`);

      const sentMessages: any[] = [];
      let allSentSuccessfully = true;
      let lastError: any = null;

      // Send each message chunk
      for (let i = 0; i < messages.length; i++) {
        const messageText = messages.length > 1 ? `${messages[i]} (${i + 1}/${messages.length})` : messages[i];
        
        console.log(`📱 Sending part ${i + 1}/${messages.length}: ${messageText.substring(0, 50)}...`);
        console.log(`📏 Part ${i + 1} length: ${messageText.length} characters`);

        try {
          const message = await this.client!.messages.create({
            body: messageText,
            from: this.fromNumber,
            to: to
          });

          sentMessages.push(message);

          console.log(`✅ SMS part ${i + 1}/${messages.length} queued successfully`, {
            to: to,
            sid: message.sid,
            status: message.status,
            partLength: messageText.length
          });

          // Small delay between messages to avoid rate limiting
          if (i < messages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (partError: any) {
          console.error(`❌ Failed to send SMS part ${i + 1}/${messages.length}:`, partError);
          allSentSuccessfully = false;
          lastError = partError;
          break; // Stop sending more parts if one fails
        }
      }

      // Log final result
      if (notificationId && startTime) {
        const processingTime = Date.now() - startTime;
        
        if (allSentSuccessfully) {
          // For multipart SMS, we'll log success with the first message SID as representative
          const firstSid = sentMessages.length > 0 ? sentMessages[0].sid : 'multipart';
          await EventLogger.logSMSSuccess(
            notificationId,
            to,
            firstSid,
            'queued', // Standard Twilio queued status
            processingTime
          );
        } else {
          const errorCode = lastError?.code || 'MULTIPART_SEND_FAILED';
          const errorMessage = lastError?.message || 'Failed to send one or more SMS parts';
          await EventLogger.logSMSFailed(
            notificationId,
            to,
            errorCode,
            errorMessage,
            processingTime
          );
        }
      }

      // Check status of all messages after a delay
      setTimeout(async () => {
        for (let i = 0; i < sentMessages.length; i++) {
          try {
            const message = sentMessages[i];
            if (!this.client) return;
            const updatedMessage = await this.client.messages(message.sid).fetch();
            console.log(`📊 SMS part ${i + 1}/${sentMessages.length} status for ${message.sid}:`, {
              status: updatedMessage.status,
              errorCode: updatedMessage.errorCode,
              errorMessage: updatedMessage.errorMessage
            });
            
            if (updatedMessage.status === 'failed' || updatedMessage.status === 'undelivered') {
              console.error(`❌ SMS part ${i + 1} delivery failed for ${message.sid}:`, {
                errorCode: updatedMessage.errorCode,
                errorMessage: updatedMessage.errorMessage,
                partLength: (messages.length > 1 ? `${messages[i]} (${i + 1}/${messages.length})` : messages[i]).length
              });
            }
          } catch (statusError) {
            console.warn(`⚠️  Could not check SMS part ${i + 1} status:`, statusError);
          }
        }
      }, 10000); // Check after 10 seconds

    } catch (error: any) {
      console.error('❌ Failed to send SMS:', error);
      
      // Enhanced error logging for debugging
      if (error.code) {
        console.error(`  - Twilio Error Code: ${error.code}`);
        console.error(`  - Twilio Error Message: ${error.message}`);
        console.error(`  - Message Length: ${messages.join('').length} characters`);
        
        // Log specific error codes
        switch (error.code) {
          case 21617:
            console.error('  💡 Message body is too long (exceeds 1600 characters)');
            break;
          case 21614:
            console.error('  💡 Message body or media URL required');
            break;
          case 21211:
            console.error('  💡 Invalid phone number format');
            break;
          case 21608:
            console.error('  💡 Phone number not SMS capable');
            break;
          default:
            console.error(`  💡 Unknown Twilio error code: ${error.code}`);
        }
      }
      
      throw new Error(`SMS delivery failed: ${error.message} (Length: ${messages.join('').length} chars)`);
    }
  }

  /**
   * Split long messages into SMS-sized chunks
   */
  private chunkMessage(message: string, maxLength: number): string[] {
    if (message.length <= maxLength) {
      return [message];
    }

    const chunks: string[] = [];
    let remaining = message;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }

      // Try to break at word boundaries
      let chunkEnd = maxLength;
      const spaceIndex = remaining.lastIndexOf(' ', maxLength);
      
      if (spaceIndex > maxLength * 0.7) { // Only break at word if it's not too far back
        chunkEnd = spaceIndex;
      }

      chunks.push(remaining.substring(0, chunkEnd));
      remaining = remaining.substring(chunkEnd).trim();
    }

    return chunks;
  }
}