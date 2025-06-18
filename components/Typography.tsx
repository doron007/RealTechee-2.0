import React, { ReactNode, ReactElement } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * @fileoverview Consolidated Typography Components
 * 
 * This file contains all the typography components for RealTechee.
 * Consistent type scale and responsive text sizes for all text elements.
 */

// Types and interfaces for typography components
export type TypographySpacing = 'none' | 'small' | 'medium' | 'large';

interface TypographyProps {
  children: ReactNode;
  className?: string;
  spacing?: TypographySpacing;
  as?: React.ElementType;
  center?: boolean;
  textColor?: string; // Add textColor prop to base TypographyProps
}

// Extended interface for SubtitlePill to include uppercase option
interface SubtitlePillProps extends TypographyProps {
  uppercase?: boolean;
  backgroundColor?: string;
}

// Spacing classes for consistent margins across all typography components
const spacingClasses = {
  none: '',
  small: 'mb-4',
  medium: 'mb-6 sm:mb-8',
  large: 'mb-8 sm:mb-10 md:mb-12',
};

/**
 * PAGE AND SECTION HEADERS
 * Primary typography elements for page structure
 */

/**
 * Page Header - Main page heading
 * Size scale:
 * sm: text-2xl (25px)
 * md: text-3xl (31px) 
 * lg: text-3xl (31px)
 * xl: text-4xl (36px)
 * xxl: text-5xl (48px)
 * 2xl: text-5xl (48px) - capped at 48px
 */
export const PageHeader: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'h1',
  spacing = 'large',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-heading font-semibold',
    'text-2xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl xxl:text-5xl 2xl:text-5xl',
    'leading-tight tracking-tight',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Section Title - Main title for page sections
 * Size scale:
 * sm: text-xl (20px)
 * md: text-2xl (25px)
 * lg: text-2xl (25px)
 * xl: text-2xl (25px)
 * xxl: text-3xl (31px)
 * 2xl: text-3xl (31px)
 */
export const SectionTitle: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'h2',
  spacing = 'medium',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-heading font-bold',
    'text-xl sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl xxl:text-3xl 2xl:text-3xl',
    'leading-tight',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Subtitle - Secondary title for sections
 * Size scale:
 * sm: text-lg (18px)
 * md: text-xl (20px)
 * lg: text-xl (20px)
 * xl: text-xl (20px)
 * xxl: text-2xl (25px)
 * 2xl: text-2xl (25px)
 */
export const Subtitle: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'h3',
  spacing = 'small',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-heading font-semibold',
    'text-lg sm:text-lg md:text-xl lg:text-xl xl:text-xl xxl:text-2xl 2xl:text-2xl',
    'leading-snug',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Section Label - Used for labels and category headings
 * Size scale: text-xs sm:text-sm
 */
export const SectionLabel: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'h4',
  spacing = 'small',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'text-xs sm:text-sm uppercase tracking-wider font-semibold',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * BODY TEXT COMPONENTS
 * For general content and paragraphs
 */

/**
 * Body Content - Main body text
 * Size scale:
 * sm: text-sm (14px)
 * md: text-base (16px)
 * lg: text-base (16px)
 * xl: text-lg (18px)
 * xxl: text-lg (18px)
 * 2xl: text-lg (18px)
 */
export const BodyContent: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'p',
  spacing = 'small',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-body font-normal',
    'text-sm sm:text-sm md:text-base lg:text-base xl:text-lg xxl:text-lg 2xl:text-lg',
    'leading-relaxed',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Sub Content - Smaller body text for secondary content
 * Size scale:
 * sm: text-xs (12px)
 * md: text-xs (12px)
 * lg: text-sm (14px)
 * xl: text-sm (14px)
 * xxl: text-base (16px)
 * 2xl: text-base (16px)
 */
