import { ScheduledEvent, ScheduledHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { EmailHandler } from './handlers/emailHandler';
import { SMSHandler } from './handlers/smsHandler';
import { TemplateProcessor } from './services/templateProcessor';
import { NotificationQueue, NotificationTemplate } from './types';
import { SecureConfigClient } from './utils/secureConfigClient';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize services
const emailHandler = new EmailHandler();
let smsHandler: SMSHandler | null = null;
const templateProcessor = new TemplateProcessor();
const secureConfigClient = SecureConfigClient.getInstance();

// Initialize SMS handler if Twilio credentials are available
async function initializeSMSHandler(): Promise<void> {
  try {
    smsHandler = new SMSHandler();
  } catch (error) {
    console.warn('⚠️ SMS handler not initialized - Twilio credentials missing:', error instanceof Error ? error.message : String(error));
  }
}

// Environment variables
const NOTIFICATION_QUEUE_TABLE = process.env.NOTIFICATION_QUEUE_TABLE || '';
const NOTIFICATION_TEMPLATE_TABLE = process.env.NOTIFICATION_TEMPLATE_TABLE || '';

// Global configuration cache
let globalConfig: any = null;

export const handler: ScheduledHandler = async (event: ScheduledEvent) => {
  // Initialize SMS handler
  await initializeSMSHandler();
  
  // Get configuration
  if (!globalConfig) {
    globalConfig = await secureConfigClient.getConfig();
  }
  
  console.log('🚀 Starting notification processor', { 
    time: event.time, 
    debug: globalConfig.notifications.debugMode 
  });

  try {
    // Scan for pending notifications
    const pendingNotifications = await getPendingNotifications();
    console.log(`📬 Found ${pendingNotifications.length} pending notifications`);

    if (pendingNotifications.length === 0) {
      console.log('✅ No pending notifications to process');
      return;
    }

    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        await processNotification(notification);
      } catch (error) {
        console.error(`❌ Failed to process notification ${notification.id}:`, error);
        await updateNotificationStatus(notification.id, 'FAILED', error instanceof Error ? error.message : String(error));
      }
    }

    console.log('✅ Notification processing completed');
  } catch (error) {
    console.error('💥 Critical error in notification processor:', error);
    throw error;
  }
};

async function getPendingNotifications(): Promise<NotificationQueue[]> {
  const command = new ScanCommand({
    TableName: NOTIFICATION_QUEUE_TABLE,
    FilterExpression: '#status = :status AND (attribute_not_exists(scheduledAt) OR scheduledAt <= :now)',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': 'PENDING',
      ':now': new Date().toISOString()
    }
  });

  const result = await docClient.send(command);
  return (result.Items as NotificationQueue[]) || [];
}

async function processNotification(notification: NotificationQueue): Promise<void> {
  console.log(`📧 Processing notification ${notification.id} of type ${notification.eventType}`);

  try {
    // Get the template
    const template = await getTemplate(notification.templateId);
    if (!template) {
      throw new Error(`Template ${notification.templateId} not found`);
    }

    // Parse payload from DynamoDB if it's a string
    const payload = typeof notification.payload === 'string' ? JSON.parse(notification.payload) : notification.payload;

    // Process the template with data
    const { subject, htmlContent, textContent } = await templateProcessor.processTemplate(
      template,
      payload
    );

    // Parse JSON strings from DynamoDB
    const channels = typeof notification.channels === 'string' ? JSON.parse(notification.channels) : notification.channels;
    const recipientIds = typeof notification.recipientIds === 'string' ? JSON.parse(notification.recipientIds) : notification.recipientIds;

    // Determine recipients
    const recipients = await resolveRecipients(recipientIds, channels);
    
    // Send notifications with channel-specific templates
    for (const recipient of recipients) {
      if (channels.includes('EMAIL') && recipient.email) {
        // Use original template for email (it's designed for email)
        await sendEmailNotification({
          to: recipient.email,
          subject,
          htmlContent,
          textContent,
          notification,
          recipient,
          channels
        });
      }
      
      if (channels.includes('SMS') && recipient.phone) {
        if (smsHandler) {
          // Get SMS-specific template for better formatting
          const smsTemplate = await getTemplate(notification.templateId, 'SMS');
          
          let smsContent = textContent;
          if (smsTemplate) {
            console.log('📱 Using SMS-specific template');
            const smsProcessed = await templateProcessor.processTemplate(smsTemplate, payload);
            smsContent = smsProcessed.textContent;
          } else {
            console.log('📱 Using fallback email template for SMS');
          }
          
          await sendSMSNotification({
            to: recipient.phone,
            body: smsContent,
            notification,
            recipient
          });
        } else {
          console.warn(`⚠️ SMS requested but handler not available for ${recipient.phone}`);
        }
      }
      
      // TODO: Add WhatsApp, Telegram handlers in future phases (stubbed for now)
      if (channels.includes('WHATSAPP')) {
        console.log(`📱 WhatsApp notification stubbed for ${recipient.whatsappId || recipient.phone} - will implement later`);
      }
      
      if (channels.includes('TELEGRAM')) {
        console.log(`💬 Telegram notification stubbed for ${recipient.telegramId} - will implement later`);
      }
    }

    // Update status to SENT
    await updateNotificationStatus(notification.id, 'SENT');
    console.log(`✅ Successfully processed notification ${notification.id}`);

  } catch (error) {
    // Increment retry count
    const newRetryCount = (notification.retryCount || 0) + 1;
    const maxRetries = 3;

    if (newRetryCount >= maxRetries) {
      await updateNotificationStatus(notification.id, 'FAILED', error instanceof Error ? error.message : String(error));
      console.error(`❌ Notification ${notification.id} failed after ${maxRetries} retries`);
    } else {
      await updateNotificationStatus(notification.id, 'RETRYING', error instanceof Error ? error.message : String(error), newRetryCount);
      console.warn(`⚠️ Notification ${notification.id} retry ${newRetryCount}/${maxRetries}`);
    }
    
    throw error;
  }
}

