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
  backgroundColor = 'bg-transparent', // Changed to transparent background
  borderColor = 'border-[#FFF7F5]', // This prop is no longer used but kept for interface compatibility
  className = '',
}: FeatureCardProps) {
  return (
    <div className={`flex flex-col p-6 ${backgroundColor} ${className}`}>
      {/* Row 1: Icon - stretched to 100% width */}
      {icon && (
        <div className="w-full mb-4">
          <Image 
            src={icon} 
            alt={`${title} icon`} 
            width={100} 
            height={100}
            className="object-contain w-full"
          />
        </div>
      )}
      
      {/* Row 2: Title - with 16px gap from icon */}
      <div className="flex flex-col gap-4">
        <CardTitle>{title}</CardTitle>
        {/* Row 3: Content - with 16px gap from title */}
        <BodyContent className="opacity-70">{description}</BodyContent>
      </div>
    </div>
  );
}