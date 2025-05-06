import { useEffect, useState, RefObject } from 'react';
import { useInView } from 'react-intersection-observer';

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