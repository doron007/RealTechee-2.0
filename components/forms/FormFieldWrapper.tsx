/**
 * FormFieldWrapper - Universal wrapper for form fields
 * Eliminates 150+ lines of duplicate container/label/error patterns
 * Provides consistent behavior across all form components
 */

import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import P3 from '../typography/P3';

interface FormFieldWrapperProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  required?: boolean;
  children: (hasError: boolean, fieldId: string) => React.ReactNode;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

/**
 * Universal form field wrapper that handles:
 * - Consistent label rendering with required indicators
 * - Error state detection and styling
 * - Nested field path error handling
 * - Consistent spacing and layout
 * - Accessibility attributes
 */
export function FormFieldWrapper<T extends Record<string, any>>({
  register,
  errors,
  name,
  label,
  required = false,
  children,
  className = "",
  containerClassName = "flex flex-col gap-1",
  labelClassName = "text-[#2A2B2E]",
  errorClassName = "text-[#D11919] mt-1"
}: FormFieldWrapperProps<T>) {
  
  // Handle nested field paths (e.g., "contactInfo.email")
  const getNestedError = (errors: any, path: string) => {
    return path.split('.').reduce((obj, key) => obj?.[key], errors);
  };
  
  const hasError = Boolean(getNestedError(errors, name as string));
  const fieldId = `field-${name}`;

  return (
    <div className={`w-full ${className}`}>
      <div className={containerClassName}>
        {/* Label with consistent styling and required indicator */}
        {label && (
          <label htmlFor={fieldId} className={`text-base font-normal ${labelClassName} leading-[1.6]`}>
            {label}{required && '*'}
          </label>
        )}
        
        {/* Field content with error state passed to children */}
        {children(hasError, fieldId)}
        
        {/* Consistent error message rendering */}
        <ErrorMessage
          errors={errors}
          name={name as any}
          render={({ message }) => (
            <P3 className={errorClassName}>
              {message}
            </P3>
          )}
        />
      </div>
    </div>
  );
}

export default FormFieldWrapper;