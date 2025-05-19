import React from 'react';
import { Heading4, BodyContent } from '../../Typography';

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
        <Heading4 
          className={`${isActive ? 'text-white' : 'text-[#2A2B2E]'}`}
          spacing="none"
        >
          {title}
        </Heading4>
        <BodyContent 
          className={`${isActive ? 'text-white' : 'text-black'}`}
          spacing="none"
        >
          {description}
        </BodyContent>
      </div>
    </div>
  );
};