// Generated TypeScript model for Contacts
// Source: Contacts.csv (233 records)

export interface Contacts {
  ID: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: number;
  mobile?: number;
  company?: string;
  brokerage?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface CreateContactsInput {
  ID: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: number;
  mobile?: number;
  company?: string;
  brokerage?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface UpdateContactsInput {
  ID: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: number;
  mobile?: number;
  company?: string;
  brokerage?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}