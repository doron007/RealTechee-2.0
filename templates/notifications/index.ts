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
};

// Import all templates using dynamic imports to avoid circular dependency
import { contactUsTemplate } from './contactUsTemplate';
import { getQualifiedTemplate } from './getQualifiedTemplate';
import { affiliateTemplate } from './affiliateTemplate';

// Re-export individual templates
export { contactUsTemplate, getQualifiedTemplate, affiliateTemplate };

// Combined templates object for easy import
export const notificationTemplates: NotificationTemplates = {
  contactUs: contactUsTemplate,
  getQualified: getQualifiedTemplate,
  affiliate: affiliateTemplate,
};

// Utility functions
export const formatPhoneForDisplay = (phone?: string): string => {
  if (!phone) return 'Not provided';
  // Basic phone formatting - can be enhanced
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    return timestamp;
  }
};

export const getUrgencyColor = (urgency?: string): string => {
  switch (urgency) {
    case 'high': return '#D11919'; // accent-red
    case 'medium': return '#FFB900'; // accent-yellow
    case 'low': return '#3BE8B0'; // accent-teal
    default: return '#17619C'; // accent-blue
  }
};

export const getUrgencyLabel = (urgency?: string): string => {
  switch (urgency) {
    case 'high': return '🔴 HIGH PRIORITY';
    case 'medium': return '🟡 MEDIUM PRIORITY';
    case 'low': return '🟢 LOW PRIORITY';
    default: return '🔵 STANDARD';
  }
};