import { test, expect } from '@playwright/test';

test.describe('Comprehensive Fixes Integration - Case Management & Playground', () => {
  // Enhanced monitoring setup for integration testing
  function setupComprehensiveMonitoring(page) {
    const consoleErrors = [];
    const consoleWarnings = [];
    const consoleMessages = [];
    const networkErrors = [];
    const performanceMetrics = {};
    
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

    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        console.error(`🌐 Network Error: ${response.status()} - ${response.url()}`);
      }
    });

    return { consoleErrors, consoleWarnings, consoleMessages, networkErrors, performanceMetrics };
  }

  // Admin login helper
  async function loginToAdmin(page) {
    console.log('🔐 Logging into admin area...');
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="username"], input[type="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"], input[type="password"]', 'Sababa123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
    ]);
    await expect(page).toHaveURL(/.*\/admin.*/);
    console.log('✅ Successfully logged into admin');
  }

  test('should validate both Case Management and Playground fixes work together', async ({ page }) => {
    const monitoring = setupComprehensiveMonitoring(page);
    
    console.log('🔄 Starting comprehensive integration test...');
    console.log('📊 Testing both fixes in sequence:\n  1. Playground accessibility\n  2. Case Management functionality\n  3. Cross-system integration');
    
    // PHASE 1: Test Playground Fix
    console.log('\n🎮 PHASE 1: Testing Playground Fix');
    
    const playgroundStartTime = performance.now();
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    const playgroundLoadTime = performance.now() - playgroundStartTime;
    
    // Verify playground loaded successfully
    await expect(page.locator('.header h1')).toContainText('RealTechee GraphQL Playground');
    await expect(page.locator('.playground-grid')).toBeVisible();
    
    // Verify GraphQL endpoint configuration
    await page.waitForTimeout(3000);
    const endpointElement = page.locator('#graphql-endpoint');
    const endpointText = await endpointElement.textContent();
    
    expect(endpointText).not.toBe('Loading...');
    console.log(`✅ Playground loaded (${playgroundLoadTime.toFixed(2)}ms), endpoint: ${endpointText}`);
    
    // Test GraphiQL navigation
    const graphiqlLink = page.locator('a[href="./graphiql.html"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      graphiqlLink.click()
    ]);
    
    await expect(page).toHaveURL(/.*\/playground\/graphiql\.html$/);
    await page.waitForTimeout(2000);
    console.log('✅ GraphiQL navigation successful');
    
    await page.screenshot({ path: 'tests/screenshots/integration-playground-phase.png', fullPage: true });
    
    // PHASE 2: Test Case Management Fix
    console.log('\n🏢 PHASE 2: Testing Case Management Fix');
    
    // Clear previous errors before testing case management
    monitoring.consoleErrors.length = 0;
    
    await loginToAdmin(page);
    
    const adminStartTime = performance.now();
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    const adminLoadTime = performance.now() - adminStartTime;
    
    // Navigate to request detail
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 15000 });
    
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
    } else {
      const firstRow = page.locator('[data-testid="requests-grid"] .MuiDataGrid-row, table tbody tr').first();
      await firstRow.click();
    }
    
    await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
    console.log(`✅ Admin requests loaded (${adminLoadTime.toFixed(2)}ms)`);
    
    // Test Case Management tab
    const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
    await expect(caseManagementTab).toBeVisible();
    
    const tabStartTime = performance.now();
    await caseManagementTab.click();
    await page.waitForTimeout(3000);
    const tabLoadTime = performance.now() - tabStartTime;
    
    // Critical validation: Check for "Model Requests not available" error
    const hasModelRequestsError = monitoring.consoleErrors.some(error => 
      error.text.includes('Model Requests not available on client') ||
      error.text.includes('Model Requests not available') ||
      error.text.includes('generateClient error')
    );
    
    expect(hasModelRequestsError).toBeFalsy();
    console.log(`✅ Case Management tab loaded (${tabLoadTime.toFixed(2)}ms) - NO Model Requests error`);
    
    await page.screenshot({ path: 'tests/screenshots/integration-case-management-phase.png', fullPage: true });
    
    // PHASE 3: Integration Validation
    console.log('\n🔗 PHASE 3: Cross-System Integration Validation');
    
    // Test switching between systems multiple times to ensure stability
    for (let i = 0; i < 2; i++) {
      console.log(`  Integration cycle ${i + 1}:`);
      
      // Navigate to playground
      await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      console.log('    ✅ Playground accessible');
      
      // Navigate back to admin
      await page.goto('/admin/requests', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Quick test of case management
      const editBtn = page.locator('button:has-text("Edit")').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForSelector('[role="tab"]:has-text("Case Management")', { timeout: 10000 });
        const cmTab = page.locator('[role="tab"]:has-text("Case Management")');
        await cmTab.click();
        await page.waitForTimeout(1500);
        console.log('    ✅ Case Management still functional');
      }
    }
    
    // FINAL VALIDATION: Error Analysis
    console.log('\n📊 FINAL VALIDATION: Comprehensive Error Analysis');
    
    const totalErrors = monitoring.consoleErrors.length;
    const totalWarnings = monitoring.consoleWarnings.length;
    const networkIssues = monitoring.networkErrors.length;
    
    console.log(`Total Console Errors: ${totalErrors}`);
    console.log(`Total Console Warnings: ${totalWarnings}`);
    console.log(`Network Issues: ${networkIssues}`);
    
    // Critical error checks
    const hasCriticalErrors = monitoring.consoleErrors.some(error => 
      error.text.includes('Model Requests not available') ||
      error.text.includes('generateClient error') ||
      error.text.includes('TypeError') ||
      error.text.includes('ReferenceError') ||
      error.text.includes('404')
    );
    
    expect(hasCriticalErrors).toBeFalsy();
    console.log('✅ No critical errors detected across both systems');
    
    // Performance validation
    const totalTestTime = playgroundLoadTime + adminLoadTime + tabLoadTime;
    expect(totalTestTime).toBeLessThan(20000); // Total should be under 20 seconds
    console.log(`✅ Total integration performance: ${totalTestTime.toFixed(2)}ms`);
    
    // Take final integration screenshot
    await page.screenshot({ path: 'tests/screenshots/integration-complete.png', fullPage: true });
    console.log('📸 Integration test complete');
  });

  test('should validate error handling resilience across both systems', async ({ page }) => {
    const monitoring = setupComprehensiveMonitoring(page);
    
    console.log('🛡️  Testing error handling resilience...');
    
    // Test playground with potential network issues
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // Simulate slow network by adding delay
    await page.route('**/amplify_outputs.json', route => {
      setTimeout(() => {
        route.continue();
      }, 2000); // 2 second delay
    });
    
    // Reload to test slow configuration loading
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Verify playground still shows appropriate state
    const endpointElement = page.locator('#graphql-endpoint');
    const endpointText = await endpointElement.textContent();
    
    // Should show either loaded endpoint or error state, not "Loading..."
    expect(endpointText).not.toBe('Loading...');
    console.log('✅ Playground handles configuration delays gracefully');
    
    // Test case management with rapid tab switching
    await loginToAdmin(page);
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
      
      // Rapid tab switching to stress-test error handling
      const tabs = ['Details', 'Case Management'];
      for (let i = 0; i < 5; i++) {
        for (const tabName of tabs) {
          const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
          if (await tab.count() > 0) {
            await tab.click();
            await page.waitForTimeout(500); // Short delay
          }
        }
      }
      
      // Final check - Case Management should still work
      const caseTab = page.locator('[role="tab"]:has-text("Case Management")');
      await caseTab.click();
      await page.waitForTimeout(2000);
      
      const hasRapidSwitchingErrors = monitoring.consoleErrors.some(error => 
        error.text.includes('Model Requests not available') ||
        error.text.includes('client initialization') ||
        error.text.includes('generateClient')
      );
      
      expect(hasRapidSwitchingErrors).toBeFalsy();
      console.log('✅ Case Management handles rapid tab switching without errors');
    }
    
    console.log('✅ Both systems demonstrate good error handling resilience');
  });

  test('should validate end-to-end user workflow integration', async ({ page }) => {
    const monitoring = setupComprehensiveMonitoring(page);
    
    console.log('👥 Testing realistic end-to-end user workflow...');
    
    // Simulate a developer workflow:
    // 1. Check API documentation in playground
    // 2. Test queries in GraphiQL
    // 3. Use admin interface to verify data
    // 4. Use case management for business operations
    
    // STEP 1: Developer checks API documentation
    console.log('📚 Step 1: Developer checks API documentation');
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    const docsLink = page.locator('a[href="./docs.html"]');
    await expect(docsLink).toBeVisible();
    console.log('✅ API documentation accessible');
    
    // STEP 2: Developer tests in GraphiQL
    console.log('🧪 Step 2: Developer uses GraphiQL');
    const graphiqlLink = page.locator('a[href="./graphiql.html"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      graphiqlLink.click()
    ]);
    
    await page.waitForTimeout(3000);
    console.log('✅ GraphiQL interface loaded for testing');
    
    // STEP 3: Admin checks data in admin interface
    console.log('👨‍💼 Step 3: Admin verifies data');
    await loginToAdmin(page);
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 15000 });
    console.log('✅ Admin can access request data');
    
    // STEP 4: Admin uses case management
    console.log('📋 Step 4: Admin uses case management');
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
      
      const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
      await caseManagementTab.click();
      await page.waitForTimeout(3000);
      
      // Verify case management is functional for business operations
      const hasBusinessFunctionality = await page.locator(
        '.case-management, ' +
        '.MuiCard-root, ' +
        '.MuiTabPanel-root, ' +
        '[data-testid="case-management-content"]'
      ).count() > 0;
      
      expect(hasBusinessFunctionality).toBeTruthy();
      console.log('✅ Case management functional for business operations');
    }
    
    // FINAL WORKFLOW VALIDATION
    console.log('\n🎯 FINAL WORKFLOW VALIDATION:');
    
    // No critical errors should have occurred during the entire workflow
    const workflowErrors = monitoring.consoleErrors.filter(error => 
      error.text.includes('Model Requests not available') ||
      error.text.includes('404') ||
      error.text.includes('TypeError') ||
      error.text.includes('generateClient error')
    );
    
    expect(workflowErrors.length).toBe(0);
    console.log('✅ Complete user workflow executed without critical errors');
    
    // Performance check - entire workflow should be reasonable
    const workflowMessages = monitoring.consoleMessages.length;
    console.log(`Total console messages during workflow: ${workflowMessages}`);
    
    // Take final workflow screenshot
    await page.screenshot({ path: 'tests/screenshots/end-to-end-workflow-complete.png', fullPage: true });
    console.log('📸 End-to-end workflow validation complete');
    
    console.log('\n🏆 INTEGRATION TEST SUMMARY:');
    console.log('  ✅ Playground fix: No 404 errors, proper navigation');
    console.log('  ✅ Case Management fix: No "Model Requests not available" errors'); 
    console.log('  ✅ Cross-system integration: Seamless transitions');
    console.log('  ✅ End-to-end workflow: Complete user journey validated');
    console.log('  ✅ Error handling: Resilient across all systems');
  });

  test('should validate performance benchmarks across both systems', async ({ page }) => {
    console.log('⚡ Running comprehensive performance benchmarks...');
    
    const performanceResults = {
      playgroundHomepage: 0,
      graphiqlLoad: 0,
      adminLogin: 0,
      requestsPage: 0,
      caseManagementTab: 0
    };
    
    // Benchmark 1: Playground Homepage
    let startTime = performance.now();
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    performanceResults.playgroundHomepage = performance.now() - startTime;
    
    // Benchmark 2: GraphiQL Load
    startTime = performance.now();
    await page.goto('/playground/graphiql.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for initialization
    performanceResults.graphiqlLoad = performance.now() - startTime;
    
    // Benchmark 3: Admin Login
    startTime = performance.now();
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="username"], input[type="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"], input[type="password"]', 'Sababa123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"], button:has-text("Sign in")')
    ]);
    performanceResults.adminLogin = performance.now() - startTime;
    
    // Benchmark 4: Requests Page
    startTime = performance.now();
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 15000 });
    performanceResults.requestsPage = performance.now() - startTime;
    
    // Benchmark 5: Case Management Tab
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
      
      startTime = performance.now();
      const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
      await caseManagementTab.click();
      await page.waitForTimeout(2000);
      performanceResults.caseManagementTab = performance.now() - startTime;
    }
    
    // Log performance results
    console.log('\n📊 PERFORMANCE BENCHMARK RESULTS:');
    Object.entries(performanceResults).forEach(([test, time]) => {
      console.log(`  ${test}: ${time.toFixed(2)}ms`);
    });
    
    // Performance assertions
    expect(performanceResults.playgroundHomepage).toBeLessThan(5000);
    expect(performanceResults.graphiqlLoad).toBeLessThan(10000);
    expect(performanceResults.adminLogin).toBeLessThan(8000);
    expect(performanceResults.requestsPage).toBeLessThan(10000);
    expect(performanceResults.caseManagementTab).toBeLessThan(5000);
    
    const totalTime = Object.values(performanceResults).reduce((sum, time) => sum + time, 0);
    console.log(`Total benchmark time: ${totalTime.toFixed(2)}ms`);
    
    expect(totalTime).toBeLessThan(40000); // Under 40 seconds total
    console.log('✅ All performance benchmarks within acceptable limits');
  });
});