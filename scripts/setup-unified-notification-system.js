// Complete setup script for unified notification system
// Creates both templates and hooks for all 4 forms with new schema

// ==============================================================================
// UNIFIED TEMPLATES (One template per form with both email and SMS content)
// ==============================================================================

const unifiedTemplates = [
  {
    id: 'template_contact_us_unified',
    name: 'Contact Us Form Unified Template',
    formType: 'contact-us',
    emailSubject: 'New Contact Us Inquiry from {{customerName}}',
    emailContentHtml: `<!DOCTYPE html>
<html>
<head>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:20px;background-color:#f9f9f9}
.container{max-width:600px;margin:0 auto;background-color:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);overflow:hidden}
.header{background-color:#1f2937;color:white;padding:20px;text-align:center}
.header h1{margin:0;font-size:24px}
.content{padding:30px}
.field{margin-bottom:20px}
.label{font-weight:bold;color:#374151;margin-bottom:5px}
.value{background-color:#f3f4f6;padding:10px;border-radius:4px;border-left:4px solid #3b82f6}
.footer{background-color:#f9fafb;padding:20px;text-align:center;font-size:14px;color:#6b7280}
</style>
</head>
<body>
<div class='container'>
<div class='header'><h1>🏠 New Contact Us Inquiry</h1></div>
<div class='content'>
<div class='field'><div class='label'>Customer Name:</div><div class='value'>{{customerName}}</div></div>
<div class='field'><div class='label'>Email:</div><div class='value'>{{customerEmail}}</div></div>
<div class='field'><div class='label'>Phone:</div><div class='value'>{{formatPhone customerPhone}}</div></div>
<div class='field'><div class='label'>Subject:</div><div class='value'>{{subject}}</div></div>
<div class='field'><div class='label'>Message:</div><div class='value'>{{message}}</div></div>
<div class='field'><div class='label'>Dashboard Link:</div><div class='value'><a href='{{dashboardUrl}}' style='color:#3b82f6;text-decoration:none;'>View in Admin Dashboard</a></div></div>
</div>
<div class='footer'>RealTechee Professional Services<br>Generated at {{formatDate submissionTimestamp}}</div>
</div>
</body>
</html>`,
    smsContent: 'New Contact: {{customerName}} ({{customerEmail}}) - {{subject}}. View: {{dashboardUrl}}',
    variables: '["customerName","customerEmail","customerPhone","subject","message","dashboardUrl","submissionTimestamp"]',
    previewData: '{"customerName":"John Smith","customerEmail":"john@example.com","customerPhone":"555-123-4567","subject":"Need help with real estate","message":"I am looking for assistance with buying a home","dashboardUrl":"https://admin.example.com/requests/123","submissionTimestamp":"2025-01-15T10:30:00Z"}',
    isActive: true,
    version: '1.0'
  },
  
  {
    id: 'template_get_estimate_unified',
    name: 'Get Estimate Form Unified Template',
    formType: 'get-estimate',
    emailSubject: 'New Estimate Request from {{agentFullName}} - {{propertyAddress}}',
    emailContentHtml: `<!DOCTYPE html>
<html>
<head>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:20px;background-color:#f9f9f9}
.container{max-width:600px;margin:0 auto;background-color:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);overflow:hidden}
.header{background-color:#059669;color:white;padding:20px;text-align:center}
.header h1{margin:0;font-size:24px}
.content{padding:30px}
.field{margin-bottom:20px}
.label{font-weight:bold;color:#374151;margin-bottom:5px}
.value{background-color:#f3f4f6;padding:10px;border-radius:4px;border-left:4px solid #059669}
.urgency-high{border-left-color:#dc2626;background-color:#fef2f2}
.urgency-medium{border-left-color:#d97706;background-color:#fffbeb}
.urgency-low{border-left-color:#16a34a;background-color:#f0fdf4}
.footer{background-color:#f9fafb;padding:20px;text-align:center;font-size:14px;color:#6b7280}
.thumb{display:inline-block;margin:5px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;width:120px;text-align:center;text-decoration:none}
.thumb img{width:100%;height:80px;object-fit:cover}
.thumb__cap{padding:5px;background:#f9fafb;font-size:12px;color:#6b7280}
</style>
</head>
<body>
<div class='container'>
<div class='header'><h1>📋 New Estimate Request</h1></div>
<div class='content'>
<div class='field'><div class='label'>Agent Name:</div><div class='value'>{{agentFullName}}</div></div>
<div class='field'><div class='label'>Agent Email:</div><div class='value'>{{agentEmail}}</div></div>
<div class='field'><div class='label'>Agent Brokerage:</div><div class='value'>{{agentBrokerage}}</div></div>
<div class='field'><div class='label'>Property Address:</div><div class='value urgency-{{default urgency "medium"}}'>{{propertyAddress}}</div></div>
<div class='field'><div class='label'>Project Type:</div><div class='value'>{{projectType}}</div></div>
<div class='field'><div class='label'>Project Message:</div><div class='value'>{{projectMessage}}</div></div>
{{#if uploadedMedia}}
<div class='field'><div class='label'>Uploaded Media:</div><div class='value'>{{{fileLinks uploadedMedia "images"}}}</div></div>
{{/if}}
{{#if uplodedDocuments}}
<div class='field'><div class='label'>Documents:</div><div class='value'>{{{fileLinks uplodedDocuments "documents"}}}</div></div>
{{/if}}
<div class='field'><div class='label'>Dashboard Link:</div><div class='value'><a href='{{dashboardUrl}}' style='color:#059669;text-decoration:none;'>View Request Details</a></div></div>
</div>
<div class='footer'>RealTechee Professional Services<br>Priority: {{getUrgencyLabel urgency}} | Generated at {{formatDate submissionTimestamp}}</div>
</div>
</body>
</html>`,
    smsContent: 'NEW ESTIMATE: {{agentFullName}} ({{agentBrokerage}}) - {{propertyStreetAddress}}, {{propertyCity}} [{{default urgency "MEDIUM"}} priority]. View: {{dashboardUrl}}',
    variables: '["agentFullName","agentEmail","agentBrokerage","propertyAddress","propertyStreetAddress","propertyCity","projectType","projectMessage","urgency","dashboardUrl","submissionTimestamp","uploadedMedia","uplodedDocuments"]',
    previewData: '{"agentFullName":"Sarah Johnson","agentEmail":"sarah@realty.com","agentBrokerage":"Premier Realty","propertyAddress":"123 Main St, Houston, TX 77001","propertyStreetAddress":"123 Main St","propertyCity":"Houston","projectType":"Kitchen Remodel","projectMessage":"Looking for estimate on complete kitchen renovation","urgency":"high","dashboardUrl":"https://admin.example.com/requests/456","submissionTimestamp":"2025-01-15T14:20:00Z","uploadedMedia":"[\\"https://example.com/image1.jpg\\",\\"https://example.com/image2.jpg\\"]","uplodedDocuments":"[\\"https://example.com/plans.pdf\\"]"}',
    isActive: true,
    version: '1.0'
  },
  
  {
    id: 'template_get_qualified_unified',
    name: 'Get Qualified Form Unified Template',
    formType: 'get-qualified',
    emailSubject: 'New Agent Qualification Request from {{agentFullName}}',
    emailContentHtml: `<!DOCTYPE html>
<html>
<head>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:20px;background-color:#f9f9f9}
.container{max-width:600px;margin:0 auto;background-color:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);overflow:hidden}
.header{background-color:#7c3aed;color:white;padding:20px;text-align:center}
.header h1{margin:0;font-size:24px}
.content{padding:30px}
.field{margin-bottom:20px}
.label{font-weight:bold;color:#374151;margin-bottom:5px}
.value{background-color:#f3f4f6;padding:10px;border-radius:4px;border-left:4px solid #7c3aed}
.footer{background-color:#f9fafb;padding:20px;text-align:center;font-size:14px;color:#6b7280}
</style>
</head>
<body>
<div class='container'>
<div class='header'><h1>🎯 New Agent Qualification</h1></div>
<div class='content'>
<div class='field'><div class='label'>Agent Name:</div><div class='value'>{{agentFullName}}</div></div>
<div class='field'><div class='label'>Email:</div><div class='value'>{{agentEmail}}</div></div>
<div class='field'><div class='label'>Phone:</div><div class='value'>{{formatPhone agentPhone}}</div></div>
<div class='field'><div class='label'>License Number:</div><div class='value'>{{agentLicense}}</div></div>
<div class='field'><div class='label'>Brokerage:</div><div class='value'>{{agentBrokerage}}</div></div>
<div class='field'><div class='label'>Experience:</div><div class='value'>{{agentExperience}}</div></div>
<div class='field'><div class='label'>Specialties:</div><div class='value'>{{agentSpecialties}}</div></div>
<div class='field'><div class='label'>Markets:</div><div class='value'>{{agentMarkets}}</div></div>
<div class='field'><div class='label'>Goals:</div><div class='value'>{{agentGoals}}</div></div>
<div class='field'><div class='label'>Dashboard Link:</div><div class='value'><a href='{{dashboardUrl}}' style='color:#7c3aed;text-decoration:none;'>Review Qualification</a></div></div>
</div>
<div class='footer'>RealTechee Professional Services<br>Agent Qualification | Generated at {{formatDate submissionTimestamp}}</div>
</div>
</body>
</html>`,
    smsContent: 'AGENT QUALIFICATION: {{agentFullName}} ({{agentBrokerage}}) - {{agentExperience}} experience. Review: {{dashboardUrl}}',
    variables: '["agentFullName","agentEmail","agentPhone","agentLicense","agentBrokerage","agentExperience","agentSpecialties","agentMarkets","agentGoals","dashboardUrl","submissionTimestamp"]',
    previewData: '{"agentFullName":"Michael Davis","agentEmail":"mike@realty.com","agentPhone":"555-987-6543","agentLicense":"TX12345678","agentBrokerage":"Elite Properties","agentExperience":"5+ years","agentSpecialties":"Luxury homes, First-time buyers","agentMarkets":"Houston Metro, Woodlands","agentGoals":"Expand referral network","dashboardUrl":"https://admin.example.com/requests/789","submissionTimestamp":"2025-01-15T16:45:00Z"}',
    isActive: true,
    version: '1.0'
  },
  
  {
    id: 'template_affiliate_unified',
    name: 'Affiliate Form Unified Template',
    formType: 'affiliate',
    emailSubject: 'New Affiliate Application from {{companyName}}',
    emailContentHtml: `<!DOCTYPE html>
<html>
<head>
<style>
body{font-family:Arial,sans-serif;margin:0;padding:20px;background-color:#f9f9f9}
.container{max-width:600px;margin:0 auto;background-color:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);overflow:hidden}
.header{background-color:#dc2626;color:white;padding:20px;text-align:center}
.header h1{margin:0;font-size:24px}
.content{padding:30px}
.field{margin-bottom:20px}
.label{font-weight:bold;color:#374151;margin-bottom:5px}
.value{background-color:#f3f4f6;padding:10px;border-radius:4px;border-left:4px solid #dc2626}
.footer{background-color:#f9fafb;padding:20px;text-align:center;font-size:14px;color:#6b7280}
</style>
</head>
<body>
<div class='container'>
<div class='header'><h1>🤝 New Affiliate Application</h1></div>
<div class='content'>
<div class='field'><div class='label'>Company Name:</div><div class='value'>{{companyName}}</div></div>
<div class='field'><div class='label'>Contact Name:</div><div class='value'>{{customerName}}</div></div>
<div class='field'><div class='label'>Email:</div><div class='value'>{{customerEmail}}</div></div>
<div class='field'><div class='label'>Phone:</div><div class='value'>{{formatPhone customerPhone}}</div></div>
<div class='field'><div class='label'>Service Type:</div><div class='value'>{{serviceType}}</div></div>
<div class='field'><div class='label'>Business License:</div><div class='value'>{{businessLicense}}</div></div>
<div class='field'><div class='label'>Number of Employees:</div><div class='value'>{{numberOfEmployees}}</div></div>
<div class='field'><div class='label'>Workers Compensation:</div><div class='value'>{{workersCompensation}}</div></div>
<div class='field'><div class='label'>Insurance:</div><div class='value'>{{insurance}}</div></div>
<div class='field'><div class='label'>Dashboard Link:</div><div class='value'><a href='{{dashboardUrl}}' style='color:#dc2626;text-decoration:none;'>Review Application</a></div></div>
</div>
<div class='footer'>RealTechee Professional Services<br>Affiliate Application | Generated at {{formatDate submissionTimestamp}}</div>
</div>
</body>
</html>`,
    smsContent: 'AFFILIATE APP: {{companyName}} ({{customerName}}) - {{serviceType}}. Review: {{dashboardUrl}}',
    variables: '["companyName","customerName","customerEmail","customerPhone","serviceType","businessLicense","numberOfEmployees","workersCompensation","insurance","dashboardUrl","submissionTimestamp"]',
    previewData: '{"companyName":"Pro Construction LLC","customerName":"Robert Wilson","customerEmail":"robert@proconstruction.com","customerPhone":"555-444-3333","serviceType":"General Contracting","businessLicense":"TX-GC-987654","numberOfEmployees":"25-50","workersCompensation":"Yes","insurance":"$2M General Liability","dashboardUrl":"https://admin.example.com/requests/101","submissionTimestamp":"2025-01-15T09:15:00Z"}',
    isActive: true,
    version: '1.0'
  }
];

