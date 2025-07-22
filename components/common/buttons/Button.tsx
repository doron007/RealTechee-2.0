import React, { ReactNode, MouseEvent, forwardRef } from 'react';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import Image from 'next/image';
// Note: span removed - buttons handle their own text styling now

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
  
  // Get all state variants classes to build hover and active selectors
  const getVariantStateClasses = () => {
    if (mode === 'dark') {
      switch (variant) {
        case 'primary':
          return {
            normal: 'bg-white text-[#2A2B2E]',
            hover: 'hover:bg-[#D2D2D4] hover:text-[#2A2B2E]',
            pressed: 'active:bg-[#6E6E73] active:text-white',
            disabled: 'disabled:bg-[#3D3D3F] disabled:text-[#8B8B8F] disabled:pointer-events-none'
          };
        case 'secondary':
          return {
            normal: 'bg-transparent text-white border border-white',
            hover: 'hover:bg-white/10 hover:text-white hover:border hover:border-white',
            pressed: 'active:bg-white/20 active:text-white active:border active:border-white',
            disabled: 'disabled:bg-transparent disabled:text-[#8B8B8F] disabled:border disabled:border-[#8B8B8F] disabled:pointer-events-none'
          };
        case 'tertiary':
          return {
            normal: 'bg-transparent text-white',
            hover: 'hover:bg-transparent hover:text-[#D2D2D4]',
            pressed: 'active:bg-transparent active:text-[#6E6E73]',
            disabled: 'disabled:bg-transparent disabled:text-[#8B8B8F] disabled:pointer-events-none'
          };
        default:
          return {
            normal: '',
            hover: '',
            pressed: '',
            disabled: ''
          };
      }
    } else { // Light mode
      switch (variant) {
        case 'primary':
          return {
            normal: 'bg-[#2A2B2E] text-white',
            hover: 'hover:bg-black hover:text-white',
            pressed: 'active:bg-[#4E4E52] active:text-white',
            disabled: 'disabled:bg-[#BCBCBF] disabled:text-white disabled:pointer-events-none'
          };
        case 'secondary':
          return {
            normal: 'bg-white text-[#2A2B2E] border border-[#2A2B2E]',
            hover: 'hover:bg-[#BCBCBF] hover:text-[#2A2B2E] hover:border hover:border-[#2A2B2E]',
            pressed: 'active:bg-[#2A2B2E] active:text-white active:border active:border-[#2A2B2E]',
            disabled: 'disabled:bg-white disabled:text-[#BCBCBF] disabled:border disabled:border-[#BCBCBF] disabled:pointer-events-none'
          };
        case 'tertiary':
          return {
            normal: 'bg-transparent text-[#2A2B2E] px-0',
            hover: 'hover:bg-transparent hover:text-black hover:px-0',
            pressed: 'active:bg-transparent active:text-[#4E4E52] active:px-0',
            disabled: 'disabled:bg-transparent disabled:text-[#BCBCBF] disabled:pointer-events-none disabled:px-0'
          };
        default:
          return {
            normal: '',
            hover: '',
            pressed: '',
            disabled: ''
          };
      }
    }
  };

  // Generate variant and state specific classes based on Figma design
  const getVariantClasses = () => {
    const stateClasses = getVariantStateClasses();
    
    if (forceState) {
      // If a specific state is forced, only return that state's classes
      return stateClasses[forceState as keyof typeof stateClasses];
    } else {
      // Otherwise, combine normal state with interactive states
      return `${stateClasses.normal} ${stateClasses.hover} ${stateClasses.pressed} ${stateClasses.disabled}`;
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
                             getIconColor() === '#8B8B8F' ? 'brightness(0) invert(1) opacity(85%)' :
                             getIconColor() === '#BCBCBF' ? 'brightness(0) invert(1) opacity(70%)' :
                             getIconColor() === '#4E4E52' ? 'brightness(0) opacity(80%)' :
                             getIconColor() === 'black' ? 'brightness(0)' : 
                             getIconColor() === '#2A2B2E' ? 'brightness(0)' : '' }}
          />
        </div>
      )}
      
      {contentText && typeof contentText === 'string' ? (
        <span className={`text-center ${underline ? 'underline' : ''} text-${textSize}`}>
          {contentText}
        </span>
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