import React, { ReactNode } from 'react';

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle' | 'body' | 'caption' | 'section-label';
  color?: string;
  className?: string;
  children: ReactNode;
  as?: React.ElementType;
}

/**
 * Typography component that provides consistent text styling
 * based on the RealTechee 2.0 brand guidelines
 */
export const Typography = ({ variant, color, className = '', children, as }: TypographyProps) => {
  const defaultColor = color || '';
  
  const variantStyles = {
    'h1': 'font-heading font-extrabold text-5xl leading-tight', // 48px, 1.2 line height, Nunito Sans ExtraBold
    'h2': 'font-heading font-extrabold text-4xl leading-tight', // 39px, 1.2 line height, Nunito Sans ExtraBold
    'h3': 'font-heading font-bold text-3xl leading-tight', // 31px, 1.2 line height, Nunito Sans Bold
    'h4': 'font-heading font-bold text-2xl leading-tight', // 25px, 1.2 line height, Nunito Sans Bold
    'h5': 'font-heading font-bold text-xl leading-tight', // 20px, 1.2 line height, Nunito Sans Bold
    'h6': 'font-heading font-semibold text-base leading-tight', // 16px, 1.2 line height, Nunito Sans SemiBold
    'subtitle': 'font-body font-normal text-base leading-loose', // 16px, 1.6 line height, Roboto Regular
    'body': 'font-body font-normal text-base leading-loose', // 16px, 1.6 line height, Roboto Regular
    'caption': 'font-body font-normal text-xs leading-loose', // 13px, 1.6 line height, Roboto Regular
    'section-label': 'font-heading font-bold text-xs uppercase tracking-widest leading-normal' // 14px, uppercase, 1.4 line height, 18% letter spacing, Nunito Sans Bold
  };
  
  const variantTags = {
    'h1': as || 'h1',
    'h2': as || 'h2',
    'h3': as || 'h3',
    'h4': as || 'h4',
    'h5': as || 'h5',
    'h6': as || 'h6',
    'subtitle': as || 'p',
    'body': as || 'p',
    'caption': as || 'span',
    'section-label': as || 'span'
  };
  
  const Tag = variantTags[variant];
  
  return (
    <Tag className={`${variantStyles[variant]} ${defaultColor} ${className}`}>
      {children}
    </Tag>
  );
};

/**
 * SubtitlePill component displays text in a pill-shaped container
 * Common in the RealTechee design for section subtitles
 */
export const SubtitlePill = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <div className={`inline-block rounded-[20px] bg-[#FFF7F5] px-4 py-2 ${className}`}>
      <span className="text-[#E9664A] text-sm font-normal font-body leading-loose">
        {children}
      </span>
    </div>
  );
};

export default Typography;