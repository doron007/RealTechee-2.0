/**
 * FormDateInput component - Standardizes date input styling with icon
 * Eliminates duplicate date input patterns across forms
 */

import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { CalendarToday } from '@mui/icons-material';
import FormFieldWrapper from './FormFieldWrapper';
import FormFieldContainer from './FormFieldContainer';

interface FormDateInputProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

/**
 * Standardized date input with calendar icon
 * Provides consistent styling and behavior across all forms
 */
export function FormDateInput<T extends Record<string, any>>({
  register,
  errors,
  name,
  label,
  placeholder = "Please pick a date",
  required = false,
  min,
  max,
  className = ""
}: FormDateInputProps<T>) {

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
        <FormFieldContainer hasError={hasError} size="md" className="relative flex items-center justify-between">
          <input
            {...register(name)}
            id={fieldId}
            type="date"
            className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#646469] leading-[1.6] pr-8"
            placeholder={placeholder}
            min={min}
            max={max}
          />
          <CalendarToday 
            sx={{ 
              color: '#2A2B2E',
              fontSize: 24,
              flexShrink: 0,
              position: 'absolute',
              right: 16,
              pointerEvents: 'none'
            }}
          />
        </FormFieldContainer>
      )}
    </FormFieldWrapper>
  );
}

export default FormDateInput;