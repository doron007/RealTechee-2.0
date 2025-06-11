// Generated TypeScript model for Properties
// Source: Properties.csv (210 records)

export interface Properties {
  ID: string;
  propertyFullAddress?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zip?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  sizeSqft?: number;
  yearBuilt?: number;
  redfinLink?: string;
  zillowLink?: string;
  createdDate?: string;
  updatedDate?: string;
  Owner?: string;
}

export interface CreatePropertiesInput {
  ID: string;
  propertyFullAddress?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zip?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  sizeSqft?: number;
  yearBuilt?: number;
  redfinLink?: string;
  zillowLink?: string;
  createdDate?: string;
  updatedDate?: string;
  Owner?: string;
}

export interface UpdatePropertiesInput {
  ID: string;
  propertyFullAddress?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zip?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  sizeSqft?: number;
  yearBuilt?: number;
  redfinLink?: string;
  zillowLink?: string;
  createdDate?: string;
  updatedDate?: string;
  Owner?: string;
}