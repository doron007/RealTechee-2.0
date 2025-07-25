import { useEffect, useState, RefObject } from 'react';

interface IntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  elementRef: RefObject<Element | null>,
  options: IntersectionObserverOptions = {}
): boolean {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    
    // Early return if element doesn't exist or IntersectionObserver is not supported
    if (!element || typeof IntersectionObserver === 'undefined') {
      // If IntersectionObserver is not supported, assume element is visible
      setIsIntersecting(true);
      return;
    }

    // If freezeOnceVisible is true and element is already visible, don't observe
    if (freezeOnceVisible && isIntersecting) {
      return;
    }

    // Check if element is already in view before setting up observer
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    // Use rootMargin in the initial check too
    const marginPx = parseInt(rootMargin) || 0;
    const isCurrentlyVisible = rect.top < (windowHeight + marginPx) && rect.bottom > -marginPx;
    
    if (isCurrentlyVisible) {
      setIsIntersecting(true);
      if (freezeOnceVisible) {
        return; // Don't set up observer if already visible and frozen
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);

        // If freezeOnceVisible is true and element becomes visible, unobserve
        if (freezeOnceVisible && entry.isIntersecting) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible]);

  return isIntersecting;
}