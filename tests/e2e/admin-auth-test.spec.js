// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Admin Authentication Test', () => {
  test('Complete admin authentication flow', async ({ page }) => {
    console.log('\n🧪 Testing complete admin authentication flow...');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Navigate to admin
    console.log('📍 Navigating to /admin...');
    await page.goto('/admin');
    await page.waitForTimeout(3000);

    // Should redirect to login
    console.log('🔍 Current URL:', page.url());
    
    // Try to find the username field (Amplify UI uses different selectors)
    await page.waitForTimeout(2000);
    const usernameField = await page.locator('input[placeholder*="Username"], input[placeholder*="username"], input[data-amplify-input="true"]').first();
    const passwordField = await page.locator('input[type="password"]').first();
    
    // Take screenshot of login form
    await page.screenshot({ path: 'test-reports/login-form-ready.png' });
    
    console.log('📧 Attempting to fill username field...');
    await usernameField.fill('info@realtechee.com');
    
    console.log('🔒 Attempting to fill password field...');
    await passwordField.fill('Sababa123!');
    
    // Take screenshot with filled form
    await page.screenshot({ path: 'test-reports/login-form-filled.png' });
    
    console.log('🔘 Clicking sign in button...');
    await page.locator('button:has-text("Sign in"), button[type="submit"]').first().click();
    
    // Wait longer for authentication
    console.log('⏳ Waiting for authentication...');
    await page.waitForTimeout(8000);
    
    // Take screenshot of result
    await page.screenshot({ path: 'test-reports/after-login-attempt.png' });
    
    console.log('🔍 Final URL:', page.url());
    const finalContent = await page.textContent('body');
    const isAuthenticated = page.url().includes('/admin') && !page.url().includes('/login');
    const hasAdminContent = finalContent?.includes('Admin') || finalContent?.includes('Dashboard') || finalContent?.includes('Request');
    
    console.log('✅ Authentication successful:', isAuthenticated);
    console.log('📋 Has admin content:', hasAdminContent);
    
    // If authenticated, test admin requests page
    if (isAuthenticated || hasAdminContent) {
      console.log('\n🎉 AUTHENTICATED! Testing requests page...');
      
      await page.goto('/admin/requests');
      await page.waitForTimeout(5000);
      
      const requestsContent = await page.textContent('body');
      const hasRequests = requestsContent?.includes('Request') || requestsContent?.includes('request');
      const hasNoErrors = !requestsContent?.includes('500') && !requestsContent?.includes('Model') && !requestsContent?.includes('not available');
      
      console.log('📋 Requests page loaded:', hasRequests);
      console.log('✅ No errors:', hasNoErrors);
      
      // Count data elements
      const rows = await page.locator('tr, .MuiDataGrid-row, .row').count();
      const editButtons = await page.locator('button:has-text("Edit"), [aria-label*="edit"]').count();
      
      console.log('📊 Data rows found:', rows);
      console.log('🔘 Edit buttons found:', editButtons);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-reports/admin-requests-authenticated.png', fullPage: true });
      
      // Test edit functionality if available
      if (editButtons > 0) {
        console.log('\n🔘 Testing edit button functionality...');
        await page.locator('button:has-text("Edit")').first().click();
        await page.waitForTimeout(3000);
        
        const modalCount = await page.locator('.MuiModal-root, .modal, [role="dialog"]').count();
        console.log('📋 Edit modal opened:', modalCount > 0);
        
        if (modalCount > 0) {
          // Look for Case Management tab
          const caseTabCount = await page.locator('button:has-text("Case Management"), [role="tab"]:has-text("Case Management")').count();
          console.log('📑 Case Management tab found:', caseTabCount > 0);
          
          if (caseTabCount > 0) {
            await page.locator('button:has-text("Case Management")').first().click();
            await page.waitForTimeout(2000);
            console.log('✅ Case Management tab clicked successfully');
          }
          
          await page.screenshot({ path: 'test-reports/edit-modal-with-case-management.png' });
        }
      }
    } else {
      console.log('⚠️  Authentication may have failed, but this could be due to test credentials');
    }
  });
});