/**
 * Project data types
 * Based on the Amplify Gen 2.0 schema after data migration
 */

import { ProjectStatus } from '../utils/projectsService';

export interface Project {
  // Core Amplify fields
  id: string;
  title: string;
  status: ProjectStatus;
  statusImage?: string;
  statusOrder?: number;
  propertyType?: string;
  description?: string;
  image?: string;
  gallery?: string;
  
  // Property details (all camelCase after migration)
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  sizeSqft?: number;
  yearBuilt?: number;
  redfinLink?: string;
  zillowLink?: string;
  
  // Financial data
  originalValue?: number;
  listingPrice?: number;
  salePrice?: number;
  addedValue?: number;
  boostPrice?: number;
  boosterEstimatedCost?: number;
  budget?: string;
  
  // Contact relationships (using contact IDs)
  agentContactId?: string;
  homeownerContactId?: string;
  homeowner2ContactId?: string;
  homeowner3ContactId?: string;
  
  // Dates (automatic timestamps)
  createdAt?: string;
  updatedAt?: string;
  requestDate?: string;
  visitReviewDate?: string;
  proposalDate?: string;
  contractDate?: string;
  escrowDate?: string;
  estimatedClosingDate?: string;
  closingDate?: string;
  
  // Additional fields that may be populated via relationships
  agent?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  homeowner?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  address?: {
    propertyFullAddress?: string;
    houseAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  
  // Legacy UI compatibility fields
  imageUrl?: string;
  category?: string;
  location?: string;
  completionDate?: string;
  featured?: boolean;
}

export interface ProjectFilter {
  category?: string;
  location?: string;
  status?: string;
  featured?: boolean;
  search?: string;
  includeArchived?: boolean;  // defaults to false
}