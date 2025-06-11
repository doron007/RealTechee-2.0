// Generated TypeScript model for BackOfficeBrokerage
// Source: BackOfficeBrokerage.csv (10 records)

export interface BackOfficeBrokerage {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
  live?: boolean;
}

export interface CreateBackOfficeBrokerageInput {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
  live?: boolean;
}

export interface UpdateBackOfficeBrokerageInput {
  ID: string;
  title?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
  live?: boolean;
}