// Type definitions for SignalDashboard to fix TypeScript errors

export interface SignalEvent {
  id: string;
  signalType: string;
  payload: string;
  emittedAt: string;
  emittedBy: string;
  source: string;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  eventType: string;
  status: string;
  templateId: string;
  signalEventId: string;
  createdAt: string;
  sentAt?: string;
  recipientIds: string;
  deliveryChannel?: string;
  priority: string;
}

export interface SignalMetrics {
  totalSignals: number;
  processedSignals: number;
  pendingSignals: number;
  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  processingRate: number;
  deliveryRate: number;
}