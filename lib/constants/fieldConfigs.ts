/**
 * Dynamic field configuration arrays for schema-driven form rendering
 * Eliminates repetitive field declarations and enables iterative rendering
 */

import { RELATION_TO_PROPERTY_OPTIONS, BROKERAGE_OPTIONS } from './formOptions';
import { handleCamelCaseTransformation } from '../utils/formUtils';

// Base field configuration interface
export interface BaseFieldConfig {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

// Dropdown field configuration
export interface DropdownFieldConfig extends BaseFieldConfig {
  type: 'dropdown';
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

// Input field configuration
export interface InputFieldConfig extends BaseFieldConfig {
  type: 'input';
  inputType?: 'text' | 'email' | 'tel' | 'number';
  maxLength?: number;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// Textarea field configuration
export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  rows?: number;
  maxLength?: number;
}

// Radio group configuration
export interface RadioGroupFieldConfig extends BaseFieldConfig {
  type: 'radio-group';
  options: Array<{ value: string; label: string }>;
  direction?: 'horizontal' | 'vertical';
}

// Radio buttons configuration (for meeting type selection)
export interface RadioButtonsFieldConfig extends BaseFieldConfig {
  type: 'radio-buttons';
  options: Array<{ value: string; label: string }>;
  layout?: 'horizontal' | 'vertical' | 'responsive';
  buttonClassName?: string;
}

// Address group configuration
export interface AddressGroupFieldConfig extends BaseFieldConfig {
  type: 'address-group';
  prefix: string;
  addressLabel?: string;
}

// Contact info group configuration
export interface ContactGroupFieldConfig extends BaseFieldConfig {
  type: 'contact-group';
  prefix: string;
  nameLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
}

// Conditional field configuration
export interface ConditionalFieldConfig extends BaseFieldConfig {
  type: 'conditional';
  condition: {
    watchField: string;
    value: any;
    operator?: '===' | '!==' | 'includes' | 'excludes';
  };
  field: DynamicFieldConfig;
}

// Union type for all field configurations
export type DynamicFieldConfig = 
  | DropdownFieldConfig 
  | InputFieldConfig 
  | TextareaFieldConfig 
  | RadioGroupFieldConfig
  | RadioButtonsFieldConfig
  | AddressGroupFieldConfig
  | ContactGroupFieldConfig
  | ConditionalFieldConfig;

// GetEstimateForm field configurations
export const GET_ESTIMATE_FIELD_CONFIGS: DynamicFieldConfig[] = [
  // Who you are dropdown
  {
    id: 'relation-to-property',
    type: 'dropdown',
    name: 'relationToProperty',
    label: '',
    placeholder: 'What would describe you the best?*',
    options: RELATION_TO_PROPERTY_OPTIONS,
    required: true
  },

  // Finance needed radio group
  {
    id: 'finance-needed',
    type: 'radio-group',
    name: 'needFinance',
    label: 'Finance needed?',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' }
    ],
    direction: 'vertical',
    required: true
  },

  // Meeting type radio buttons
  {
    id: 'meeting-type',
    type: 'radio-buttons', 
    name: 'rtDigitalSelection',
    label: 'Meeting Type',
    options: [
      { value: 'video-call', label: 'Video call' },
      { value: 'upload', label: 'Pictures & video walkthrough' },
      { value: 'in-person', label: 'In-person home visit' }
    ],
    layout: 'responsive',
    buttonClassName: 'flex-1 px-6 py-4 rounded border text-base font-[800] leading-[1.2] font-nunito text-center cursor-pointer',
    required: true
  },

  // Brokerage dropdown
  {
    id: 'brokerage',
    type: 'dropdown',
    name: 'agentInfo.brokerage',
    label: 'Brokerage',
    placeholder: 'Select Brokerage*',
    options: BROKERAGE_OPTIONS,
    required: true
  },

  // Custom brokerage conditional input
  {
    id: 'custom-brokerage',
    type: 'conditional',
    name: 'agentInfo.customBrokerage',
    label: 'Enter Brokerage Name',
    placeholder: 'Enter brokerage name',
    required: true,
    condition: {
      watchField: 'agentInfo.brokerage',
      value: 'Other',
      operator: '==='
    },
    field: {
      id: 'custom-brokerage-input',
      type: 'input',
      name: 'agentInfo.customBrokerage',
      label: 'Enter Brokerage Name',
      placeholder: 'Enter brokerage name',
      required: true,
      onBlur: handleCamelCaseTransformation
    }
  },

  // Notes textarea
  {
    id: 'notes',
    type: 'textarea',
    name: 'notes',
    label: '',
    placeholder: 'Is there anything you\'d like to share so we can assist you better?',
    rows: 5
  }
];

// Section configurations for GetEstimateForm
export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  layout?: 'default' | 'side-by-side' | 'two-column';
  className?: string;
  fields: string[]; // Field IDs to include in this section
}

export const GET_ESTIMATE_SECTION_CONFIGS: FormSectionConfig[] = [
  {
    id: 'who-you-are',
    title: 'Who you are',
    fields: ['relation-to-property']
  },
  {
    id: 'property-information', 
    title: 'Property information',
    fields: [] // Address fields handled separately for now
  },
  {
    id: 'agent-information',
    title: 'Agent Information',
    fields: ['brokerage', 'custom-brokerage'] // Contact fields handled separately
  },
  {
    id: 'homeowner-information',
    title: 'Homeowner Information (Optional)',
    fields: [] // Contact fields handled separately
  },
  {
    id: 'note-and-finance',
    title: 'Note and Finance',
    layout: 'side-by-side',
    fields: ['notes', 'finance-needed']
  },
  {
    id: 'meeting-details',
    title: 'Meeting details',
    fields: ['meeting-type'] // Date/time fields handled separately
  }
];

// Helper function to get field config by ID
export const getFieldConfig = (fieldId: string): DynamicFieldConfig | undefined => {
  if (fieldId === 'financeNeeded') {
    return GET_ESTIMATE_FIELD_CONFIGS.find(field => field.id === 'finance-needed');
  }
  if (fieldId === 'meeting-type') {
    return GET_ESTIMATE_FIELD_CONFIGS.find(field => field.id === 'meeting-type');
  }
  return GET_ESTIMATE_FIELD_CONFIGS.find(field => field.id === fieldId);
};

// Helper function to get section config by ID  
export const getSectionConfig = (sectionId: string): FormSectionConfig | undefined => {
  if (sectionId === 'whoAreYou') {
    return GET_ESTIMATE_SECTION_CONFIGS.find(s => s.id === 'who-you-are');
  }
  return GET_ESTIMATE_SECTION_CONFIGS.find(s => s.id === sectionId);
};

// Helper function to get fields for a section
export const getSectionFields = (sectionId: string): DynamicFieldConfig[] => {
  const section = GET_ESTIMATE_SECTION_CONFIGS.find(s => s.id === sectionId);
  if (!section) return [];
  
  return section.fields
    .map(fieldId => getFieldConfig(fieldId))
    .filter(Boolean) as DynamicFieldConfig[];
};