/**
 * Meeting Notification Service
 * Handles sending notifications for meeting scheduling, confirmations, and reminders
 */

import { notificationTemplatesAPI, notificationQueueAPI } from '../utils/amplifyAPI';

export interface MeetingNotificationPayload {
  requestId: string;
  meetingDate: string;
  meetingTime: string;
  meetingType: string;
  meetingLocation?: string;
  assignedPM?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  agentName?: string;
  agentEmail?: string;
  propertyAddress?: string;
}

class MeetingNotificationService {
  private static instance: MeetingNotificationService;

  static getInstance(): MeetingNotificationService {
    if (!MeetingNotificationService.instance) {
      MeetingNotificationService.instance = new MeetingNotificationService();
    }
    return MeetingNotificationService.instance;
  }

  /**
   * Send meeting confirmation notifications to all relevant parties
   */
  async sendMeetingConfirmation(payload: MeetingNotificationPayload): Promise<void> {
    try {
      // Get or create meeting confirmation templates
      await this.ensureMeetingTemplatesExist();

      // Send to project manager
      if (payload.assignedPM) {
        await this.queueNotification('meeting-confirmation-pm-email', payload);
        // SMS to PM if they have a phone number (would need to get from contacts)
      }

      // Send to homeowner/contact
      if (payload.contactEmail) {
        await this.queueNotification('meeting-confirmation-client-email', payload);
      }

      // Send to agent if different from homeowner
      if (payload.agentEmail && payload.agentEmail !== payload.contactEmail) {
        await this.queueNotification('meeting-confirmation-agent-email', payload);
      }

      // Send admin notification
      await this.queueNotification('meeting-scheduled-admin-email', payload);

    } catch (error) {
      console.error('Error sending meeting confirmation notifications:', error);
      throw error;
    }
  }

  /**
   * Send meeting reminder notifications (typically 24 hours and 1 hour before)
   */
  async sendMeetingReminder(payload: MeetingNotificationPayload, reminderType: '24h' | '1h'): Promise<void> {
    try {
      const templateSuffix = reminderType === '24h' ? '24h' : '1h';
      
      // Send reminders to all parties
      if (payload.assignedPM) {
        await this.queueNotification(`meeting-reminder-pm-${templateSuffix}-email`, payload);
      }

      if (payload.contactEmail) {
        await this.queueNotification(`meeting-reminder-client-${templateSuffix}-email`, payload);
      }

      if (payload.agentEmail && payload.agentEmail !== payload.contactEmail) {
        await this.queueNotification(`meeting-reminder-agent-${templateSuffix}-email`, payload);
      }

    } catch (error) {
      console.error('Error sending meeting reminder notifications:', error);
      throw error;
    }
  }

  /**
   * Send meeting cancellation notifications
   */
  async sendMeetingCancellation(payload: MeetingNotificationPayload, reason?: string): Promise<void> {
    try {
      const cancellationPayload = { ...payload, cancellationReason: reason || 'No reason provided' };

      // Send cancellation to all parties
      if (payload.assignedPM) {
        await this.queueNotification('meeting-cancellation-pm-email', cancellationPayload);
      }

      if (payload.contactEmail) {
        await this.queueNotification('meeting-cancellation-client-email', cancellationPayload);
      }

      if (payload.agentEmail && payload.agentEmail !== payload.contactEmail) {
        await this.queueNotification('meeting-cancellation-agent-email', cancellationPayload);
      }

    } catch (error) {
      console.error('Error sending meeting cancellation notifications:', error);
      throw error;
    }
  }

