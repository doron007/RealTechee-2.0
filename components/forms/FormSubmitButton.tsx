/**
 * FormSubmitButton component - Standardizes submit button across all forms
 * Eliminates duplicate submit button styling and behavior
 */

import React from 'react';
import Button from '../common/buttons/Button';

interface FormSubmitButtonProps {
  isLoading?: boolean;
  text?: string;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  width?: 'full' | 'auto';
}

/**
 * Standardized submit button with loading state and consistent styling
 * Used across all contact forms
 */
export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  isLoading = false,
  text = 'Send',
  loadingText = 'Submitting...',
  disabled = false,
  className = '',
  width = 'auto'
}) => {
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      disabled={isLoading || disabled}
      withIcon={!isLoading}
      text={isLoading ? loadingText : text}
      fullWidth={width === 'full'}
      className={`${width === 'auto' ? 'w-full sm:w-[203px]' : ''} ${className}`}
    />
  );
};

export default FormSubmitButton;