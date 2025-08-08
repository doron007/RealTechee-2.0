/**
 * RealTechee Notification Template Tester
 * 
 * Utility for testing and validating notification templates
 * Generates sample data and validates template output
 */

import { notificationTemplates, ContactFormData, GetQualifiedFormData, AffiliateFormData } from './index';

// Sample test data generators
export const sampleData = {
  contactUs: (): ContactFormData => ({
    formType: 'contact-us',
    submissionId: `contact_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    subject: 'Urgent Kitchen Renovation Project',
    message: 'I need immediate assistance with my kitchen renovation. The project has a tight deadline of 3 weeks and involves complete appliance replacement, cabinet installation, and flooring. Please contact me as soon as possible to discuss timeline and pricing.',
    urgency: 'high',
    preferredContact: 'phone',
    testData: true,
    leadSource: 'E2E_TEST'
  }),

  getQualified: (): GetQualifiedFormData => ({
    formType: 'get-qualified',
    submissionId: `qual_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    name: 'Sarah Johnson',
    email: 'sarah.johnson@premierrealty.com',
    phone: '(555) 234-5678',
    licenseNumber: 'RE123456789',
    brokerage: 'Premier Real Estate Partners',
    yearsExperience: '5 years',
    specialties: ['Luxury Residential', 'Investment Properties', 'First-Time Buyers'],
    marketAreas: ['Downtown Metro', 'Westside Suburbs', 'Waterfront District'],
    currentVolume: '$2.5M annually',
    goals: 'I am looking to expand my service offerings to include renovation partnerships. My clients frequently ask about home improvement options, and I believe RealTechee could provide excellent value. I have a strong network of repeat clients and referrals.',
    testData: true,
    leadSource: 'E2E_TEST'
  }),

  affiliate: (): AffiliateFormData => ({
    formType: 'affiliate',
    submissionId: `aff_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    companyName: 'Elite Home Construction & Renovation',
    contactName: 'Michael Smith',
    email: 'mike.smith@elitehomecr.com',
    phone: '(555) 345-6789',
    serviceType: 'General Contracting & Renovation',
    businessLicense: 'GC987654321',
    insurance: true,
    bonded: true,
    yearsInBusiness: '12 years',
    serviceAreas: ['Metro Area', 'North Suburbs', 'East County', 'Waterfront Communities'],
    certifications: ['EPA Lead-Safe Certification', 'OSHA 30-Hour Training', 'Energy Star Partner', 'BBB A+ Rating'],
    portfolio: 'https://elitehomecr.com/portfolio',
    testData: true,
    leadSource: 'E2E_TEST'
  })
};

// Template validation functions
export const validateTemplate = {
  email: (templateResult: { subject: string; html: string; text: string }): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    metrics: {
      subjectLength: number;
      htmlSize: number;
      textLength: number;
      hasImages: boolean;
      hasLinks: boolean;
    };
  } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate subject
    if (!templateResult.subject || templateResult.subject.length === 0) {
      errors.push('Subject line is empty');
    }
    if (templateResult.subject.length > 78) {
      warnings.push('Subject line exceeds 78 characters (may be truncated in some email clients)');
    }

    // Validate HTML
    if (!templateResult.html || templateResult.html.length === 0) {
      errors.push('HTML content is empty');
    }
    if (templateResult.html.length > 102400) { // 100KB
      warnings.push('HTML content exceeds 100KB (may be clipped by Gmail)');
    }

    // Validate text fallback
    if (!templateResult.text || templateResult.text.length === 0) {
      errors.push('Text fallback is empty');
    }

    // Check for required elements
    if (templateResult.html && !templateResult.html.includes('RealTechee')) {
      errors.push('HTML content missing RealTechee branding');
    }
    if (!templateResult.html.includes('https://d200k2wsaf8th3.amplifyapp.com')) {
      warnings.push('HTML content missing admin dashboard links');
    }

    const metrics = {
      subjectLength: templateResult.subject.length,
      htmlSize: new Blob([templateResult.html]).size,
      textLength: templateResult.text.length,
      hasImages: templateResult.html.includes('<img'),
      hasLinks: templateResult.html.includes('<a href')
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metrics
    };
  },

  sms: (smsMessage: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    metrics: {
      length: number;
      segments: number;
      hasUrl: boolean;
      hasEmojis: boolean;
    };
  } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate message
    if (!smsMessage || smsMessage.length === 0) {
      errors.push('SMS message is empty');
    }

    // Check length and segments
    const length = smsMessage.length;
    const segments = Math.ceil(length / 160);

    if (length > 160) {
      warnings.push(`SMS exceeds 160 characters (${length} chars, ${segments} segments)`);
    }
    if (length > 320) {
      warnings.push('SMS exceeds 2 segments (may be expensive to send)');
    }

    // Check for required elements
    if (!smsMessage.includes('RealTechee')) {
      errors.push('SMS message missing RealTechee branding');
    }
    if (!smsMessage.includes('https://')) {
      warnings.push('SMS message missing admin dashboard link');
    }

    const metrics = {
      length,
      segments,
      hasUrl: smsMessage.includes('http'),
      hasEmojis: /[\ud83c-\ud83e][\ud000-\udfff]|[\u2600-\u27bf]/.test(smsMessage)
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metrics
    };
  }
};

// Complete template testing suite
export class TemplateTester {
  public static testAllTemplates(): {
    contactUs: any;
    getQualified: any;
    affiliate: any;
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      warnings: number;
    };
  } {
    const results = {
      contactUs: this.testTemplate('contactUs', sampleData.contactUs()),
      getQualified: this.testTemplate('getQualified', sampleData.getQualified()),
      affiliate: this.testTemplate('affiliate', sampleData.affiliate())
    };

    const summary = this.generateSummary(results);

    return { ...results, summary };
  }

  public static testTemplate(templateType: 'contactUs' | 'getQualified' | 'affiliate', data: any): {
    templateType: string;
    email: {
      template: any;
      validation: any;
    };
    sms: {
      template: string;
      validation: any;
    };
    passed: boolean;
  } {
    // Generate templates
    const emailTemplate = notificationTemplates[templateType].email(data);
    const smsTemplate = notificationTemplates[templateType].sms(data);

    // Validate templates
    const emailValidation = validateTemplate.email(emailTemplate);
    const smsValidation = validateTemplate.sms(smsTemplate);

    return {
      templateType,
      email: {
        template: emailTemplate,
        validation: emailValidation
      },
      sms: {
        template: smsTemplate,
        validation: smsValidation
      },
      passed: emailValidation.valid && smsValidation.valid
    };
  }

  private static generateSummary(results: any): {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  } {
    const tests = Object.values(results) as any[];
    const totalTests = tests.length * 2; // email + sms per template
    
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    tests.forEach((test: any) => {
      if (test.email.validation.valid) passed++;
      else failed++;
      
      if (test.sms.validation.valid) passed++;
      else failed++;
      
      warnings += test.email.validation.warnings.length;
      warnings += test.sms.validation.warnings.length;
    });

    return { totalTests, passed, failed, warnings };
  }

  // Generate preview HTML for visual testing
  public static generatePreviewHTML(): string {
    const testData = {
      contactUs: sampleData.contactUs(),
      getQualified: sampleData.getQualified(),
      affiliate: sampleData.affiliate()
    };

    const templates = {
      contactUs: notificationTemplates.contactUs.email(testData.contactUs),
      getQualified: notificationTemplates.getQualified.email(testData.getQualified),
      affiliate: notificationTemplates.affiliate.email(testData.affiliate)
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RealTechee Notification Templates Preview</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .template-preview { margin-bottom: 60px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .template-header { background: #151515; color: white; padding: 16px; margin: -20px -20px 20px; border-radius: 8px 8px 0 0; }
        .template-title { margin: 0; font-size: 24px; }
        .template-meta { color: #ccc; font-size: 14px; margin-top: 8px; }
        .template-content { border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden; }
        iframe { width: 100%; height: 600px; border: none; }
    </style>
</head>
<body>
    <h1 style="text-align: center; color: #151515; margin-bottom: 40px;">RealTechee Notification Templates Preview</h1>
    
    <div class="template-preview">
        <div class="template-header">
            <h2 class="template-title">Contact Us Form Notification</h2>
            <div class="template-meta">High Priority Customer Inquiry</div>
        </div>
        <div class="template-content">
            <iframe srcdoc="${templates.contactUs.html.replace(/"/g, '&quot;')}"></iframe>
        </div>
    </div>

    <div class="template-preview">
        <div class="template-header">
            <h2 class="template-title">Get Qualified Form Notification</h2>
            <div class="template-meta">Agent Qualification Application</div>
        </div>
        <div class="template-content">
            <iframe srcdoc="${templates.getQualified.html.replace(/"/g, '&quot;')}"></iframe>
        </div>
    </div>

    <div class="template-preview">
        <div class="template-header">
            <h2 class="template-title">Affiliate Form Notification</h2>
            <div class="template-meta">Service Provider Partnership Application</div>
        </div>
        <div class="template-content">
            <iframe srcdoc="${templates.affiliate.html.replace(/"/g, '&quot;')}"></iframe>
        </div>
    </div>
</body>
</html>`;
  }

  // CLI testing utility
  public static runCLITests(): void {
    console.log('🧪 RealTechee Notification Template Testing Suite\n');

    const results = this.testAllTemplates();

    // Print results
    Object.entries(results).forEach(([key, result]) => {
      if (key === 'summary') return;
      
      const test = result as any;
      console.log(`📧 ${test.templateType.toUpperCase()} Template:`);
      console.log(`   Email: ${test.email.validation.valid ? '✅' : '❌'} (${test.email.validation.errors.length} errors, ${test.email.validation.warnings.length} warnings)`);
      console.log(`   SMS:   ${test.sms.validation.valid ? '✅' : '❌'} (${test.sms.validation.errors.length} errors, ${test.sms.validation.warnings.length} warnings)`);
      
      if (test.email.validation.errors.length > 0) {
        console.log(`   🚨 Email Errors: ${test.email.validation.errors.join(', ')}`);
      }
      if (test.sms.validation.errors.length > 0) {
        console.log(`   🚨 SMS Errors: ${test.sms.validation.errors.join(', ')}`);
      }
      if (test.email.validation.warnings.length > 0) {
        console.log(`   ⚠️  Email Warnings: ${test.email.validation.warnings.join(', ')}`);
      }
      if (test.sms.validation.warnings.length > 0) {
        console.log(`   ⚠️  SMS Warnings: ${test.sms.validation.warnings.join(', ')}`);
      }
      console.log('');
    });

    // Print summary
    const { summary } = results;
    console.log('📊 Test Summary:');
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.passed} ✅`);
    console.log(`   Failed: ${summary.failed} ${summary.failed > 0 ? '❌' : ''}`);
    console.log(`   Warnings: ${summary.warnings} ${summary.warnings > 0 ? '⚠️' : ''}`);
    
    if (summary.failed === 0) {
      console.log('\n🎉 All templates passed validation!');
    } else {
      console.log('\n🔧 Some templates need attention before deployment.');
    }
  }
}

// Export for use in scripts
export default TemplateTester;

// If running this file directly
if (require.main === module) {
  TemplateTester.runCLITests();
}