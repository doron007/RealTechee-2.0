// Generated TypeScript model for QuoteItems
// Source: QuoteItems.csv (1745 records)

export interface QuoteItems {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  projectID?: string;
  itemName?: string;
  itemCompleted?: boolean;
  parentStageId?: string;
  order?: number;
  isCategory?: boolean;
  description?: string;
  quantity?: number;
  unitPrice?: string;
  total?: string;
  type?: string;
  recommendItem?: boolean;
  image?: string;
  internal?: boolean;
  marginPercent?: number;
  cost?: number;
  price?: number;
}

export interface CreateQuoteItemsInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  projectID?: string;
  itemName?: string;
  itemCompleted?: boolean;
  parentStageId?: string;
  order?: number;
  isCategory?: boolean;
  description?: string;
  quantity?: number;
  unitPrice?: string;
  total?: string;
  type?: string;
  recommendItem?: boolean;
  image?: string;
  internal?: boolean;
  marginPercent?: number;
  cost?: number;
  price?: number;
}

export interface UpdateQuoteItemsInput {
  ID: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  projectID?: string;
  itemName?: string;
  itemCompleted?: boolean;
  parentStageId?: string;
  order?: number;
  isCategory?: boolean;
  description?: string;
  quantity?: number;
  unitPrice?: string;
  total?: string;
  type?: string;
  recommendItem?: boolean;
  image?: string;
  internal?: boolean;
  marginPercent?: number;
  cost?: number;
  price?: number;
}