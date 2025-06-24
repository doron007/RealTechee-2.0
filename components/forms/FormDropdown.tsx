import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import FormFieldWrapper from './FormFieldWrapper';
import FormFieldContainer from './FormFieldContainer';

interface FormDropdownProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}

/**
 * FormDropdown component using enterprise wrapper components
 * Dramatically reduced from 87 lines to ~50 lines
 * Leverages FormFieldWrapper and FormFieldContainer for consistency
 */
export function FormDropdown<T extends Record<string, any>>({
  register,
  errors,
  name,
  label,
  placeholder,
  options,
  required = false,
  defaultValue,
  className = ""
}: FormDropdownProps<T>) {

  // Dropdown arrow icon
  const DropdownIcon = () => (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
    >
      <path 
        d="M4 8L12 16L20 8" 
        stroke="#2A2B2E" 
        strokeWidth="0.4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <FormFieldWrapper
      register={register}
      errors={errors}
      name={name}
      label={label}
      required={required}
      className={className}
    >
      {(hasError, fieldId) => (
        <FormFieldContainer hasError={hasError} size="md" className="relative">
          <select
            {...register(name)}
            id={fieldId}
            className="w-full bg-transparent border-0 outline-0 text-sm font-normal leading-[1.4] appearance-none pr-8 text-[#2A2B2E]"
            defaultValue={defaultValue}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <DropdownIcon />
        </FormFieldContainer>
      )}
    </FormFieldWrapper>
  );
}

export default FormDropdown;