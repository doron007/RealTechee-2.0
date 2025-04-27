/**
 * Type definitions for Layout components
 */

import { ReactNode } from 'react';

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