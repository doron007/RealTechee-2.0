import React from 'react';
import Image from 'next/image';
import P3 from '../typography/P3';
import H2 from '../typography/H2';
import P2 from '../typography/P2';
import { Section } from '../common/layout';

interface Partner {
  id: number;
  logoSrc: string;
  name: string;
}

interface PartnersSectionProps {
  /** CSS class for additional styling */
  className?: string;
  /** Section label displayed above title */
  sectionLabel?: string;
  /** Main heading title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Array of partner items */
  partners?: Partner[];
  /** Background style for the section */
  background?: 'primary' | 'secondary' | 'white' | 'light' | 'black' | 'gray' | 'none';
}

// Default content for the component
const DEFAULT_CONTENT = {
  sectionLabel: 'OUR PARTNERS',
  title: 'Building Success Together',
  description: 'We\'re proud to collaborate with industry leaders who share our vision of transforming the real estate ecosystem.',
  // partners: Array.from({ length: 10 }, (_, i) => ({
  //   id: i + 1,
  //   logoSrc: `/assets/logos/partner-${i + 1}.svg`,
  //   name: `Partner Logo ${i + 1}`
  // }))
};

export default function PartnersSection({ 
  className = '',
  sectionLabel = DEFAULT_CONTENT.sectionLabel,
  title = DEFAULT_CONTENT.title,
  description = DEFAULT_CONTENT.description,
  // partners = DEFAULT_CONTENT.partners,
  background = 'light'
}: PartnersSectionProps) {

    const partners = [
    {
      id: 1,
      name: "Sync",
      logo: "/assets/images/pages_home_partners_partner-logo-1.png",
    },
    {
      id: 2,
      name: "Equity Union",
      logo: "/assets/images/pages_home_partners_partner-logo-2.png",
    },
    {
      id: 3,
      name: "ASID",
      logo: "/assets/images/pages_home_partners_partner-logo-3.png",
    },
    {
      id: 4,
      name: "NKBA",
      logo: "/assets/images/pages_home_partners_partner-logo-4.png",
    }
  ];

  return (
    <Section id="our-partners" background={background} spacing="large" className={className}>
      <div className="text-center mb-12">
        <P3 className="text-[#E9664A] uppercase tracking-[0.18em] font-bold mb-2">
          {sectionLabel}
        </P3>
        <H2 className="mb-4">
          {title}
        </H2>
        <P2 className="max-w-2xl mx-auto">
          {description}
        </P2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center">
        {partners.map((partner) => (
          <div key={partner.id} className="h-16 w-full flex items-center justify-center">
            <Image 
              src={partner.logo}
              alt={partner.name}
              width={120}
              height={60}
              className="max-w-full max-h-full object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
