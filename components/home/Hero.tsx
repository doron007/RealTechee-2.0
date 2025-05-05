import { useEffect, useState, useRef } from 'react';
import { 
  PageHeader,
  SectionTitle,
  SubtitlePill, 
  BodyContent,
  ButtonText 
} from '../';
import Button from '../common/buttons/Button';
import Image from 'next/image';

// Define HeroProps interface directly in the file
interface HeroProps {
  className?: string;
}

export default function Hero(props: HeroProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle responsive background image
  const bgImage = isMounted && window.innerWidth < 768 
    ? 'url(/assets/images/hero-bg-mobile.png)' 
    : 'url(/assets/images/hero-bg.png)';

  return (
    <section 
      ref={sectionRef}
      className="relative section-container pt-16 pb-12 sm:pt-20 sm:pb-14 md:pt-24 md:pb-16 lg:pt-32 lg:pb-20 xl:pt-36 xl:pb-24 overflow-hidden" 
    >
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: bgImage }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20"></div>
      </div>
      
      {/* Content - with consistent margins and enhanced responsive design */}
      <div className="section-content relative z-10">
        <div className="max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
          <div className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Hero Content */}
            <div className="flex flex-col gap-4 md:gap-5 lg:gap-6 xl:gap-8">
              {/* Hero Text */}
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                {/* Hero Pill - with animation */}
                <div className={`transition-all delay-100 duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <SubtitlePill>
                    Meet RealTechee, Your Home Preparation Partner
                  </SubtitlePill>
                </div>
                
                {/* Hero Title - using standardized PageHeader component */}
                <div className={`transition-all delay-200 duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <SectionTitle>Close More Deals Faster by Maximizing Your Client's Sale Value & Minimizing Buying Cost</SectionTitle>
                </div>
              </div>
              
              {/* Hero Details - using standardized BodyContent component */}
              <div className={`transition-all delay-300 duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} max-w-2xl`}>
                <BodyContent>
                  Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly.
                </BodyContent>
              </div>
              
              {/* Hero Buttons - updated to use standardized Button component */}
              <div className={`flex flex-wrap gap-3 sm:gap-4 pt-3 sm:pt-4 md:pt-6 transition-all delay-400 duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Button
                  variant="primary"
                  href="/learn-more"
                  withIcon={true}
                  iconPosition="right"
                >
                  <ButtonText>Learn More</ButtonText>
                </Button>
                <Button
                  variant="secondary"
                  href="/get-in-touch"
                >
                  <ButtonText>Get in touch</ButtonText>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements - visible on larger screens */}
        <div className="hidden md:block absolute bottom-0 right-0 -mb-16 -mr-16 opacity-20 z-0">
          <div className="w-64 h-64 rounded-full bg-accent/30 blur-3xl"></div>
        </div>
        <div className="hidden md:block absolute top-24 left-8 -mt-8 -ml-8 opacity-20 z-0">
          <div className="w-48 h-48 rounded-full bg-primary/30 blur-3xl"></div>
        </div>
      </div>
    </section>
  );
}