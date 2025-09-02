/**
 * RealTechee Internal Staff Notification API
 * 
 * POST /api/notifications/send
 * 
 * Sends internal staff notifications for form submissions
 * Supports Contact Us, Get Qualified, and Affiliate form types
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { notificationService, NotificationRecipient, ContactFormData, GetQualifiedFormData, AffiliateFormData } from '@/services/notificationService';

export type NotificationRequest = {
  templateType: 'contactUs' | 'getQualified' | 'affiliate';
  data: ContactFormData | GetQualifiedFormData | AffiliateFormData;
  channels?: 'email' | 'sms' | 'both';
  priority?: 'low' | 'medium' | 'high';
  recipients?: NotificationRecipient[];
  testMode?: boolean;
};

export type NotificationResponse = {
  success: boolean;
  message: string;
  data?: {
    templateType: string;
    recipientCount: number;
    channels: string[];
    results: {
      email?: any[];
      sms?: any[];
    };
    recipientValidation?: {
      environment: string;
      debugMode: boolean;
      originalCount: number;
      validCount: number;
      environmentOverride: boolean;
    };
  };
  error?: string;
  errors?: any[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NotificationResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Only POST requests are supported'
    });
  }

  try {
    const {
      templateType,
      data,
      channels = 'both',
      priority = 'medium',
      recipients,
      testMode = false
    }: NotificationRequest = req.body;

    // Validate required fields
    if (!templateType || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'templateType and data are required'
      });
    }

    // Validate template type
    if (!['contactUs', 'getQualified', 'affiliate'].includes(templateType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template type',
        error: 'templateType must be one of: contactUs, getQualified, affiliate'
      });
    }

    // Add test mode indicator to data if in test mode
    if (testMode) {
      data.testData = true;
      data.leadSource = 'E2E_TEST';
    }

    // Send notification using service with dynamic recipient resolution
    const result = await notificationService.sendNotification({
      templateType,
      data,
      recipients: recipients || await notificationService.getDynamicRecipients(templateType),
      channels,
      priority
    });

    // Determine response based on results
    if (result.success) {
      const emailCount = result.results.email?.length || 0;
      const smsCount = result.results.sms?.length || 0;
      const channelsUsed = [];
      
      if (channels === 'email' || channels === 'both') channelsUsed.push('email');
      if (channels === 'sms' || channels === 'both') channelsUsed.push('sms');

      return res.status(200).json({
        success: true,
        message: `Notifications sent successfully${testMode ? ' (Test Mode)' : ''}${result.recipientValidation?.environmentOverride ? ' (Development Override)' : ''}`,
        data: {
          templateType,
          recipientCount: Math.max(emailCount, smsCount),
          channels: channelsUsed,
          results: result.results,
          recipientValidation: result.recipientValidation ? {
            environment: result.recipientValidation.debugMode ? 'development' : 'production',
            debugMode: result.recipientValidation.debugMode,
            originalCount: result.recipientValidation.filteredCount + result.recipientValidation.validRecipients.length,
            validCount: result.recipientValidation.validRecipients.length,
            environmentOverride: result.recipientValidation.environmentOverride
          } : undefined
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send some or all notifications',
        errors: result.errors
      });
    }

  } catch (error) {
    console.error('Notification API error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

// Example usage documentation
export const exampleUsage = {
  // Contact Us Form Notification
  contactUs: {
    method: 'POST',
    url: '/api/notifications/send',
    body: {
      templateType: 'contactUs',
      channels: 'both',
      priority: 'high',
      data: {
        formType: 'contact-us',
        submissionId: 'contact_12345',
        submittedAt: new Date().toISOString(),
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        subject: 'Urgent Project Inquiry',
        message: 'I need immediate assistance with my renovation project...',
        urgency: 'high',
        preferredContact: 'phone',
        testData: false
      }
    }
  },

  // Get Qualified Form Notification
  getQualified: {
    method: 'POST',
    url: '/api/notifications/send',
    body: {
      templateType: 'getQualified',
      channels: 'both',
      priority: 'medium',
      data: {
        formType: 'get-qualified',
        submissionId: 'qual_67890',
        submittedAt: new Date().toISOString(),
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '(555) 234-5678',
        licenseNumber: 'RE123456',
        brokerage: 'Premier Real Estate',
        yearsExperience: '5 years',
        specialties: ['Residential', 'Luxury Homes'],
        marketAreas: ['Downtown', 'Westside'],
        currentVolume: '$2M annually',
        goals: 'Looking to expand into renovation partnerships...',
        testData: false
      }
    }
  },

  // Affiliate Form Notification
  affiliate: {
    method: 'POST',
    url: '/api/notifications/send',
    body: {
      templateType: 'affiliate',
      channels: 'both',
      priority: 'low',
      data: {
        formType: 'affiliate',
        submissionId: 'aff_54321',
        submittedAt: new Date().toISOString(),
        companyName: 'Elite Home Services',
        contactName: 'Mike Smith',
        email: 'mike@elitehome.com',
        phone: '(555) 345-6789',
        serviceType: 'General Contracting',
        businessLicense: 'GC987654',
        insurance: true,
        bonded: true,
        yearsInBusiness: '10 years',
        serviceAreas: ['Metro Area', 'Suburbs'],
        certifications: ['EPA Lead-Safe', 'OSHA 30'],
        portfolio: 'https://elitehome.com/portfolio',
        testData: false
      }
    }
  }
};

// Curl examples for testing
export const curlExamples = {
  contactUs: `
curl -X POST http://localhost:3000/api/notifications/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateType": "contactUs",
    "channels": "both",
    "priority": "high",
    "testMode": true,
    "data": {
      "formType": "contact-us",
      "submissionId": "contact_test_123",
      "submittedAt": "${new Date().toISOString()}",
      "name": "Test User",
      "email": "test@example.com",
      "phone": "(555) 123-4567",
      "subject": "Test Contact Form",
      "message": "This is a test message",
      "urgency": "high"
    }
  }'
  `,
  
  getQualified: `
curl -X POST http://localhost:3000/api/notifications/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateType": "getQualified",
    "channels": "email",
    "testMode": true,
    "data": {
      "formType": "get-qualified",
      "submissionId": "qual_test_456",
      "submittedAt": "${new Date().toISOString()}",
      "name": "Test Agent",
      "email": "agent@test.com",
      "phone": "(555) 234-5678",
      "licenseNumber": "TEST123",
      "yearsExperience": "3 years"
    }
  }'
  `
};