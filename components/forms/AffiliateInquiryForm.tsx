import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { SectionTitle, BodyContent } from '../Typography';
import ContactInfoFields from './ContactInfoFields';
import AddressFields from './AddressFields';
import FormDropdown from './FormDropdown';
import FormInput from './FormInput';
import FormTextarea from './FormTextarea';
import FormToggle from './FormToggle';
import { scrollToTop } from '../../lib/scrollUtils';
import logger from '../../lib/logger';

// Types based on backend field mappings for Affiliate Inquiry
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

interface GeneralContractorInfo {
  workersCompensation: boolean;
  license: string;
  environmentalFactor: boolean;
  oshaCompliance: boolean;
  signedNDA: boolean;
  safetyPlan: boolean;
  numberOfEmployees: string;
}

interface AffiliateInquiryFormData {
  // Contact Information
  contactInfo: BaseContactInfo;
  
  // Address Information
  address: AddressInfo;
  
  // Business Details
  companyName: string;
  serviceType: string;
  
  // Conditional General Contractor Information
  generalContractorInfo?: GeneralContractorInfo;
}

// Validation schema for Affiliate Inquiry form
const affiliateValidationSchema = yup.object({
  contactInfo: yup.object({
    fullName: yup.string().required('Full name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().matches(/^\d{10}$/, 'Invalid phone number (10 digits required)').required('Phone number is required')
  }).required('Contact information is required'),
  
  address: yup.object({
    streetAddress: yup.string().required('Street address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zip: yup.string().matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').required('ZIP code is required')
  }).required('Address is required'),
  
  companyName: yup.string().required('Company name is required'),
  serviceType: yup.string().required('Please select a service type'),
  
  generalContractorInfo: yup.object().when('serviceType', {
    is: 'General Contractor',
    then: (schema) => schema.shape({
      workersCompensation: yup.boolean().optional(),
      license: yup.string().optional(),
      environmentalFactor: yup.boolean().optional(),
      oshaCompliance: yup.boolean().optional(),
      signedNDA: yup.boolean().optional(),
      safetyPlan: yup.boolean().optional(),
      numberOfEmployees: yup.string().optional()
    })
  })
}).required();

interface AffiliateInquiryFormProps {
  onSubmit: (data: AffiliateInquiryFormData) => void;
  isLoading?: boolean;
}

export const AffiliateInquiryForm: React.FC<AffiliateInquiryFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(affiliateValidationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true, // Built-in focus management
    defaultValues: {
      contactInfo: {
        fullName: '',
        email: '',
        phone: ''
      },
      address: {
        streetAddress: '',
        city: '',
        state: 'CA', // Default to California
        zip: ''
      },
      companyName: '',
      serviceType: '',
      generalContractorInfo: {
        workersCompensation: false,
        license: '',
        environmentalFactor: false,
        oshaCompliance: false,
        signedNDA: false,
        safetyPlan: false,
        numberOfEmployees: ''
      }
    }
  });

  const watchedServiceType = watch('serviceType');
  const isGeneralContractor = watchedServiceType === 'General Contractor';

  // Form submission with validation and logging
  const onFormSubmit = (data: AffiliateInquiryFormData) => {
    logger.info('=== AFFILIATE INQUIRY FORM SUBMISSION ===', {
      timestamp: new Date().toISOString(),
      formData: {
        hasContactInfo: !!data.contactInfo?.fullName && !!data.contactInfo?.email,
        hasAddress: !!data.address?.streetAddress && !!data.address?.city,
        hasBusinessDetails: !!data.companyName && !!data.serviceType,
        serviceType: data.serviceType,
        isGeneralContractor: isGeneralContractor,
        hasGCInfo: isGeneralContractor ? !!data.generalContractorInfo?.workersCompensation : true
      }
    });

    const formattedData = {
      ...data,
      submissionTime: new Date().toISOString()
    };
    
    // Scroll to top on successful submission
    scrollToTop();
    onSubmit(formattedData);
  };

  // Handle validation errors - React Hook Form will auto-focus first error
  const onFormError = (errors: any) => {
    logger.error('=== AFFILIATE INQUIRY FORM VALIDATION FAILED ===', {
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

  const serviceTypeOptions = [
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

  return (
    <div className="w-full max-w-[692px] flex flex-col gap-8">
      <form onSubmit={handleSubmit(onFormSubmit as any, onFormError)} className="w-full flex flex-col gap-8">
        
        {/* Contact Information Section */}
        <div className="flex flex-col gap-4">
          <SectionTitle className="text-[#2A2B2E]">
            Contact Information
          </SectionTitle>
          
          <div className="flex flex-col gap-4">
            <ContactInfoFields
              register={register}
              errors={errors}
              prefix="contactInfo"
            />
          </div>
        </div>

        {/* Address Information Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <AddressFields
              register={register}
              errors={errors}
              prefix="address"
              addressLabel="Address"
            />
          </div>
        </div>

        {/* Business Information Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {/* Company Name */}
            <FormInput
              register={register}
              errors={errors}
              name="companyName"
              label="Company Name"
              placeholder="What is your company name?"
              required
            />

            {/* Service Type */}
            <FormDropdown
              register={register}
              errors={errors}
              name="serviceType"
              label="Service Type"
              placeholder="Select service type*"
              options={serviceTypeOptions.map(option => ({ value: option, label: option }))}
              required
            />
          </div>
        </div>

        {/* Conditional General Contractor Section */}
        {isGeneralContractor && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <BodyContent className="text-[#2A2B2E]" spacing="none">
                For general contractor, please provide the following information to proceed with your qualification:
              </BodyContent>
            </div>
            
            <div className="flex flex-col gap-6">
              {/* Boolean Fields - Two Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormToggle
                  register={register}
                  name={"generalContractorInfo.workersCompensation" as any}
                  label="Worker's Compensation Ins."
                />
                
                <FormToggle
                  register={register}
                  name={"generalContractorInfo.environmentalFactor" as any}
                  label="Environmental Factor"
                />
                
                <FormToggle
                  register={register}
                  name={"generalContractorInfo.oshaCompliance" as any}
                  label="OSHA Compliance"
                />
                
                <FormToggle
                  register={register}
                  name={"generalContractorInfo.signedNDA" as any}
                  label="Signed NDA"
                />
                
                <FormToggle
                  register={register}
                  name={"generalContractorInfo.safetyPlan" as any}
                  label="Safety Plan"
                />
              </div>

              {/* Text Fields - Better Spacing */}
              <div className="flex flex-col gap-4">
                {/* License */}
                <FormTextarea
                  register={register}
                  errors={errors as any}
                  name={"generalContractorInfo.license" as any}
                  label="License"
                  placeholder="Enter license information (optional)"
                  rows={3}
                />

                {/* Number of Employees */}
                <div className="w-full md:w-1/2">
                  <FormDropdown
                    register={register}
                    errors={errors as any}
                    name={"generalContractorInfo.numberOfEmployees" as any}
                    label="# of Employees"
                    placeholder="Select employee count"
                    options={[
                      { value: "1-5", label: "1-5 employees" },
                      { value: "6-10", label: "6-10 employees" },
                      { value: "11-25", label: "11-25 employees" },
                      { value: "26-50", label: "26-50 employees" },
                      { value: "51-100", label: "51-100 employees" },
                      { value: "100+", label: "100+ employees" }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="w-full pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-6 py-4 rounded text-base font-[800] leading-[1.2] font-nunito text-center ${
              isLoading
                ? 'bg-[#919191] text-white cursor-not-allowed'
                : 'bg-[#000000] text-white hover:bg-[#2A2B2E] transition-colors'
            }`}
          >
            {isLoading ? 'Submitting...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AffiliateInquiryForm;