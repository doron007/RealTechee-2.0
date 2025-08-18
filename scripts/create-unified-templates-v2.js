#!/usr/bin/env node

/**
 * Script to create unified notification templates and hooks using file-based approach
 * This avoids command line JSON escaping issues
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import the template and hook data
const { unifiedTemplates, notificationHooks } = require('./setup-unified-notification-system.js');

console.log('🚀 Creating Unified Notification Templates and Hooks (v2)');
console.log('========================================================');

// Function to create template using JSON file
async function createTemplate(template) {
  const tableName = `NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE`;
  
  // Prepare the DynamoDB item
  const item = {
    id: { S: template.id },
    name: { S: template.name },
    formType: { S: template.formType },
    emailSubject: { S: template.emailSubject },
    emailContentHtml: { S: template.emailContentHtml },
    smsContent: { S: template.smsContent },
    variables: { S: template.variables },
    previewData: { S: template.previewData },
    isActive: { BOOL: template.isActive },
    version: { S: template.version },
    createdAt: { S: new Date().toISOString() },
    updatedAt: { S: new Date().toISOString() }
  };

  // Write item to temporary file
  const tempFile = `/tmp/template_${template.id}.json`;
  fs.writeFileSync(tempFile, JSON.stringify(item));

  const command = `aws dynamodb put-item --table-name "${tableName}" --item file://${tempFile} --region us-west-1`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (error) {
        console.error(`❌ Error creating template ${template.id}:`, error.message);
        reject(error);
      } else {
        console.log(`✅ Created template: ${template.id}`);
        resolve(stdout);
      }
    });
  });
}

// Function to create notification hooks
async function createHook(hook) {
  const tableName = `SignalNotificationHooks-fvn7t5hbobaxjklhrqzdl4ac34-NONE`;
  
  // Prepare the DynamoDB item
  const item = {
    id: { S: hook.id },
    signalType: { S: hook.signalType },
    notificationTemplateId: { S: hook.notificationTemplateId },
    channel: { S: hook.channel },
    enabled: { BOOL: hook.enabled },
    priority: { S: hook.priority },
    recipientEmails: { S: hook.recipientEmails },
    recipientRoles: { S: hook.recipientRoles },
    deliveryDelay: { N: hook.deliveryDelay.toString() },
    maxRetries: { N: hook.maxRetries.toString() },
    createdAt: { S: new Date().toISOString() },
    updatedAt: { S: new Date().toISOString() }
  };

  // Write item to temporary file
  const tempFile = `/tmp/hook_${hook.id}.json`;
  fs.writeFileSync(tempFile, JSON.stringify(item));

  const command = `aws dynamodb put-item --table-name "${tableName}" --item file://${tempFile} --region us-west-1`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (error) {
        console.error(`❌ Error creating hook ${hook.id}:`, error.message);
        reject(error);
      } else {
        console.log(`✅ Created hook: ${hook.id}`);
        resolve(stdout);
      }
    });
  });
}

// Main execution function
async function main() {
  try {
    console.log('\n📋 Creating Unified Templates...');
    console.log(`Total templates to create: ${unifiedTemplates.length}`);
    
    // Create templates sequentially to avoid rate limiting
    for (const template of unifiedTemplates) {
      await createTemplate(template);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🔗 Creating Notification Hooks...');
    console.log(`Total hooks to create: ${notificationHooks.length}`);
    
    // Create hooks sequentially
    for (const hook of notificationHooks) {
      await createHook(hook);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 SUCCESS! All templates and hooks created successfully!');
    console.log('\n📊 Summary:');
    console.log(`✅ Templates created: ${unifiedTemplates.length}`);
    console.log(`✅ Hooks created: ${notificationHooks.length}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Verify creation in the admin interface');
    console.log('2. Test signal emission with new unified system');
    console.log('3. Validate email and SMS delivery');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Execute the script
main();