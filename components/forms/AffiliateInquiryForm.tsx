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
import { SERVICE_TYPE_OPTIONS, EMPLOYEE_COUNT_OPTIONS } from '../../lib/utils/formUtils';
import FormFooter from './FormFooter';
import FormSection from './FormSection';

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


  return (
    <div className="w-full max-w-[692px] flex flex-col gap-8">
      <form onSubmit={handleSubmit(onFormSubmit as any, onFormError)} className="w-full flex flex-col gap-8">
        
        {/* Contact Information Section */}
        <FormSection title="Contact Information">
          <ContactInfoFields
            register={register}
            errors={errors}
            prefix="contactInfo"
          />
        </FormSection>

        {/* Address Information Section */}
        <FormSection title="Address Information">
          <AddressFields
            register={register}
            errors={errors}
            prefix="address"
            addressLabel="Address"
          />
        </FormSection>

        {/* Business Information Section */}
        <FormSection title="Business Information">
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
            options={SERVICE_TYPE_OPTIONS.map(option => ({ value: option, label: option }))}
            required
          />
        </FormSection>

        {/* Conditional General Contractor Section */}
        {isGeneralContractor && (
          <FormSection title="General Contractor Information" contentClassName="flex flex-col gap-6">
            <BodyContent className="text-[#2A2B2E]" spacing="none">
              For general contractor, please provide the following information to proceed with your qualification:
            </BodyContent>
            
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

            {/* Text Fields */}
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
                options={EMPLOYEE_COUNT_OPTIONS}
              />
            </div>
          </FormSection>
        )}

        {/* Submit Button */}
        <FormFooter
          isLoading={isLoading}
          submitText="Send"
          loadingText="Submitting..."
          showRequiredNote={false}
        />
      </form>
    </div>
  );
};

export default AffiliateInquiryForm;