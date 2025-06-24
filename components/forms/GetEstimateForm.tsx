import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ErrorMessage } from '@hookform/error-message';
import ContactInfoFields from './ContactInfoFields';
import AddressFields from './AddressFields';
import FileUploadField from './FileUploadField';
import FormDropdown from './FormDropdown';
import FormInput from './FormInput';
import FormTextarea from './FormTextarea';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import DynamicSectionRenderer from './DynamicSectionRenderer';
import { SubContent, SectionTitle, BodyContent } from '../Typography';
import { scrollToTop } from '../../lib/scrollUtils';
import logger from '../../lib/logger';
import { getFieldConfig, getSectionConfig } from '../../lib/constants/fieldConfigs';

// Helper function to convert text to camelCase
const toCamelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

// Types based on backend field mappings from implementation plan
interface BaseContactInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface AddressInfo {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
}

interface EstimateFormData {
  // Property Information
  propertyAddress: AddressInfo;
  
  // Who Are You
  relationToProperty: 'Retailer' | 'Architect / Designer' | 'Loan Officer' | 'Broker' | 'Real Estate Agent' | 'Homeowner' | 'Other' | '';
  
  // Homeowner Information (required for form but optional values)
  homeownerInfo: BaseContactInfo;
  
  // Agent Information (required)
  agentInfo: BaseContactInfo & {
    brokerage: string;
    customBrokerage?: string; // Only required when brokerage is "Other"
  };
  
  // Project Details
  needFinance: boolean;
  notes: string;
  
  // Meeting Details
  requestedVisitDateTime: string; // Optional when upload mode
  rtDigitalSelection: 'upload' | 'video-call' | 'in-person';
  
  // File Uploads
  uploadedMedia?: any[]; // Array of uploaded file objects from FileUploadField
}

// Validation schema with conditional validation based on relation to property
const estimateValidationSchema = yup.object({
  propertyAddress: yup.object({
    streetAddress: yup.string().required('Street address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zip: yup.string().matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').required('ZIP code is required')
  }).required('Property address is required'),
  relationToProperty: yup.string().oneOf(['Retailer', 'Architect / Designer', 'Loan Officer', 'Broker', 'Real Estate Agent', 'Homeowner', 'Other', ''], 'Please select your relation to the property').required('Please select your relation to the property'),
  
  // Homeowner info is optional - only validate if fields have values
  homeownerInfo: yup.object({
    fullName: yup.string().optional(),
    email: yup.string().test('email-optional', 'Invalid email', function(value) {
      if (!value || value.length === 0) return true; // Allow empty
      return yup.string().email().isValidSync(value); // Validate if has value
    }),
    phone: yup.string().test('phone-optional', 'Invalid phone number', function(value) {
      if (!value || value.length === 0) return true; // Allow empty
      return /^\d{10}$/.test(value); // Validate if has value
    })
  }).optional(),
  
  // Agent info validation - required for all submissions
  agentInfo: yup.object({
    fullName: yup.string().required('Agent full name is required'),
    email: yup.string().email('Invalid email').required('Agent email is required'),
    phone: yup.string().matches(/^\d{10}$/, 'Invalid phone number').required('Agent phone is required'),
    brokerage: yup.string().required('Brokerage is required'),
    customBrokerage: yup.string().when('brokerage', {
      is: 'Other',
      then: (schema) => schema.required('Please enter the brokerage name'),
      otherwise: (schema) => schema.optional()
    })
  }).required('Agent information is required'),
  
  needFinance: yup.boolean().required('Please select finance option'),
  notes: yup.string().optional(),
  requestedVisitDateTime: yup.string().when('rtDigitalSelection', {
    is: (val: string) => val !== 'upload',
    then: (schema) => schema.required('Meeting date and time is required'),
    otherwise: (schema) => schema.optional()
  }),
  rtDigitalSelection: yup.string().required('Please select meeting type')
}).required();

interface GetEstimateFormProps {
  onSubmit: (data: EstimateFormData) => void;
  isLoading?: boolean;
}

// Generate session ID for consistent folder structure across all uploads
const generateSessionId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

