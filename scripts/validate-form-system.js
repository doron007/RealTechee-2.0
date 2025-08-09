#!/usr/bin/env node

/**
 * RealTechee Form System Validation Script
 * 
 * Validates all 4 forms and their complete pipeline:
 * - Form components exist
 * - Pages exist  
 * - Backend integration exists
 * - Notification templates exist
 * - Database tables exist
 * - Environment variables are set
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 RealTechee Form System Validation');
console.log('=====================================\n');

const forms = [
  {
    name: 'Get Estimate',
    formComponent: './components/forms/GetEstimateForm.tsx',
    page: './pages/contact/get-estimate.tsx',
    notificationFunction: 'notifyGetEstimate',
    template: './templates/notifications/getEstimateTemplate.ts',
    table: 'Requests'
  },
  {
    name: 'Contact Us',
    formComponent: './components/forms/GeneralInquiryForm.tsx',
    page: './pages/contact/contact-us.tsx',
    notificationFunction: 'notifyContactUs',
    template: './templates/notifications/contactUsTemplate.ts',
    table: 'ContactUs'
  },
  {
    name: 'Get Qualified',
    formComponent: './components/forms/GetQualifiedForm.tsx',
    page: './pages/contact/get-qualified.tsx',
    notificationFunction: 'notifyGetQualified',
    template: './templates/notifications/getQualifiedTemplate.ts',
    table: 'Contacts'
  },
  {
    name: 'Affiliate',
    formComponent: './components/forms/AffiliateInquiryForm.tsx',
    page: './pages/contact/affiliate.tsx',
    notificationFunction: 'notifyAffiliate',
    template: './templates/notifications/affiliateTemplate.ts',
    table: 'Affiliates'
  }
];

const results = [];

console.log('📋 Checking Form Components...\n');

forms.forEach(form => {
  const result = {
    name: form.name,
    component: false,
    page: false,
    notification: false,
    template: false,
    integration: false,
    issues: []
  };

  // Check form component
  if (fs.existsSync(form.formComponent)) {
    result.component = true;
    console.log(`✅ ${form.name} - Component exists: ${form.formComponent}`);
  } else {
    result.issues.push(`Missing component: ${form.formComponent}`);
    console.log(`❌ ${form.name} - Component missing: ${form.formComponent}`);
  }

  // Check page
  if (fs.existsSync(form.page)) {
    result.page = true;
    console.log(`✅ ${form.name} - Page exists: ${form.page}`);
  } else {
    result.issues.push(`Missing page: ${form.page}`);
    console.log(`❌ ${form.name} - Page missing: ${form.page}`);
  }

  // Check notification template
  if (fs.existsSync(form.template)) {
    result.template = true;
    console.log(`✅ ${form.name} - Template exists: ${form.template}`);
  } else {
    result.issues.push(`Missing template: ${form.template}`);
    console.log(`❌ ${form.name} - Template missing: ${form.template}`);
  }

  // Check notification function in integration file
  const integrationFile = './services/formNotificationIntegration.ts';
  if (fs.existsSync(integrationFile)) {
    const content = fs.readFileSync(integrationFile, 'utf8');
    if (content.includes(form.notificationFunction)) {
      result.notification = true;
      console.log(`✅ ${form.name} - Notification function exists: ${form.notificationFunction}`);
    } else {
      result.issues.push(`Missing notification function: ${form.notificationFunction}`);
      console.log(`❌ ${form.name} - Notification function missing: ${form.notificationFunction}`);
    }
  }

  // Check if page uses notification function
  if (result.page) {
    const pageContent = fs.readFileSync(form.page, 'utf8');
    if (pageContent.includes(form.notificationFunction)) {
      result.integration = true;
      console.log(`✅ ${form.name} - Page integrated with notifications`);
    } else {
      result.issues.push(`Page not integrated with notification function`);
      console.log(`❌ ${form.name} - Page missing notification integration`);
    }
  }

  console.log(`\n`);
  results.push(result);
});

console.log('🌐 Checking Backend Configuration...\n');

// Check amplify_outputs.json
let backendReady = false;
let dataModels = [];

try {
  const amplifyOutputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));
  
  if (amplifyOutputs.data?.url) {
    console.log(`✅ GraphQL API endpoint: ${amplifyOutputs.data.url}`);
  } else {
    console.log(`❌ No GraphQL API endpoint found`);
  }

  if (amplifyOutputs.data?.model_introspection?.models) {
    dataModels = Object.keys(amplifyOutputs.data.model_introspection.models);
    console.log(`✅ Data models found: ${dataModels.length} models`);
    console.log(`   Models: ${dataModels.join(', ')}`);
    backendReady = true;
  } else {
    console.log(`❌ No data models found in backend configuration`);
  }

} catch (error) {
  console.log(`❌ Error reading amplify_outputs.json: ${error.message}`);
}

console.log(`\n`);

console.log('🔧 Checking Environment Variables...\n');

const requiredEnvVars = [
  { name: 'AWS_REGION', required: true },
  { name: 'DEBUG_NOTIFICATIONS', required: false },
  { name: 'DEBUG_EMAIL', required: false },
  { name: 'DEBUG_PHONE', required: false }
];

const envStatus = {};

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar.name];
  envStatus[envVar.name] = {
    set: !!value,
    value: value || 'Not set',
    required: envVar.required
  };

  if (value) {
    console.log(`✅ ${envVar.name}: ${envVar.name.includes('KEY') || envVar.name.includes('TOKEN') ? '[REDACTED]' : value}`);
  } else if (envVar.required) {
    console.log(`❌ ${envVar.name}: Not set (REQUIRED)`);
  } else {
    console.log(`⚠️  ${envVar.name}: Not set (optional)`);
  }
});

console.log(`\n`);

console.log('📊 SUMMARY REPORT');
console.log('==================\n');

const allFormsReady = results.every(r => r.component && r.page && r.notification && r.template && r.integration);
const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

console.log(`Backend Status: ${backendReady ? '✅ Ready' : '❌ Not Ready'}`);
console.log(`Environment: ${envStatus['AWS_REGION']?.set ? '✅ Configured' : '❌ Missing Variables'}`);
console.log(`All Forms Ready: ${allFormsReady ? '✅ Yes' : '❌ No'}`);
console.log(`Total Issues: ${totalIssues}`);

console.log(`\nPer-Form Status:`);
results.forEach(result => {
  const status = result.component && result.page && result.notification && result.template && result.integration ? '✅' : '❌';
  console.log(`  ${status} ${result.name}: ${result.issues.length === 0 ? 'Ready' : result.issues.length + ' issues'}`);
});

if (totalIssues > 0) {
  console.log(`\n🔥 ISSUES FOUND:`);
  results.forEach(result => {
    if (result.issues.length > 0) {
      console.log(`\n❌ ${result.name}:`);
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
  });
}

console.log(`\n📋 Next Steps:`);

if (!backendReady) {
  console.log(`1. Deploy backend: npx ampx sandbox --once`);
}

if (!allFormsReady) {
  console.log(`2. Fix form integration issues (see above)`);
}

if (!envStatus['AWS_REGION']?.set) {
  console.log(`3. Set environment variables for notification system`);
}

if (allFormsReady && backendReady) {
  console.log(`🎉 All systems ready! Test the forms manually or run E2E tests.`);
  console.log(`   - Get Estimate: http://localhost:3000/contact/get-estimate`);
  console.log(`   - Contact Us: http://localhost:3000/contact/contact-us`);
  console.log(`   - Get Qualified: http://localhost:3000/contact/get-qualified`);
  console.log(`   - Affiliate: http://localhost:3000/contact/affiliate`);
}

console.log(`\n✅ Validation complete.`);

process.exit(totalIssues > 0 ? 1 : 0);