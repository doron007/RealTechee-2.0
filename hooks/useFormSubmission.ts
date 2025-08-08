/**
 * Reusable hook for form submission state management with UX enhancements
 */

import { useState, useCallback } from 'react';
import { scrollToTop } from '../lib/scrollUtils';
import logger from '../lib/logger';

export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface UseFormSubmissionOptions {
  /**
   * Whether to automatically scroll to top on success
   */
  scrollToTopOnSuccess?: boolean;
  
  /**
   * How long to wait before auto-resetting error status (in ms)
   * Set to 0 to disable auto-reset (recommended for better UX)
   */
  errorResetDelay?: number;
  
  /**
   * Form identifier for logging purposes
   */
  formName?: string;
}

export const useFormSubmission = (options: UseFormSubmissionOptions = {}) => {
  const {
    scrollToTopOnSuccess = true,
    errorResetDelay = 0, // Default to persistent errors for better UX
    formName = 'Unknown Form'
  } = options;

  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<Error | null>(null);

  /**
   * Starts the submission process
   */
  const startSubmission = useCallback(() => {
    logger.info(`=== ${formName.toUpperCase()} SUBMISSION STARTED ===`, {
      timestamp: new Date().toISOString()
    });
    
    setStatus('submitting');
    setIsSubmitting(true);
  }, [formName]);

  /**
   * Marks submission as successful
   */
  const markSuccess = useCallback(() => {
    logger.info(`=== ${formName.toUpperCase()} SUBMISSION COMPLETED SUCCESSFULLY ===`, {
      timestamp: new Date().toISOString()
    });
    
    setStatus('success');
    setIsSubmitting(false);
    
    if (scrollToTopOnSuccess) {
      scrollToTop();
    }
  }, [formName, scrollToTopOnSuccess]);

  /**
   * Marks submission as failed with detailed error information
   */
  const markError = useCallback((error?: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error || 'Unknown error');
    const errorMessage = errorObj.message;
    
    logger.error(`=== ${formName.toUpperCase()} SUBMISSION FAILED ===`, {
      timestamp: new Date().toISOString(),
      error: errorMessage,
      stack: errorObj.stack
    });
    
    setStatus('error');
    setIsSubmitting(false);
    setErrorDetails(errorObj);
    
    // Only auto-reset if explicitly configured
    if (errorResetDelay > 0) {
      setTimeout(() => {
        setStatus('idle');
        setErrorDetails(null);
      }, errorResetDelay);
    }
  }, [formName, errorResetDelay]);

  /**
   * Resets the submission state to idle
   */
  const reset = useCallback(() => {
    logger.info(`=== ${formName.toUpperCase()} SUBMISSION RESET ===`);
    setStatus('idle');
    setIsSubmitting(false);
    setErrorDetails(null);
  }, [formName]);

  /**
   * Generic submission handler that wraps async operations
   */
  const handleSubmission = useCallback(async <T>(
    submissionFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      startSubmission();
      const result = await submissionFn();
      markSuccess();
      return result;
    } catch (error) {
      markError(error as Error);
      return null;
    }
  }, [startSubmission, markSuccess, markError]);

  return {
    status,
    isSubmitting,
    isIdle: status === 'idle',
    isSuccess: status === 'success',
    isError: status === 'error',
    errorDetails,
    startSubmission,
    markSuccess,
    markError,
    reset,
    handleSubmission
  };
};