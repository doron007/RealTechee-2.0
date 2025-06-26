import React from 'react';
import Section from '../common/layout/Section';
import H1 from '../typography/H1';
import P2 from '../typography/P2';
import { ContactScenarioSelector } from './';

export enum ContactType {
  MAIN = 'main',
  ESTIMATE = 'estimate',
  INQUIRY = 'inquiry', 
  QUALIFIED = 'qualified',
  AFFILIATE = 'affiliate'
}

interface ContactHeroSectionProps {
  contactType: ContactType;
}

export default function ContactHeroSection({ contactType }: ContactHeroSectionProps) {
  return (
    <Section
      id="hero"
      className="flex flex-col justify-center items-center overflow-hidden"
      backgroundImage="/assets/images/hero-bg.png"
      background="none"
      spacing="none"
      constrained={false}
      withOverlay={false}
      marginTop={50}
      marginBottom={50}
      paddingTop={{ default: 50, md: 80, '2xl': 100 }}
      paddingBottom={{ default: 50, md: 80, '2xl': 100 }}
    >
      <div className="flex flex-col items-center text-center gap-4 md:gap-6">
        <H1 className="text-center">
          Contact
        </H1>
        <P2 className="text-center">
          Please choose the best inquiry category below so we can help you best.
        </P2>
        
        {/* Button Row */}
        <div className="flex flex-wrap justify-center items-center gap-5 mt-8">
          <ContactScenarioSelector currentPage={contactType} />
        </div>
      </div>
    </Section>
  );
}