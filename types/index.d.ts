/**
 * Global type declarations for the RealTechee project
 */

// Re-export component type definitions
export * from './components/common/buttons';
export * from './components/common/layout';
export * from './components/common/ui';
export * from './components/home';
export * from './components/about';
export * from './components/contact';

// Define global interfaces and types
export interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

export interface NavigationItem {
  name: string;
  href: string;
  current?: boolean;
  children?: NavigationItem[];
}

// Define API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Common data structures
export interface TestimonialData {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating?: number;
}

export interface FeatureData {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

export interface PartnerData {
  id: string;
  name: string;
  logo: string;
  url?: string;
}