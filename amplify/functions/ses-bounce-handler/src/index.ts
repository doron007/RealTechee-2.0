import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient } from '@aws-sdk/client-ses';

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION });

// Environment variables
const EMAIL_SUPPRESSION_LIST_TABLE = process.env.EMAIL_SUPPRESSION_LIST_TABLE || '';
const NOTIFICATION_EVENTS_TABLE = process.env.NOTIFICATION_EVENTS_TABLE || '';
const SES_REPUTATION_METRICS_TABLE = process.env.SES_REPUTATION_METRICS_TABLE || '';

interface SESSNSMessage {
  Type: string;
  Timestamp: string;
  MessageId: string;
  Message: string;
}

interface BounceNotification {
  notificationType: 'Bounce';
  bounce: {
    bounceType: 'Permanent' | 'Transient';
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
    reportingMTA?: string;
  };
  mail: {
    timestamp: string;
    messageId: string;
    source: string;
    sourceArn?: string;
    destination: string[];
    tags?: Record<string, string>;
    commonHeaders?: {
      from: string[];
      to: string[];
      subject: string;
    };
  };
}

interface ComplaintNotification {
  notificationType: 'Complaint';
  complaint: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    complaintSubType?: string;
    userAgent?: string;
    complaintFeedbackType?: string;
    arrivalDate?: string;
  };
  mail: {
    timestamp: string;
    messageId: string;
    source: string;
    sourceArn?: string;
    destination: string[];
    tags?: Record<string, string>;
    commonHeaders?: {
      from: string[];
      to: string[];
      subject: string;
    };
  };
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log('🚨 SES Bounce/Complaint Handler started', { 
    messageCount: event.Records.length,
    timestamp: new Date().toISOString()
  });

  for (const record of event.Records) {
    try {
      await processMessage(record.body);
    } catch (error) {
      console.error('❌ Failed to process SQS message:', error, {
        messageId: record.messageId,
        body: record.body
      });
      
      // Don't throw - continue processing other messages
      // SQS will handle retries based on DLQ configuration
    }
  }

  console.log('✅ SES Bounce/Complaint Handler completed');
};

async function processMessage(messageBody: string): Promise<void> {
  const snsMessage: SESSNSMessage = JSON.parse(messageBody);
  
  if (snsMessage.Type !== 'Notification') {
    console.log('📋 Skipping non-notification message type:', snsMessage.Type);
    return;
  }

  const notification = JSON.parse(snsMessage.Message);
  console.log('📧 Processing SES notification:', {
    type: notification.notificationType,
    messageId: notification.mail?.messageId,
    timestamp: notification.bounce?.timestamp || notification.complaint?.timestamp
  });

  if (notification.notificationType === 'Bounce') {
    await processBounceNotification(notification as BounceNotification);
  } else if (notification.notificationType === 'Complaint') {
    await processComplaintNotification(notification as ComplaintNotification);
  } else {
    console.log('⚠️ Unknown notification type:', notification.notificationType);
  }
}

async function processBounceNotification(notification: BounceNotification): Promise<void> {
  const { bounce, mail } = notification;
  
  console.log('⚠️ Processing bounce notification:', {
    bounceType: bounce.bounceType,
    bounceSubType: bounce.bounceSubType,
    recipientCount: bounce.bouncedRecipients.length,
    messageId: mail.messageId
  });

  for (const recipient of bounce.bouncedRecipients) {
    const emailAddress = recipient.emailAddress.toLowerCase();
    
    // Add to suppression list
    await addToSuppressionList({
      emailAddress,
      suppressionType: 'BOUNCE',
      reason: `${bounce.bounceType} bounce: ${bounce.bounceSubType}`,
      bounceType: bounce.bounceType,
      bounceSubType: bounce.bounceSubType,
      originalMessageId: mail.messageId,
      metadata: {
        feedbackId: bounce.feedbackId,
        diagnosticCode: recipient.diagnosticCode,
        status: recipient.status,
        reportingMTA: bounce.reportingMTA,
        timestamp: bounce.timestamp,
        sourceArn: mail.sourceArn
      }
    });

    // Log bounce event
    await logNotificationEvent({
      eventType: 'EMAIL_BOUNCE',
      recipient: emailAddress,
      provider: 'SES',
      providerId: mail.messageId,
      providerStatus: bounce.bounceSubType,
      errorCode: bounce.bounceType,
      errorMessage: `${bounce.bounceType} bounce: ${bounce.bounceSubType}`,
      metadata: {
        feedbackId: bounce.feedbackId,
        diagnosticCode: recipient.diagnosticCode,
        bounceTimestamp: bounce.timestamp
      }
    });

    // For permanent bounces, also add to SES account-level suppression list
    if (bounce.bounceType === 'Permanent') {
      // TODO: Implement SES v2 account suppression list API integration
      // For now, we rely on our application-level suppression list
      console.log(`📋 TODO: Add ${emailAddress} to SES account suppression list (permanent bounce)`);
    }
  }

  // Update reputation metrics
  await updateReputationMetrics('bounce');
}

