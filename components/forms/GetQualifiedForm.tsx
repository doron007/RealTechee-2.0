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
  const watchedSpecialties = watch('specialties') || [];

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

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    const currentSpecialties = watchedSpecialties;
    if (checked) {
      register('specialties').onChange({
        target: { 
          name: 'specialties', 
          value: [...currentSpecialties, specialty] 
        }
      });
    } else {
      register('specialties').onChange({
        target: { 
          name: 'specialties', 
          value: currentSpecialties.filter(s => s !== specialty) 
        }
      });
    }
  };

  const brokerageOptions = [
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

  const specialtyOptions = [
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

  return (
    <div className="w-full max-w-[692px] flex flex-col gap-8">
      <form onSubmit={handleSubmit(onFormSubmit, onFormError)} className="w-full flex flex-col gap-8">
        
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
          <SectionTitle className="text-[#2A2B2E]">
            Address Information
          </SectionTitle>
          
          <div className="flex flex-col gap-4">
            <AddressFields
              register={register}
              errors={errors}
              prefix="address"
            />
          </div>
        </div>

        {/* Agent Qualification Section */}
        <div className="flex flex-col gap-4">
          <SectionTitle className="text-[#2A2B2E]">
            Agent Qualification
          </SectionTitle>
          
          <div className="flex flex-col gap-4">
            {/* License Number */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Real Estate License Number*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.licenseNumber ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <input
                    {...register('licenseNumber')}
                    className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                    placeholder="Enter your license number"
                  />
                </div>
                <ErrorMessage
                  errors={errors}
                  name="licenseNumber"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Brokerage */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Brokerage*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 relative flex items-center ${errors.brokerage ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <select
                    {...register('brokerage')}
                    className={`w-full bg-transparent border-0 outline-0 text-base font-normal leading-[1.6] appearance-none pr-8 ${
                      watch('brokerage') ? 'text-[#2A2B2E]' : 'text-[#646469]'
                    }`}
                  >
                    <option value="">Select your brokerage*</option>
                    {brokerageOptions.map(option => (
                      <option key={option} value={option}>
                        {option === 'other' ? 'Other (please specify)' : option}
                      </option>
                    ))}
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <path d="M4 8L12 16L20 8" stroke="#2A2B2E" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <ErrorMessage
                  errors={errors}
                  name="brokerage"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Custom Brokerage (conditional) */}
            {watchedBrokerage === 'other' && (
              <div className="w-full">
                <div className="flex flex-col gap-1">
                  <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                    Specify Brokerage*
                  </BodyContent>
                  <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.customBrokerage ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                    <input
                      {...register('customBrokerage')}
                      className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                      placeholder="Enter your brokerage name"
                    />
                  </div>
                  <ErrorMessage
                    errors={errors}
                    name="customBrokerage"
                    render={({ message }) => (
                      <SubContent className="text-[#D11919] mt-1">
                        {message}
                      </SubContent>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Experience Years */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Years of Experience*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 relative flex items-center ${errors.experienceYears ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <select
                    {...register('experienceYears')}
                    className={`w-full bg-transparent border-0 outline-0 text-base font-normal leading-[1.6] appearance-none pr-8 ${
                      watch('experienceYears') ? 'text-[#2A2B2E]' : 'text-[#646469]'
                    }`}
                  >
                    <option value="">Select experience level*</option>
                    <option value="0-1">0-1 years (New Agent)</option>
                    <option value="2-5">2-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="11-15">11-15 years</option>
                    <option value="16+">16+ years (Veteran)</option>
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <path d="M4 8L12 16L20 8" stroke="#2A2B2E" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <ErrorMessage
                  errors={errors}
                  name="experienceYears"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Primary Markets */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Primary Markets*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 ${errors.primaryMarkets ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <textarea
                    {...register('primaryMarkets')}
                    className="w-full h-[80px] bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] resize-none placeholder:text-[#646469]"
                    placeholder="List the cities, neighborhoods, or regions where you primarily work..."
                  />
                </div>
                <ErrorMessage
                  errors={errors}
                  name="primaryMarkets"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919]">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Specialties (Checkboxes) */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Specialties* (Select all that apply)
                </BodyContent>
                <div className="grid grid-cols-2 gap-3">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('specialties')}
                        value={specialty}
                        onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                        className="w-5 h-5 text-[#000000] bg-gray-100 border-gray-300 rounded focus:ring-[#000000] focus:ring-2"
                      />
                      <BodyContent className="text-[#2A2B2E]" spacing="none">
                        {specialty}
                      </BodyContent>
                    </label>
                  ))}
                </div>
                <ErrorMessage
                  errors={errors}
                  name="specialties"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Recent Transaction Volume (Last 12 Months)*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 relative flex items-center ${errors.recentTransactions ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <select
                    {...register('recentTransactions')}
                    className={`w-full bg-transparent border-0 outline-0 text-base font-normal leading-[1.6] appearance-none pr-8 ${
                      watch('recentTransactions') ? 'text-[#2A2B2E]' : 'text-[#646469]'
                    }`}
                  >
                    <option value="">Select transaction volume*</option>
                    <option value="0">0 transactions</option>
                    <option value="1-5">1-5 transactions</option>
                    <option value="6-10">6-10 transactions</option>
                    <option value="11-25">11-25 transactions</option>
                    <option value="26-50">26-50 transactions</option>
                    <option value="50+">50+ transactions</option>
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <path d="M4 8L12 16L20 8" stroke="#2A2B2E" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <ErrorMessage
                  errors={errors}
                  name="recentTransactions"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Qualification Message */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Why do you want to work with RealTechee?*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 h-[120px] ${errors.qualificationMessage ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <textarea
                    {...register('qualificationMessage')}
                    className="w-full h-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] resize-none placeholder:text-[#646469]"
                    placeholder="Tell us about your goals, what makes you a great agent, and how you envision partnering with RealTechee..."
                  />
                </div>
                <ErrorMessage
                  errors={errors}
                  name="qualificationMessage"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919]">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

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
            {isLoading ? 'Submitting...' : 'Submit Agent Qualification'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GetQualifiedForm;