// ==============================================================================
// NOTIFICATION HOOKS (Individual channel hooks for each form)
// ==============================================================================

const notificationHooks = [
  // Contact Us - Email Hook
  {
    id: 'hook_contact_us_email',
    signalType: 'CONTACT_US_FORM_SUBMITTED',
    notificationTemplateId: 'template_contact_us_unified',
    channel: 'email',
    enabled: true,
    priority: 'medium',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 0,
    maxRetries: 3
  },
  
  // Contact Us - SMS Hook  
  {
    id: 'hook_contact_us_sms',
    signalType: 'CONTACT_US_FORM_SUBMITTED',
    notificationTemplateId: 'template_contact_us_unified',
    channel: 'sms',
    enabled: true,
    priority: 'high',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 0,
    maxRetries: 3
  },
  
  // Get Estimate - Email Hook
  {
    id: 'hook_get_estimate_email',
    signalType: 'GET_ESTIMATE_FORM_SUBMITTED',
    notificationTemplateId: 'template_get_estimate_unified',
    channel: 'email',
    enabled: true,
    priority: 'high',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 0,
    maxRetries: 3
  },
  
  // Get Estimate - SMS Hook
  {
    id: 'hook_get_estimate_sms',
    signalType: 'GET_ESTIMATE_FORM_SUBMITTED',
    notificationTemplateId: 'template_get_estimate_unified',
    channel: 'sms',
    enabled: true,
    priority: 'high',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 2,
    maxRetries: 3
  },
  
  // Get Qualified - Email Hook
  {
    id: 'hook_get_qualified_email',
    signalType: 'GET_QUALIFIED_FORM_SUBMITTED',
    notificationTemplateId: 'template_get_qualified_unified',
    channel: 'email',
    enabled: true,
    priority: 'medium',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 0,
    maxRetries: 3
  },
  
  // Get Qualified - SMS Hook (disabled by default)
  {
    id: 'hook_get_qualified_sms',
    signalType: 'GET_QUALIFIED_FORM_SUBMITTED',
    notificationTemplateId: 'template_get_qualified_unified',
    channel: 'sms',
    enabled: false,
    priority: 'medium',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 5,
    maxRetries: 3
  },
  
  // Affiliate - Email Hook
  {
    id: 'hook_affiliate_email',
    signalType: 'AFFILIATE_FORM_SUBMITTED',
    notificationTemplateId: 'template_affiliate_unified',
    channel: 'email',
    enabled: true,
    priority: 'medium',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 0,
    maxRetries: 3
  },
  
  // Affiliate - SMS Hook (disabled by default)
  {
    id: 'hook_affiliate_sms',
    signalType: 'AFFILIATE_FORM_SUBMITTED',
    notificationTemplateId: 'template_affiliate_unified',
    channel: 'sms',
    enabled: false,
    priority: 'low',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 10,
    maxRetries: 3
  }
];

