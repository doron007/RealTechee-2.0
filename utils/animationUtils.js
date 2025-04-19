import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Hook to animate counting from one number to another when element comes into view
 * @param {number} end - The target number to count to
 * @param {number} duration - Duration of the animation in milliseconds
 * @param {number} start - Starting number for the counter
 * @param {number} delay - Delay before animation starts in milliseconds
 * @returns {[number, React.RefObject]} - The current count and ref to attach to your element
 */
export const useCounter = (end, duration = 2000, start = 0, delay = 0) => {
  const [count, setCount] = useState(start);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (!inView) return;

    let startTime;
    let animationFrame;
    
    const startAnimation = (timestamp) => {
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