/**
 * Reusable scroll utilities for form UX enhancements
 */

/**
 * Smoothly scrolls to the top of the page
 * Used when showing success messages or important content
 */
export const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
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
    element.focus();
  }, focusDelay);
};