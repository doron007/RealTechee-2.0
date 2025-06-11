// Generated TypeScript model for BackOfficeProjectStatuses
// Source: BackOfficeProjectStatuses.csv (9 records)

export interface BackOfficeProjectStatuses {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface CreateBackOfficeProjectStatusesInput {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface UpdateBackOfficeProjectStatusesInput {
  ID: string;
  title?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}