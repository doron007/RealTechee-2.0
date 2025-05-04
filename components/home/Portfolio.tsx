import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export default function Portfolio() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // Center position
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  
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
  
  // Handle slider drag events for comparison
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleSliderMove(e);
  };
  
  const handleMouseUp = () => {
    isDragging.current = false;
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleSliderMove(e);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current && e.touches[0]) {
      const touch = e.touches[0];
      handleSliderMoveTouch(touch);
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    if (e.touches[0]) {
      handleSliderMoveTouch(e.touches[0]);
    }
  };
  
  const handleTouchEnd = () => {
    isDragging.current = false;
  };
  
  const handleSliderMove = (e: React.MouseEvent) => {
    if (sliderContainerRef.current) {
      const containerRect = sliderContainerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, newPosition)));
    }
  };
  
  const handleSliderMoveTouch = (touch: React.Touch) => {
    if (sliderContainerRef.current) {
      const containerRect = sliderContainerRef.current.getBoundingClientRect();
      const newPosition = ((touch.clientX - containerRect.left) / containerRect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, newPosition)));
    }
  };
  
  // Add event listeners for mouse up event (when mouse leaves the container)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);
  
  return (
    <section className="section-container bg-white py-10 sm:py-12 md:py-16 lg:py-20">
      <div className="section-content flex flex-col gap-8 sm:gap-10 md:gap-12 lg:gap-16">
        <div className="text-center">
          <p className="text-xs sm:text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-1 sm:mb-2">PORTFOLIO</p>
          <h2 className="text-dark-gray font-bold font-heading text-2xl sm:text-3xl md:text-4xl lg:text-[43px] leading-tight mb-4 sm:mb-6">
            Before and After Renovation Projects
          </h2>
        </div>
        
        <div className="w-full max-w-[1200px] bg-white rounded-md flex flex-col justify-start items-start mx-auto">
          {/* Interactive slider comparison for desktop, side by side for mobile */}
          <div className="flex flex-col w-full">
            {/* Mobile view: Enhanced responsive before/after display */}
            <div className="flex flex-col sm:flex-row md:hidden w-full gap-4 sm:gap-6">
              {/* Before image container - takes full width on xs, half on sm */}
              <div className="w-full sm:w-1/2 relative">
                <div className="aspect-w-4 aspect-h-3">
                  <Image 
                    width={600}
                    height={451}
                    className="w-full h-full object-cover rounded-t-md" 
                    src={currentItem.beforeImage}
                    alt={`Before renovation - ${currentItem.location}`} 
                  />
                </div>
                <div className="w-full py-2 sm:py-3 bg-[#F6F6F6] flex justify-center items-center rounded-b-md">
                  <div className="text-center text-zinc-800 text-xs sm:text-sm font-extrabold font-['Nunito_Sans'] leading-tight">Before</div>
                </div>
              </div>
              
              {/* After image container - takes full width on xs, half on sm */}
              <div className="w-full sm:w-1/2 relative">
                <div className="aspect-w-4 aspect-h-3">
                  <Image 
                    width={600}
                    height={451}
                    className="w-full h-full object-cover rounded-t-md" 
                    src={currentItem.afterImage}
                    alt={`After renovation - ${currentItem.location}`} 
                  />
                </div>
                <div className="w-full py-2 sm:py-3 bg-[#F0E4DF] flex justify-center items-center rounded-b-md">
                  <div className="text-center text-red-500 text-xs sm:text-sm font-extrabold font-['Nunito_Sans'] leading-tight">After</div>
                </div>
              </div>
            </div>
            
            {/* Desktop view: Interactive slider comparison */}
            <div 
              ref={sliderContainerRef}
              className="hidden md:block relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] cursor-ew-resize overflow-hidden rounded-md"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* After Image - Full width */}
              <div className="absolute inset-0">
                <Image 
                  src={currentItem.afterImage}
                  alt={`After renovation - ${currentItem.location}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1200px"
                  priority
                />
                
                {/* After Label - Position dynamically on right side with responsiveness to slider */}
                <div 
                  className={`absolute bottom-0 py-3 bg-[#F0E4DF] bg-opacity-80 flex justify-center items-center transition-all duration-100`}
                  style={{ 
                    right: 0, 
                    left: `${Math.min(95, sliderPosition + 5)}%`,
                    opacity: sliderPosition < 95 ? 1 : 0 
                  }}
                >
                  <div className="text-center text-red-500 text-sm sm:text-base font-extrabold font-['Nunito_Sans'] leading-tight">After</div>
                </div>
              </div>
              
              {/* Before Image - Clipped based on slider position */}
              <div 
                className="absolute inset-0 overflow-hidden" 
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="absolute inset-0 w-[100vw]">
                  <Image 
                    src={currentItem.beforeImage}
                    alt={`Before renovation - ${currentItem.location}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 1200px"
                    priority
                  />
                </div>
                
                {/* Before Label - Position dynamically on left side with responsiveness to slider */}
                <div 
                  className={`absolute bottom-0 py-3 bg-[#F6F6F6] bg-opacity-80 flex justify-center items-center transition-all duration-100`}
                  style={{ 
                    left: 0, 
                    right: `${Math.min(95, 100 - sliderPosition + 5)}%`,
                    opacity: sliderPosition > 5 ? 1 : 0
                  }}
                >
                  <div className="text-center text-zinc-800 text-sm sm:text-base font-extrabold font-['Nunito_Sans'] leading-tight">Before</div>
                </div>
              </div>
              
              {/* Slider Control */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12L5 12" stroke="#2A2B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 8L19 12L15 16" stroke="#2A2B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 16L5 12L9 8" stroke="#2A2B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation bar - improved for better mobile responsiveness */}
          <div className="self-stretch flex flex-col sm:flex-row justify-between items-center w-full mt-6 sm:mt-8 md:mt-10 lg:mt-12 gap-5 sm:gap-4">
            {/* Location and value section */}
            <div className="py-2 sm:py-3 bg-white flex flex-col justify-start items-center sm:items-start gap-1 w-full sm:w-auto">
              <div className="text-neutral-400 text-xs font-normal font-['Roboto'] leading-tight">{currentItem.location}</div>
              <div className="text-center sm:text-left">
                <span className="text-zinc-800 text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold font-['Nunito_Sans']">Value increased by </span>
                <span className="text-red-500 text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold font-['Nunito_Sans']">{currentItem.valueIncrease}</span>
              </div>
            </div>
            
            {/* Divider line - hidden on mobile */}
            <div className="hidden sm:block w-0 sm:w-[15%] md:w-[25%] lg:w-[35%] h-0 outline outline-1 outline-offset-[-0.50px] outline-black" />
            
            {/* Navigation controls */}
            <div className="flex justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {/* Previous button */}
              <div 
                onClick={handlePrevious}
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 relative bg-white rounded-full outline outline-1 outline-offset-[-1px] outline-zinc-800 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6">
                  <path d="M15 19L8 12L15 5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              {/* Counter */}
              <div className="text-center text-zinc-800 text-xs sm:text-sm md:text-base font-normal font-['Nunito_Sans'] leading-tight">
                {currentIndex + 1} / {portfolioItems.length}
              </div>
              
              {/* Next button */}
              <div 
                onClick={handleNext}
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 relative bg-zinc-800 rounded-full outline outline-1 outline-offset-[-1px] outline-zinc-800 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6">
                  <path d="M9 5L16 12L9 19" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}