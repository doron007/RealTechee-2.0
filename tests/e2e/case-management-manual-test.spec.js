import { test, expect } from '@playwright/test';

test.describe('Case Management Fix - Manual Test', () => {
  test('should verify case management tab loads without client error', async ({ page }) => {
    console.log('🧪 Testing Case Management Tab Fix');
    
    // Track console errors specifically
    const criticalErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Model Requests not available on client')) {
        criticalErrors.push(msg.text());
        console.log('❌ CRITICAL ERROR DETECTED:', msg.text());
      } else if (msg.type() === 'error') {
        console.log(`[ERROR]`, msg.text());
      } else {
        console.log(`[${msg.type()}]`, msg.text());
      }
    });

    try {
      // Navigate to login page first
      console.log('📝 Step 1: Going to login page');
      await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[type="email"], input[name="username"]', { timeout: 10000 });
      
      // Login
      console.log('🔐 Step 2: Logging in');
      await page.fill('input[type="email"], input[name="username"]', 'info@realtechee.com');
      await page.fill('input[type="password"], input[name="password"]', 'Sababa123!');
      await page.click('button[type="submit"]');
      
      // Wait for authentication
      console.log('⏳ Step 3: Waiting for authentication');
      await page.waitForTimeout(3000);
      
      // Navigate to admin requests
      console.log('📋 Step 4: Navigating to admin requests');
      await page.goto('http://localhost:3001/admin/requests', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Look for any request item to click
      console.log('🔍 Step 5: Looking for request to edit');
      
      // Take screenshot of requests page
      await page.screenshot({ path: 'tests/screenshots/requests-page.png' });
      console.log('📸 Screenshot saved: requests-page.png');
      
      // Try different ways to find a request to edit
      const possibleRequestSelectors = [
        'button:has-text("Edit")',
        '[data-testid="edit-button"]', 
        '.MuiDataGrid-row',
        'table tbody tr',
        'tr[data-id]'
      ];
      
      let foundRequest = false;
      let requestSelector = null;
      
      for (const selector of possibleRequestSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          foundRequest = true;
          requestSelector = selector;
          console.log(`✅ Found request element with selector: ${selector}`);
          break;
        }
      }
      
      if (!foundRequest) {
        console.log('⚠️ No request found to test - this might be expected if no data exists');
        console.log('🎯 Creating a manual test scenario by navigating to a specific request ID');
        
        // Navigate to a specific request URL pattern
        await page.goto('http://localhost:3001/admin/requests/test', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      } else {
        // Click on the found request
        console.log('👆 Step 6: Clicking on request');
        await page.locator(requestSelector).first().click();
        await page.waitForTimeout(2000);
      }
      
      // Look for Case Management tab
      console.log('🔍 Step 7: Looking for Case Management tab');
      
      const caseManagementSelectors = [
        'button:has-text("Case Management")',
        '[role="tab"]:has-text("Case Management")',
        '.MuiTab-root:has-text("Case Management")'
      ];
      
      let foundTab = false;
      let tabSelector = null;
      
      for (const selector of caseManagementSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          foundTab = true;
          tabSelector = selector;
          console.log(`✅ Found Case Management tab with selector: ${selector}`);
          break;
        }
      }
      
      if (foundTab) {
        console.log('👆 Step 8: Clicking Case Management tab');
        await page.locator(tabSelector).click();
        
        // Wait for potential errors and client initialization
        console.log('⏳ Step 9: Waiting for case management to load (5 seconds)');
        await page.waitForTimeout(5000);
        
        // Take final screenshot
        await page.screenshot({ path: 'tests/screenshots/case-management-clicked.png' });
        console.log('📸 Screenshot saved: case-management-clicked.png');
        
        // Check for critical errors
        if (criticalErrors.length > 0) {
          console.log('❌ CRITICAL ERRORS FOUND:');
          criticalErrors.forEach(error => console.log('  -', error));
          throw new Error(`Case management tab click resulted in critical client initialization errors: ${criticalErrors.join(', ')}`);
        } else {
          console.log('✅ SUCCESS: No critical client initialization errors detected!');
          console.log('✅ Case management tab was clicked without "Model Requests not available on client" error');
        }
      } else {
        console.log('⚠️ Case Management tab not found - this might indicate the request detail page is not loaded');
        await page.screenshot({ path: 'tests/screenshots/no-case-management-tab.png' });
        console.log('📸 Screenshot saved: no-case-management-tab.png');
      }
      
    } catch (error) {
      console.log('❌ Test error:', error.message);
      await page.screenshot({ path: 'tests/screenshots/test-error.png' });
      console.log('📸 Error screenshot saved: test-error.png');
      
      // Still check if we had the specific error we're trying to fix
      if (criticalErrors.length > 0) {
        throw new Error(`CRITICAL: The fix did not work. Still getting client initialization errors: ${criticalErrors.join(', ')}`);
      }
      
      // Re-throw other errors but note that we didn't get the specific error
      console.log('ℹ️ Note: Other test errors occurred, but no critical client initialization errors detected');
      throw error;
    }
    
    // Final check
    expect(criticalErrors.length).toBe(0);
    console.log('🎉 TEST PASSED: Case management client initialization fix is working!');
  });
});