export const SubContent: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'p',
  spacing = 'small',
  center = false,
  textColor
}) => {
  const Element = as;
  const classes = twMerge(
    'font-body font-normal',
    'text-xs sm:text-xs md:text-xs lg:text-sm xl:text-sm xxl:text-base 2xl:text-base',
    'leading-relaxed',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  const style = textColor ? { color: textColor } : undefined;
  
  return <Element className={classes} style={style}>{children}</Element>;
};

/**
 * Button Text - Typography for buttons
 * Size scale:
 * sm: text-xs (12px)
 * md: text-sm (14px)
 * lg: text-sm (14px)
 * xl: text-base (16px)
 * xxl: text-base (16px)
 * 2xl: text-base (16px)
 */
export const ButtonText: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'span',
  spacing = 'none',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-inter font-medium',
    'text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base xxl:text-base 2xl:text-base',
    'leading-none',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * CARD TYPOGRAPHY
 * For card components and content blocks
 */

/**
 * CardTitle - For card headers
 * Size scale:
 * sm: text-sm (14px)
 * md: text-base (16px)
 * lg: text-lg (18px)
 * xl: text-lg (18px)
 * xxl: text-lg (18px)
 * 2xl: text-lg (18px)
 */
export const CardTitle: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'h3',
  spacing = 'small',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-heading font-bold',
    'text-sm sm:text-sm md:text-base lg:text-lg xl:text-lg xxl:text-lg 2xl:text-lg',
    'leading-tight',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * CardSubtitle - For card subheaders
 * Size scale:
 * sm: text-xs (12px)
 * md: text-sm (14px)
 * lg: text-sm (14px)
 * xl: text-base (16px)
 * xxl: text-base (16px)
 * 2xl: text-base (16px)
 */
export const CardSubtitle: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'div',
  spacing = 'small',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-heading font-medium',
    'text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base xxl:text-base 2xl:text-base',
    'leading-snug',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * CardContent - For card body content
 * Size scale:
 * sm: text-xs (12px)
 * md: text-xs (12px)
 * lg: text-sm (14px)
 * xl: text-sm (14px)
 * xxl: text-sm (14px)
 * 2xl: text-sm (14px)
 */
export const CardContent: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'p',
  spacing = 'small',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-body font-normal',
    'text-xs sm:text-xs md:text-xs lg:text-sm xl:text-sm xxl:text-sm 2xl:text-sm',
    'leading-relaxed',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * LEGACY/TRADITIONAL HEADING ELEMENTS
 * Classic h1-h6 elements with consistent spacing and sizing
 * Updated according to Figma design: https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot
 */

export const Heading1: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'large',
  center = false
}) => {
  const classes = twMerge(
    'font-nunito font-normal',
    'text-2xl sm:text-3xl md:text-4xl lg:text-[48px]', // explicitly set to 48px
    'leading-[120%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <h1 className={classes}>{children}</h1>;
};

export const Heading2: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'medium',
  center = false
}) => {
  const classes = twMerge(
    'font-nunito font-normal',
    'text-xl sm:text-2xl md:text-3xl lg:text-[39px]', // explicitly set to 39px
    'leading-[120%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <h2 className={classes}>{children}</h2>;
};

export const Heading3: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false
}) => {
  const classes = twMerge(
    'font-nunito font-normal',
    'text-lg sm:text-xl md:text-2xl lg:text-[31px]', // explicitly set to 31px
    'leading-[120%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <h3 className={classes}>{children}</h3>;
};

export const Heading4: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false
}) => {
  const classes = twMerge(
    'font-nunito font-normal',
    'text-base sm:text-lg md:text-xl lg:text-[25px]', // explicitly set to 25px
    'leading-[120%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <h4 className={classes}>{children}</h4>;
};

export const Heading5: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false
}) => {
  const classes = twMerge(
    'font-nunito font-normal',
    'text-sm sm:text-base md:text-lg lg:text-[20px]', // explicitly set to 20px
    'leading-[120%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <h5 className={classes}>{children}</h5>;
};

export const Heading6: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false
}) => {
  const classes = twMerge(
    'font-nunito font-normal',
    'text-xs sm:text-sm md:text-base lg:text-[16px]', // explicitly set to 16px
    'leading-[120%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <h6 className={classes}>{children}</h6>;
};

/**
 * TRADITIONAL BODY TEXT ELEMENTS
 * Classic body text elements with consistent spacing and sizing
 * Updated according to Figma design: https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot
 */

export const Body1: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false,
  as = 'p'
}) => {
  const Element = as;
  const classes = twMerge(
    'font-nunito font-normal',
    'text-base sm:text-lg md:text-xl lg:text-[20px]', // explicitly set to 20px
    'leading-[150%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <Element className={classes}>{children}</Element>;
};

export const Body2: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false,
  as = 'p'
}) => {
  const Element = as;
  const classes = twMerge(
    'font-nunito font-normal',
    'text-sm sm:text-base md:text-lg lg:text-[16px]', // explicitly set to 16px
    'leading-[150%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <Element className={classes}>{children}</Element>;
};

export const Body3: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false,
  as = 'p'
}) => {
  const Element = as;
  const classes = twMerge(
    'font-nunito font-normal',
    'text-xs sm:text-sm md:text-base lg:text-[14px]', // explicitly set to 14px
    'leading-[150%] tracking-[0%]',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <Element className={classes}>{children}</Element>;
};

/**
 * ADDITIONAL SPECIALIZED TEXT COMPONENTS
 * For specific use cases and variations
 */

// Legacy component, kept for backward compatibility
export const SectionLabelOld: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false 
}) => {
  const classes = twMerge(
    'text-xs sm:text-sm uppercase tracking-wider font-semibold',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <div className={classes}>{children}</div>;
};

/**
 * SubtitlePill - For pill-shaped labels
 * @param uppercase - Whether to transform text to uppercase (default: true for backward compatibility)
 * @param backgroundColor - Custom background color (hex, rgb, or named color)
 * @param textColor - Custom text color (hex, rgb, or named color)
 */
export const SubtitlePill: React.FC<SubtitlePillProps> = ({ 
  children, 
  className = '',
  spacing = 'none',
  center = false,
  uppercase = true,
  backgroundColor,
  textColor,
  as = 'span'
}) => {
  const Element = as;
  const classes = twMerge(
    'font-body font-medium py-1 px-3 rounded-full inline-block',
    'text-xs sm:text-xs',
    uppercase ? 'uppercase tracking-wider' : '',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  // Only create style object if custom colors are provided to avoid hydration mismatch
  const style = (backgroundColor || textColor) ? {
    ...(backgroundColor && { backgroundColor }),
    ...(textColor && { color: textColor })
  } : undefined;
  
  return <Element className={classes} style={style}>{children}</Element>;
};

export const BodyText: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false 
}) => {
  const classes = twMerge(
    'text-sm sm:text-base leading-relaxed',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <p className={classes}>{children}</p>;
};

export const BodyTextSecondary: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false 
}) => {
  const classes = twMerge(
    'text-xs sm:text-sm leading-relaxed text-medium-gray',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <p className={classes}>{children}</p>;
};

export const CardText: React.FC<TypographyProps> = ({ 
  children, 
  className = '',
  spacing = 'small',
  center = false 
}) => {
  const classes = twMerge(
    'text-xs sm:text-sm leading-relaxed',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  return <p className={classes}>{children}</p>;
};

// Export a default reference to TypographyGuide component
export default function Typography(): ReactElement {
  return (
    <div className="p-4">
      <Heading2>Typography Components</Heading2>
      <p className="mt-4">
        View the full Typography Guide in the Style Guide section.
        Import typography components from this file for use in your components.
      </p>
    </div>
  );
}