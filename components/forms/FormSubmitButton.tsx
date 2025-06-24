/**
 * FormSubmitButton component - Standardizes submit button across all forms
 * Eliminates duplicate submit button styling and behavior
 */

import React from 'react';

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
  const baseClasses = "bg-[#2A2B2E] text-white rounded px-6 py-4 flex items-center justify-center gap-4 text-base font-[800] leading-[1.2] font-nunito";
  const widthClass = width === 'full' ? 'w-full' : 'w-full sm:w-[203px]';
  const disabledClass = (isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={`${baseClasses} ${widthClass} ${disabledClass} ${className}`}
    >
      <span>{isLoading ? loadingText : text}</span>
      {!isLoading && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path 
            d="M10.82 4.45L15.37 9L10.82 13.55" 
            stroke="white" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M2.63 9H15.25" 
            stroke="white" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};

export default FormSubmitButton;