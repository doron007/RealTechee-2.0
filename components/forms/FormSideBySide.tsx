/**
 * FormSideBySide - Standardized side-by-side field layout
 * Eliminates duplicate responsive layout patterns
 * Provides consistent spacing and breakpoint behavior
 */

import React from 'react';

interface FormSideBySideProps {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
  breakpoint?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Responsive side-by-side layout for form fields with:
 * - Consistent gap spacing
 * - Mobile-first responsive behavior
 * - Flexible children distribution
 * - Configurable breakpoints
 */
export const FormSideBySide: React.FC<FormSideBySideProps> = ({
  children,
  gap = 'md',
  responsive = true,
  breakpoint = 'sm',
  className = ""
}) => {
  
  // Gap size classes
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4', 
    lg: 'gap-5'   // Default for ContactInfoFields
  };
  
  // Responsive breakpoint classes
  const responsiveClasses = responsive ? {
    sm: 'flex-col sm:flex-row',
    md: 'flex-col md:flex-row',
    lg: 'flex-col lg:flex-row'
  } : {};
  
  const gapClass = gapClasses[gap];
  const responsiveClass = responsive ? responsiveClasses[breakpoint] : 'flex-row';
  
  return (
    <div className={`flex ${responsiveClass} ${gapClass} w-full ${className}`}>
      {React.Children.map(children, (child, index) => (
        <div key={index} className="flex-1">
          {child}
        </div>
      ))}
    </div>
  );
};

export default FormSideBySide;