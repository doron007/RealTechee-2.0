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

// Types based on backend field mappings for General Inquiry
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

interface GeneralInquiryFormData {
  // Contact Information
  contactInfo: BaseContactInfo;
  
  // Address Information
  address: AddressInfo;
  
  // Inquiry Details
  product: string;
  subject: string;
  message: string;
}

// Validation schema - simpler than GetEstimate (no agent/homeowner complexity)
const inquiryValidationSchema = yup.object({
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
  
  product: yup.string().required('Please select a product'),
  subject: yup.string().required('Subject is required'),
  message: yup.string().min(10, 'Message must be at least 10 characters').required('Message is required')
}).required();

interface GeneralInquiryFormProps {
  onSubmit: (data: GeneralInquiryFormData) => void;
  isLoading?: boolean;
}

export const GeneralInquiryForm: React.FC<GeneralInquiryFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors }
  } = useForm<GeneralInquiryFormData>({
    resolver: yupResolver(inquiryValidationSchema),
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
      product: '',
      subject: '',
      message: ''
    }
  });


  // Form submission with validation and logging
  const onFormSubmit = (data: GeneralInquiryFormData) => {
    logger.info('=== GENERAL INQUIRY FORM SUBMISSION ===', {
      timestamp: new Date().toISOString(),
      formData: {
        hasContactInfo: !!data.contactInfo?.fullName && !!data.contactInfo?.email,
        hasAddress: !!data.address?.streetAddress && !!data.address?.city,
        hasInquiryDetails: !!data.product && !!data.subject && !!data.message,
        messageLength: data.message?.length || 0
      }
    });

    logger.info('=== GENERAL INQUIRY VALIDATION PASSED ===', {
      contactInfo: {
        hasFullName: !!data.contactInfo.fullName,
        hasEmail: !!data.contactInfo.email,
        hasPhone: !!data.contactInfo.phone
      },
      address: {
        hasStreetAddress: !!data.address.streetAddress,
        hasCity: !!data.address.city,
        hasState: !!data.address.state,
        hasZip: !!data.address.zip
      },
      inquiry: {
        hasProduct: !!data.product,
        hasSubject: !!data.subject,
        hasMessage: !!data.message,
        messageLength: data.message.length
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
    logger.error('=== GENERAL INQUIRY FORM VALIDATION FAILED ===', {
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

        {/* Inquiry Details Section */}
        <div className="flex flex-col gap-4">
          <SectionTitle className="text-[#2A2B2E]">
            Inquiry Details
          </SectionTitle>
          
          <div className="flex flex-col gap-4">
            {/* Product Selection */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Product*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 flex items-center justify-between ${errors.product ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <select
                    {...register('product')}
                    className={`w-full bg-transparent border-0 outline-0 text-base font-normal leading-[1.6] appearance-none ${
                      watch('product') ? 'text-[#2A2B2E]' : 'text-[#646469]'
                    }`}
                  >
                    <option value="">Select a product*</option>
                    <option value="Property Booster">Property Booster</option>
                    <option value="Design Services">Design Services</option>
                    <option value="Construction Management">Construction Management</option>
                    <option value="Real Estate Services">Real Estate Services</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Other">Other</option>
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <path d="M4 8L12 16L20 8" stroke="#2A2B2E" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <ErrorMessage
                  errors={errors}
                  name="product"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Subject */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Subject*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.subject ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <input
                    {...register('subject')}
                    className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                    placeholder="Brief description of your inquiry"
                  />
                </div>
                <ErrorMessage
                  errors={errors}
                  name="subject"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Message */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
                  Message*
                </BodyContent>
                <div className={`w-full bg-white border rounded px-6 py-4 h-[120px] ${errors.message ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <textarea
                    {...register('message')}
                    className="w-full h-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] resize-none placeholder:text-[#646469]"
                    placeholder="Please provide details about your inquiry, questions, or how we can help you..."
                  />
                </div>
                <ErrorMessage
                  errors={errors}
                  name="message"
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
            {isLoading ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeneralInquiryForm;