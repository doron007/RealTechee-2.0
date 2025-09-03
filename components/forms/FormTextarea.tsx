import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import FormFieldWrapper from './FormFieldWrapper';
import FormFieldContainer from './FormFieldContainer';

interface FormTextareaProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

/**
 * FormTextarea component using enterprise wrapper components
 * Dramatically reduced from 67 lines to ~40 lines
 * Leverages FormFieldWrapper and FormFieldContainer for consistency
 */
export function FormTextarea<T extends Record<string, any>>({
  register,
  errors,
  name,
  label,
  placeholder = "",
  required = false,
  rows = 4,
  maxLength,
  className = ""
}: FormTextareaProps<T>) {

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
        <FormFieldContainer hasError={hasError} size="md">
          <textarea
            {...register(name)}
            id={fieldId}
            className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.4] resize-none placeholder:text-[#646469]"
            style={{ fontSize: 'max(16px, 1rem)' }}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            required={required}
          />
        </FormFieldContainer>
      )}
    </FormFieldWrapper>
  );
}

export default FormTextarea;