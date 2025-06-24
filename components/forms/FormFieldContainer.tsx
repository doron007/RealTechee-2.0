/**
 * FormFieldContainer - Standardized input container styling
 * Eliminates 60+ lines of duplicate input container patterns
 * Provides consistent visual styling and height across all input types
 * DEFAULT: px-6 py-4 (56px total height) to match dropdown controls
 */

import React from 'react';

interface FormFieldContainerProps {
  hasError: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

/**
 * Standardized container for form inputs with:
 * - Consistent border/background styling
 * - Error state styling  
 * - Optional icon support
 * - Size variants for different use cases
 * - Consistent 56px height (px-6 py-4) to match dropdown controls
 */
export const FormFieldContainer: React.FC<FormFieldContainerProps> = ({
  hasError,
  children,
  icon,
  className = "",
  size = 'md',
  variant = 'default'
}) => {
  
  // Size-based padding classes
  const sizeClasses = {
    sm: 'px-4 py-2',     // Small - 8px vertical padding
    md: 'px-6 py-4',     // Medium (NEW DEFAULT) - 16px vertical padding to match dropdowns
    lg: 'px-6 py-4'      // Large - 16px vertical padding (same as medium for consistency)
  };
  
  // Variant-based styling
  const variantClasses = {
    default: 'flex items-center',
    compact: 'flex items-center'
  };
  
  // Base container styling with error state
  const baseClasses = "w-full bg-white border rounded";
  const errorClasses = hasError ? 'border-[#D11919]' : 'border-[#D2D2D4]';
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];
  
  return (
    <div className={`${baseClasses} ${errorClasses} ${sizeClass} ${variantClass} ${className}`}>
      {children}
      {icon && (
        <div className="flex-shrink-0 ml-2">
          {icon}
        </div>
      )}
    </div>
  );
};

export default FormFieldContainer;