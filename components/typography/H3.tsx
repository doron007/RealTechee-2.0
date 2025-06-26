import React from 'react';

interface H3Props {
  children: React.ReactNode;
  className?: string;
}

export const H3: React.FC<H3Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <h3 
    className={`text-[clamp(1.25rem,2.5vw,2rem)] font-heading font-semibold leading-snug ${className}`} 
    {...props}
  >
    {children}
  </h3>
);

export default H3;