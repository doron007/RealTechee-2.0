import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

// Define types for responsive padding
type ResponsivePadding = {
  default: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
};

export interface SectionProps {
  /**
   * ID for the section, useful for navigation
   */
  id?: string;

  /**
   * Custom CSS classes to apply to the section container
   */
  className?: string;

  /**
   * Top margin in pixels (default: 0px)
   */
  marginTop?: number;

  /**
   * Bottom margin in pixels (default: 0px)
   */
  marginBottom?: number;

  /**
   * Top padding in pixels (default: 50px)
   * Can be a single number for consistent padding or an object for responsive padding
   * Example: { default: 50, md: 80, '2xl': 100 }
   */
  paddingTop?: number | ResponsivePadding;

  /**
   * Bottom padding in pixels (default: 50px)
   * Can be a single number for consistent padding or an object for responsive padding
   * Example: { default: 50, md: 80, '2xl': 100 }
   */
  paddingBottom?: number | ResponsivePadding;

  /**
   * Optional background image URL
   */
  backgroundImage?: string;

  /**
   * Optional mobile-specific background image URL
   */
  mobileBackgroundImage?: string;

  /**
   * Whether to add a gradient overlay to the background
   */
  withOverlay?: boolean;

  /**
   * Custom CSS classes for the overlay
   */
  overlayClassName?: string;

  /**
   * Whether to enable entrance animations for children
   */
  animated?: boolean;

  /**
   * Delay before starting the animation in milliseconds
   */
  animationDelay?: number;

  /**
   * Whether to stagger child animations (applies class to direct children)
   */
  staggerChildren?: boolean;

  /**
   * Delay between each child animation in milliseconds
   */
  staggerDelay?: number;

  /**
   * Whether the content should have a max width
   */
  constrained?: boolean;

  /**
   * CSS classes to apply to the constrained content container
   */
  contentClassName?: string;

  /**
   * Whether to add decorative elements (blobs/circles) in the background
   */
  withDecorativeElements?: boolean;

  /**
   * The children to render inside the section
   */
  children: ReactNode;
}

/**
 * A standardized, reusable section component that handles common layout patterns
 * including background images, animations, and responsive padding.
 * Width constraints match the Header component for consistency.
 */
