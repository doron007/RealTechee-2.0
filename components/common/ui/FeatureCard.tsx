import React from 'react';
import Image from 'next/image';
import H3 from '../../typography/H3';
import P2 from '../../typography/P2';

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
  backgroundColor = 'bg-transparent',
  borderColor = 'border-[#FFF7F5]',
  className = '',
}: FeatureCardProps) {
  return (
    <div className={`flex flex-col p-6 ${backgroundColor} ${className}`}>
      {icon && (
        <div className="w-full mb-4 flex justify-center">
          <Image 
            src={icon} 
            alt={`${title} icon`} 
            width={100} 
            height={100}
            className="object-contain w-[180px] h-[72px] sm:w-full sm:h-auto"
          />
        </div>
      )}
      
      <div className="flex flex-col gap-0 sm:gap-4">
        <H3 className="mb-0 sm:mb-0">{title}</H3>
        <P2 className="opacity-70">{description}</P2>
      </div>
    </div>
  );
}