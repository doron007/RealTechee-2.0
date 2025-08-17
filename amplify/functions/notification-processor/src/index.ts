import { ScheduledEvent, ScheduledHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SESEmailHandler } from './handlers/sesEmailHandler';
import { SMSHandler } from './handlers/smsHandler';
import { TemplateProcessor } from './services/templateProcessor';
import { NotificationQueue, NotificationTemplate, SignalEvent, SignalNotificationHook } from './types';
import { SecureConfigClient } from './utils/secureConfigClient';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize services
const emailHandler = new SESEmailHandler();
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
const SIGNAL_EVENTS_TABLE = process.env.SIGNAL_EVENTS_TABLE || '';
const SIGNAL_HOOKS_TABLE = process.env.SIGNAL_HOOKS_TABLE || '';

// Global configuration cache
let globalConfig: any = null;

export const handler: ScheduledHandler = async (event: ScheduledEvent) => {
  // Initialize SMS handler
  await initializeSMSHandler();
  
  // Get configuration
  if (!globalConfig) {
    globalConfig = await secureConfigClient.getConfig();
  }
  
  console.log('🚀 Starting unified signal & notification processor', { 
    time: event.time, 
    debug: globalConfig.notifications.debugMode 
  });

  try {
    // PHASE 1: Process pending signals → Create notifications
    console.log('\n🎯 PHASE 1: Processing signals...');
    const signalResults = await processPendingSignals();
    
    // PHASE 2: Process pending notifications → Send emails/SMS
    console.log('\n📬 PHASE 2: Processing notifications...');
    const pendingNotifications = await getPendingNotifications();
    console.log(`📬 Found ${pendingNotifications.length} pending notifications`);

    if (pendingNotifications.length === 0) {
      console.log('✅ No pending notifications to process');
    } else {
      // Process each notification
      for (const notification of pendingNotifications) {
        try {
          await processNotification(notification);
        } catch (error) {
          console.error(`❌ Failed to process notification ${notification.id}:`, error);
          await updateNotificationStatus(notification.id, 'FAILED', error instanceof Error ? error.message : String(error));
        }
      }
    }

    console.log('✅ Unified processing completed', {
      signalsProcessed: signalResults.totalSignals,
      notificationsCreated: signalResults.totalNotificationsCreated,
      notificationsProcessed: pendingNotifications.length
    });
    
  } catch (error) {
    console.error('💥 Critical error in unified processor:', error);
    throw error;
  }
};

// ============================================================================
// SIGNAL PROCESSING FUNCTIONS (PHASE 1)
// ============================================================================

interface SignalProcessingResult {
  totalSignals: number;
  totalHooksProcessed: number;
  totalNotificationsCreated: number;
  errors: string[];
}

