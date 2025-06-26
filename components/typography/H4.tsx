import React from 'react';

interface H4Props {
  children: React.ReactNode;
  className?: string;
}

export const H4: React.FC<H4Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <h4 
    className={`text-[clamp(1.125rem,2vw,1.75rem)] font-medium leading-snug ${className}`} 
    {...props}
  >
    {children}
  </h4>
);

export default H4;