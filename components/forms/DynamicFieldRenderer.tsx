/**
 * DynamicFieldRenderer - Renders fields based on configuration
 * Eliminates repetitive field declarations through iterative rendering
 */

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import FormDropdown from './FormDropdown';
import FormInput from './FormInput';
import FormTextarea from './FormTextarea';
import FormRadioGroup from './FormRadioGroup';
import ContactInfoFields from './ContactInfoFields';
import AddressFields from './AddressFields'; 
import {
  DynamicFieldConfig,
  DropdownFieldConfig,
  InputFieldConfig,
  TextareaFieldConfig,
  RadioGroupFieldConfig,
  RadioButtonsFieldConfig,
  ConditionalFieldConfig
} from '../../lib/constants/fieldConfigs';

interface DynamicFieldRendererProps<T extends Record<string, any>> {
  field: DynamicFieldConfig;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  watch: UseFormWatch<T>;
  className?: string;
}

/**
 * Renders a single field based on its configuration
 * Supports all form field types with consistent styling
 */
export function DynamicFieldRenderer<T extends Record<string, any>>({
  field,
  register,
  errors,
  watch,
  className = ""
}: DynamicFieldRendererProps<T>) {

  // Handle conditional fields
  if (field.type === 'conditional') {
    const conditionalField = field as ConditionalFieldConfig;
    const watchedValue = watch(conditionalField.condition.watchField as any);
    const shouldShow = conditionalField.condition.operator === '===' 
      ? watchedValue === conditionalField.condition.value
      : watchedValue !== conditionalField.condition.value;

    if (!shouldShow) return null;

    return (
      <div className="w-full mt-4">
        <DynamicFieldRenderer
          field={conditionalField.field}
          register={register}
          errors={errors}
          watch={watch}
          className={className}
        />
      </div>
    );
  }

  // Render different field types
  switch (field.type) {
    case 'dropdown':
      return renderDropdownField(field as DropdownFieldConfig, register, errors, className);
    
    case 'input':
      return renderInputField(field as InputFieldConfig, register, errors, className);
    
    case 'textarea':
      return renderTextareaField(field as TextareaFieldConfig, register, errors, className);
    
    case 'radio-group':
      return renderRadioGroupField(field as RadioGroupFieldConfig, register, errors, watch, className);
    
    case 'radio-buttons':
      return renderRadioButtonsField(field as RadioButtonsFieldConfig, register, watch, className);
    
    case 'address-group':
      return (
        <AddressFields
          register={register}
          errors={errors}
          prefix={field.name as any}
          addressLabel={(field as any).addressLabel}
        />
      );
    
    case 'contact-group':
      return (
        <ContactInfoFields
          register={register}
          errors={errors}
          prefix={field.name as any}
          nameLabel={(field as any).nameLabel}
          emailLabel={(field as any).emailLabel}
          phoneLabel={(field as any).phoneLabel}
        />
      );
    
    default:
      console.warn(`Unknown field type: ${(field as any).type}`);
      return null;
  }
}

// Dropdown field renderer
function renderDropdownField<T extends Record<string, any>>(
  field: DropdownFieldConfig,
  register: UseFormRegister<T>,
  errors: FieldErrors<T>,
  className: string
) {
  return (
    <FormDropdown
      register={register}
      errors={errors}
      name={field.name as any}
      label={field.label || ''}
      placeholder={field.placeholder}
      options={field.options}
      required={field.required}
      defaultValue={field.defaultValue}
      className={`${className} ${field.className || ''}`}
    />
  );
}

// Input field renderer
function renderInputField<T extends Record<string, any>>(
  field: InputFieldConfig,
  register: UseFormRegister<T>,
  errors: FieldErrors<T>,
  className: string
) {
  return (
    <FormInput
      register={register}
      errors={errors}
      name={field.name as any}
      label={field.label || ''}
      placeholder={field.placeholder}
      type={field.inputType}
      required={field.required}
      maxLength={field.maxLength}
      onBlur={field.onBlur}
      className={`${className} ${field.className || ''}`}
    />
  );
}

// Textarea field renderer
function renderTextareaField<T extends Record<string, any>>(
  field: TextareaFieldConfig,
  register: UseFormRegister<T>,
  errors: FieldErrors<T>,
  className: string
) {
  return (
    <FormTextarea
      register={register}
      errors={errors}
      name={field.name as any}
      label={field.label || ''}
      placeholder={field.placeholder}
      required={field.required}
      rows={field.rows}
      maxLength={field.maxLength}
      className={`${className} ${field.className || ''}`}
    />
  );
}

// Radio group field renderer
function renderRadioGroupField<T extends Record<string, any>>(
  field: RadioGroupFieldConfig,
  register: UseFormRegister<T>,
  errors: FieldErrors<T>,
  watch: UseFormWatch<T>,
  className: string
) {
  return (
    <FormRadioGroup
      register={register}
      watch={watch}
      errors={errors}
      name={field.name as any}
      label={field.label || ''}
      options={field.options}
      required={field.required}
      direction={field.direction}
      className={`${className} ${field.className || ''}`}
    />
  );
}

// Radio buttons field renderer (for meeting type selection)
function renderRadioButtonsField<T extends Record<string, any>>(
  field: RadioButtonsFieldConfig,
  register: UseFormRegister<T>,
  watch: UseFormWatch<T>,
  className: string
) {
  const watchedValue = watch(field.name as any);
  const isResponsive = field.layout === 'responsive';
  const layoutClass = isResponsive 
    ? 'flex flex-col sm:flex-row gap-3 sm:gap-5 w-full'
    : field.layout === 'horizontal' 
      ? 'flex flex-row gap-5 w-full'
      : 'flex flex-col gap-3 w-full';

  return (
    <div className={`${className} ${field.className || ''}`}>
      <div className={layoutClass}>
        {field.options.map((option) => (
          <label
            key={option.value}
            className={`${field.buttonClassName || 'px-6 py-4 rounded border text-center cursor-pointer'} ${
              watchedValue === option.value
                ? 'bg-[#000000] text-white border-[#2A2B2E]'
                : 'bg-white text-[#2A2B2E] border-[#2A2B2E]'
            }`}
          >
            <input
              {...register(field.name as any)}
              type="radio"
              value={option.value}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default DynamicFieldRenderer;