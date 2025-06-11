// Generated TypeScript model for ProjectPaymentTerms
// Source: ProjectPaymentTerms.csv (313 records)

export interface ProjectPaymentTerms {
  ID: string;
  projectID?: number;
  type?: string;
  paymentName?: string;
  paymentAmount?: number;
  paymentDue?: string;
  description?: string;
  order?: number;
  paid?: boolean;
  parentPaymentId?: string;
  isCategory?: boolean;
  internal?: boolean;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface CreateProjectPaymentTermsInput {
  ID: string;
  projectID?: number;
  type?: string;
  paymentName?: string;
  paymentAmount?: number;
  paymentDue?: string;
  description?: string;
  order?: number;
  paid?: boolean;
  parentPaymentId?: string;
  isCategory?: boolean;
  internal?: boolean;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface UpdateProjectPaymentTermsInput {
  ID: string;
  projectID?: number;
  type?: string;
  paymentName?: string;
  paymentAmount?: number;
  paymentDue?: string;
  description?: string;
  order?: number;
  paid?: boolean;
  parentPaymentId?: string;
  isCategory?: boolean;
  internal?: boolean;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}