import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, GetSendQuotaCommand, GetSendStatisticsCommand } from '@aws-sdk/client-ses';

export interface ReputationMetrics {
  metricDate: string;
  totalEmailsSent: number;
  totalBounces: number;
  totalComplaints: number;
  bounceRate: number;
  complaintRate: number;
  deliveryRate: number;
  reputationScore?: number;
  sendingQuotaUsed: number;
  sendingQuotaMax: number;
  sendRateMax: number;
  bounceRateAlert: boolean;
  complaintRateAlert: boolean;
}

export interface SendStatistic {
  timestamp: string;
  deliveryAttempts: number;
  bounces: number;
  complaints: number;
  rejects: number;
}

export class ReputationMonitoringService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private sesClient: SESClient;
  private metricsTableName: string;

  // Alert thresholds (AWS SES recommendations)
  private readonly BOUNCE_RATE_THRESHOLD = 5.0; // 5%
  private readonly COMPLAINT_RATE_THRESHOLD = 0.1; // 0.1%

  constructor() {
    this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.sesClient = new SESClient({ region: process.env.AWS_REGION });
    this.metricsTableName = process.env.SES_REPUTATION_METRICS_TABLE || '';
    
    if (!this.metricsTableName) {
      console.warn('⚠️ SES_REPUTATION_METRICS_TABLE environment variable not set');
    }
  }

  /**
   * Update daily reputation metrics
   */
  async updateDailyMetrics(): Promise<ReputationMetrics | null> {
    if (!this.metricsTableName) {
      console.warn('⚠️ Reputation metrics table not configured');
      return null;
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const metricsId = `metrics-${today}`;

      // Get current SES send quota and statistics
      const [sendQuota, sendStats] = await Promise.all([
        this.getSendQuota(),
        this.getSendStatistics()
      ]);

      // Calculate totals from SES statistics (last 14 days)
      const totals = this.calculateTotals(sendStats);

      // Calculate rates
      const bounceRate = totals.totalSent > 0 ? (totals.totalBounces / totals.totalSent) * 100 : 0;
      const complaintRate = totals.totalSent > 0 ? (totals.totalComplaints / totals.totalSent) * 100 : 0;
      const deliveryRate = totals.totalSent > 0 ? ((totals.totalSent - totals.totalBounces - totals.totalComplaints) / totals.totalSent) * 100 : 0;

      // Check alert thresholds
      const bounceRateAlert = bounceRate > this.BOUNCE_RATE_THRESHOLD;
      const complaintRateAlert = complaintRate > this.COMPLAINT_RATE_THRESHOLD;

      // Calculate reputation score (0-100, higher is better)
      const reputationScore = this.calculateReputationScore(bounceRate, complaintRate, deliveryRate);

      const metrics: ReputationMetrics = {
        metricDate: today,
        totalEmailsSent: totals.totalSent,
        totalBounces: totals.totalBounces,
        totalComplaints: totals.totalComplaints,
        bounceRate: Math.round(bounceRate * 100) / 100, // Round to 2 decimal places
        complaintRate: Math.round(complaintRate * 100) / 100,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        reputationScore: Math.round(reputationScore * 100) / 100,
        sendingQuotaUsed: sendQuota.sentLast24Hours,
        sendingQuotaMax: sendQuota.max24HourSend,
        sendRateMax: sendQuota.maxSendRate,
        bounceRateAlert,
        complaintRateAlert
      };

      // Update or create metrics record
      await this.docClient.send(new PutCommand({
        TableName: this.metricsTableName,
        Item: {
          id: metricsId,
          ...metrics,
          owner: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));

      console.log(`✅ Updated reputation metrics for ${today}`, {
        bounceRate: `${bounceRate.toFixed(2)}%`,
        complaintRate: `${complaintRate.toFixed(2)}%`,
        deliveryRate: `${deliveryRate.toFixed(2)}%`,
        reputationScore: reputationScore.toFixed(2),
        alerts: {
          bounceRateAlert,
          complaintRateAlert
        }
      });

      // Log alerts if thresholds exceeded
      if (bounceRateAlert) {
        console.warn(`🚨 BOUNCE RATE ALERT: ${bounceRate.toFixed(2)}% exceeds threshold of ${this.BOUNCE_RATE_THRESHOLD}%`);
      }
      if (complaintRateAlert) {
        console.warn(`🚨 COMPLAINT RATE ALERT: ${complaintRate.toFixed(2)}% exceeds threshold of ${this.COMPLAINT_RATE_THRESHOLD}%`);
      }

      return metrics;
    } catch (error) {
      console.error('❌ Error updating reputation metrics:', error);
      return null;
    }
  }

  /**
   * Get reputation metrics for a specific date
   */
  async getMetricsForDate(date: string): Promise<ReputationMetrics | null> {
    if (!this.metricsTableName) {
      return null;
    }

    try {
      const metricsId = `metrics-${date}`;
      const result = await this.docClient.send(new GetCommand({
        TableName: this.metricsTableName,
        Key: { id: metricsId }
      }));

      return result.Item as ReputationMetrics || null;
    } catch (error) {
      console.error(`❌ Error fetching metrics for ${date}:`, error);
      return null;
    }
  }

  /**
   * Get reputation metrics for the last N days
   */
  async getRecentMetrics(days: number = 30): Promise<ReputationMetrics[]> {
    if (!this.metricsTableName) {
      return [];
    }

    try {
      const result = await this.docClient.send(new ScanCommand({
        TableName: this.metricsTableName,
        Limit: days
      }));

      const metrics = (result.Items as ReputationMetrics[]) || [];
      
      // Sort by date (most recent first)
      return metrics.sort((a, b) => b.metricDate.localeCompare(a.metricDate));
    } catch (error) {
      console.error('❌ Error fetching recent metrics:', error);
      return [];
    }
  }

  /**
   * Check if current rates exceed alert thresholds
   */
  async checkAlertThresholds(): Promise<{
    bounceRateAlert: boolean;
    complaintRateAlert: boolean;
    currentBounceRate: number;
    currentComplaintRate: number;
  }> {
    try {
      const sendStats = await this.getSendStatistics();
      const totals = this.calculateTotals(sendStats);

      const bounceRate = totals.totalSent > 0 ? (totals.totalBounces / totals.totalSent) * 100 : 0;
      const complaintRate = totals.totalSent > 0 ? (totals.totalComplaints / totals.totalSent) * 100 : 0;

      return {
        bounceRateAlert: bounceRate > this.BOUNCE_RATE_THRESHOLD,
        complaintRateAlert: complaintRate > this.COMPLAINT_RATE_THRESHOLD,
        currentBounceRate: Math.round(bounceRate * 100) / 100,
        currentComplaintRate: Math.round(complaintRate * 100) / 100
      };
    } catch (error) {
      console.error('❌ Error checking alert thresholds:', error);
      return {
        bounceRateAlert: false,
        complaintRateAlert: false,
        currentBounceRate: 0,
        currentComplaintRate: 0
      };
    }
  }

  private async getSendQuota() {
    try {
      const result = await this.sesClient.send(new GetSendQuotaCommand({}));
      return {
        max24HourSend: result.Max24HourSend || 0,
        maxSendRate: result.MaxSendRate || 0,
        sentLast24Hours: result.SentLast24Hours || 0
      };
    } catch (error) {
      console.error('❌ Error getting SES send quota:', error);
      return {
        max24HourSend: 0,
        maxSendRate: 0,
        sentLast24Hours: 0
      };
    }
  }

  private async getSendStatistics(): Promise<SendStatistic[]> {
    try {
      const result = await this.sesClient.send(new GetSendStatisticsCommand({}));
      return (result.SendDataPoints || []).map(point => ({
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

  private calculateTotals(sendStats: SendStatistic[]) {
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

  private calculateReputationScore(bounceRate: number, complaintRate: number, deliveryRate: number): number {
    // Custom reputation score algorithm
    // Starts at 100 and deducts points for poor metrics
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
}