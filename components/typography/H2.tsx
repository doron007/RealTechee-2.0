import React from 'react';

interface H2Props {
  children: React.ReactNode;
  className?: string;
}

export const H2: React.FC<H2Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <h2 
    className={`text-[clamp(1.5rem,3vw,2.5rem)] font-heading font-semibold leading-snug ${className}`} 
    {...props}
  >
    {children}
  </h2>
);

export default H2;