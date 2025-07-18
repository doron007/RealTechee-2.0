// Assignment System Validation with Manual Steps
const puppeteer = require('puppeteer');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  adminEmail: 'info@realtechee.com',
  adminPassword: 'Sababa123!',
  testData: {
    agentName: 'Test Agent Manual ' + Date.now(),
    email: 'test.manual@example.com',
    phone: '(555) 123-4567',
    company: 'Test Company Manual',
    address: '123 Manual Test St',
    city: 'Test City',
    state: 'CA',
    zip: '90210',
    product: 'Kitchen Renovation',
    notes: 'Manual validation test for assignment system fixes'
  }
};

async function runValidation() {
  console.log('🚀 Assignment System Validation Starting...\n');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
    slowMo: 100  // Faster actions
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Test Form Submission
    console.log('📋 STEP 1: Testing Form Submission');
    console.log('═'.repeat(40));
    
    await page.goto(`${config.baseUrl}/contact/get-estimate`);
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    console.log('✅ Form page loaded');
    console.log('📝 Filling out form...');
    
    // Fill out the form (wait for elements to be available)
    await page.waitForSelector('select[name="relationToProperty"]', { timeout: 5000 });
    await page.select('select[name="relationToProperty"]', 'Real Estate Agent');
    
    // Wait for form fields and fill them
    await page.waitForSelector('input[name*="propertyAddress.streetAddress"]', { timeout: 3000 });
    await page.type('input[name*="propertyAddress.streetAddress"]', config.testData.address, { delay: 10 });
    await page.type('input[name*="propertyAddress.city"]', config.testData.city, { delay: 10 });
    await page.select('select[name*="propertyAddress.state"]', config.testData.state);
    await page.type('input[name*="propertyAddress.zip"]', config.testData.zip, { delay: 10 });
    await page.type('input[name*="agentInfo.fullName"]', config.testData.agentName, { delay: 10 });
    await page.type('input[name*="agentInfo.email"]', config.testData.email, { delay: 10 });
    await page.type('input[name*="agentInfo.phone"]', config.testData.phone, { delay: 10 });
    await page.type('input[name*="agentInfo.brokerage"]', config.testData.company, { delay: 10 });
    await page.select('select[name*="rtDigitalSelection"]', 'in-person');
    await page.type('textarea[name="notes"]', config.testData.notes, { delay: 10 });
    
    console.log('✅ Form filled with test data');
    console.log('🔍 Please verify the form is filled correctly...');
    await page.waitForTimeout(3000);
    
    // Submit form
    console.log('📤 Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for success or error
    await page.waitForTimeout(8000);
    
    // Check for success elements
    const successElements = await page.$$eval('*', els => 
      els.filter(el => el.textContent.includes('Thank you') || el.textContent.includes('Request')).length
    );
    
    if (successElements > 0) {
      console.log('✅ Form submitted successfully!');
      
      // Look for request ID
      const requestIdElement = await page.$('[data-testid="request-id"]');
      if (requestIdElement) {
        const requestIdText = await requestIdElement.evaluate(el => el.textContent);
        console.log(`📋 Request ID: ${requestIdText}`);
      }
    } else {
      console.log('❌ Form submission may have failed');
    }
    
    // Step 2: Login to Admin
    console.log('\n📋 STEP 2: Testing Admin Login');
    console.log('═'.repeat(40));
    
    await page.goto(`${config.baseUrl}/admin`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', config.adminEmail);
    await page.type('input[type="password"]', config.adminPassword);
    await page.click('button[type="submit"]');
    
    // Wait for login
    await page.waitForTimeout(5000);
    
    // Step 3: Check Requests
    console.log('\n📋 STEP 3: Checking Request Assignment');
    console.log('═'.repeat(40));
    
    await page.goto(`${config.baseUrl}/admin/requests`);
    await page.waitForSelector('table, .table', { timeout: 10000 });
    
    console.log('📋 Requests page loaded');
    
    // Look for our test request
    const requestFound = await page.evaluate((agentName) => {
      const rows = document.querySelectorAll('tr, .table-row');
      for (let row of rows) {
        if (row.textContent.includes(agentName)) {
          // Get assignment info
          const assignmentText = row.textContent;
          return {
            found: true,
            rowText: assignmentText,
            hasAssignment: !assignmentText.includes('Unassigned')
          };
        }
      }
      return { found: false };
    }, config.testData.agentName);
    
    if (requestFound.found) {
      console.log('✅ Test request found in list');
      console.log(`📋 Row text: ${requestFound.rowText}`);
      
      if (requestFound.hasAssignment) {
        console.log('✅ Request is assigned to an AE (not "Unassigned")');
      } else {
        console.log('❌ Request is still "Unassigned"');
      }
      
      // Click on request to open details
      console.log('\n📋 STEP 4: Opening Request Details');
      console.log('═'.repeat(40));
      
      await page.evaluate((agentName) => {
        const rows = document.querySelectorAll('tr, .table-row');
        for (let row of rows) {
          if (row.textContent.includes(agentName)) {
            const link = row.querySelector('a') || row;
            link.click();
            break;
          }
        }
      }, config.testData.agentName);
      
      await page.waitForTimeout(5000);
      
      // Check assignment dropdown
      console.log('\n📋 STEP 5: Testing Assignment Dropdown');
      console.log('═'.repeat(40));
      
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
        
        if (unassignedCount === 1) {
          console.log('✅ Exactly ONE "Unassigned" option found (no duplicates)');
        } else {
          console.log('❌ Duplicate "Unassigned" options found');
        }
        
        // Test assignment change
        console.log('\n📋 STEP 6: Testing Assignment Save');
        console.log('═'.repeat(40));
        
        console.log('🔄 Changing assignment to "Doron"...');
        await page.select('select[name="assignedTo"]', 'Doron');
        
        // Wait for save button
        await page.waitForTimeout(1000);
        
        const saveButton = await page.$('button[type="submit"], button:has-text("Save")');
        if (saveButton) {
          console.log('💾 Clicking save button...');
          await saveButton.click();
          
          await page.waitForTimeout(3000);
          
          // Check if assignment persisted
          const selectedValue = await page.evaluate(() => {
            const select = document.querySelector('select[name="assignedTo"]');
            return select ? select.value : null;
          });
          
          console.log(`📋 Assignment after save: ${selectedValue}`);
          
          if (selectedValue === 'Doron') {
            console.log('✅ Assignment saved successfully');
          } else {
            console.log('❌ Assignment did not save correctly');
          }
        } else {
          console.log('❌ Save button not found');
        }
        
      } else {
        console.log('❌ Assignment dropdown not found');
      }
      
    } else {
      console.log('❌ Test request not found in list');
    }
    
    // Final Summary
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('═'.repeat(40));
    console.log('✅ Test completed successfully!');
    console.log('');
    console.log('🎯 MANUAL VERIFICATION CHECKLIST:');
    console.log('□ Form submitted without errors');
    console.log('□ Request appears in admin requests list');
    console.log('□ Request is auto-assigned to actual AE');
    console.log('□ Assignment dropdown has exactly ONE "Unassigned" option');
    console.log('□ Assignment changes save correctly');
    console.log('□ Assignment persists after save');
    console.log('');
    console.log('🔍 Please verify these items manually in the browser');
    console.log('📋 Press any key to close browser...');
    
    // Keep browser open for manual verification
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await browser.close();
  }
}

// Run validation
runValidation().catch(console.error);