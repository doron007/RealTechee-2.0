/**
 * API Endpoint to Test New Decoupled Notification Architecture
 * 
 * Usage: GET /api/test-notifications
 * Expected: 4 emails + 4 SMS messages
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { FormNotificationIntegration } from '../../services/formNotificationIntegration';
import { NotificationService } from '../../utils/notificationService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🧪 Testing New Decoupled Notification Architecture');
  console.log('Expected: 4 emails + 4 SMS messages\n');

  const notificationService = FormNotificationIntegration.getInstance();
  const testTimestamp = new Date().toISOString();
  const testSessionId = `test_${Date.now()}`;

  const results = [];

  try {
    // Test 1: Contact Us Form
    console.log('📧 Testing Contact Us Form Notification...');
    const contactUsData = {
      formType: 'contactUs' as const,
      submissionId: `contact_us_${testSessionId}`,
      submittedAt: testTimestamp,
      testData: true,
      name: 'John Test Customer',
      email: 'john.test@example.com',
      phone: '(555) 123-4567',
      subject: 'Kitchen Renovation Inquiry',
      message: 'I am interested in renovating my kitchen and would like to discuss options and pricing.',
      urgency: 'medium' as const,
      preferredContact: 'email' as const,
      product: 'Kitchen Renovation',
      address: {
        streetAddress: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        zip: '90210'
      }
    };

    const contactUsResult = await notificationService.notifyContactUsSubmission(contactUsData, {
      channels: 'both',
      priority: 'medium',
      testMode: true
    });
    
    results.push({ form: 'Contact Us', result: contactUsResult });
    console.log(`✅ Contact Us notification queued: ${contactUsResult.notificationId}`);

    // Test 2: Get Qualified Form
    console.log('🎯 Testing Get Qualified Form Notification...');
    const getQualifiedData = {
      formType: 'getQualified' as const,
      submissionId: `get_qualified_${testSessionId}`,
      submittedAt: testTimestamp,
      testData: true,
      name: 'Sarah Test Agent',
      email: 'sarah.agent@example.com',
      phone: '(555) 234-5678',
      licenseNumber: 'RE123456789',
      brokerage: 'Test Realty Group',
      yearsExperience: '5-10 years',
      specialties: ['Residential Sales', 'Investment Properties', 'First-Time Buyers'],
      marketAreas: ['Downtown', 'Suburban West', 'Waterfront District'],
      currentVolume: '$5M-10M annually',
      goals: 'Looking to expand my renovation referral network and provide better service to clients needing home improvements.'
    };

    const getQualifiedResult = await notificationService.notifyGetQualifiedSubmission(getQualifiedData, {
      channels: 'both',
      priority: 'high',
      testMode: true
    });
    
    results.push({ form: 'Get Qualified', result: getQualifiedResult });
    console.log(`✅ Get Qualified notification queued: ${getQualifiedResult.notificationId}`);

    // Test 3: Affiliate Form
    console.log('🔧 Testing Affiliate Form Notification...');
    const affiliateData = {
      formType: 'affiliate' as const,
      submissionId: `affiliate_${testSessionId}`,
      submittedAt: testTimestamp,
      testData: true,
      companyName: 'Test Construction Co.',
      contactName: 'Mike Test Contractor',
      email: 'mike.contractor@example.com',
      phone: '(555) 345-6789',
      serviceType: 'General Contractor',
      businessLicense: 'GC987654321',
      insurance: true,
      bonded: true,
      workersCompensation: true,
      environmentalFactor: true,
      oshaCompliance: true,
      signedNDA: true,
      safetyPlan: true,
      yearsInBusiness: '10+ years',
      numberOfEmployees: '15-25',
      serviceAreas: ['Greater Metro Area', 'Suburban Districts'],
      certifications: ['OSHA 30', 'EPA RRP', 'Energy Star'],
      portfolio: 'Specializing in kitchen and bathroom renovations with 200+ completed projects.',
      address: {
        streetAddress: '456 Contractor Lane',
        city: 'Business City',
        state: 'TX',
        zip: '75001'
      }
    };

    const affiliateResult = await notificationService.notifyAffiliateSubmission(affiliateData, {
      channels: 'both',
      priority: 'low',
      testMode: true
    });
    
    results.push({ form: 'Affiliate', result: affiliateResult });
    console.log(`✅ Affiliate notification queued: ${affiliateResult.notificationId}`);

    // Test 4: Get Estimate Form
    console.log('💰 Testing Get Estimate Form Notification...');
    
    const getEstimateResult = await NotificationService.queueGetEstimateNotification({
      customerName: 'Lisa Test Homeowner',
      customerEmail: 'lisa.homeowner@example.com',
      customerPhone: '(555) 456-7890',
      customerCompany: 'Test Home LLC',
      propertyAddress: '789 Property Avenue, Test Town, FL 33101',
      productType: 'Bathroom Renovation',
      message: 'Planning a complete master bathroom renovation. Looking for modern fixtures and walk-in shower installation.',
      submissionId: `get_estimate_${testSessionId}`,
      contactId: undefined,
      requestId: `req_${testSessionId}`
    });

    results.push({ 
      form: 'Get Estimate', 
      result: { 
        success: true, 
        notificationId: getEstimateResult,
        recipientsNotified: 1,
        environment: 'development' as const,
        debugMode: true
      } 
    });
    console.log(`✅ Get Estimate notification queued: ${getEstimateResult}`);

    // Summary
    const successCount = results.filter(r => r.result.success || r.result.notificationId).length;
    
    const summary = {
      testSession: testSessionId,
      timestamp: testTimestamp,
      expected: {
        emails: 4,
        sms: 4,
        total: 8
      },
      actual: {
        formsQueued: successCount,
        totalExpectedNotifications: successCount * 2, // Each form sends email + SMS
        architecture: 'Decoupled backend content generation',
        processingMode: 'DirectContent (no template dependency)'
      },
      results: results.map(r => ({
        form: r.form,
        success: r.result.success || !!r.result.notificationId,
        notificationId: r.result.notificationId || 'N/A',
        environment: r.result.environment || 'development',
        debugMode: r.result.debugMode || true
      })),
      status: successCount === 4 ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED',
      message: successCount === 4 
        ? '🎉 All 4 forms successfully queued! Check your debug email and phone for 8 total notifications.'
        : `⚠️ Only ${successCount}/4 forms succeeded. Check the logs for details.`
    };

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(JSON.stringify(summary, null, 2));

    res.status(200).json(summary);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      testSession: testSessionId,
      timestamp: testTimestamp,
      partialResults: results
    };
    
    res.status(500).json(errorResponse);
  }
}