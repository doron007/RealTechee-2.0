import React from 'react';
import ContactInfoFields from './ContactInfoFields';
import AddressFields from './AddressFields';
import FormDropdown from './FormDropdown';
import FormInput from './FormInput';
import FormTextarea from './FormTextarea';
import FormSection from './FormSection';
import FormFooter from './FormFooter';
import { useContactForm } from '../../hooks/useContactForm';
import { generalInquiryValidationSchema } from '../../lib/validation/generalInquirySchema';
import { PRODUCT_OPTIONS, DEFAULT_FORM_VALUES } from '../../lib/constants/formOptions';
import { GeneralInquiryFormData, BaseFormProps } from '../../types/forms';

// Form default values using enterprise constants
const defaultValues: Partial<GeneralInquiryFormData> = {
  contactInfo: DEFAULT_FORM_VALUES.CONTACT_INFO,
  address: DEFAULT_FORM_VALUES.ADDRESS_INFO,
  product: '',
  subject: '',
  message: ''
};

export const GeneralInquiryForm: React.FC<BaseFormProps<GeneralInquiryFormData>> = ({
  onSubmit,
  isLoading = false
}) => {
  // Use enterprise form hook
  const {
    register,
    handleSubmit,
    formState: { errors },
    onFormSubmit,
    onFormError
  } = useContactForm<GeneralInquiryFormData>({
    validationSchema: generalInquiryValidationSchema,
    defaultValues,
    onSubmit,
    formName: 'General Inquiry'
  });

  return (
    <div className="w-full max-w-[692px] flex flex-col gap-6 sm:gap-8">
      <form 
        onSubmit={handleSubmit(onFormSubmit, onFormError)} 
        className="w-full flex flex-col gap-6 sm:gap-8"
      >
        {/* Contact Information Section */}
        <FormSection title="Contact Information">
          <ContactInfoFields
            register={register}
            errors={errors}
            prefix="contactInfo"
          />
        </FormSection>

        {/* Address Section */}
        <FormSection title="Address">
          <AddressFields
            register={register}
            errors={errors}
            prefix="address"
          />
        </FormSection>

        {/* Product and Subject Section */}
        <FormSection title="Inquiry Details">
          <FormDropdown
            register={register}
            errors={errors}
            name="product"
            label="Product Interest"
            placeholder="What product are you interested in?*"
            options={PRODUCT_OPTIONS}
            required
          />
          
          <FormInput
            register={register}
            errors={errors}
            name="subject"
            label="Subject"
            placeholder="Brief subject line*"
            required
          />
          
          <FormTextarea
            register={register}
            errors={errors}
            name="message"
            label="Message"
            placeholder="Tell us more about your project and how we can help*"
            required
            rows={6}
          />
        </FormSection>

        {/* Footer */}
        <FormFooter
          isLoading={isLoading}
          submitText="Send"
          loadingText="Submitting..."
        />
      </form>
    </div>
  );
};

export default GeneralInquiryForm;