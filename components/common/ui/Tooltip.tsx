import React, { useState, ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  title, 
  placement = 'right',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getTooltipPositionClasses = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
      default:
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
    }
  };

  const getArrowClasses = () => {
    switch (placement) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-b-4 border-x-transparent border-x-4 border-t-0';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-l-4 border-y-transparent border-y-4 border-r-0';
      case 'right':
      default:
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-r-4 border-y-transparent border-y-4 border-l-0';
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 ${getTooltipPositionClasses()}`}>
          <div className="bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {title}
          </div>
          <div className={`absolute w-0 h-0 ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;