async function getTemplate(templateId: string, channel?: string): Promise<NotificationTemplate | null> {
  try {
    // If a specific channel is requested, look for channel-specific template first
    if (channel && channel === 'SMS') {
      // Look for SMS-specific template by ID
      const smsTemplateId = 'get-estimate-sms-template-001';
      const smsCommand = new ScanCommand({
        TableName: NOTIFICATION_TEMPLATE_TABLE,
        FilterExpression: 'id = :templateId',
        ExpressionAttributeValues: {
          ':templateId': smsTemplateId
        }
      });

      const smsResult = await docClient.send(smsCommand);
      if (smsResult.Items && smsResult.Items.length > 0) {
        console.log(`✅ Found SMS-specific template: ${smsTemplateId}`);
        return smsResult.Items[0] as NotificationTemplate;
      } else {
        console.log(`⚠️ SMS template ${smsTemplateId} not found, falling back to email template`);
      }
    }

    // Fallback to original template ID
    const command = new ScanCommand({
      TableName: NOTIFICATION_TEMPLATE_TABLE,
      FilterExpression: 'id = :templateId',
      ExpressionAttributeValues: {
        ':templateId': templateId
      }
    });

    const result = await docClient.send(command);
    return result.Items?.[0] as NotificationTemplate || null;
  } catch (error) {
    console.error(`Error fetching template ${templateId}:`, error);
    return null;
  }
}

async function resolveRecipients(recipientIds: string[], channels: string[]): Promise<any[]> {
  // TODO: Implement contact resolution from Contact table
  // For now, return mock data for testing
  if (!globalConfig) {
    globalConfig = await secureConfigClient.getConfig();
  }
  
  if (globalConfig.notifications.debugMode) {
    return [{
      id: 'debug',
      email: globalConfig.notifications.debugEmail,
      phone: globalConfig.notifications.debugPhone,
      name: 'Debug Recipient',
      whatsappId: globalConfig.notifications.debugPhone,
      telegramId: 'debug_telegram_id'
    }];
  }

  // This would normally query the Contacts table
  return [];
}

async function sendEmailNotification(params: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  notification: NotificationQueue;
  recipient: any;
  channels: string[];
}): Promise<void> {
  const { to, subject, htmlContent, textContent, notification, recipient, channels } = params;

  let finalTo = to;
  let finalSubject = subject;
  let finalHtmlContent = htmlContent;

  // Debug mode: redirect to debug email with envelope info
  if (!globalConfig) {
    globalConfig = await secureConfigClient.getConfig();
  }
  
  if (globalConfig.notifications.debugMode) {
    finalTo = globalConfig.notifications.debugEmail;
    finalSubject = `[DEBUG] ${subject}`;
    
    // Add envelope information to email
    const debugInfo = `
      <div style="background: #f0f0f0; padding: 15px; margin-bottom: 20px; border-left: 4px solid #ff6b35;">
        <h3 style="color: #333; margin: 0 0 10px 0;">🐛 DEBUG MODE</h3>
        <p><strong>Original Recipient:</strong> ${recipient.name} (${to})</p>
        <p><strong>Notification ID:</strong> ${notification.id}</p>
        <p><strong>Event Type:</strong> ${notification.eventType}</p>
        <p><strong>Template ID:</strong> ${notification.templateId}</p>
        <p><strong>Channels:</strong> ${channels.join(', ')}</p>
      </div>
    `;
    
    finalHtmlContent = debugInfo + htmlContent;
  }

  await emailHandler.sendEmail({
    to: finalTo,
    subject: finalSubject,
    htmlContent: finalHtmlContent,
    textContent: textContent
  });

  console.log(`📧 Email sent to ${finalTo} (debug: ${globalConfig.notifications.debugMode})`);
}

async function sendSMSNotification(params: {
  to: string;
  body: string;
  notification: NotificationQueue;
  recipient: any;
}): Promise<void> {
  if (!smsHandler) {
    throw new Error('SMS handler not initialized');
  }
  await smsHandler.sendSMS(params);
  if (!globalConfig) {
    globalConfig = await secureConfigClient.getConfig();
  }
  console.log(`📱 SMS sent to ${params.to} (debug: ${globalConfig.notifications.debugMode})`);
}

async function updateNotificationStatus(
  id: string, 
  status: string, 
  errorMessage?: string, 
  retryCount?: number
): Promise<void> {
  let updateExpression = 'SET #status = :status, sentAt = :sentAt';
  const expressionAttributeNames: any = { '#status': 'status' };
  const expressionAttributeValues: any = {
    ':status': status,
    ':sentAt': new Date().toISOString()
  };

  if (errorMessage) {
    updateExpression += ', errorMessage = :errorMessage';
    expressionAttributeValues[':errorMessage'] = errorMessage;
  }

  if (retryCount !== undefined) {
    updateExpression += ', retryCount = :retryCount';
    expressionAttributeValues[':retryCount'] = retryCount;
  }

  const command = new UpdateCommand({
    TableName: NOTIFICATION_QUEUE_TABLE,
    Key: { id },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  });

  await docClient.send(command);
}