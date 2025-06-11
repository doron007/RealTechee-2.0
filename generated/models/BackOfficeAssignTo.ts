// Generated TypeScript model for BackOfficeAssignTo
// Source: BackOfficeAssignTo.csv (10 records)

export interface BackOfficeAssignTo {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  name?: string;
  email?: string;
  mobile?: number;
  sendEmailNotifications?: boolean;
  sendSmsNotifications?: boolean;
  active?: boolean;
  order?: number;
  contactId?: string;
}

export interface CreateBackOfficeAssignToInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  name?: string;
  email?: string;
  mobile?: number;
  sendEmailNotifications?: boolean;
  sendSmsNotifications?: boolean;
  active?: boolean;
  order?: number;
  contactId?: string;
}

export interface UpdateBackOfficeAssignToInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  name?: string;
  email?: string;
  mobile?: number;
  sendEmailNotifications?: boolean;
  sendSmsNotifications?: boolean;
  active?: boolean;
  order?: number;
  contactId?: string;
}