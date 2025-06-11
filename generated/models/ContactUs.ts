// Generated TypeScript model for ContactUs
// Source: ContactUs.csv (18 records)

export interface ContactUs {
  submissionTime?: string;
  contactId?: string;
  subject?: string;
  message?: string;
  product?: string;
  ID: string;
  owner?: string;
  createdDate?: string;
  updatedDate?: string;
  addressId?: string;
}

export interface CreateContactUsInput {
  submissionTime?: string;
  contactId?: string;
  subject?: string;
  message?: string;
  product?: string;
  ID: string;
  owner?: string;
  createdDate?: string;
  updatedDate?: string;
  addressId?: string;
}

export interface UpdateContactUsInput {
  ID: string;
  submissionTime?: string;
  contactId?: string;
  subject?: string;
  message?: string;
  product?: string;
  owner?: string;
  createdDate?: string;
  updatedDate?: string;
  addressId?: string;
}