import { test, expect } from '@playwright/test';

test.describe('REAL DATA TEST - RequestDetail Loading', () => {
  function setupMonitoring(page) {
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({ text: msg.text(), timestamp: Date.now() });
        console.error(`❌ Console Error: ${msg.text()}`);
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
        console.error(`🌐 Network Error: ${response.status()} - ${response.url()}`);
      }
    });

    return { consoleErrors, networkErrors };
  }

  // Admin login helper
  async function loginToAdmin(page) {
    console.log('🔐 Starting admin login process...');
    
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const emailInput = page.locator('input[type="email"], input[name="username"], input[placeholder*="email" i]');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill('info@realtechee.com');
    
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await passwordInput.fill('Sababa123!');
    
    const signInButton = page.locator('button[type="submit"]:has-text("Sign in")');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      signInButton.click()
    ]);
    
    console.log('✅ Successfully logged into admin area');
  }

  test('🎯 REAL DATA - RequestDetail loads without critical errors', async ({ page }) => {
    const monitoring = setupMonitoring(page);
    
    console.log('🚀 TESTING REQUEST DETAIL LOADING');
    console.log('=' .repeat(60));
    
    // Login to admin
    await loginToAdmin(page);
    
    // Navigate to admin requests
    console.log('📍 Navigating to admin requests...');
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    // Wait for requests grid
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 20000 });
    console.log('✅ Admin requests page loaded');
    
    // Take screenshot of requests grid
    await page.screenshot({ path: 'tests/screenshots/request-detail-test-grid.png', fullPage: true });
    
    // Clear errors before clicking edit
    monitoring.consoleErrors.length = 0;
    
    // Find and click first edit button in Actions column
    console.log('📍 Clicking first edit button...');
    
    // Look for the edit button in the actions column
    const editButton = page.locator('tbody tr').first().locator('td').last().locator('button, a').first();
    
    console.log(`Edit buttons found: ${await editButton.count()}`);
    
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Wait for detail page/modal to load
      console.log('⏳ Waiting for RequestDetail component to load...');
      await page.waitForTimeout(5000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Take screenshot after clicking edit
      await page.screenshot({ path: 'tests/screenshots/request-detail-test-after-edit.png', fullPage: true });
      
      // CRITICAL VALIDATION: Check for compilation errors
      const compilationErrors = monitoring.consoleErrors.filter(error => 
        error.text.includes('notificationTemplatesAPI') ||
        error.text.includes('Export') && error.text.includes('does not exist') ||
        error.text.includes('meetingNotificationService')
      );
      
      const graphqlErrors = monitoring.consoleErrors.filter(error => 
        error.text.includes('Error listing Quotes') ||
        error.text.includes('GraphQL')
      );
      
      console.log('📊 ERROR ANALYSIS:');
      console.log(`  Compilation errors: ${compilationErrors.length}`);
      console.log(`  GraphQL errors: ${graphqlErrors.length}`);
      console.log(`  Total console errors: ${monitoring.consoleErrors.length}`);
      console.log(`  Network errors: ${monitoring.networkErrors.length}`);
      
      // Log all errors for debugging
      if (monitoring.consoleErrors.length > 0) {
        console.log('❌ All console errors:');
        monitoring.consoleErrors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.text}`);
        });
      }
      
      // CRITICAL ASSERTION: NO compilation errors blocking RequestDetail
      expect(compilationErrors.length).toBe(0);
      console.log('✅ CRITICAL SUCCESS: NO compilation errors blocking RequestDetail');
      
      // Look for RequestDetail UI elements
      const hasRequestDetailUI = await page.locator(
        'h1, h2, [role="tablist"], .MuiTab-root, button:has-text("Details"), button:has-text("Case Management")'
      ).count() > 0;
      
      expect(hasRequestDetailUI).toBeTruthy();
      console.log('✅ RequestDetail UI elements are visible');
      
    } else {
      console.log('❌ No edit button found - cannot test RequestDetail loading');
      throw new Error('Edit button not found');
    }
    
    console.log('\n🏆 REQUEST DETAIL LOADING TEST COMPLETE');
    console.log('✅ RequestDetail component loads without critical compilation errors');
    console.log('📸 Screenshots saved for evidence');
  });
});