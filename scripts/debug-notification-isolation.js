// Isolated Notification System Debugging
const { execSync } = require('child_process');

console.log('🔍 Notification System Isolation Debug');
console.log('=' * 50);

async function debugNotificationFlow() {
  
  // Step 1: Verify template exists
  console.log('\n📋 STEP 1: Verifying Templates Exist');
  console.log('-' * 40);
  
  try {
    const templateQuery = `aws dynamodb get-item --table-name "NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --key '{"id": {"S": "get-estimate-template-001"}}' --query "Item.{id: id.S, name: name.S, channel: channel.S, isActive: isActive.BOOL}" --output json`;
    
    const templateResult = execSync(templateQuery, { encoding: 'utf8' });
    const template = JSON.parse(templateResult);
    
    if (template && template.id) {
      console.log('✅ EMAIL Template found:', template);
    } else {
      console.log('❌ EMAIL Template NOT found');
      return;
    }
    
    // Check SMS template
    const smsTemplateQuery = `aws dynamodb get-item --table-name "NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --key '{"id": {"S": "get-estimate-sms-template-001"}}' --query "Item.{id: id.S, name: name.S, channel: channel.S, isActive: isActive.BOOL}" --output json`;
    
    const smsTemplateResult = execSync(smsTemplateQuery, { encoding: 'utf8' });
    const smsTemplate = JSON.parse(smsTemplateResult);
    
    if (smsTemplate && smsTemplate.id) {
      console.log('✅ SMS Template found:', smsTemplate);
    } else {
      console.log('❌ SMS Template NOT found');
    }
    
  } catch (error) {
    console.log('❌ Error checking templates:', error.message);
    return;
  }
  
  // Step 2: Check recent working notifications
  console.log('\n📋 STEP 2: Analyzing Recent Working Notifications');
  console.log('-' * 40);
  
  try {
    const workingQuery = `aws dynamodb scan --table-name "NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "#status = :status" --expression-attribute-names '{"#status": "status"}' --expression-attribute-values '{":status": {"S": "SENT"}}' --query "Items[0:2]" --output json`;
    
    const workingResult = execSync(workingQuery, { encoding: 'utf8' });
    const workingNotifications = JSON.parse(workingResult);
    
    console.log(`📊 Found ${workingNotifications.length} working notifications`);
    
    if (workingNotifications.length > 0) {
      const latest = workingNotifications[0];
      console.log('📋 Latest working notification structure:');
      console.log(`   - ID: ${latest.id.S}`);
      console.log(`   - Event Type: ${latest.eventType.S}`);
      console.log(`   - Template ID: ${latest.templateId.S}`);
      console.log(`   - Status: ${latest.status.S}`);
      console.log(`   - Created: ${latest.createdAt.S}`);
      console.log(`   - Sent: ${latest.sentAt.S}`);
    }
    
  } catch (error) {
    console.log('❌ Error checking working notifications:', error.message);
  }
  
  // Step 3: Check recent failed notifications
  console.log('\n📋 STEP 3: Checking Recent Failed Notifications');
  console.log('-' * 40);
  
  try {
    // Look for any failed notifications
    const failedQuery = `aws dynamodb scan --table-name "NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "#status = :status" --expression-attribute-names '{"#status": "status"}' --expression-attribute-values '{":status": {"S": "FAILED"}}' --query "Items[0:2]" --output json`;
    
    const failedResult = execSync(failedQuery, { encoding: 'utf8' });
    const failedNotifications = JSON.parse(failedResult);
    
    console.log(`📊 Found ${failedNotifications.length} failed notifications`);
    
    if (failedNotifications.length > 0) {
      failedNotifications.forEach((failed, index) => {
        console.log(`📋 Failed notification ${index + 1}:`);
        console.log(`   - ID: ${failed.id.S}`);
        console.log(`   - Event Type: ${failed.eventType.S}`);
        console.log(`   - Error: ${failed.errorMessage?.S || 'No error message'}`);
        console.log(`   - Created: ${failed.createdAt.S}`);
      });
    } else {
      console.log('✅ No failed notifications found');
    }
    
  } catch (error) {
    console.log('❌ Error checking failed notifications:', error.message);
  }
  
  // Step 4: Check pending notifications
  console.log('\n📋 STEP 4: Checking Pending Notifications');
  console.log('-' * 40);
  
  try {
    const pendingQuery = `aws dynamodb scan --table-name "NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "#status = :status" --expression-attribute-names '{"#status": "status"}' --expression-attribute-values '{":status": {"S": "PENDING"}}' --query "Items[*]" --output json`;
    
    const pendingResult = execSync(pendingQuery, { encoding: 'utf8' });
    const pendingNotifications = JSON.parse(pendingResult);
    
    console.log(`📊 Found ${pendingNotifications.length} pending notifications`);
    
    if (pendingNotifications.length > 0) {
      console.log('📋 Most recent pending notifications:');
      pendingNotifications.slice(0, 3).forEach((pending, index) => {
        console.log(`   ${index + 1}. ${pending.id.S}: ${pending.eventType.S} (${pending.createdAt.S})`);
      });
      
      // If there are pending notifications, they might be stuck
      if (pendingNotifications.length > 5) {
        console.log('⚠️ Many pending notifications - might indicate processor issues');
      }
    } else {
      console.log('✅ No pending notifications found');
    }
    
  } catch (error) {
    console.log('❌ Error checking pending notifications:', error.message);
  }
  
  // Step 5: Check GraphQL schema compatibility
  console.log('\n📋 STEP 5: Schema Compatibility Analysis');
  console.log('-' * 40);
  
  // Compare working vs current format
  console.log('🔍 Key differences to investigate:');
  console.log('   1. Template ID format: string vs relationship');
  console.log('   2. Required fields changes');
  console.log('   3. Data type validation');
  console.log('   4. Authorization requirements');
  
  // Step 6: Recommendations
  console.log('\n📋 STEP 6: Debug Recommendations');
  console.log('-' * 40);
  console.log('🎯 Next steps to isolate the issue:');
  console.log('   1. Try creating notification with exact working structure');
  console.log('   2. Test with minimal required fields only');
  console.log('   3. Check if authentication context changed');
  console.log('   4. Verify template relationship requirements');
  console.log('   5. Test notification processor function separately');
  
  console.log('\n🔧 Quick Test Commands:');
  console.log('   # Test template relationship:');
  console.log('   aws dynamodb get-item --table-name "NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --key \'{"id": {"S": "get-estimate-template-001"}}\'');
  console.log('');
  console.log('   # Check recent notification queue:');
  console.log('   aws dynamodb scan --table-name "NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --limit 3');
}

debugNotificationFlow().catch(console.error);