import React, { ReactNode, MouseEvent, forwardRef } from 'react';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image';
import { ButtonText } from '../../ResponsiveTypography';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonState = 'normal' | 'hover' | 'pressed' | 'disabled';
export type ButtonMode = 'light' | 'dark';

export interface ButtonProps {
  /**
   * Button variant - primary, secondary, or tertiary
   */
  variant?: ButtonVariant;
  
  /**
   * Button size - sm (small), md (medium), or lg (large)
   */
  size?: ButtonSize;
  
  /**
   * The visual mode of the button (light or dark)
   */
  mode?: ButtonMode;
  
  /**
   * Link URL (optional)
   */
  href?: string;
  
  /**
   * Button text content
   */
  children?: ReactNode;
  
  /**
   * Button text as a string
   */
  text?: string;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * Whether to show an icon
   */
  withIcon?: boolean;

  /**
   * Whether to show an arrow (alias for withIcon)
   * @deprecated Use withIcon instead
   */
  showArrow?: boolean;
  
  /**
   * Custom SVG icon path
   */
  iconSvg?: string;
  
  /**
   * Icon position (left or right)
   */
  iconPosition?: 'left' | 'right';
  
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether button is full width
   */
  fullWidth?: boolean;
  
  /**
   * Form submission type
   */
  type?: 'button' | 'submit' | 'reset';
  
  /**
   * Click event handler
   */
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  
  /**
   * Force button state (for style guide and testing)
   */
  forceState?: ButtonState;
  
  /**
   * Whether to show underline for text (especially for tertiary buttons)
   */
  underline?: boolean;
  
  /**
   * Text size, can be used to make text smaller than default for the given size
   */
  textSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  
  /**
   * Additional HTML attributes
   */
  [key: string]: any;
}

/**
 * Button component implementing the RealTechee design system
 * 
 * Supports primary, secondary, and tertiary (in-line link) styles
 * with normal, hover, pressed, and disabled states
 */
