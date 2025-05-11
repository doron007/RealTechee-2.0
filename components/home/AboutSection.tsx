// filepath: /Users/doron/Projects/RealTechee 2.0/components/home/AboutSection.tsx
import React from 'react';
import { useIntersectionObserver } from '../../utils/animationUtils';
import { VideoPlayer } from '../common/ui';
import { Section, ContainerTwoColumns, ContentWrapper } from '../common/layout';
import { AnimatedSectionLabel, AnimatedSectionTitle, AnimatedBodyContent } from '..';

interface AboutSectionProps {
  className?: string;
}

export default function AboutSection({ className = '' }: AboutSectionProps) {
  // Use our custom hook for animation
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <Section 
      className={className}
      background="light" 
      spacing="large"
    >
      {/* Section Title and Label - using animated typography */}
      <div ref={ref}>
        <AnimatedSectionLabel 
          animate={isVisible} 
          center 
          className="text-primary"
        >
          About Us
        </AnimatedSectionLabel>
        
        <AnimatedSectionTitle 
          animate={isVisible} 
          animationDelay="delay200" 
          center 
          className="mt-2"
        >
          Our Mission
        </AnimatedSectionTitle>

        {/* Using ContainerTwoColumns with videoSide="left" to match Figma 56/44 proportions and 64px gap */}
        <ContainerTwoColumns
          videoSide="left"
          gap="figma"
          breakpoint="lg"
          verticalAlign="center"
          leftContent={
            <VideoPlayer
              posterSrc="/assets/images/pages_home_howItWorks.png"
              videoSrc="/videos/RealTechee Intro.mp4"
              alt="About RealTechee"
              rounded={false}
              shadow={false}
              animate={true}
              animationType="fadeIn"
              animationDelay="delay200"
              isVisible={isVisible}
            />
          }
          rightContent={
            <ContentWrapper
              verticalAlign="center"
              textAlign="left"
              maxWidth="90%"
            >
              <AnimatedBodyContent
                animate={isVisible}
                animationType="slideInUp"
                animationDelay="delay300"
              >
                RealTechee was founded with a vision: to provide turn-key tools and technology to various industries, 
                including automated programs, virtual walk-throughs, CRM, and UI. Our goal is to enhance user experience 
                and execution for professionals and their clients, driving improved performance, conversion rates, and value.
              </AnimatedBodyContent>
            </ContentWrapper>
          }
        />
      </div>
    </Section>
  );
}