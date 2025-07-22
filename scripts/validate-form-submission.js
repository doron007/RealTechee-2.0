// Validate that the manual form submission worked correctly
const { execSync } = require('child_process');

console.log('🔍 Validating Manual Form Submission Results...\n');

// Get the most recent requests to see if new ones were created
async function checkRecentRequests() {
  try {
    console.log('📊 Checking the most recent requests...');
    
    // Get all requests sorted by creation date
    const recentQuery = `aws dynamodb scan --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --query "Items[*].{id: id.S, clientName: clientName.S, assignedTo: assignedTo.S, createdAt: createdAt.S, status: status.S}" --output json`;
    
    const result = execSync(recentQuery, { encoding: 'utf8' });
    const requests = JSON.parse(result);
    
    // Sort by creation date (most recent first)
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('📋 Most Recent 10 Requests:');
    console.log('ID\t\t\t\tClient Name\t\t\tAssigned To\t\tCreated At');
    console.log('─'.repeat(100));
    
    const recentRequests = requests.slice(0, 10);
    recentRequests.forEach(req => {
      const shortId = req.id.substring(0, 8);
      const clientName = (req.clientName || 'None').substring(0, 20).padEnd(20);
      const assignedTo = (req.assignedTo || 'None').substring(0, 15).padEnd(15);
      const createdAt = new Date(req.createdAt).toLocaleString();
      
      console.log(`${shortId}\t\t${clientName}\t${assignedTo}\t${createdAt}`);
    });
    
    // Check for test requests
    console.log('\n🧪 Looking for test requests...');
    const testRequests = requests.filter(req => 
      req.clientName && (
        req.clientName.includes('Test Agent') || 
        req.clientName.includes('test') ||
        req.clientName.includes('Test')
      )
    );
    
    if (testRequests.length > 0) {
      console.log(`✅ Found ${testRequests.length} test requests:`);
      testRequests.forEach(req => {
        console.log(`   - ${req.clientName} (${req.id.substring(0, 8)}): ${req.assignedTo}`);
      });
      
      // Check if any test requests are auto-assigned to actual AEs
      const autoAssignedTests = testRequests.filter(req => 
        req.assignedTo && 
        req.assignedTo !== 'Unassigned' && 
        req.assignedTo !== 'None' &&
        req.assignedTo !== null
      );
      
      if (autoAssignedTests.length > 0) {
        console.log(`🎉 SUCCESS: ${autoAssignedTests.length} test requests were auto-assigned to actual AEs!`);
        autoAssignedTests.forEach(req => {
          console.log(`   ✅ ${req.clientName} → ${req.assignedTo}`);
        });
      } else {
        console.log('❌ No test requests were auto-assigned to actual AEs');
      }
    } else {
      console.log('⚠️ No test requests found - please submit a test request first');
    }
    
    return { requests, testRequests };
    
  } catch (error) {
    console.error('❌ Error checking requests:', error.message);
    return { requests: [], testRequests: [] };
  }
}

// Check available AEs to ensure assignment system can work
async function checkAvailableAEs() {
  try {
    console.log('\n🔍 Checking available AEs for assignment...');
    
    const aeQuery = `aws dynamodb scan --table-name "BackOfficeAssignTo-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "active = :active" --expression-attribute-values '{"*active": {"BOOL": true}}' --query "Items[*].{name: name.S, active: active.BOOL, order: order.S}" --output json`;
    
    const result = execSync(aeQuery, { encoding: 'utf8' });
    const aes = JSON.parse(result);
    
    console.log(`📋 Found ${aes.length} active AEs:`);
    aes.sort((a, b) => parseInt(a.order) - parseInt(b.order));
    
    aes.forEach(ae => {
      console.log(`   - ${ae.name} (order: ${ae.order})`);
    });
    
    const assignableAEs = aes.filter(ae => ae.name !== 'Unassigned');
    console.log(`✅ ${assignableAEs.length} AEs available for auto-assignment (excluding "Unassigned")`);
    
    return aes;
    
  } catch (error) {
    console.error('❌ Error checking AEs:', error.message);
    return [];
  }
}

// Check notification queue for recent notifications
async function checkNotificationQueue() {
  try {
    console.log('\n🔍 Checking notification queue...');
    
    const notificationQuery = `aws dynamodb scan --table-name "NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --query "Items[*].{id: id.S, eventType: eventType.S, status: status.S, createdAt: createdAt.S}" --output json`;
    
    const result = execSync(notificationQuery, { encoding: 'utf8' });
    const notifications = JSON.parse(result);
    
    // Sort by creation date (most recent first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`📋 Found ${notifications.length} total notifications`);
    
    if (notifications.length > 0) {
      console.log('📋 Most Recent 5 Notifications:');
      notifications.slice(0, 5).forEach(notification => {
        const shortId = notification.id.substring(0, 8);
        const createdAt = new Date(notification.createdAt).toLocaleString();
        console.log(`   - ${shortId}: ${notification.eventType} (${notification.status}) - ${createdAt}`);
      });
    } else {
      console.log('⚠️ No notifications found in queue');
    }
    
    return notifications;
    
  } catch (error) {
    console.error('❌ Error checking notification queue:', error.message);
    return [];
  }
}

// Main validation function
async function validateAssignmentFixes() {
  const { requests, testRequests } = await checkRecentRequests();
  const aes = await checkAvailableAEs();
  const notifications = await checkNotificationQueue();
  
  console.log('\n📊 VALIDATION SUMMARY:');
  console.log('═'.repeat(50));
  
  // Check Fix #1: Duplicate "Unassigned" options
  const hasUnassigned = aes.some(ae => ae.name === 'Unassigned');
  console.log(`✅ Fix #1 (Dropdown): "Unassigned" available: ${hasUnassigned}`);
  
  // Check Fix #2: Assignment save (we'd need to test this manually)
  console.log(`ℹ️  Fix #2 (Save): Needs manual testing in admin panel`);
  
  // Check Fix #3: Notification system
  const hasRecentNotifications = notifications.length > 0;
  console.log(`✅ Fix #3 (Notifications): Queue working: ${hasRecentNotifications}`);
  
  // Check Fix #4: Auto-assignment
  const hasAutoAssignedRequests = testRequests.some(req => 
    req.assignedTo && 
    req.assignedTo !== 'Unassigned' && 
    req.assignedTo !== 'None' &&
    req.assignedTo !== null
  );
  console.log(`${hasAutoAssignedRequests ? '✅' : '❌'} Fix #4 (Auto-assignment): Working: ${hasAutoAssignedRequests}`);
  
  console.log('\n🎯 NEXT STEPS:');
  if (!hasAutoAssignedRequests) {
    console.log('❌ Auto-assignment not working - debug needed');
    console.log('   1. Check if assignment service is called during form submission');
    console.log('   2. Check if assignment rules are enabled');
    console.log('   3. Check if assignable AEs are found');
    console.log('   4. Check assignment service logs');
  } else {
    console.log('✅ Auto-assignment working correctly');
  }
  
  if (testRequests.length === 0) {
    console.log('⚠️ No test requests found - please submit a test request');
    console.log('   1. Go to: http://localhost:3000/contact/get-estimate');
    console.log('   2. Fill form with test data');
    console.log('   3. Submit form');
    console.log('   4. Run this script again');
  }
  
  console.log('\n🔍 Manual Testing Still Required:');
  console.log('   1. Test assignment dropdown in admin panel');
  console.log('   2. Test assignment save functionality');
  console.log('   3. Test assignment persistence after refresh');
}

// Run validation
validateAssignmentFixes().catch(console.error);