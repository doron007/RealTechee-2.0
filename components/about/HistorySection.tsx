import React from 'react';
import { SectionTitle, SubContent } from '../Typography';
import { Section } from '../common/layout';

interface HistorySectionProps {
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
  title: 'Our History',
  description: 'Established in 2021, RealTechee is dedicated to transforming industries through cutting-edge technology. Our suite of turn-key tools, including automated programs, virtual walk-throughs, real-time project visibility, and live chats with stakeholders, redefines the professional and client project experience. With over 25 years of expertise, our leadership team is committed to uplifting collaborators and clientele, delivering unmatched value to help users achieve their goals.'
};

export default function HistorySection({
  className = '',
  title = DEFAULT_CONTENT.title,
  description = DEFAULT_CONTENT.description,
  backgroundImage = '/assets/images/pages_about_history_bg.png'
}: HistorySectionProps) {
  return (
    <Section
      id="our-history"
      className={`flex flex-col justify-center items-center overflow-hidden sm:min-h-[500px] ${className}`}
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
        <SectionTitle className="text-white">
          {title}
        </SectionTitle>
        <SubContent className="text-white">
          {description}
        </SubContent>
      </div>
    </Section>
  );
}
