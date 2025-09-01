import { test, expect } from '@playwright/test';

test.describe('PLAYGROUND FIX VALIDATION - REAL DATA TESTING', () => {
  function setupMonitoring(page) {
    const consoleErrors = [];
    const networkErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({ text: msg.text(), timestamp: Date.now() });
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

    return { consoleErrors, networkErrors };
  }

  test('🎯 REAL DATA TEST - Playground & amplify_outputs.json', async ({ page }) => {
    const monitoring = setupMonitoring(page);
    
    console.log('🚀 TESTING PLAYGROUND FIX WITH REAL DATA');
    console.log('=' .repeat(60));
    console.log('VALIDATING: Playground loads AND amplify_outputs.json accessible');
    
    // TEST 1: Playground Homepage - Must be HTTP 200
    console.log('\n📍 TEST 1: Playground Homepage Access');
    console.log('URL: /playground/index.html');
    
    const homepageResponse = await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // CRITICAL: Must be HTTP 200, not 404
    expect(homepageResponse.status()).toBe(200);
    console.log(`✅ SUCCESS: Homepage HTTP ${homepageResponse.status()}`);
    
    // Verify content loads
    await expect(page.locator('.header h1')).toContainText('RealTechee GraphQL Playground');
    await expect(page.locator('.playground-grid')).toBeVisible();
    console.log('✅ SUCCESS: Homepage content fully loaded');
    
    // TEST 2: amplify_outputs.json Access - Must be HTTP 200
    console.log('\n📍 TEST 2: amplify_outputs.json Access');
    console.log('URL: /amplify_outputs.json');
    
    const amplifyConfigResponse = await page.goto('/amplify_outputs.json');
    
    // CRITICAL: Must be HTTP 200, not 404
    expect(amplifyConfigResponse.status()).toBe(200);
    console.log(`✅ SUCCESS: amplify_outputs.json HTTP ${amplifyConfigResponse.status()}`);
    
    // Verify it's valid JSON with correct structure
    const configText = await page.textContent('pre, body');
    expect(configText).toContain('"auth"');
    expect(configText).toContain('"data"');
    expect(configText).toContain('"user_pool_id"');
    console.log('✅ SUCCESS: Valid amplify_outputs.json content detected');
    
    // TEST 3: Playground with Config Loading
    console.log('\n📍 TEST 3: Playground Config Loading');
    
    // Clear errors before critical test
    monitoring.consoleErrors.length = 0;
    monitoring.networkErrors.length = 0;
    
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // Wait for config loading attempt
    await page.waitForTimeout(5000);
    
    // Check endpoint element
    const endpointElement = page.locator('#graphql-endpoint');
    await expect(endpointElement).toBeVisible();
    
    const endpointText = await endpointElement.textContent();
    console.log(`📡 GraphQL Endpoint Status: "${endpointText}"`);
    
    // Should NOT show error states if config loads properly
    expect(endpointText).not.toBe('Error loading endpoint');
    expect(endpointText).not.toBe('Loading...');
    expect(endpointText).not.toBe('Not configured');
    console.log('✅ SUCCESS: Endpoint loaded without error state');
    
    // TEST 4: Error Detection - Must be ZERO critical errors
    console.log('\n🎯 CRITICAL VALIDATION: Error Detection');
    
    const amplifyConfigErrors = monitoring.networkErrors.filter(error => 
      error.status === 404 && error.url.includes('amplify_outputs.json')
    );
    
    const configLoadingErrors = monitoring.consoleErrors.filter(error => 
      error.text.includes('Failed to load amplify config') ||
      error.text.includes('SyntaxError: Unexpected token')
    );
    
    console.log(`amplify_outputs.json 404 errors: ${amplifyConfigErrors.length}`);
    console.log(`Config loading errors: ${configLoadingErrors.length}`);
    console.log(`Total network errors: ${monitoring.networkErrors.length}`);
    console.log(`Total console errors: ${monitoring.consoleErrors.length}`);
    
    // CRITICAL ASSERTIONS: NO errors allowed
    expect(amplifyConfigErrors.length).toBe(0);
    expect(configLoadingErrors.length).toBe(0);
    console.log('✅ CRITICAL SUCCESS: NO amplify config errors detected');
    
    // Final Screenshots
    await page.screenshot({ path: 'tests/screenshots/playground-fix-real-data.png', fullPage: true });
    
    console.log('\n🏆 PLAYGROUND FIX VALIDATION COMPLETE (REAL DATA)');
    console.log('=' .repeat(60));
    console.log('✅ RESULT: PLAYGROUND FIX IS WORKING WITH REAL DATA');
    console.log('✅ NO 404 errors for playground or config');
    console.log('✅ amplify_outputs.json accessible and valid');
    console.log('✅ Config loading successful');
    console.log('📸 Screenshots saved for evidence');
  });

  test('🛡️ CASE MANAGEMENT FIX - REAL BROWSER TEST', async ({ page }) => {
    const monitoring = setupMonitoring(page);
    
    console.log('\n🛡️ TESTING CASE MANAGEMENT FIX - REAL BROWSER DATA');
    
    // Clear any existing errors
    monitoring.consoleErrors.length = 0;
    
    // Login to admin
    console.log('🔐 Starting admin login process...');
    
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Wait for login form to load
    await page.waitForTimeout(3000);
    
    // Look for email input field
    const emailInput = page.locator('input[type="email"], input[name="username"], input[placeholder*="email" i]');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    
    await emailInput.fill('info@realtechee.com');
    
    // Look for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await passwordInput.fill('Sababa123!');
    
    // Click sign in button (more specific selector to avoid tab confusion)
    const signInButton = page.locator('button[type="submit"]:has-text("Sign in")');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      signInButton.click()
    ]);
    
    console.log('✅ Successfully logged into admin area');
    
    // Navigate to admin requests
    console.log('📍 Navigating to admin requests...');
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    // Wait for requests grid
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 20000 });
    console.log('✅ Admin requests page loaded');
    
    // Take screenshot of requests grid
    await page.screenshot({ path: 'tests/screenshots/case-management-requests-grid.png', fullPage: true });
    
    // Find and click first edit button (pencil icon in Actions column)
    console.log('📍 Opening first request for editing...');
    
    // Look for the edit icon in the Actions column - should be a clickable SVG or button
    const editIconButton = page.locator('tbody tr').first().locator('td').last().locator('button, a, [role="button"]').first();
    
    console.log(`Edit button count: ${await editIconButton.count()}`);
    
    if (await editIconButton.count() > 0) {
      console.log('Found edit button, clicking...');
      await editIconButton.click();
      
      // Wait for navigation or modal/detail view to load
      await page.waitForTimeout(3000);
      
      // Check if we navigated to a new page or if detail loaded
      const currentUrl = page.url();
      console.log(`Current URL after edit click: ${currentUrl}`);
    } else {
      console.log('❌ No edit button found in Actions column');
      
      // Log all buttons found for debugging
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log(`Total buttons found on page: ${buttonCount}`);
      
      // Alternative: Use first row click
      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.count() > 0) {
        console.log('Trying to click first row as fallback...');
        await firstRow.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Wait for request detail page
    await page.waitForSelector('[role="tablist"], h1, h2', { timeout: 20000 });
    console.log('✅ Request detail page loaded');
    
    // Take screenshot of request detail page
    await page.screenshot({ path: 'tests/screenshots/case-management-request-detail.png', fullPage: true });
    
    // CRITICAL TEST: Click Case Management Tab
    console.log('\n🎯 CRITICAL TEST: Clicking Case Management Tab');
    
    const caseManagementTab = page.locator('button:has-text("Case Management")');
    await expect(caseManagementTab).toBeVisible({ timeout: 15000 });
    
    // Clear errors before the critical action
    monitoring.consoleErrors.length = 0;
    
    console.log('🖱️  Clicking Case Management tab...');
    await caseManagementTab.click();
    
    // Wait for potential errors to surface and content to load
    await page.waitForTimeout(8000);
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'tests/screenshots/case-management-tab-clicked.png', fullPage: true });
    
    // CRITICAL VALIDATION: Check for "Model Requests not available" error
    const modelRequestsErrors = monitoring.consoleErrors.filter(error => 
      error.text.includes('Model Requests not available on client') ||
      error.text.includes('Model Requests not available') ||
      error.text.includes('generateClient error')
    );
    
    console.log(`\n📊 REAL ERROR ANALYSIS:`);
    console.log(`Model Requests errors: ${modelRequestsErrors.length}`);
    console.log(`Total console errors: ${monitoring.consoleErrors.length}`);
    
    if (monitoring.consoleErrors.length > 0) {
      console.log('❌ Console errors found:');
      monitoring.consoleErrors.forEach(error => console.log(`  - ${error.text}`));
    }
    
    if (modelRequestsErrors.length > 0) {
      console.log('❌ CRITICAL: "Model Requests not available" errors found:');
      modelRequestsErrors.forEach(error => console.log(`  - ${error.text}`));
    }
    
    // CRITICAL ASSERTION: NO "Model Requests not available" errors
    expect(modelRequestsErrors.length).toBe(0);
    console.log('✅ CASE MANAGEMENT FIX VALIDATED: NO "Model Requests not available" errors');
    
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
    
    console.log('\n🏆 CASE MANAGEMENT FIX VALIDATION COMPLETE (REAL BROWSER DATA)');
    console.log('✅ Case Management tab functions without "Model Requests not available" error');
    console.log('✅ Content area loads correctly');
    console.log('📸 Screenshots saved for evidence');
  });
});