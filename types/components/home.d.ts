/**
 * Type definitions for Home page components
 */

import { ReactNode } from 'react';

/**
 * Props for the Hero component
 */
export interface HeroProps {
  /** Main title text */
  title?: string;
  /** Subtitle or description text */
  subtitle?: string;
  /** CTA button text */
  ctaText?: string;
  /** CTA button link */
  ctaLink?: string;
  /** Secondary CTA button text */
  secondaryCtaText?: string;
  /** Secondary CTA button link */
  secondaryCtaLink?: string;
  /** Background image URL */
  backgroundImage?: string;
}

/**
 * Props for the Features component
 */
export interface FeaturesProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Feature items to display */
  features?: Array<{
    id: string;
    title: string;
    description: string;
    icon?: string;
    image?: string;
  }>;
}

/**
 * Props for the Testimonials component
 */
export interface TestimonialsProps {
  /** Section title */
  title?: string;
  /** Section subtitle or description */
  subtitle?: string;
  /** Testimonial items to display */
  testimonials?: Array<{
    id: string;
    name: string;
    role?: string;
    company?: string;
    content: string;
    avatar?: string;
    rating?: number;
  }>;
}

/**
 * Props for the Stats component
 */
export interface StatsProps {
  /** Section title */
  title?: string;
  /** Stats items to display */
  stats?: Array<{
    id: string;
    value: string | number;
    label: string;
    prefix?: string;
    suffix?: string;
  }>;
}

/**
 * Props for the CtaSection component
 */
export interface CtaSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** CTA button text */
  buttonText?: string;
  /** CTA button link */
  buttonLink?: string;
  /** Background color or image */
  background?: string;
}