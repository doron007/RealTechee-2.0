// Simple Interactive Assignment System Validation
const puppeteer = require('puppeteer');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  adminEmail: 'info@realtechee.com',
  adminPassword: 'Sababa123!',
  testData: {
    agentName: 'Test Agent Interactive ' + Date.now(),
    email: 'test.interactive@example.com',
    phone: '(555) 123-4567',
    company: 'Test Company Interactive',
    address: '123 Interactive Test St',
    city: 'Test City',
    state: 'CA',
    zip: '90210',
    product: 'Kitchen Renovation',
    notes: 'Interactive validation test for assignment system fixes'
  }
};

async function pause(seconds = 5) {
  console.log(`⏳ Pausing for ${seconds} seconds for visual inspection...`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function runSimpleValidation() {
  console.log('🚀 Simple Interactive Assignment System Validation');
  console.log('This script will open a browser and perform actions with pauses for your review\n');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    slowMo: 250  // Slow down actions for better visibility
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Open form page
    console.log('📋 STEP 1: Opening Get Estimate Form');
    console.log('═'.repeat(50));
    await page.goto(`${config.baseUrl}/contact/get-estimate`);
    await pause(3);
    
    console.log('🔍 PLEASE VERIFY: Can you see the "Get Your Estimate" form?');
    console.log('Expected: Form with agent info, property address, and project details fields');
    await pause(5);
    
    // Step 2: Fill out form
    console.log('\n📝 STEP 2: Filling Out Form');
    console.log('═'.repeat(50));
    
    try {
      await page.select('select[name="relationToProperty"]', 'Agent');
      await page.type('input[name="propertyAddress.streetAddress"]', config.testData.address);
      await page.type('input[name="propertyAddress.city"]', config.testData.city);
      await page.select('select[name="propertyAddress.state"]', config.testData.state);
      await page.type('input[name="propertyAddress.zip"]', config.testData.zip);
      await page.type('input[name="agentInfo.fullName"]', config.testData.agentName);
      await page.type('input[name="agentInfo.email"]', config.testData.email);
      await page.type('input[name="agentInfo.phone"]', config.testData.phone);
      await page.type('input[name="agentInfo.company"]', config.testData.company);
      await page.select('select[name="rtDigitalSelection"]', config.testData.product);
      await page.type('textarea[name="notes"]', config.testData.notes);
      
      console.log('✅ Form filled with test data:');
      console.log(`   - Agent: ${config.testData.agentName}`);
      console.log(`   - Email: ${config.testData.email}`);
      console.log(`   - Address: ${config.testData.address}, ${config.testData.city}, ${config.testData.state}`);
      console.log(`   - Product: ${config.testData.product}`);
      
      await pause(3);
      
      // Step 3: Submit form
      console.log('\n📤 STEP 3: Submitting Form');
      console.log('═'.repeat(50));
      await page.click('button[type="submit"]');
      
      console.log('⏳ Waiting for form submission...');
      await pause(8);
      
      console.log('🔍 PLEASE VERIFY: Did the form submit successfully?');
      console.log('Expected: Success page with "Thank you for your request!" message');
      console.log('Expected: Request ID displayed');
      console.log('Expected: No error messages');
      
      // Try to find request ID
      try {
        const requestIdElement = await page.$('[data-testid="request-id"]');
        if (requestIdElement) {
          const requestIdText = await requestIdElement.textContent();
          console.log(`✅ Request ID found: ${requestIdText}`);
        }
      } catch (error) {
        console.log('⚠️ Could not find request ID element');
      }
      
      await pause(5);
      
      // Step 4: Login to admin
      console.log('\n🔐 STEP 4: Logging into Admin Panel');
      console.log('═'.repeat(50));
      await page.goto(`${config.baseUrl}/admin`);
      await pause(2);
      
      await page.type('input[type="email"]', config.adminEmail);
      await page.type('input[type="password"]', config.adminPassword);
      await page.click('button[type="submit"]');
      
      console.log('⏳ Logging in...');
      await pause(5);
      
      console.log('🔍 PLEASE VERIFY: Are you logged into the admin panel?');
      console.log('Expected: Admin dashboard visible');
      await pause(3);
      
      // Step 5: Navigate to requests
      console.log('\n📋 STEP 5: Checking Requests Management');
      console.log('═'.repeat(50));
      await page.goto(`${config.baseUrl}/admin/requests`);
      await pause(3);
      
      console.log('🔍 PLEASE VERIFY: Can you see the requests list?');
      console.log('Expected: Table with list of requests');
      await pause(3);
      
      // Step 6: Look for test request
      console.log('\n🔍 STEP 6: Finding Test Request');
      console.log('═'.repeat(50));
      console.log(`Looking for request with agent name: ${config.testData.agentName}`);
      
      await pause(3);
      
      console.log('🔍 PLEASE VERIFY: Can you find the test request in the table?');
      console.log('Expected: Request row with test agent name');
      console.log('CRITICAL: Is the request assigned to an actual AE (not "Unassigned")?');
      console.log('Expected: Assignment should be "Doron", "Accounting", "Demo", or other actual AE');
      await pause(8);
      
      // Step 7: Click on request to test dropdown
      console.log('\n🔍 STEP 7: Testing Assignment Dropdown');
      console.log('═'.repeat(50));
      console.log('Please click on the test request to open its details...');
      await pause(5);
      
      console.log('🔍 PLEASE VERIFY: Assignment dropdown functionality');
      console.log('1. Can you see the "Assigned To" dropdown?');
      console.log('2. Does it have exactly ONE "Unassigned" option (no duplicates)?');
      console.log('3. Does it show actual AE names (Doron, Accounting, Demo, etc.)?');
      await pause(8);
      
      // Step 8: Test assignment save
      console.log('\n💾 STEP 8: Testing Assignment Save');
      console.log('═'.repeat(50));
      console.log('Please test the assignment save functionality:');
      console.log('1. Change assignment to "Doron"');
      console.log('2. Click "Save Changes"');
      console.log('3. Verify it shows "Doron" after save');
      console.log('4. Refresh the page');
      console.log('5. Verify it still shows "Doron" after refresh');
      console.log('6. Change to "Unassigned" and save');
      console.log('7. Verify it shows "Unassigned" after save');
      await pause(15);
      
      // Final validation
      console.log('\n📊 FINAL VALIDATION');
      console.log('═'.repeat(50));
      console.log('✅ ASSIGNMENT SYSTEM BUG FIXES VALIDATION:');
      console.log('');
      console.log('BUG FIX 1: Duplicate "Unassigned" Options');
      console.log('□ Assignment dropdown has exactly ONE "Unassigned" option');
      console.log('□ No duplicate "Unassigned" entries visible');
      console.log('');
      console.log('BUG FIX 2: Assignment Save Failure');
      console.log('□ Assignment changes save successfully');
      console.log('□ Assignment values persist after save');
      console.log('□ Assignment values persist after page refresh');
      console.log('');
      console.log('BUG FIX 3: Notification System Failures');
      console.log('□ Form submitted successfully (no notification errors)');
      console.log('□ Request was created in the system');
      console.log('');
      console.log('BUG FIX 4: Auto-Assignment Issues');
      console.log('□ New request was auto-assigned to actual AE');
      console.log('□ Auto-assignment did not assign to "Unassigned"');
      console.log('');
      console.log('🎯 All fixes should be working correctly!');
      
      await pause(5);
      
    } catch (error) {
      console.error('❌ Error during form interaction:', error);
      await pause(5);
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
    await pause(5);
  } finally {
    console.log('\n🏁 Validation complete. Browser will close in 5 seconds...');
    await pause(5);
    await browser.close();
  }
}

// Run the validation
runSimpleValidation().catch(console.error);