// Generated TypeScript model for eSignatureDocuments
// Source: eSignatureDocuments.csv (491 records)

export interface eSignatureDocuments {
  ID: string;
  signed?: boolean;
  templateId?: number;
  documentData?: string;
  pdfGeneratorUrl?: string;
  document?: string;
  signedBy?: string;
  signature?: string;
  initials?: string;
  quotePdfUrl?: string;
  signedDate?: string;
  signedDocument?: string;
  signedPdfGeneratorUrl?: string;
  signedQuotePdfPublicUrl?: string;
  homeownerEmail?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  addressId?: string;
}

export interface CreateeSignatureDocumentsInput {
  ID: string;
  signed?: boolean;
  templateId?: number;
  documentData?: string;
  pdfGeneratorUrl?: string;
  document?: string;
  signedBy?: string;
  signature?: string;
  initials?: string;
  quotePdfUrl?: string;
  signedDate?: string;
  signedDocument?: string;
  signedPdfGeneratorUrl?: string;
  signedQuotePdfPublicUrl?: string;
  homeownerEmail?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  addressId?: string;
}

export interface UpdateeSignatureDocumentsInput {
  ID: string;
  signed?: boolean;
  templateId?: number;
  documentData?: string;
  pdfGeneratorUrl?: string;
  document?: string;
  signedBy?: string;
  signature?: string;
  initials?: string;
  quotePdfUrl?: string;
  signedDate?: string;
  signedDocument?: string;
  signedPdfGeneratorUrl?: string;
  signedQuotePdfPublicUrl?: string;
  homeownerEmail?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  addressId?: string;
}