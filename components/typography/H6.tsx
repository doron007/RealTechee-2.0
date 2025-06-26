import React from 'react';

interface H6Props {
  children: React.ReactNode;
  className?: string;
}

export const H6: React.FC<H6Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <h6 
    className={`text-[clamp(0.875rem,1vw,1.25rem)] font-medium leading-normal ${className}`} 
    {...props}
  >
    {children}
  </h6>
);

export default H6;