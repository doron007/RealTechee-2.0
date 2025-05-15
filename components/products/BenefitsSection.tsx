import React from 'react';
import Image from 'next/image';
import { SectionLabel, SectionTitle, BodyContent } from '../';
import Section from '../common/layout/Section';

interface Benefit {
  title: string;
  description: string;
}

interface BenefitsSectionProps {
  sectionLabel: string;
  title: string;
  benefits: Benefit[];
  image: string;
  imageAlt: string;
  className?: string;
}

export default function BenefitsSection({
  sectionLabel,
  title,
  benefits,
  image,
  imageAlt,
  className = '',
}: BenefitsSectionProps) {
  return (
    <Section
      background="secondary"
      spacing="medium"
      id="benefits"
      className={`bg-[#2E2E30] ${className}`}
    >
      <div className="text-center mb-12 animate-on-scroll">
        <SectionLabel className="text-white mb-2">{sectionLabel}</SectionLabel>
        <SectionTitle className="text-white mb-6">{title}</SectionTitle>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="animate-on-scroll">
          <div className="h-[350px] relative rounded-lg overflow-hidden">
            <Image 
              src={image} 
              alt={imageAlt} 
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="animate-on-scroll space-y-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Image 
                  src="/assets/icons/vuesax-bold-tick-circle.svg" 
                  alt="Check" 
                  width={20} 
                  height={20}
                  className="text-white"
                />
              </div>
              <div>
                <SectionTitle as="h3" className="text-white text-xl font-semibold mb-2">{benefit.title}</SectionTitle>
                <BodyContent className="text-white opacity-80">
                  {benefit.description}
                </BodyContent>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}