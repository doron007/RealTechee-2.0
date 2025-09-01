import { test, expect } from '@playwright/test';

test.describe('Comprehensive Playground Validation', () => {
  // Enhanced error monitoring helper
  function setupConsoleMonitoring(page) {
    const consoleErrors = [];
    const consoleWarnings = [];
    const consoleMessages = [];
    const networkErrors = [];
    
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

    return { consoleErrors, consoleWarnings, consoleMessages, networkErrors };
  }

  test('should validate Playground homepage loads without 404 errors', async ({ page }) => {
    const { consoleErrors, networkErrors } = setupConsoleMonitoring(page);
    
    console.log('🏠 Loading Playground homepage...');
    
    // Navigate to playground and verify it loads
    const response = await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // Verify response is successful
    expect(response.status()).toBe(200);
    console.log('✅ Playground homepage loaded successfully (HTTP 200)');
    
    // Wait for page to fully render
    await page.waitForSelector('.header h1', { timeout: 10000 });
    
    // Verify main page elements are present
    await expect(page.locator('.header h1')).toContainText('RealTechee GraphQL Playground');
    await expect(page.locator('.playground-grid')).toBeVisible();
    
    // Take screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/playground-homepage-loaded.png', fullPage: true });
    console.log('📸 Screenshot: playground-homepage-loaded.png');
    
    // Verify no 404 or network errors
    const has404Error = networkErrors.some(error => error.status === 404);
    expect(has404Error).toBeFalsy();
    console.log('✅ No 404 errors detected');
    
    // Verify no console errors on initial load
    const hasJavaScriptErrors = consoleErrors.some(error => 
      error.text.includes('404') ||
      error.text.includes('Failed to fetch') ||
      error.text.includes('TypeError') ||
      error.text.includes('ReferenceError')
    );
    
    expect(hasJavaScriptErrors).toBeFalsy();
    console.log('✅ No JavaScript errors on initial load');
  });

  test('should validate GraphQL endpoint configuration loads correctly', async ({ page }) => {
    const { consoleErrors } = setupConsoleMonitoring(page);
    
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    console.log('🔧 Waiting for GraphQL endpoint configuration to load...');
    
    // Wait for the JavaScript to load amplify_outputs.json and update the endpoint
    await page.waitForTimeout(3000);
    
    // Check if GraphQL endpoint was loaded successfully
    const endpointElement = page.locator('#graphql-endpoint');
    await expect(endpointElement).toBeVisible();
    
    const endpointText = await endpointElement.textContent();
    console.log(`📡 GraphQL Endpoint: ${endpointText}`);
    
    // Verify endpoint is not showing error states
    expect(endpointText).not.toBe('Loading...');
    expect(endpointText).not.toBe('Error loading endpoint');
    expect(endpointText).not.toBe('Not configured');
    
    // Verify it looks like a valid GraphQL endpoint
    expect(endpointText).toMatch(/https?:\/\/.*\.amazonaws\.com\/graphql/);
    console.log('✅ GraphQL endpoint configuration loaded correctly');
    
    // Verify no configuration loading errors
    const hasConfigErrors = consoleErrors.some(error => 
      error.text.includes('Failed to load amplify config') ||
      error.text.includes('amplify_outputs.json') ||
      error.text.includes('fetch')
    );
    
    expect(hasConfigErrors).toBeFalsy();
    console.log('✅ No configuration loading errors');
  });

  test('should validate all navigation links are accessible', async ({ page }) => {
    const { networkErrors } = setupConsoleMonitoring(page);
    
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // Define all navigation links to test
    const navigationLinks = [
      { name: 'GraphiQL IDE', selector: 'a[href="./graphiql.html"]' },
      { name: 'Documentation', selector: 'a[href="./docs.html"]' },
      { name: 'Query Examples', selector: 'a[href="./examples.html"]' },
      { name: 'Testing Scenarios', selector: 'a[href="./testing.html"]' },
      { name: 'Performance Monitor', selector: 'a[href="./performance.html"]' },
      { name: 'Schema Inspector', selector: 'a[href="./schema.html"]' },
      { name: 'Business Workflows', selector: 'a[href="./business-workflows.html"]' },
      { name: 'Notification System', selector: 'a[href="./notification-system.html"]' },
      { name: 'Lead Management', selector: 'a[href="./lead-management.html"]' },
      { name: 'Reporting & Analytics', selector: 'a[href="./reporting.html"]' }
    ];
    
    console.log('🔍 Testing navigation links accessibility...');
    
    for (const link of navigationLinks) {
      console.log(`  Testing ${link.name}...`);
      
      // Verify link exists
      const linkElement = page.locator(link.selector);
      await expect(linkElement).toBeVisible();
      
      // Get href attribute
      const href = await linkElement.getAttribute('href');
      console.log(`    href: ${href}`);
      
      // Test if link is clickable (but don't navigate away)
      await expect(linkElement).toHaveAttribute('href');
      
      // Verify it's a proper relative link
      expect(href).toMatch(/^\.\/.*\.html$/);
    }
    
    console.log('✅ All navigation links are properly structured');
    
    // Test at least one critical link (GraphiQL) actually navigates
    console.log('🧪 Testing GraphiQL navigation...');
    const graphiqlLink = page.locator('a[href="./graphiql.html"]');
    
    // Click GraphiQL link and verify navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      graphiqlLink.click()
    ]);
    
    // Verify we're on the GraphiQL page
    await expect(page).toHaveURL(/.*\/playground\/graphiql\.html$/);
    console.log('✅ GraphiQL navigation successful');
    
    // Verify GraphiQL page loads without errors
    await page.waitForSelector('title', { timeout: 10000 });
    const title = await page.title();
    expect(title).toContain('GraphiQL');
    console.log('✅ GraphiQL page loaded successfully');
    
    // Check for network errors during navigation
    const hasNavigationErrors = networkErrors.some(error => error.status >= 400);
    expect(hasNavigationErrors).toBeFalsy();
    console.log('✅ No network errors during navigation');
  });

  test('should validate GraphiQL IDE functionality', async ({ page }) => {
    const { consoleErrors, networkErrors } = setupConsoleMonitoring(page);
    
    console.log('🎮 Testing GraphiQL IDE functionality...');
    
    await page.goto('/playground/graphiql.html', { waitUntil: 'networkidle' });
    
    // Wait for GraphiQL to initialize
    console.log('⏳ Waiting for GraphiQL to initialize...');
    await page.waitForTimeout(5000);
    
    // Take screenshot of GraphiQL interface
    await page.screenshot({ path: 'tests/screenshots/graphiql-interface.png', fullPage: true });
    console.log('📸 Screenshot: graphiql-interface.png');
    
    // Verify GraphiQL header elements
    await expect(page.locator('.header h1')).toBeVisible();
    await expect(page.locator('.env-selector')).toBeVisible();
    
    // Look for GraphiQL editor interface
    const hasGraphiQLInterface = await page.locator(
      '.graphiql-container, ' +
      '.CodeMirror, ' +
      '.graphiql-editor, ' +
      '[data-testid="graphiql"], ' +
      '.graphiql-wrapper'
    ).count() > 0;
    
    console.log(`GraphiQL interface elements found: ${hasGraphiQLInterface}`);
    
    // Verify environment selector is functional
    const envSelector = page.locator('.env-selector');
    if (await envSelector.count() > 0) {
      console.log('✅ Environment selector present');
      
      // Check if it has options
      const hasOptions = await envSelector.locator('option').count() > 0;
      if (hasOptions) {
        console.log('✅ Environment selector has options');
      }
    }
    
    // Check for GraphiQL-specific errors
    const hasGraphiQLErrors = consoleErrors.some(error => 
      error.text.includes('GraphiQL') ||
      error.text.includes('CodeMirror') ||
      error.text.includes('introspection') ||
      error.text.includes('schema')
    );
    
    expect(hasGraphiQLErrors).toBeFalsy();
    console.log('✅ No GraphiQL-specific errors detected');
    
    // Verify no critical network failures
    const hasCriticalNetworkErrors = networkErrors.some(error => 
      error.status === 500 || error.status === 503
    );
    
    expect(hasCriticalNetworkErrors).toBeFalsy();
    console.log('✅ No critical network errors');
  });

  test('should validate playground performance and loading times', async ({ page }) => {
    const { consoleErrors } = setupConsoleMonitoring(page);
    
    console.log('📊 Testing playground performance...');
    
    // Measure homepage load time
    const homepageStartTime = performance.now();
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    const homepageLoadTime = performance.now() - homepageStartTime;
    console.log(`Homepage load time: ${homepageLoadTime.toFixed(2)}ms`);
    
    // Measure GraphiQL page load time
    const graphiqlStartTime = performance.now();
    await page.goto('/playground/graphiql.html', { waitUntil: 'networkidle' });
    const graphiqlLoadTime = performance.now() - graphiqlStartTime;
    console.log(`GraphiQL load time: ${graphiqlLoadTime.toFixed(2)}ms`);
    
    // Performance assertions (reasonable for static HTML pages)
    expect(homepageLoadTime).toBeLessThan(5000); // 5 seconds max for homepage
    expect(graphiqlLoadTime).toBeLessThan(10000); // 10 seconds max for GraphiQL (more complex)
    
    console.log('✅ All playground pages load within acceptable time');
    
    // Check for performance-related errors
    const hasPerformanceErrors = consoleErrors.some(error => 
      error.text.includes('timeout') ||
      error.text.includes('slow') ||
      error.text.includes('performance') ||
      error.text.includes('memory leak')
    );
    
    expect(hasPerformanceErrors).toBeFalsy();
    console.log('✅ No performance-related errors detected');
  });

  test('should validate playground responsive design and mobile compatibility', async ({ page }) => {
    console.log('📱 Testing responsive design...');
    
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`  Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Verify main elements are still visible
      await expect(page.locator('.header h1')).toBeVisible();
      await expect(page.locator('.playground-grid')).toBeVisible();
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `tests/screenshots/playground-responsive-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
    }
    
    console.log('✅ Playground is responsive across different screen sizes');
  });

  test('should validate playground integration with backend configuration', async ({ page }) => {
    const { consoleErrors, networkErrors } = setupConsoleMonitoring(page);
    
    console.log('🔧 Testing backend configuration integration...');
    
    await page.goto('/playground/index.html', { waitUntil: 'networkidle' });
    
    // Wait for configuration to load
    await page.waitForTimeout(5000);
    
    // Check if amplify_outputs.json is being fetched
    const amplifyConfigRequest = networkErrors.find(error => 
      error.url.includes('amplify_outputs.json')
    );
    
    // If there's a network error for amplify_outputs.json, it might be expected in test environment
    if (amplifyConfigRequest) {
      console.log(`ℹ️  Amplify config request status: ${amplifyConfigRequest.status}`);
      
      // In test environment, 404 for amplify_outputs.json might be acceptable
      if (amplifyConfigRequest.status === 404) {
        console.log('⚠️  amplify_outputs.json not found (expected in test environment)');
        
        // Verify error handling works gracefully
        const endpointElement = page.locator('#graphql-endpoint');
        const endpointText = await endpointElement.textContent();
        
        expect(endpointText).toBe('Error loading endpoint');
        console.log('✅ Graceful error handling for missing config');
      }
    } else {
      // If no error, configuration should have loaded successfully
      const endpointElement = page.locator('#graphql-endpoint');
      const endpointText = await endpointElement.textContent();
      
      expect(endpointText).not.toBe('Loading...');
      expect(endpointText).not.toBe('Not configured');
      console.log('✅ Configuration loaded successfully');
    }
    
    // Verify no JavaScript errors in configuration handling
    const hasConfigurationErrors = consoleErrors.some(error => 
      error.text.includes('JSON.parse') ||
      error.text.includes('fetch error') ||
      error.text.includes('configuration')
    );
    
    expect(hasConfigurationErrors).toBeFalsy();
    console.log('✅ No configuration handling errors');
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/playground-backend-integration.png', fullPage: true });
    console.log('📸 Screenshot: playground-backend-integration.png');
  });
});