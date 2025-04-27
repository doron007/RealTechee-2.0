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
    <section className="relative py-16 overflow-hidden bg-off-white">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/MD - Home/hero-bg.png"
          alt="Geometric background image"
          fill
          priority
          className="object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20">
        <div className="max-w-3xl">
          <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* 1. Meet RealTechee... (Subtitle) */}
            <div 
              className="inline-block rounded-[20px] px-4 py-2 mb-8 max-w-fit"
              style={{
                background: "rgba(235, 253, 247, 1)",
                minHeight: "19.5px",
                height: "37px",
                display: "grid",
                alignItems: "center"
              }}
            >
              <p 
                className="text-sm font-normal text-dark-gray"
                style={{
                  fontFamily: "'Roboto', Arial, sans-serif",
                  fontSize: "16px",
                  lineHeight: "1.4em"
                }}
              >
                Meet RealTechee, Your Home Preparation Partner
              </p>
            </div>
            
            {/* 2. Close More... (H1 Heading) */}
            <h1 
              className="text-dark-gray font-bold font-heading"
              style={{
                fontSize: "clamp(37px, 3.5vw, 43px)",
                lineHeight: "1.4em",
                textAlign: "start",
                width: "100%",
                margin: "0 0 24px 0",
                mixBlendMode: "normal"
              }}
            >
              Close More Deals Faster by Maximizing Your Client's Sale Value & Minimizing Buying Cost
            </h1>
            
            {/* 3. Supercharge... (Paragraph) */}
            <p 
              className="text-medium-gray font-body"
              style={{
                fontSize: "clamp(14px, 1.2vw, 16px)",
                lineHeight: "1.6em",
                textAlign: "start",
                width: "100%",
                marginBottom: "24px",
                mixBlendMode: "normal"
              }}
            >
              Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly.
            </p>
            
            {/* 4. Buttons */}
            <div className="flex flex-wrap gap-5">
              <ActionButton href="/learn-more" text="Learn More" primary={true} />
              <ActionButton href="/get-in-touch" text="Get in touch" primary={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}