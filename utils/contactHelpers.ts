/**
 * Contact Management Utilities
 * 
 * Handles contact creation, updates, and email normalization
 * to prevent duplicates and ensure data integrity
 */

import { generateClient } from 'aws-amplify/api';
import { listContacts, getContacts } from '../queries';
import { createContacts, updateContacts } from '../mutations';
import type { Contacts } from '../API';

const client = generateClient();

/**
 * Normalize email address for consistent comparison
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .toLowerCase()                    // Convert to lowercase
    .trim()                          // Remove leading/trailing whitespace
    .replace(/\s+/g, '')            // Remove all internal spaces
    .replace(/[^\w@.-]/g, '');      // Remove special characters except @ . -
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalizedEmail);
}

/**
 * Check if contact exists by normalized email
 */
export async function findContactByEmail(email: string): Promise<any | null> {
  if (!email || !isValidEmail(email)) {
    return null;
  }
  
  const normalizedEmail = normalizeEmail(email);
  
  try {
    // Search for contact with this email
    // Note: DynamoDB doesn't have case-insensitive search, so we scan and filter
    const result = await client.graphql({
      query: listContacts,
      variables: {
        limit: 1000 // Adjust based on your contact volume
      }
    });
    
    const contacts = result.data?.listContacts?.items || [];
    
    // Find contact with matching normalized email
    const matchingContact = contacts.find(contact => 
      contact && contact.email && 
      normalizeEmail(contact.email) === normalizedEmail
    );
    
    return matchingContact || null;
    
  } catch (error) {
    console.error('Error searching for contact by email:', error);
    return null;
  }
}

/**
 * Contact form data interface
 */
export interface ContactFormData {
  // Agent information
  agentEmail?: string;
  agentName?: string;
  agentPhone?: string;
  brokerage?: string;
  
  // Primary contact (homeowner/client)
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  mobile?: string;
  
  // Additional info
  company?: string;
  projectType?: string;
  message?: string;
  
  // Notification preferences
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

/**
 * Create or update contact based on email existence
 */
export async function upsertContact(formData: ContactFormData): Promise<{
  contact: any;
  isNew: boolean;
  success: boolean;
  error?: string;
}> {
  try {
    // Validate required fields
    if (!formData.email || !isValidEmail(formData.email)) {
      return {
        contact: null as any,
        isNew: false,
        success: false,
        error: 'Valid email is required'
      };
    }
    
    const normalizedEmail = normalizeEmail(formData.email);
    
    // Check if contact exists
    const existingContact = await findContactByEmail(normalizedEmail);
    
    if (existingContact) {
      // Update existing contact
      console.log(`📧 Updating existing contact: ${normalizedEmail}`);
      
      const updateInput = {
        id: existingContact.id,
        // Update fields with new data, keeping existing where new data is empty
        firstName: formData.firstName || existingContact.firstName,
        lastName: formData.lastName || existingContact.lastName,
        fullName: formData.fullName || formData.firstName && formData.lastName 
          ? `${formData.firstName} ${formData.lastName}` 
          : existingContact.fullName,
        phone: formData.phone || existingContact.phone,
        mobile: formData.mobile || existingContact.mobile,
        company: formData.company || existingContact.company,
        // Always update notification preferences if provided
        emailNotifications: formData.emailNotifications ?? existingContact.emailNotifications ?? true,
        smsNotifications: formData.smsNotifications ?? existingContact.smsNotifications ?? false,
        // Update timestamp
        updatedAt: new Date().toISOString()
      };
      
      const result = await client.graphql({
        query: updateContacts,
        variables: { input: updateInput }
      });
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      
      return {
        contact: result.data.updateContacts,
        isNew: false,
        success: true
      };
      
    } else {
      // Create new contact
      console.log(`📧 Creating new contact: ${normalizedEmail}`);
      
      const createInput = {
        email: normalizedEmail,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: formData.fullName || (formData.firstName && formData.lastName 
          ? `${formData.firstName} ${formData.lastName}` 
          : undefined),
        phone: formData.phone,
        mobile: formData.mobile,
        company: formData.company,
        emailNotifications: formData.emailNotifications ?? true,
        smsNotifications: formData.smsNotifications ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const result = await client.graphql({
        query: createContacts,
        variables: { input: createInput }
      });
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      
      return {
        contact: result.data.createContacts,
        isNew: true,
        success: true
      };
    }
    
  } catch (error) {
    console.error('Error upserting contact:', error);
    return {
      contact: null as any,
      isNew: false,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process agent information from form
 */
export async function processAgentContact(formData: ContactFormData): Promise<any | null> {
  if (!formData.agentEmail || !isValidEmail(formData.agentEmail)) {
    return null;
  }
  
  const agentFormData: ContactFormData = {
    email: formData.agentEmail,
    fullName: formData.agentName,
    phone: formData.agentPhone,
    company: formData.brokerage,
    emailNotifications: true,
    smsNotifications: false
  };
  
  const result = await upsertContact(agentFormData);
  return result.success ? result.contact : null;
}

/**
 * Comprehensive form processing for all 4 contact forms
 */
export async function processContactForm(formData: ContactFormData): Promise<{
  primaryContact: any | null;
  agentContact: any | null;
  success: boolean;
  error?: string;
}> {
  try {
    // Process agent contact first (if provided)
    const agentContact = await processAgentContact(formData);
    
    // Process primary contact
    const primaryResult = await upsertContact(formData);
    
    if (!primaryResult.success) {
      return {
        primaryContact: null,
        agentContact: agentContact,
        success: false,
        error: primaryResult.error
      };
    }
    
    console.log(`✅ Contact form processed successfully`);
    console.log(`   Primary: ${formData.email} (${primaryResult.isNew ? 'new' : 'updated'})`);
    if (agentContact) {
      console.log(`   Agent: ${formData.agentEmail} (processed)`);
    }
    
    return {
      primaryContact: primaryResult.contact,
      agentContact: agentContact,
      success: true
    };
    
  } catch (error) {
    console.error('Error processing contact form:', error);
    return {
      primaryContact: null,
      agentContact: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}