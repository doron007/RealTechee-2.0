import React from 'react';

interface P1Props {
  children: React.ReactNode;
  className?: string;
}

export const P1: React.FC<P1Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <p 
    className={`text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed ${className}`} 
    {...props}
  >
    {children}
  </p>
);

export default P1;