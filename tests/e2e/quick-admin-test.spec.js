// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Quick Admin Test', () => {
  test('Check admin page and authentication', async ({ page }) => {
    console.log('\n🧪 Quick admin page test...');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Go to admin page
    console.log('📍 Navigating to /admin...');
    await page.goto('/admin');
    
    // Wait and take screenshot
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-reports/admin-page-initial.png', fullPage: true });
    
    // Check what's on the page
    const pageContent = await page.textContent('body');
    console.log('📄 Page contains login form:', pageContent?.includes('email') || pageContent?.includes('password') || pageContent?.includes('Sign'));
    console.log('📄 Page contains admin content:', pageContent?.includes('Admin') || pageContent?.includes('Dashboard'));
    
    // Try to find login elements
    const emailInputs = await page.locator('input[type="email"], input[placeholder*="email"], input[name*="email"]').count();
    const passwordInputs = await page.locator('input[type="password"], input[placeholder*="password"], input[name*="password"]').count();
    const submitButtons = await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').count();
    
    console.log(`📧 Email inputs found: ${emailInputs}`);
    console.log(`🔒 Password inputs found: ${passwordInputs}`);
    console.log(`🔘 Submit buttons found: ${submitButtons}`);

    // If login elements exist, try to authenticate
    if (emailInputs > 0 && passwordInputs > 0 && submitButtons > 0) {
      console.log('🔐 Attempting authentication...');
      
      // Fill forms
      await page.locator('input[type="email"], input[placeholder*="email"]').first().fill('info@realtechee.com');
      await page.locator('input[type="password"], input[placeholder*="password"]').first().fill('Sababa123!');
      
      // Take screenshot before submitting
      await page.screenshot({ path: 'test-reports/admin-login-filled.png' });
      
      // Submit
      await page.locator('button[type="submit"], button:has-text("Sign")').first().click();
      
      // Wait for response
      await page.waitForTimeout(8000);
      
      // Take screenshot after submit
      await page.screenshot({ path: 'test-reports/admin-after-login.png', fullPage: true });
      
      console.log('✅ Login attempt completed');
      console.log('📍 Current URL:', page.url());
    } else {
      console.log('⚠️  No complete login form found');
    }

    // Check final state
    const finalContent = await page.textContent('body');
    console.log('📄 Final page state - has admin content:', finalContent?.includes('Admin') || finalContent?.includes('Dashboard') || finalContent?.includes('Request'));
  });

  test('Direct requests page test', async ({ page }) => {
    console.log('\n🧪 Direct requests page test...');

    // Enable console logging  
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Go directly to requests page
    console.log('📍 Navigating to /admin/requests...');
    await page.goto('/admin/requests');
    
    // Wait longer for potential redirects/loading
    await page.waitForTimeout(8000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-reports/admin-requests-direct.png', fullPage: true });
    
    // Check page content
    const content = await page.textContent('body');
    const hasRequests = content?.includes('Request') || content?.includes('request') || false;
    const has500Error = content?.includes('500') || false;
    const hasModelError = content?.includes('Model') && content?.includes('not available') || false;
    
    console.log('📄 Current URL:', page.url());
    console.log('📋 Page has requests content:', hasRequests);
    console.log('❌ Has 500 error:', has500Error);
    console.log('❌ Has model error:', hasModelError);
    
    // Look for data elements
    const tables = await page.locator('table').count();
    const dataGrids = await page.locator('.MuiDataGrid-root').count();
    const rows = await page.locator('tr, .MuiDataGrid-row').count();
    
    console.log(`📊 Tables found: ${tables}`);
    console.log(`📊 Data grids found: ${dataGrids}`);
    console.log(`📋 Rows found: ${rows}`);
    
    console.log('✅ Direct requests page test completed');
  });
});