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
  channel: string;
  subject?: string | null;
  contentHtml?: string | null;
  contentText?: string | null;
  isActive?: boolean | null;
  createdAt: string;
  updatedAt: string;
  variables?: string | null;
  owner?: string;
  __typename?: string;
}

export { NotificationQueueStatus, NotificationTemplateChannel };