// ==============================================================================
// SETUP EXECUTION FUNCTIONS
// ==============================================================================

console.log('🚀 Unified Notification System Setup');
console.log('=====================================');

console.log('📋 TEMPLATES:');
unifiedTemplates.forEach(template => {
  console.log(`✅ ${template.name} (${template.formType})`);
  console.log(`   - Email Subject: ${template.emailSubject}`);
  console.log(`   - Variables: ${template.variables.length} total`);
  console.log(`   - SMS Content: ${template.smsContent.substring(0, 50)}...`);
});

console.log('\\n🔗 NOTIFICATION HOOKS:');
notificationHooks.forEach(hook => {
  console.log(`${hook.enabled ? '✅' : '⏸️'} ${hook.id}`);
  console.log(`   - Signal: ${hook.signalType}`);
  console.log(`   - Channel: ${hook.channel.toUpperCase()}`);
  console.log(`   - Priority: ${hook.priority.toUpperCase()}`);
  console.log(`   - Delay: ${hook.deliveryDelay} minutes`);
});

console.log('\\n📊 SUMMARY:');
console.log(`Templates: ${unifiedTemplates.length} unified templates`);
console.log(`Hooks: ${notificationHooks.length} total hooks`);
console.log(`- Enabled: ${notificationHooks.filter(h => h.enabled).length}`);
console.log(`- Email hooks: ${notificationHooks.filter(h => h.channel === 'email').length}`);
console.log(`- SMS hooks: ${notificationHooks.filter(h => h.channel === 'sms').length}`);

console.log('\\n🎯 NEXT STEPS:');
console.log('1. Create templates via GraphQL mutations');
console.log('2. Create notification hooks via GraphQL mutations');
console.log('3. Test signal emission with new hooks');
console.log('4. Verify email and SMS delivery');

// Export for use in other scripts
module.exports = { unifiedTemplates, notificationHooks };