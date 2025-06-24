import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import FormFieldWrapper from './FormFieldWrapper';
import FormFieldContainer from './FormFieldContainer';

interface FormInputProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  required?: boolean;
  maxLength?: number;
  className?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * FormInput component using enterprise wrapper components
 * Dramatically reduced from 70 lines to ~35 lines
 * Leverages FormFieldWrapper and FormFieldContainer for consistency
 */
export function FormInput<T extends Record<string, any>>({
  register,
  errors,
  name,
  label,
  placeholder = "",
  type = "text",
  required = false,
  maxLength,
  className = "",
  onBlur
}: FormInputProps<T>) {

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
          <input
            {...register(name)}
            id={fieldId}
            type={type}
            className="w-full bg-transparent border-0 outline-0 text-sm font-normal text-[#2A2B2E] leading-[1.4] placeholder:text-[#646469]"
            placeholder={placeholder}
            maxLength={maxLength}
            onBlur={onBlur}
          />
        </FormFieldContainer>
      )}
    </FormFieldWrapper>
  );
}

export default FormInput;