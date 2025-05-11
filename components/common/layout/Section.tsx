import React from 'react';
import { ExtendedSectionProps } from '../../../types/components/common/layout';

export type SectionBackground = 'primary' | 'secondary' | 'white' | 'light' | 'black' | 'none';
export type SectionSpacing = 'small' | 'medium' | 'large' | 'none';

// Original section props - keeping for backward compatibility
export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: SectionBackground;
  spacing?: SectionSpacing;
  id?: string;
  animated?: boolean;
  staggerChildren?: boolean;
  staggerDelay?: number;
  textColor?: 'white' | 'black' | 'default';
  // Adding extended props
  withDecorativeElements?: boolean;
  backgroundImage?: string;
  mobileBackgroundImage?: string;
  withOverlay?: boolean;
  constrained?: boolean;
  marginTop?: number | string;
  marginBottom?: number | string;
  paddingTop?: number | string | Record<string, number>;
  paddingBottom?: number | string | Record<string, number>;
  overlayOpacity?: number; // New prop for overlay opacity
}

export default function Section({ 
  children, 
  className = '', 
  background = 'white',
  spacing = 'medium',
  id,
  animated = false,
  staggerChildren = false,
  staggerDelay = 100,
  textColor = 'default',
  // Extended props with defaults
  withDecorativeElements = false,
  backgroundImage,
  mobileBackgroundImage,
  withOverlay = false,
  constrained = true,
  marginTop,
  marginBottom,
  paddingTop,
  paddingBottom,
  overlayOpacity = 40, // Default opacity of 40%
}: SectionProps) {
  // Map background types to actual colors
  const backgroundClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    white: 'bg-white',
    light: 'bg-[#FCF9F8]',
    black: 'bg-black',
    none: ''
  };

  // Map text colors to CSS classes
  const textClasses = {
    white: 'text-white',
    black: 'text-black',
    default: ''
  };

  // Map spacing types to actual padding values
  const spacingClasses = {
    small: 'py-6 sm:py-8 md:py-10',
    medium: 'py-10 sm:py-12 md:py-16 lg:py-20',
    large: 'py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28',
    none: ''
  };

  // Animation classes
  const animationClasses = animated ? 'animate-in' : '';
  const staggerClasses = staggerChildren ? 'stagger-children' : '';

  // Generate inline styles for background images and custom margins/paddings
  const sectionStyles: React.CSSProperties = {};
  
  // Add background image if provided
  if (backgroundImage) {
    sectionStyles.backgroundImage = `url(${backgroundImage})`;
    sectionStyles.backgroundSize = 'cover';
    sectionStyles.backgroundPosition = 'center';
    // Set position relative for background image
    sectionStyles.position = 'relative';
  }

  // Add custom margin and padding if provided as simple values
  if (typeof marginTop === 'number' || typeof marginTop === 'string') {
    sectionStyles.marginTop = marginTop;
  }
  
  if (typeof marginBottom === 'number' || typeof marginBottom === 'string') {
    sectionStyles.marginBottom = marginBottom;
  }
  
  // For simple padding values (not responsive objects)
  if (typeof paddingTop === 'number' || typeof paddingTop === 'string') {
    sectionStyles.paddingTop = paddingTop;
  }
  
  if (typeof paddingBottom === 'number' || typeof paddingBottom === 'string') {
    sectionStyles.paddingBottom = paddingBottom;
  }

  // Generate responsive padding classes if padding is provided as an object
  let responsivePaddingTopClass = '';
  let responsivePaddingBottomClass = '';
  
  if (paddingTop && typeof paddingTop === 'object') {
    // This would be handled with utility classes or inline styles
    // For now we'll just set the default value and handle responsive in CSS
    if (paddingTop.default) {
      sectionStyles.paddingTop = `${paddingTop.default}px`;
    }
  }
  
  if (paddingBottom && typeof paddingBottom === 'object') {
    if (paddingBottom.default) {
      sectionStyles.paddingBottom = `${paddingBottom.default}px`;
    }
  }

  // Combine background and spacing with any custom classes
  let combinedClassName = `section-container ${backgroundClasses[background]} ${textClasses[textColor]} ${animationClasses} ${staggerClasses}`;
  
  // Only add spacing classes if no custom padding is provided
  if (!paddingTop && !paddingBottom) {
    combinedClassName += ` ${spacingClasses[spacing]}`;
  }
  
  // Position relative is necessary for absolute positioning of overlay and decorative elements
  combinedClassName += ' relative';
  
  // Add constrained class for width only to the inner content div
  let contentClassName = 'section-content relative z-10';
  if (constrained) {
    contentClassName += ' max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8';
  }
  
  // Add responsive padding classes
  combinedClassName += ` ${responsivePaddingTopClass} ${responsivePaddingBottomClass}`;
  
  // Add any custom classes
  combinedClassName += ` ${className}`;

  return (
    <section 
      className={combinedClassName} 
      id={id}
      style={sectionStyles}
      {...(staggerChildren && { 'data-stagger-delay': staggerDelay.toString() })}
    >
      {/* Add overlay if withOverlay is true - with customizable opacity */}
      {withOverlay && 
        <div 
          className="absolute inset-0 bg-black z-0" 
          style={{ opacity: overlayOpacity / 100 }}
        ></div>
      }
      
      {/* Decorative elements if specified */}
      {withDecorativeElements && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {/* Add your decorative elements here */}
          <div className="hidden md:block absolute top-10 left-10 w-20 h-20 rounded-full bg-primary-light opacity-30"></div>
          <div className="hidden md:block absolute bottom-10 right-10 w-32 h-32 rounded-full bg-secondary-light opacity-20"></div>
        </div>
      )}
      
      <div className={contentClassName}>
        {children}
      </div>
    </section>
  );
}