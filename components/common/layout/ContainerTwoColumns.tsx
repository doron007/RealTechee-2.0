import React from 'react';

interface ContainerTwoColumnsProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  className?: string;
  reverse?: boolean;
  gap?: 'small' | 'medium' | 'large' | 'figma';
  videoSide?: 'left' | 'right';
  breakpoint?: 'sm' | 'md' | 'lg';
  verticalGap?: 'small' | 'medium' | 'large';
  verticalAlign?: 'top' | 'center' | 'bottom' | 'stretch';
  contentMaxWidth?: string;
  textAlign?: 'left' | 'center' | 'right';
}

/**
 * Two-column layout component that follows the Figma design proportions
 * Provides responsive behavior and customizable gap spacing
 */
export default function ContainerTwoColumns({
  leftContent,
  rightContent,
  className = '',
  reverse = false,
  gap = 'figma',
  videoSide = 'left',
  breakpoint = 'lg',
  verticalGap = 'large',
  verticalAlign = 'center',
  contentMaxWidth,
  textAlign = 'left'
}: ContainerTwoColumnsProps) {
  // Define gap sizes
  const gapSizes = {
    small: 'gap-4 sm:gap-6 md:gap-8',
    medium: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12',
    large: 'gap-8 sm:gap-10 md:gap-12 lg:gap-16',
    figma: 'gap-8 sm:gap-10 md:gap-12 lg:gap-16' // 64px at desktop sizes
  };
  
  // Define vertical gap sizes when stacked
  const verticalGapSizes = {
    small: 'gap-4 sm:gap-6',
    medium: 'gap-6 sm:gap-8',
    large: 'gap-8 sm:gap-10'
  };
  
  // Define column widths to match Figma proportions
  const videoColumnWidth = 'w-full lg:w-[56%]'; // Video takes ~56% of space in Figma
  const textColumnWidth = 'w-full lg:w-[44%]';  // Text takes ~44% of space in Figma
  
  // Define responsive breakpoints
  const breakpointClass = {
    sm: 'flex-col sm:flex-row',
    md: 'flex-col md:flex-row',
    lg: 'flex-col lg:flex-row'
  };

  // Define vertical alignment classes
  const verticalAlignClass = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
    stretch: 'items-stretch'
  };

  // Define text alignment classes
  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  // Determine the column widths based on which side the video is on
  const leftColWidth = videoSide === 'left' ? videoColumnWidth : textColumnWidth;
  const rightColWidth = videoSide === 'left' ? textColumnWidth : videoColumnWidth;
  
  // Determine the content max width class
  const maxWidthClass = contentMaxWidth ? `max-w-[${contentMaxWidth}]` : '';
  
  return (
    <div className={`flex ${breakpointClass[breakpoint]} ${gapSizes[gap]} ${verticalAlignClass[verticalAlign]} ${className}`}>
      <div className={`${leftColWidth} ${reverse ? 'order-2 lg:order-2' : 'order-1 lg:order-1'}`}>
        {leftContent}
      </div>
      
      <div className={`${rightColWidth} ${reverse ? 'order-1 lg:order-1' : 'order-2 lg:order-2'}`}>
        {rightContent}
      </div>
    </div>
  );
}