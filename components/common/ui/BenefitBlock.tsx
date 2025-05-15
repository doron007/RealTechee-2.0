import React from 'react';
import Image from 'next/image';
import { CardTitle, BodyContent } from '../../';

interface BenefitItemProps {
  title: string;
  description: string;
  icon?: string;
  className?: string;
}

const BenefitItem = ({ title, description, icon, className = '' }: BenefitItemProps) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && (
          <Image 
            src={icon} 
            alt="Check" 
            width={20} 
            height={20}
          />
        )}
        <CardTitle className="text-[#2A2B2E]">{title}</CardTitle>
      </div>
      <BodyContent className="text-[#2A2B2E] opacity-70">{description}</BodyContent>
    </div>
  );
};

interface BenefitBlockProps {
  image: string;
  imageAlt: string;
  benefits: BenefitItemProps[];
  imageFirst?: boolean;
  imageRatio?: string;
  className?: string;
}

export default function BenefitBlock({
  image,
  imageAlt,
  benefits = [],
  imageFirst = true,
  imageRatio = '60/40',
  className = '',
}: BenefitBlockProps) {
  // Image ratio defines the width split between image and text
  // 60/40 means image takes 60% in desktop layout
  const imageWidthClass = imageRatio === '60/40' ? 'lg:w-3/5' : 'lg:w-2/5';
  const textWidthClass = imageRatio === '60/40' ? 'lg:w-2/5' : 'lg:w-3/5';

  const imageSection = (
    <div className={`w-full ${imageWidthClass} h-[300px] lg:h-auto relative`}>
      <Image 
        src={image} 
        alt={imageAlt} 
        fill
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="object-cover"
      />
    </div>
  );

  const contentSection = (
    <div className={`w-full ${textWidthClass} p-6 lg:p-10 flex flex-col justify-center gap-6 bg-[#2E2E30]`}>
      {benefits.map((benefit, index) => (
        <BenefitItem
          key={index}
          title={benefit.title}
          description={benefit.description}
          icon={benefit.icon}
        />
      ))}
    </div>
  );

  return (
    <div className={`flex flex-col lg:flex-row w-full ${className}`}>
      {imageFirst ? (
        <>
          {imageSection}
          {contentSection}
        </>
      ) : (
        <>
          {contentSection}
          {imageSection}
        </>
      )}
    </div>
  );
}