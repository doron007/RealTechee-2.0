/**
 * Form Utility Functions
 * Consolidated common form helpers to eliminate duplication across forms
 */

/**
 * Generate session ID for consistent folder structure across all uploads
 * Consolidated from GetEstimateForm.tsx and useContactForm.ts
 */
export const generateSessionId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

/**
 * Convert text to PascalCase (used for brokerage name transformation)
 * Consolidated from GetEstimateForm.tsx and useContactForm.ts
 * For brokerage names, we want proper capitalization like "Real Estate Company"
 */
export const toCamelCase = (str: string): string => {
  return str
    .trim()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
      return word.toUpperCase(); // Capitalize all words (PascalCase for names)
    })
    .replace(/\s+/g, ' '); // Keep spaces for proper names
};

/**
 * Get today's date in YYYY-MM-DD format for date input min attribute
 * Common pattern used across date inputs
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format date for submission (converts to ISO string)
 * Common pattern used across form submissions
 */
export const formatDateForSubmission = (dateString: string): string => {
  return dateString ? new Date(dateString).toISOString() : '';
};

/**
 * Standard form submission metadata
 * Common across all contact forms
 */
export const getStandardSubmissionMetadata = () => ({
  leadSource: 'Website' as const,
  status: 'New' as const,
  assignedTo: 'Unassigned',
  submissionTime: new Date().toISOString()
});

/**
 * Camel case transformation for form inputs (with event handling)
 * Common pattern for brokerage name inputs
 */
export const handleCamelCaseTransformation = (e: React.FocusEvent<HTMLInputElement>) => {
  const camelCased = toCamelCase(e.target.value);
  e.target.value = camelCased;
  // Trigger re-validation after transformation
  e.target.dispatchEvent(new Event('input', { bubbles: true }));
};

/**
 * Common radio button styling classes
 * Used consistently across forms for radio inputs
 */
export const RADIO_BUTTON_CLASSES = {
  container: 'flex items-center gap-2 cursor-pointer',
  hiddenInput: 'sr-only',
  circle: 'w-4 h-4 rounded-full border border-[#D2D2D4] bg-white flex items-center justify-center',
  dot: 'w-[10.67px] h-[10.67px] rounded-full bg-[#2A2B2E]',
  label: 'text-[#2A2B2E]'
};

/**
 * Common form input styling classes
 * Used consistently across all form inputs
 */
export const FORM_INPUT_CLASSES = {
  container: 'w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center justify-between',
  input: 'w-full bg-transparent border-0 outline-0 text-base font-normal text-[#646469] leading-[1.6]',
  error: 'text-[#D11919] mt-1',
  icon: 'flex-shrink-0'
};

/**
 * Common button styling classes
 * Used for meeting type buttons and other form buttons
 */
export const BUTTON_CLASSES = {
  base: 'px-6 py-4 rounded border text-base font-[800] leading-[1.2] font-nunito text-center cursor-pointer',
  active: 'bg-[#000000] text-white border-[#2A2B2E]',
  inactive: 'bg-white text-[#2A2B2E] border-[#2A2B2E]',
  responsive: 'flex-1' // For responsive layouts
};

/**
 * Standard dropdown options for forms
 * Consolidated from GetQualifiedForm and AffiliateInquiryForm for reusability
 */

// Brokerage options for real estate forms
export const BROKERAGE_OPTIONS = [
  'Equity Union',
  'Compass',
  'Coldwell Banker',
  'Keller Williams', 
  'RE/MAX',
  'Berkshire Hathaway HomeServices',
  'Century 21',
  'Sotheby\'s International Realty',
  'eXp Realty',
  'Realty ONE Group',
  'Better Homes and Gardens Real Estate',
  'other'
];

// Real estate specialties for qualification forms
export const SPECIALTY_OPTIONS = [
  'Residential Sales',
  'Luxury Properties',
  'Commercial Real Estate',
  'Investment Properties',
  'First-Time Homebuyers',
  'Relocation Services',
  'Short Sales/Foreclosures',
  'New Construction',
  'Senior Housing',
  'Vacation/Second Homes'
];

// Experience levels for agent qualification
export const EXPERIENCE_YEARS_OPTIONS = [
  { value: "0-1", label: "0-1 years (New Agent)" },
  { value: "2-5", label: "2-5 years" },
  { value: "6-10", label: "6-10 years" },
  { value: "11-15", label: "11-15 years" },
  { value: "16+", label: "16+ years (Veteran)" }
];

// Transaction volume options for agent qualification
export const TRANSACTION_VOLUME_OPTIONS = [
  { value: "0", label: "0 transactions" },
  { value: "1-5", label: "1-5 transactions" },
  { value: "6-10", label: "6-10 transactions" },
  { value: "11-25", label: "11-25 transactions" },
  { value: "26-50", label: "26-50 transactions" },
  { value: "50+", label: "50+ transactions" }
];

// Service types for affiliate inquiry forms
export const SERVICE_TYPE_OPTIONS = [
  'General Contractor',
  'Architect',
  'Interior Designer',
  'Landscaper',
  'Home Inspector',
  'Photographer',
  'Stager',
  'Electrician',
  'Plumber',
  'HVAC Specialist',
  'Roofing Contractor',
  'Flooring Specialist',
  'Painter',
  'Handyman Services',
  'Other'
];

// Employee count options for business forms
export const EMPLOYEE_COUNT_OPTIONS = [
  { value: "1-5", label: "1-5 employees" },
  { value: "6-10", label: "6-10 employees" },
  { value: "11-25", label: "11-25 employees" },
  { value: "26-50", label: "26-50 employees" },
  { value: "51-100", label: "51-100 employees" },
  { value: "100+", label: "100+ employees" }
];