import React from 'react';
import Button from '../buttons/Button';

interface SliderNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onPageSelect?: (pageIndex: number) => void;
  accentColor?: string;
  className?: string;
}

export default function SliderNavigation({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onPageSelect,
  accentColor = '#E9674A',
  className = '',
}: SliderNavigationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex justify-end items-center mt-8 md:mt-12 ${className}`}>
      <div className="flex items-center gap-4">
        <Button
          variant="tertiary"
          onClick={onPrevious}
          withIcon
          iconPosition="left"
          iconSvg="/assets/icons/arrow-left.svg"
          text="Back"
          className="text-base font-medium"
        />
        
        {/* Page indicators - show all dots with the current one highlighted */}
        {onPageSelect && (
          <div className="flex space-x-3 mx-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => onPageSelect(i)}
                className="h-2.5 w-2.5 rounded-full transition-colors bg-gray-300"
                style={{ 
                  backgroundColor: currentPage === i ? accentColor : undefined
                }}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        )}
        
        <Button
          variant="tertiary"
          onClick={onNext}
          withIcon
          iconPosition="right"
          iconSvg="/assets/icons/arrow-right.svg"
          text="Next"
          className="text-base font-medium"
        />
      </div>
    </div>
  );
}