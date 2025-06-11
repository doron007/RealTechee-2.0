// Generated TypeScript model for BackOfficeNotifications
// Source: BackOfficeNotifications.csv (21 records)

export interface BackOfficeNotifications {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  key?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  bodyAsSimpleText?: string;
}

export interface CreateBackOfficeNotificationsInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  key?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  bodyAsSimpleText?: string;
}

export interface UpdateBackOfficeNotificationsInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  key?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  bodyAsSimpleText?: string;
}