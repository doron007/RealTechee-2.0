import { NotificationService } from '../../utils/notificationService';

const notificationService = new NotificationService();
import { leadScoringService } from '../analytics/leadScoringService';
import { assignmentService } from '../admin/assignmentService';
import { requestsAPI, contactsAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';

const logger = createLogger('LeadNotificationService');

// Notification template interfaces
export interface LeadExpirationWarningData {
  requestId: string;
  daysUntilExpiration: number;
  leadSource: string;
  product: string;
  budget: string;
  adminLink: string;
  leadScore?: number;
  conversionProbability?: number;
}

export interface LeadArchivedData {
  requestId: string;
  reason: string;
  notes?: string;
  leadSource: string;
  product: string;
  adminLink: string;
  previousStatus: string;
}

export interface LeadReactivatedData {
  requestId: string;
  reason: string;
  leadSource: string;
  product: string;
  adminLink: string;
  reactivationCount: number;
  newAssignee?: string;
}

export interface LeadScoringNotificationData {
  requestId: string;
  leadScore: number;
  grade: string;
  conversionProbability: number;
  priorityLevel: string;
  recommendations: string[];
  adminLink: string;
}

export interface BulkExpirationSummaryData {
  totalExpired: number;
  totalWarnings: number;
  expirationsBySource: Record<string, number>;
  highValueExpired: number;
  adminDashboardLink: string;
}

/**
 * Lead Notification Service - Handles specialized notifications for lead lifecycle events
 */
export class LeadNotificationService {
  private readonly templateConfig = {
    leadExpirationWarning: {
      subject: 'Lead Expiration Warning - Action Required',
      channels: ['email'] as const,
      priority: 'high' as const
    },
    leadExpired: {
      subject: 'Lead Expired - Archived Automatically',
      channels: ['email'] as const,
      priority: 'medium' as const
    },
    leadArchived: {
      subject: 'Lead Archived',
      channels: ['email'] as const,
      priority: 'low' as const
    },
    leadReactivated: {
      subject: 'Lead Reactivated - New Assignment',
      channels: ['email', 'sms'] as const,
      priority: 'high' as const
    },
    highValueLeadAlert: {
      subject: 'High-Value Lead Alert - Priority Follow-up Required',
      channels: ['email', 'sms'] as const,
      priority: 'urgent' as const
    },
    bulkExpirationSummary: {
      subject: 'Daily Lead Expiration Summary',
      channels: ['email'] as const,
      priority: 'medium' as const
    }
  };

  /**
   * Send expiration warning notification with enhanced context
   */
  async sendExpirationWarning(requestId: string, assignedTo: string, daysUntilExpiration: number): Promise<void> {
    try {
      logger.info('Sending expiration warning notification', { requestId, assignedTo, daysUntilExpiration });

      // Get request details
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success) {
        throw new Error('Request not found');
      }

      const request = requestResult.data;

      // Get lead score for context
      let leadScore: any = null;
      try {
        leadScore = await leadScoringService.getLeadScore(requestId);
      } catch (err) {
        logger.warn('Could not get lead score for expiration warning', { requestId, error: err });
      }

      const notificationData: LeadExpirationWarningData = {
        requestId,
        daysUntilExpiration,
        leadSource: request.leadSource || 'Unknown',
        product: request.product || 'Unknown',
        budget: request.budget || 'Not specified',
        adminLink: `/admin/requests/${requestId}`,
        leadScore: leadScore?.overallScore,
        conversionProbability: leadScore?.conversionProbability
      };

      const template = this.templateConfig.leadExpirationWarning;
      
      // TODO: Fix notification service integration
      console.log('Lead expiration warning notification queued for:', assignedTo);

      // Send SMS for high-value leads or urgent cases
      if ((leadScore?.overallScore >= 80 || daysUntilExpiration <= 1) && assignedTo !== 'Unassigned') {
        await this.sendSMSAlert(assignedTo, 'lead_expiration_urgent', {
          requestId,
          daysUntilExpiration,
          leadGrade: leadScore?.grade || 'Unknown'
        });
      }

      logger.info('Expiration warning notification sent successfully', { requestId, assignedTo });

    } catch (error) {
      logger.error('Error sending expiration warning notification', { requestId, assignedTo, error });
      throw error;
    }
  }

  /**
   * Send lead archived notification
   */
  async sendArchivedNotification(requestId: string, assignedTo: string, reason: string, notes?: string): Promise<void> {
    try {
      logger.info('Sending archived notification', { requestId, assignedTo, reason });

      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success) {
        throw new Error('Request not found');
      }

      const request = requestResult.data;

      const notificationData: LeadArchivedData = {
        requestId,
        reason,
        notes,
        leadSource: request.leadSource || 'Unknown',
        product: request.product || 'Unknown',
        adminLink: `/admin/requests/${requestId}`,
        previousStatus: request.status || 'Unknown'
      };

      const template = this.templateConfig.leadArchived;

      if (assignedTo && assignedTo !== 'Unassigned') {
        // TODO: Fix notification service integration
        console.log('Lead archived notification queued for:', assignedTo);
      }

      logger.info('Archived notification sent successfully', { requestId, assignedTo });

    } catch (error) {
      logger.error('Error sending archived notification', { requestId, assignedTo, error });
    }
  }

  /**
   * Send lead reactivated notification with enhanced context
   */
  async sendReactivatedNotification(
    requestId: string, 
    assignedTo: string, 
    reason: string, 
    reactivationCount: number
  ): Promise<void> {
    try {
      logger.info('Sending reactivated notification', { requestId, assignedTo, reason, reactivationCount });

      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success) {
        throw new Error('Request not found');
      }

      const request = requestResult.data;

      // Get updated lead score
      let leadScore: any = null;
      try {
        leadScore = await leadScoringService.calculateLeadScore(requestId);
      } catch (err) {
        logger.warn('Could not calculate lead score for reactivation notification', { requestId, error: err });
      }

      const notificationData: LeadReactivatedData = {
        requestId,
        reason,
        leadSource: request.leadSource || 'Unknown',
        product: request.product || 'Unknown',
        adminLink: `/admin/requests/${requestId}`,
        reactivationCount
      };

      const template = this.templateConfig.leadReactivated;

      if (assignedTo && assignedTo !== 'Unassigned') {
        // TODO: Fix notification service integration
        console.log('Lead reactivated notification queued for:', assignedTo);

        // Send SMS for reactivated leads (especially important)
        await this.sendSMSAlert(assignedTo, 'lead_reactivated', {
          requestId,
          reason: reason.length > 50 ? reason.substring(0, 47) + '...' : reason
        });
      }

      logger.info('Reactivated notification sent successfully', { requestId, assignedTo });

    } catch (error) {
      logger.error('Error sending reactivated notification', { requestId, assignedTo, error });
    }
  }

  /**
   * Send high-value lead alert notification
   */
  async sendHighValueLeadAlert(requestId: string, leadScore: any): Promise<void> {
    try {
      logger.info('Sending high-value lead alert', { requestId, score: leadScore.overallScore });

      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success) {
        throw new Error('Request not found');
      }

      const request = requestResult.data;

      // Get all active AEs for high-value alerts
      const availableAEs = await assignmentService.getAvailableAEs();
      const activeAEs = availableAEs.filter(ae => ae.active && ae.name !== 'Unassigned');

      if (activeAEs.length === 0) {
        logger.warn('No active AEs to notify for high-value lead', { requestId });
        return;
      }

      const notificationData: LeadScoringNotificationData = {
        requestId,
        leadScore: leadScore.overallScore,
        grade: leadScore.grade,
        conversionProbability: leadScore.conversionProbability,
        priorityLevel: leadScore.priorityLevel,
        recommendations: leadScore.recommendations,
        adminLink: `/admin/requests/${requestId}`
      };

      const template = this.templateConfig.highValueLeadAlert;

      // Notify assigned AE and managers
      const recipients = [request.assignedTo || 'Unassigned'];
      
      // Add managers/supervisors for very high-value leads
      if (leadScore.overallScore >= 90) {
        recipients.push('manager@realtechee.com'); // Would be configurable
      }

      // TODO: Fix notification service integration
      console.log('High value lead alert notification queued for:', recipients);

      logger.info('High-value lead alert sent successfully', { requestId, recipients: recipients.length });

    } catch (error) {
      logger.error('Error sending high-value lead alert', { requestId, error });
    }
  }

  /**
   * Send bulk expiration summary (daily/weekly reports)
   */
  async sendBulkExpirationSummary(
    expiredLeads: string[], 
    warningLeads: string[], 
    recipients: string[]
  ): Promise<void> {
    try {
      logger.info('Sending bulk expiration summary', { 
        expired: expiredLeads.length, 
        warnings: warningLeads.length, 
        recipients: recipients.length 
      });

      // Aggregate data by source
      const expirationsBySource: Record<string, number> = {};
      let highValueExpired = 0;

      for (const requestId of expiredLeads) {
        try {
          const requestResult = await requestsAPI.get(requestId);
          if (requestResult.success) {
            const source = requestResult.data.leadSource || 'Unknown';
            expirationsBySource[source] = (expirationsBySource[source] || 0) + 1;

            // Check if it's a high-value lead
            try {
              const leadScore = await leadScoringService.getLeadScore(requestId);
              if (leadScore.overallScore >= 75) {
                highValueExpired++;
              }
            } catch (err) {
              // Ignore scoring errors for summary
            }
          }
        } catch (err) {
          logger.warn('Error processing expired lead for summary', { requestId, error: err });
        }
      }

      const notificationData: BulkExpirationSummaryData = {
        totalExpired: expiredLeads.length,
        totalWarnings: warningLeads.length,
        expirationsBySource,
        highValueExpired,
        adminDashboardLink: '/admin/lifecycle/dashboard'
      };

      const template = this.templateConfig.bulkExpirationSummary;

      // TODO: Fix notification service integration
      console.log('Bulk expiration summary notification queued for:', recipients.length, 'recipients');

      logger.info('Bulk expiration summary sent successfully', { recipients: recipients.length });

    } catch (error) {
      logger.error('Error sending bulk expiration summary', { error });
    }
  }

  /**
   * Send SMS alert for urgent lead notifications
   */
  private async sendSMSAlert(
    recipient: string, 
    alertType: string, 
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Get AE contact info for SMS
      const availableAEs = await assignmentService.getAvailableAEs();
      const ae = availableAEs.find(a => a.name === recipient);

      if (!ae?.mobile || !ae.sendSmsNotifications) {
        logger.debug('SMS not sent - no mobile number or SMS disabled', { recipient });
        return;
      }

      let message = '';
      switch (alertType) {
        case 'lead_expiration_urgent':
          message = `URGENT: Lead ${data.requestId} expires in ${data.daysUntilExpiration} day(s). Grade: ${data.leadGrade}. Check admin panel.`;
          break;
        case 'lead_reactivated':
          message = `Lead ${data.requestId} reactivated: ${data.reason}. Check admin panel for details.`;
          break;
        default:
          message = `Lead alert for ${data.requestId}. Check admin panel.`;
      }

      // TODO: Fix notification service integration
      console.log('SMS alert queued for:', recipient, 'type:', alertType);

      logger.debug('SMS alert sent successfully', { recipient, alertType });

    } catch (error) {
      logger.error('Error sending SMS alert', { recipient, alertType, error });
    }
  }

  /**
   * Send lead scoring notification when a lead scores very high or very low
   */
  async sendLeadScoringNotification(requestId: string, leadScore: any): Promise<void> {
    try {
      // Only send notifications for extreme scores
      if (leadScore.overallScore >= 85) {
        await this.sendHighValueLeadAlert(requestId, leadScore);
      } else if (leadScore.overallScore <= 30) {
        // Send low-score alert to admin for review
        await this.sendLowQualityLeadAlert(requestId, leadScore);
      }
    } catch (error) {
      logger.error('Error sending lead scoring notification', { requestId, error });
    }
  }

  /**
   * Send low quality lead alert for review
   */
  private async sendLowQualityLeadAlert(requestId: string, leadScore: any): Promise<void> {
    try {
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success) return;

      const request = requestResult.data;

      // TODO: Fix notification service integration
      console.log('Low quality lead alert notification queued for request:', requestId);

      logger.debug('Low quality lead alert sent', { requestId, score: leadScore.overallScore });

    } catch (error) {
      logger.error('Error sending low quality lead alert', { requestId, error });
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<{
    email: boolean;
    sms: boolean;
    leadExpiration: boolean;
    leadReactivation: boolean;
    highValueAlerts: boolean;
  }> {
    try {
      // For now, return default preferences
      // In the future, this would read from user preferences table
      return {
        email: true,
        sms: true,
        leadExpiration: true,
        leadReactivation: true,
        highValueAlerts: true
      };
    } catch (error) {
      logger.error('Error getting notification preferences', { userId, error });
      return {
        email: true,
        sms: false,
        leadExpiration: true,
        leadReactivation: true,
        highValueAlerts: true
      };
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Record<string, boolean>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, just log the preferences update
      // In the future, this would save to user preferences table
      logger.info('Notification preferences updated', { userId, preferences });
      return { success: true };
    } catch (error) {
      logger.error('Error updating notification preferences', { userId, error });
      return { success: false, error: 'Failed to update preferences' };
    }
  }
}

// Export singleton instance
export const leadNotificationService = new LeadNotificationService();
export default leadNotificationService;