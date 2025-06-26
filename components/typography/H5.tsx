import React from 'react';

interface H5Props {
  children: React.ReactNode;
  className?: string;
}

export const H5: React.FC<H5Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <h5 
    className={`text-[clamp(1rem,1.5vw,1.5rem)] font-heading font-medium leading-normal ${className}`} 
    {...props}
  >
    {children}
  </h5>
);

export default H5;