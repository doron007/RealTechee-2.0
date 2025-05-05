import React, { ReactNode, MouseEvent } from 'react';
import Link from 'next/link';

// Define ButtonProps interface directly in the file
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'noborder';
  href?: string;
  text?: string;
  showArrow?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  [key: string]: any; // For any additional props
}

// SVG Arrow Icon Component
const ArrowIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M14.4301 5.93005L20.5001 12.0001L14.4301 18.0701" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeMiterlimit="10" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M3.5 12H20.33" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeMiterlimit="10" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Button component following the brand guidelines from Figma design
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'outline', 'text', or 'noborder'
 * @param {string} props.href - URL for the button to link to
 * @param {string} props.text - Button text content
 * @param {boolean} props.showArrow - Whether to show the arrow icon
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {function} props.onClick - Click handler function
 * @param {React.ReactNode} props.children - Children elements (alternative to text)
 */
const Button = ({ 
  variant = 'primary',
  href, 
  text, 
  showArrow = false,
  disabled = false,
  className = '',
  onClick,
  children,
  ...props
}: ButtonProps) => {
  
  // Define button styles based on variant (following brand guidelines from Figma)
  const getButtonClass = () => {
    switch (variant) {
      case 'primary':
        return 'bg-black text-white hover:bg-[#4E4E52] active:bg-[#4E4E52]';
      case 'secondary':
        return 'bg-white text-[#2A2B2E] border border-[#2A2B2E] hover:bg-gray-50 active:bg-black active:text-white';
      case 'outline':
        return 'bg-transparent border border-dark-gray text-dark-gray hover:bg-gray-100 transition-all';
      case 'text':
        return 'bg-transparent text-dark-gray hover:bg-gray-50 transition-all';
      case 'noborder':
        return 'bg-transparent text-black hover:underline transition-all';
      default:
        return 'bg-black text-white hover:bg-[#4E4E52] active:bg-[#4E4E52]';
    }
  };

  // Get text style based on variant
  const getTextClass = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'noborder':
        return 'font-heading text-base font-extrabold leading-tight';
      case 'outline':
      case 'text':
        return 'font-heading text-base font-extrabold leading-tight text-dark-gray';
      default:
        return 'font-heading text-base font-extrabold leading-tight';
    }
  };

  const baseClasses = 'inline-flex items-center justify-center gap-4 px-6 py-4 rounded transition-colors';

  // Button content
  const buttonContent = (
    <>
      <span className={getTextClass()}>{text || children}</span>
      {showArrow && (
        <span className="arrow-icon">
          <ArrowIcon />
        </span>
      )}
    </>
  );

  // If disabled, render button element with disabled styles
  if (disabled) {
    return (
      <button
        className={`${baseClasses} opacity-60 cursor-not-allowed ${getButtonClass()} ${className}`}
        disabled
        {...props}
      >
        {buttonContent}
      </button>
    );
  }

  // If onClick handler is provided, render button element
  if (onClick) {
    return (
      <button
        className={`${baseClasses} ${getButtonClass()} ${className}`}
        onClick={onClick}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }

  // Otherwise, render as link
  return (
    <Link
      href={href || '#'}
      className={`${baseClasses} ${getButtonClass()} ${className}`}
      {...props}
    >
      {buttonContent}
    </Link>
  );
};

export default Button;