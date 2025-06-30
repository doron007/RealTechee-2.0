import { Twilio } from 'twilio';

export interface SMSParams {
  to: string;
  body: string;
  notification?: any;
  recipient?: any;
}

export class SMSHandler {
  private client: Twilio;
  private fromNumber: string;
  private debugMode: boolean;
  private debugPhone: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_PHONE || '';
    this.debugMode = process.env.DEBUG_NOTIFICATIONS === 'true';
    this.debugPhone = process.env.DEBUG_PHONE || '';

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    this.client = new Twilio(accountSid, authToken);
    console.log('✅ Twilio SMS handler initialized');
  }

  async sendSMS(params: SMSParams): Promise<void> {
    const { to, body, notification, recipient } = params;

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
      await this.sendSingleMessage(finalTo, finalBody, true);
      return;
    }
    
    // SMS chunking: split messages longer than 160 characters into multiple parts
    const maxLength = 150; // Leave room for "1/2", "2/2" indicators
    const messages = this.chunkMessage(finalBody, maxLength);

    if (messages.length > 1) {
      console.log(`📱 Long SMS detected: splitting into ${messages.length} messages`);
    }

    // Send multiple SMS parts
    await this.sendMultipartSMS(finalTo, messages);
  }

  /**
   * Send a single message (SMS or MMS)
   */
  private async sendSingleMessage(to: string, body: string, useMMS: boolean = false): Promise<void> {
    try {
      console.log(`📱 Sending single ${useMMS ? 'MMS' : 'SMS'} to ${to}`);
      console.log(`📏 Message length: ${body.length} characters`);
      console.log(`📝 Content preview: ${body.substring(0, 100)}...`);

      const message = await this.client.messages.create({
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

      // Check status after delay
      setTimeout(async () => {
        try {
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
      
      throw new Error(`${useMMS ? 'MMS' : 'SMS'} delivery failed: ${error.message} (Length: ${body.length} chars)`);
    }
  }

  /**
   * Send multiple SMS parts
   */
  private async sendMultipartSMS(to: string, messages: string[]): Promise<void> {
    try {
      console.log(`📱 Sending ${messages.length} SMS message(s) to ${to}`);

      const sentMessages: any[] = [];

      // Send each message chunk
      for (let i = 0; i < messages.length; i++) {
        const messageText = messages.length > 1 ? `${messages[i]} (${i + 1}/${messages.length})` : messages[i];
        
        console.log(`📱 Sending part ${i + 1}/${messages.length}: ${messageText.substring(0, 50)}...`);
        console.log(`📏 Part ${i + 1} length: ${messageText.length} characters`);

        const message = await this.client.messages.create({
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
      }

      // Check status of all messages after a delay
      setTimeout(async () => {
        for (let i = 0; i < sentMessages.length; i++) {
          try {
            const message = sentMessages[i];
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