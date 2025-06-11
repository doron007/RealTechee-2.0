// Generated TypeScript model for Legal
// Source: Legal.csv (3 records)

export interface Legal {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  content?: string;
  legalDocumentId?: string;
  documentId?: string;
}

export interface CreateLegalInput {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  content?: string;
  legalDocumentId?: string;
  documentId?: string;
}

export interface UpdateLegalInput {
  ID: string;
  title?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  content?: string;
  legalDocumentId?: string;
  documentId?: string;
}