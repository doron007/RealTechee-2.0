import React from 'react';
import Image from 'next/image';
import P3 from '../typography/P3';
import H2 from '../typography/H2';
import H3 from '../typography/H3';
import P2 from '../typography/P2';
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
        <P3 className="text-[#E9664A] uppercase tracking-[0.18em] font-bold mb-2">
          {sectionLabel}
        </P3>
        <H2 className="mb-4">
          {title}
        </H2>
        <P2 className={`max-w-2xl mx-auto ${textColor === 'white' ? 'text-white/90' : ''}`}>
          {description}
        </P2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {industries.map((industry, index) => (
          <div key={`industry-${index}`} className="bg-[#353535] p-6 md:p-8 rounded-lg">
            <div className="flex flex-col h-full">
              <H3 className="text-white mb-4">{industry.title}</H3>
              <ul className="space-y-3 mb-6 flex-grow">
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
                    <P3 className="text-white/90">{feature}</P3>
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
