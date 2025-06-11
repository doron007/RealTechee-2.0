// Generated TypeScript model for BackOfficeRequestStatuses
// Source: BackOfficeRequestStatuses.csv (5 records)

export interface BackOfficeRequestStatuses {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface CreateBackOfficeRequestStatusesInput {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface UpdateBackOfficeRequestStatusesInput {
  ID: string;
  title?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}