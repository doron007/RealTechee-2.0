import React from 'react';
import Image from 'next/image';
import { CardTitle, BodyContent } from '../../';

interface FeatureCardProps {
  icon?: string;
  title: string;
  description: string;
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  backgroundColor = 'bg-white',
  borderColor = 'border-[#FFF7F5]',
  className = '',
}: FeatureCardProps) {
  return (
    <div className={`flex flex-col rounded-[15px] p-6 ${backgroundColor} border ${borderColor} shadow-sm ${className}`}>
      {icon && (
        <div className="flex justify-center items-center h-[72px] mb-4">
          <Image 
            src={icon} 
            alt={`${title} icon`} 
            width={40} 
            height={40}
            className="object-contain"
          />
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <CardTitle>{title}</CardTitle>
        <BodyContent className="opacity-70">{description}</BodyContent>
      </div>
    </div>
  );
}