const Section: React.FC<SectionProps> = ({
  id,
  className = '',
  marginTop = 0,
  marginBottom = 0,
  paddingTop = 50,
  paddingBottom = 50,
  backgroundImage,
  mobileBackgroundImage,
  withOverlay = false,
  overlayClassName = '',
  animated = false,
  animationDelay = 300,
  staggerChildren = false,
  staggerDelay = 100,
  constrained = true,
  contentClassName = '',
  withDecorativeElements = false,
  children
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(!animated);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Generate a stable section ID for CSS targeting
  const [sectionId] = useState(() => id || `section-${Math.random().toString(36).substring(2, 11)}`);

  useEffect(() => {
    setIsMounted(true);

    if (animated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, animationDelay);

      return () => clearTimeout(timer);
    }
  }, [animated, animationDelay]);

  // Apply responsive padding using useEffect to ensure it's applied on the client side
  useEffect(() => {
    // Skip if not mounted yet
    if (!isMounted || !sectionRef.current) return;

    // Handle responsive padding
    if (typeof paddingTop === 'object' || typeof paddingBottom === 'object') {
      // Apply base padding
      if (typeof paddingTop === 'object') {
        sectionRef.current.style.paddingTop = `${paddingTop.default}px`;
      }
      if (typeof paddingBottom === 'object') {
        sectionRef.current.style.paddingBottom = `${paddingBottom.default}px`;
      }

      // Create and apply media query stylesheet
      const styleId = `responsive-padding-${sectionId}`;
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;

      // Create style element if it doesn't exist
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      // Generate CSS for media queries
      let css = '';

      // Generate top padding media queries
      if (typeof paddingTop === 'object') {
        if (paddingTop.md) {
          css += `@media (min-width: 768px) { #${sectionId} { padding-top: ${paddingTop.md}px !important; } }\n`;
        }
        if (paddingTop.lg) {
          css += `@media (min-width: 1024px) { #${sectionId} { padding-top: ${paddingTop.lg}px !important; } }\n`;
        }
        if (paddingTop.xl) {
          css += `@media (min-width: 1280px) { #${sectionId} { padding-top: ${paddingTop.xl}px !important; } }\n`;
        }
        if (paddingTop['2xl']) {
          css += `@media (min-width: 1536px) { #${sectionId} { padding-top: ${paddingTop['2xl']}px !important; } }\n`;
        }
      }

      // Generate bottom padding media queries
      if (typeof paddingBottom === 'object') {
        if (paddingBottom.md) {
          css += `@media (min-width: 768px) { #${sectionId} { padding-bottom: ${paddingBottom.md}px !important; } }\n`;
        }
        if (paddingBottom.lg) {
          css += `@media (min-width: 1024px) { #${sectionId} { padding-bottom: ${paddingBottom.lg}px !important; } }\n`;
        }
        if (paddingBottom.xl) {
          css += `@media (min-width: 1280px) { #${sectionId} { padding-bottom: ${paddingBottom.xl}px !important; } }\n`;
        }
        if (paddingBottom['2xl']) {
          css += `@media (min-width: 1536px) { #${sectionId} { padding-bottom: ${paddingBottom['2xl']}px !important; } }\n`;
        }
      }

      // Apply CSS
      styleEl.textContent = css;
    }

    // Clean up function
    return () => {
      const styleId = `responsive-padding-${sectionId}`;
      const styleEl = document.getElementById(styleId);
      if (styleEl) {
        styleEl.parentNode?.removeChild(styleEl);
      }
    };
  }, [isMounted, sectionId, paddingTop, paddingBottom]);

  // Handle responsive background image if both options are provided
  const bgImage = backgroundImage && mobileBackgroundImage && isMounted && window.innerWidth < 768
    ? `url(${mobileBackgroundImage})`
    : backgroundImage ? `url(${backgroundImage})` : undefined;

  // Base section classes
  const sectionClasses = twMerge(
    "relative section-container",
    backgroundImage ? 'overflow-hidden' : '',
    className
  );

  // Content container classes - match the Header width constraints
  const contentContainerClasses = twMerge(
    "section-content relative z-10 w-full max-w-[1536px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-14 2xl:px-16",
    contentClassName
  );

  // Create staggered animation with React.Children if needed
  const renderContent = () => {
    if (staggerChildren && React.Children.count(children) > 0) {
      return React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        // Calculate stagger delay based on index
        const delay = index * staggerDelay;

        // Clone the element and add animation classes with proper type safety
        return React.cloneElement(child, {
          className: twMerge(
            (child.props as { className?: string }).className || '',
            `transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`
          ),
          style: {
            ...((child.props as { style?: React.CSSProperties }).style || {}),
            transitionDelay: `${delay}ms`,
          }
        } as React.HTMLAttributes<HTMLElement>);
      });
    } else if (animated) {
      return (
        <div className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {children}
        </div>
      );
    } else {
      return children;
    }
  };

  // Calculate styles for the section
  const sectionStyle: React.CSSProperties = {
    marginTop: `${marginTop}px`,
    marginBottom: `${marginBottom}px`
  };

  // Only set initial padding values for non-responsive padding
  if (typeof paddingTop === 'number') {
    sectionStyle.paddingTop = `${paddingTop}px`;
  } else if (typeof paddingTop === 'object' && !isMounted) {
    // Set initial value for SSR only (will be overridden by useEffect)
    sectionStyle.paddingTop = `${paddingTop.default}px`;
  }

  if (typeof paddingBottom === 'number') {
    sectionStyle.paddingBottom = `${paddingBottom}px`;
  } else if (typeof paddingBottom === 'object' && !isMounted) {
    // Set initial value for SSR only (will be overridden by useEffect)
    sectionStyle.paddingBottom = `${paddingBottom.default}px`;
  }

  return (
    <section
      id={sectionId}
      ref={sectionRef}
      className={sectionClasses}
      data-animated={animated}
      style={sectionStyle}
    >
      {/* Background with optional overlay */}
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: bgImage }}
        >
          {withOverlay && (
            <div className={twMerge("absolute inset-0 bg-gradient-to-b from-transparent to-white/20", overlayClassName)}></div>
          )}
        </div>
      )}

      {/* Content container */}
      <div className={contentContainerClasses}>
        {/* Optional inner constrained container */}
        {constrained ? (
          <div className="max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
            {renderContent()}
          </div>
        ) : (
          renderContent()
        )}

        {/* Decorative elements - visible on larger screens */}
        {withDecorativeElements && (
          <>
            <div className="hidden md:block absolute bottom-0 right-0 -mb-16 -mr-16 opacity-20 z-0">
              <div className="w-64 h-64 rounded-full bg-accent/30 blur-3xl"></div>
            </div>
            <div className="hidden md:block absolute top-24 left-8 -mt-8 -ml-8 opacity-20 z-0">
              <div className="w-48 h-48 rounded-full bg-primary/30 blur-3xl"></div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Section;