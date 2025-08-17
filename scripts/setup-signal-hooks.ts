/**
 * Setup Script: Signal-Notification Hooks
 * 
 * Creates the initial signal-to-notification mappings for the four forms
 * using the existing templates in the NotificationTemplate table.
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

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

const client = generateClient<Schema>({ authMode: 'apiKey' });

interface HookConfig {
  signalType: string;
  templateName: string;
  priority: 'low' | 'medium' | 'high';
  channels: string[];
  recipientEmails: string[];
}

// Hook configurations for the four forms
const HOOK_CONFIGS: HookConfig[] = [
  {
    signalType: 'form_contact_us_submission',
    templateName: 'contact-us-email-template-001',
    priority: 'high',
    channels: ['EMAIL', 'SMS'], 
    recipientEmails: ['info@realtechee.com']
  },
  {
    signalType: 'form_get_qualified_submission',
    templateName: 'get-qualified-email-template-001',
    priority: 'high',
    channels: ['EMAIL', 'SMS'],
    recipientEmails: ['info@realtechee.com']
  },
  {
    signalType: 'form_affiliate_submission',
    templateName: 'affiliate-email-template-001',
    priority: 'medium',
    channels: ['EMAIL', 'SMS'],
    recipientEmails: ['info@realtechee.com']
  },
  {
    signalType: 'form_get_estimate_submission',
    templateName: 'get-estimate-email-template-001',
    priority: 'high',
    channels: ['EMAIL', 'SMS'],
    recipientEmails: ['info@realtechee.com']
  }
];

async function setupSignalHooks() {
  console.log('🚀 Setting up signal-notification hooks...');

  try {
    // Get all existing templates
    const templatesResult = await client.models.NotificationTemplate.list();
    const templates = templatesResult.data || [];
    
    console.log(`📋 Found ${templates.length} notification templates`);

    for (const hookConfig of HOOK_CONFIGS) {
      console.log(`\n🔗 Setting up hook for: ${hookConfig.signalType}`);

      // Find the template for this hook
      const template = templates.find(t => t.name === hookConfig.templateName);
      
      if (!template) {
        console.warn(`⚠️ Template not found: ${hookConfig.templateName}`);
        continue;
      }

      console.log(`✅ Found template: ${template.name} (ID: ${template.id})`);

      // Check if hook already exists
      const existingHooksResult = await client.models.SignalNotificationHooks.list({
        filter: {
          signalType: { eq: hookConfig.signalType },
          notificationTemplateId: { eq: template.id }
        }
      });

      if (existingHooksResult.data && existingHooksResult.data.length > 0) {
        console.log(`ℹ️ Hook already exists for ${hookConfig.signalType}`);
        continue;
      }

      // Create new hook
      const hookResult = await client.models.SignalNotificationHooks.create({
        signalType: hookConfig.signalType,
        notificationTemplateId: template.id,
        enabled: true,
        priority: hookConfig.priority,
        channels: JSON.stringify(hookConfig.channels),
        recipientEmails: JSON.stringify(hookConfig.recipientEmails),
        recipientRoles: JSON.stringify(['AE']), // Default to AE role
        recipientDynamic: JSON.stringify(['customerEmail']) // Also send to customer
      });

      if (hookResult.data) {
        console.log(`✅ Created hook: ${hookResult.data.id}`);
      } else {
        console.error(`❌ Failed to create hook for ${hookConfig.signalType}`);
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