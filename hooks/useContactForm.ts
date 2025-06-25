/**
 * useContactForm hook - Centralizes common form logic
 * Eliminates duplication across all contact forms
 */

import React from 'react';
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ObjectSchema } from 'yup';
import { scrollToTop } from '../lib/scrollUtils';
import logger from '../lib/logger';
import { FormSubmissionStatus } from '../types/forms';
import { getStandardSubmissionMetadata } from '../lib/utils/formUtils';

interface UseContactFormOptions<T extends FieldValues> {
  validationSchema: ObjectSchema<any>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T & FormSubmissionStatus) => void;
  formName: string;
}

interface UseContactFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  onFormSubmit: (data: T) => void;
  onFormError: (errors: any) => void;
}

/**
 * Common form hook that handles:
 * - Form setup with React Hook Form
 * - Validation with Yup
 * - Submission logic with logging
 * - Error handling with auto-focus
 * - Scroll management
 */
export function useContactForm<T extends FieldValues>({
  validationSchema,
  defaultValues,
  onSubmit,
  formName
}: UseContactFormOptions<T>): UseContactFormReturn<T> {
  
  const formMethods = useForm<T>({
    resolver: yupResolver(validationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: defaultValues as any
  });

  const { formState: { errors } } = formMethods;

  // Standardized form submission handler
  const onFormSubmit = (data: T) => {
    logger.info(`=== ${formName.toUpperCase()} FORM SUBMISSION ===`, {
      timestamp: new Date().toISOString(),
      formName,
      rawFormData: data,
      hasErrors: Object.keys(errors).length > 0
    });

    // Add standard submission metadata
    const formattedData: T & FormSubmissionStatus = {
      ...data,
      ...getStandardSubmissionMetadata()
    };

    // Scroll to top on successful submission
    scrollToTop();
    
    // Call the provided onSubmit handler
    onSubmit(formattedData);
  };

  // Standardized error handling
  const onFormError = (errors: any) => {
    logger.error(`=== ${formName.toUpperCase()} FORM VALIDATION FAILED ===`, {
      timestamp: new Date().toISOString(),
      formName,
      errorCount: Object.keys(errors).length,
      errors
    });

    // Auto-focus first error field with smooth scroll
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

  // Debug logging for form state changes
  React.useEffect(() => {
    logger.info(`${formName} validation state changed:`, {
      hasErrors: Object.keys(errors).length > 0,
      errorCount: Object.keys(errors).length,
      errors
    });
  }, [errors, formName]);

  return {
    ...formMethods,
    onFormSubmit,
    onFormError
  };
}

// Utility functions consolidated to lib/utils/formUtils.ts
// Re-export for backward compatibility
export { generateSessionId, toCamelCase } from '../lib/utils/formUtils';