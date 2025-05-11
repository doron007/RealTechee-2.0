import React from 'react';

interface ContainerThreeColumnsProps {
  leftContent: React.ReactNode;
  middleContent: React.ReactNode;
  rightContent: React.ReactNode;
  className?: string;
  gap?: 'small' | 'medium' | 'large' | 'figma';
  breakpoint?: 'sm' | 'md' | 'lg';
  verticalAlign?: 'top' | 'center' | 'bottom' | 'stretch';
  horizontalAlign?: 'left' | 'center' | 'right' | 'stretch';
  columnWidths?: 'equal' | 'custom';
  customLeftWidth?: string;
  customMiddleWidth?: string;
  customRightWidth?: string;
  contentMaxWidth?: string;
  textAlign?: 'left' | 'center' | 'right';
}

/**
 * Three-column layout component that follows the Figma design proportions
 * Provides responsive behavior and customizable gap spacing
 */
export default function ContainerThreeColumns({
  leftContent,
  middleContent,
  rightContent,
  className = '',
  gap = 'medium',
  breakpoint = 'md',
  verticalAlign = 'center',
  horizontalAlign = 'center',
  columnWidths = 'equal',
  customLeftWidth,
  customMiddleWidth,
  customRightWidth,
  contentMaxWidth,
  textAlign = 'left'
}: ContainerThreeColumnsProps) {
  // Define gap sizes - updated 'figma' to exactly match 50px at desktop
  const gapSizes = {
    small: 'gap-4 sm:gap-6 md:gap-8',
    medium: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12',
    large: 'gap-8 sm:gap-10 md:gap-12 lg:gap-16',
    figma: 'gap-6 sm:gap-8 md:gap-10 lg:gap-[50px]' // 50px gap at desktop as per Figma design
  };
  
  // Define responsive breakpoints
  const breakpointClass = {
    sm: 'sm:grid-cols-3 grid-cols-1',
    md: 'md:grid-cols-3 grid-cols-1',
    lg: 'lg:grid-cols-3 grid-cols-1'
  };

  // Define vertical alignment classes
  const verticalAlignClass = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
    stretch: 'items-stretch'
  };
  
  // Define horizontal alignment classes
  const horizontalAlignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    stretch: 'justify-stretch'
  };
  
  // Define text alignment classes
  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  // Determine column width classes
  let leftColWidth = 'w-full';
  let middleColWidth = 'w-full';
  let rightColWidth = 'w-full';
  
  // If custom column widths are specified
  if (columnWidths === 'custom') {
    leftColWidth = `w-full ${breakpoint}:${customLeftWidth || 'w-1/3'}`;
    middleColWidth = `w-full ${breakpoint}:${customMiddleWidth || 'w-1/3'}`;
    rightColWidth = `w-full ${breakpoint}:${customRightWidth || 'w-1/3'}`;
  }
  
  // Determine the content max width class
  const maxWidthClass = contentMaxWidth ? `max-w-[${contentMaxWidth}]` : '';
  
  return (
    <div className={`grid ${breakpointClass[breakpoint]} ${gapSizes[gap]} ${verticalAlignClass[verticalAlign]} ${className} ${textAlignClass[textAlign]}`}>
      <div className={`${leftColWidth} ${horizontalAlignClass[horizontalAlign]}`}>
        {leftContent}
      </div>
      
      <div className={`${middleColWidth} ${horizontalAlignClass[horizontalAlign]}`}>
        {middleContent}
      </div>
      
      <div className={`${rightColWidth} ${horizontalAlignClass[horizontalAlign]}`}>
        {rightContent}
      </div>
    </div>
  );
}