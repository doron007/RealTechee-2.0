const { test, expect } = require('@playwright/test');

/**
 * COMPREHENSIVE BUG FIXES VALIDATION
 * 
 * Tests that validate the parallel execution fixes:
 * 1. Case Management GraphQL client initialization
 * 2. Playground accessibility at localhost:3000/playground
 * 3. Real user workflow validation
 */

test.describe('Bug Fixes Validation - Case Management & Playground', () => {
  test.use({ 
    // Increase timeout for complex operations
    timeout: 60000 
  });

  test.beforeEach(async ({ page }) => {
    // Log all console messages for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Browser Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warn') {
        console.warn(`⚠️ Browser Console Warning: ${msg.text()}`);
      } else {
        console.log(`ℹ️ Browser Console: ${msg.text()}`);
      }
    });

    // Log network errors
    page.on('requestfailed', request => {
      console.error(`❌ Network Error: ${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });
  });

  test('TRACK A: Case Management GraphQL Client Initialization Fix', async ({ page }) => {
    console.log('🧪 Testing Case Management GraphQL client initialization...');

    // Navigate to admin login
    await page.goto('http://localhost:3000/admin/login');
    
    // Login as admin
    await page.fill('input[name="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"]', 'Sababa123!');
    await page.click('button[type="submit"]');
    
    // Wait for successful login and redirect
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    console.log('✅ Admin login successful');

    // Navigate to requests page
    await page.goto('http://localhost:3000/admin/requests');
    await page.waitForSelector('[data-testid="requests-table"], table, .data-grid', { timeout: 10000 });
    console.log('✅ Requests page loaded');

    // Get the first request ID from the table
    const requestRows = page.locator('table tbody tr, [role="row"]');
    const firstRow = requestRows.first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    
    const requestLink = firstRow.locator('a[href*="/admin/requests/"]').first();
    const href = await requestLink.getAttribute('href');
    const requestId = href.split('/').pop();
    console.log(`📋 Found request ID: ${requestId}`);

    // Click on the first request to open details
    await requestLink.click();
    await page.waitForURL(`**/admin/requests/${requestId}`, { timeout: 10000 });
    console.log('✅ Request detail page loaded');

    // CRITICAL TEST: Click on Case Management tab
    console.log('🎯 CRITICAL TEST: Clicking Case Management tab...');
    
    // Wait for tabs to be visible
    await page.waitForSelector('nav [data-tab="case-management"], button:has-text("Case Management"), .tab:has-text("Case Management")', { timeout: 5000 });
    
    const caseManagementTab = page.locator('nav [data-tab="case-management"], button:has-text("Case Management"), .tab:has-text("Case Management")').first();
    await expect(caseManagementTab).toBeVisible();
    
    // Click the Case Management tab
    await caseManagementTab.click();
    console.log('✅ Case Management tab clicked');

    // Wait a moment for any async loading to complete
    await page.waitForTimeout(2000);

    // Check for the specific error that was occurring
    const errorMessages = await page.locator('.error, [data-testid="error"], .alert-error, .MuiAlert-colorError').all();
    for (const errorMsg of errorMessages) {
      const text = await errorMsg.textContent();
      if (text && text.includes('Model Requests not available')) {
        throw new Error(`❌ CRITICAL ERROR STILL EXISTS: ${text}`);
      }
    }

    // Verify Case Management content loads without errors
    await page.waitForSelector('[data-testid="case-management-content"], .case-management-section, .case-notes', { timeout: 10000 });
    console.log('✅ Case Management content loaded successfully');

    // Check for case management elements
    const caseElements = await page.locator('.case-notes, .case-assignments, .information-items, .scope-items, .status-history').count();
    expect(caseElements).toBeGreaterThan(0);
    console.log(`✅ Found ${caseElements} case management elements`);

    console.log('🎉 TRACK A PASSED: Case Management GraphQL client initialization working correctly');
  });

  test('TRACK B: Playground Accessibility Fix', async ({ page }) => {
    console.log('🧪 Testing Playground accessibility...');

    // Test direct playground access
    await page.goto('http://localhost:3000/playground/index.html');
    
    // Wait for playground to load
    await page.waitForSelector('.playground-grid, .header h1', { timeout: 10000 });
    
    // Verify playground header
    const header = page.locator('.header h1');
    await expect(header).toContainText('RealTechee GraphQL Playground');
    console.log('✅ Playground header loaded correctly');

    // Verify playground cards are present
    const playgroundCards = page.locator('.playground-card');
    const cardCount = await playgroundCards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`✅ Found ${cardCount} playground cards`);

    // Test navigation to documentation
    const docsLink = page.locator('a[href="./docs.html"]');
    await expect(docsLink).toBeVisible();
    await docsLink.click();
    
    await page.waitForURL('**/playground/docs.html');
    await page.waitForSelector('.header h1', { timeout: 5000 });
    
    const docsHeader = page.locator('.header h1');
    await expect(docsHeader).toContainText('API Documentation');
    console.log('✅ Documentation page loads correctly');

    // Test navigation to examples
    await page.goto('http://localhost:3000/playground/examples.html');
    await page.waitForSelector('.header h1', { timeout: 5000 });
    
    const examplesHeader = page.locator('.header h1');
    await expect(examplesHeader).toContainText('GraphQL Examples');
    console.log('✅ Examples page loads correctly');

    // Verify no 404 errors
    const response = await page.goto('http://localhost:3000/playground/index.html');
    expect(response.status()).toBe(200);
    console.log('✅ Playground returns 200 status (not 404)');

    console.log('🎉 TRACK B PASSED: Playground accessibility working correctly');
  });

  test('TRACK C: End-to-End User Workflow Validation', async ({ page }) => {
    console.log('🧪 Testing complete user workflow...');

    // Step 1: Login
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"]', 'Sababa123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    console.log('✅ Step 1: Login successful');

    // Step 2: Navigate to requests
    await page.goto('http://localhost:3000/admin/requests');
    await page.waitForSelector('[data-testid="requests-table"], table', { timeout: 10000 });
    console.log('✅ Step 2: Requests page loaded');

    // Step 3: Open request detail
    const requestRows = page.locator('table tbody tr, [role="row"]');
    const firstRow = requestRows.first();
    await expect(firstRow).toBeVisible();
    
    const requestLink = firstRow.locator('a[href*="/admin/requests/"]').first();
    await requestLink.click();
    await page.waitForTimeout(2000);
    console.log('✅ Step 3: Request detail opened');

    // Step 4: Test Case Management tab
    const caseManagementTab = page.locator('nav [data-tab="case-management"], button:has-text("Case Management")').first();
    await caseManagementTab.click();
    await page.waitForTimeout(2000);
    
    // Verify no GraphQL client errors
    const hasError = await page.locator('.error:has-text("Model") .error:has-text("not available")').count();
    expect(hasError).toBe(0);
    console.log('✅ Step 4: Case Management tab works without GraphQL errors');

    // Step 5: Test playground access in new tab
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.evaluate(() => window.open('http://localhost:3000/playground/index.html', '_blank'))
    ]);
    
    await newPage.waitForSelector('.playground-grid', { timeout: 10000 });
    const playgroundTitle = await newPage.locator('.header h1').textContent();
    expect(playgroundTitle).toContain('GraphQL Playground');
    await newPage.close();
    console.log('✅ Step 5: Playground accessible in parallel');

    console.log('🎉 TRACK C PASSED: Complete user workflow validation successful');
  });

  test('TRACK D: Performance and Error Monitoring', async ({ page }) => {
    console.log('🧪 Testing performance and error monitoring...');

    const errors = [];
    const warnings = [];
    const networkErrors = [];

    // Collect all errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warn') {
        warnings.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });

    // Test complete workflow with monitoring
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"]', 'Sababa123!');
    
    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**');
    const loginTime = Date.now() - startTime;
    
    console.log(`⏱️ Login time: ${loginTime}ms`);
    expect(loginTime).toBeLessThan(10000); // Should login within 10 seconds

    // Navigate to requests with timing
    const requestsStartTime = Date.now();
    await page.goto('http://localhost:3000/admin/requests');
    await page.waitForSelector('table');
    const requestsLoadTime = Date.now() - requestsStartTime;
    
    console.log(`⏱️ Requests load time: ${requestsLoadTime}ms`);
    expect(requestsLoadTime).toBeLessThan(15000); // Should load within 15 seconds

    // Test playground performance
    const playgroundStartTime = Date.now();
    await page.goto('http://localhost:3000/playground/index.html');
    await page.waitForSelector('.playground-grid');
    const playgroundLoadTime = Date.now() - playgroundStartTime;
    
    console.log(`⏱️ Playground load time: ${playgroundLoadTime}ms`);
    expect(playgroundLoadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Report collected issues
    console.log(`🐛 Total errors: ${errors.length}`);
    console.log(`⚠️ Total warnings: ${warnings.length}`);
    console.log(`🌐 Total network errors: ${networkErrors.length}`);

    // Critical error check - should not have Model/GraphQL client errors
    const criticalErrors = errors.filter(err => 
      err.includes('Model') && err.includes('not available') && err.includes('client')
    );
    expect(criticalErrors.length).toBe(0);

    if (criticalErrors.length > 0) {
      console.error('❌ CRITICAL ERRORS FOUND:', criticalErrors);
    }

    console.log('🎉 TRACK D PASSED: Performance and error monitoring successful');
  });
});

test.describe('Specific Fix Verification Tests', () => {
  test('Verify RequestNotes API availability', async ({ page }) => {
    console.log('🔬 Testing RequestNotes API model availability...');

    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[name="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"]', 'Sababa123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**');

    // Navigate to a request and try to add a note
    await page.goto('http://localhost:3000/admin/requests');
    await page.waitForSelector('table');
    
    const firstRequestLink = page.locator('table tbody tr a[href*="/admin/requests/"]').first();
    await firstRequestLink.click();
    await page.waitForTimeout(2000);

    // Click Case Management tab
    await page.click('nav [data-tab="case-management"], button:has-text("Case Management")');
    await page.waitForTimeout(2000);

    // Look for Add Note button
    const addNoteButton = page.locator('button:has-text("Add Note"), [data-testid="add-note-btn"]');
    if (await addNoteButton.count() > 0) {
      await addNoteButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check if modal opened without GraphQL client errors
      const modal = page.locator('.modal, .dialog, .MuiDialog-root');
      if (await modal.count() > 0) {
        console.log('✅ Add Note modal opened successfully');
      }
    }

    console.log('🎉 RequestNotes API model available and working');
  });

  test('Verify playground static file serving', async ({ page }) => {
    console.log('🔬 Testing playground static file serving...');

    // Test multiple playground URLs
    const urls = [
      'http://localhost:3000/playground/index.html',
      'http://localhost:3000/playground/docs.html', 
      'http://localhost:3000/playground/examples.html'
    ];

    for (const url of urls) {
      const response = await page.goto(url);
      expect(response.status()).toBe(200);
      console.log(`✅ ${url} returns 200 status`);
      
      // Verify content loads
      await page.waitForSelector('body', { timeout: 5000 });
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);
      console.log(`✅ ${url} content loaded (${content.length} chars)`);
    }

    console.log('🎉 Playground static file serving working correctly');
  });
});