async function processComplaintNotification(notification: ComplaintNotification): Promise<void> {
  const { complaint, mail } = notification;
  
  console.log('🚫 Processing complaint notification:', {
    complaintType: complaint.complaintFeedbackType,
    recipientCount: complaint.complainedRecipients.length,
    messageId: mail.messageId
  });

  for (const recipient of complaint.complainedRecipients) {
    const emailAddress = recipient.emailAddress.toLowerCase();
    
    // Add to suppression list
    await addToSuppressionList({
      emailAddress,
      suppressionType: 'COMPLAINT',
      reason: `Spam complaint: ${complaint.complaintFeedbackType || 'Unknown'}`,
      complaintType: complaint.complaintFeedbackType,
      originalMessageId: mail.messageId,
      metadata: {
        feedbackId: complaint.feedbackId,
        userAgent: complaint.userAgent,
        arrivalDate: complaint.arrivalDate,
        timestamp: complaint.timestamp,
        sourceArn: mail.sourceArn
      }
    });

    // Log complaint event
    await logNotificationEvent({
      eventType: 'EMAIL_COMPLAINT',
      recipient: emailAddress,
      provider: 'SES',
      providerId: mail.messageId,
      providerStatus: complaint.complaintFeedbackType || 'Unknown',
      errorCode: 'COMPLAINT',
      errorMessage: `Spam complaint: ${complaint.complaintFeedbackType || 'Unknown'}`,
      metadata: {
        feedbackId: complaint.feedbackId,
        userAgent: complaint.userAgent,
        complaintTimestamp: complaint.timestamp
      }
    });

    // Always add complaints to SES account-level suppression list
    // TODO: Implement SES v2 account suppression list API integration
    // For now, we rely on our application-level suppression list
    console.log(`📋 TODO: Add ${emailAddress} to SES account suppression list (complaint)`);
    
  }

  // Update reputation metrics
  await updateReputationMetrics('complaint');
}

async function addToSuppressionList(params: {
  emailAddress: string;
  suppressionType: 'BOUNCE' | 'COMPLAINT';
  reason: string;
  bounceType?: 'Permanent' | 'Transient';
  bounceSubType?: string;
  complaintType?: string;
  originalMessageId: string;
  metadata: any;
}): Promise<void> {
  const {
    emailAddress,
    suppressionType,
    reason,
    bounceType,
    bounceSubType,
    complaintType,
    originalMessageId,
    metadata
  } = params;

  const suppressionRecord = {
    id: `${emailAddress}-${Date.now()}`, // Unique ID
    emailAddress,
    suppressionType,
    reason,
    ...(bounceType && { bounceType }),
    ...(bounceSubType && { bounceSubType }),
    ...(complaintType && { complaintType }),
    originalMessageId,
    suppressedAt: new Date().toISOString(),
    source: 'SES_NOTIFICATION',
    metadata,
    isActive: true,
    owner: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'ses-bounce-handler'
  };

  try {
    await docClient.send(new PutCommand({
      TableName: EMAIL_SUPPRESSION_LIST_TABLE,
      Item: suppressionRecord
    }));

    console.log(`✅ Added ${emailAddress} to suppression list`, {
      type: suppressionType,
      reason: reason
    });
  } catch (error) {
    console.error(`❌ Failed to add ${emailAddress} to suppression list:`, error);
    throw error;
  }
}

async function logNotificationEvent(params: {
  eventType: string;
  recipient: string;
  provider: string;
  providerId: string;
  providerStatus: string;
  errorCode: string;
  errorMessage: string;
  metadata: any;
}): Promise<void> {
  const eventRecord = {
    eventId: `${params.providerId}-${params.eventType}-${Date.now()}`,
    notificationId: params.providerId,
    eventType: params.eventType,
    channel: 'EMAIL',
    recipient: params.recipient,
    provider: params.provider,
    providerId: params.providerId,
    providerStatus: params.providerStatus,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    metadata: params.metadata,
    timestamp: new Date().toISOString(),
    owner: 'system',
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
  };

  try {
    await docClient.send(new PutCommand({
      TableName: NOTIFICATION_EVENTS_TABLE,
      Item: eventRecord
    }));

    console.log(`✅ Logged ${params.eventType} event for ${params.recipient}`);
  } catch (error) {
    console.error(`❌ Failed to log ${params.eventType} event:`, error);
    // Don't throw - logging is non-critical
  }
}

async function updateReputationMetrics(eventType: 'bounce' | 'complaint'): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  try {
    // Check if today's metrics exist
    const queryResult = await docClient.send(new QueryCommand({
      TableName: SES_REPUTATION_METRICS_TABLE,
      KeyConditionExpression: 'metricDate = :date',
      ExpressionAttributeValues: {
        ':date': today
      }
    }));

    if (queryResult.Items && queryResult.Items.length > 0) {
      // Update existing record
      const updateExpression = eventType === 'bounce' 
        ? 'ADD totalBounces :inc SET updatedAt = :now'
        : 'ADD totalComplaints :inc SET updatedAt = :now';
      
      await docClient.send(new UpdateCommand({
        TableName: SES_REPUTATION_METRICS_TABLE,
        Key: { id: queryResult.Items[0].id },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
          ':inc': 1,
          ':now': new Date().toISOString()
        }
      }));
    } else {
      // Create new record for today
      const metricsRecord = {
        id: `metrics-${today}`,
        metricDate: today,
        totalEmailsSent: 0,
        totalBounces: eventType === 'bounce' ? 1 : 0,
        totalComplaints: eventType === 'complaint' ? 1 : 0,
        bounceRate: 0,
        complaintRate: 0,
        deliveryRate: 0,
        bounceRateAlert: false,
        complaintRateAlert: false,
        owner: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await docClient.send(new PutCommand({
        TableName: SES_REPUTATION_METRICS_TABLE,
        Item: metricsRecord
      }));
    }

    console.log(`✅ Updated reputation metrics for ${eventType}`);
  } catch (error) {
    console.error(`❌ Failed to update reputation metrics:`, error);
    // Don't throw - metrics are non-critical
  }
}