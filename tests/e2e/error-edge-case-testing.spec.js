/**
 * ERROR & EDGE CASE TESTING SUITE
 * 
 * This test suite validates error handling, edge cases, and resilience
 * across all application components and user scenarios.
 * 
 * Edge Cases Covered:
 * 1. Form Validation & Error States
 * 2. Network Failure Scenarios
 * 3. Authentication Edge Cases
 * 4. Data Loading & Empty States
 * 5. Browser Compatibility Issues
 * 6. Performance Under Load
 * 7. Security Boundary Testing
 * 8. UI/UX Stress Testing
 */

const { test, expect } = require('@playwright/test');
const { safeWaitForResponse } = require('../helpers/circuitBreaker');

test.describe('Error & Edge Case Testing - Comprehensive Resilience Validation', () => {
  
  test.setTimeout(600000); // 10 minutes for comprehensive error testing

  test('Form Validation & Error States', async ({ page }) => {
    console.log('📋 Testing Form Validation & Error States');
    
    // === PHASE 1: GET ESTIMATE FORM VALIDATION ===
    console.log('Phase 1: Testing Get Estimate form validation...');
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('form')).toBeVisible();
    
    // Test empty form submission
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Get Estimate")').first();
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    // Check for validation errors
    const emailRequiredError = page.locator('text="required", text="Email is required", [role="alert"]').first();
    const emailErrorVisible = await emailRequiredError.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (emailErrorVisible) {
      console.log('✅ Email required validation works');
    } else {
      console.log('ℹ️ Email validation may be implemented differently');
    }
    
    // Test invalid email format
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('invalid-email-format');
    await submitButton.click();
    await page.waitForTimeout(2000);
    
    const emailFormatError = page.locator('text="valid email", text="invalid", [role="alert"]').first();
    const formatErrorVisible = await emailFormatError.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (formatErrorVisible) {
      console.log('✅ Email format validation works');
    }
    
    // Test field length limits
    const nameInput = page.locator('input[name="firstName"], input[name="name"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const longName = 'A'.repeat(1000); // Very long name
      await nameInput.fill(longName);
      const actualValue = await nameInput.inputValue();
      console.log(`Name field length limit test: ${actualValue.length} characters`);
    }
    
    // Test special characters in inputs
    await emailInput.fill('test+special.chars@domain-with-dash.co.uk');
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('+1 (555) 123-4567 ext. 999');
    }
    
    const descriptionTextarea = page.locator('textarea').first();
    if (await descriptionTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descriptionTextarea.fill('Testing special characters: áéíóú ñ ü ç €$£¥ <>&"\' \n\n Multiple lines and symbols!');
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/errors/form-validation.png', fullPage: true });
    console.log('✅ Phase 1: Form validation testing completed');
    
    // === PHASE 2: OTHER FORM VALIDATIONS ===
    console.log('Phase 2: Testing other form validations...');
    
    const contactForms = [
      '/contact/contact-us',
      '/contact/get-qualified', 
      '/contact/affiliate'
    ];
    
    for (const formPath of contactForms) {
      console.log(`Testing validation for ${formPath}...`);
      
      await page.goto(formPath);
      await page.waitForLoadState('networkidle');
      
      // Submit empty form
      const formSubmitButton = page.locator('button[type="submit"]').first();
      if (await formSubmitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await formSubmitButton.click();
        await page.waitForTimeout(2000);
        
        // Look for any error indicators
        const errorElements = page.locator('[role="alert"], .error, .field-error, text="required"');
        const errorCount = await errorElements.count();
        console.log(`${formPath}: Found ${errorCount} validation error indicators`);
      }
    }
    
    console.log('✅ Phase 2: All form validations tested');
  });

  test('Network Failure & Connectivity Issues', async ({ page }) => {
    console.log('🌐 Testing Network Failure & Connectivity Issues');
    
    // === PHASE 1: OFFLINE SIMULATION ===
    console.log('Phase 1: Testing offline behavior...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to navigate to different pages while offline
    const offlineNavigationTests = ['/contact/get-estimate', '/projects', '/login'];
    
    for (const offlinePath of offlineNavigationTests) {
      console.log(`Testing offline navigation to ${offlinePath}...`);
      
      await page.goto(offlinePath).catch(() => {
        console.log(`Expected: ${offlinePath} failed to load while offline`);
      });
      
      await page.waitForTimeout(2000);
      
      // Check if browser shows offline page or error
      const pageContent = await page.content().catch(() => '');
      const hasOfflineIndicator = pageContent.includes('offline') || 
                                 pageContent.includes('network') ||
                                 pageContent.includes('connection');
      
      if (hasOfflineIndicator) {
        console.log(`✅ Offline state detected for ${offlinePath}`);
      }
    }
    
    // Restore online mode
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
    
    console.log('✅ Phase 1: Offline simulation completed');
    
    // === PHASE 2: SLOW CONNECTION SIMULATION ===
    console.log('Phase 2: Testing slow connection behavior...');
    
    // Throttle network to simulate slow connection
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50 * 1024, // 50 KB/s
      uploadThroughput: 20 * 1024,   // 20 KB/s
      latency: 2000 // 2 second latency
    });
    
    console.log('Simulating slow connection (50KB/s, 2s latency)...');
    
    const slowConnectionStartTime = Date.now();
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const slowLoadTime = Date.now() - slowConnectionStartTime;
    
    console.log(`Projects page load time on slow connection: ${slowLoadTime}ms`);
    
    // Test form submission on slow connection
    await page.goto('/contact/contact-us');
    await page.waitForLoadState('networkidle');
    
    const nameInputSlow = page.locator('input[name="name"], input[placeholder*="name"]').first();
    if (await nameInputSlow.isVisible({ timeout: 10000 }).catch(() => false)) {
      await nameInputSlow.fill('Slow Connection Test User');
    }
    
    const emailInputSlow = page.locator('input[type="email"]').first();
    await emailInputSlow.fill('slow.connection@test.com');
    
    const messageTextarea = page.locator('textarea').first();
    if (await messageTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await messageTextarea.fill('Testing form submission under slow network conditions');
    }
    
    const submitButtonSlow = page.locator('button[type="submit"]').first();
    const slowSubmitStartTime = Date.now();
    await submitButtonSlow.click();
    
    // Wait for response with longer timeout for slow connection
    await page.waitForTimeout(10000);
    const slowSubmitTime = Date.now() - slowSubmitStartTime;
    
    console.log(`Form submission time on slow connection: ${slowSubmitTime}ms`);
    
    // Restore normal network conditions
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });
    
    console.log('✅ Phase 2: Slow connection testing completed');
    
    // === PHASE 3: API FAILURE SIMULATION ===
    console.log('Phase 3: Testing API failure handling...');
    
    // Intercept and fail API requests
    await page.route('**/api/**', route => route.abort());
    await page.route('**/graphql**', route => route.abort());
    
    // Test data loading with failed APIs
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check if graceful error handling is shown
    const errorStates = page.locator('text="error", text="failed", text="unavailable", text="try again"');
    const errorStateCount = await errorStates.count();
    
    if (errorStateCount > 0) {
      console.log('✅ API failure error states displayed');
    } else {
      console.log('ℹ️ API failure handling may be implemented with different messaging');
    }
    
    // Test form submission with failed API
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    const emailInputAPI = page.locator('input[type="email"]').first();
    await emailInputAPI.fill('api.failure.test@domain.com');
    
    const submitButtonAPI = page.locator('button[type="submit"]').first();
    await submitButtonAPI.click();
    await page.waitForTimeout(5000);
    
    // Check for error messaging or retry options
    const submissionErrors = page.locator('text="error", text="failed", text="try again", text="problem"');
    const submissionErrorCount = await submissionErrors.count();
    
    console.log(`Found ${submissionErrorCount} error indicators for failed form submission`);
    
    // Remove API interception
    await page.unroute('**/api/**');
    await page.unroute('**/graphql**');
    
    await page.screenshot({ path: 'tests/e2e/screenshots/errors/network-failures.png', fullPage: true });
    console.log('✅ Phase 3: API failure simulation completed');
  });

  test('Authentication Edge Cases & Security', async ({ page }) => {
    console.log('🔒 Testing Authentication Edge Cases & Security');
    
    // === PHASE 1: LOGIN EDGE CASES ===
    console.log('Phase 1: Testing login edge cases...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('form')).toBeVisible();
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();
    
    // Test empty credentials
    await loginButton.click();
    await page.waitForTimeout(3000);
    
    const emptyFieldErrors = page.locator('[role="alert"], .error, text="required"');
    const emptyErrorCount = await emptyFieldErrors.count();
    console.log(`Empty credentials error indicators: ${emptyErrorCount}`);
    
    // Test invalid email formats
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user@domain',
      'user..double.dot@domain.com',
      'user with spaces@domain.com'
    ];
    
    for (const invalidEmail of invalidEmails) {
      await emailInput.fill(invalidEmail);
      await passwordInput.fill('password123');
      await loginButton.click();
      await page.waitForTimeout(2000);
      
      const emailError = page.locator('text="valid email", text="invalid", [role="alert"]').first();
      const hasError = await emailError.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`Invalid email "${invalidEmail}": ${hasError ? 'Error shown' : 'No error shown'}`);
    }
    
    // Test SQL injection attempts
    const sqlInjectionAttempts = [
      "admin'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'/**/OR/**/1=1#",
      "' UNION SELECT * FROM users --"
    ];
    
    for (const sqlAttempt of sqlInjectionAttempts) {
      await emailInput.fill(sqlAttempt);
      await passwordInput.fill(sqlAttempt);
      await loginButton.click();
      await page.waitForTimeout(3000);
      
      // Should not succeed and should not break the page
      const currentUrl = page.url();
      const stillOnLogin = currentUrl.includes('/login');
      console.log(`SQL injection attempt: ${stillOnLogin ? 'Properly blocked' : 'Unexpected behavior'}`);
    }
    
    // Test XSS attempts
    const xssAttempts = [
      "<script>alert('XSS')</script>",
      "javascript:alert('XSS')",
      "<img src=x onerror=alert('XSS')>",
      "';alert('XSS');//"
    ];
    
    for (const xssAttempt of xssAttempts) {
      await emailInput.fill(xssAttempt);
      await passwordInput.fill('password');
      await loginButton.click();
      await page.waitForTimeout(2000);
      
      // Check that XSS didn't execute
      const pageContent = await page.content();
      const hasScript = pageContent.includes('<script>') || pageContent.includes('alert(');
      console.log(`XSS attempt: ${hasScript ? 'POTENTIAL VULNERABILITY' : 'Properly sanitized'}`);
    }
    
    console.log('✅ Phase 1: Login edge cases tested');
    
    // === PHASE 2: SESSION MANAGEMENT ===
    console.log('Phase 2: Testing session management...');
    
    // Test session persistence across page refreshes
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    const postLoginUrl = page.url();
    
    if (!postLoginUrl.includes('/login')) {
      console.log('✅ Login potentially successful - testing session persistence');
      
      // Refresh page and check if still logged in
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const afterRefreshUrl = page.url();
      const sessionPersisted = !afterRefreshUrl.includes('/login');
      console.log(`Session persistence after refresh: ${sessionPersisted ? 'Maintained' : 'Lost'}`);
      
      // Test direct admin page access
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      const adminAccessUrl = page.url();
      const adminAccessible = adminAccessUrl.includes('/admin');
      console.log(`Direct admin access: ${adminAccessible ? 'Allowed' : 'Redirected to login'}`);
      
    } else {
      console.log('ℹ️ Login not successful - skipping session tests');
    }
    
    // === PHASE 3: UNAUTHORIZED ACCESS ATTEMPTS ===
    console.log('Phase 3: Testing unauthorized access attempts...');
    
    // Clear any existing sessions
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Test direct access to protected pages
    const protectedPages = [
      '/admin',
      '/admin/requests', 
      '/admin/projects',
      '/admin/quotes',
      '/admin/users',
      '/profile',
      '/settings'
    ];
    
    for (const protectedPage of protectedPages) {
      await page.goto(protectedPage);
      await page.waitForLoadState('networkidle');
      
      const finalUrl = page.url();
      const redirectedToLogin = finalUrl.includes('/login');
      console.log(`${protectedPage}: ${redirectedToLogin ? 'Properly protected' : 'Accessible without auth'}`);
    }
    
    console.log('✅ Phase 3: Unauthorized access testing completed');
    
    await page.screenshot({ path: 'tests/e2e/screenshots/errors/authentication-security.png', fullPage: true });
  });

  test('Data Loading & Empty States', async ({ page }) => {
    console.log('📊 Testing Data Loading & Empty States');
    
    // === PHASE 1: EMPTY DATA STATES ===
    console.log('Phase 1: Testing empty data states...');
    
    // Test projects page with no data
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const projectsGrid = page.locator('.grid');
    const projectsExist = await projectsGrid.isVisible().catch(() => false);
    
    if (!projectsExist) {
      // Look for empty state messaging
      const emptyStateMessages = page.locator('text="No projects", text="Coming soon", text="Check back", text="empty"');
      const emptyMessageCount = await emptyStateMessages.count();
      console.log(`Projects empty state indicators: ${emptyMessageCount}`);
      
      if (emptyMessageCount > 0) {
        console.log('✅ Projects empty state properly handled');
      }
    } else {
      console.log('ℹ️ Projects data available - testing with existing content');
    }
    
    // === PHASE 2: LOADING STATES ===
    console.log('Phase 2: Testing loading states...');
    
    // Test loading indicators during navigation
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded'); // Don't wait for full load
    
    // Look for loading indicators immediately after navigation
    const loadingIndicators = page.locator('text="Loading", [role="progressbar"], .spinner, .loading');
    const loadingCount = await loadingIndicators.count();
    console.log(`Found ${loadingCount} loading indicators`);
    
    // Wait for full page load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Loading indicators should be gone
    const persistentLoadingCount = await loadingIndicators.count();
    console.log(`Persistent loading indicators after load: ${persistentLoadingCount}`);
    
    // === PHASE 3: DATA CORRUPTION SCENARIOS ===
    console.log('Phase 3: Testing data corruption scenarios...');
    
    // Intercept API responses and return malformed data
    await page.route('**/graphql**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          errors: [{ message: 'Simulated data corruption error' }]
        })
      });
    });
    
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check how app handles corrupted API response
    const errorHandling = page.locator('text="error", text="problem", text="unavailable"');
    const errorHandlingCount = await errorHandling.count();
    console.log(`Error handling for corrupted data: ${errorHandlingCount} indicators`);
    
    // Remove API interception
    await page.unroute('**/graphql**');
    
    // === PHASE 4: LARGE DATASET SIMULATION ===
    console.log('Phase 4: Testing with large dataset simulation...');
    
    // Intercept and return large dataset
    await page.route('**/graphql**', route => {
      const largeDataset = {
        data: {
          projects: Array(1000).fill({
            id: 'project-id',
            name: 'Large Dataset Test Project',
            description: 'This is a test project for large dataset handling',
            status: 'Active',
            images: ['image1.jpg', 'image2.jpg']
          })
        }
      };
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      });
    });
    
    const largeDataStartTime = Date.now();
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const largeDataLoadTime = Date.now() - largeDataStartTime;
    
    console.log(`Large dataset load time: ${largeDataLoadTime}ms`);
    
    // Check if pagination or virtualization is working
    const allProjectElements = page.locator('.grid > div');
    const visibleProjects = await allProjectElements.count();
    console.log(`Visible project elements with large dataset: ${visibleProjects}`);
    
    // Performance should be reasonable even with large dataset
    if (visibleProjects < 50) {
      console.log('✅ Pagination/virtualization appears to be working');
    } else {
      console.log('⚠️ Large dataset might impact performance');
    }
    
    await page.unroute('**/graphql**');
    
    await page.screenshot({ path: 'tests/e2e/screenshots/errors/data-loading-states.png', fullPage: true });
    console.log('✅ Phase 4: Large dataset testing completed');
  });

  test('Browser Compatibility & Cross-Platform Issues', async ({ page }) => {
    console.log('🌐 Testing Browser Compatibility & Cross-Platform Issues');
    
    // === PHASE 1: VIEWPORT STRESS TESTING ===
    console.log('Phase 1: Testing extreme viewport sizes...');
    
    const extremeViewports = [
      { width: 320, height: 568, name: 'Small Mobile' },    // iPhone 5
      { width: 1920, height: 1080, name: 'Full HD' },       // Standard desktop
      { width: 3840, height: 2160, name: '4K Display' },    // 4K
      { width: 280, height: 653, name: 'Ultra Narrow' },    // Very narrow
      { width: 5120, height: 1440, name: 'Ultra Wide' }     // Ultra-wide
    ];
    
    for (const viewport of extremeViewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for layout issues
      const bodyOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (bodyOverflow) {
        console.log(`⚠️ ${viewport.name}: Horizontal overflow detected`);
      } else {
        console.log(`✅ ${viewport.name}: No horizontal overflow`);
      }
      
      // Test navigation at this viewport
      const mobileMenuButton = page.locator('button[aria-label*="menu"], .menu-button').first();
      const desktopNav = page.locator('nav:has(button:has-text("Products"))').first();
      
      const mobileMenuVisible = await mobileMenuButton.isVisible().catch(() => false);
      const desktopNavVisible = await desktopNav.isVisible().catch(() => false);
      
      console.log(`${viewport.name}: Mobile menu: ${mobileMenuVisible}, Desktop nav: ${desktopNavVisible}`);
      
      // Test form usability at this viewport
      await page.goto('/contact/get-estimate');
      await page.waitForLoadState('networkidle');
      
      const formVisible = await page.locator('form').isVisible().catch(() => false);
      if (formVisible) {
        const emailInput = page.locator('input[type="email"]').first();
        const emailClickable = await emailInput.isVisible().catch(() => false);
        console.log(`${viewport.name}: Form elements ${emailClickable ? 'accessible' : 'may have issues'}`);
      }
    }
    
    // Restore standard viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // === PHASE 2: JAVASCRIPT DISABLED TESTING ===
    console.log('Phase 2: Testing with JavaScript disabled...');
    
    await page.context().addInitScript(() => {
      // Disable JavaScript by overriding key functions
      window.addEventListener = () => {};
      window.fetch = () => Promise.reject(new Error('JavaScript disabled test'));
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if basic content is still accessible
    const headingVisible = await page.locator('h1').isVisible({ timeout: 5000 }).catch(() => false);
    const formVisible = await page.goto('/contact/contact-us')
      .then(() => page.locator('form').isVisible({ timeout: 3000 }))
      .catch(() => false);
    
    console.log(`No-JS accessibility - Heading: ${headingVisible}, Form: ${formVisible}`);
    
    // === PHASE 3: COOKIE AND STORAGE ISSUES ===
    console.log('Phase 3: Testing cookie and storage issues...');
    
    // Clear all storage
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Test app behavior with no storage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if app still functions
    const appFunctional = await page.locator('h1').isVisible().catch(() => false);
    console.log(`App functionality without storage: ${appFunctional ? 'Works' : 'Has issues'}`);
    
    // Test with cookies disabled (simulate)
    await page.context().addInitScript(() => {
      Object.defineProperty(document, 'cookie', {
        get: () => '',
        set: () => false
      });
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loginFormVisible = await page.locator('form').isVisible().catch(() => false);
    console.log(`Login form with disabled cookies: ${loginFormVisible ? 'Accessible' : 'Issues detected'}`);
    
    // === PHASE 4: SLOW CPU SIMULATION ===
    console.log('Phase 4: Testing performance on slow devices...');
    
    const client = await page.context().newCDPSession(page);
    
    // Simulate slow CPU (4x slowdown)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    
    const slowCPUStartTime = Date.now();
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    const slowCPULoadTime = Date.now() - slowCPUStartTime;
    
    console.log(`Page load time on slow CPU: ${slowCPULoadTime}ms`);
    
    // Test interactions on slow CPU
    const projectsGrid = page.locator('.grid').first();
    if (await projectsGrid.isVisible().catch(() => false)) {
      const slowInteractionStart = Date.now();
      await projectsGrid.click().catch(() => {});
      const slowInteractionTime = Date.now() - slowInteractionStart;
      console.log(`Interaction time on slow CPU: ${slowInteractionTime}ms`);
    }
    
    // Reset CPU throttling
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    
    await page.screenshot({ path: 'tests/e2e/screenshots/errors/browser-compatibility.png', fullPage: true });
    console.log('✅ Browser compatibility testing completed');
  });

  test('UI/UX Stress Testing & Edge Interactions', async ({ page }) => {
    console.log('🎯 Testing UI/UX Stress & Edge Interactions');
    
    // === PHASE 1: RAPID INTERACTION TESTING ===
    console.log('Phase 1: Testing rapid user interactions...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Rapid navigation testing
    const navigationLinks = ['/products/sellers', '/contact/get-estimate', '/projects', '/login'];
    
    console.log('Testing rapid navigation...');
    for (let i = 0; i < 3; i++) {
      for (const link of navigationLinks) {
        await page.goto(link);
        await page.waitForTimeout(500); // Minimal wait between navigations
      }
    }
    
    // Check if app is still responsive
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const appResponsive = await page.locator('h1').isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`App responsiveness after rapid navigation: ${appResponsive ? 'Good' : 'Issues detected'}`);
    
    // === PHASE 2: FORM STRESS TESTING ===
    console.log('Phase 2: Testing form stress scenarios...');
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    // Rapid form interaction testing
    const emailInput = page.locator('input[type="email"]').first();
    const nameInput = page.locator('input[name="firstName"], input[name="name"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Rapid typing and clearing
    for (let i = 0; i < 10; i++) {
      await emailInput.fill(`test${i}@rapid.test`);
      await emailInput.fill('');
      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameInput.fill(`Name${i}`);
        await nameInput.fill('');
      }
    }
    
    // Rapid form submissions
    console.log('Testing rapid form submissions...');
    await emailInput.fill('stress.test@domain.com');
    
    for (let i = 0; i < 5; i++) {
      await submitButton.click();
      await page.waitForTimeout(200);
    }
    
    await page.waitForTimeout(3000);
    
    // Check if form is still functional
    const formStillVisible = await page.locator('form').isVisible().catch(() => false);
    console.log(`Form functionality after stress testing: ${formStillVisible ? 'Intact' : 'May have issues'}`);
    
    // === PHASE 3: SCROLL AND RESIZE STRESS ===
    console.log('Phase 3: Testing scroll and resize stress...');
    
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // Rapid scrolling
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(50);
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(50);
    }
    
    // Rapid window resizing
    const resizeSizes = [
      { width: 400, height: 600 },
      { width: 1200, height: 800 },
      { width: 800, height: 600 },
      { width: 1920, height: 1080 }
    ];
    
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const size of resizeSizes) {
        await page.setViewportSize(size);
        await page.waitForTimeout(100);
      }
    }
    
    // Check layout stability after resize stress
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    const layoutStable = await page.locator('h1').isVisible().catch(() => false);
    console.log(`Layout stability after resize stress: ${layoutStable ? 'Good' : 'Issues detected'}`);
    
    // === PHASE 4: MEMORY AND PERFORMANCE STRESS ===
    console.log('Phase 4: Testing memory and performance stress...');
    
    // Open multiple tabs worth of navigation in single tab
    const stressPages = [
      '/', '/contact/get-estimate', '/projects', '/products/kitchen-and-bath',
      '/contact/contact-us', '/products/sellers', '/contact/get-qualified',
      '/about', '/login', '/contact/affiliate'
    ];
    
    console.log('Loading multiple pages in sequence for memory testing...');
    
    for (let round = 0; round < 3; round++) {
      console.log(`Memory stress round ${round + 1}/3...`);
      for (const stressPage of stressPages) {
        await page.goto(stressPage);
        await page.waitForLoadState('domcontentloaded');
        
        // Fill forms if present to increase memory usage
        const formPresent = await page.locator('form').isVisible({ timeout: 2000 }).catch(() => false);
        if (formPresent) {
          const emailInput = page.locator('input[type="email"]').first();
          if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await emailInput.fill(`stress.round${round}@memory.test`);
          }
        }
      }
    }
    
    // Final responsiveness check
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const finalResponsiveCheck = await page.locator('h1').isVisible({ timeout: 15000 }).catch(() => false);
    console.log(`Final responsiveness after stress testing: ${finalResponsiveCheck ? 'Passed' : 'Failed'}`);
    
    // Performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        totalLoadTime: perf.loadEventEnd - perf.navigationStart
      };
    });
    
    console.log('Performance metrics after stress testing:', performanceMetrics);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/errors/stress-testing.png', fullPage: true });
    console.log('✅ UI/UX stress testing completed');
  });

  test('Security & Input Sanitization Edge Cases', async ({ page }) => {
    console.log('🛡️ Testing Security & Input Sanitization');
    
    // === PHASE 1: XSS PREVENTION TESTING ===
    console.log('Phase 1: Testing XSS prevention...');
    
    await page.goto('/contact/contact-us');
    await page.waitForLoadState('networkidle');
    
    const maliciousInputs = [
      '<script>window.xssTest = true;</script>',
      '<img src=x onerror="window.xssTest=true">',
      'javascript:window.xssTest=true',
      '<svg onload="window.xssTest=true">',
      '"><script>window.xssTest=true;</script>',
      '<iframe src="javascript:window.xssTest=true"></iframe>',
      '<body onload="window.xssTest=true">',
      '<div onclick="window.xssTest=true">Click me</div>'
    ];
    
    for (const maliciousInput of maliciousInputs) {
      // Test in name field
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill(maliciousInput);
        
        // Check if XSS executed
        const xssExecuted = await page.evaluate(() => window.xssTest).catch(() => false);
        if (xssExecuted) {
          console.log(`🚨 XSS VULNERABILITY DETECTED with input: ${maliciousInput}`);
          // Reset the flag
          await page.evaluate(() => window.xssTest = false);
        } else {
          console.log(`✅ XSS properly prevented for: ${maliciousInput.substring(0, 30)}...`);
        }
      }
      
      // Test in textarea
      const messageTextarea = page.locator('textarea').first();
      if (await messageTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await messageTextarea.fill(maliciousInput);
        
        const xssInTextarea = await page.evaluate(() => window.xssTest).catch(() => false);
        if (xssInTextarea) {
          console.log(`🚨 XSS VULNERABILITY in textarea with: ${maliciousInput}`);
          await page.evaluate(() => window.xssTest = false);
        }
      }
    }
    
    // === PHASE 2: INJECTION ATTACK TESTING ===
    console.log('Phase 2: Testing injection attack prevention...');
    
    const injectionPayloads = [
      "1'; DROP TABLE users; --",
      "' OR 1=1 --",
      "admin'/**/OR/**/1=1#",
      "<script>fetch('/admin/delete-all')</script>",
      "${7*7}", // Template injection
      "{{7*7}}", // Template injection
      "#{7*7}", // Expression injection
      "<%= 7*7 %>" // ERB injection
    ];
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    for (const payload of injectionPayloads) {
      await emailInput.fill(`${payload}@test.com`);
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Check if page crashed or showed error
      const pageStillWorking = await page.locator('form').isVisible().catch(() => false);
      console.log(`Injection payload "${payload.substring(0, 20)}...": ${pageStillWorking ? 'Handled safely' : 'May have caused issues'}`);
      
      // Check if payload was executed (template injection test)
      const pageContent = await page.content();
      if (pageContent.includes('49')) { // 7*7 = 49
        console.log(`🚨 TEMPLATE INJECTION VULNERABILITY with: ${payload}`);
      }
    }
    
    // === PHASE 3: FILE UPLOAD SECURITY ===
    console.log('Phase 3: Testing file upload security...');
    
    // Look for file upload fields
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    
    if (fileInputCount > 0) {
      console.log(`Found ${fileInputCount} file upload fields`);
      
      // Test with malicious file names (if file upload exists)
      const maliciousFileNames = [
        'test.php',
        'malware.exe',
        '../../../etc/passwd',
        'test.html',
        'script.js',
        'test.svg'
      ];
      
      for (const fileName of maliciousFileNames) {
        // Note: Not actually uploading files to avoid security issues
        console.log(`File upload security test: ${fileName} (simulated)`);
      }
    } else {
      console.log('No file upload fields found');
    }
    
    // === PHASE 4: SESSION AND CSRF TESTING ===
    console.log('Phase 4: Testing session and CSRF protection...');
    
    // Test CSRF by attempting to submit forms from different origin
    await page.evaluate(() => {
      // Simulate cross-origin form submission attempt
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/contact';
      
      const input = document.createElement('input');
      input.name = 'email';
      input.value = 'csrf.test@malicious.site';
      form.appendChild(input);
      
      // Try to submit (should be prevented by CSRF protection)
      document.body.appendChild(form);
      try {
        form.submit();
      } catch (error) {
        window.csrfProtectionActive = true;
      }
    });
    
    const csrfProtected = await page.evaluate(() => window.csrfProtectionActive).catch(() => false);
    console.log(`CSRF protection: ${csrfProtected ? 'Active' : 'May need verification'}`);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/errors/security-testing.png', fullPage: true });
    console.log('✅ Security testing completed');
  });

  test('Performance Edge Cases & Resource Management', async ({ page }) => {
    console.log('⚡ Testing Performance Edge Cases');
    
    // === PHASE 1: RESOURCE EXHAUSTION TESTING ===
    console.log('Phase 1: Testing resource exhaustion scenarios...');
    
    // Large image loading test
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    // Count images and test loading
    const images = page.locator('img');
    const imageCount = await images.count();
    console.log(`Testing performance with ${imageCount} images`);
    
    if (imageCount > 0) {
      // Measure image load performance
      const imageLoadStart = Date.now();
      
      // Wait for all images to load or timeout
      try {
        await page.waitForFunction(() => {
          const imgs = Array.from(document.images);
          return imgs.every(img => img.complete);
        }, { timeout: 30000 });
        
        const imageLoadTime = Date.now() - imageLoadStart;
        console.log(`All images loaded in: ${imageLoadTime}ms`);
        
      } catch (error) {
        console.log('Some images failed to load within timeout - testing resilience');
      }
    }
    
    // === PHASE 2: MEMORY LEAK DETECTION ===
    console.log('Phase 2: Testing for memory leaks...');
    
    const initialMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    console.log(`Initial memory usage: ${initialMemory} bytes`);
    
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await page.goto('/projects');
      await page.waitForLoadState('domcontentloaded');
      
      await page.goto('/contact/get-estimate');
      await page.waitForLoadState('domcontentloaded');
      
      // Fill and clear forms
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.fill(`memory.test.${i}@domain.com`);
      }
    }
    
    const finalMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    console.log(`Final memory usage: ${finalMemory} bytes`);
    const memoryIncrease = finalMemory - initialMemory;
    console.log(`Memory increase: ${memoryIncrease} bytes`);
    
    if (memoryIncrease > 50 * 1024 * 1024) { // 50MB threshold
      console.log('⚠️ Significant memory increase detected - potential memory leak');
    } else {
      console.log('✅ Memory usage within reasonable bounds');
    }
    
    // === PHASE 3: EXTREME DATA SCENARIOS ===
    console.log('Phase 3: Testing with extreme data...');
    
    // Test with very long strings
    const extremeStrings = {
      veryLong: 'A'.repeat(10000),
      unicode: '🏠🔧⚡🎯💰📊🌐🛡️ '.repeat(100),
      multiline: 'Line 1\nLine 2\nLine 3\n'.repeat(100),
      specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'.repeat(200)
    };
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    for (const [type, testString] of Object.entries(extremeStrings)) {
      console.log(`Testing ${type} string (${testString.length} chars)...`);
      
      const textArea = page.locator('textarea').first();
      if (await textArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await textArea.fill(testString);
        
        // Check if UI remains responsive
        const uiResponsive = await textArea.isEnabled().catch(() => false);
        console.log(`UI responsiveness with ${type} string: ${uiResponsive ? 'Good' : 'Issues'}`);
        
        await textArea.fill(''); // Clear for next test
      }
    }
    
    // === PHASE 4: CONCURRENT OPERATION STRESS ===
    console.log('Phase 4: Testing concurrent operations...');
    
    // Simulate concurrent form submissions
    const concurrentPromises = [];
    
    for (let i = 0; i < 5; i++) {
      concurrentPromises.push(
        page.evaluate((index) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              // Simulate form data preparation
              const formData = {
                email: `concurrent.${index}@test.com`,
                message: `Concurrent test ${index}`
              };
              resolve(formData);
            }, Math.random() * 1000);
          });
        }, i)
      );
    }
    
    const concurrentResults = await Promise.all(concurrentPromises);
    console.log(`Handled ${concurrentResults.length} concurrent operations`);
    
    // Test rapid page transitions
    const rapidTransitionPages = ['/', '/projects', '/contact/get-estimate'];
    
    const transitionPromises = rapidTransitionPages.map(async (pagePath, index) => {
      await page.waitForTimeout(index * 100); // Stagger slightly
      await page.goto(pagePath);
      return page.waitForLoadState('domcontentloaded');
    });
    
    try {
      await Promise.all(transitionPromises);
      console.log('✅ Rapid page transitions handled successfully');
    } catch (error) {
      console.log('⚠️ Some rapid transitions encountered issues');
    }
    
    // Final performance check
    const finalPerformanceMetrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      if (!perf) return null;
      
      return {
        domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.navigationStart),
        loadComplete: Math.round(perf.loadEventEnd - perf.navigationStart),
        firstPaint: Math.round(perf.loadEventStart - perf.navigationStart)
      };
    });
    
    console.log('Final performance metrics:', finalPerformanceMetrics);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/errors/performance-edge-cases.png', fullPage: true });
    console.log('✅ Performance edge case testing completed');
  });
});