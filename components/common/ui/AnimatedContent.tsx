import React, { ReactNode } from 'react';
import { getAnimationClasses } from '../../../utils/animationUtils';

interface AnimatedContentProps {
  children: ReactNode;
  isVisible: boolean;
  animation?: 'fadeIn' | 'slideInUp' | 'slideInDown' | 'slideInLeft' | 'slideInRight';
  delay?: 'delay100' | 'delay200' | 'delay300' | 'delay500' | 'delay700' | 'delay1000' | null;
  className?: string;
  textColor?: string;
}

/**
 * A component that wraps content with animation classes based on visibility
 * Reusable across the application for consistent animation behavior
 */
export default function AnimatedContent({
  children,
  isVisible,
  animation = 'slideInUp',
  delay = null,
  className = '',
  textColor = 'text-dark-gray'
}: AnimatedContentProps) {
  return (
    <div className={getAnimationClasses(isVisible, animation, delay)}>
      <div className={`${textColor} ${className}`}>
        {children}
      </div>
    </div>
  );
}