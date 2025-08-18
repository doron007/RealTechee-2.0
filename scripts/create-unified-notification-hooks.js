// Script to create notification hooks for the new unified template system
// Each hook targets a specific channel (email or sms) for each form type

const sampleHooks = [
  // Contact Us Form Hooks
  {
    id: 'hook_contact_us_email',
    signalType: 'CONTACT_US_FORM_SUBMITTED',
    notificationTemplateId: 'template_contact_us_unified',
    channel: 'email', // Specifies to use email content from unified template
    enabled: true,
    priority: 'medium',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 0,
    maxRetries: 3,
    conditions: null, // No conditions = always process
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    id: 'hook_contact_us_sms',
    signalType: 'CONTACT_US_FORM_SUBMITTED',
    notificationTemplateId: 'template_contact_us_unified',
    channel: 'sms', // Specifies to use SMS content from unified template
    enabled: true,
    priority: 'high', // SMS for urgent notifications
    recipientEmails: '["info@realtechee.com"]', // Email for recipient lookup
    recipientRoles: '["AE"]',
    deliveryDelay: 0,
    maxRetries: 3,
    conditions: '[]', // No conditions = always process
    createdBy: 'system',
    lastModifiedBy: 'system'
  },

  // Get Estimate Form Hooks
  {
    id: 'hook_get_estimate_email',
    signalType: 'GET_ESTIMATE_FORM_SUBMITTED',
    notificationTemplateId: 'template_get_estimate_unified',
    channel: 'email',
    enabled: true,
    priority: 'high', // Estimate requests are high priority
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 0,
    maxRetries: 3,
    conditions: null,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    id: 'hook_get_estimate_sms',
    signalType: 'GET_ESTIMATE_FORM_SUBMITTED',
    notificationTemplateId: 'template_get_estimate_unified',
    channel: 'sms',
    enabled: true,
    priority: 'high',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 2, // 2-minute delay for SMS to avoid spam
    maxRetries: 3,
    conditions: null,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },

  // Get Qualified Form Hooks
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
    maxRetries: 3,
    conditions: null,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    id: 'hook_get_qualified_sms',
    signalType: 'GET_QUALIFIED_FORM_SUBMITTED',
    notificationTemplateId: 'template_get_qualified_unified',
    channel: 'sms',
    enabled: false, // Disable SMS for agent qualification by default
    priority: 'medium',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 5,
    maxRetries: 3,
    conditions: null,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },

  // Affiliate Form Hooks
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
    maxRetries: 3,
    conditions: null,
    createdBy: 'system',
    lastModifiedBy: 'system'
  },
  {
    id: 'hook_affiliate_sms',
    signalType: 'AFFILIATE_FORM_SUBMITTED',
    notificationTemplateId: 'template_affiliate_unified',
    channel: 'sms',
    enabled: false, // Disable SMS for affiliate applications by default
    priority: 'low',
    recipientEmails: '["info@realtechee.com"]',
    recipientRoles: '["AE"]',
    deliveryDelay: 10,
    maxRetries: 3,
    conditions: null,
    createdBy: 'system',
    lastModifiedBy: 'system'
  }
];

// GraphQL mutation to create hooks
const createHookMutation = `
  mutation CreateSignalNotificationHook($input: CreateSignalNotificationHookInput!) {
    createSignalNotificationHook(input: $input) {
      id
      signalType
      notificationTemplateId
      channel
      enabled
      priority
    }
  }
`;

// Function to create all hooks via GraphQL
async function createNotificationHooks() {
  console.log('📋 Creating unified notification hooks...');
  
  for (const hook of sampleHooks) {
    try {
      console.log(`Creating hook: ${hook.id} (${hook.signalType} -> ${hook.channel})`);
      
      // In browser console, this would be:
      // const result = await client.graphql({
      //   query: createHookMutation,
      //   variables: { input: hook }
      // });
      
      console.log(`✅ Hook ${hook.id} would be created with:`, {
        signalType: hook.signalType,
        channel: hook.channel,
        templateId: hook.notificationTemplateId,
        enabled: hook.enabled,
        priority: hook.priority,
        deliveryDelay: hook.deliveryDelay
      });
      
    } catch (error) {
      console.error(`❌ Failed to create hook ${hook.id}:`, error);
    }
  }
  
  console.log(`🎯 Unified notification hook creation plan complete!`);
  console.log(`📊 Summary:`);
  console.log(`- Contact Us: 2 hooks (email + sms)`);
  console.log(`- Get Estimate: 2 hooks (email + sms)`);
  console.log(`- Get Qualified: 2 hooks (email only, sms disabled)`);
  console.log(`- Affiliate: 2 hooks (email only, sms disabled)`);
  console.log(`- Total: 8 hooks for comprehensive notification coverage`);
}

// Execute the creation plan
createNotificationHooks();

// Export for manual execution
console.log('📝 To create these hooks manually in GraphQL console:');
console.log('1. Copy the createHookMutation above');
console.log('2. Use each hook object as input variable');
console.log('3. Execute mutation for each hook');

module.exports = { sampleHooks, createHookMutation };