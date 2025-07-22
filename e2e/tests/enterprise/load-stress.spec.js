/**
 * Load and Stress Testing
 * 
 * Enterprise-grade load and stress testing to validate application
 * performance under various load conditions.
 */

const { test, expect } = require('@playwright/test');
const { LoadTestRunner, ResourceMonitor, TestOrchestrator } = require('../utils/enterprise-helpers.js');
const { TestIsolation, TestRetryHandler } = require('../utils/test-isolation.js');

test.describe('Load and Stress Testing', () => {
  let resourceMonitor;
  let loadRunner;

  test.beforeAll(async () => {
    resourceMonitor = new ResourceMonitor();
    loadRunner = new LoadTestRunner({
      concurrency: 3, // Reduced for local testing
      duration: 30000, // 30 seconds
      rampUp: 5000 // 5 seconds
    });
  });

  test.afterAll(async () => {
    if (resourceMonitor) {
      resourceMonitor.stopMonitoring();
    }
  });

  test('Homepage load test', async ({ browser }) => {
    resourceMonitor.startMonitoring(1000);
    
    const homepageScenario = async (page) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      
      // Simulate user interactions
      const navLinks = page.locator('nav a').first();
      if (await navLinks.isVisible()) {
        await navLinks.hover();
      }
      
      // Check critical elements
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
    };

    const context = await browser.newContext();
    const results = await loadRunner.runLoadTest(homepageScenario, context);
    await context.close();
    
    resourceMonitor.stopMonitoring();
    const resourceReport = resourceMonitor.generateResourceReport();
    
    // Validate load test results
    expect(parseFloat(results.successRate)).toBeGreaterThan(95);
    expect(results.averageResponseTime).toBeLessThan(5000);
    expect(parseFloat(results.requestsPerSecond)).toBeGreaterThan(0.5);
    
    // Validate resource usage
    expect(resourceReport.memory.growth).toBeLessThan(100); // Less than 100MB growth
    
    console.log('📊 Load Test Summary:');
    console.log(`  Success Rate: ${results.successRate}%`);
    console.log(`  Avg Response Time: ${results.averageResponseTime}ms`);
    console.log(`  Memory Growth: ${resourceReport.memory.growth}MB`);
  });

  test('Contact form submission load test', async ({ browser }) => {
    const isolation = new TestIsolation();
    
    const contactFormScenario = async (page) => {
      await page.goto('/contact');
      await page.waitForSelector('form', { timeout: 10000 });
      
      // Fill form with isolated data
      const uniqueId = Date.now().toString().slice(-6);
      await page.fill('input[name="name"], input[placeholder*="name" i]', `Load Test User ${uniqueId}`);
      await page.fill('input[name="email"], input[type="email"]', `loadtest${uniqueId}@example.com`);
      await page.fill('input[name="phone"], input[placeholder*="phone" i]', `+1713555${uniqueId.slice(-4)}`);
      await page.fill('textarea[name="message"], textarea[placeholder*="message" i]', `Load test message ${uniqueId}`);
      
      // Submit form
      await page.click('button[type="submit"], input[type="submit"]');
      
      // Wait for response (success or validation)
      await page.waitForTimeout(2000);
    };

    const context = await browser.newContext();
    const results = await loadRunner.runLoadTest(contactFormScenario, context);
    await context.close();
    
    await isolation.executeCleanup();
    
    // Validate form submission load test
    expect(parseFloat(results.successRate)).toBeGreaterThan(90);
    expect(results.averageResponseTime).toBeLessThan(8000);
    
    console.log('📝 Contact Form Load Test:');
    console.log(`  Success Rate: ${results.successRate}%`);
    console.log(`  Form Submissions: ${results.totalRequests}`);
  });

  test('Admin dashboard concurrent access test', async ({ browser }) => {
    const adminScenario = async (page) => {
      // Login
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'info@realtechee.com');
      await page.fill('input[name="password"]', 'Sababa123!');
      await page.click('button[type="submit"]');
      await page.waitForURL(/admin|dashboard/, { timeout: 15000 });
      
      // Navigate to admin dashboard
      await page.goto('/admin/dashboard');
      await page.waitForSelector('[data-testid="admin-header"], .admin-header, h1', { timeout: 15000 });
      
      // Interact with dashboard elements
      const dashboardCards = page.locator('[data-testid="dashboard-card"], .card, .metric-card').first();
      if (await dashboardCards.isVisible()) {
        await dashboardCards.hover();
      }
      
      // Navigate to projects
      await page.goto('/admin/projects');
      await page.waitForSelector('.MuiDataGrid-root, table, [data-testid="projects-table"]', { timeout: 15000 });
      
      // Interact with data grid
      const firstRow = page.locator('.MuiDataGrid-row, tr', { hasText: /kitchen|bathroom|renovation/i }).first();
      if (await firstRow.isVisible()) {
        await firstRow.hover();
      }
    };

    const context = await browser.newContext();
    const results = await loadRunner.runLoadTest(adminScenario, context);
    await context.close();
    
    // Admin pages should handle concurrent access well
    expect(parseFloat(results.successRate)).toBeGreaterThan(85);
    expect(results.averageResponseTime).toBeLessThan(10000);
    
    console.log('👥 Admin Concurrent Access Test:');
    console.log(`  Success Rate: ${results.successRate}%`);
    console.log(`  Concurrent Users: ${loadRunner.concurrency}`);
  });

  test('Memory leak detection under load', async ({ browser }) => {
    resourceMonitor.startMonitoring(500); // More frequent sampling
    
    const memoryIntensiveScenario = async (page) => {
      // Navigate through multiple pages
      const pages = ['/', '/contact', '/products/kitchen-and-bath'];
      
      for (const url of pages) {
        await page.goto(url);
        await page.waitForSelector('h1', { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        
        // Create some DOM activity
        await page.evaluate(() => {
          // Simulate complex DOM operations
          for (let i = 0; i < 100; i++) {
            const div = document.createElement('div');
            div.textContent = `Memory test element ${i}`;
            document.body.appendChild(div);
          }
          
          // Clean up immediately
          const testElements = document.querySelectorAll('div:contains("Memory test element")');
          testElements.forEach(el => el.remove());
        });
      }
    };

    const context = await browser.newContext();
    const smallLoadRunner = new LoadTestRunner({
      concurrency: 2,
      duration: 20000,
      rampUp: 2000
    });
    
    const results = await smallLoadRunner.runLoadTest(memoryIntensiveScenario, context);
    await context.close();
    
    resourceMonitor.stopMonitoring();
    const resourceReport = resourceMonitor.generateResourceReport();
    
    // Check for memory leaks
    expect(resourceReport.memory.growth).toBeLessThan(150); // Allow some growth but flag excessive
    
    if (resourceReport.memory.growth > 50) {
      console.warn(`⚠️ Significant memory growth detected: ${resourceReport.memory.growth}MB`);
    }
    
    console.log('🧠 Memory Leak Test:');
    console.log(`  Memory Growth: ${resourceReport.memory.growth}MB`);
    console.log(`  Max Memory: ${resourceReport.memory.max}MB`);
  });

  test('Database connection stress test', async ({ browser }) => {
    const retryHandler = new TestRetryHandler({
      maxRetries: 3,
      retryDelay: 2000
    });

    const databaseStressScenario = async (page) => {
      await retryHandler.withRetry(async () => {
        // Login and access data-heavy pages
        await page.goto('/auth/signin');
        await page.fill('input[name="email"]', 'info@realtechee.com');
        await page.fill('input[name="password"]', 'Sababa123!');
        await page.click('button[type="submit"]');
        await page.waitForURL(/admin|dashboard/, { timeout: 15000 });
        
        // Access projects page (database-heavy)
        await page.goto('/admin/projects');
        await page.waitForSelector('.MuiDataGrid-root, table, [data-testid="projects-table"]', { timeout: 15000 });
        
        // Try to load multiple pages of data
        const paginationButtons = page.locator('.MuiPagination-root button, .pagination button').all();
        const buttons = await paginationButtons;
        
        if (buttons.length > 2) {
          await buttons[1].click(); // Click page 2
          await page.waitForTimeout(1000);
        }
        
        // Access quotes page
        await page.goto('/admin/quotes');
        await page.waitForTimeout(2000); // Allow for data loading
        
        // Access requests page
        await page.goto('/admin/requests');
        await page.waitForTimeout(2000); // Allow for data loading
      });
    };

    const context = await browser.newContext();
    const dbLoadRunner = new LoadTestRunner({
      concurrency: 2, // Lower concurrency for database stress
      duration: 15000,
      rampUp: 3000
    });
    
    const results = await dbLoadRunner.runLoadTest(databaseStressScenario, context);
    await context.close();
    
    // Database operations should be resilient
    expect(parseFloat(results.successRate)).toBeGreaterThan(80);
    
    console.log('🗄️ Database Stress Test:');
    console.log(`  Success Rate: ${results.successRate}%`);
    console.log(`  Database Operations: ${results.totalRequests}`);
  });

  test('Orchestrated multi-scenario stress test', async ({ browser }) => {
    const orchestrator = new TestOrchestrator();
    
    // Define complex scenarios with dependencies
    orchestrator.addScenario('setup-users', async (context, globalState) => {
      const isolation = new TestIsolation();
      const testUsers = [];
      
      for (let i = 0; i < 3; i++) {
        testUsers.push(await isolation.createIsolatedUser({
          email: 'test@realtechee.com',
          name: 'Test User',
          role: 'basic'
        }));
      }
      
      globalState.set('testUsers', testUsers);
      globalState.set('isolation', isolation);
      return { users: testUsers.length };
    });
    
    orchestrator.addScenario('homepage-load', async (context, globalState) => {
      const page = await context.newPage();
      try {
        await page.goto('/');
        await page.waitForSelector('h1', { timeout: 10000 });
        return { success: true };
      } finally {
        await page.close();
      }
    }, ['setup-users']);
    
    orchestrator.addScenario('contact-forms', async (context, globalState) => {
      const testUsers = globalState.get('testUsers') || [];
      const page = await context.newPage();
      
      try {
        for (const user of testUsers.slice(0, 2)) {
          await page.goto('/contact');
          await page.waitForSelector('form', { timeout: 10000 });
          
          await page.fill('input[name="name"], input[placeholder*="name" i]', user.name);
          await page.fill('input[name="email"], input[type="email"]', user.email);
          await page.fill('textarea[name="message"], textarea[placeholder*="message" i]', 'Orchestrated test message');
          
          await page.click('button[type="submit"], input[type="submit"]');
          await page.waitForTimeout(1000);
        }
        return { formsSubmitted: testUsers.length };
      } finally {
        await page.close();
      }
    }, ['setup-users', 'homepage-load']);
    
    orchestrator.addScenario('cleanup', async (context, globalState) => {
      const isolation = globalState.get('isolation');
      if (isolation) {
        await isolation.executeCleanup();
      }
      return { cleaned: true };
    }, ['contact-forms']);
    
    const context = await browser.newContext();
    const results = await orchestrator.executeScenarios(context);
    await context.close();
    
    // Validate orchestrated test results
    expect(results.get('setup-users')).toHaveProperty('users', 3);
    expect(results.get('homepage-load')).toHaveProperty('success', true);
    expect(results.get('contact-forms')).toHaveProperty('formsSubmitted');
    expect(results.get('cleanup')).toHaveProperty('cleaned', true);
    
    console.log('🎭 Orchestrated Stress Test Results:');
    for (const [scenario, result] of results) {
      console.log(`  ${scenario}: ${JSON.stringify(result)}`);
    }
  });
});

