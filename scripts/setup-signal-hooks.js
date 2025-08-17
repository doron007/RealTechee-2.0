/**
 * Setup Script: Signal-Notification Hooks (JavaScript version)
 * 
 * Creates the initial signal-to-notification mappings for the four forms
 * using the existing templates in the NotificationTemplate table.
 */

const { generateClient } = require('aws-amplify/data');
const { Amplify } = require('aws-amplify');
const outputs = require('../amplify_outputs.json');

// Configure Amplify
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: outputs.data.url,
      region: outputs.data.aws_region,
      defaultAuthMode: 'apiKey',
      apiKey: outputs.data.api_key
    }
  }
});

const client = generateClient({ authMode: 'apiKey' });

// Hook configurations for the four forms (using the correct template IDs)
const HOOK_CONFIGS = [
  {
    signalType: 'form_contact_us_submission',
    templateIds: ['contact-us-email-template-001', 'contact-us-sms-template-001'],
    priority: 'high',
    recipientEmails: ['info@realtechee.com']
  },
  {
    signalType: 'form_get_qualified_submission', 
    templateIds: ['get-qualified-email-template-001', 'get-qualified-sms-template-001'],
    priority: 'high',
    recipientEmails: ['info@realtechee.com']
  },
  {
    signalType: 'form_affiliate_submission',
    templateIds: ['affiliate-email-template-001', 'affiliate-sms-template-001'],
    priority: 'medium',
    recipientEmails: ['info@realtechee.com']
  },
  {
    signalType: 'form_get_estimate_submission',
    templateIds: ['get-estimate-template-001', 'get-estimate-sms-template-001'],
    priority: 'high',
    recipientEmails: ['info@realtechee.com']
  }
];

async function setupSignalHooks() {
  console.log('🚀 Setting up signal-notification hooks...');

  try {
    // Get all existing templates using GraphQL directly
    const listTemplatesQuery = `
      query ListNotificationTemplates {
        listNotificationTemplates {
          items {
            id
            name
            subject
            contentHtml
            contentText
            channel
          }
        }
      }
    `;
    
    const templatesResult = await client.graphql({ 
      query: listTemplatesQuery
    });
    const templates = templatesResult.data?.listNotificationTemplates?.items || [];
    
    console.log(`📋 Found ${templates.length} notification templates`);

    for (const hookConfig of HOOK_CONFIGS) {
      console.log(`\n🔗 Setting up hooks for: ${hookConfig.signalType}`);

      // Process each template for this signal type
      for (const templateId of hookConfig.templateIds) {
        // Find the template by ID
        const template = templates.find(t => t.id === templateId);
        
        if (!template) {
          console.warn(`⚠️ Template not found: ${templateId}`);
          continue;
        }

        console.log(`✅ Found template: ${template.name} (${template.channel})`);

        // Check if hook already exists using GraphQL
        const listHooksQuery = `
          query ListSignalNotificationHooks($filter: ModelSignalNotificationHooksFilterInput) {
            listSignalNotificationHooks(filter: $filter) {
              items {
                id
                signalType
                notificationTemplateId
              }
            }
          }
        `;
        
        const existingHooksResult = await client.graphql({
          query: listHooksQuery,
          variables: {
            filter: {
              signalType: { eq: hookConfig.signalType },
              notificationTemplateId: { eq: template.id }
            }
          }
        });

        if (existingHooksResult.data?.listSignalNotificationHooks?.items?.length > 0) {
          console.log(`ℹ️ Hook already exists for ${hookConfig.signalType} → ${template.name}`);
          continue;
        }

        // Create new hook using GraphQL
        const createHookMutation = `
          mutation CreateSignalNotificationHooks($input: CreateSignalNotificationHooksInput!) {
            createSignalNotificationHooks(input: $input) {
              id
              signalType
              notificationTemplateId
              enabled
              priority
            }
          }
        `;
        
        const hookResult = await client.graphql({
          query: createHookMutation,
          variables: {
            input: {
              signalType: hookConfig.signalType,
              notificationTemplateId: template.id,
              enabled: true,
              priority: hookConfig.priority,
              channels: JSON.stringify([template.channel]), // Use template's channel
              recipientEmails: JSON.stringify(hookConfig.recipientEmails),
              recipientRoles: JSON.stringify(['AE']),
              recipientDynamic: JSON.stringify(['customerEmail'])
            }
          }
        });

        if (hookResult.data?.createSignalNotificationHooks) {
          console.log(`✅ Created hook: ${hookResult.data.createSignalNotificationHooks.id}`);
        } else {
          console.error(`❌ Failed to create hook for ${hookConfig.signalType} → ${template.name}`);
        }
      }
    }

    console.log('\n🎉 Signal-notification hooks setup completed!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupSignalHooks().then(() => {
  console.log('Setup script completed');
  process.exit(0);
}).catch(error => {
  console.error('Setup script failed:', error);
  process.exit(1);
});