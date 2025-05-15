import React from 'react';
import { SectionLabel, SectionTitle } from '../';
import { FeatureCard } from '../common/ui';
import Section from '../common/layout/Section';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  sectionLabel: string;
  title: string;
  features: Feature[];
  className?: string;
}

export default function FeaturesSection({
  sectionLabel,
  title,
  features,
  className = '',
}: FeaturesSectionProps) {
  return (
    <Section
      background="white"
      spacing="medium"
      id="features"
      className={className}
    >
      <div className="text-center mb-12 animate-on-scroll">
        <SectionLabel className="text-[#FF5F45] mb-2">{sectionLabel}</SectionLabel>
        <SectionTitle className="mb-6">{title}</SectionTitle>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            className="animate-on-scroll"
          />
        ))}
      </div>
    </Section>
  );
}