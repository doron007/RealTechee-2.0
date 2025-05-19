import React from 'react';

interface SliderNavBarProps {
  currentIndex: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
  primaryColor?: string;
  primaryTextColor?: string;
  secondaryColor?: string;
  textColor?: string;
  borderColor?: string;
  leftContent?: React.ReactNode;
}

const SliderNavBar: React.FC<SliderNavBarProps> = ({
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  primaryColor = '#27272A',
  primaryTextColor = '#FFFFFF',
  secondaryColor = '#FFFFFF',
  textColor = '#27272A',
  borderColor = '#27272A',
  leftContent
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-between items-center border-t border-b py-4 px-4 sm:px-6 border-zinc-200">
      {/* Left content - Can be customized */}
      <div className="w-full sm:w-auto mb-4 sm:mb-0">
        {leftContent}
      </div>
      
      {/* Navigation controls */}
      <div className="flex items-center space-x-4">
        {/* Current slide indicator */}
        <div className="text-zinc-800 text-base font-normal">
          <span className="font-bold">{currentIndex + 1}</span>
          <span className="mx-1">/</span>
          <span>{totalItems}</span>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex space-x-2">
          <button 
            onClick={onPrevious}
            className="flex items-center justify-center h-10 w-10 rounded-sm border"
            style={{ 
              backgroundColor: secondaryColor, 
              color: textColor, 
              borderColor: borderColor
            }}
            aria-label="Previous item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          <button 
            onClick={onNext}
            className="flex items-center justify-center h-10 w-10 rounded-sm"
            style={{ 
              backgroundColor: primaryColor, 
              color: primaryTextColor
            }}
            aria-label="Next item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SliderNavBar;