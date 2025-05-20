import React from 'react';
import { SectionLabel, SectionTitle, BodyContent } from '../Typography';
import { Section } from '../common/layout';
import { Card } from '../common/ui';

interface ValueItem {
  title: string;
  content: string;
  icon: string;
}

interface ValuesSectionProps {
  /** CSS class for additional styling */
  className?: string;
  /** Section label displayed above title */
  sectionLabel?: string;
  /** Main heading title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Array of value items */
  values?: ValueItem[];
}

// Default content for the component
const DEFAULT_CONTENT = {
  sectionLabel: 'OUR VALUES',
  title: 'What Drives Us',
  description: 'Our core values guide everything we do, from product development to customer service.',
  values: [
    {
      title: 'Innovation',
      content: 'We constantly push boundaries to create solutions that address real industry challenges. Our commitment to innovation drives every product we develop.',
      icon: '/assets/icons/ic-tick-circle.svg'
    },
    {
      title: 'Transparency',
      content: 'We believe in open, honest communication with our clients, partners, and within our team. Transparency builds trust and ensures alignment.',
      icon: '/assets/icons/ic-tick-circle.svg'
    },
    {
      title: 'Excellence',
      content: 'We strive for excellence in everything we do, from the technology we build to the service we provide. We\'re committed to delivering exceptional results.',
      icon: '/assets/icons/ic-tick-circle.svg'
    },
    {
      title: 'Collaboration',
      content: 'We believe that the best results come from effective collaboration. Our platform is built to facilitate seamless teamwork among all stakeholders.',
      icon: '/assets/icons/ic-tick-circle.svg'
    },
    {
      title: 'Impact',
      content: 'We measure success by the positive impact we create for our clients and their customers. Every feature we develop is designed to deliver tangible value.',
      icon: '/assets/icons/ic-tick-circle.svg'
    },
    {
      title: 'Adaptability',
      content: 'We embrace change and continuously evolve our solutions to meet the dynamic needs of the real estate industry and our clients.',
      icon: '/assets/icons/ic-tick-circle.svg'
    }
  ]
};

export default function ValuesSection({ 
  className = '',
  sectionLabel = DEFAULT_CONTENT.sectionLabel,
  title = DEFAULT_CONTENT.title,
  description = DEFAULT_CONTENT.description,
  values = DEFAULT_CONTENT.values
}: ValuesSectionProps) {
  return (
    <Section id="our-values" background="white" spacing="large" className={className}>
      <div className="text-center mb-12">
        <SectionLabel className="text-accent-coral mb-2">
          {sectionLabel}
        </SectionLabel>
        <SectionTitle className="mb-4">
          {title}
        </SectionTitle>
        <BodyContent className="max-w-2xl mx-auto">
          {description}
        </BodyContent>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {values.map((value, index) => (
          <Card
            key={`value-${index}`}
            variant="feature"
            title={value.title}
            content={value.content}
            icon={value.icon}
            className="p-6 md:p-8 bg-gray-50 hover:bg-gray-100 transition-colors"
            iconPosition="top"
          />
        ))}
      </div>
    </Section>
  );
}
