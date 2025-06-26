import React from 'react';
import H4 from '../../typography/H4';
import P2 from '../../typography/P2';

interface BenefitCardProps {
  title: string;
  description: string;
  isActive: boolean;
  onMouseEnter: () => void;
  className?: string;
}

export const BenefitCard: React.FC<BenefitCardProps> = ({
  title,
  description,
  isActive,
  onMouseEnter,
  className = '',
}) => {
  return (
    <div
      className={`
        transition-all duration-300 ease-in-out
        ${isActive ? 
          'bg-[#2A2B2E] rounded-md' : 
          'bg-white rounded-[30px]'}
        ${isActive ? 'p-12' : 'p-12'} 
        ${className}
      `}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex flex-col gap-[7px]">
        <H4 
          className={`${isActive ? 'text-white' : 'text-[#2A2B2E]'}`}
        >
          {title}
        </H4>
        <P2 
          className={`${isActive ? 'text-white' : 'text-black'}`}
        >
          {description}
        </P2>
      </div>
    </div>
  );
};