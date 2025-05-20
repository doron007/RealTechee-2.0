import React from 'react';
import { SectionTitle, SubContent } from '../Typography';
import { Section } from '../common/layout';

interface HeroSectionProps {
  /** CSS class for additional styling */
  className?: string;
  /** Section label displayed above title */
  sectionLabel?: string;
  /** Main heading title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Background image for hero section */
  backgroundImage?: string;
}

// Default content for the component
const DEFAULT_CONTENT = {
  title: 'About Us',
  description: 'RealTechee innovates the remodelling experience, driving your business forward through cutting-edge technology.'
};

export default function HeroSection({
  className = '',
  title = DEFAULT_CONTENT.title,
  description = DEFAULT_CONTENT.description,
  backgroundImage = '/assets/images/hero-bg.png'
}: HeroSectionProps) {
  return (
    <Section
      id="about-hero"
      className={`flex flex-col justify-center items-center overflow-hidden sm:min-h-[300px] ${className}`}
      backgroundImage={backgroundImage}
      background="none"
      spacing="none"
      constrained={false}
      marginTop={0}
      marginBottom={0}
      paddingTop={{ default: 50, md: 80, '2xl': 100 }}
      paddingBottom={{ default: 50, md: 80, '2xl': 100 }}
    >
      <div className="w-full sm:w-3/5 mx-auto flex flex-col items-start sm:items-center text-left sm:text-center">
        <SectionTitle>
          {title}
        </SectionTitle>
        <SubContent>
          {description}
        </SubContent>
      </div>
    </Section>
  );
}
