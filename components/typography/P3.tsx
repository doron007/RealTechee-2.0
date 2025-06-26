import React from 'react';

interface P3Props extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  className?: string;
}

export const P3: React.FC<P3Props> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <p 
    className={`text-[clamp(0.75rem,0.5vw,0.875rem)] font-body leading-normal ${className}`} 
    {...props}
  >
    {children}
  </p>
);

export default P3;