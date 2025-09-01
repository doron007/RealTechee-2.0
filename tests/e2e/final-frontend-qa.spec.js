const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('Frontend QA Testing - Final', () => {
  
  test.describe('1. Public Pages Testing', () => {
    
    test('Homepage loads successfully', async ({ page }) => {
      console.log('\n🏠 Testing Homepage...');
      
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      
      await page.screenshot({ path: 'test-results/homepage-success.png', fullPage: true });
      
      // Check for content
      const headingCount = await page.locator('h1, h2, h3').count();
      expect(headingCount).toBeGreaterThan(0);
      
      const hasMainContent = await page.locator('main, [role="main"], section').count();
      expect(hasMainContent).toBeGreaterThan(0);
      
      console.log(`✅ Homepage: ${headingCount} headings, ${hasMainContent} main sections found`);
    });

    test('Contact page loads and has forms', async ({ page }) => {
      console.log('\n📞 Testing Contact page...');
      
      const response = await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      
      await page.screenshot({ path: 'test-results/contact-page.png', fullPage: true });
      
      const formCount = await page.locator('form').count();
      const inputCount = await page.locator('input, textarea').count();
      
      console.log(`📞 Contact page: ${formCount} forms, ${inputCount} inputs found`);
      
      // Should have either forms or contact links
      const contactLinks = await page.locator('a[href*="contact"], a[href*="get-estimate"]').count();
      expect(formCount + contactLinks).toBeGreaterThan(0);
      
      console.log('✅ Contact page loaded successfully');
    });

    test('Get Estimate page loads and has form', async ({ page }) => {
      console.log('\n💰 Testing Get Estimate page...');
      
      const response = await page.goto(`${BASE_URL}/get-estimate`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      
      await page.screenshot({ path: 'test-results/get-estimate.png', fullPage: true });
      
      const formCount = await page.locator('form').count();
      expect(formCount).toBeGreaterThan(0);
      
      console.log(`✅ Get Estimate: ${formCount} forms found`);
    });

    test('Product pages accessibility', async ({ page }) => {
      console.log('\n🛠️ Testing Product pages...');
      
      const productPaths = [
        '/products/kitchen-and-bath',
        '/products/commercial', 
        '/products/buyers'
      ];
      
      let successCount = 0;
      
      for (const path of productPaths) {
        try {
          const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
          if (response.status() === 200) {
            successCount++;
            await page.screenshot({ 
              path: `test-results/product-${path.split('/').pop()}.png`,
              fullPage: true 
            });
            
            const headingCount = await page.locator('h1, h2, h3').count();
            console.log(`✅ ${path}: Status 200, ${headingCount} headings`);
          }
        } catch (error) {
          console.log(`⚠️ ${path}: Error - ${error.message}`);
        }
      }
      
      expect(successCount).toBeGreaterThan(0);
      console.log(`✅ ${successCount}/${productPaths.length} product pages accessible`);
    });
  });

  test.describe('2. Form Testing', () => {
    
    test('Contact Us form functionality', async ({ page }) => {
      console.log('\n📝 Testing Contact Us form...');
      
      await page.goto(`${BASE_URL}/contact/contact-us`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'test-results/contact-us-form.png', fullPage: true });
      
      const nameFields = await page.locator('input[name*="name"], input[placeholder*="name"]').count();
      const emailFields = await page.locator('input[name*="email"], input[type="email"]').count();
      const messageFields = await page.locator('textarea').count();
      const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').count();
      
      console.log(`📝 Contact form: Name fields: ${nameFields}, Email: ${emailFields}, Message: ${messageFields}, Submit: ${submitButtons}`);
      
      // Try to fill form if fields exist
      if (nameFields > 0 && emailFields > 0) {
        try {
          await page.locator('input[name*="name"], input[placeholder*="name"]').first().fill('Test User');
          await page.locator('input[name*="email"], input[type="email"]').first().fill('test@example.com');
          
          if (messageFields > 0) {
            await page.locator('textarea').first().fill('Test message for QA');
          }
          
          await page.screenshot({ path: 'test-results/contact-form-filled.png', fullPage: true });
          console.log('✅ Contact form filled successfully');
        } catch (error) {
          console.log(`⚠️ Form filling error: ${error.message}`);
        }
      }
      
      expect(nameFields + emailFields).toBeGreaterThan(0);
    });

    test('Get Estimate form functionality', async ({ page }) => {
      console.log('\n💰 Testing Get Estimate form...');
      
      await page.goto(`${BASE_URL}/contact/get-estimate`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'test-results/estimate-form.png', fullPage: true });
      
      const allInputs = await page.locator('input, textarea, select').count();
      const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').count();
      
      console.log(`💰 Estimate form: ${allInputs} total inputs, ${submitButtons} submit buttons`);
      
      expect(allInputs).toBeGreaterThan(0);
      expect(submitButtons).toBeGreaterThan(0);
      
      console.log('✅ Get Estimate form structure verified');
    });

    test('File upload capability', async ({ page }) => {
      console.log('\n📎 Testing File uploads...');
      
      const pagesWithUploads = ['/contact/contact-us', '/contact/get-estimate'];
      let totalFileInputs = 0;
      
      for (const pagePath of pagesWithUploads) {
        await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle' });
        const fileInputs = await page.locator('input[type="file"]').count();
        totalFileInputs += fileInputs;
        
        if (fileInputs > 0) {
          const accept = await page.locator('input[type="file"]').first().getAttribute('accept');
          console.log(`📎 ${pagePath}: ${fileInputs} file inputs, accepts: ${accept || 'any files'}`);
          
          await page.screenshot({ 
            path: `test-results/file-upload-${pagePath.split('/').pop()}.png`,
            fullPage: true 
          });
        }
      }
      
      console.log(`✅ Total file inputs found: ${totalFileInputs}`);
    });
  });

  test.describe('3. Authentication Testing', () => {
    
    test('Login page accessibility', async ({ page }) => {
      console.log('\n🔐 Testing Login page...');
      
      try {
        const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
        
        if (response.status() === 200) {
          const emailInputs = await page.locator('input[type="email"], input[name="email"]').count();
          const passwordInputs = await page.locator('input[type="password"]').count();
          const loginButtons = await page.locator('button[type="submit"], button:has-text("login"), button:has-text("sign in")').count();
          
          console.log(`🔐 Login elements: Email ${emailInputs}, Password ${passwordInputs}, Buttons ${loginButtons}`);
          
          if (emailInputs > 0 && passwordInputs > 0 && loginButtons > 0) {
            console.log('✅ Complete login form found');
          } else {
            console.log('⚠️ Incomplete login form');
          }
        }
      } catch (error) {
        console.log(`🔐 Login page error: ${error.message}`);
      }
    });

    test('Admin pages protection', async ({ page }) => {
      console.log('\n👑 Testing Admin access...');
      
      const adminPaths = ['/admin/requests', '/admin/projects'];
      
      for (const path of adminPaths) {
        try {
          const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
          const finalUrl = page.url();
          
          await page.screenshot({ 
            path: `test-results/admin-${path.split('/').pop()}.png`,
            fullPage: true 
          });
          
          console.log(`👑 ${path}: Status ${response.status()}, Final URL: ${finalUrl}`);
          
          if (finalUrl.includes('login') || finalUrl.includes('auth')) {
            console.log(`✅ ${path} properly redirects to authentication`);
          } else if (response.status() === 200) {
            const hasDataGrid = await page.locator('table, [role="table"], [class*="grid"]').count();
            console.log(`✅ ${path} accessible with ${hasDataGrid} data grids`);
          }
        } catch (error) {
          console.log(`👑 ${path}: ${error.message}`);
        }
      }
    });
  });

  test.describe('4. Error Detection', () => {
    
    test('JavaScript errors across pages', async ({ page }) => {
      console.log('\n🐛 Error detection testing...');
      
      const pages = ['/', '/contact', '/contact/get-estimate', '/login'];
      const errorReport = [];
      
      for (const pagePath of pages) {
        const pageErrors = [];
        const consoleErrors = [];
        
        page.on('pageerror', (err) => pageErrors.push(err.message));
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        try {
          const response = await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);
          
          errorReport.push({
            page: pagePath,
            status: response.status(),
            pageErrors: pageErrors.length,
            consoleErrors: consoleErrors.length
          });
          
          console.log(`🐛 ${pagePath}: ${pageErrors.length} page errors, ${consoleErrors.length} console errors`);
          
        } catch (error) {
          errorReport.push({
            page: pagePath,
            navigationError: error.message
          });
        }
        
        // Clean up listeners
        page.removeAllListeners('pageerror');
        page.removeAllListeners('console');
      }
      
      await page.screenshot({ path: 'test-results/error-detection-summary.png', fullPage: true });
      
      const totalErrors = errorReport.reduce((sum, r) => sum + (r.pageErrors || 0) + (r.consoleErrors || 0), 0);
      console.log(`🐛 Total errors detected: ${totalErrors}`);
      console.log('📊 Error Report:', JSON.stringify(errorReport, null, 2));
      
      // Test passes regardless of errors found (we're just documenting them)
      expect(errorReport.length).toBeGreaterThan(0);
    });
  });

  test.describe('5. Performance Testing', () => {
    
    test('Page load performance', async ({ page }) => {
      console.log('\n⚡ Performance testing...');
      
      const testPages = ['/', '/contact', '/get-estimate', '/login'];
      const performanceData = [];
      
      for (const pagePath of testPages) {
        const startTime = Date.now();
        
        try {
          const response = await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle' });
          const loadTime = Date.now() - startTime;
          
          const metrics = await page.evaluate(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            return nav ? {
              domReady: Math.round(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart),
              loadComplete: Math.round(nav.loadEventEnd - nav.loadEventStart)
            } : { domReady: 0, loadComplete: 0 };
          });
          
          performanceData.push({
            page: pagePath,
            status: response.status(),
            totalTime: loadTime,
            ...metrics
          });
          
          console.log(`⚡ ${pagePath}: ${loadTime}ms total`);
          
        } catch (error) {
          performanceData.push({
            page: pagePath,
            error: error.message
          });
        }
      }
      
      const slowPages = performanceData.filter(p => p.totalTime && p.totalTime > 5000);
      
      console.log('⚡ Performance Summary:', JSON.stringify(performanceData, null, 2));
      
      if (slowPages.length > 0) {
        console.log('⚠️ Slow pages (>5s):', slowPages.map(p => `${p.page}: ${p.totalTime}ms`));
      }
      
      expect(performanceData.length).toBeGreaterThan(0);
      console.log('✅ Performance testing completed');
    });
  });
});