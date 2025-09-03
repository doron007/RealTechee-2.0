/**
 * Reusable scroll utilities for form UX enhancements
 */

/**
 * Smoothly scrolls to the top of the page
 * Used when showing success messages or important content
 * Enhanced for mobile to account for viewport differences
 */
export const scrollToTop = (): void => {
  // Use both window.scrollTo and document.documentElement for better mobile support
  if (window.scrollTo) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  } else {
    // Fallback for older browsers
    document.documentElement.scrollTop = 0;
  }
};

/**
 * Scrolls to a specific element with an offset from the top
 * @param element - The HTML element to scroll to
 * @param offset - Number of pixels to offset from the top (default: 100)
 */
export const scrollToElement = (element: HTMLElement, offset: number = 100): void => {
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  const offsetPosition = absoluteElementTop - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

/**
 * Scrolls to an element and focuses it after the scroll animation
 * @param element - The HTML element to scroll to and focus
 * @param offset - Number of pixels to offset from the top (default: 100)
 * @param focusDelay - Delay before focusing in milliseconds (default: 300)
 */
export const scrollToAndFocus = (
  element: HTMLElement, 
  offset: number = 100, 
  focusDelay: number = 300
): void => {
  scrollToElement(element, offset);
  
  setTimeout(() => {
    // Enhanced mobile focus with viewport considerations
    if (element && typeof element.focus === 'function') {
      element.focus({ preventScroll: true }); // Prevent additional scroll on focus
    }
  }, focusDelay);
};

/**
 * Mobile-optimized scroll to first form field
 * Helps with UX when forms are below the fold on mobile
 * @param containerSelector - CSS selector for the form container (default: 'form')
 * @param offset - Offset from top in pixels for mobile (default: 20 for better mobile UX)
 */
export const scrollToFirstFormField = (containerSelector: string = 'form', offset: number = 20): void => {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  // Find first input, select, or textarea
  const firstField = container.querySelector('input, select, textarea') as HTMLElement;
  if (firstField) {
    scrollToElement(firstField, offset);
  }
};