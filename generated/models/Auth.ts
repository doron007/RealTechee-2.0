// Generated TypeScript model for Auth
// Source: Auth.csv (58 records)

export interface Auth {
  owner?: string;
  email?: string;
  hash?: boolean;
  token?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAuthInput {
  owner?: string;
  email?: string;
  hash?: boolean;
  token?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface UpdateAuthInput {
  ID: string;
  owner?: string;
  email?: string;
  hash?: boolean;
  token?: string;
  createdDate?: string;
  updatedDate?: string;
}