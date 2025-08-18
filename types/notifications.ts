import { NotificationQueueStatus, NotificationTemplateChannel } from '../API';

export interface NotificationItem {
  id: string;
  eventType: string;
  status: NotificationQueueStatus;
  recipientIds: string | string[];
  channels: string | string[];
  templateId: string;
  payload: string | any;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  retryCount?: number | null;
  errorMessage?: string | null;
  owner?: string;
  __typename?: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  formType?: string;
  // New unified structure
  emailSubject?: string;
  emailContentHtml?: string;
  smsContent?: string;
  // Legacy structure (backward compatibility)
  channel?: NotificationTemplateChannel;
  subject?: string | null;
  contentHtml?: string | null;
  contentText?: string | null;
  // Common fields
  variables?: string | null;
  previewData?: string;
  isActive?: boolean | null;
  version?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
  __typename?: string;
}

export { NotificationQueueStatus, NotificationTemplateChannel };