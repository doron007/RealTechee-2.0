import React from 'react';
import Image from 'next/image';
import { SectionLabel, SectionTitle, BodyContent } from '../Typography';
import { Section } from '../common/layout';

interface IndustryItem {
  title: string;
  features: string[];
}

interface IndustryExpertiseSectionProps {
  /** CSS class for additional styling */
  className?: string;
  /** Section label displayed above title */
  sectionLabel?: string;
  /** Main heading title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Array of industry items */
  industries?: IndustryItem[];
  /** Background style for the section */
  background?: 'primary' | 'secondary' | 'white' | 'light' | 'black' | 'gray' | 'none';
  /** Text color */
  textColor?: 'white' | 'black' | 'default';
}

// Default content for the component
const DEFAULT_CONTENT = {
  sectionLabel: 'INDUSTRY EXPERTISE',
  title: 'Specialized Solutions for Every Sector',
  description: 'Our platform is tailored to meet the unique needs of various stakeholders in the real estate ecosystem.',
  industries: [
    {
      title: 'Real Estate Professionals',
      features: [
        'Tools to help close more deals faster',
        'Client dashboard for transparent communication',
        'ROI-driven renovation recommendations',
        'Increase sale price with strategic improvements'
      ]
    },
    {
      title: 'Architects & Designers',
      features: [
        'Project management tools for design execution',
        'Seamless collaboration with contractors',
        'Expanded revenue opportunities',
        'Marketing resources to grow your business'
      ]
    },
    {
      title: 'Showrooms & Materials',
      features: [
        'Integration with real estate renovation projects',
        'Increased product visibility and sales',
        'Streamlined ordering and fulfillment',
        'Data-driven inventory management'
      ]
    },
    {
      title: 'Commercial Properties',
      features: [
        'Tenant improvement management',
        'Optimize property value through strategic renovations',
        'Multi-stakeholder communication platform',
        'Reduce vacancy periods with rapid turnarounds'
      ]
    }
  ]
};

export default function IndustryExpertiseSection({ 
  className = '',
  sectionLabel = DEFAULT_CONTENT.sectionLabel,
  title = DEFAULT_CONTENT.title,
  description = DEFAULT_CONTENT.description,
  industries = DEFAULT_CONTENT.industries,
  background = 'gray',
  textColor = 'white' as 'white' | 'black' | 'default'
}: IndustryExpertiseSectionProps) {
  return (
    <Section id="industry-expertise" background={background} spacing="large" textColor={textColor} className={className}>
      <div className="text-center mb-12">
        <SectionLabel className="text-accent-coral mb-2">
          {sectionLabel}
        </SectionLabel>
        <SectionTitle className="mb-4">
          {title}
        </SectionTitle>
        <BodyContent className={`max-w-2xl mx-auto ${textColor === 'white' ? 'text-white/90' : ''}`}>
          {description}
        </BodyContent>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {industries.map((industry, index) => (
          <div key={`industry-${index}`} className="bg-[#353535] p-6 md:p-8 rounded-lg">
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold mb-4">{industry.title}</h3>
              <ul className="space-y-3 mb-6 flex-grow text-white/90">
                {industry.features.map((feature, featureIdx) => (
                  <li key={`feature-${index}-${featureIdx}`} className="flex items-start gap-2">
                    <Image 
                      src="/assets/icons/ic-tick-circle.svg"
                      alt="Check" 
                      width={24} 
                      height={24}
                      className="mt-0.5 flex-shrink-0"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
