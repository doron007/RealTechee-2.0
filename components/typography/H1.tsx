import React from 'react';

interface H1Props {
  children: React.ReactNode;
  className?: string;
}

export const H1: React.FC<H1Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <h1 
    className={`text-[clamp(2rem,4vw,3rem)] font-heading font-bold leading-tight ${className}`} 
    {...props}
  >
    {children}
  </h1>
);

export default H1;