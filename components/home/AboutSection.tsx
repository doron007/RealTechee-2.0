// filepath: /Users/doron/Projects/RealTechee 2.0/components/home/AboutSection.tsx
import React from 'react';
import { useIntersectionObserver, withAnimation } from '../../utils/animationUtils';
import { VideoPlayer } from '../common/ui';
import { Section, ContainerTwoColumns, ContentWrapper } from '../common/layout';
import P1 from '../typography/P1';

// Create animated version of P1 for this component
const AnimatedP1 = withAnimation(P1);

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
      <div ref={ref}>
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
              textAlign="center"
              maxWidth="90%"
            >
              <AnimatedP1
                animate={isVisible}
                animationType="slideInUp"
                animationDelay="delay300"
                className="text-center"
              >
                RealTechee was founded with a vision: to provide turn-key tools and technology to various industries, 
                including automated programs, virtual walk-throughs, CRM, and UI. Our goal is to enhance user experience 
                and execution for professionals and their clients, driving improved performance, conversion rates, and value.
              </AnimatedP1>
            </ContentWrapper>
          }
        />
      </div>
    </Section>
  );
}