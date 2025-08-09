// Notification system types for Lambda function

export interface NotificationQueue {
  id: string;
  eventType: string;
  
  // Legacy template-based approach (for backward compatibility)
  payload?: any; // JSON payload with template variables
  templateId?: string;
  
  // New direct content approach (decoupled from templates)
  directContent?: {
    email?: {
      subject: string;
      html: string;
      text: string;
      to: string;
    };
    sms?: {
      message: string;
      to: string;
    };
  };
  
  recipientIds: string[]; // Array of Contact IDs
  channels: string[]; // Array of channel types
  scheduledAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  retryCount?: number;
  errorMessage?: string;
  sentAt?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject?: string;
  contentHtml?: string;
  contentText?: string;
  channel: 'EMAIL' | 'SMS' | 'TELEGRAM' | 'WHATSAPP';
  variables?: string; // JSON string of required variables array
  isActive?: boolean;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  telegramId?: string;
  whatsappId?: string;
  notificationPrefs?: string; // JSON string of preferences
  company?: string;
  brokerage?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  telegram: boolean;
  whatsapp: boolean;
}

// Event payload types for different notification triggers
export interface GetEstimatePayload {
  customer: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  property?: {
    address: string;
  };
  project: {
    product?: string;
    message?: string;
  };
  submission: {
    id: string;
    timestamp: string;
  };
  admin: {
    dashboardUrl: string;
  };
}

// Lambda function environment variables
export interface LambdaEnvironment {
  AWS_REGION: string;
  NOTIFICATION_QUEUE_TABLE: string;
  NOTIFICATION_TEMPLATE_TABLE: string;
  CONTACTS_TABLE: string;
  SENDGRID_API_KEY: string;
  FROM_EMAIL: string;
  DEBUG_NOTIFICATIONS: string;
  DEBUG_EMAIL: string;
}

// SendGrid response types
export interface SendGridResponse {
  statusCode: number;
  headers: {
    'x-message-id': string;
    [key: string]: any;
  };
  body: any;
}

// Error types
export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export class TemplateError extends Error {
  constructor(
    message: string,
    public templateId: string,
    public templateName?: string
  ) {
    super(message);
    this.name = 'TemplateError';
  }
}

export class EmailError extends Error {
  constructor(
    message: string,
    public recipient: string,
    public sendGridError?: any
  ) {
    super(message);
    this.name = 'EmailError';
  }
}