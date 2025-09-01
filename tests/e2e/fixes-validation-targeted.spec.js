import { test, expect } from '@playwright/test';

test.describe('Targeted Fixes Validation - Case Management & Playground', () => {
  // Enhanced monitoring setup
  function setupMonitoring(page) {
    const consoleErrors = [];
    const consoleMessages = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      const message = { type: msg.type(), text: msg.text(), timestamp: Date.now() };
      consoleMessages.push(message);
      
      if (msg.type() === 'error') {
        consoleErrors.push(message);
        console.error(`❌ Console Error: ${msg.text()}`);
      } else {
        console.log(`[${msg.type()}]`, msg.text());
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

    return { consoleErrors, consoleMessages, networkErrors };
  }

  // Admin login helper with correct route
  async function loginToAdmin(page) {
    console.log('🔐 Starting admin login process...');
    
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Wait for login form to load (it shows loading spinner first)
    await page.waitForTimeout(3000);
    
    // Look for email input field with multiple selectors
    const emailInput = page.locator('input[type="email"], input[name="username"], input[placeholder*="email" i]');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    
    await emailInput.fill('info@realtechee.com');
    
    // Look for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await passwordInput.fill('Sababa123!');
    
    // Click sign in button
    const signInButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Sign In")');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      signInButton.click()
    ]);
    
    console.log('✅ Successfully logged into admin area');
  }

  test('should validate Playground fix - No 404 errors and proper navigation', async ({ page }) => {
    const monitoring = setupMonitoring(page);
    
    console.log('🎮 TESTING PLAYGROUND FIX');
    console.log('Testing: Playground accessibility and navigation without 404 errors');
    
    // TEST 1: Playground Homepage Access
    console.log('\n📍 Test 1: Playground Homepage Access');
    
    const response = await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // CRITICAL: Verify no 404 error for playground
    expect(response.status()).toBe(200);
    console.log('✅ Playground homepage accessible (HTTP 200) - NO 404 ERROR');
    
    // Verify main elements load
    await expect(page.locator('.header h1')).toContainText('RealTechee GraphQL Playground');
    await expect(page.locator('.playground-grid')).toBeVisible();
    console.log('✅ Playground content loaded successfully');
    
    // TEST 2: GraphiQL Navigation
    console.log('\n📍 Test 2: GraphiQL Navigation');
    
    const graphiqlLink = page.locator('a[href="./graphiql.html"]');
    await expect(graphiqlLink).toBeVisible();
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      graphiqlLink.click()
    ]);
    
    // CRITICAL: Verify GraphiQL page loads (no 404)
    expect(page.url()).toMatch(/\/playground\/graphiql\.html$/);
    console.log('✅ GraphiQL navigation successful - NO 404 ERROR');
    
    // TEST 3: Overall Playground Error Check
    console.log('\n📍 Test 3: Overall Playground Error Check');
    
    const playground404Errors = monitoring.networkErrors.filter(error => 
      error.status === 404 && error.url.includes('playground')
    );
    
    expect(playground404Errors.length).toBe(0);
    console.log(`✅ PLAYGROUND FIX VALIDATED: No 404 errors (checked ${monitoring.networkErrors.length} network requests)`);
    
    await page.screenshot({ path: 'tests/screenshots/playground-fix-validated.png', fullPage: true });
    console.log('📸 Screenshot: playground-fix-validated.png');
  });

  test('should validate Case Management fix - No "Model Requests not available" error', async ({ page }) => {
    const monitoring = setupMonitoring(page);
    
    console.log('🏢 TESTING CASE MANAGEMENT FIX');
    console.log('Testing: Case Management tab loads without "Model Requests not available" error');
    
    // Clear any existing errors
    monitoring.consoleErrors.length = 0;
    
    // Login to admin
    await loginToAdmin(page);
    
    // Navigate to admin requests
    console.log('\n📍 Navigating to admin requests...');
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    // Wait for requests grid
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 20000 });
    console.log('✅ Admin requests page loaded');
    
    // Find and click first request
    console.log('\n📍 Opening first request for editing...');
    const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-button"]').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
    } else {
      // Fallback: click first row
      const firstRow = page.locator('[data-testid="requests-grid"] .MuiDataGrid-row, table tbody tr').first();
      await firstRow.click();
    }
    
    // Wait for request detail page
    await page.waitForSelector('[role="tablist"], h1, h2', { timeout: 20000 });
    console.log('✅ Request detail page loaded');
    
    // CRITICAL TEST: Click Case Management Tab
    console.log('\n🎯 CRITICAL TEST: Clicking Case Management Tab');
    
    const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management"), button:has-text("Case Management")');
    await expect(caseManagementTab).toBeVisible({ timeout: 15000 });
    
    // Clear errors before the critical action
    monitoring.consoleErrors.length = 0;
    
    console.log('🖱️  Clicking Case Management tab...');
    await caseManagementTab.click();
    
    // Wait for potential errors to surface
    await page.waitForTimeout(5000);
    
    // CRITICAL VALIDATION: Check for "Model Requests not available" error
    const modelRequestsErrors = monitoring.consoleErrors.filter(error => 
      error.text.includes('Model Requests not available on client') ||
      error.text.includes('Model Requests not available') ||
      error.text.includes('generateClient error')
    );
    
    expect(modelRequestsErrors.length).toBe(0);
    console.log('✅ CASE MANAGEMENT FIX VALIDATED: NO "Model Requests not available" errors detected');
    
    // Additional validation: Check for case management content
    const hasContent = await page.locator(
      '[data-testid="case-management-content"], ' +
      '.case-management, ' +
      '.MuiCard-root, ' +
      '.MuiTabPanel-root, ' +
      '.MuiCircularProgress-root'
    ).count() > 0;
    
    expect(hasContent).toBeTruthy();
    console.log('✅ Case Management content area is visible');
    
    // Final error summary
    console.log(`\n📊 Error Summary: ${monitoring.consoleErrors.length} console errors total`);
    if (monitoring.consoleErrors.length > 0) {
      console.log('Console errors found:');
      monitoring.consoleErrors.forEach(error => console.log(`  - ${error.text}`));
    }
    
    await page.screenshot({ path: 'tests/screenshots/case-management-fix-validated.png', fullPage: true });
    console.log('📸 Screenshot: case-management-fix-validated.png');
  });

  test('should validate both fixes work together in integrated workflow', async ({ page }) => {
    const monitoring = setupMonitoring(page);
    
    console.log('🔗 TESTING INTEGRATED WORKFLOW');
    console.log('Testing: Both fixes work together without conflicts');
    
    // PHASE 1: Test Playground
    console.log('\n🎮 PHASE 1: Playground Test');
    
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    await expect(page.locator('.header h1')).toBeVisible();
    
    const playgroundErrors = monitoring.networkErrors.filter(error => 
      error.status === 404 && error.url.includes('playground')
    );
    expect(playgroundErrors.length).toBe(0);
    console.log('✅ Playground working correctly');
    
    // PHASE 2: Test Case Management
    console.log('\n🏢 PHASE 2: Case Management Test');
    
    // Clear errors for case management test
    monitoring.consoleErrors.length = 0;
    
    await loginToAdmin(page);
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 20000 });
    
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="tablist"]', { timeout: 20000 });
      
      const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
      await caseManagementTab.click();
      await page.waitForTimeout(3000);
      
      const caseManagementErrors = monitoring.consoleErrors.filter(error => 
        error.text.includes('Model Requests not available')
      );
      expect(caseManagementErrors.length).toBe(0);
      console.log('✅ Case Management working correctly');
    }
    
    // PHASE 3: Cross-System Navigation Test
    console.log('\n🔄 PHASE 3: Cross-System Navigation');
    
    // Navigate back to playground to ensure no conflicts
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    await expect(page.locator('.playground-grid')).toBeVisible();
    console.log('✅ Cross-system navigation working');
    
    // FINAL VALIDATION
    const finalPlaygroundErrors = monitoring.networkErrors.filter(error => 
      error.status === 404 && error.url.includes('playground')
    );
    const finalCaseManagementErrors = monitoring.consoleErrors.filter(error => 
      error.text.includes('Model Requests not available')
    );
    
    expect(finalPlaygroundErrors.length).toBe(0);
    expect(finalCaseManagementErrors.length).toBe(0);
    
    console.log('\n🏆 INTEGRATION SUCCESS SUMMARY:');
    console.log('  ✅ Playground Fix: No 404 errors detected');
    console.log('  ✅ Case Management Fix: No "Model Requests not available" errors');
    console.log('  ✅ Cross-system integration: Seamless navigation');
    
    await page.screenshot({ path: 'tests/screenshots/integrated-workflow-success.png', fullPage: true });
    console.log('📸 Screenshot: integrated-workflow-success.png');
  });

  test('should validate error resilience and performance', async ({ page }) => {
    const monitoring = setupMonitoring(page);
    
    console.log('⚡ TESTING ERROR RESILIENCE & PERFORMANCE');
    
    // Performance measurement
    const startTime = performance.now();
    
    // Test 1: Playground Performance
    let testStart = performance.now();
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    const playgroundTime = performance.now() - testStart;
    
    expect(playgroundTime).toBeLessThan(5000); // 5 second limit
    console.log(`✅ Playground performance: ${playgroundTime.toFixed(2)}ms (< 5000ms)`);
    
    // Test 2: Admin System Performance
    testStart = performance.now();
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for form load
    const loginTime = performance.now() - testStart;
    
    expect(loginTime).toBeLessThan(8000); // 8 second limit for login page
    console.log(`✅ Login page performance: ${loginTime.toFixed(2)}ms (< 8000ms)`);
    
    // Test 3: Error Resilience - Multiple Navigation Cycles
    console.log('\n🛡️  Testing Error Resilience');
    
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
    }
    
    // Check for accumulated errors
    const criticalErrors = monitoring.consoleErrors.filter(error => 
      error.text.includes('Model Requests not available') ||
      error.text.includes('TypeError') ||
      error.text.includes('ReferenceError')
    );
    
    const criticalNetworkErrors = monitoring.networkErrors.filter(error => 
      (error.status === 404 && error.url.includes('playground')) ||
      error.status === 500
    );
    
    expect(criticalErrors.length).toBe(0);
    expect(criticalNetworkErrors.length).toBe(0);
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ Resilience test completed in ${totalTime.toFixed(2)}ms`);
    console.log(`✅ No critical errors during ${3} navigation cycles`);
    
    console.log('\n🎯 PERFORMANCE & RESILIENCE SUMMARY:');
    console.log(`  ✅ Playground Performance: ${playgroundTime.toFixed(2)}ms`);
    console.log(`  ✅ Login Performance: ${loginTime.toFixed(2)}ms`);
    console.log(`  ✅ Error Resilience: ${criticalErrors.length} critical errors`);
    console.log(`  ✅ Network Resilience: ${criticalNetworkErrors.length} critical network errors`);
  });
});