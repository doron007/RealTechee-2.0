import React from 'react';
import H4 from '../typography/H4';
import P2 from '../typography/P2';

interface ProcessStepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  isLast?: boolean;
}

export default function ProcessStepCard({ 
  stepNumber, 
  title, 
  description,
  isLast = false
}: ProcessStepCardProps) {
  // Format number with leading zero
  const formattedNumber = stepNumber.toString().padStart(2, '0');
  
  return (
    <div className="flex gap-6 relative">
      {/* Step Number Container with Vertical Line */}
      <div className="flex-shrink-0 relative">
        {/* Vertical dotted line - continuous line that extends beyond the square */}
        {!isLast && (
          <div 
            className="absolute left-1/2 w-0.5 transform -translate-x-1/2"
            style={{
              top: '56px', // Start right after the square (w-14 = 56px)
              height: 'calc(100% + 80px)', // Extend further to connect properly
              background: 'repeating-linear-gradient(to bottom, #E9664A 0px, #E9664A 4px, transparent 4px, transparent 8px)'
            }}
          />
        )}
        
        {/* Step Number Square - Match Figma design with square background */}
        <div 
          className="w-14 h-14 flex items-center justify-center relative z-10"
          style={{ backgroundColor: '#FFF7F5' }}
        >
          <span 
            className="font-extrabold leading-none"
            style={{ 
              fontSize: '31px',
              color: '#E9664A',
              fontFamily: 'Nunito Sans, sans-serif'
            }}
          >
            {formattedNumber}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-2">
        <H4 className="text-primary mb-3">{title}</H4>
        <P2 className="text-medium-gray">{description}</P2>
      </div>
    </div>
  );
}