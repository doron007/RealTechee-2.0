/**
 * FormFooter - Standardized form footer layout
 * Eliminates duplicate footer patterns across all forms
 * Provides consistent spacing and responsive behavior
 */

import React from 'react';
import FormSubmitButton from './FormSubmitButton';
import { SubContent } from '../Typography';

interface FormFooterProps {
  isLoading?: boolean;
  submitText?: string;
  loadingText?: string;
  showRequiredNote?: boolean;
  requiredNoteText?: string;
  onReset?: () => void;
  resetText?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Standardized form footer with:
 * - Consistent responsive layout
 * - Required field indicator
 * - Submit button integration
 * - Optional reset functionality
 * - Custom content support via children
 */
export const FormFooter: React.FC<FormFooterProps> = ({
  isLoading = false,
  submitText = "Send",
  loadingText = "Submitting...",
  showRequiredNote = true,
  requiredNoteText = "*Required field",
  onReset,
  resetText = "Reset",
  className = "",
  children
}) => {
  
  return (
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 w-full ${className}`}>
      {/* Left side - Required note or custom content */}
      <div className="flex items-center gap-4">
        {showRequiredNote && (
          <SubContent className="text-[#2A2B2E] border border-[#FCF9F8]" spacing="none">
            {requiredNoteText}
          </SubContent>
        )}
        
        {/* Optional reset button */}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-[#646469] hover:text-[#2A2B2E] underline"
          >
            {resetText}
          </button>
        )}
        
        {/* Custom content */}
        {children}
      </div>
      
      {/* Right side - Submit button */}
      <FormSubmitButton
        isLoading={isLoading}
        text={submitText}
        loadingText={loadingText}
      />
    </div>
  );
};

export default FormFooter;