import React from 'react';

interface P2Props {
  children: React.ReactNode;
  className?: string;
}

export const P2: React.FC<P2Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <p 
    className={`text-[clamp(0.875rem,1vw,1rem)] font-body leading-relaxed ${className}`} 
    {...props}
  >
    {children}
  </p>
);

export default P2;