import React, { ReactNode } from 'react';

interface ContentWrapperProps {
  children: ReactNode;
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
  maxWidth?: string;
}

/**
 * A wrapper component for content sections that applies consistent styling
 * Used primarily for text content in multi-column layouts
 */
export default function ContentWrapper({
  children,
  className = '',
  textAlign = 'left',
  verticalAlign = 'center',
  maxWidth = '90%'
}: ContentWrapperProps) {
  // Map text alignment to classes
  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  // Map vertical alignment to classes
  const verticalAlignClasses = {
    top: 'justify-start',
    center: 'justify-center',
    bottom: 'justify-end'
  };

  // Construct max-width class if provided
  const maxWidthClass = maxWidth ? `lg:max-w-[${maxWidth}]` : '';
  
  return (
    <div className={`flex flex-col h-full ${verticalAlignClasses[verticalAlign]} items-center lg:items-${textAlign === 'center' ? 'center' : 'start'} ${textAlignClasses[textAlign]} ${maxWidthClass} ${className}`}>
      {children}
    </div>
  );
}