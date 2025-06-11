// Generated TypeScript model for BackOfficeQuoteStatuses
// Source: BackOfficeQuoteStatuses.csv (12 records)

export interface BackOfficeQuoteStatuses {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface CreateBackOfficeQuoteStatusesInput {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface UpdateBackOfficeQuoteStatusesInput {
  ID: string;
  title?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}