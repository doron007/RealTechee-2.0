// Debug Form Submission
const { chromium } = require('playwright');

async function debugFormSubmission() {
  console.log('🐛 Debugging Form Submission...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log(`🖥️  CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  
  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('graphql') || request.method() === 'POST') {
      console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  // Listen to network responses
  page.on('response', response => {
    if (response.url().includes('graphql') || response.request().method() === 'POST') {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // Navigate to form
    await page.goto('http://localhost:3000/contact/get-estimate');
    console.log('✅ Navigated to form');
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ Form loaded');
    
    // Fill form quickly
    await page.selectOption('select[name="relationToProperty"]', 'Real Estate Agent');
    await page.fill('input[name*="propertyAddress.streetAddress"]', '123 Debug St');
    await page.fill('input[name*="propertyAddress.city"]', 'Test City');
    await page.selectOption('select[name*="propertyAddress.state"]', 'CA');
    await page.fill('input[name*="propertyAddress.zip"]', '90210');
    
    await page.fill('input[name*="agentInfo.fullName"]', 'Debug Agent');
    await page.fill('input[name*="agentInfo.email"]', 'debug@test.com');
    await page.fill('input[name*="agentInfo.phone"]', '5551234567');
    await page.selectOption('select[name*="agentInfo.brokerage"]', 'Equity Union');
    
    // Fill meeting type
    await page.locator('label:has(input[name*="rtDigitalSelection"][value="in-person"])').click();
    
    // Wait for conditional fields
    await page.waitForTimeout(1000);
    
    // Fill date/time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="requestedVisitDateTime"]', dateString);
    await page.fill('input[name="requestedVisitTime"]', '10:00');
    
    await page.fill('textarea[name="notes"]', 'Debug test submission');
    
    console.log('✅ Form filled completely');
    
    // Check form state before submission
    const formValid = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form ? form.checkValidity() : false;
    });
    console.log(`📋 Form validity: ${formValid}`);
    
    // Check submit button state
    const submitButton = page.locator('button[type="submit"]');
    const isEnabled = await submitButton.isEnabled();
    console.log(`🔘 Submit button enabled: ${isEnabled}`);
    
    // Submit form
    console.log('📤 Clicking submit button...');
    await submitButton.click();
    
    // Wait and monitor for changes
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      const hasSuccess = await page.locator('text=Request Submitted Successfully').count() > 0;
      const hasError = await page.locator('.error, .alert-error, [role="alert"]').count() > 0;
      
      console.log(`⏰ Second ${i+1}: URL=${currentUrl}, Success=${hasSuccess}, Error=${hasError}`);
      
      if (hasSuccess) {
        console.log('🎉 SUCCESS MESSAGE FOUND!');
        break;
      }
      
      if (hasError) {
        const errorTexts = await page.locator('.error, .alert-error, [role="alert"]').allTextContents();
        console.log('❌ ERROR FOUND:', errorTexts);
        break;
      }
    }
    
    // Final page state
    const finalContent = await page.textContent('body');
    console.log('📄 Final page content (first 500 chars):', finalContent.substring(0, 500));
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugFormSubmission().catch(console.error);