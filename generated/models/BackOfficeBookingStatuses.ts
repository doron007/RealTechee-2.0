// Generated TypeScript model for BackOfficeBookingStatuses
// Source: BackOfficeBookingStatuses.csv (3 records)

export interface BackOfficeBookingStatuses {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface CreateBackOfficeBookingStatusesInput {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface UpdateBackOfficeBookingStatusesInput {
  ID: string;
  title?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}