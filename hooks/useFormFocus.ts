/**
 * Reusable hook for form focus management and error handling
 */

import { useRef, useCallback } from 'react';
import { scrollToAndFocus } from '../lib/scrollUtils';
import logger from '../lib/logger';

export interface FormFieldRef {
  field: string;
  ref: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>;
}

export interface UseFormFocusOptions {
  /**
   * Priority order of fields to check for errors
   * Higher priority fields will be focused first
   */
  fieldPriority?: FormFieldRef[];
  
  /**
   * Offset from top when scrolling to error field
   */
  scrollOffset?: number;
  
  /**
   * Delay before focusing element after scroll
   */
  focusDelay?: number;
  
  /**
   * Whether to use CSS selector fallback for finding error fields
   */
  useCSSFallback?: boolean;
}

export const useFormFocus = (options: UseFormFocusOptions = {}) => {
  const {
    fieldPriority = [],
    scrollOffset = 100,
    focusDelay = 300,
    useCSSFallback = true
  } = options;

  const formRef = useRef<HTMLFormElement>(null);

  /**
   * Scrolls to and focuses the first invalid field based on error object
   */
  const scrollToFirstError = useCallback((errors: any) => {
    logger.info('useFormFocus: Starting error focus handling', {
      errorCount: Object.keys(errors).length,
      hasFieldPriority: fieldPriority.length > 0,
      useCSSFallback
    });

    // Method 1: Use provided field priority list
    if (fieldPriority.length > 0) {
      for (const { field, ref } of fieldPriority) {
        const fieldParts = field.split('.');
        let errorObj = errors;
        
        // Navigate through nested error object
        for (const part of fieldParts) {
          errorObj = errorObj?.[part];
        }

        if (errorObj && ref.current) {
          logger.info('useFormFocus: Found error field via priority list', { field });
          scrollToAndFocus(ref.current, scrollOffset, focusDelay);
          return;
        }
      }
    }

    // Method 2: CSS selector fallback for forms using error styling
    if (useCSSFallback) {
      setTimeout(() => {
        // Find the first input/select/textarea element with error border styling
        const errorElement = formRef.current?.querySelector(
          '.border-\\[\\#D11919\\] input, .border-\\[\\#D11919\\] select, .border-\\[\\#D11919\\] textarea'
        ) as HTMLElement;
        
        if (errorElement) {
          logger.info('useFormFocus: Found error field via CSS selector');
          scrollToAndFocus(errorElement, scrollOffset, focusDelay);
          return;
        }

        // Method 3: Generic form field fallback
        const firstInput = formRef.current?.querySelector(
          'input:invalid, select:invalid, textarea:invalid'
        ) as HTMLElement;
        
        if (firstInput) {
          logger.info('useFormFocus: Found error field via :invalid selector');
          scrollToAndFocus(firstInput, scrollOffset, focusDelay);
          return;
        }

        logger.warn('useFormFocus: No error field found for focusing');
      }, 100); // Wait for DOM update after error state change
    }
  }, [fieldPriority, scrollOffset, focusDelay, useCSSFallback]);

  return {
    formRef,
    scrollToFirstError
  };
};