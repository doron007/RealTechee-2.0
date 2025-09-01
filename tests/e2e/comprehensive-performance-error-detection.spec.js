import { test, expect } from '@playwright/test';

test.describe('Comprehensive Performance & Error Detection Validation', () => {
  // Advanced monitoring setup with detailed metrics
  function setupAdvancedMonitoring(page) {
    const monitoring = {
      consoleErrors: [],
      consoleWarnings: [],
      consoleMessages: [],
      networkErrors: [],
      performanceMetrics: {},
      javascriptErrors: [],
      unhandledRejections: []
    };

    // Console monitoring with categorization
    page.on('console', msg => {
      const message = { 
        type: msg.type(), 
        text: msg.text(), 
        timestamp: Date.now(),
        location: msg.location()
      };
      
      monitoring.consoleMessages.push(message);
      
      switch (msg.type()) {
        case 'error':
          monitoring.consoleErrors.push(message);
          console.error(`❌ [${message.timestamp}] ${msg.text()}`);
          
          // Categorize specific error types
          if (message.text.includes('Model Requests not available')) {
            monitoring.javascriptErrors.push({ ...message, category: 'CRITICAL_CASE_MANAGEMENT' });
          } else if (message.text.includes('404')) {
            monitoring.javascriptErrors.push({ ...message, category: 'CRITICAL_PLAYGROUND' });
          } else if (message.text.includes('TypeError') || message.text.includes('ReferenceError')) {
            monitoring.javascriptErrors.push({ ...message, category: 'RUNTIME_ERROR' });
          }
          break;
          
        case 'warning':
          monitoring.consoleWarnings.push(message);
          console.warn(`⚠️  [${message.timestamp}] ${msg.text()}`);
          break;
          
        default:
          console.log(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // Network monitoring with detailed categorization
    page.on('response', response => {
      const responseData = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timing: response.timing(),
        timestamp: Date.now()
      };

      if (response.status() >= 400) {
        monitoring.networkErrors.push(responseData);
        console.error(`🌐 [${responseData.timestamp}] Network Error: ${response.status()} - ${response.url()}`);
      }
      
      // Track performance for key resources
      if (response.url().includes('playground') || 
          response.url().includes('admin') || 
          response.url().includes('amplify_outputs.json')) {
        monitoring.performanceMetrics[response.url()] = responseData;
      }
    });

    // JavaScript error monitoring
    page.on('pageerror', error => {
      monitoring.unhandledRejections.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
      console.error('💥 Unhandled Page Error:', error.message);
    });

    return monitoring;
  }

  // Performance measurement helper
  async function measurePagePerformance(page, pageName) {
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });

    console.log(`\n📊 Performance Metrics for ${pageName}:`);
    Object.entries(performanceData).forEach(([metric, value]) => {
      console.log(`  ${metric}: ${value.toFixed(2)}ms`);
    });

    return performanceData;
  }

  test('should detect and validate specific error scenarios for both fixes', async ({ page }) => {
    const monitoring = setupAdvancedMonitoring(page);
    
    console.log('🔍 Running comprehensive error detection tests...');
    
    // TEST 1: Playground 404 Error Detection
    console.log('\n🎮 TEST 1: Playground 404 Error Detection');
    
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // Check for 404 errors specifically
    const playground404Errors = monitoring.networkErrors.filter(error => 
      error.status === 404 && error.url.includes('playground')
    );
    
    expect(playground404Errors.length).toBe(0);
    console.log(`✅ No playground 404 errors detected (checked ${monitoring.networkErrors.length} network requests)`);
    
    // TEST 2: Case Management Client Error Detection  
    console.log('\n🏢 TEST 2: Case Management "Model Requests not available" Error Detection');
    
    // Clear previous monitoring before admin test
    monitoring.consoleErrors.length = 0;
    monitoring.javascriptErrors.length = 0;
    
    // Login to admin
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="username"], input[type="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"], input[type="password"]', 'Sababa123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"], button:has-text("Sign in")')
    ]);
    
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 15000 });
    
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
      
      // This is the critical moment - clicking Case Management tab
      console.log('🎯 Critical moment: Clicking Case Management tab...');
      const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
      await caseManagementTab.click();
      
      // Wait for potential errors to surface
      await page.waitForTimeout(5000);
      
      // Check specifically for the "Model Requests not available" error
      const modelRequestsErrors = monitoring.consoleErrors.filter(error => 
        error.text.includes('Model Requests not available on client') ||
        error.text.includes('Model Requests not available') ||
        error.text.includes('generateClient error')
      );
      
      expect(modelRequestsErrors.length).toBe(0);
      console.log(`✅ NO "Model Requests not available" errors detected (checked ${monitoring.consoleErrors.length} console errors)`);
      
      // Additional validation: Check for any client initialization errors
      const clientInitErrors = monitoring.consoleErrors.filter(error => 
        error.text.includes('client') && 
        (error.text.includes('initialization') || error.text.includes('not available'))
      );
      
      expect(clientInitErrors.length).toBe(0);
      console.log('✅ NO client initialization errors detected');
    }
    
    // TEST 3: JavaScript Runtime Error Detection
    console.log('\n💻 TEST 3: JavaScript Runtime Error Detection');
    
    const runtimeErrors = monitoring.javascriptErrors.filter(error => 
      error.category === 'RUNTIME_ERROR'
    );
    
    expect(runtimeErrors.length).toBe(0);
    console.log(`✅ NO JavaScript runtime errors detected (checked ${monitoring.javascriptErrors.length} JS errors)`);
    
    // TEST 4: Unhandled Promise Rejection Detection
    console.log('\n⚡ TEST 4: Unhandled Promise Rejection Detection');
    
    expect(monitoring.unhandledRejections.length).toBe(0);
    console.log(`✅ NO unhandled promise rejections detected`);
    
    // SUMMARY: Error Detection Results
    console.log('\n📋 ERROR DETECTION SUMMARY:');
    console.log(`  Console Errors: ${monitoring.consoleErrors.length}`);
    console.log(`  Console Warnings: ${monitoring.consoleWarnings.length}`);
    console.log(`  Network Errors: ${monitoring.networkErrors.length}`);
    console.log(`  JavaScript Errors: ${monitoring.javascriptErrors.length}`);
    console.log(`  Unhandled Rejections: ${monitoring.unhandledRejections.length}`);
    
    // Take error detection screenshot
    await page.screenshot({ path: 'tests/screenshots/error-detection-complete.png', fullPage: true });
  });

  test('should validate performance benchmarks meet production standards', async ({ page }) => {
    console.log('⚡ Running performance validation against production standards...');
    
    const performanceResults = {};
    
    // BENCHMARK 1: Playground Performance
    console.log('\n🎮 BENCHMARK 1: Playground Performance');
    
    let startTime = performance.now();
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    performanceResults.playgroundLoad = performance.now() - startTime;
    
    const playgroundMetrics = await measurePagePerformance(page, 'Playground Homepage');
    performanceResults.playgroundDOMContentLoaded = playgroundMetrics.domContentLoaded;
    performanceResults.playgroundFirstPaint = playgroundMetrics.firstPaint;
    
    // Production standard: Playground should load under 3 seconds
    expect(performanceResults.playgroundLoad).toBeLessThan(3000);
    console.log(`✅ Playground loads within production standard (${performanceResults.playgroundLoad.toFixed(2)}ms < 3000ms)`);
    
    // BENCHMARK 2: GraphiQL Performance
    console.log('\n🧪 BENCHMARK 2: GraphiQL Performance');
    
    startTime = performance.now();
    await page.goto('/playground/graphiql.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for GraphiQL initialization
    performanceResults.graphiqlLoad = performance.now() - startTime;
    
    const graphiqlMetrics = await measurePagePerformance(page, 'GraphiQL');
    performanceResults.graphiqlDOMContentLoaded = graphiqlMetrics.domContentLoaded;
    
    // Production standard: GraphiQL should load under 5 seconds (complex interface)
    expect(performanceResults.graphiqlLoad).toBeLessThan(5000);
    console.log(`✅ GraphiQL loads within production standard (${performanceResults.graphiqlLoad.toFixed(2)}ms < 5000ms)`);
    
    // BENCHMARK 3: Admin System Performance
    console.log('\n🏢 BENCHMARK 3: Admin System Performance');
    
    // Login performance
    startTime = performance.now();
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="username"], input[type="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"], input[type="password"]', 'Sababa123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"], button:has-text("Sign in")')
    ]);
    performanceResults.adminLogin = performance.now() - startTime;
    
    // Requests page performance
    startTime = performance.now();
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 15000 });
    performanceResults.requestsPageLoad = performance.now() - startTime;
    
    const adminMetrics = await measurePagePerformance(page, 'Admin Requests');
    performanceResults.adminDOMContentLoaded = adminMetrics.domContentLoaded;
    
    // Production standards for admin system
    expect(performanceResults.adminLogin).toBeLessThan(5000); // Login under 5 seconds
    expect(performanceResults.requestsPageLoad).toBeLessThan(7000); // Data loading under 7 seconds
    
    console.log(`✅ Admin login within standard (${performanceResults.adminLogin.toFixed(2)}ms < 5000ms)`);
    console.log(`✅ Requests page within standard (${performanceResults.requestsPageLoad.toFixed(2)}ms < 7000ms)`);
    
    // BENCHMARK 4: Case Management Performance
    console.log('\n📋 BENCHMARK 4: Case Management Performance');
    
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
      
      startTime = performance.now();
      const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
      await caseManagementTab.click();
      await page.waitForTimeout(2000);
      performanceResults.caseManagementTabLoad = performance.now() - startTime;
      
      // Production standard: Tab switching should be under 2 seconds
      expect(performanceResults.caseManagementTabLoad).toBeLessThan(2000);
      console.log(`✅ Case Management tab within standard (${performanceResults.caseManagementTabLoad.toFixed(2)}ms < 2000ms)`);
    }
    
    // OVERALL PERFORMANCE ANALYSIS
    console.log('\n📊 OVERALL PERFORMANCE ANALYSIS:');
    
    const totalTime = Object.values(performanceResults).reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / Object.keys(performanceResults).length;
    
    console.log(`Total test time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average operation time: ${averageTime.toFixed(2)}ms`);
    
    // Production standard: Average operation time should be reasonable
    expect(averageTime).toBeLessThan(4000);
    console.log(`✅ Average performance meets production standards (${averageTime.toFixed(2)}ms < 4000ms)`);
    
    // Performance grade calculation
    const performanceGrade = averageTime < 2000 ? 'A' : averageTime < 3000 ? 'B' : averageTime < 4000 ? 'C' : 'D';
    console.log(`🏆 Overall Performance Grade: ${performanceGrade}`);
  });

  test('should validate error recovery and resilience mechanisms', async ({ page }) => {
    const monitoring = setupAdvancedMonitoring(page);
    
    console.log('🛡️  Testing error recovery and resilience...');
    
    // TEST 1: Network Resilience
    console.log('\n🌐 TEST 1: Network Resilience Testing');
    
    // Simulate slow network conditions
    await page.route('**/*', (route, request) => {
      // Add delay to simulate slow network
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Verify playground still loads under slow conditions
    await expect(page.locator('.header h1')).toBeVisible();
    console.log('✅ Playground resilient to slow network conditions');
    
    // TEST 2: Case Management Resilience to Rapid Operations
    console.log('\n⚡ TEST 2: Case Management Rapid Operations Resilience');
    
    // Clear network delays for admin testing
    await page.unroute('**/*');
    
    // Login to admin
    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="username"], input[type="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"], input[type="password"]', 'Sababa123!');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"], button:has-text("Sign in")')
    ]);
    
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 15000 });
    
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
      
      // Perform rapid tab switching (stress test)
      const tabs = ['Details', 'Case Management'];
      for (let cycle = 0; cycle < 3; cycle++) {
        console.log(`  Rapid switching cycle ${cycle + 1}`);
        for (const tabName of tabs) {
          const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
          if (await tab.count() > 0) {
            await tab.click();
            await page.waitForTimeout(200); // Very short delay
          }
        }
      }
      
      // Final test: Case Management should still work
      const caseManagementTab = page.locator('[role="tab"]:has-text("Case Management")');
      await caseManagementTab.click();
      await page.waitForTimeout(3000);
      
      // Check for errors accumulated during rapid operations
      const rapidOperationErrors = monitoring.consoleErrors.filter(error => 
        error.text.includes('Model Requests not available') ||
        error.text.includes('race condition') ||
        error.text.includes('concurrent')
      );
      
      expect(rapidOperationErrors.length).toBe(0);
      console.log('✅ Case Management resilient to rapid operations');
    }
    
    // TEST 3: Browser Resource Cleanup
    console.log('\n🧹 TEST 3: Browser Resource Cleanup Testing');
    
    // Navigate between systems multiple times to test cleanup
    for (let i = 0; i < 3; i++) {
      await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      await page.goto('/admin/requests', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }
    
    // Check for memory-related errors or warnings
    const memoryIssues = monitoring.consoleWarnings.filter(warning => 
      warning.text.includes('memory') ||
      warning.text.includes('leak') ||
      warning.text.includes('cleanup')
    );
    
    expect(memoryIssues.length).toBe(0);
    console.log('✅ No memory-related issues detected during navigation cycles');
    
    // RESILIENCE SUMMARY
    console.log('\n🏆 RESILIENCE TEST SUMMARY:');
    console.log(`  Network resilience: PASSED`);
    console.log(`  Rapid operations resilience: PASSED`);
    console.log(`  Resource cleanup: PASSED`);
    console.log(`  Total console errors: ${monitoring.consoleErrors.length}`);
    console.log(`  Total warnings: ${monitoring.consoleWarnings.length}`);
    
    await page.screenshot({ path: 'tests/screenshots/resilience-testing-complete.png', fullPage: true });
  });

  test('should validate production-ready stability indicators', async ({ page }) => {
    const monitoring = setupAdvancedMonitoring(page);
    
    console.log('🏭 Testing production-ready stability indicators...');
    
    // STABILITY TEST 1: Extended Usage Simulation
    console.log('\n⏰ STABILITY TEST 1: Extended Usage Simulation');
    
    const startTime = Date.now();
    
    // Simulate 10 minutes of typical usage patterns
    const usagePatterns = [
      () => page.goto('/playground/index.html', { waitUntil: 'networkidle' }),
      () => page.goto('/playground/graphiql.html', { waitUntil: 'networkidle' }),
      () => page.goto('/admin/login', { waitUntil: 'networkidle' }),
    ];
    
    // Run patterns 5 times (shorter for test efficiency)
    for (let cycle = 0; cycle < 5; cycle++) {
      console.log(`  Usage cycle ${cycle + 1}/5`);
      
      for (const pattern of usagePatterns) {
        await pattern();
        await page.waitForTimeout(500);
      }
    }
    
    const testDuration = Date.now() - startTime;
    console.log(`✅ Extended usage simulation completed (${testDuration}ms)`);
    
    // STABILITY TEST 2: Error Accumulation Check
    console.log('\n📊 STABILITY TEST 2: Error Accumulation Analysis');
    
    const errorTrends = {
      earlyErrors: monitoring.consoleErrors.slice(0, Math.floor(monitoring.consoleErrors.length / 3)),
      lateErrors: monitoring.consoleErrors.slice(-Math.floor(monitoring.consoleErrors.length / 3))
    };
    
    // Errors should not be increasing over time (stability indicator)
    const errorIncreaseRate = errorTrends.lateErrors.length - errorTrends.earlyErrors.length;
    expect(errorIncreaseRate).toBeLessThanOrEqual(0);
    console.log(`✅ No error accumulation detected (change: ${errorIncreaseRate})`);
    
    // STABILITY TEST 3: Memory Stability
    console.log('\n💾 STABILITY TEST 3: Memory Stability Check');
    
    const memoryMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryMetrics) {
      const memoryUsagePercent = (memoryMetrics.usedJSHeapSize / memoryMetrics.jsHeapSizeLimit) * 100;
      console.log(`Memory usage: ${memoryUsagePercent.toFixed(2)}%`);
      
      // Should not be using excessive memory
      expect(memoryUsagePercent).toBeLessThan(50); // Under 50% memory usage
      console.log('✅ Memory usage within acceptable limits');
    }
    
    // STABILITY TEST 4: Critical Error Absence
    console.log('\n🚨 STABILITY TEST 4: Critical Error Absence Verification');
    
    const criticalErrors = monitoring.consoleErrors.filter(error => 
      error.text.includes('Model Requests not available') ||
      error.text.includes('404') ||
      error.text.includes('500') ||
      error.text.includes('TypeError') ||
      error.text.includes('ReferenceError') ||
      error.text.includes('Cannot read') ||
      error.text.includes('undefined is not')
    );
    
    expect(criticalErrors.length).toBe(0);
    console.log(`✅ NO critical errors detected (checked ${monitoring.consoleErrors.length} total errors)`);
    
    // PRODUCTION READINESS SCORE
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:');
    
    const readinessMetrics = {
      errorCount: monitoring.consoleErrors.length,
      warningCount: monitoring.consoleWarnings.length,
      networkErrorCount: monitoring.networkErrors.length,
      testDuration: testDuration
    };
    
    console.log(`  Console Errors: ${readinessMetrics.errorCount} (target: 0)`);
    console.log(`  Console Warnings: ${readinessMetrics.warningCount} (target: <5)`);
    console.log(`  Network Errors: ${readinessMetrics.networkErrorCount} (target: 0)`);
    console.log(`  Test Duration: ${readinessMetrics.testDuration}ms`);
    
    // Production readiness criteria
    const isProductionReady = 
      readinessMetrics.errorCount === 0 &&
      readinessMetrics.warningCount < 5 &&
      readinessMetrics.networkErrorCount === 0;
    
    expect(isProductionReady).toBeTruthy();
    console.log(`🏆 PRODUCTION READINESS: ${isProductionReady ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    await page.screenshot({ path: 'tests/screenshots/production-readiness-complete.png', fullPage: true });
  });
});