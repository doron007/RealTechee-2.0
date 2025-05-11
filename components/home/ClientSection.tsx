import React from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '../../utils/animationUtils';
import { Section } from '../common/layout';
import { 
  AnimatedSectionLabel, 
  AnimatedSectionTitle, 
  AnimatedSubtitle, 
  AnimatedBodyContent 
} from '../';

interface ClientSectionProps {
  className?: string;
}

export default function ClientSection({ className = '' }: ClientSectionProps) {
  // Use our custom hook for animation
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <Section 
      className={className}
      background="white" 
      spacing="medium"
    >
      <div ref={ref} className="flex flex-col gap-8 sm:gap-10 md:gap-12 lg:gap-16">
        {/* Section Header - using animated typography */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
          <AnimatedSectionLabel 
            animate={isVisible} 
            center
          >
            About Us
          </AnimatedSectionLabel>
          <AnimatedSectionTitle 
            animate={isVisible} 
            animationDelay="delay100" 
            center
          >
            Empowering Agents, Maximizing Performance
          </AnimatedSectionTitle>
        </div>
        
        {/* Client Types Grid */}
        <div className="flex flex-col">
          {/* For Sellers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 bg-[#F2F9FF]">
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col gap-4 sm:gap-5 md:gap-6 justify-center">
              <div className="flex flex-col gap-2">
                <AnimatedSubtitle
                  animate={isVisible}
                  animationDelay="delay200"
                  className="text-[#E9664A]"
                >
                  For Sellers
                </AnimatedSubtitle>
                <AnimatedBodyContent
                  animate={isVisible}
                  animationDelay="delay300"
                  spacing="none"
                >
                  We offer your homeowner clients $0 out-of-pocket construction costs until the close of escrow, 
                  payment is made with the escrow proceeds. Eliminating deal withdrawals and price concessions 
                  for sellers due to inspection findings.
                </AnimatedBodyContent>
              </div>
            </div>
            
            <div className="h-[200px] sm:h-[240px] md:h-auto">
              <div className={`relative w-full h-full ${isVisible ? 'animate-fade-in animate-delay-300' : 'opacity-0'}`}>
                <Image 
                  src="/assets/images/pages_sellers_seller-home.jpg" 
                  alt="For Sellers" 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
          
          {/* For Buyers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 bg-[#FCF9F8]">
            <div className="h-[200px] sm:h-[240px] md:h-auto order-2 md:order-1">
              <div className={`relative w-full h-full ${isVisible ? 'animate-fade-in animate-delay-500' : 'opacity-0'}`}>
                <Image 
                  src="/assets/images/pages_buyers_buyer-home.jpg" 
                  alt="For Buyers" 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col gap-4 sm:gap-5 md:gap-6 justify-center order-1 md:order-2">
              <div className="flex flex-col gap-2">
                <AnimatedSubtitle
                  animate={isVisible}
                  animationDelay="delay300"
                  className="text-[#E9664A]"
                >
                  For Buyers
                </AnimatedSubtitle>
                <AnimatedBodyContent
                  animate={isVisible}
                  animationDelay="delay500"
                  spacing="none"
                >
                  We provide your home-buying clients with post-buy quotes, cost analysis, and project scope 
                  for informed decision-making when purchasing a new home. Efficient financial allocations and 
                  world-class virtual contractors ensure on-time & on-budget delivery of buyer's goals.
                </AnimatedBodyContent>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}