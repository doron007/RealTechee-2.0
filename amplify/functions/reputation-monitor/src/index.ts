import { ScheduledEvent, ScheduledHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, GetSendQuotaCommand, GetSendStatisticsCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Initialize clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

// Environment variables
const SES_REPUTATION_METRICS_TABLE = process.env.SES_REPUTATION_METRICS_TABLE || '';
const NOTIFICATION_EVENTS_TABLE = process.env.NOTIFICATION_EVENTS_TABLE || '';
const ALERT_SNS_TOPIC_ARN = process.env.ALERT_SNS_TOPIC_ARN || '';

// Alert thresholds
const BOUNCE_RATE_THRESHOLD = 5.0; // 5%
const COMPLAINT_RATE_THRESHOLD = 0.1; // 0.1%
const QUOTA_USAGE_THRESHOLD = 80.0; // 80% of daily quota

export const handler: ScheduledHandler = async (event: ScheduledEvent) => {
  console.log('📊 Starting SES reputation monitoring', { 
    time: event.time,
    scheduleExpression: event.detail?.['scheduled-event']?.['schedule-expression']
  });

  try {
    // Update daily metrics
    const metrics = await updateDailyMetrics();
    
    if (!metrics) {
      console.warn('⚠️ Failed to update metrics, skipping alert checks');
      return;
    }

    // Check for alerts
    await checkAndSendAlerts(metrics);

    console.log('✅ SES reputation monitoring completed', {
      bounceRate: `${metrics.bounceRate}%`,
      complaintRate: `${metrics.complaintRate}%`,
      deliveryRate: `${metrics.deliveryRate}%`,
      reputationScore: metrics.reputationScore
    });

  } catch (error) {
    console.error('❌ Error in reputation monitoring:', error);
    
    // Send error alert
    if (ALERT_SNS_TOPIC_ARN) {
      await sendAlert('SES Reputation Monitoring Error', `Error in reputation monitoring: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    throw error;
  }
};

async function updateDailyMetrics() {
  if (!SES_REPUTATION_METRICS_TABLE) {
    console.warn('⚠️ SES_REPUTATION_METRICS_TABLE not configured');
    return null;
  }

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const metricsId = `metrics-${today}`;

    // Get current SES send quota and statistics
    const [sendQuota, sendStats] = await Promise.all([
      getSendQuota(),
      getSendStatistics()
    ]);

    // Calculate totals from SES statistics (last 14 days)
    const totals = calculateTotals(sendStats);

    // Calculate rates
    const bounceRate = totals.totalSent > 0 ? (totals.totalBounces / totals.totalSent) * 100 : 0;
    const complaintRate = totals.totalSent > 0 ? (totals.totalComplaints / totals.totalSent) * 100 : 0;
    const deliveryRate = totals.totalSent > 0 ? ((totals.totalSent - totals.totalBounces - totals.totalComplaints) / totals.totalSent) * 100 : 0;

    // Check alert thresholds
    const bounceRateAlert = bounceRate > BOUNCE_RATE_THRESHOLD;
    const complaintRateAlert = complaintRate > COMPLAINT_RATE_THRESHOLD;
    const quotaUsagePercent = sendQuota.max24HourSend > 0 ? (sendQuota.sentLast24Hours / sendQuota.max24HourSend) * 100 : 0;
    const quotaAlert = quotaUsagePercent > QUOTA_USAGE_THRESHOLD;

    // Calculate reputation score (0-100, higher is better)
    const reputationScore = calculateReputationScore(bounceRate, complaintRate, deliveryRate);

    const metrics = {
      id: metricsId,
      metricDate: today,
      totalEmailsSent: totals.totalSent,
      totalBounces: totals.totalBounces,
      totalComplaints: totals.totalComplaints,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 100) / 100,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      reputationScore: Math.round(reputationScore * 100) / 100,
      sendingQuotaUsed: sendQuota.sentLast24Hours,
      sendingQuotaMax: sendQuota.max24HourSend,
      sendRateMax: sendQuota.maxSendRate,
      quotaUsagePercent: Math.round(quotaUsagePercent * 100) / 100,
      bounceRateAlert,
      complaintRateAlert,
      quotaAlert,
      owner: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save metrics to DynamoDB
    await docClient.send(new PutCommand({
      TableName: SES_REPUTATION_METRICS_TABLE,
      Item: metrics
    }));

    console.log(`✅ Updated reputation metrics for ${today}`, {
      bounceRate: `${bounceRate.toFixed(2)}%`,
      complaintRate: `${complaintRate.toFixed(2)}%`,
      deliveryRate: `${deliveryRate.toFixed(2)}%`,
      reputationScore: reputationScore.toFixed(2),
      quotaUsage: `${quotaUsagePercent.toFixed(2)}%`
    });

    return metrics;
  } catch (error) {
    console.error('❌ Error updating reputation metrics:', error);
    return null;
  }
}

async function checkAndSendAlerts(metrics: any) {
  const alerts = [];

  // Bounce rate alert
  if (metrics.bounceRateAlert) {
    alerts.push(`🚨 HIGH BOUNCE RATE: ${metrics.bounceRate}% exceeds threshold of ${BOUNCE_RATE_THRESHOLD}%`);
  }

  // Complaint rate alert  
  if (metrics.complaintRateAlert) {
    alerts.push(`🚨 HIGH COMPLAINT RATE: ${metrics.complaintRate}% exceeds threshold of ${COMPLAINT_RATE_THRESHOLD}%`);
  }

  // Quota usage alert
  if (metrics.quotaAlert) {
    alerts.push(`📊 HIGH QUOTA USAGE: ${metrics.quotaUsagePercent}% of daily sending quota used`);
  }

  // Low reputation score alert
  if (metrics.reputationScore < 70) {
    alerts.push(`📉 LOW REPUTATION SCORE: ${metrics.reputationScore}/100 - review sending practices`);
  }

  // Send alerts if any thresholds exceeded
  if (alerts.length > 0) {
    const alertMessage = `SES Reputation Alert - ${new Date().toISOString()}\n\n${alerts.join('\n')}\n\nMetrics Summary:\n- Bounce Rate: ${metrics.bounceRate}%\n- Complaint Rate: ${metrics.complaintRate}%\n- Delivery Rate: ${metrics.deliveryRate}%\n- Reputation Score: ${metrics.reputationScore}/100\n- Quota Usage: ${metrics.quotaUsagePercent}%`;
    
    await sendAlert('SES Reputation Alert', alertMessage);
    
    console.warn('🚨 SES reputation alerts sent:', alerts);
  } else {
    console.log('✅ No reputation alerts triggered');
  }
}

async function sendAlert(subject: string, message: string) {
  if (!ALERT_SNS_TOPIC_ARN) {
    console.warn('⚠️ ALERT_SNS_TOPIC_ARN not configured, logging alert instead');
    console.warn(`ALERT: ${subject}\n${message}`);
    return;
  }

  try {
    await snsClient.send(new PublishCommand({
      TopicArn: ALERT_SNS_TOPIC_ARN,
      Subject: subject,
      Message: message
    }));
    
    console.log(`📧 Alert sent: ${subject}`);
  } catch (error) {
    console.error('❌ Failed to send alert:', error);
  }
}

async function getSendQuota() {
  try {
    const result = await sesClient.send(new GetSendQuotaCommand({}));
    return {
      max24HourSend: result.Max24HourSend || 0,
      maxSendRate: result.MaxSendRate || 0,
      sentLast24Hours: result.SentLast24Hours || 0
    };
  } catch (error) {
    console.error('❌ Error getting SES send quota:', error);
    return { max24HourSend: 0, maxSendRate: 0, sentLast24Hours: 0 };
  }
}

async function getSendStatistics() {
  try {
    const result = await sesClient.send(new GetSendStatisticsCommand({}));
    return (result.SendDataPoints || []).map((point: any) => ({
      timestamp: point.Timestamp?.toISOString() || '',
      deliveryAttempts: point.DeliveryAttempts || 0,
      bounces: point.Bounces || 0,
      complaints: point.Complaints || 0,
      rejects: point.Rejects || 0
    }));
  } catch (error) {
    console.error('❌ Error getting SES send statistics:', error);
    return [];
  }
}

function calculateTotals(sendStats: any[]) {
  return sendStats.reduce(
    (totals, stat) => ({
      totalSent: totals.totalSent + stat.deliveryAttempts,
      totalBounces: totals.totalBounces + stat.bounces,
      totalComplaints: totals.totalComplaints + stat.complaints,
      totalRejects: totals.totalRejects + stat.rejects
    }),
    { totalSent: 0, totalBounces: 0, totalComplaints: 0, totalRejects: 0 }
  );
}

function calculateReputationScore(bounceRate: number, complaintRate: number, deliveryRate: number): number {
  let score = 100;

  // Bounce rate penalties
  if (bounceRate > 10) score -= 40;
  else if (bounceRate > 5) score -= 25;
  else if (bounceRate > 2) score -= 10;

  // Complaint rate penalties (more severe)
  if (complaintRate > 0.5) score -= 50;
  else if (complaintRate > 0.1) score -= 30;
  else if (complaintRate > 0.05) score -= 15;

  // Delivery rate bonuses
  if (deliveryRate > 98) score += 5;
  else if (deliveryRate < 90) score -= 15;
  else if (deliveryRate < 95) score -= 5;

  return Math.max(0, Math.min(100, score));
}