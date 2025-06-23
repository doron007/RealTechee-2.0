import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ErrorMessage } from '@hookform/error-message';
import { SubContent, SectionTitle, BodyContent } from '../Typography';
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
            {/* Full Name - Full Width */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
                  Full name*
                </label>
                <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.contactInfo?.fullName ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <input
                    {...register('contactInfo.fullName')}
                    className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                    placeholder=""
                  />
                </div>
                <ErrorMessage
                  errors={errors}
                  name="contactInfo.fullName"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* Email and Phone - Side by Side */}
            <div className="flex gap-5 w-full">
              {/* Email Address */}
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
                    Email Address*
                  </label>
                  <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.contactInfo?.email ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                    <input
                      {...register('contactInfo.email')}
                      type="email"
                      className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                      placeholder=""
                    />
                  </div>
                  <ErrorMessage
                    errors={errors}
                    name="contactInfo.email"
                    render={({ message }) => (
                      <SubContent className="text-[#D11919] mt-1">
                        {message}
                      </SubContent>
                    )}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
                    Phone Number*
                  </label>
                  <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.contactInfo?.phone ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                    <input
                      {...register('contactInfo.phone')}
                      type="tel"
                      className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                      placeholder="Add 10 digits (numbers only) ..."
                    />
                  </div>
                  <ErrorMessage
                    errors={errors}
                    name="contactInfo.phone"
                    render={({ message }) => (
                      <SubContent className="text-[#D11919] mt-1">
                        {message}
                      </SubContent>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="flex flex-col gap-4">
          <SectionTitle className="text-[#2A2B2E]">
            Address Information
          </SectionTitle>
          
          <div className="flex flex-col gap-4">
            {/* Full Address - Full Width */}
            <div className="w-full">
              <div className="flex flex-col gap-1">
                <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
                  Address*
                </label>
                <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.address?.streetAddress ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                  <input
                    {...register('address.streetAddress')}
                    className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                    placeholder=""
                  />
                </div>
                <ErrorMessage
                  errors={errors}
                  name="address.streetAddress"
                  render={({ message }) => (
                    <SubContent className="text-[#D11919] mt-1">
                      {message}
                    </SubContent>
                  )}
                />
              </div>
            </div>

            {/* City, State, ZIP - Three Column Layout */}
            <div className="flex gap-5 w-full">
              {/* City */}
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
                    City*
                  </label>
                  <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.address?.city ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                    <input
                      {...register('address.city')}
                      className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                      placeholder=""
                    />
                  </div>
                  <ErrorMessage
                    errors={errors}
                    name="address.city"
                    render={({ message }) => (
                      <SubContent className="text-[#D11919] mt-1">
                        {message}
                      </SubContent>
                    )}
                  />
                </div>
              </div>

              {/* State */}
              <div className="w-32">
                <div className="flex flex-col gap-1">
                  <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
                    State*
                  </label>
                  <div className={`w-full bg-white border rounded px-6 py-4 flex items-center justify-between ${errors.address?.state ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                    <select
                      {...register('address.state')}
                      className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] appearance-none"
                    >
                      <option value="AL">AL</option>
                      <option value="AK">AK</option>
                      <option value="AZ">AZ</option>
                      <option value="AR">AR</option>
                      <option value="CA">CA</option>
                      <option value="CO">CO</option>
                      <option value="CT">CT</option>
                      <option value="DE">DE</option>
                      <option value="FL">FL</option>
                      <option value="GA">GA</option>
                      <option value="HI">HI</option>
                      <option value="ID">ID</option>
                      <option value="IL">IL</option>
                      <option value="IN">IN</option>
                      <option value="IA">IA</option>
                      <option value="KS">KS</option>
                      <option value="KY">KY</option>
                      <option value="LA">LA</option>
                      <option value="ME">ME</option>
                      <option value="MD">MD</option>
                      <option value="MA">MA</option>
                      <option value="MI">MI</option>
                      <option value="MN">MN</option>
                      <option value="MS">MS</option>
                      <option value="MO">MO</option>
                      <option value="MT">MT</option>
                      <option value="NE">NE</option>
                      <option value="NV">NV</option>
                      <option value="NH">NH</option>
                      <option value="NJ">NJ</option>
                      <option value="NM">NM</option>
                      <option value="NY">NY</option>
                      <option value="NC">NC</option>
                      <option value="ND">ND</option>
                      <option value="OH">OH</option>
                      <option value="OK">OK</option>
                      <option value="OR">OR</option>
                      <option value="PA">PA</option>
                      <option value="RI">RI</option>
                      <option value="SC">SC</option>
                      <option value="SD">SD</option>
                      <option value="TN">TN</option>
                      <option value="TX">TX</option>
                      <option value="UT">UT</option>
                      <option value="VT">VT</option>
                      <option value="VA">VA</option>
                      <option value="WA">WA</option>
                      <option value="WV">WV</option>
                      <option value="WI">WI</option>
                      <option value="WY">WY</option>
                      <option value="DC">DC</option>
                      <option value="AS">AS</option>
                      <option value="GU">GU</option>
                      <option value="MP">MP</option>
                      <option value="PR">PR</option>
                      <option value="VI">VI</option>
                    </select>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                      <path d="M4 8L12 16L20 8" stroke="#2A2B2E" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <ErrorMessage
                    errors={errors}
                    name="address.state"
                    render={({ message }) => (
                      <SubContent className="text-[#D11919] mt-1">
                        {message}
                      </SubContent>
                    )}
                  />
                </div>
              </div>

              {/* ZIP */}
              <div className="w-32">
                <div className="flex flex-col gap-1">
                  <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
                    ZIP*
                  </label>
                  <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${errors.address?.zip ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
                    <input
                      {...register('address.zip')}
                      className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                      placeholder=""
                    />
                  </div>
                  <ErrorMessage
                    errors={errors}
                    name="address.zip"
                    render={({ message }) => (
                      <SubContent className="text-[#D11919] mt-1">
                        {message}
                      </SubContent>
                    )}
                  />
                </div>
              </div>
            </div>
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