import React from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '../../utils/animationUtils';
import { Section } from '../common/layout';
import { withAnimation } from '../../utils/animationUtils';
import P3 from '../typography/P3';
import H2 from '../typography/H2';
import H3 from '../typography/H3';
import P2 from '../typography/P2';

// Create animated versions for this component
const AnimatedP3 = withAnimation(P3);
const AnimatedH2 = withAnimation(H2);
const AnimatedH3 = withAnimation(H3);
const AnimatedP2 = withAnimation(P2);

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
          <AnimatedP3 
            animate={isVisible}
            className="text-[#E9664A] uppercase tracking-[0.18em] font-bold text-center"
          >
            ABOUT US
          </AnimatedP3>
          <AnimatedH2 
            animate={isVisible} 
            animationDelay="delay100" 
            className="text-center"
          >
            Empowering Agents, Maximizing Performance
          </AnimatedH2>
        </div>
        
        {/* Client Types Grid */}
        <div className="flex flex-col">
          {/* For Sellers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 bg-[#F2F9FF]">
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col gap-4 sm:gap-5 md:gap-6 justify-center">
              <div className="flex flex-col gap-2">
                <AnimatedH3
                  animate={isVisible}
                  animationDelay="delay200"
                  className="text-[#E9664A]"
                >
                  For Sellers
                </AnimatedH3>
                <AnimatedP2
                  animate={isVisible}
                  animationDelay="delay300"
                >
                  We offer your homeowner clients $0 out-of-pocket construction costs until the close of escrow, 
                  payment is made with the escrow proceeds. Eliminating deal withdrawals and price concessions 
                  for sellers due to inspection findings.
                </AnimatedP2>
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
                <AnimatedH3
                  animate={isVisible}
                  animationDelay="delay300"
                  className="text-[#E9664A]"
                >
                  For Buyers
                </AnimatedH3>
                <AnimatedP2
                  animate={isVisible}
                  animationDelay="delay500"
                >
                  We provide your home-buying clients with post-buy quotes, cost analysis, and project scope 
                  for informed decision-making when purchasing a new home. Efficient financial allocations and 
                  world-class virtual contractors ensure on-time & on-budget delivery of buyer's goals.
                </AnimatedP2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}