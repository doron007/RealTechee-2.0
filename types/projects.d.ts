/**
 * Project data types
 * Based on the CSV structure
 */

export interface Project {
  // CSV original fields
  ID?: string;
  projectID?: string;
  Title?: string;
  Status?: string;
  "Status Image"?: string;
  "Status Order"?: string;
  "Property Type"?: string;
  Description?: string;
  Image?: string;
  Gallery?: string;
  "Agent Name"?: string;
  "Agent Email"?: string;
  "Agent Phone"?: string;
  "Homeowner Full Name"?: string;
  "Homeowner Email"?: string;
  "Homeowner Phone"?: string;
  Bedrooms?: string;
  Bathrooms?: string;
  Floors?: string;
  "Size Sqft."?: string;
  "Year Built"?: string;
  "Redfin Link"?: string;
  "Zillow Link"?: string;
  "Original Value"?: string;
  "Listing Price"?: string;
  "Sale Price"?: string;
  Budget?: string;
  "Created Date"?: string;
  "Updated Date"?: string;
  // UI fields (these are the ones used by components)
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  location: string;
  completionDate: string;
  budget: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilter {
  category?: string;
  location?: string;
  status?: string;
  featured?: boolean;
  search?: string;
}