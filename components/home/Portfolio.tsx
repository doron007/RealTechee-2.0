import Image from 'next/image';
import { useState } from 'react';
import { SectionLabel, SectionTitle, BodyContent, SubContent, SliderNavBar } from '../';

export default function Portfolio() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Portfolio projects data with Before/After images
  const portfolioItems = [
    {
      id: 1,
      location: '15333 Culver Dr #410, Irvine, CA',
      valueIncrease: '22%',
      beforeImage: '/assets/images/pages_home_portfolio_before-1.jpg',
      afterImage: '/assets/images/pages_home_portfolio_after-1.webp'
    },
    {
      id: 2,
      location: '2487 Pacific Ave, San Francisco, CA',
      valueIncrease: '18%',
      beforeImage: '/assets/images/pages_home_portfolio_before-2.jpg',
      afterImage: '/assets/images/pages_home_portfolio_after-2.jpg'
    },
    {
      id: 3,
      location: '983 Sunset Blvd, Los Angeles, CA',
      valueIncrease: '25%',
      beforeImage: '/assets/images/pages_home_portfolio_before-3.jpg',
      afterImage: '/assets/images/pages_home_portfolio_after-3.jpg'
    }
  ];
  
  // Handler for moving to the previous image
  const handlePrevious = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? portfolioItems.length - 1 : prevIndex - 1
    );
  };
  
  // Handler for moving to the next image
  const handleNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === portfolioItems.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  // Current portfolio item
  const currentItem = portfolioItems[currentIndex];
  
  // Fixed dimensions for all portfolio images
  const imageWidth = 600;
  const imageHeight = 450;
  
  return (
    <section className="section-container bg-white py-4 sm:py-6 md:py-8 lg:py-10">
      <div className="section-content flex flex-col">
        {/* Section header */}
        <div className="text-center mb-4 sm:mb-4 md:mb-6 lg:mb-8">
          <SectionLabel className="text-[#FF5F45]">
            PORTFOLIO
          </SectionLabel>
          <SectionTitle>
            Before and After Renovation Projects
          </SectionTitle>
        </div>
        
        <div className="w-full max-w-[1200px] bg-white flex flex-col justify-start items-start mx-auto">
          {/* Two column container for before/after images with NO gap between them */}
          <div className="flex flex-col lg:flex-row w-full">
            {/* Before image container - takes full width on xs, half on sm */}
            <div className="w-full lg:w-1/2 relative">
              <div className="aspect-w-4 aspect-h-3 h-[300px] sm:h-[350px] md:h-[450px] lg:h-[450px]">
                <Image 
                  width={imageWidth}
                  height={imageHeight}
                  className="w-full h-full object-cover" 
                  src={currentItem.beforeImage}
                  alt={`Before renovation - ${currentItem.location}`}
                  priority
                />
              </div>
              <div className="w-full py-2 sm:py-3 bg-[#F6F6F6] flex justify-center items-center">
                <BodyContent className="text-zinc-800">Before</BodyContent>
              </div>
            </div>
            
            {/* After image container - takes full width on xs, half on sm */}
            <div className="w-full lg:w-1/2 relative">
              <div className="aspect-w-4 aspect-h-3  sm:h-[350px] md:h-[450px] h-[300px] lg:h-[450px]">
                <Image 
                  width={imageWidth}
                  height={imageHeight}
                  className="w-full h-full object-cover" 
                  src={currentItem.afterImage}
                  alt={`After renovation - ${currentItem.location}`}
                  priority 
                />
              </div>
              <div className="w-full py-2 sm:py-3 bg-[#F0E4DF] flex justify-center items-center">
                <BodyContent className="text-red-500">After</BodyContent>
              </div>
            </div>
          </div>
          
          {/* Using the new SliderNavBar component */}
          <SliderNavBar
            currentIndex={currentIndex}
            totalItems={portfolioItems.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            primaryColor="#27272A" // zinc-800
            primaryTextColor="#FFFFFF" // white
            secondaryColor="#FFFFFF" // white
            textColor="#27272A" // zinc-800
            borderColor="#27272A" // zinc-800
            leftContent={
              <>
                <div className="text-neutral-400 text-xs font-normal font-['Roboto'] leading-tight">{currentItem.location}</div>
                <div className="text-center sm:text-left">
                  <span className="text-zinc-800 text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold font-['Nunito_Sans']">Value increased by </span>
                  <span className="text-red-500 text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold font-['Nunito_Sans']">{currentItem.valueIncrease}</span>
                </div>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}