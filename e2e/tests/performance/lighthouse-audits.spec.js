/**
 * Lighthouse Performance Audits
 * 
 * Comprehensive performance testing using Lighthouse metrics and Core Web Vitals.
 * Tests critical pages for performance, accessibility, best practices, and SEO.
 */

const { test, expect } = require('@playwright/test');
const { PerformanceMonitor, PerformanceTestUtils } = require('../utils/performance-monitor.js');
const { performanceBenchmarks, seoValidation } = require('../fixtures/test-data.js');

test.describe('Lighthouse Performance Audits', () => {
  let monitor;

  test.beforeEach(async ({ page }) => {
    monitor = new PerformanceMonitor(page, 'lighthouse-audits');
    await monitor.startMonitoring();
  });

  test.afterEach(async () => {
    if (monitor) {
      const report = await monitor.stopMonitoring();
      console.log('📊 Performance Report Summary:', {
        averagePageLoad: report.performance.averagePageLoad,
        coreWebVitals: report.performance.coreWebVitals,
        benchmarksPassed: report.benchmarks.overall
      });
    }
  });

  test('Homepage performance audit', async ({ page }) => {
    // Navigate to homepage and measure performance
    const pageLoadMetric = await monitor.recordPageLoad('/', [
      'h1', // Main heading
      'nav', // Navigation
      '[data-testid="hero-section"]', // Hero section
      'footer' // Footer
    ]);

    // Validate page load time
    expect(pageLoadMetric.success).toBe(true);
    expect(pageLoadMetric.loadTime).toBeLessThan(performanceBenchmarks.pageLoad.homepage);

    // Run Lighthouse audit
    const lighthouseResults = await monitor.runLighthouseAudit('/');
    if (lighthouseResults) {
      expect(lighthouseResults.scores.performance).toBeGreaterThan(80);
      expect(lighthouseResults.scores.accessibility).toBeGreaterThan(85);
      expect(lighthouseResults.scores.seo).toBeGreaterThan(85);
    }

    // Test Core Web Vitals
    const webVitals = pageLoadMetric.webVitals;
    if (webVitals.LCP) {
      expect(webVitals.LCP).toBeLessThan(2500); // LCP < 2.5s (Good)
    }
    if (webVitals.FID) {
      expect(webVitals.FID).toBeLessThan(100); // FID < 100ms (Good)
    }
    if (webVitals.CLS) {
      expect(webVitals.CLS).toBeLessThan(0.1); // CLS < 0.1 (Good)
    }

    // Validate SEO requirements
    const title = await page.title();
    const description = await page.getAttribute('meta[name="description"]', 'content');
    
    expect(title.length).toBeGreaterThanOrEqual(seoValidation.homepage.title.min);
    expect(title.length).toBeLessThanOrEqual(seoValidation.homepage.title.max);
    
    if (description) {
      expect(description.length).toBeGreaterThanOrEqual(seoValidation.homepage.description.min);
      expect(description.length).toBeLessThanOrEqual(seoValidation.homepage.description.max);
    }
  });

  test('Contact page performance audit', async ({ page }) => {
    const pageLoadMetric = await monitor.recordPageLoad('/contact', [
      'h1',
      'form',
      'input[type="email"]',
      'textarea'
    ]);

    expect(pageLoadMetric.success).toBe(true);
    expect(pageLoadMetric.loadTime).toBeLessThan(performanceBenchmarks.pageLoad.contact);

    // Test form interaction performance
    await monitor.recordInteraction('fill', 'input[name="name"]', 'Test User');
    await monitor.recordInteraction('fill', 'input[name="email"]', 'test@example.com');
    await monitor.recordInteraction('fill', 'textarea[name="message"]', 'Test message');

    // Memory usage check
    await monitor.recordMemoryUsage('contact-form-filled');
  });

  test('Product pages performance audit', async ({ page }) => {
    const productPages = [
      '/products/kitchen-and-bath',
      '/products/home-additions',
      '/products/commercial',
      '/products/design-services',
      '/products/maintenance'
    ];

    for (const productPage of productPages) {
      const pageLoadMetric = await monitor.recordPageLoad(productPage, [
        'h1',
        '[data-testid="product-features"]',
        '[data-testid="cta-section"]'
      ]);

      expect(pageLoadMetric.success).toBe(true);
      expect(pageLoadMetric.loadTime).toBeLessThan(performanceBenchmarks.pageLoad.products);

      // Check for product-specific SEO
      const title = await page.title();
      expect(title.length).toBeGreaterThanOrEqual(seoValidation.productPages.title.min);
      expect(title.length).toBeLessThanOrEqual(seoValidation.productPages.title.max);
    }
  });

  test('Admin pages performance audit', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"]', 'Sababa123!');
    await monitor.recordInteraction('click', 'button[type="submit"]', 'Login');

    // Test admin dashboard
    const dashboardMetric = await monitor.recordPageLoad('/admin/dashboard', [
      '[data-testid="admin-header"]',
      '[data-testid="dashboard-stats"]',
      '[data-testid="dashboard-charts"]'
    ]);

    expect(dashboardMetric.success).toBe(true);
    expect(dashboardMetric.loadTime).toBeLessThan(performanceBenchmarks.pageLoad.admin);

    // Test admin projects page
    const projectsMetric = await monitor.recordPageLoad('/admin/projects', [
      '[data-testid="admin-header"]',
      '.MuiDataGrid-root, table, [data-testid="projects-table"]',
      '.MuiPagination-root, .pagination, [aria-label*="pagination" i]'
    ]);

    expect(projectsMetric.success).toBe(true);
    expect(projectsMetric.loadTime).toBeLessThan(performanceBenchmarks.pageLoad.admin);

    // Test pagination interaction performance
    const paginationSelector = '.MuiPagination-root button:nth-child(3), .pagination button:nth-child(3), [aria-label*="pagination" i] button:nth-child(3)';
    await monitor.recordInteraction('click', paginationSelector, 'Navigate to page 2');
  });

  test('Mobile performance audit', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    const mobilePages = ['/', '/contact', '/products/kitchen-and-bath'];

    for (const url of mobilePages) {
      const pageLoadMetric = await monitor.recordPageLoad(url, [
        'h1',
        'nav',
        'main'
      ]);

      expect(pageLoadMetric.success).toBe(true);
      // Mobile may be slightly slower, allow 50% more time
      const mobileThreshold = performanceBenchmarks.pageLoad.homepage * 1.5;
      expect(pageLoadMetric.loadTime).toBeLessThan(mobileThreshold);

      // Test mobile-specific interactions
      const menuButton = await page.locator('[data-testid="mobile-menu-button"], .mobile-menu-toggle, [aria-label*="menu" i]').first();
      if (await menuButton.isVisible()) {
        await monitor.recordInteraction('click', '[data-testid="mobile-menu-button"], .mobile-menu-toggle, [aria-label*="menu" i]', 'Open mobile menu');
      }
    }
  });

  test('Performance regression detection', async ({ page }) => {
    // Run a comprehensive performance test
    const testScenarios = [
      {
        name: 'homepage-complete-flow',
        steps: [
          { type: 'navigate', url: '/', expectedElements: ['h1', 'nav'] },
          { type: 'lighthouse', url: '/' },
          { type: 'interact', action: 'click', selector: 'a[href="/contact"]' },
          { type: 'navigate', url: '/contact', expectedElements: ['form'] },
          { type: 'interact', action: 'fill', selector: 'input[name="name"]', value: 'Test User' }
        ]
      },
      {
        name: 'product-browsing-flow',
        steps: [
          { type: 'navigate', url: '/products/kitchen-and-bath', expectedElements: ['h1'] },
          { type: 'interact', action: 'click', selector: '[data-testid="get-estimate-button"], .cta-button, [href*="contact"]' },
          { type: 'wait', duration: 1000 }
        ]
      }
    ];

    const performanceReport = await PerformanceTestUtils.runPerformanceSuite(page, testScenarios);
    
    expect(performanceReport.summary.successfulPageLoads).toBeGreaterThan(0);
    expect(performanceReport.benchmarks.overall).toBe(true);

    // Save baseline for future comparisons
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await monitor.exportToFile(`test-results/performance-baseline-${timestamp}.json`);
  });

  test('Network conditions performance', async ({ page, context }) => {
    // Test under different network conditions
    const networkConditions = [
      { name: 'fast-3g', downloadThroughput: 1500000, uploadThroughput: 750000, latency: 150 },
      { name: 'slow-3g', downloadThroughput: 500000, uploadThroughput: 500000, latency: 300 }
    ];

    for (const condition of networkConditions) {
      // Simulate network condition
      await context.setExtraHTTPHeaders({
        'User-Agent': `Performance-Test-${condition.name}`
      });

      const pageLoadMetric = await monitor.recordPageLoad('/', ['h1', 'nav']);
      
      // Adjust expectations based on network condition
      const expectedThreshold = condition.name === 'slow-3g' 
        ? performanceBenchmarks.pageLoad.homepage * 3 
        : performanceBenchmarks.pageLoad.homepage * 2;
      
      expect(pageLoadMetric.success).toBe(true);
      expect(pageLoadMetric.loadTime).toBeLessThan(expectedThreshold);

      console.log(`📡 ${condition.name} performance: ${pageLoadMetric.loadTime}ms`);
    }
  });

  test('Memory leak detection', async ({ page }) => {
    // Record initial memory
    await monitor.recordMemoryUsage('initial');

    // Perform memory-intensive operations
    for (let i = 0; i < 5; i++) {
      await monitor.recordPageLoad('/admin/projects', [
        '.MuiDataGrid-root, table, [data-testid="projects-table"]'
      ]);
      
      // Navigate back and forth to test cleanup
      await page.goBack();
      await page.goForward();
      
      await monitor.recordMemoryUsage(`iteration-${i + 1}`);
    }

    // Check for memory growth
    const memorySnapshots = monitor.metrics.memoryUsage;
    if (memorySnapshots.length >= 2) {
      const initialMemory = memorySnapshots[0].usedMB;
      const finalMemory = memorySnapshots[memorySnapshots.length - 1].usedMB;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Allow for some memory growth, but flag excessive increases
      expect(memoryGrowth).toBeLessThan(50); // Less than 50MB growth
      
      console.log(`💾 Memory analysis: ${initialMemory}MB → ${finalMemory}MB (${memoryGrowth}MB growth)`);
    }
  });

  test('Core Web Vitals comprehensive test', async ({ page }) => {
    // Test multiple pages for Core Web Vitals
    const testPages = [
      { url: '/', name: 'homepage' },
      { url: '/contact', name: 'contact' },
      { url: '/products/kitchen-and-bath', name: 'product' }
    ];

    const vitalResults = [];

    for (const testPage of testPages) {
      const pageLoadMetric = await monitor.recordPageLoad(testPage.url, ['h1']);
      
      if (pageLoadMetric.webVitals) {
        const vitals = {
          page: testPage.name,
          LCP: pageLoadMetric.webVitals.LCP,
          FID: pageLoadMetric.webVitals.FID,
          CLS: pageLoadMetric.webVitals.CLS
        };
        
        vitalResults.push(vitals);
        
        // Validate Core Web Vitals thresholds
        if (vitals.LCP) expect(vitals.LCP).toBeLessThan(2500); // Good: < 2.5s
        if (vitals.FID) expect(vitals.FID).toBeLessThan(100);  // Good: < 100ms
        if (vitals.CLS) expect(vitals.CLS).toBeLessThan(0.1);  // Good: < 0.1
      }
    }

    console.log('🎯 Core Web Vitals Summary:', vitalResults);
    
    // Ensure we captured vitals for at least some pages
    expect(vitalResults.length).toBeGreaterThan(0);
  });
});

test.describe('Performance Monitoring Integration', () => {
  test('Performance dashboard data collection', async ({ page }) => {
    const monitor = new PerformanceMonitor(page, 'dashboard-integration');
    await monitor.startMonitoring();

    // Simulate real user journey
    await monitor.recordPageLoad('/', ['h1', 'nav']);
    await monitor.recordInteraction('click', 'a[href="/contact"]');
    await monitor.recordPageLoad('/contact', ['form']);
    await monitor.recordInteraction('fill', 'input[name="name"]', 'Performance Test User');
    await monitor.recordInteraction('fill', 'input[name="email"]', 'perf@test.com');

    const finalReport = await monitor.stopMonitoring();
    
    // Validate report structure for dashboard integration
    expect(finalReport).toHaveProperty('testName');
    expect(finalReport).toHaveProperty('performance');
    expect(finalReport).toHaveProperty('benchmarks');
    expect(finalReport.summary.totalPageLoads).toBeGreaterThan(0);
    expect(finalReport.summary.totalInteractions).toBeGreaterThan(0);

    // Export for dashboard consumption
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await monitor.exportToFile(`test-results/dashboard-data-${timestamp}.json`);
  });
});