  /**
   * Queue a notification in the system
   */
  private async queueNotification(templateName: string, payload: any): Promise<void> {
    try {
      await notificationQueueAPI.create({
        eventType: 'meeting_notification',
        templateId: templateName, // Using template name as ID for now
        payload: payload,
        status: 'PENDING',
        priority: 'NORMAL',
        scheduledFor: new Date().toISOString(),
        recipient: payload.contactEmail || payload.agentEmail || 'admin@realtechee.com',
        channel: 'EMAIL',
      });
    } catch (error) {
      console.error(`Error queuing notification ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Ensure all meeting notification templates exist in the system
   */
  private async ensureMeetingTemplatesExist(): Promise<void> {
    const templates = [
      {
        name: 'meeting-confirmation-pm-email',
        subject: 'New Meeting Assignment - Property Assessment',
        contentHtml: this.getMeetingConfirmationPMTemplate(),
        contentText: this.getMeetingConfirmationPMTextTemplate(),
        channel: 'EMAIL' as const,
        variables: ['requestId', 'meetingDate', 'meetingTime', 'meetingType', 'contactName', 'propertyAddress'],
      },
      {
        name: 'meeting-confirmation-client-email',
        subject: 'Meeting Confirmed - Property Assessment with RealTechee',
        contentHtml: this.getMeetingConfirmationClientTemplate(),
        contentText: this.getMeetingConfirmationClientTextTemplate(),
        channel: 'EMAIL' as const,
        variables: ['requestId', 'meetingDate', 'meetingTime', 'meetingType', 'assignedPM', 'propertyAddress'],
      },
      {
        name: 'meeting-scheduled-admin-email',
        subject: 'Meeting Scheduled - Admin Notification',
        contentHtml: this.getMeetingScheduledAdminTemplate(),
        contentText: this.getMeetingScheduledAdminTextTemplate(),
        channel: 'EMAIL' as const,
        variables: ['requestId', 'meetingDate', 'meetingTime', 'assignedPM', 'contactName'],
      },
    ];

    try {
      for (const template of templates) {
        // Check if template exists
        const existingTemplates = await notificationTemplatesAPI.list();
        const exists = existingTemplates.success && 
          existingTemplates.data?.some((t: any) => t.name === template.name);

        if (!exists) {
          await notificationTemplatesAPI.create({
            ...template,
            isActive: true,
            variables: JSON.stringify(template.variables),
          });
        }
      }
    } catch (error) {
      console.error('Error ensuring meeting templates exist:', error);
      // Don't throw - templates might already exist or be created by other means
    }
  }

  /**
   * HTML template for PM meeting confirmation
   */
  private getMeetingConfirmationPMTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Meeting Assignment</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">New Meeting Assignment</h1>
        
        <p>Hello {{assignedPM}},</p>
        
        <p>You have been assigned to conduct a property assessment meeting:</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Meeting Details</h3>
            <p><strong>Date:</strong> {{meetingDate}}</p>
            <p><strong>Time:</strong> {{meetingTime}}</p>
            <p><strong>Type:</strong> {{meetingType}}</p>
            <p><strong>Property:</strong> {{propertyAddress}}</p>
            <p><strong>Contact:</strong> {{contactName}}</p>
            {{#meetingLocation}}<p><strong>Location:</strong> {{meetingLocation}}</p>{{/meetingLocation}}
        </div>
        
        <p><strong>Request ID:</strong> {{requestId}}</p>
        
        <div style="margin: 30px 0;">
            <a href="{{adminUrl}}/admin/requests/{{requestId}}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Request Details
            </a>
        </div>
        
        <p>Please confirm your availability and prepare for the assessment.</p>
        
        <p>Best regards,<br>RealTechee Team</p>
    </div>
</body>
</html>`;
  }

  /**
   * Text template for PM meeting confirmation
   */
  private getMeetingConfirmationPMTextTemplate(): string {
    return `
New Meeting Assignment

Hello {{assignedPM}},

You have been assigned to conduct a property assessment meeting:

Meeting Details:
- Date: {{meetingDate}}
- Time: {{meetingTime}}
- Type: {{meetingType}}
- Property: {{propertyAddress}}
- Contact: {{contactName}}
{{#meetingLocation}}- Location: {{meetingLocation}}{{/meetingLocation}}

Request ID: {{requestId}}

View request details: {{adminUrl}}/admin/requests/{{requestId}}

Please confirm your availability and prepare for the assessment.

Best regards,
RealTechee Team`;
  }

  /**
   * HTML template for client meeting confirmation
   */
  private getMeetingConfirmationClientTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Meeting Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Meeting Confirmed</h1>
        
        <p>Dear {{contactName}},</p>
        
        <p>Your property assessment meeting with RealTechee has been confirmed:</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Meeting Details</h3>
            <p><strong>Date:</strong> {{meetingDate}}</p>
            <p><strong>Time:</strong> {{meetingTime}}</p>
            <p><strong>Type:</strong> {{meetingType}}</p>
            <p><strong>Property:</strong> {{propertyAddress}}</p>
            {{#assignedPM}}<p><strong>Project Manager:</strong> {{assignedPM}}</p>{{/assignedPM}}
            {{#meetingLocation}}<p><strong>Location:</strong> {{meetingLocation}}</p>{{/meetingLocation}}
        </div>
        
        <p><strong>What to Expect:</strong></p>
        <ul>
            <li>Professional property assessment</li>
            <li>Discussion of your renovation goals</li>
            <li>Detailed project planning</li>
            <li>Timeline and cost estimates</li>
        </ul>
        
        <p>We'll send you a reminder 24 hours before the meeting.</p>
        
        <p>If you need to reschedule, please contact us as soon as possible.</p>
        
        <p>Best regards,<br>RealTechee Team</p>
    </div>
</body>
</html>`;
  }

  /**
   * Text template for client meeting confirmation
   */
  private getMeetingConfirmationClientTextTemplate(): string {
    return `
Meeting Confirmed

Dear {{contactName}},

Your property assessment meeting with RealTechee has been confirmed:

Meeting Details:
- Date: {{meetingDate}}
- Time: {{meetingTime}}
- Type: {{meetingType}}
- Property: {{propertyAddress}}
{{#assignedPM}}- Project Manager: {{assignedPM}}{{/assignedPM}}
{{#meetingLocation}}- Location: {{meetingLocation}}{{/meetingLocation}}

What to Expect:
- Professional property assessment
- Discussion of your renovation goals
- Detailed project planning
- Timeline and cost estimates

We'll send you a reminder 24 hours before the meeting.

If you need to reschedule, please contact us as soon as possible.

Best regards,
RealTechee Team`;
  }

  /**
   * HTML template for admin meeting notification
   */
  private getMeetingScheduledAdminTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Meeting Scheduled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Meeting Scheduled</h1>
        
        <p>A new property assessment meeting has been scheduled:</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Meeting Details</h3>
            <p><strong>Request ID:</strong> {{requestId}}</p>
            <p><strong>Date:</strong> {{meetingDate}}</p>
            <p><strong>Time:</strong> {{meetingTime}}</p>
            <p><strong>Contact:</strong> {{contactName}}</p>
            {{#assignedPM}}<p><strong>Assigned PM:</strong> {{assignedPM}}</p>{{/assignedPM}}
        </div>
        
        <div style="margin: 30px 0;">
            <a href="{{adminUrl}}/admin/requests/{{requestId}}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Request Details
            </a>
        </div>
        
        <p>Best regards,<br>RealTechee System</p>
    </div>
</body>
</html>`;
  }

  /**
   * Text template for admin meeting notification
   */
  private getMeetingScheduledAdminTextTemplate(): string {
    return `
Meeting Scheduled

A new property assessment meeting has been scheduled:

Meeting Details:
- Request ID: {{requestId}}
- Date: {{meetingDate}}
- Time: {{meetingTime}}
- Contact: {{contactName}}
{{#assignedPM}}- Assigned PM: {{assignedPM}}{{/assignedPM}}

View request details: {{adminUrl}}/admin/requests/{{requestId}}

Best regards,
RealTechee System`;
  }
}

export const meetingNotificationService = MeetingNotificationService.getInstance();