const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  mode = 'light',
  href,
  children,
  text,
  className = '',
  withIcon = false,
  showArrow = false,
  iconSvg = '/assets/icons/arrow-right.svg',
  iconPosition = 'right',
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  forceState,
  underline = false,
  textSize = 'base',
  ...rest
}, ref) => {
  // Base classes for all buttons
  const baseClasses = 'inline-flex items-center justify-center transition-colors rounded';
  
  // Size specific classes
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'py-2 px-4 gap-2',
    md: 'py-3 px-5 gap-3',
    lg: 'py-4 px-6 gap-4'
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // State is either forced (for style guide) or determined by the disabled prop
  const state: ButtonState = forceState || (disabled ? 'disabled' : 'normal');
  
  // Generate variant and state specific classes based on Figma design
  const getVariantClasses = () => {
    if (mode === 'dark') {
      switch (variant) {
        case 'primary':
          return {
            normal: 'bg-white text-[#2A2B2E]',
            hover: 'bg-[#D2D2D4] text-[#2A2B2E]',
            pressed: 'bg-[#6E6E73] text-white',
            disabled: 'bg-[#3D3D3F] text-[#8B8B8F] pointer-events-none'
          }[state];
        case 'secondary':
          return {
            normal: 'bg-transparent text-white border border-white',
            hover: 'bg-white/10 text-white border border-white',
            pressed: 'bg-white/20 text-white border border-white',
            disabled: 'bg-transparent text-[#8B8B8F] border border-[#8B8B8F] pointer-events-none'
          }[state];
        case 'tertiary':
          return {
            normal: 'bg-transparent text-white',
            hover: 'bg-transparent text-[#D2D2D4]',
            pressed: 'bg-transparent text-[#6E6E73]',
            disabled: 'bg-transparent text-[#8B8B8F] pointer-events-none'
          }[state];
        default:
          return '';
      }
    } else { // Light mode
      switch (variant) {
        case 'primary':
          return {
            normal: 'bg-[#2A2B2E] text-white',
            hover: 'bg-black text-white',
            pressed: 'bg-[#4E4E52] text-white',
            disabled: 'bg-[#BCBCBF] text-white pointer-events-none'
          }[state];
        case 'secondary':
          return {
            normal: 'bg-white text-[#2A2B2E] border border-[#2A2B2E]',
            hover: 'bg-[#BCBCBF] text-[#2A2B2E] border border-[#2A2B2E]',
            pressed: 'bg-[#2A2B2E] text-white border border-[#2A2B2E]',
            disabled: 'bg-white text-[#BCBCBF] border border-[#BCBCBF] pointer-events-none'
          }[state];
        case 'tertiary':
          return {
            normal: 'bg-transparent text-[#2A2B2E] px-0',
            hover: 'bg-transparent text-black px-0',
            pressed: 'bg-transparent text-[#4E4E52] px-0',
            disabled: 'bg-transparent text-[#BCBCBF] pointer-events-none px-0'
          }[state];
        default:
          return '';
      }
    }
  };
  
  // Ensure size is a valid key for sizeClasses
  const validSize: ButtonSize = (size in sizeClasses) ? size : 'md';
  
  // Combine all classes
  const classes = twMerge(baseClasses, sizeClasses[validSize], widthClasses, getVariantClasses(), className);

  // Determine if we should show an icon
  const shouldShowIcon = withIcon || showArrow;
  
  // Get the icon color based on current state and Figma design
  const getIconColor = () => {
    if (mode === 'dark') {
      switch (variant) {
        case 'primary':
          return state === 'disabled' ? '#8B8B8F' : '#2A2B2E';
        case 'secondary':
        case 'tertiary':
          return state === 'disabled' ? '#8B8B8F' : 'white';
        default:
          return 'currentColor';
      }
    } else { // Light mode
      switch (variant) {
        case 'primary':
          return 'white';
        case 'secondary':
          return state === 'pressed' ? 'white' : 
                state === 'disabled' ? '#BCBCBF' : '#2A2B2E';
        case 'tertiary':
          return state === 'pressed' ? '#4E4E52' :
                state === 'hover' ? 'black' :
                state === 'disabled' ? '#BCBCBF' : '#2A2B2E';
        default:
          return 'currentColor';
      }
    }
  };
  
  // Determine content text
  const contentText = text || children;
  
  // Button content
  const content = (
    <>
      {shouldShowIcon && iconPosition === 'left' && (
        <div className="relative w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform">
          <Image 
            src={iconSvg}
            alt="Button icon"
            width={24}
            height={24}
            className="w-full h-full"
            style={{ filter: getIconColor() === 'white' ? 'brightness(0) invert(1)' : 
                             getIconColor() === '#8B8B8F' ? 'brightness(0) opacity(60%)' :
                             getIconColor() === '#BCBCBF' ? 'brightness(0) opacity(70%)' :
                             getIconColor() === '#4E4E52' ? 'brightness(0) opacity(80%)' :
                             getIconColor() === 'black' ? 'brightness(0)' : 
                             getIconColor() === '#2A2B2E' ? 'brightness(0)' : '' }}
          />
        </div>
      )}
      
      {contentText && typeof contentText === 'string' ? (
        <ButtonText className={`text-center ${underline ? 'underline' : ''} text-${textSize}`}>
          {contentText}
        </ButtonText>
      ) : (
        contentText
      )}
      
      {shouldShowIcon && iconPosition === 'right' && (
        <div className="relative w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform">
          <Image 
            src={iconSvg}
            alt="Button icon"
            width={24}
            height={24}
            className="w-full h-full"
            style={{ filter: getIconColor() === 'white' ? 'brightness(0) invert(1)' : 
                             getIconColor() === '#8B8B8F' ? 'brightness(0) opacity(60%)' :
                             getIconColor() === '#BCBCBF' ? 'brightness(0) opacity(70%)' :
                             getIconColor() === '#4E4E52' ? 'brightness(0) opacity(80%)' :
                             getIconColor() === 'black' ? 'brightness(0)' : 
                             getIconColor() === '#2A2B2E' ? 'brightness(0)' : '' }}
          />
        </div>
      )}
    </>
  );

  // For links
  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={`${classes} group`}
        onClick={onClick as any}
        ref={ref as any}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  // For buttons
  return (
    <button
      type={type}
      className={`${classes} group`}
      disabled={disabled || state === 'disabled'}
      onClick={onClick}
      ref={ref as any}
      {...rest}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;