export const GetEstimateForm: React.FC<GetEstimateFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [sessionId] = useState<string>(() => generateSessionId()); // Generate once per form instance

  // Form refs for focus management (React Hook Form handles most focus automatically)
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(estimateValidationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true, // Built-in focus management
    defaultValues: {
      relationToProperty: '',
      needFinance: false,
      rtDigitalSelection: 'upload', // Default to Pictures & video walkthrough
      propertyAddress: {
        streetAddress: '',
        city: '',
        state: 'CA',
        zip: ''
      },
      homeownerInfo: {
        fullName: '',
        email: '',
        phone: ''
      },
      agentInfo: {
        fullName: '',
        email: '',
        phone: '',
        brokerage: '',
        customBrokerage: ''
      },
      notes: '',
      requestedVisitDateTime: ''
    }
  });

  const relationToProperty = watch('relationToProperty');
  const rtDigitalSelection = watch('rtDigitalSelection');
  const needFinance = watch('needFinance');

  // Helper function to scroll to first invalid field and focus it
  // Agent info is always visible now - no conditional logic needed

  // Form submission with validation and logging
  const onFormSubmit = (data: any) => {
    logger.info('=== FORM SUBMISSION ATTEMPT ===', {
      timestamp: new Date().toISOString(),
      rawFormData: data,
      uploadedFilesCount: uploadedFiles.length
    });

    // Explicit validation check as safety net with agent-first logic
    const validationErrors = [];
    
    if (!data.relationToProperty) {
      validationErrors.push('relationToProperty is missing');
    }
    if (!data.propertyAddress?.streetAddress) {
      validationErrors.push('propertyAddress.streetAddress is missing');
    }
    if (!data.propertyAddress?.city) {
      validationErrors.push('propertyAddress.city is missing');
    }
    if (!data.propertyAddress?.zip) {
      validationErrors.push('propertyAddress.zip is missing');
    }
    
    // Agent validation - now required for all submissions
    if (!data.agentInfo?.fullName) {
      validationErrors.push('agentInfo.fullName is required');
    }
    if (!data.agentInfo?.email) {
      validationErrors.push('agentInfo.email is required');
    }
    if (!data.agentInfo?.phone) {
      validationErrors.push('agentInfo.phone is required');
    }
    if (!data.agentInfo?.brokerage) {
      validationErrors.push('agentInfo.brokerage is required');
    }
    
    // Date/time validation for non-upload modes
    if (data.rtDigitalSelection !== 'upload' && !data.requestedVisitDateTime) {
      validationErrors.push('requestedVisitDateTime is missing for non-upload mode');
    }

    if (validationErrors.length > 0) {
      logger.error('=== VALIDATION FAILED - BLOCKING SUBMISSION ===', {
        validationErrors,
        formData: data
      });
      return; // Block submission
    }

    logger.info('=== VALIDATION PASSED - PROCEEDING WITH SUBMISSION ===', {
      hasRequiredFields: {
        relationToProperty: !!data.relationToProperty,
        propertyAddress: !!data.propertyAddress?.streetAddress,
        agentInfo: !!data.agentInfo?.fullName && !!data.agentInfo?.email,
        homeownerInfo: data.homeownerInfo?.email ? 'provided_optional' : 'empty_optional',
        rtDigitalSelection: !!data.rtDigitalSelection
      },
      uploadedFilesCount: uploadedFiles.length,
      formData: {
        relationToProperty: data.relationToProperty,
        rtDigitalSelection: data.rtDigitalSelection,
        needFinance: data.needFinance,
        hasNotes: !!data.notes,
        hasDateTime: !!data.requestedVisitDateTime
      }
    });

    // Handle custom brokerage - use customBrokerage value when "Other" is selected
    const finalBrokerage = data.agentInfo.brokerage === 'Other' 
      ? data.agentInfo.customBrokerage 
      : data.agentInfo.brokerage;

    const formattedData = {
      ...data,
      agentInfo: {
        ...data.agentInfo,
        brokerage: finalBrokerage // Use the actual brokerage name
      },
      requestedVisitDateTime: data.requestedVisitDateTime ? new Date(data.requestedVisitDateTime).toISOString() : undefined,
      uploadedMedia: uploadedFiles,
      leadSource: 'Website',
      status: 'New',
      assignedTo: 'Unassigned'
    };
    
    // Scroll to top on successful submission
    scrollToTop();
    onSubmit(formattedData);
  };

  // Handle validation errors - React Hook Form will auto-focus first error
  const onFormError = (errors: any) => {
    logger.error('=== GET ESTIMATE FORM VALIDATION FAILED ===', {
      timestamp: new Date().toISOString(),
      errorCount: Object.keys(errors).length,
      errors
    });

    // Add scroll behavior to ensure the focused field is visible
    setTimeout(() => {
      const focusedElement = document.activeElement as HTMLElement;
      if (focusedElement && focusedElement.tagName !== 'BODY') {
        focusedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  // Debug logging to see form state
  React.useEffect(() => {
    logger.info('Form validation state changed:', {
      hasErrors: Object.keys(errors).length > 0,
      errorCount: Object.keys(errors).length,
      errors
    });
  }, [errors]);

  return (
    <div className="w-full max-w-[692px] flex flex-col gap-8">
      <form ref={formRef} onSubmit={handleSubmit((data) => {
        logger.info('handleSubmit called with data:', data);
        onFormSubmit(data);
      }, onFormError)} className="w-full flex flex-col gap-8">
        {/* Who Are You Section - Dynamic Rendering */}
        <DynamicSectionRenderer
          section={getSectionConfig('whoAreYou')!}
          register={register}
          errors={errors}
          watch={watch}
        />

        {/* Property Information Section */}
        <div className="flex flex-col gap-4">
          <SectionTitle className="text-[#2A2B2E]">
            Property information
          </SectionTitle>
          
          <div className="flex flex-col gap-4">
            <AddressFields
              register={register}
              errors={errors}
              prefix="propertyAddress"
              addressLabel="Address*"
            />
          </div>
        </div>

        {/* Agent Information Section (Required) */}
        <div className="flex flex-col gap-4">
            <SectionTitle className="text-[#2A2B2E]">
              Agent Information
            </SectionTitle>
            
            <div className="flex flex-col gap-4">
              <ContactInfoFields
                register={register}
                errors={errors}
                prefix="agentInfo"
              />
              
              {/* Brokerage Dropdown */}
              <FormDropdown
                register={register}
                errors={errors}
                name={"agentInfo.brokerage" as any}
                label="Brokerage"
                placeholder="Select Brokerage*"
                options={[
                  { value: "Equity Union", label: "Equity Union" },
                  { value: "Sync", label: "Sync" },
                  { value: "Other", label: "Other" }
                ]}
                required
              />

              {/* Custom Brokerage Input - Show when "Other" is selected */}
              {watch('agentInfo.brokerage') === 'Other' && (
                <div className="w-full mt-4">
                  <FormInput
                    register={register}
                    errors={errors}
                    name={"agentInfo.customBrokerage" as any}
                    label="Enter Brokerage Name"
                    placeholder="Enter brokerage name"
                    required
                    onBlur={(e) => {
                      const camelCased = toCamelCase(e.target.value);
                      e.target.value = camelCased;
                      // Trigger re-validation after transformation
                      e.target.dispatchEvent(new Event('input', { bubbles: true }));
                    }}
                  />
                </div>
              )}
            </div>
          </div>

        {/* Homeowner Information Section - Optional */}
        <div className="flex flex-col gap-4">
          <SectionTitle className="text-[#2A2B2E]">
            Homeowner Information (Optional)
          </SectionTitle>
          
          <div className="flex flex-col gap-4">
            <ContactInfoFields
              register={register}
              errors={errors}
              prefix="homeownerInfo"
              nameLabel="Full name"
              emailLabel="Email Address"
              phoneLabel="Phone Number"
            />
          </div>
        </div>

        {/* Note and Finance Section - Side by Side on desktop, stacked on mobile */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full">
          {/* Note Section */}
          <div className="flex-1 flex flex-col gap-4">
            <SectionTitle className="text-[#2A2B2E]">
              Note
            </SectionTitle>
            
            <FormTextarea
              register={register}
              errors={errors}
              name="notes"
              label=""
              placeholder="Is there anything you'd like to share so we can assist you better?"
              rows={5}
            />
          </div>

          {/* Finance Needed Section - Dynamic Rendering */}
          <div className="flex flex-col gap-4 lg:min-w-[200px]">
            <DynamicFieldRenderer
              field={getFieldConfig('financeNeeded')!}
              register={register}
              errors={errors}
              watch={watch}
            />
          </div>
        </div>

        {/* Meeting Details Section */}
        <div className="flex flex-col gap-6 w-full">
          <SectionTitle className="text-[#2A2B2E]">
            Meeting details
          </SectionTitle>
          
          <BodyContent className="text-[#2A2B2E] w-full">
            Walk us through your home over a video call, video and pictures uploading or in person home visit so that we can learn more about your needs and your property. Once we have a sense of your home's condition and your property Booster needs, we can start to prepare our most efficient proposal.
          </BodyContent>

          {/* Meeting Type Buttons - Stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 w-full">
            <label className={`flex-1 px-6 py-4 rounded border text-base font-[800] leading-[1.2] font-nunito text-center cursor-pointer ${
              rtDigitalSelection === 'video-call'
                ? 'bg-[#000000] text-white border-[#2A2B2E]'
                : 'bg-white text-[#2A2B2E] border-[#2A2B2E]'
            }`}>
              <input
                {...register('rtDigitalSelection')}
                type="radio"
                value="video-call"
                className="sr-only"
              />
              Video call
            </label>
            
            <label className={`flex-1 px-6 py-4 rounded border text-base font-[800] leading-[1.2] font-nunito text-center cursor-pointer ${
              rtDigitalSelection === 'upload'
                ? 'bg-[#000000] text-white border-[#2A2B2E]'
                : 'bg-white text-[#2A2B2E] border-[#2A2B2E]'
            }`}>
              <input
                {...register('rtDigitalSelection')}
                type="radio"
                value="upload"
                className="sr-only"
              />
              Pictures & video walkthrough
            </label>
            
            <label className={`flex-1 px-6 py-4 rounded border text-base font-[800] leading-[1.2] font-nunito text-center cursor-pointer ${
              rtDigitalSelection === 'in-person'
                ? 'bg-[#000000] text-white border-[#2A2B2E]'
                : 'bg-white text-[#2A2B2E] border-[#2A2B2E]'
            }`}>
              <input
                {...register('rtDigitalSelection')}
                type="radio"
                value="in-person"
                className="sr-only"
              />
              In-person home visit
            </label>
          </div>

          {/* Date and Time Fields - Only show when not upload mode */}
          {rtDigitalSelection !== 'upload' && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full">
              {/* Meeting Date */}
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                    Meeting date*
                  </BodyContent>
                  <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center justify-between">
                    <input
                      {...register('requestedVisitDateTime')}
                      type="date"
                      className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#646469] leading-[1.6]"
                      placeholder="Please pick a date"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#2A2B2E" strokeWidth="1" fill="none"/>
                      <path d="M16 1V5" stroke="#2A2B2E" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M8 1V5" stroke="#2A2B2E" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M3 9H21" stroke="#2A2B2E" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {errors.requestedVisitDateTime && (
                    <SubContent className="text-[#D11919] mt-1">
                      {errors.requestedVisitDateTime.message as string}
                    </SubContent>
                  )}
                </div>
              </div>

              {/* Meeting Time */}
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                    Meeting time*
                  </BodyContent>
                  <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center justify-between">
                    <input
                      type="time"
                      className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#646469] leading-[1.6]"
                      placeholder="Please pick a time"
                    />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <circle cx="12" cy="12" r="10" stroke="#2A2B2E" strokeWidth="1" fill="none"/>
                      <polyline points="12,6 12,12 16,14" stroke="#2A2B2E" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Section */}
          <FileUploadField
            onFilesChange={setUploadedFiles}
            maxFileSize={15}
            disabled={isLoading}
            addressInfo={watch('propertyAddress')}
            sessionId={sessionId}
          />
        </div>

        {/* Footer Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 w-full">
          <SubContent className="text-[#2A2B2E] border border-[#FCF9F8]" spacing="none">
            *Required field
          </SubContent>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-[203px] bg-[#2A2B2E] text-white rounded px-6 py-4 flex items-center justify-center gap-4 text-base font-[800] leading-[1.2] font-nunito"
          >
            <span>{isLoading ? 'Submitting...' : 'Send'}</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M10.82 4.45L15.37 9L10.82 13.55" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.63 9H15.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default GetEstimateForm;