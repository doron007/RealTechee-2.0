// filepath: /Users/doron/Projects/RealTechee 2.0/components/home/Portfolio.tsx
import Image from 'next/image';
import { useState } from 'react';

export default function Portfolio() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Portfolio projects data with Before/After images
  const portfolioItems = [
    {
      id: 1,
      location: '15333 Culver Dr #410, Irvine, CA',
      valueIncrease: '22%',
      beforeImage: '/MD - Home/before-1.jpg',
      afterImage: '/MD - Home/after-1.webp'
    },
    {
      id: 2,
      location: '2487 Pacific Ave, San Francisco, CA',
      valueIncrease: '18%',
      beforeImage: '/MD - Home/before-2.jpg',
      afterImage: '/MD - Home/after-2.jpg'
    },
    {
      id: 3,
      location: '983 Sunset Blvd, Los Angeles, CA',
      valueIncrease: '25%',
      beforeImage: '/MD - Home/before-3.jpg',
      afterImage: '/MD - Home/after-3.jpg'
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
  
  return (
    <section className="pt-20 pr-[120px] pl-[120px] pb-20 bg-white flex flex-col gap-16">
      <div className="text-center">
        <p className="text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-2">PORTFOLIO</p>
        <h2 
          className="text-dark-gray font-bold font-heading"
          style={{
            fontSize: "clamp(37px, 3.5vw, 43px)",
            lineHeight: "1.4em",
            textAlign: "center",
            width: "100%",
            margin: "0 0 24px 0",
            mixBlendMode: "normal"
          }}
        >
          Before and After Renovation Projects
        </h2>
      </div>
      
      <div className="w-[1200px] bg-white rounded-md inline-flex flex-col justify-start items-start mx-auto">
        {/* Combined images and labels without gap */}
        <div className="flex flex-col w-full">
          <div className="inline-flex justify-start items-start">
            <Image 
              width={600}
              height={451}
              className="w-[600px] h-[451px] object-cover" 
              src={currentItem.beforeImage}
              alt={`Before renovation - ${currentItem.location}`} 
            />
            <Image 
              width={600}
              height={451}
              className="w-[600px] h-[451px] object-cover" 
              src={currentItem.afterImage}
              alt={`After renovation - ${currentItem.location}`} 
            />
          </div>
          <div className="self-stretch inline-flex justify-start items-start w-full">
            <div className="w-[600px] py-4 bg-[#F6F6F6] flex justify-center items-center">
              <div className="text-center text-zinc-800 text-base font-extrabold font-['Nunito_Sans'] leading-tight">Before</div>
            </div>
            <div className="w-[600px] py-4 bg-[#F0E4DF] flex justify-center items-center">
              <div className="text-center text-red-500 text-base font-extrabold font-['Nunito_Sans'] leading-tight">After</div>
            </div>
          </div>
        </div>
        
        {/* Navigation bar - with proper gap from the image+label section */}
        <div className="self-stretch inline-flex justify-between items-center w-full mt-16">
          {/* Location and value section */}
          <div className="py-4 bg-white inline-flex flex-col justify-start items-start gap-1">
            <div className="justify-start text-neutral-400 text-xs font-normal font-['Roboto'] leading-tight">{currentItem.location}</div>
            <div className="justify-start">
              <span className="text-zinc-800 text-2xl font-extrabold font-['Nunito_Sans']">Value increased by </span>
              <span className="text-red-500 text-2xl font-extrabold font-['Nunito_Sans']">{currentItem.valueIncrease}</span>
            </div>
          </div>
          
          {/* Divider line */}
          <div className="w-[537px] h-0 outline outline-1 outline-offset-[-0.50px] outline-black" />
          
          {/* Navigation controls */}
          <div className="flex justify-center items-center gap-6">
            {/* Previous button */}
            <div 
              onClick={handlePrevious}
              className="w-14 h-14 relative bg-white rounded-[64px] outline outline-1 outline-offset-[-1px] outline-zinc-800 overflow-hidden flex items-center justify-center cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            {/* Counter */}
            <div className="text-center text-zinc-800 text-base font-normal font-['Nunito_Sans'] leading-tight">
              {currentIndex + 1} / {portfolioItems.length}
            </div>
            
            {/* Next button */}
            <div 
              onClick={handleNext}
              className="w-14 h-14 relative bg-zinc-800 rounded-[64px] outline outline-1 outline-offset-[-1px] outline-zinc-800 overflow-hidden flex items-center justify-center cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5L16 12L9 19" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}