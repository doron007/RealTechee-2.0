import React from 'react';
import H1 from '../typography/H1';
import P2 from '../typography/P2';
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
  title: 'Projects',
  description: 'Impeccable renovations with RealTechee'
};

export default function HeroSection({
  className = '',
  title = DEFAULT_CONTENT.title,
  description = DEFAULT_CONTENT.description,
  backgroundImage = '/assets/images/hero-bg.png'
}: HeroSectionProps) {
  return (
    <Section
      id="projects-hero"
      className={`flex flex-col justify-center items-center overflow-hidden sm:min-h-[200px] ${className}`}
      backgroundImage={backgroundImage}
      background="none"
      spacing="none"
      constrained={false}
      marginTop={0}
      marginBottom={0}
    >
      <div className="w-full sm:w-3/5 mx-auto flex flex-col items-center text-center gap-4">
        <H1 className="text-center">
          {title}
        </H1>
        <P2 className="text-center">
          {description}
        </P2>
      </div>
    </Section>
  );
}
