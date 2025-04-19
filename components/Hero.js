import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

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
                className="text-sm font-normal"
                style={{
                  fontFamily: "'Roboto', Arial, sans-serif",
                  color: "rgb(42, 43, 46)", // color_14 is 42, 43, 46 from your CSS variables
                  fontSize: "16px",
                  lineHeight: "1.4em"
                }}
              >
                Meet RealTechee, Your Home Preparation Partner
              </p>
            </div>
            
            {/* 2. Close More... (H1 Heading) */}
            <h1 
              style={{
                fontFamily: "'Nunito Sans', 'NunitoSans_10pt-ExtraBold', sans-serif",
                fontSize: "clamp(37px, 3.5vw, 43px)",
                fontWeight: "800", // ExtraBold weight
                lineHeight: "1.4em",
                color: "rgb(42, 43, 46)",
                textAlign: "start",
                textDecoration: "none",
                width: "100%",
                margin: "0 0 24px 0",
                mixBlendMode: "normal"
              }}
            >
              Close More Deals Faster by Maximizing Your Client's Sale Value & Minimizing Buying Cost
            </h1>
            
            {/* 3. Supercharge... (Paragraph) */}
            <p 
              style={{
                fontFamily: "'Roboto', 'Roboto-Regular', sans-serif",
                fontSize: "clamp(14px, 1.2vw, 16px)",
                fontWeight: "normal",
                color: "rgb(42, 43, 46)",
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
              {/* Dark button with bright text and left arrow */}
              <Link
                href="/learn-more"
                className="px-6 py-3 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center"
              >
                <span className="mr-2">
                  <Image 
                    src="/icons/button-arrow.svg"
                    alt="Arrow"
                    width={28}
                    height={28}
                  />
                </span>
                <span>Learn More</span>
              </Link>
              
              {/* Transparent button with dark text */}
              <Link
                href="/get-in-touch"
                className="px-6 py-3 border border-gray-900 text-gray-900 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}