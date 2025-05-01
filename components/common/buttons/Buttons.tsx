import React, { ReactNode, MouseEvent } from 'react';
import Link from 'next/link';

// Define ButtonProps interface directly in the file
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
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
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'outline', or 'text'
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
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'outline':
        return 'bg-transparent border border-dark-gray text-dark-gray px-6 py-4 rounded hover:bg-gray-100 transition-all';
      case 'text':
        return 'bg-transparent text-dark-gray px-6 py-2 hover:bg-gray-50 transition-all';
      default:
        return 'btn-primary';
    }
  };

  // Get text style based on variant
  const getTextClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary-text';
      case 'secondary':
        return 'btn-secondary-text';
      case 'outline':
      case 'text':
        return 'font-heading text-base font-extrabold leading-tight text-dark-gray';
      default:
        return 'btn-primary-text';
    }
  };

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
        className={`inline-flex items-center justify-center gap-4 opacity-60 cursor-not-allowed ${getButtonClass()} ${className}`}
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
        className={`inline-flex items-center justify-center gap-4 ${getButtonClass()} ${className}`}
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
      className={`inline-flex items-center justify-center gap-4 ${getButtonClass()} ${className}`}
      {...props}
    >
      {buttonContent}
    </Link>
  );
};

export default Button;