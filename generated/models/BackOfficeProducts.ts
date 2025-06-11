// Generated TypeScript model for BackOfficeProducts
// Source: BackOfficeProducts.csv (5 records)

export interface BackOfficeProducts {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface CreateBackOfficeProductsInput {
  title?: string;
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}

export interface UpdateBackOfficeProductsInput {
  ID: string;
  title?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  order?: number;
}