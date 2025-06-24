/**
 * Shared form types for contact forms
 * Centralizes all form-related interfaces to eliminate duplication
 */

// Base contact information interface used across all forms
export interface BaseContactInfo {
  fullName: string;
  email: string;
  phone: string;
}

// Address information interface used in multiple forms
export interface AddressInfo {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
}

// General inquiry form data structure
export interface GeneralInquiryFormData {
  contactInfo: BaseContactInfo;
  address: AddressInfo;
  product: 'Kitchen' | 'Living Areas' | 'Full Home' | 'Bath' | 'Commercial' | '';
  subject: string;
  message: string;
}

// Affiliate inquiry form data structure
export interface AffiliateInquiryFormData {
  contactInfo: BaseContactInfo;
  address: AddressInfo;
  isGeneralContractor: boolean;
  generalContractorLicense?: string;
  businessYears: '0-2 years' | '3-5 years' | '6-10 years' | '11-15 years' | '16+ years' | '';
  workType: 'Kitchen' | 'Living Areas' | 'Full Home' | 'Bath' | 'Commercial' | '';
  workTypeBath: boolean;
  workTypeKitchen: boolean;
  workTypeLivingAreas: boolean;
  workTypeFullHome: boolean;
  workTypeCommercial: boolean;
  projectCount: '1-5' | '6-10' | '11-20' | '21-50' | '50+' | '';
  hasInsurance: boolean;
  hasLicense: boolean;
  license?: string;
}

// Get estimate form data structure
export interface EstimateFormData {
  // Property Information
  propertyAddress: AddressInfo;
  
  // Who Are You
  relationToProperty: 'Retailer' | 'Architect / Designer' | 'Loan Officer' | 'Broker' | 'Real Estate Agent' | 'Homeowner' | 'Other' | '';
  
  // Homeowner Information (optional)
  homeownerInfo: BaseContactInfo;
  
  // Agent Information (required)
  agentInfo: BaseContactInfo & {
    brokerage: string;
    customBrokerage?: string;
  };
  
  // Project Details
  needFinance: boolean;
  notes: string;
  
  // Meeting Details
  requestedVisitDateTime: string;
  rtDigitalSelection: 'upload' | 'video-call' | 'in-person';
  
  // File Uploads
  uploadedMedia?: any[];
}

// Get qualified form data structure
export interface QualifiedFormData {
  contactInfo: BaseContactInfo;
  address: AddressInfo;
  relationToProperty: 'Retailer' | 'Architect / Designer' | 'Loan Officer' | 'Broker' | 'Real Estate Agent' | 'Homeowner' | 'Other' | '';
  agentInfo?: BaseContactInfo & {
    brokerage: string;
    customBrokerage?: string;
  };
  homeownerInfo?: BaseContactInfo;
  notes: string;
  needFinance: boolean;
  requestedVisitDateTime: string;
  rtDigitalSelection: 'upload' | 'video-call' | 'in-person';
  uploadedMedia?: any[];
}

// Common form submission status
export interface FormSubmissionStatus {
  leadSource: string;
  status: 'New' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedTo: string;
  submissionTime: string;
}

// Form props interfaces for consistency
export interface BaseFormProps<T> {
  onSubmit: (data: T & FormSubmissionStatus) => void;
  isLoading?: boolean;
}

// Common dropdown options type
export interface DropdownOption {
  value: string;
  label: string;
}

// Form field validation state
export interface FieldValidationState {
  hasError: boolean;
  errorMessage?: string;
}