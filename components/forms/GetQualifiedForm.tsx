import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ErrorMessage } from '@hookform/error-message';
import { SubContent, SectionTitle, BodyContent } from '../Typography';
import ContactInfoFields from './ContactInfoFields';
import AddressFields from './AddressFields';
import { scrollToTop } from '../../lib/scrollUtils';
import logger from '../../lib/logger';
import { 
  BROKERAGE_OPTIONS, 
  SPECIALTY_OPTIONS, 
  EXPERIENCE_YEARS_OPTIONS, 
  TRANSACTION_VOLUME_OPTIONS 
} from '../../lib/utils/formUtils';
import FormFooter from './FormFooter';
import FormSection from './FormSection';
import FormInput from './FormInput';
import FormDropdown from './FormDropdown';
import FormTextarea from './FormTextarea';
import FormCheckboxGroup from './FormCheckboxGroup';

// Types based on backend field mappings for Get Qualified
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

interface GetQualifiedFormData {
  // Contact Information
  contactInfo: BaseContactInfo;
  
  // Address Information
  address: AddressInfo;
  
  // Agent Qualification Details
  licenseNumber: string;
  brokerage: string;
  customBrokerage?: string;
  experienceYears: string;
  primaryMarkets: string;
  specialties: string[];
  recentTransactions: string;
  qualificationMessage: string;
}

// Validation schema for Get Qualified form
const qualifiedValidationSchema = yup.object({
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
  
  licenseNumber: yup.string().required('License number is required'),
  brokerage: yup.string().required('Please select your brokerage'),
  customBrokerage: yup.string().when('brokerage', {
    is: 'other',
    then: (schema) => schema.required('Please specify your brokerage')
  }),
  experienceYears: yup.string().required('Please select your experience level'),
  primaryMarkets: yup.string().required('Primary markets information is required'),
  specialties: yup.array().min(1, 'Please select at least one specialty').required('Specialties are required'),
  recentTransactions: yup.string().required('Please select recent transaction volume'),
  qualificationMessage: yup.string().min(10, 'Message must be at least 10 characters').required('Qualification message is required')
}).required();

interface GetQualifiedFormProps {
  onSubmit: (data: GetQualifiedFormData) => void;
  isLoading?: boolean;
}

export const GetQualifiedForm: React.FC<GetQualifiedFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(qualifiedValidationSchema),
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
      licenseNumber: '',
      brokerage: '',
      customBrokerage: '',
      experienceYears: '',
      primaryMarkets: '',
      specialties: [],
      recentTransactions: '',
      qualificationMessage: ''
    }
  });

  const watchedBrokerage = watch('brokerage');

  // Form submission with validation and logging
  const onFormSubmit = (data: GetQualifiedFormData) => {
    logger.info('=== GET QUALIFIED FORM SUBMISSION ===', {
      timestamp: new Date().toISOString(),
      formData: {
        hasContactInfo: !!data.contactInfo?.fullName && !!data.contactInfo?.email,
        hasAddress: !!data.address?.streetAddress && !!data.address?.city,
        hasQualificationDetails: !!data.licenseNumber && !!data.brokerage && !!data.experienceYears,
        specialtiesCount: data.specialties?.length || 0,
        messageLength: data.qualificationMessage?.length || 0
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
    logger.error('=== GET QUALIFIED FORM VALIDATION FAILED ===', {
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
      <form onSubmit={handleSubmit(onFormSubmit, onFormError)} className="w-full flex flex-col gap-8">
        
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
          />
        </FormSection>

        {/* Agent Qualification Section */}
        <FormSection title="Agent Qualification">
          {/* License Number */}
          <FormInput
            register={register}
            errors={errors}
            name="licenseNumber"
            label="Real Estate License Number*"
            placeholder="Enter your license number"
            required
          />

          {/* Brokerage */}
          <FormDropdown
            register={register}
            errors={errors}
            name="brokerage"
            label="Brokerage*"
            placeholder="Select your brokerage*"
            options={BROKERAGE_OPTIONS.map(option => ({
              value: option,
              label: option === 'other' ? 'Other (please specify)' : option
            }))}
            required
          />

          {/* Custom Brokerage (conditional) */}
          {watchedBrokerage === 'other' && (
            <FormInput
              register={register}
              errors={errors}
              name="customBrokerage"
              label="Specify Brokerage*"
              placeholder="Enter your brokerage name"
              required
            />
          )}

          {/* Experience Years */}
          <FormDropdown
            register={register}
            errors={errors}
            name="experienceYears"
            label="Years of Experience*"
            placeholder="Select experience level*"
            options={EXPERIENCE_YEARS_OPTIONS}
            required
          />

          {/* Primary Markets */}
          <FormTextarea
            register={register}
            errors={errors}
            name="primaryMarkets"
            label="Primary Markets*"
            placeholder="List the cities, neighborhoods, or regions where you primarily work..."
            rows={3}
            required
          />

          {/* Specialties (Checkboxes) */}
          <FormCheckboxGroup
            register={register}
            watch={watch}
            errors={errors}
            name="specialties"
            label="Specialties* (Select all that apply)"
            options={SPECIALTY_OPTIONS.map(option => ({
              value: option,
              label: option
            }))}
            columns={2}
            required
          />

          {/* Recent Transactions */}
          <FormDropdown
            register={register}
            errors={errors}
            name="recentTransactions"
            label="Recent Transaction Volume (Last 12 Months)*"
            placeholder="Select transaction volume*"
            options={TRANSACTION_VOLUME_OPTIONS}
            required
          />

          {/* Qualification Message */}
          <FormTextarea
            register={register}
            errors={errors}
            name="qualificationMessage"
            label="Why do you want to work with RealTechee?*"
            placeholder="Tell us about your goals, what makes you a great agent, and how you envision partnering with RealTechee..."
            rows={5}
            required
          />
        </FormSection>

        {/* Submit Button */}
        <FormFooter
          isLoading={isLoading}
          submitText="Submit Agent Qualification"
          loadingText="Submitting..."
          showRequiredNote={false}
        />
      </form>
    </div>
  );
};

export default GetQualifiedForm;