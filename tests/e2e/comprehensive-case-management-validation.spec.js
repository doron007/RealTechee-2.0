import { test, expect } from '@playwright/test';

test.describe('Comprehensive Case Management Validation', () => {
  // Enhanced login helper with better error handling
  async function loginToAdmin(page) {
    console.log('🔐 Starting admin login process...');
    
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    
    // Wait for login form to be visible
    await page.waitForSelector('input[name="username"], input[type="email"]', { timeout: 10000 });
    
    // Fill login form
    await page.fill('input[name="username"], input[type="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"], input[type="password"]', 'Sababa123!');
    
    // Click sign in button and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
    ]);
    
    // Verify we're in admin area
    await expect(page).toHaveURL(/.*\/admin.*/);
    console.log('✅ Successfully logged into admin area');
  }

  // Enhanced error monitoring helper
  function setupConsoleMonitoring(page) {
    const consoleErrors = [];
    const consoleWarnings = [];
    const consoleMessages = [];
    
    page.on('console', msg => {
      const message = { type: msg.type(), text: msg.text(), timestamp: new Date().toISOString() };
      consoleMessages.push(message);
      
      if (msg.type() === 'error') {
        consoleErrors.push(message);
        console.error(`❌ Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(message);
        console.warn(`⚠️  Console Warning: ${msg.text()}`);
      } else {
        console.log(`[${msg.type()}]`, msg.text());
      }
    });

    return { consoleErrors, consoleWarnings, consoleMessages };
  }

  test('should validate Case Management tab loads without "Model Requests not available" error', async ({ page }) => {
    const { consoleErrors, consoleMessages } = setupConsoleMonitoring(page);
    
    // Login to admin
    await loginToAdmin(page);
    
    // Navigate to admin requests page
    console.log('📋 Navigating to admin requests page...');
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    // Wait for requests grid to load and take screenshot
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 15000 });
    await page.screenshot({ path: 'tests/screenshots/admin-requests-loaded.png', fullPage: true });
    console.log('📸 Screenshot: admin-requests-loaded.png');
    
    // Find and click Edit button on first request
    console.log('🔍 Looking for Edit button...');
    const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-button"], .MuiButtonBase-root:has-text("Edit")').first();
    
    if (await editButton.count() > 0) {
      console.log('✅ Found Edit button, clicking...');
      await editButton.click();
    } else {
      // Fallback: click on first row
      console.log('🔄 No Edit button found, clicking first row...');
      const firstRow = page.locator('[data-testid="requests-grid"] .MuiDataGrid-row, table tbody tr').first();
      await firstRow.click();
    }
    
    // Wait for RequestDetail page to load
    console.log('⏳ Waiting for RequestDetail page to load...');
    await page.waitForSelector('h1, h2, [data-testid="request-detail"], [role="tablist"]', { timeout: 15000 });
    await page.screenshot({ path: 'tests/screenshots/request-detail-loaded.png', fullPage: true });
    console.log('📸 Screenshot: request-detail-loaded.png');
    
    // Verify Case Management tab exists
    console.log('🔍 Looking for Case Management tab...');
    const caseManagementTab = page.locator('button:has-text("Case Management"), .MuiTab-root:has-text("Case Management"), [role="tab"]:has-text("Case Management")');
    
    await expect(caseManagementTab).toBeVisible({ timeout: 10000 });
    console.log('✅ Case Management tab found and visible');
    
    // Clear any existing console errors before clicking
    consoleErrors.length = 0;
    
    // Click the Case Management tab
    console.log('🖱️  Clicking Case Management tab...');
    await caseManagementTab.click();
    
    // Wait for tab content to load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/case-management-tab-active.png', fullPage: true });
    console.log('📸 Screenshot: case-management-tab-active.png');
    
    // CRITICAL: Check for the specific "Model Requests not available" error
    const hasModelRequestsError = consoleErrors.some(error => 
      error.text.includes('Model Requests not available on client') ||
      error.text.includes('Model Requests not available') ||
      error.text.includes('generateClient error')
    );
    
    // Assert no critical initialization error occurred
    expect(hasModelRequestsError).toBeFalsy();
    console.log('✅ NO "Model Requests not available" error detected');
    
    // Verify case management content area is visible
    const caseManagementContent = page.locator(
      '[data-testid="case-management-content"], ' +
      '.case-management, ' +
      '.MuiCard-root, ' +
      '.MuiAccordion-root, ' +
      '.case-overview, ' +
      '.MuiTabPanel-root'
    ).first();
    
    await expect(caseManagementContent).toBeVisible({ timeout: 10000 });
    console.log('✅ Case management content area is visible');
    
    // Check for loading state or actual content
    const hasLoadingOrContent = await page.locator(
      '.MuiCircularProgress-root, ' +
      '.MuiLinearProgress-root, ' +
      '[data-testid="loading"], ' +
      '.case-overview, ' +
      '[data-testid="case-overview"], ' +
      '.MuiTypography-root, ' +
      '.MuiCard-root'
    ).count() > 0;
    
    expect(hasLoadingOrContent).toBeTruthy();
    console.log('✅ Case management shows loading state or actual content');
    
    // Final validation: log all console messages for analysis
    console.log('\n📊 Console Messages Summary:');
    console.log(`Total Messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.forEach(error => console.log(`  - ${error.text}`));
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/case-management-validation-complete.png', fullPage: true });
    console.log('📸 Final screenshot: case-management-validation-complete.png');
  });

  test('should validate Case Management system graceful error handling', async ({ page }) => {
    const { consoleErrors, consoleMessages } = setupConsoleMonitoring(page);
    
    // Login and navigate to case management
    await loginToAdmin(page);
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    // Click first request
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
    }
    
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    
    // Click Case Management tab
    const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
    await caseManagementTab.click();
    
    // Wait for initialization and retry mechanisms
    console.log('⏳ Waiting for initialization and retry mechanisms...');
    await page.waitForTimeout(5000);
    
    // Check for graceful error handling messages
    const hasGracefulHandling = consoleMessages.some(msg => 
      msg.text.includes('still initializing') || 
      msg.text.includes('will retry') ||
      msg.text.includes('Client model') ||
      msg.text.includes('ready for operations') ||
      msg.text.includes('initialization complete') ||
      msg.text.includes('retrying') ||
      msg.text.includes('fallback')
    );
    
    // Check for absence of hard errors
    const hasHardErrors = consoleErrors.some(error => 
      error.text.includes('Cannot read') ||
      error.text.includes('undefined') ||
      error.text.includes('TypeError') ||
      error.text.includes('ReferenceError')
    );
    
    console.log('\n📊 Graceful Error Handling Analysis:');
    console.log(`Has graceful handling: ${hasGracefulHandling}`);
    console.log(`Has hard errors: ${hasHardErrors}`);
    
    // Verify graceful handling is working
    if (hasGracefulHandling || !hasHardErrors) {
      console.log('✅ Graceful error handling is working');
    } else {
      console.log('⚠️  May need better error handling');
    }
    
    // Should not have hard runtime errors
    expect(hasHardErrors).toBeFalsy();
    console.log('✅ No hard runtime errors detected');
  });

  test('should validate Case Management performance and responsiveness', async ({ page }) => {
    const { consoleErrors } = setupConsoleMonitoring(page);
    
    // Start performance monitoring
    await page.evaluate(() => {
      window.performanceMetrics = {
        navigationStart: performance.now()
      };
    });
    
    await loginToAdmin(page);
    
    // Measure requests page load time
    const requestsStartTime = performance.now();
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    const requestsLoadTime = performance.now() - requestsStartTime;
    console.log(`📊 Requests page load time: ${requestsLoadTime.toFixed(2)}ms`);
    
    // Measure request detail navigation
    const detailStartTime = performance.now();
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    const detailLoadTime = performance.now() - detailStartTime;
    console.log(`📊 Request detail load time: ${detailLoadTime.toFixed(2)}ms`);
    
    // Measure Case Management tab activation
    const tabStartTime = performance.now();
    const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
    await caseManagementTab.click();
    await page.waitForTimeout(2000); // Wait for content to render
    const tabActivationTime = performance.now() - tabStartTime;
    console.log(`📊 Case Management tab activation time: ${tabActivationTime.toFixed(2)}ms`);
    
    // Performance assertions (reasonable thresholds for admin interface)
    expect(requestsLoadTime).toBeLessThan(10000); // 10 seconds max for admin page
    expect(detailLoadTime).toBeLessThan(5000); // 5 seconds max for detail view
    expect(tabActivationTime).toBeLessThan(3000); // 3 seconds max for tab activation
    
    console.log('✅ All performance metrics within acceptable thresholds');
    
    // Verify no performance-related errors
    const hasPerformanceErrors = consoleErrors.some(error => 
      error.text.includes('timeout') ||
      error.text.includes('slow') ||
      error.text.includes('memory') ||
      error.text.includes('performance')
    );
    
    expect(hasPerformanceErrors).toBeFalsy();
    console.log('✅ No performance-related errors detected');
  });

  test('should validate multiple Case Management tab interactions', async ({ page }) => {
    const { consoleErrors } = setupConsoleMonitoring(page);
    
    await loginToAdmin(page);
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    // Click first request
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    
    // Test multiple tab switches to ensure stability
    const tabs = ['Details', 'Case Management', 'History'];
    
    for (let i = 0; i < 3; i++) {
      console.log(`\n🔄 Tab switching cycle ${i + 1}`);
      
      for (const tabName of tabs) {
        const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
        if (await tab.count() > 0) {
          console.log(`  Clicking ${tabName} tab...`);
          await tab.click();
          await page.waitForTimeout(1000);
          
          // Verify tab is active
          await expect(tab).toHaveAttribute('aria-selected', 'true');
        }
      }
    }
    
    // Final check - ensure Case Management still works after multiple switches
    const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
    await caseManagementTab.click();
    await page.waitForTimeout(2000);
    
    // Verify no errors accumulated from multiple interactions
    const hasTabSwitchingErrors = consoleErrors.some(error => 
      error.text.includes('Model Requests not available') ||
      error.text.includes('generateClient error') ||
      error.text.includes('client initialization')
    );
    
    expect(hasTabSwitchingErrors).toBeFalsy();
    console.log('✅ No errors from multiple tab interactions');
    
    await page.screenshot({ path: 'tests/screenshots/case-management-multiple-interactions.png', fullPage: true });
    console.log('📸 Screenshot: case-management-multiple-interactions.png');
  });
});