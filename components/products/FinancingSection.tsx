import React from 'react';
import { SectionLabel, SectionTitle, BodyContent } from '../';
import { FinancingCard } from '../common/ui';
import Section from '../common/layout/Section';

interface FinancingOption {
  title: string;
  subtitle: string;
  features: string[];
  hasBanner?: boolean;
}

interface FinancingSectionProps {
  sectionLabel: string;
  title: string;
  description: string;
  financingOptions: FinancingOption[];
  className?: string;
}

export default function FinancingSection({
  sectionLabel,
  title,
  description,
  financingOptions,
  className = '',
}: FinancingSectionProps) {
  return (
    <Section
      background="white"
      spacing="medium"
      id="financing"
      className={className}
    >
      <div className="text-center mb-12 animate-on-scroll">
        <SectionLabel className="text-[#FF5F45] mb-2">{sectionLabel}</SectionLabel>
        <SectionTitle className="mb-6">{title}</SectionTitle>
        <BodyContent className="max-w-3xl mx-auto mb-12">
          {description}
        </BodyContent>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {financingOptions.map((option, index) => (
          <FinancingCard
            key={index}
            title={option.title}
            subtitle={option.subtitle}
            features={option.features}
            hasBanner={option.hasBanner || false}
            className="animate-on-scroll"
          />
        ))}
      </div>
    </Section>
  );
}