test.describe('Scalability Testing', () => {
  test('Progressive load increase test', async ({ browser }) => {
    const loadLevels = [1, 2, 3]; // Progressive user loads
    const results = [];
    
    for (const userCount of loadLevels) {
      console.log(`📈 Testing with ${userCount} concurrent users`);
      
      const loadRunner = new LoadTestRunner({
        concurrency: userCount,
        duration: 10000, // 10 seconds per level
        rampUp: 2000
      });
      
      const scalabilityScenario = async (page) => {
        await page.goto('/');
        await page.waitForSelector('h1', { timeout: 10000 });
        await page.goto('/contact');
        await page.waitForSelector('form', { timeout: 5000 });
      };
      
      const context = await browser.newContext();
      const result = await loadRunner.runLoadTest(scalabilityScenario, context);
      await context.close();
      
      results.push({
        users: userCount,
        successRate: parseFloat(result.successRate),
        avgResponseTime: result.averageResponseTime,
        requestsPerSecond: parseFloat(result.requestsPerSecond)
      });
    }
    
    // Analyze scalability trends
    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      const previous = results[i - 1];
      
      // Success rate shouldn't drop significantly
      expect(current.successRate).toBeGreaterThan(previous.successRate - 10);
      
      // Response time shouldn't increase dramatically
      const responseTimeIncrease = (current.avgResponseTime - previous.avgResponseTime) / previous.avgResponseTime;
      expect(responseTimeIncrease).toBeLessThan(1.0); // Less than 100% increase
    }
    
    console.log('📊 Scalability Test Results:');
    results.forEach(result => {
      console.log(`  ${result.users} users: ${result.successRate}% success, ${result.avgResponseTime}ms avg`);
    });
  });

  test('Resource exhaustion recovery test', async ({ browser }) => {
    const resourceMonitor = new ResourceMonitor();
    resourceMonitor.startMonitoring(500);
    
    // High-intensity scenario designed to stress resources
    const intensiveScenario = async (page) => {
      // Rapid navigation
      const urls = ['/', '/contact', '/products/kitchen-and-bath', '/products/commercial'];
      
      for (const url of urls) {
        await page.goto(url);
        await page.waitForSelector('h1', { timeout: 5000 });
        
        // Create memory pressure
        await page.evaluate(() => {
          const data = [];
          for (let i = 0; i < 1000; i++) {
            data.push(new Array(1000).fill(Math.random()));
          }
          // Let data go out of scope for GC
          return data.length;
        });
      }
    };
    
    const highLoadRunner = new LoadTestRunner({
      concurrency: 4,
      duration: 15000,
      rampUp: 1000
    });
    
    const context = await browser.newContext();
    const results = await highLoadRunner.runLoadTest(intensiveScenario, context);
    await context.close();
    
    resourceMonitor.stopMonitoring();
    const resourceReport = resourceMonitor.generateResourceReport();
    
    // System should recover gracefully
    expect(parseFloat(results.successRate)).toBeGreaterThan(70); // Allow for some failures under extreme load
    expect(resourceReport.memory.growth).toBeLessThan(200); // Memory should be manageable
    
    console.log('🔥 Resource Exhaustion Test:');
    console.log(`  Success Rate: ${results.successRate}%`);
    console.log(`  Memory Growth: ${resourceReport.memory.growth}MB`);
    console.log(`  Max Memory: ${resourceReport.memory.max}MB`);
  });
});