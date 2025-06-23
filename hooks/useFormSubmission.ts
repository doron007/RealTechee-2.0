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
   * Set to 0 to disable auto-reset
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
    errorResetDelay = 5000,
    formName = 'Unknown Form'
  } = options;

  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
   * Marks submission as failed
   */
  const markError = useCallback((error?: Error | string) => {
    const errorMessage = error instanceof Error ? error.message : (error || 'Unknown error');
    
    logger.error(`=== ${formName.toUpperCase()} SUBMISSION FAILED ===`, {
      timestamp: new Date().toISOString(),
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    setStatus('error');
    setIsSubmitting(false);
    
    if (errorResetDelay > 0) {
      setTimeout(() => {
        setStatus('idle');
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
    startSubmission,
    markSuccess,
    markError,
    reset,
    handleSubmission
  };
};