import { generateClient } from 'aws-amplify/api';

const client = generateClient();

interface RetryOptions {
  maxRetries?: number;
  delaySeconds?: number;
  priority?: 'low' | 'medium' | 'high';
}

interface NotificationRetryResult {
  success: boolean;
  notificationId: string;
  retryCount: number;
  errorMessage?: string;
  nextRetryAt?: string;
}

export class NotificationRetryService {
  private static instance: NotificationRetryService;
  private readonly defaultMaxRetries = 3;
  private readonly defaultDelaySeconds = 300; // 5 minutes

  static getInstance(): NotificationRetryService {
    if (!NotificationRetryService.instance) {
      NotificationRetryService.instance = new NotificationRetryService();
    }
    return NotificationRetryService.instance;
  }

  /**
   * Retry a failed notification
   */
  async retryNotification(
    notificationId: string, 
    options: RetryOptions = {}
  ): Promise<NotificationRetryResult> {
    try {
      console.log(`🔄 Retrying notification: ${notificationId}`);

      // 1. Get current notification details
      const getQuery = `
        query GetNotificationQueue($id: ID!) {
          getNotificationQueue(id: $id) {
            id
            status
            retryCount
            errorMessage
            eventType
            templateId
            recipientIds
            deliveryChannel
            priority
            payload
            createdAt
          }
        }
      `;

      const currentResult = await client.graphql({
        query: getQuery,
        variables: { id: notificationId },
        authMode: 'apiKey'
      }) as any;

      const notification = currentResult.data?.getNotificationQueue;
      if (!notification) {
        throw new Error('Notification not found');
      }

      // 2. Check if retry is allowed
      const currentRetryCount = notification.retryCount || 0;
      const maxRetries = options.maxRetries || this.defaultMaxRetries;
      
      if (currentRetryCount >= maxRetries) {
        throw new Error(`Maximum retry limit (${maxRetries}) reached`);
      }

      // 3. Update notification status and retry information
      const newRetryCount = currentRetryCount + 1;
      const nextRetryAt = new Date(
        Date.now() + (options.delaySeconds || this.defaultDelaySeconds) * 1000
      ).toISOString();

      const updateQuery = `
        mutation UpdateNotificationQueue($input: UpdateNotificationQueueInput!) {
          updateNotificationQueue(input: $input) {
            id
            status
            retryCount
            lastRetryAt
            errorMessage
            updatedAt
          }
        }
      `;

      const updateResult = await client.graphql({
        query: updateQuery,
        variables: {
          input: {
            id: notificationId,
            status: 'PENDING',
            retryCount: newRetryCount,
            lastRetryAt: new Date().toISOString(),
            errorMessage: null, // Clear previous error
            priority: options.priority || notification.priority
          }
        },
        authMode: 'apiKey'
      }) as any;

      console.log(`✅ Notification ${notificationId} queued for retry (${newRetryCount}/${maxRetries})`);

      return {
        success: true,
        notificationId,
        retryCount: newRetryCount,
        nextRetryAt
      };

    } catch (error: any) {
      console.error('Error retrying notification:', error);
      
      return {
        success: false,
        notificationId,
        retryCount: 0,
        errorMessage: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Retry multiple notifications in batch
   */
  async retryMultipleNotifications(
    notificationIds: string[],
    options: RetryOptions = {}
  ): Promise<NotificationRetryResult[]> {
    console.log(`🔄 Batch retry requested for ${notificationIds.length} notifications`);

    const results: NotificationRetryResult[] = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < notificationIds.length; i += batchSize) {
      const batch = notificationIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(id => this.retryNotification(id, options));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < notificationIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch retry completed: ${successCount}/${notificationIds.length} successful`);

    return results;
  }

  /**
   * Mark a notification as permanently failed
   */
  async markAsFailed(
    notificationId: string, 
    errorMessage: string
  ): Promise<boolean> {
    try {
      console.log(`❌ Marking notification as failed: ${notificationId}`);

      const updateQuery = `
        mutation UpdateNotificationQueue($input: UpdateNotificationQueueInput!) {
          updateNotificationQueue(input: $input) {
            id
            status
            errorMessage
            updatedAt
          }
        }
      `;

      await client.graphql({
        query: updateQuery,
        variables: {
          input: {
            id: notificationId,
            status: 'FAILED',
            errorMessage
          }
        },
        authMode: 'apiKey'
      });

      console.log(`✅ Notification ${notificationId} marked as permanently failed`);
      return true;

    } catch (error) {
      console.error('Error marking notification as failed:', error);
      return false;
    }
  }

  /**
   * Get retry statistics
   */
  async getRetryStatistics(): Promise<{
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    averageRetryCount: number;
  }> {
    try {
      const query = `
        query ListNotificationQueues($limit: Int) {
          listNotificationQueues(limit: $limit) {
            items {
              id
              status
              retryCount
              lastRetryAt
            }
          }
        }
      `;

      const result = await client.graphql({
        query,
        variables: { limit: 1000 },
        authMode: 'apiKey'
      }) as any;

      const notifications = result.data?.listNotificationQueues?.items || [];
      
      const retriedNotifications = notifications.filter((n: any) => 
        n.retryCount && n.retryCount > 0
      );

      const totalRetries = retriedNotifications.reduce(
        (sum: number, n: any) => sum + (n.retryCount || 0), 
        0
      );

      const successfulRetries = retriedNotifications.filter(
        (n: any) => n.status === 'SENT'
      ).length;

      const failedRetries = retriedNotifications.filter(
        (n: any) => n.status === 'FAILED'
      ).length;

      const averageRetryCount = retriedNotifications.length > 0
        ? totalRetries / retriedNotifications.length
        : 0;

      return {
        totalRetries,
        successfulRetries,
        failedRetries,
        averageRetryCount
      };

    } catch (error) {
      console.error('Error getting retry statistics:', error);
      return {
        totalRetries: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageRetryCount: 0
      };
    }
  }

  /**
   * Trigger manual Lambda processing
   * This would typically call the Lambda function directly
   */
  async triggerManualProcessing(): Promise<boolean> {
    try {
      console.log('🚀 Triggering manual notification processing...');
      
      // In a real implementation, this would:
      // 1. Call AWS Lambda function directly
      // 2. Or trigger EventBridge event
      // 3. Or use AWS SDK to invoke the processor
      
      // For now, we'll simulate the trigger
      console.log('✅ Manual processing trigger sent (simulation)');
      
      return true;
    } catch (error) {
      console.error('Error triggering manual processing:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationRetryService = NotificationRetryService.getInstance();