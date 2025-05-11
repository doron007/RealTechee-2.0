/**
 * Type definitions for Layout components
 */

import { ReactNode } from 'react';
import { SectionBackground, SectionSpacing } from '../../../components/common/layout/Section';

/**
 * Props for the Layout component
 */
export interface LayoutProps {
  /** Page content */
  children: ReactNode;
  /** Page title for SEO */
  title?: string;
  /** Page description for SEO */
  description?: string;
}

/**
 * Props for the Header component
 */
export interface HeaderProps {
  /** Additional CSS classes to apply to the header */
  className?: string;
  /** Whether the header is transparent */
  transparent?: boolean;
}

/**
 * Props for the Footer component
 */
export interface FooterProps {
  /** Additional CSS classes to apply to the footer */
  className?: string;
}

// Extend the base SectionProps from the Section component
interface BaseSectionProps {
  children: ReactNode;
  className?: string;
  background?: SectionBackground;
  spacing?: SectionSpacing;
  id?: string;
  animated?: boolean;
  staggerChildren?: boolean;
  staggerDelay?: number;
  textColor?: 'white' | 'black' | 'default';
}

// Extended Section props for components like Hero that need additional functionality
export interface ExtendedSectionProps extends BaseSectionProps {
  // Decorative elements
  withDecorativeElements?: boolean;
  
  // Background related props
  backgroundImage?: string;
  mobileBackgroundImage?: string;
  withOverlay?: boolean;
  
  // Layout related props
  constrained?: boolean;
  
  // Margin and padding
  marginTop?: number | string;
  marginBottom?: number | string;
  paddingTop?: number | string | Record<string, number>;
  paddingBottom?: number | string | Record<string, number>;
}