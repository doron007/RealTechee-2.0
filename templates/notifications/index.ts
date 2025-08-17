/**
 * RealTechee Internal Staff Notification Templates
 * Professional email and SMS templates for form submissions
 * 
 * Templates included:
 * - Contact Us Form notifications
 * - Get Qualified Form notifications  
 * - Affiliate Form notifications
 * 
 * Each form has both email and SMS templates for internal staff
 */

// Type definitions for template data
export interface BaseNotificationData {
  formType: string;
  submissionId: string;
  submittedAt: string;
  testData?: boolean;
  leadSource?: string;
}

export interface ContactFormData extends BaseNotificationData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  urgency?: 'low' | 'medium' | 'high';
  preferredContact?: 'email' | 'phone';
}

export interface GetQualifiedFormData extends BaseNotificationData {
  name: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  brokerage?: string;
  yearsExperience?: string;
  specialties?: string[];
  marketAreas?: string[];
  currentVolume?: string;
  goals?: string;
}

export interface AffiliateFormData extends BaseNotificationData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceType: string;
  businessLicense?: string;
  insurance?: boolean;
  bonded?: boolean;
  yearsInBusiness?: string;
  serviceAreas?: string[];
  certifications?: string[];
  portfolio?: string;
}

// Template types
export type NotificationTemplate = {
  email: (data: any) => { subject: string; html: string; text: string };
  sms: (data: any) => string;
};

export type NotificationTemplates = {
  contactUs: NotificationTemplate;
  getQualified: NotificationTemplate;
  affiliate: NotificationTemplate;
  getEstimate: NotificationTemplate;
};

// Import all templates
import { contactUsTemplate } from './contactUsTemplate';
import { getQualifiedTemplate } from './getQualifiedTemplate';
import { affiliateTemplate } from './affiliateTemplate';
import { getEstimateTemplate } from './getEstimateTemplate';

// Re-export individual templates
export { contactUsTemplate, getQualifiedTemplate, affiliateTemplate, getEstimateTemplate };

// Re-export the enhanced Get Estimate template type and helper
export type { GetEstimateFormData } from './getEstimateTemplate';
export { fileLinks } from './getEstimateTemplate';

// Import utilities
import { 
  formatTimestamp, 
  formatPhoneForDisplay, 
  getUrgencyColor, 
  getUrgencyLabel 
} from './utils';

// Legacy interface - replaced by enhanced GetEstimateFormData in getEstimateTemplate.ts
// Legacy interface - now in getEstimateTemplate.ts with enhanced fields
export interface LegacyGetEstimateFormData extends BaseNotificationData {
  name: string;
  email: string;
  phone?: string;
  address?: {
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
  };
  serviceType?: string;
  budget?: string;
  timeline?: string;
  workingOnsite?: boolean;
  projectDescription?: string;
  submissionId: string;
  submittedAt: string;
  urgency?: 'low' | 'medium' | 'high';
}

// Legacy template removed - now using enhanced template from getEstimateTemplate.ts

// Combined templates object for easy import
export const notificationTemplates: NotificationTemplates = {
  contactUs: contactUsTemplate,
  getQualified: getQualifiedTemplate,
  affiliate: affiliateTemplate,
  getEstimate: getEstimateTemplate,
};

// Re-export utility functions from utils file
export { 
  formatPhoneForDisplay, 
  formatTimestamp, 
  getUrgencyColor, 
  getUrgencyLabel 
} from './utils';