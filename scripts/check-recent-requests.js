// Check recent requests to validate our fixes
const { execSync } = require('child_process');

console.log('🔍 Checking Recent Requests for Assignment Validation...\n');

try {
  // Get recent requests from the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  console.log('📊 Querying requests created in the last hour...');
  
  const query = `aws dynamodb scan --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "createdAt > :timeFilter" --expression-attribute-values '{"${oneHourAgo}": {"S": "${oneHourAgo}"}}' --query "Items[*].{id: id.S, clientName: clientName.S, assignedTo: assignedTo.S, createdAt: createdAt.S, status: status.S}" --output table`;
  
  console.log('🔍 Running query...');
  const result = execSync(query, { encoding: 'utf8' });
  
  console.log('📋 Recent Requests:');
  console.log(result);
  
  // Check for test requests
  const testQuery = `aws dynamodb scan --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "contains(clientName, :testName)" --expression-attribute-values '{"${testName}": {"S": "Test Agent"}}' --query "Items[*].{id: id.S, clientName: clientName.S, assignedTo: assignedTo.S, createdAt: createdAt.S}" --output table`;
  
  console.log('\n🧪 Checking for test requests...');
  const testResult = execSync(testQuery.replace('${testName}', ':testName'), { encoding: 'utf8' });
  
  console.log('📋 Test Requests:');
  console.log(testResult);
  
} catch (error) {
  console.log('❌ Error querying requests:', error.message);
}

console.log('\n📋 Manual Testing Instructions:');
console.log('1. Form should be open in your browser');
console.log('2. Fill out the form with test data');
console.log('3. Submit the form');
console.log('4. Check if you get a request ID in the success message');
console.log('5. Run this script again to see if the request was created');
console.log('6. Open admin panel to check assignment');

console.log('\n🎯 What to Look For:');
console.log('✅ Request is created with a valid ID');
console.log('✅ Request is assigned to an actual AE (not "Unassigned")');
console.log('✅ Assignment dropdown has no duplicate "Unassigned" options');
console.log('✅ Assignment changes save correctly');
console.log('✅ Notifications are queued (form doesn\'t fail)');

console.log('\n🔧 Commands to check specific aspects:');
console.log('# Check available AEs:');
console.log('aws dynamodb scan --table-name "BackOfficeAssignTo-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "active = :active" --expression-attribute-values \'{"${active}": {"BOOL": true}}\' --query "Items[*].{name: name.S, active: active.BOOL, order: order.S}" --output table');

console.log('\n# Check notification queue:');
console.log('aws dynamodb scan --table-name "NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --query "Items[*].{id: id.S, eventType: eventType.S, status: status.S, createdAt: createdAt.S}" --output table | tail -10');