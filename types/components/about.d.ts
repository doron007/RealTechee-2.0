/**
 * Type definitions for About page components
 */

/**
 * Props for the AboutSection component
 */
export interface AboutSectionProps {
  /** Section title */
  title?: string;
  /** Section content/description */
  content?: string;
  /** Background image or illustration */
  illustration?: string;
}

/**
 * Props for the Milestones component
 */
export interface MilestonesProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Milestone items to display */
  milestones?: Array<{
    id: string;
    year: string | number;
    title: string;
    description: string;
    icon?: string;
  }>;
}

/**
 * Props for the Portfolio component
 */
export interface PortfolioProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Portfolio items to display */
  items?: Array<{
    id: string;
    title: string;
    description?: string;
    image: string;
    category?: string;
    link?: string;
  }>;
}