async function processPendingSignals(): Promise<SignalProcessingResult> {
  const result: SignalProcessingResult = {
    totalSignals: 0,
    totalHooksProcessed: 0,
    totalNotificationsCreated: 0,
    errors: []
  };

  try {
    // Get unprocessed signals
    const pendingSignals = await getPendingSignalEvents();
    result.totalSignals = pendingSignals.length;
    
    if (pendingSignals.length === 0) {
      console.log('✅ No pending signals to process');
      return result;
    }

    console.log(`📬 Found ${pendingSignals.length} pending signals to process`);

    // Process each signal
    for (const signal of pendingSignals) {
      try {
        const signalResult = await processSignalEvent(signal);
        result.totalHooksProcessed += signalResult.hooksProcessed;
        result.totalNotificationsCreated += signalResult.notificationsCreated;

        // Mark signal as processed
        await updateSignalEventStatus(signal.id, true);
        console.log(`✅ Signal ${signal.id} processed successfully`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to process signal ${signal.id}:`, errorMessage);
        result.errors.push(`Signal ${signal.id}: ${errorMessage}`);
      }
    }

    console.log('✅ Signal processing phase completed', {
      totalSignals: result.totalSignals,
      hooksProcessed: result.totalHooksProcessed,
      notificationsCreated: result.totalNotificationsCreated,
      errors: result.errors.length
    });

    return result;

  } catch (error) {
    console.error('❌ Signal processing phase failed:', error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

async function getPendingSignalEvents(): Promise<SignalEvent[]> {
  const command = new ScanCommand({
    TableName: SIGNAL_EVENTS_TABLE,
    FilterExpression: '#processed = :processed',
    ExpressionAttributeNames: {
      '#processed': 'processed'
    },
    ExpressionAttributeValues: {
      ':processed': false
    }
  });

  const result = await docClient.send(command);
  return (result.Items as SignalEvent[]) || [];
}

async function processSignalEvent(signal: SignalEvent): Promise<{ hooksProcessed: number; notificationsCreated: number; }> {
  console.log(`🎯 Processing signal: ${signal.signalType} (ID: ${signal.id})`);

  // Get hooks for this signal type
  const hooks = await getSignalNotificationHooks(signal.signalType);
  
  if (hooks.length === 0) {
    console.warn(`⚠️ No active hooks found for signal type: ${signal.signalType}`);
    return { hooksProcessed: 0, notificationsCreated: 0 };
  }

  console.log(`🔗 Found ${hooks.length} active hooks for signal type: ${signal.signalType}`);

  let hooksProcessed = 0;
  let notificationsCreated = 0;

  // Process each hook
  for (const hook of hooks) {
    try {
      const shouldProcess = evaluateHookConditions(hook, signal);
      
      if (!shouldProcess) {
        console.log(`⏭️ Skipping hook ${hook.id} due to condition mismatch`);
        continue;
      }

      await createNotificationFromSignal(hook, signal);
      hooksProcessed++;
      notificationsCreated++;

    } catch (error) {
      console.error(`❌ Failed to process hook ${hook.id}:`, error);
      throw error;
    }
  }

  return { hooksProcessed, notificationsCreated };
}

async function getSignalNotificationHooks(signalType: string): Promise<SignalNotificationHook[]> {
  const command = new ScanCommand({
    TableName: SIGNAL_HOOKS_TABLE,
    FilterExpression: 'signalType = :signalType AND enabled = :enabled',
    ExpressionAttributeValues: {
      ':signalType': signalType,
      ':enabled': true
    }
  });

  const result = await docClient.send(command);
  return (result.Items as SignalNotificationHook[]) || [];
}

function evaluateHookConditions(hook: SignalNotificationHook, signal: SignalEvent): boolean {
  // Simple condition evaluation - can be enhanced later
  if (!hook.conditions) {
    return true; // No conditions = always process
  }

  try {
    const conditions = typeof hook.conditions === 'string' ? JSON.parse(hook.conditions) : hook.conditions;
    const payload = typeof signal.payload === 'string' ? JSON.parse(signal.payload) : signal.payload;

    // Simple condition evaluation (can be expanded)
    for (const condition of conditions) {
      const fieldValue = getNestedValue(payload, condition.field);
      if (!evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.warn(`⚠️ Error evaluating conditions for hook ${hook.id}:`, error);
    return true; // Default to processing on evaluation error
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
  switch (operator) {
    case 'eq': return fieldValue === expectedValue;
    case 'ne': return fieldValue !== expectedValue;
    case 'gt': return fieldValue > expectedValue;
    case 'lt': return fieldValue < expectedValue;
    case 'contains': 
      return typeof fieldValue === 'string' && fieldValue.includes(expectedValue);
    default: 
      console.warn(`Unknown condition operator: ${operator}`);
      return true;
  }
}

async function createNotificationFromSignal(hook: SignalNotificationHook, signal: SignalEvent): Promise<void> {
  console.log(`📋 Creating notification from hook ${hook.id} for signal ${signal.id}`);

  // Get the template
  const template = await getTemplate(hook.notificationTemplateId);
  if (!template) {
    throw new Error(`Template ${hook.notificationTemplateId} not found`);
  }

  const payload = typeof signal.payload === 'string' ? JSON.parse(signal.payload) : signal.payload;
  const channels = typeof hook.channels === 'string' ? JSON.parse(hook.channels) : hook.channels;

  // Resolve recipients from hook configuration
  const recipients = await resolveSignalRecipients(hook, payload);
  
  if (recipients.length === 0) {
    console.warn('No recipients resolved for notification');
    return;
  }

  // Build channels data for the notification
  const channelsData = await buildChannelsDataFromSignal(channels, template, payload, recipients);

  // Create notification queue record
  const notification = {
    id: generateNotificationId(),
    eventType: `${signal.signalType}_notification`,
    signalEventId: signal.id,
    templateId: hook.notificationTemplateId,
    status: 'PENDING',
    priority: hook.priority?.toUpperCase() || 'MEDIUM',
    channels: JSON.stringify(channelsData),
    recipientIds: JSON.stringify(recipients.map(r => r.email || r.id)),
    payload: signal.payload,
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Insert into NotificationQueue table
  await insertNotificationQueue(notification);

  console.log(`✅ Notification created successfully: ${notification.id}`);
}

async function resolveSignalRecipients(hook: SignalNotificationHook, payload: any): Promise<any[]> {
  const recipients: any[] = [];

  // Static email recipients
  if (hook.recipientEmails) {
    const staticEmails = typeof hook.recipientEmails === 'string' ? JSON.parse(hook.recipientEmails) : hook.recipientEmails;
    for (const email of staticEmails) {
      recipients.push({ email, type: 'static' });
    }
  }

  // Role-based recipients (simplified - using default AE)
  if (hook.recipientRoles) {
    const roles = typeof hook.recipientRoles === 'string' ? JSON.parse(hook.recipientRoles) : hook.recipientRoles;
    for (const role of roles) {
      if (role === 'AE') {
        recipients.push({ 
          email: 'info@realtechee.com', 
          phone: '+17135919400',
          role: 'AE',
          type: 'role' 
        });
      }
    }
  }

  // Dynamic recipients from payload
  if (hook.recipientDynamic) {
    const dynamicFields = typeof hook.recipientDynamic === 'string' ? JSON.parse(hook.recipientDynamic) : hook.recipientDynamic;
    for (const field of dynamicFields) {
      if (field === 'customerEmail' && payload.customerEmail) {
        recipients.push({ 
          email: payload.customerEmail, 
          type: 'dynamic', 
          field: 'customerEmail' 
        });
      }
    }
  }

  return recipients;
}

async function buildChannelsDataFromSignal(channels: string[], template: NotificationTemplate, payload: any, recipients: any[]): Promise<any> {
  const channelsData: any = {};

  // Transform payload for template variables
  const transformedPayload = transformPayloadForTemplates(payload);

  // Process template with proper template processor
  const processed = await templateProcessor.processTemplate(template, transformedPayload);

  for (const channelType of channels) {
    const recipientList = recipients.map(r => r.email).filter(Boolean);

    switch (channelType.toUpperCase()) {
      case 'EMAIL':
        channelsData.email = {
          enabled: true,
          recipients: recipientList,
          subject: processed.subject,
          content: processed.htmlContent,
          status: 'PENDING'
        };
        break;

      case 'SMS':
        channelsData.sms = {
          enabled: true,
          recipients: recipientList, // In real implementation, would map to phone numbers
          content: processed.textContent || processed.htmlContent.substring(0, 160),
          status: 'PENDING'
        };
        break;
    }
  }

  return channelsData;
}

function renderTemplateString(template: string, payload: any): string {
  if (!template) return '';

  let rendered = template;

  // Simple variable replacement
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    if (typeof value === 'string' || typeof value === 'number') {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
    }
  });

  return rendered;
}

function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function insertNotificationQueue(notification: any): Promise<void> {
  const command = new UpdateCommand({
    TableName: NOTIFICATION_QUEUE_TABLE,
    Key: { id: notification.id },
    UpdateExpression: 'SET eventType = :eventType, signalEventId = :signalEventId, templateId = :templateId, #status = :status, priority = :priority, channels = :channels, recipientIds = :recipientIds, payload = :payload, retryCount = :retryCount, createdAt = :createdAt, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':eventType': notification.eventType,
      ':signalEventId': notification.signalEventId,
      ':templateId': notification.templateId,
      ':status': notification.status,
      ':priority': notification.priority,
      ':channels': notification.channels,
      ':recipientIds': notification.recipientIds,
      ':payload': notification.payload,
      ':retryCount': notification.retryCount,
      ':createdAt': notification.createdAt,
      ':updatedAt': notification.updatedAt
    }
  });

  await docClient.send(command);
}

async function updateSignalEventStatus(signalId: string, processed: boolean): Promise<void> {
  const command = new UpdateCommand({
    TableName: SIGNAL_EVENTS_TABLE,
    Key: { id: signalId },
    UpdateExpression: 'SET #processed = :processed, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#processed': 'processed'
    },
    ExpressionAttributeValues: {
      ':processed': processed,
      ':updatedAt': new Date().toISOString()
    }
  });

  await docClient.send(command);
}

// ============================================================================
// NOTIFICATION PROCESSING FUNCTIONS (PHASE 2)
// ============================================================================

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
    // Parse JSON strings from DynamoDB
    const channelsData = typeof notification.channels === 'string' ? JSON.parse(notification.channels) : notification.channels;
    const recipientIds = typeof notification.recipientIds === 'string' ? JSON.parse(notification.recipientIds) : notification.recipientIds;
    
    // Extract channel types from channelsData structure
    const channels = Object.keys(channelsData).map(key => key.toUpperCase());

    let subject: string, htmlContent: string, textContent: string, smsContent: string;

    // Check if this uses the new directContent approach (decoupled architecture)
    if (notification.directContent) {
      console.log('🆕 Using directContent (decoupled architecture)');
      
      const directContent = typeof notification.directContent === 'string' 
        ? JSON.parse(notification.directContent) 
        : notification.directContent;

      // Extract pre-generated content
      subject = directContent.email?.subject || 'Notification';
      htmlContent = directContent.email?.html || directContent.email?.text || 'No content';
      textContent = directContent.email?.text || directContent.email?.html || 'No content';
      smsContent = directContent.sms?.message || textContent.substring(0, 160); // SMS fallback

    } else {
      // Legacy template-based approach
      console.log('🔄 Using template-based processing (legacy)');
      
      // Get the template
      if (!notification.templateId) {
        throw new Error('Template ID is required for legacy template-based processing');
      }
      
      const template = await getTemplate(notification.templateId);
      if (!template) {
        throw new Error(`Template ${notification.templateId} not found`);
      }

      // Parse payload from DynamoDB if it's a string
      let payload = typeof notification.payload === 'string' ? JSON.parse(notification.payload) : notification.payload;

      // Transform payload to match template variable structure
      payload = transformPayloadForTemplates(payload);

      // Enhance payload with admin URLs for request navigation
      payload = enhancePayloadWithAdminUrls(payload, notification);

      // Process the template with data
      const processed = await templateProcessor.processTemplate(template, payload);
      subject = processed.subject;
      htmlContent = processed.htmlContent;
      textContent = processed.textContent;

      // Get SMS-specific content if available
      const smsTemplate = await getTemplate(notification.templateId, 'SMS');
      if (smsTemplate) {
        const smsProcessed = await templateProcessor.processTemplate(smsTemplate, payload);
        smsContent = smsProcessed.textContent;
      } else {
        smsContent = textContent;
      }
    }

    // Determine recipients
    const recipients = await resolveRecipients(recipientIds, channels);
    
    console.log(`📋 Processing channels: ${channels.join(', ')} for notification ${notification.id}`);
    
    // Send notifications with pre-generated or processed content
    for (const recipient of recipients) {
      if (channelsData.email && channelsData.email.enabled && recipient.email) {
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
      
      if (channelsData.sms && channelsData.sms.enabled && recipient.phone) {
        if (smsHandler) {
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
      if (channelsData.whatsapp && channelsData.whatsapp.enabled) {
        console.log(`📱 WhatsApp notification stubbed for ${recipient.whatsappId || recipient.phone} - will implement later`);
      }
      
      if (channelsData.telegram && channelsData.telegram.enabled) {
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
    // If a specific channel is requested, try to find channel-specific template
    if (channel && channel === 'SMS') {
      // First, try to find a direct SMS template match
      const smsCommand = new ScanCommand({
        TableName: NOTIFICATION_TEMPLATE_TABLE,
        FilterExpression: 'id = :templateId AND channel = :channel',
        ExpressionAttributeValues: {
          ':templateId': templateId,
          ':channel': 'SMS'
        }
      });

      const smsResult = await docClient.send(smsCommand);
      if (smsResult.Items && smsResult.Items.length > 0) {
        console.log(`✅ Found direct SMS template: ${templateId}`);
        return smsResult.Items[0] as NotificationTemplate;
      }

      // If no direct match, try to find an SMS-specific variant (replace email with sms in ID)
      const smsVariantId = templateId.replace('-email-', '-sms-');
      if (smsVariantId !== templateId) {
        const smsVariantCommand = new ScanCommand({
          TableName: NOTIFICATION_TEMPLATE_TABLE,
          FilterExpression: 'id = :templateId',
          ExpressionAttributeValues: {
            ':templateId': smsVariantId
          }
        });

        const smsVariantResult = await docClient.send(smsVariantCommand);
        if (smsVariantResult.Items && smsVariantResult.Items.length > 0) {
          console.log(`✅ Found SMS variant template: ${smsVariantId}`);
          return smsVariantResult.Items[0] as NotificationTemplate;
        }
      }

      console.log(`⚠️ No SMS-specific template found for ${templateId}, falling back to original template`);
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
  
  // Production recipient resolution
  const recipients = [];
  
  for (const recipientId of recipientIds) {
    if (recipientId === 'admin-team' || recipientId === 'ae') {
      // For production, assign to the single AE: info@realtechee.com
      recipients.push({
        id: 'ae-primary',
        email: 'info@realtechee.com',
        phone: '+17135919400', // Primary business phone
        name: 'RealTechee AE Team',
        role: 'Account Executive'
      });
    }
    // TODO: In future, query Contacts table with roleType='AE' for dynamic assignment
    // when role management system is implemented
  }
  
  if (recipients.length === 0) {
    // Fallback to primary AE if no specific recipients found
    console.warn('⚠️ No recipients resolved, using fallback AE');
    recipients.push({
      id: 'ae-fallback',
      email: 'info@realtechee.com',
      phone: '+17135919400',
      name: 'RealTechee AE Team',
      role: 'Account Executive'
    });
  }
  
  return recipients;
}

function transformPayloadForTemplates(payload: any): any {
  // Transform flat signal payload into nested structure expected by templates
  const transformed = {
    ...payload,
    customer: {
      name: payload.customerName || '',
      email: payload.customerEmail || '',
      phone: payload.customerPhone || '',
      company: payload.customerCompany || ''
    },
    inquiry: {
      subject: payload.subject || '',
      message: payload.message || payload.projectMessage || ''
    },
    project: {
      product: payload.product || payload.projectType || '',
      message: payload.message || payload.projectMessage || ''
    },
    property: {
      address: payload.propertyAddress || 
        (payload.address ? 
          `${payload.address.streetAddress || ''}, ${payload.address.city || ''}, ${payload.address.state || ''} ${payload.address.zip || ''}`.trim() 
          : '')
    },
    submission: {
      id: payload.submissionId || '',
      timestamp: payload.submittedAt || payload.submissionTimestamp || payload.timestamp || ''
    },
    agent: {
      name: payload.agentName || payload.customerName || '',
      email: payload.agentEmail || payload.customerEmail || '',
      phone: payload.agentPhone || payload.customerPhone || '',
      license: payload.agentLicense || '',
      brokerage: payload.agentBrokerage || '',
      experience: payload.agentExperience || '',
      specialties: payload.agentSpecialties || '',
      markets: payload.agentMarkets || '',
      goals: payload.agentGoals || ''
    },
    businessInformation: {
      companyName: payload.companyName || '',
      serviceType: payload.serviceType || payload.projectType || '',
      businessLicense: payload.businessLicense || '',
      numberOfEmployees: payload.numberOfEmployees || '',
      workersCompensation: payload.workersCompensation || '',
      insurance: payload.insurance || '',
      oshaCompliance: payload.oshaCompliance || '',
      environmentalFactor: payload.environmentalFactor || '',
      signedNDA: payload.signedNDA || '',
      safetyPlan: payload.safetyPlan || ''
    },
    contactInformation: {
      fullName: payload.customerName || payload.contactName || '',
      email: payload.customerEmail || payload.contactEmail || '',
      phone: payload.customerPhone || payload.contactPhone || '',
      address: payload.propertyAddress || payload.address || {}
    },
    
    // Enhanced Get Estimate Template Variables
    // Agent Information (primary contact)
    agentFullName: payload.agentFullName || payload.customerName || '',
    agentEmail: payload.agentEmail || payload.customerEmail || '',
    agentPhone: payload.agentPhone || payload.customerPhone || '',
    agentBrokerage: payload.agentBrokerage || '',
    
    // Homeowner Information (optional)
    homeownerFullName: payload.homeownerFullName || '',
    homeownerEmail: payload.homeownerEmail || '',
    homeownerPhone: payload.homeownerPhone || '',
    
    // Property Information
    propertyAddress: payload.propertyAddress || '',
    propertyStreetAddress: payload.propertyStreetAddress || '',
    propertyCity: payload.propertyCity || '',
    propertyState: payload.propertyState || '',
    propertyZip: payload.propertyZip || '',
    
    // Project Information
    relationToProperty: payload.relationToProperty || '',
    needFinance: payload.needFinance || false,
    projectType: payload.projectType || '',
    projectMessage: payload.projectMessage || '',
    
    // Meeting Information
    meetingType: payload.meetingType || '',
    meetingDateTime: payload.meetingDateTime || payload.requestedVisitDateTime || '',
    requestedVisitDateTime: payload.requestedVisitDateTime || '',
    
    // File upload fields for template rendering
    uploadedMedia: payload.uploadedMedia || '',
    uplodedDocuments: payload.uplodedDocuments || '', // Note: keeping the typo to match schema
    uploadedVideos: payload.uploadedVideos || '',
    
    // Admin and system fields
    dashboardUrl: payload.dashboardUrl || '',
    submissionId: payload.submissionId || '',
    submissionTimestamp: payload.submissionTimestamp || payload.timestamp || ''
  };

  console.log('🔄 Transformed payload for template variables:', {
    customerName: transformed.customer.name,
    customerEmail: transformed.customer.email,
    propertyAddress: transformed.property.address,
    projectMessage: transformed.project.message,
    submissionId: transformed.submission.id,
    uploadedMedia: transformed.uploadedMedia,
    uplodedDocuments: transformed.uplodedDocuments,
    uploadedVideos: transformed.uploadedVideos
  });

  return transformed;
}

function enhancePayloadWithAdminUrls(payload: any, notification: NotificationQueue): any {
  // Create enhanced payload with admin URLs
  const enhanced = { ...payload };
  
  // Extract request ID from payload if available
  const requestId = payload.submission?.id || notification.id;
  
  // Determine base URL based on environment
  // In production, this should be the actual domain
  const baseUrl = process.env.ADMIN_BASE_URL || 'https://d200k2wsaf8th3.amplifyapp.com';
  
  // Create admin URLs
  enhanced.admin = enhanced.admin || {};
  enhanced.admin.requestUrl = `${baseUrl}/admin/requests/${requestId}`;
  enhanced.admin.dashboardUrl = `${baseUrl}/admin/requests`;
  
  console.log(`🔗 Enhanced payload with admin URLs:`, {
    requestId,
    requestUrl: enhanced.admin.requestUrl,
    dashboardUrl: enhanced.admin.dashboardUrl
  });
  
  return enhanced;
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