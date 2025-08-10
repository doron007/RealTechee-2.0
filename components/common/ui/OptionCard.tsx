import React from 'react';
import Image from 'next/image';
import H4 from '../../typography/H4';
import P2 from '../../typography/P2';
import P3 from '../../typography/P3'; 

interface OptionCardProps {
  title: string;
  subtitle: string;
  features: string[];
  variant: 'primary' | 'secondary';
  className?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  title,
  subtitle,
  features,
  variant = 'primary',
  className = '',
}) => {
  const isPrimary = variant === 'primary';
  
  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Top accent bar as a separate element */}
      <div 
        className={`h-2 rounded-t-[20px] w-full 
          ${isPrimary ? 'bg-[#2A2B2E]' : 'bg-[#E9664A]'}`}
      />
      
      {/* Card content */}
      <div 
        className={`p-12 flex-1 flex flex-col gap-2.5 
          ${isPrimary ? 'bg-[#F6F6F6]' : 'bg-[#FFF7F5]'}`}
      >
        {/* Header */}
        <div className="mb-2">
          <H4 className="text-[#2A2B2E] mb-2">
            {title}
          </H4>
          <P2 className="text-[#646469]">
            {subtitle}
          </P2>
        </div>
        
        {/* Divider */}
        <hr className={`w-full ${isPrimary ? 'border-[#D2D2D4]' : 'border-[#F8E9E6]'} mb-2.5`} />
        
        {/* Features */}
        <div className="flex flex-col gap-1 mt-auto">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-1">
              <Image 
                src="/assets/icons/ic-tick-circle.svg"
                alt="Feature included checkmark"
                width={16}
                height={16}
                className="mt-1 flex-shrink-0"
              />
              <P3 className="text-[#646469]">
                {feature}
              </P3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};