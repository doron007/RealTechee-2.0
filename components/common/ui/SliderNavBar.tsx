import React, { ReactNode } from 'react';

export interface SliderNavBarProps {
  /**
   * Current index in the slider (0-based)
   */
  currentIndex: number;
  
  /**
   * Total number of items in the slider
   */
  totalItems: number;
  
  /**
   * Handler for previous button click
   */
  onPrevious: () => void;
  
  /**
   * Handler for next button click
   */
  onNext: () => void;
  
  /**
   * Optional content to display on the left side of the navigation bar
   */
  leftContent?: ReactNode;
  
  /**
   * Primary color for active elements (e.g., next button background)
   * @default "#27272A" (zinc-800)
   */
  primaryColor?: string;
  
  /**
   * Text color for items on primary background
   * @default "#FFFFFF" (white)
   */
  primaryTextColor?: string;
  
  /**
   * Secondary color for inactive elements
   * @default "#FFFFFF" (white)
   */
  secondaryColor?: string;
  
  /**
   * Text color for normal text elements
   * @default "#27272A" (zinc-800)
   */
  textColor?: string;
  
  /**
   * Border color for elements with borders
   * @default "#27272A" (zinc-800)
   */
  borderColor?: string;
  
  /**
   * CSS class name for additional styling
   */
  className?: string;
}

/**
 * SliderNavBar component for navigating through slide content
 * Provides previous/next buttons and current position indicator
 */
const SliderNavBar: React.FC<SliderNavBarProps> = ({
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  leftContent,
  primaryColor = "#27272A", // zinc-800
  primaryTextColor = "#FFFFFF", // white
  secondaryColor = "#FFFFFF", // white
  textColor = "#27272A", // zinc-800
  borderColor = "#27272A", // zinc-800
  className = ""
}) => {
  return (
    <div className={`self-stretch flex flex-col sm:flex-row justify-between items-center w-full mt-6 sm:mt-8 md:mt-10 lg:mt-12 gap-5 sm:gap-4 ${className}`}>
      {/* Left content area (if provided) */}
      {leftContent && (
        <>
          <div className="py-2 sm:py-3 bg-white flex flex-col justify-start items-center sm:items-start gap-1 w-full sm:w-auto">
            {leftContent}
          </div>
          
          {/* Divider line - hidden on mobile */}
          <div className="hidden sm:block w-0 sm:w-[15%] md:w-[25%] lg:w-[35%] h-0 outline outline-1 outline-offset-[-0.50px]" style={{ outlineColor: borderColor }} />
        </>
      )}
      
      {/* Navigation controls */}
      <div className="flex justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {/* Previous button */}
        <div 
          onClick={onPrevious}
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 relative rounded-full outline outline-1 outline-offset-[-1px] overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          style={{ 
            backgroundColor: secondaryColor, 
            outlineColor: borderColor
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6">
            <path d="M15 19L8 12L15 5" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        {/* Counter */}
        <div 
          className="text-center text-xs sm:text-sm md:text-base font-normal font-['Nunito_Sans'] leading-tight"
          style={{ color: textColor }}
        >
          {currentIndex + 1} / {totalItems}
        </div>
        
        {/* Next button */}
        <div 
          onClick={onNext}
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 relative rounded-full outline outline-1 outline-offset-[-1px] overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          style={{ 
            backgroundColor: primaryColor, 
            outlineColor: borderColor
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6">
            <path d="M9 5L16 12L9 19" stroke={primaryTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SliderNavBar;