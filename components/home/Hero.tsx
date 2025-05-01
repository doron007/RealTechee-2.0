import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Heading1, 
  SubtitlePill, 
  BodyTextSecondary 
} from '../Typography';
import Button from '../common/buttons/Buttons';

// Define HeroProps interface directly in the file
interface HeroProps {
  // Add any props you need here
  className?: string;
}

export default function Hero(props: HeroProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative py-16 overflow-hidden section-container">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/hero-bg.png"
          alt="Hero background image"
          fill
          priority
          className="object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20">
        <div className="max-w-3xl">
          <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Hero Content */}
            <div className="flex flex-col gap-6">
              {/* Hero Text */}
              <div className="flex flex-col gap-2">
                {/* Hero Title */}
                <SubtitlePill>
                  Meet RealTechee, Your Home Preparation Partner
                </SubtitlePill>
                
                {/* Hero Description */}
                <Heading1>
                  Close More Deals Faster by Maximizing Your Client's Sale Value & Minimizing Buying Cost
                </Heading1>
              </div>
              
              {/* Hero Details */}
              <BodyTextSecondary>
                Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly.
              </BodyTextSecondary>
              
              {/* Hero Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  href="/learn-more"
                  text="Learn More"
                  showArrow={true}
                />
                <Button
                  variant="secondary"
                  href="/get-in-touch"
                  text="Get in touch"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}