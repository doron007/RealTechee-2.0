/**
 * Shared form constants and options
 * Centralizes all dropdown options and form constants
 */

import { DropdownOption } from '../../types/forms';

// Product options used in GeneralInquiryForm and other forms
export const PRODUCT_OPTIONS: DropdownOption[] = [
  { value: 'Buyers Service', label: 'Buyers Service' },
  { value: 'Sellers Service', label: 'Sellers Service' },
  { value: 'Kitchen and Bath', label: 'Kitchen and Bath' },
  { value: 'Architects and Designers', label: 'Architects and Designers' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Other', label: 'Other' }
];

// Relation to property options used in GetEstimateForm and GetQualifiedForm
export const RELATION_TO_PROPERTY_OPTIONS: DropdownOption[] = [
  { value: 'Retailer', label: 'Retailer' },
  { value: 'Architect / Designer', label: 'Architect / Designer' },
  { value: 'Loan Officer', label: 'Loan Officer' },
  { value: 'Broker', label: 'Broker' },
  { value: 'Real Estate Agent', label: 'Real Estate Agent' },
  { value: 'Homeowner', label: 'Homeowner' },
  { value: 'Other', label: 'Other' }
];

// Brokerage options used in GetEstimateForm and GetQualifiedForm
export const BROKERAGE_OPTIONS: DropdownOption[] = [
  { value: 'Equity Union', label: 'Equity Union' },
  { value: 'Sync', label: 'Sync' },
  { value: 'Other', label: 'Other' }
];

// Business years options used in AffiliateInquiryForm
export const BUSINESS_YEARS_OPTIONS: DropdownOption[] = [
  { value: '0-2 years', label: '0-2 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '6-10 years', label: '6-10 years' },
  { value: '11-15 years', label: '11-15 years' },
  { value: '16+ years', label: '16+ years' }
];

// Project count options used in AffiliateInquiryForm
export const PROJECT_COUNT_OPTIONS: DropdownOption[] = [
  { value: '1-5', label: '1-5' },
  { value: '6-10', label: '6-10' },
  { value: '11-20', label: '11-20' },
  { value: '21-50', label: '21-50' },
  { value: '50+', label: '50+' }
];

// Work type options used in AffiliateInquiryForm
export const WORK_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'Kitchen', label: 'Kitchen' },
  { value: 'Living Areas', label: 'Living Areas' },
  { value: 'Full Home', label: 'Full Home' },
  { value: 'Bath', label: 'Bath' },
  { value: 'Commercial', label: 'Commercial' }
];

// RT Digital selection options used in GetEstimateForm and GetQualifiedForm
export const RT_DIGITAL_SELECTION_OPTIONS = [
  { value: 'video-call', label: 'Video call' },
  { value: 'upload', label: 'Pictures & video walkthrough' },
  { value: 'in-person', label: 'In-person home visit' }
];

// Finance options used in multiple forms
export const FINANCE_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' }
];

// US States options used in AddressFields
export const US_STATES_OPTIONS: DropdownOption[] = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

// Form default values
export const DEFAULT_FORM_VALUES = {
  CONTACT_INFO: {
    fullName: '',
    email: '',
    phone: ''
  },
  ADDRESS_INFO: {
    streetAddress: '',
    city: '',
    state: 'CA', // Default to California
    zip: ''
  },
  FORM_SUBMISSION: {
    leadSource: 'Website',
    status: 'New' as const,
    assignedTo: 'Unassigned'
  }
};

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number (10 digits required)',
  INVALID_ZIP: 'Invalid ZIP code',
  SELECT_OPTION: 'Please select an option'
} as const;