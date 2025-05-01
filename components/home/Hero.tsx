import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ActionButton } from '../../utils/componentUtils';

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
    <section className="relative py-16 overflow-hidden">
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
                <div className="bg-[#FFF7F5] rounded-[20px] px-4 py-2 inline-block">
                  <p className="text-[#E9664A] text-sm font-normal" style={{fontFamily: "'Roboto', sans-serif", lineHeight: "1.6em"}}>
                    Meet RealTechee, Your Home Preparation Partner
                  </p>
                </div>
                
                {/* Hero Description */}
                <h1 className="text-[#2A2B2E] font-extrabold text-4xl md:text-5xl" style={{fontFamily: "'Nunito Sans', sans-serif", lineHeight: "1.2em"}}>
                  Close More Deals Faster by Maximizing Your Client's Sale Value & Minimizing Buying Cost
                </h1>
              </div>
              
              {/* Hero Details */}
              <p className="text-[#2A2B2E] font-normal text-base opacity-70" style={{fontFamily: "'Roboto', sans-serif", lineHeight: "1.6em"}}>
                Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly.
              </p>
              
              {/* Hero Buttons */}
              <div className="flex flex-wrap gap-2">
                <Link href="/learn-more" className="bg-[#2A2B2E] text-white rounded px-6 py-4 flex items-center gap-4 transition-all hover:bg-opacity-90">
                  <span className="font-extrabold text-base" style={{fontFamily: "'Nunito Sans', sans-serif", lineHeight: "1.2em"}}>Learn More</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.4301 5.93005L20.5001 12.0001L14.4301 18.0701" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.5 12H20.33" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <Link href="/get-in-touch" className="border border-[#2A2B2E] text-[#2A2B2E] rounded px-6 py-4 transition-all hover:bg-gray-100">
                  <span className="font-extrabold text-base" style={{fontFamily: "'Nunito Sans', sans-serif", lineHeight: "1.2em"}}>Get in touch</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}