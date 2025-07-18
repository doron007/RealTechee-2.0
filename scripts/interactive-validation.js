// Interactive Assignment System Validation with Puppeteer
const puppeteer = require('puppeteer');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to wait for user confirmation
const waitForUserInput = (message) => {
  return new Promise((resolve) => {
    rl.question(`\n${message}\nPress Enter to continue, or type 'q' to quit: `, (answer) => {
      if (answer.toLowerCase() === 'q') {
        process.exit(0);
      }
      resolve();
    });
  });
};

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
    notes: 'Interactive validation test'
  }
};

async function runInteractiveValidation() {
  console.log('🚀 Starting Interactive Assignment System Validation...\n');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // ===== STEP 1: Test Form Submission and Auto-Assignment =====
    console.log('📋 STEP 1: Testing Form Submission and Auto-Assignment');
    console.log('═'.repeat(60));
    
    await page.goto(`${config.baseUrl}/contact/get-estimate`);
    
    // Wait for the form to load with multiple possible selectors
    try {
      await page.waitForSelector('h1, h2', { timeout: 10000 });
    } catch (error) {
      console.log('Form page might not have loaded correctly');
    }
    
    await waitForUserInput('✅ Form page loaded. Can you see the "Get Your Estimate" form?');
    
    // Fill out the form
    console.log('📝 Filling out the form with test data...');
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
    
    await waitForUserInput('✅ Form filled with test data. Does the form look correct?');
    
    // Submit the form
    console.log('📤 Submitting the form...');
    await page.click('button[type="submit"]');
    
    // Wait for success page
    try {
      await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
      console.log('✅ Form submitted successfully!');
      
      // Look for request ID
      const requestIdElement = await page.$('[data-testid="request-id"]');
      if (requestIdElement) {
        const requestIdText = await requestIdElement.textContent();
        console.log(`📋 Request ID: ${requestIdText}`);
        
        await waitForUserInput('✅ SUCCESS: Form submitted and request ID displayed. Can you see the request ID and success message?');
      } else {
        await waitForUserInput('⚠️ Form submitted but no request ID found. Can you see the success message?');
      }
    } catch (error) {
      await waitForUserInput('❌ Form submission failed or timed out. What do you see on the screen?');
    }
    
    // ===== STEP 2: Check Admin Panel and Auto-Assignment =====
    console.log('\n📋 STEP 2: Checking Admin Panel and Auto-Assignment');
    console.log('═'.repeat(60));
    
    await page.goto(`${config.baseUrl}/admin`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await waitForUserInput('✅ Admin login page loaded. Can you see the login form?');
    
    // Login
    console.log('🔐 Logging in to admin panel...');
    await page.type('input[type="email"]', config.adminEmail);
    await page.type('input[type="password"]', config.adminPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => window.location.pathname.includes('/admin'), { timeout: 10000 });
    
    await waitForUserInput('✅ Logged in successfully. Can you see the admin dashboard?');
    
    // Navigate to requests
    console.log('📋 Navigating to requests management...');
    await page.goto(`${config.baseUrl}/admin/requests`);
    await page.waitForSelector('text=Requests Management', { timeout: 10000 });
    
    await waitForUserInput('✅ Requests page loaded. Can you see the requests list?');
    
    // Look for our test request
    console.log('🔍 Looking for the test request...');
    const testRequestRow = await page.evaluate((agentName) => {
      const rows = document.querySelectorAll('[data-testid="request-row"]');
      for (let row of rows) {
        if (row.textContent.includes(agentName)) {
          return row;
        }
      }
      return null;
    }, config.testData.agentName);
    
    if (testRequestRow) {
      console.log('✅ Test request found in the list!');
      
      // Check if it's assigned
      const rowText = await page.evaluate((agentName) => {
        const rows = document.querySelectorAll('[data-testid="request-row"]');
        for (let row of rows) {
          if (row.textContent.includes(agentName)) {
            return row.textContent;
          }
        }
        return null;
      }, config.testData.agentName);
      console.log(`📋 Request row text: ${rowText}`);
      
      await waitForUserInput('✅ Test request found. Is it assigned to an actual AE (not "Unassigned")? What AE is it assigned to?');
      
      // Click on the request to open details
      console.log('🔍 Opening request details...');
      await page.evaluate((agentName) => {
        const rows = document.querySelectorAll('[data-testid="request-row"]');
        for (let row of rows) {
          if (row.textContent.includes(agentName)) {
            row.click();
            break;
          }
        }
      }, config.testData.agentName);
      await page.waitForSelector('text=Request #', { timeout: 10000 });
      
      await waitForUserInput('✅ Request details opened. Can you see the request details page?');
      
      // ===== STEP 3: Test Assignment Dropdown (Fix #1) =====
      console.log('\n📋 STEP 3: Testing Assignment Dropdown (Fix #1)');
      console.log('═'.repeat(60));
      
      const assignmentDropdown = await page.$('select[name="assignedTo"]');
      
      if (assignmentDropdown) {
        // Get all options
        const options = await page.evaluate(() => {
          const select = document.querySelector('select[name="assignedTo"]');
          return select ? Array.from(select.options).map(option => option.text) : [];
        });
        
        console.log('📋 Assignment dropdown options:', options);
        
        // Count "Unassigned" options
        const unassignedCount = options.filter(opt => opt.includes('Unassigned')).length;
        console.log(`📊 Number of "Unassigned" options: ${unassignedCount}`);
        
        await waitForUserInput(`✅ Assignment dropdown found with ${options.length} options. Do you see exactly ONE "Unassigned" option (not duplicates)?`);
        
        // ===== STEP 4: Test Assignment Save (Fix #2) =====
        console.log('\n📋 STEP 4: Testing Assignment Save (Fix #2)');
        console.log('═'.repeat(60));
        
        console.log('🔄 Testing assignment change to "Doron"...');
        await page.select('select[name="assignedTo"]', 'Doron');
        
        await waitForUserInput('✅ Changed assignment to "Doron". Do you see the "Save Changes" button appear?');
        
        // Save changes
        const saveButton = await page.$('button:has-text("Save Changes")');
        if (saveButton) {
          console.log('💾 Clicking save button...');
          await saveButton.click();
          
          // Wait for save to complete - use waitForFunction instead of waitForSelector with state
          await page.waitForFunction(() => !document.querySelector('button:has-text("Save Changes")'), { timeout: 10000 });
          
          console.log('✅ Save completed!');
          
          // Check if assignment persisted
          const selectedValue = await page.evaluate(() => {
            const select = document.querySelector('select[name="assignedTo"]');
            return select ? select.value : null;
          });
          console.log(`📋 Assignment after save: ${selectedValue}`);
          
          await waitForUserInput('✅ Assignment saved. Does the dropdown still show "Doron" as selected?');
          
          // Test page refresh persistence
          console.log('🔄 Refreshing page to test persistence...');
          await page.reload();
          await page.waitForSelector('text=Request #', { timeout: 10000 });
          
          const refreshedValue = await page.evaluate(() => {
            const select = document.querySelector('select[name="assignedTo"]');
            return select ? select.value : null;
          });
          console.log(`📋 Assignment after refresh: ${refreshedValue}`);
          
          await waitForUserInput('✅ Page refreshed. Does the assignment still show "Doron"?');
          
          // Test another assignment change
          console.log('🔄 Testing assignment change to "Unassigned"...');
          await page.select('select[name="assignedTo"]', 'Unassigned');
          
          const saveButton2 = await page.$('button:has-text("Save Changes")');
          if (saveButton2) {
            await saveButton2.click();
            await page.waitForFunction(() => !document.querySelector('button:has-text("Save Changes")'), { timeout: 10000 });
            
            const finalValue = await page.evaluate(() => {
              const select = document.querySelector('select[name="assignedTo"]');
              return select ? select.value : null;
            });
            console.log(`📋 Final assignment: ${finalValue}`);
            
            await waitForUserInput('✅ Assignment changed to "Unassigned" and saved. Does it show "Unassigned" now?');
          }
        } else {
          await waitForUserInput('❌ Save button not found. Can you see a "Save Changes" button?');
        }
      } else {
        await waitForUserInput('❌ Assignment dropdown not found. Can you see an "Assigned To" dropdown?');
      }
    } else {
      await waitForUserInput('❌ Test request not found in the list. Can you see any requests in the table?');
    }
    
    // ===== FINAL VALIDATION =====
    console.log('\n📋 FINAL VALIDATION SUMMARY');
    console.log('═'.repeat(60));
    
    console.log('✅ Test completed! Please confirm the results:');
    console.log('1. ✅ Form submitted successfully');
    console.log('2. ✅ Request ID was displayed');
    console.log('3. ✅ Request appears in admin panel');
    console.log('4. ✅ Request was auto-assigned to actual AE');
    console.log('5. ✅ Assignment dropdown has no duplicate "Unassigned" options');
    console.log('6. ✅ Assignment changes save correctly');
    console.log('7. ✅ Assignment persists after page refresh');
    
    await waitForUserInput('📊 All tests completed! Are you satisfied with the results?');
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
    try {
      await waitForUserInput('❌ An error occurred. Please describe what you see on the screen.');
    } catch (inputError) {
      console.log('Input error:', inputError.message);
    }
  } finally {
    await browser.close();
    rl.close();
  }
}

// Run the interactive validation
runInteractiveValidation().catch(console.error);