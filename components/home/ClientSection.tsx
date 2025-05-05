import React from 'react';
import Image from 'next/image';
import { SectionLabel, SectionTitle, Subtitle, BodyContent } from '../';

interface ClientSectionProps {
  className?: string;
}

export default function ClientSection({ className = '' }: ClientSectionProps) {
  return (
    <section className={`section-container bg-white py-10 sm:py-12 md:py-16 lg:py-20 ${className}`}>
      <div className="section-content flex flex-col gap-8 sm:gap-10 md:gap-12 lg:gap-16">
        {/* Section Header */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
          <SectionLabel>
            About Us
          </SectionLabel>
          <SectionTitle className="text-center px-4">
            Empowering Agents, Maximizing Performance
          </SectionTitle>
        </div>
        
        {/* Client Types Grid */}
        <div className="flex flex-col">
          {/* For Sellers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 bg-[#F2F9FF]">
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col gap-4 sm:gap-5 md:gap-6 justify-center">
              <div className="flex flex-col gap-2">
                <Subtitle className="text-[#E9664A]">
                  For Sellers
                </Subtitle>
                <BodyContent className="font-['Archivo'] leading-relaxed">
                  We offer your homeowner clients $0 out-of-pocket construction costs until the close of escrow, 
                  payment is made with the escrow proceeds. Eliminating deal withdrawals and price concessions 
                  for sellers due to inspection findings.
                </BodyContent>
              </div>
            </div>
            <div className="h-[200px] sm:h-[240px] md:h-auto">
              <div className="relative w-full h-full">
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
              <div className="relative w-full h-full">
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
                <Subtitle className="text-[#E9664A]">
                  For Buyers
                </Subtitle>
                <BodyContent className="font-['Archivo'] leading-relaxed">
                  We provide your home-buying clients with post-buy quotes, cost analysis, and project scope 
                  for informed decision-making when purchasing a new home. Efficient financial allocations and 
                  world-class virtual contractors ensure on-time & on-budget delivery of buyer's goals.
                </BodyContent>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}