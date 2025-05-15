import React from 'react';
import Image from 'next/image';
import { CardTitle, BodyContent } from '../../';

interface FinancingCardProps {
  title: string;
  subtitle: string;
  features: string[];
  accentColor?: string;
  backgroundColor?: string;
  hasBanner?: boolean;
  className?: string;
}

export default function FinancingCard({
  title,
  subtitle,
  features,
  accentColor = '#E9664A',
  backgroundColor = 'bg-[#FFF7F5]',
  hasBanner = false,
  className = '',
}: FinancingCardProps) {
  return (
    <div className={`relative flex flex-col rounded-md overflow-hidden ${backgroundColor} ${className}`}>
      {hasBanner && (
        <div 
          className="absolute top-0 left-0 right-0 h-[6px]" 
          style={{ backgroundColor: accentColor }}
        />
      )}
      
      <div className="p-12">
        <CardTitle className="mb-1">{title}</CardTitle>
        <BodyContent as="p" className="font-medium text-[#2A2B2E] mb-4">{subtitle}</BodyContent>
        
        <hr className="border-t border-[#D2D2D4] my-6" />
        
        <div className="flex flex-col gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-shrink-0 pt-1">
                <Image 
                  src="/assets/icons/vuesax-bold-tick-circle.svg" 
                  alt="Check" 
                  width={16} 
                  height={16}
                />
              </div>
              <BodyContent className="text-[#646469]">{feature}</BodyContent>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}