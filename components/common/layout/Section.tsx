import React from 'react';
import { ExtendedSectionProps } from '../../../types/components/common/layout';

export type SectionBackground = 'primary' | 'secondary' | 'white' | 'light' | 'black' | 'gray' | 'none';
export type SectionSpacing = 'small' | 'medium' | 'large' | 'none';

/**
 * Props interface for the Section component
 */
export interface SectionProps {
  /** Content to render within the section */
  children: React.ReactNode;
  
  /** Additional CSS classes to apply to the section */
  className?: string;
  
  /** Background color/theme for the section */
  background?: SectionBackground;
  
  /** Vertical spacing (padding) size */
  spacing?: SectionSpacing;
  
  /** HTML ID attribute for the section */
  id?: string;
  
  /** Whether to animate the section on scroll */
  animated?: boolean;
  
  /** Whether to stagger the animation of child elements */
  staggerChildren?: boolean;
  
  /** Delay between each child element animation in milliseconds */
  staggerDelay?: number;
  
  /** Text color for the section content */
  textColor?: 'white' | 'black' | 'default';
  
  /** Whether to display decorative elements in the background */
  withDecorativeElements?: boolean;
  
  /** URL for the background image */
  backgroundImage?: string;
  
  /** URL for the background image on mobile devices */
  mobileBackgroundImage?: string;
  
  /** 
   * Whether to add a semi-transparent overlay over the section
   * Useful for improving text readability over background images
   */
  withOverlay?: boolean;
  
  /** Whether the section content should be constrained to a maximum width */
  constrained?: boolean;
  
  /** Custom margin-top value */
  marginTop?: number | string;
  
  /** Custom margin-bottom value */
  marginBottom?: number | string;
  
  /** 
   * Custom padding-top value
   * Can be a simple value or an object with responsive breakpoints
   */
  paddingTop?: number | string | Record<string, number>;
  
  /** 
   * Custom padding-bottom value
   * Can be a simple value or an object with responsive breakpoints
   */
  paddingBottom?: number | string | Record<string, number>;
  
  /**
   * Opacity percentage for the overlay (0-100)
   * Only applies when withOverlay is true
   */
  overlayOpacity?: number;
}

/**
 * Section component - A versatile container for page sections with various styling options
 * 
 * Features:
 * - Background colors and images
 * - Customizable spacing and constraints
 * - Animation capabilities
 * - Optional overlay for improved text readability over images
 * - Responsive padding options
 */
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
    gray: 'bg-[#353535]',
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