/**
 * Type definitions for Contact page components
 */

import { FormEvent, ChangeEvent } from 'react';

/**
 * Form data for contact form
 */
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  inquiryType: string;
}

/**
 * Props for the Contact component
 */
export interface ContactProps {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Initial form data */
  initialFormData?: ContactFormData;
  /** Form submission handler */
  onSubmit?: (data: ContactFormData) => Promise<void>;
  /** Input change handler */
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Inquiry type options */
  inquiryTypes?: Array<{
    id: string;
    label: string;
  }>;
  /** Contact information */
  contactInfo?: {
    address?: string[];
    email?: string;
    phone?: string;
    officeHours?: Array<{
      days: string;
      hours: string;
    }>;
    socialMedia?: Array<{
      name: string;
      url: string;
      icon: string;
    }>;
  };
}