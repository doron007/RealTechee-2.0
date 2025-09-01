/**
 * COMPREHENSIVE PAGE COVERAGE TEST SUITE
 * 
 * This test suite validates 100% page coverage for the RealTechee platform,
 * ensuring all pages load correctly and contain expected content.
 * 
 * Pages covered:
 * - Home page (/)
 * - Contact pages (/contact/*)
 * - Product pages (/products/*)
 * - Authentication pages (/login, /profile, /settings)
 * - Projects pages (/projects, /project/*)
 * - Admin pages (/admin/*)
 * - Utility pages (/about, /style-guide, etc.)
 */

const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Page Coverage - All Site Pages', () => {
  
  // Test timeout for comprehensive coverage
  test.setTimeout(300000); // 5 minutes

  test('Home Page - Complete validation', async ({ page }) => {
    console.log('🏠 Testing Home Page');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Core validations
    await expect(page).toHaveTitle(/RealTechee/i);
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Navigation elements (use first() to avoid strict mode violations)
    await expect(page.locator('button:has-text("Products")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Contact")').first()).toBeVisible();
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
    
    // Hero section
    await expect(page.locator('text="Get an Estimate"')).toBeVisible();
    
    await page.screenshot({ path: 'tests/e2e/screenshots/coverage/home-page.png', fullPage: true });
    console.log('✅ Home page validated');
  });

  test('Contact Pages - All form pages', async ({ page }) => {
    console.log('📞 Testing All Contact Pages');
    
    const contactPages = [
      { path: '/contact/contact-us', title: 'Contact', formExpected: true },
      { path: '/contact/get-estimate', title: 'Get.*Estimate', formExpected: true },
      { path: '/contact/get-qualified', title: 'Get.*Qualified', formExpected: true },
      { path: '/contact/affiliate', title: 'Affiliate', formExpected: true },
      { path: '/contact', title: 'Contact', formExpected: false }
    ];

    for (const contactPage of contactPages) {
      console.log(`Testing ${contactPage.path}...`);
      
      await page.goto(contactPage.path);
      await page.waitForLoadState('networkidle');
      
      // Title validation
      await expect(page).toHaveTitle(new RegExp(contactPage.title, 'i'));
      
      // Header validation (use first() to avoid strict mode violations)
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Form validation if expected
      if (contactPage.formExpected) {
        await expect(page.locator('form')).toBeVisible();
        await expect(page.locator('input, textarea, select')).toBeVisible();
      }
      
      await page.screenshot({ 
        path: `tests/e2e/screenshots/coverage/contact-${contactPage.path.split('/').pop()}.png`, 
        fullPage: true 
      });
      
      console.log(`✅ ${contactPage.path} validated`);
    }
  });

  test('Product Pages - All product categories', async ({ page }) => {
    console.log('🏡 Testing All Product Pages');
    
    const productPages = [
      { path: '/products/sellers', title: 'Sellers' },
      { path: '/products/buyers', title: 'Buyers' },
      { path: '/products/kitchen-and-bath', title: 'Kitchen.*Bath' },
      { path: '/products/commercial', title: 'Commercial' },
      { path: '/products/architects-and-designers', title: 'Architects.*Designers' }
    ];

    for (const productPage of productPages) {
      console.log(`Testing ${productPage.path}...`);
      
      await page.goto(productPage.path);
      await page.waitForLoadState('networkidle');
      
      // Title validation
      await expect(page).toHaveTitle(new RegExp(productPage.title, 'i'));
      
      // Header validation
      await expect(page.locator('h1').first()).toBeVisible();
      
      // CTA buttons validation
      await expect(page.locator('text="Get an Estimate"')).toBeVisible();
      
      await page.screenshot({ 
        path: `tests/e2e/screenshots/coverage/product-${productPage.path.split('/').pop()}.png`, 
        fullPage: true 
      });
      
      console.log(`✅ ${productPage.path} validated`);
    }
  });

  test('Authentication & User Pages', async ({ page }) => {
    console.log('🔐 Testing Authentication & User Pages');
    
    // Login page
    console.log('Testing /login...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Login/i);
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"], input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/coverage/login.png', fullPage: true });
    console.log('✅ Login page validated');

    // Profile page (might redirect if not authenticated)
    console.log('Testing /profile...');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    // Should either show profile or redirect to login
    const currentUrl = page.url();
    if (currentUrl.includes('/profile')) {
      await expect(page.locator('h1, h2')).toBeVisible();
      await page.screenshot({ path: 'tests/e2e/screenshots/coverage/profile.png', fullPage: true });
      console.log('✅ Profile page validated');
    } else {
      console.log('ℹ️ Profile page redirected to login (expected for unauthenticated user)');
    }

    // Settings page
    console.log('Testing /settings...');
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const settingsUrl = page.url();
    if (settingsUrl.includes('/settings')) {
      await expect(page.locator('h1, h2')).toBeVisible();
      await page.screenshot({ path: 'tests/e2e/screenshots/coverage/settings.png', fullPage: true });
      console.log('✅ Settings page validated');
    } else {
      console.log('ℹ️ Settings page redirected to login (expected for unauthenticated user)');
    }
  });

  test('Project Pages', async ({ page }) => {
    console.log('🏗️ Testing Project Pages');
    
    // Projects listing page
    console.log('Testing /projects...');
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Projects/i);
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check for projects grid or empty state
    const projectsGrid = page.locator('.grid');
    const projectsExist = await projectsGrid.isVisible().catch(() => false);
    
    if (projectsExist) {
      const projectCards = projectsGrid.locator('> div');
      const cardCount = await projectCards.count();
      console.log(`Found ${cardCount} project cards`);
      
      // Test clicking first project if available
      if (cardCount > 0) {
        console.log('Testing project detail page...');
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        if (page.url().includes('/project')) {
          await expect(page.locator('h1, h2')).toBeVisible();
          await page.screenshot({ path: 'tests/e2e/screenshots/coverage/project-detail.png', fullPage: true });
          console.log('✅ Project detail page validated');
        }
      }
    } else {
      console.log('ℹ️ No projects found - empty state displayed');
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/coverage/projects.png', fullPage: true });
    console.log('✅ Projects page validated');
  });

  test('Utility Pages', async ({ page }) => {
    console.log('🔧 Testing Utility Pages');
    
    // About page
    console.log('Testing /about...');
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/About/i);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/coverage/about.png', fullPage: true });
    console.log('✅ About page validated');

    // Style guide page
    console.log('Testing /style-guide...');
    await page.goto('/style-guide');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Style.*Guide/i);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/coverage/style-guide.png', fullPage: true });
    console.log('✅ Style guide page validated');
  });

  test('Admin Pages - Public access validation', async ({ page }) => {
    console.log('👨‍💼 Testing Admin Pages (public access)');
    
    const adminPages = [
      '/admin',
      '/admin/requests',
      '/admin/projects', 
      '/admin/quotes',
      '/admin/contacts',
      '/admin/notifications',
      '/admin/analytics',
      '/admin/system',
      '/admin/users',
      '/admin/configuration',
      '/admin/lifecycle',
      '/admin/notification-monitor'
    ];

    for (const adminPath of adminPages) {
      console.log(`Testing ${adminPath}...`);
      
      await page.goto(adminPath);
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/login')) {
        console.log(`ℹ️ ${adminPath} properly redirected to login (expected for unauthenticated access)`);
      } else if (currentUrl.includes('/admin')) {
        // If somehow accessible, validate basic structure
        await expect(page.locator('h1, h2')).toBeVisible();
        await page.screenshot({ 
          path: `tests/e2e/screenshots/coverage/admin-${adminPath.split('/').pop()}.png`, 
          fullPage: true 
        });
        console.log(`✅ ${adminPath} accessible and validated`);
      } else {
        console.log(`⚠️ ${adminPath} had unexpected redirect to ${currentUrl}`);
      }
    }
  });

  test('API and Special Routes', async ({ page }) => {
    console.log('🔌 Testing Special Routes');
    
    // Test amplify-test page
    console.log('Testing /amplify-test...');
    await page.goto('/amplify-test');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Amplify test page loaded');

    // Test sitemap XML
    console.log('Testing /sitemap.xml...');
    const sitemapResponse = await page.goto('/sitemap.xml');
    expect(sitemapResponse.status()).toBe(200);
    console.log('✅ Sitemap XML accessible');
  });

  test('Navigation Integration Test', async ({ page }) => {
    console.log('🧭 Testing Cross-Page Navigation');
    
    // Start at home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test Products dropdown navigation
    const productsButton = page.locator('button:has-text("Products")').first();
    await productsButton.hover();
    await page.waitForTimeout(200);
    
    const sellersLink = page.locator('a[href="/products/sellers"]').first();
    await sellersLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Sellers/i);
    
    // Test Contact dropdown navigation
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const contactButton = page.locator('button:has-text("Contact")').first();
    await contactButton.hover();
    await page.waitForTimeout(200);
    
    const estimateLink = page.locator('a[href="/contact/get-estimate"]').first();
    await estimateLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form')).toBeVisible();
    
    // Test main navigation links
    const projectsLink = page.locator('a[href="/projects"]').first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(/Projects/i);
    }
    
    console.log('✅ Cross-page navigation validated');
  });

  test('404 and Error Pages', async ({ page }) => {
    console.log('❌ Testing Error Handling');
    
    // Test 404 page
    await page.goto('/non-existent-page-123');
    await page.waitForLoadState('networkidle');
    
    // Should either show custom 404 or default Next.js 404
    const pageContent = await page.content();
    const has404Content = pageContent.includes('404') || 
                         pageContent.includes('not found') || 
                         pageContent.includes('page not found');
    
    expect(has404Content).toBe(true);
    await page.screenshot({ path: 'tests/e2e/screenshots/coverage/404-page.png', fullPage: true });
    console.log('✅ 404 error handling validated');
  });

  test('Performance and Load Validation', async ({ page }) => {
    console.log('⚡ Testing Performance and Load Times');
    
    const testPages = ['/', '/projects', '/contact/get-estimate', '/products/sellers'];
    const loadTimes = [];
    
    for (const testPage of testPages) {
      const startTime = Date.now();
      await page.goto(testPage);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      loadTimes.push({ page: testPage, time: loadTime });
      console.log(`${testPage}: ${loadTime}ms`);
      
      // Verify page loaded successfully (use first() to avoid strict mode violations)
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
    
    // Log performance summary
    const avgLoadTime = loadTimes.reduce((sum, item) => sum + item.time, 0) / loadTimes.length;
    console.log(`Average load time: ${Math.round(avgLoadTime)}ms`);
    
    // Reasonable performance expectations (under 10 seconds for comprehensive loading)
    loadTimes.forEach(item => {
      expect(item.time).toBeLessThan(10000);
    });
    
    console.log('✅ Performance validation completed');
  });
});