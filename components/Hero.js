import { useEffect, useState } from 'react';
import Link from 'next/link';

// Arrow icon component matching the design
const ArrowIcon = () => (
  <svg 
    width="16" 
    height="16"
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" 
      fill="currentColor"
    />
  </svg>
);

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative pt-32 pb-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm font-medium text-[#4CD5B1] mb-2">Meet RealTechee, Your Home Preparation Partner</p>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Close More Deals Faster by Maximizing Your Client's Sale Value & Minimizing Buying Cost
            </h1>
            
            <p className="text-lg text-gray-700 mb-8">
              Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href="/learn-more"
                className="px-6 py-3 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center"
              >
                <span>Learn More</span>
                <span className="ml-2">
                  <ArrowIcon />
                </span>
              </Link>
              
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
      
      {/* Background pattern - subtle geometric shapes if needed */}
      <div className="absolute bottom-0 right-0 w-full h-full -z-10 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pattern" patternUnits="userSpaceOnUse" width="80" height="80">
              <path d="M0 0L40 40L0 80Z" fill="#4f46e5" />
              <path d="M80 0L40 40L80 80Z" fill="#4f46e5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pattern)" />
        </svg>
      </div>
    </section>
  );
}