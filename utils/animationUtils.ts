import { useEffect, useState, RefObject } from 'react';
import { useInView } from 'react-intersection-observer';
import React from 'react';

/**
 * Hook to animate counting from one number to another when element comes into view
 * Animation will restart each time the element enters the viewport
 * @returns The current count and ref to attach to your element
 */
export const useCounter = (
  end: number, 
  duration: number = 2000, 
  start: number = 0, 
  delay: number = 0
): [number, (node?: Element | null) => void] => {
  const [count, setCount] = useState<number>(start);
  const [ref, inView] = useInView({
    triggerOnce: false, // Changed to false so it triggers every time element enters viewport
    threshold: 0.1,
  });

  useEffect(() => {
    // Reset count when element goes out of view
    if (!inView) {
      setCount(start);
      return;
    }

    let startTime: number;
    let animationFrame: number;
    
    const startAnimation = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      
      if (elapsedTime > delay) {
        const progress = Math.min((elapsedTime - delay) / duration, 1);
        setCount(Math.floor(progress * (end - start) + start));
      }
      
      if (elapsedTime < duration + delay) {
        animationFrame = requestAnimationFrame(startAnimation);
      } else {
        setCount(end);
      }
    };
    
    animationFrame = requestAnimationFrame(startAnimation);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [inView, end, duration, start, delay]);

  return [count, ref];
};

// Animation utility functions and constants

/**
 * Animation classes for fade-in and slide animations
 */
export const animations = {
  // Fade in animations
  fadeIn: 'opacity-0 animate-fade-in',
  fadeInSlow: 'opacity-0 animate-fade-in-slow',
  fadeInFast: 'opacity-0 animate-fade-in-fast',
  
  // Slide and fade animations
  slideInUp: 'opacity-0 translate-y-8 animate-slide-in-up',
  slideInDown: 'opacity-0 -translate-y-8 animate-slide-in-down',
  slideInLeft: 'opacity-0 translate-x-8 animate-slide-in-left',
  slideInRight: 'opacity-0 -translate-x-8 animate-slide-in-right',
  
  // Delay classes
  delay100: 'animation-delay-100',
  delay200: 'animation-delay-200',
  delay300: 'animation-delay-300',
  delay500: 'animation-delay-500',
  delay700: 'animation-delay-700',
  delay1000: 'animation-delay-1000',
};

// Define effect and delay types separately based on the animations object
type AnimationEffectKeys = 'fadeIn' | 'slideInUp' | 'slideInDown' | 'slideInLeft' | 'slideInRight' | 'fadeInSlow' | 'fadeInFast';
type AnimationDelayKeys = 'delay100' | 'delay200' | 'delay300' | 'delay500' | 'delay700' | 'delay1000';

/**
 * Animation types for components
 */
export type AnimationType = keyof Pick<typeof animations, AnimationEffectKeys>;

/**
 * Animation delay options
 */
export type AnimationDelay = keyof Pick<typeof animations, AnimationDelayKeys> | null;

/**
 * Hook to handle intersection observer animations
 */
interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
}

export const useIntersectionObserver = ({
  threshold = 0.15,
  rootMargin = '0px',
  root = null
}: UseIntersectionObserverProps = {}) => {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin, root }
    );
    
    observer.observe(ref);
    
    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, threshold, rootMargin, root]);

  return { ref: setRef, isVisible };
};

/**
 * Helper function to get animation classes based on visibility
 */
export const getAnimationClasses = (isVisible: boolean, animationType: AnimationType, delay?: AnimationDelay) => {
  const animationClass = animations[animationType];
  const delayClass = delay ? animations[delay] : '';
  
  return isVisible 
    ? `opacity-100 transform-none transition-all duration-1000 ${delayClass}`.trim()
    : animationClass;
};

/**
 * Props for animated components
 */
export interface WithAnimationProps {
  animate?: boolean;
  animationType?: AnimationType;
  animationDelay?: AnimationDelay;
  className?: string;
}

/**
 * Higher Order Component that adds animation capabilities to any component
 * @param WrappedComponent The component to enhance with animation
 * @returns A new component with animation capabilities
 */
export function withAnimation<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & WithAnimationProps> {
  // Create and return a new functional component
  const WithAnimation: React.FC<P & WithAnimationProps> = function({
    animate = true,
    animationType = 'slideInUp',
    animationDelay = null,
    className = '',
    ...props
  }) {
    const { ref, isVisible } = useIntersectionObserver();
    
    // If not animated, just render the component
    if (!animate) {
      // Fix: Create a new props object with className and the rest of props properly typed
      const componentProps = {
        ...props,
        className
      } as P;
      
      // Use createElement instead of JSX
      return React.createElement(WrappedComponent, componentProps);
    }
    
    // Get animation classes based on visibility and fixed animation type
    let animationClasses = '';
    if (isVisible) {
      animationClasses = 'opacity-100 transform-none transition-all duration-1000';
      if (animationDelay) {
        animationClasses += ` ${animations[animationDelay]}`;
      }
    } else {
      animationClasses = animations[animationType];
    }
    
    // Combine with existing className prop
    const combinedClassName = `${animationClasses} ${className}`.trim();
    
    // Create combined props with the updated className
    const combinedProps = {
      ...props,
      className: combinedClassName
    } as P;
    
    // Use createElement instead of JSX
    return React.createElement(
      'div',
      { ref }, 
      React.createElement(WrappedComponent, combinedProps)
    );
  };
  
  // Set display name for debugging purposes
  WithAnimation.displayName = `WithAnimation(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithAnimation;
}