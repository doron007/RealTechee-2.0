import React, { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

// Define spacing type for consistent spacing options
export type TypographySpacing = 'none' | 'small' | 'medium' | 'large';

// Enhanced typography props with spacing and alignment options
interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
  spacing?: TypographySpacing;
  center?: boolean;
}

// Spacing classes for consistent margins
const spacingClasses = {
  none: '',
  small: 'mb-4',
  medium: 'mb-6 sm:mb-8',
  large: 'mb-8 sm:mb-10 md:mb-12'
};

/**
 * Page Header - Responsive typography following the system
 * sm: text-3xl (24px)
 * md: text-4xl (36px)
 * lg: text-5xl (48px)
 * xl: text-5xl (48px) - capped at 48px
 * xxl: text-5xl (48px) - capped at 48px
 * 2xl: text-5xl (48px) - capped at 48px
 */
export const PageHeader: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'h1',
  spacing = 'none',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-heading font-extrabold',
    'text-3xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-4xl xxl:text-5xl 2xl:text-5xl',
    'leading-tight tracking-tight',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Section Title - Responsive typography following the system
 * sm: text-2xl (20px)
 * md: text-3xl (24px)
 * lg: text-4xl (36px)
 * xl: text-4xl (36px) - capped at 36px
 * xxl: text-4xl (36px) - capped at 36px
 * 2xl: text-4xl (36px) - capped at 36px
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
    'text-2xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-3xl xxl:text-4xl 2xl:text-4xl',
    'leading-tight',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Subtitle - Responsive typography following the system
 * sm: text-xl (18px)
 * md: text-2xl (20px)
 * lg: text-3xl (24px)
 * xl: text-3xl (24px)
 * xxl: text-3xl (24px) - capped at 24px
 * 2xl: text-3xl (24px) - capped at 24px
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
    'text-xl sm:text-xl md:text-xl lg:text-2xl xl:text-2xl xxl:text-3xl 2xl:text-3xl',
    'leading-snug',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Body Content - Responsive typography following the system
 * sm: text-base (16px)
 * md: text-lg (18px)
 * lg: text-lg (18px)
 * xl: text-xl (20px)
 * xxl: text-xl (20px)
 * 2xl: text-xl (20px) - capped at 20px
 */
export const BodyContent: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'p',
  spacing = 'none',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-body font-normal',
    'text-base sm:text-base md:text-base lg:text-lg xl:text-lg xxl:text-xl 2xl:text-xl',
    'leading-relaxed',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Sub Content - Responsive typography following the system
 * sm: text-sm (14px)
 * md: text-sm (14px) - changed from text-base to maintain 14px at md breakpoint
 * lg: text-base (16px)
 * xl: text-base (16px) - changed from text-lg to maintain 16px at xl breakpoint
 * xxl: text-lg (18px)
 * 2xl: text-lg (18px) - capped at 18px
 */
export const SubContent: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'p',
  spacing = 'none',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-body font-normal',
    'text-sm sm:text-sm md:text-sm lg:text-base xl:text-base xxl:text-lg 2xl:text-lg',
    'leading-relaxed',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * Button Text - Responsive typography for buttons
 * sm: text-sm (14px)
 * md: text-base (16px)
 * lg: text-base (16px)
 * xl: text-lg (18px)
 * xxl: text-lg (18px)
 * 2xl: text-lg (18px) - capped at 18px
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
    'text-sm sm:text-sm md:text-sm lg:text-base xl:text-base xxl:text-lg 2xl:text-lg',
    'leading-none',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * CardTitle - Responsive typography for card titles
 * sm: text-base (16px)
 * md: text-lg (18px)
 * lg: text-xl (20px)
 * xl: text-xl (20px) - capped at 20px
 * xxl: text-xl (20px) - capped at 20px
 * 2xl: text-xl (20px) - capped at 20px
 */
export const CardTitle: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'h3',
  spacing = 'none',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-heading font-bold',
    'text-base sm:text-base md:text-base lg:text-lg xl:text-lg xxl:text-xl 2xl:text-xl',
    'leading-tight',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * CardSubtitle - Responsive typography for card subtitles
 * sm: text-sm (14px)
 * md: text-base (16px)
 * lg: text-base (16px)
 * xl: text-lg (18px)
 * xxl: text-lg (18px)
 * 2xl: text-lg (18px) - capped at 18px
 */
export const CardSubtitle: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'div',
  spacing = 'none',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-heading font-medium',
    'text-sm sm:text-sm md:text-sm lg:text-base xl:text-base xxl:text-lg 2xl:text-lg',
    'leading-snug',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};

/**
 * CardContent - Responsive typography for card body content
 * sm: text-sm (14px)
 * md: text-sm (14px)
 * lg: text-base (16px)
 * xl: text-base (16px) - capped at 16px
 * xxl: text-base (16px) - capped at 16px
 * 2xl: text-base (16px) - capped at 16px
 */
export const CardContent: React.FC<TypographyProps> = ({ 
  children, 
  className = '', 
  as = 'p',
  spacing = 'none',
  center = false
}) => {
  const Element = as;
  const classes = twMerge(
    'font-body font-normal',
    'text-sm sm:text-sm md:text-sm lg:text-base xl:text-base xxl:text-base 2xl:text-base',
    'leading-relaxed',
    spacingClasses[spacing],
    center ? 'text-center' : '',
    className
  );
  
  return <Element className={classes}>{children}</Element>;
};