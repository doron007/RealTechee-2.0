import React from 'react';
import Link from 'next/link';

// SVG Arrow Icon Component
const ArrowIcon = () => (
  <svg 
    data-bbox="2.625 4.448 12.75 9.105" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 18 18" 
    height="18" 
    width="18"
  >
    <g>
      <path 
        strokeLinejoin="round" 
        strokeLinecap="round" 
        strokeMiterlimit="10" 
        strokeWidth="1.5" 
        stroke="#ffffff" 
        d="M10.822 4.448 15.375 9l-4.553 4.553" 
        fill="none"
      />
      <path 
        strokeLinejoin="round" 
        strokeLinecap="round" 
        strokeMiterlimit="10" 
        strokeWidth="1.5" 
        stroke="#ffffff" 
        d="M2.625 9h12.623" 
        fill="none"
      />
    </g>
  </svg>
);

/**
 * Button component following the brand guidelines
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', or 'dark'
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
  showArrow = true,
  disabled = false,
  className = '',
  onClick,
  children,
  ...props
}) => {
  // Define button styles based on variant (following brand guidelines)
  const getButtonClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'dark':
        return 'btn-dark';
      default:
        return 'btn-primary';
    }
  };

  // Button content
  const buttonContent = (
    <>
      <span>{text || children}</span>
      {showArrow && (
        <span className="ml-2">
          <ArrowIcon />
        </span>
      )}
    </>
  );

  // If disabled, render button element
  if (disabled) {
    return (
      <button
        className={`${getButtonClass()} ${className}`}
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
        className={`${getButtonClass()} ${className}`}
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
      className={`${getButtonClass()} ${className}`}
      {...props}
    >
      {buttonContent}
    </Link>
  );
};

export default Button;