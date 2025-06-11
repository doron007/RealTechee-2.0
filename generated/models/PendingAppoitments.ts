// Generated TypeScript model for PendingAppoitments
// Source: PendingAppoitments.csv (183 records)

export interface PendingAppoitments {
  ID: string;
  assignedTo?: string;
  status?: string;
  serviceName?: string;
  name?: string;
  email?: string;
  phone?: number;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  requestAddress?: string;
  brokerage?: string;
  visitorId?: string;
  requestedSlot?: string;
  preferredLocation?: string;
  requestId?: string;
  assignedDate?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface CreatePendingAppoitmentsInput {
  ID: string;
  assignedTo?: string;
  status?: string;
  serviceName?: string;
  name?: string;
  email?: string;
  phone?: number;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  requestAddress?: string;
  brokerage?: string;
  visitorId?: string;
  requestedSlot?: string;
  preferredLocation?: string;
  requestId?: string;
  assignedDate?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}

export interface UpdatePendingAppoitmentsInput {
  ID: string;
  assignedTo?: string;
  status?: string;
  serviceName?: string;
  name?: string;
  email?: string;
  phone?: number;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  requestAddress?: string;
  brokerage?: string;
  visitorId?: string;
  requestedSlot?: string;
  preferredLocation?: string;
  requestId?: string;
  assignedDate?: string;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
}