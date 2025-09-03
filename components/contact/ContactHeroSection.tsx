import React, { useState, useEffect } from 'react';
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
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    const checkIsIPhone = () => {
      const width = window.innerWidth;
      const userAgent = window.navigator.userAgent;
      // Detect iPhone viewport (393px width) or iPhone user agent
      setIsIPhone(width <= 393 || /iPhone/.test(userAgent));
    };
    
    checkIsIPhone();
    window.addEventListener('resize', checkIsIPhone);
    return () => window.removeEventListener('resize', checkIsIPhone);
  }, []);

  // Get form-specific title for iPhone
  const getIPhoneTitle = () => {
    switch (contactType) {
      case ContactType.ESTIMATE:
        return 'Estimate Form';
      case ContactType.INQUIRY:
        return 'Contact Form';
      case ContactType.QUALIFIED:
        return 'Agent Qualification';
      case ContactType.AFFILIATE:
        return 'Partner Application';
      default:
        return 'Contact';
    }
  };

  const title = isIPhone && contactType !== ContactType.MAIN ? getIPhoneTitle() : 'Contact';
  const showDescription = !isIPhone || contactType === ContactType.MAIN;
  const showButtons = !isIPhone || contactType === ContactType.MAIN;

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
          {title}
        </H1>
        {showDescription && (
          <P2 className="text-center">
            Please choose the best inquiry category below so we can help you best.
          </P2>
        )}
        
        {/* Button Row - Hidden on iPhone for specific forms */}
        {showButtons && (
          <div className="flex flex-wrap justify-center items-center gap-5 mt-8">
            <ContactScenarioSelector currentPage={contactType} />
          </div>
        )}
      </div>
    </Section>
  );
}