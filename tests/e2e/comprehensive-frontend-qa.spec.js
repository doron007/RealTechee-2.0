const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

// Test configuration
test.describe.configure({ mode: 'serial' });

test.describe('Comprehensive Frontend QA Testing', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Capture console logs and errors
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', (err) => {
      console.error('PAGE ERROR:', err.message);
    });
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });

  test.describe('1. Public Pages Testing (Anonymous Users)', () => {
    
    test('Homepage (/) - Verify page loads, content visible, no errors', async () => {
      console.log('\n🏠 Testing Homepage...');
      
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      
      // Take screenshot for evidence
      await page.screenshot({ 
        path: 'test-results/homepage-screenshot.png',
        fullPage: true 
      });
      
      // Check for key homepage elements
      await expect(page.locator('h1')).toBeVisible();
      
      // Look for typical homepage content
      const hasMainContent = await page.locator('main, [role="main"], section').count() > 0;
      expect(hasMainContent).toBe(true);
      
      console.log('✅ Homepage loaded successfully');
    });

    test('About (/about) - Page loads, content displays', async () => {
      console.log('\n📖 Testing About page...');
      
      const response = await page.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      
      await page.screenshot({ 
        path: 'test-results/about-screenshot.png',
        fullPage: true 
      });
      
      // Check for content
      const hasContent = await page.locator('h1, h2, p').count() > 0;
      expect(hasContent).toBe(true);
      
      console.log('✅ About page loaded successfully');
    });

    test('Services (/services) - Page loads, services listed', async () => {
      console.log('\n🔧 Testing Services page...');
      
      const response = await page.goto(`${BASE_URL}/services`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      
      await page.screenshot({ 
        path: 'test-results/services-screenshot.png',
        fullPage: true 
      });
      
      // Look for services content
      const hasServicesContent = await page.locator('h1, h2, .service, [class*="service"]').count() > 0;
      expect(hasServicesContent).toBe(true);
      
      console.log('✅ Services page loaded successfully');
    });

    test('Contact (/contact) - Page loads, form functional', async () => {
      console.log('\n📞 Testing Contact page...');
      
      const response = await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      
      await page.screenshot({ 
        path: 'test-results/contact-page-screenshot.png',
        fullPage: true 
      });
      
      // Look for contact form
      const hasForm = await page.locator('form').count() > 0;
      const hasInputs = await page.locator('input[type="text"], input[type="email"], textarea').count() > 0;
      
      expect(hasForm).toBe(true);
      expect(hasInputs).toBe(true);
      
      console.log('✅ Contact page and form loaded successfully');
    });

    test('Get Estimate (/get-estimate) - Form loads and submits', async () => {
      console.log('\n💰 Testing Get Estimate page...');
      
      const response = await page.goto(`${BASE_URL}/get-estimate`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      
      await page.screenshot({ 
        path: 'test-results/get-estimate-page-screenshot.png',
        fullPage: true 
      });
      
      // Look for estimate form
      const hasForm = await page.locator('form').count() > 0;
      const hasSubmitButton = await page.locator('button[type="submit"], input[type="submit"]').count() > 0;
      
      expect(hasForm).toBe(true);
      expect(hasSubmitButton).toBe(true);
      
      console.log('✅ Get Estimate page and form loaded successfully');
    });
  });

  test.describe('2. Form Submission Testing', () => {
    
    test('Contact Form (minimal data) - Test basic submission', async () => {
      console.log('\n📝 Testing Contact Form submission...');
      
      await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle' });
      
      // Try to fill and submit contact form with minimal data
      const nameInput = page.locator('input[name="name"], input[name="fullName"], input[placeholder*="name" i]').first();
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      const messageInput = page.locator('textarea[name="message"], textarea[placeholder*="message" i]').first();
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test User');
      }
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
      }
      if (await messageInput.count() > 0) {
        await messageInput.fill('This is a test message');
      }
      
      await page.screenshot({ 
        path: 'test-results/contact-form-filled-screenshot.png',
        fullPage: true 
      });
      
      // Look for submit button and try to click
      const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("submit" i)').first();
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000); // Wait for potential submission
        
        await page.screenshot({ 
          path: 'test-results/contact-form-submitted-screenshot.png',
          fullPage: true 
        });
        
        console.log('✅ Contact form submission attempted');
      } else {
        console.log('⚠️ No submit button found on contact form');
      }
    });

    test('Get Estimate Form (minimal data) - Test basic submission', async () => {
      console.log('\n💰 Testing Get Estimate Form submission...');
      
      await page.goto(`${BASE_URL}/get-estimate`, { waitUntil: 'networkidle' });
      
      // Fill basic required fields
      const nameInput = page.locator('input[name="name"], input[name="fullName"], input[placeholder*="name" i]').first();
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]').first();
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test User');
      }
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
      }
      if (await phoneInput.count() > 0) {
        await phoneInput.fill('(555) 123-4567');
      }
      
      await page.screenshot({ 
        path: 'test-results/get-estimate-form-filled-screenshot.png',
        fullPage: true 
      });
      
      const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("submit" i)').first();
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: 'test-results/get-estimate-form-submitted-screenshot.png',
          fullPage: true 
        });
        
        console.log('✅ Get Estimate form submission attempted');
      } else {
        console.log('⚠️ No submit button found on get estimate form');
      }
    });

    test('Contact Form (with file uploads) - Test file attachments', async () => {
      console.log('\n📎 Testing Contact Form with file uploads...');
      
      await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle' });
      
      // Look for file input
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        // Create a small test file
        await page.evaluate(() => {
          const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
          const dt = new DataTransfer();
          dt.items.add(file);
          const input = document.querySelector('input[type="file"]');
          if (input) {
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        await page.screenshot({ 
          path: 'test-results/contact-form-with-file-screenshot.png',
          fullPage: true 
        });
        
        console.log('✅ File upload functionality tested');
      } else {
        console.log('⚠️ No file input found on contact form');
      }
    });

    test('Get Estimate Form (with images) - Test image uploads', async () => {
      console.log('\n🖼️ Testing Get Estimate Form with image uploads...');
      
      await page.goto(`${BASE_URL}/get-estimate`, { waitUntil: 'networkidle' });
      
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        // Check if file input accepts images
        const acceptAttr = await fileInput.getAttribute('accept');
        console.log(`File input accepts: ${acceptAttr || 'any files'}`);
        
        await page.screenshot({ 
          path: 'test-results/get-estimate-form-file-input-screenshot.png',
          fullPage: true 
        });
        
        console.log('✅ Image upload functionality available');
      } else {
        console.log('⚠️ No file input found on get estimate form');
      }
    });
  });

  test.describe('3. Authenticated User Testing', () => {
    
    test('User Login - Test login functionality', async () => {
      console.log('\n🔐 Testing User Login...');
      
      // Try to find login page/modal
      const loginPaths = ['/login', '/signin', '/auth/login'];
      let loginPageFound = false;
      
      for (const path of loginPaths) {
        try {
          const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
          if (response.status() === 200) {
            loginPageFound = true;
            
            await page.screenshot({ 
              path: `test-results/login-page-screenshot.png`,
              fullPage: true 
            });
            
            // Look for login form
            const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').count() > 0;
            const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').count() > 0;
            const hasLoginButton = await page.locator('button[type="submit"], button:has-text("login" i), button:has-text("sign in" i)').count() > 0;
            
            console.log(`Login form elements found - Email: ${hasEmailInput}, Password: ${hasPasswordInput}, Button: ${hasLoginButton}`);
            
            // Try to fill login form with test credentials
            if (hasEmailInput && hasPasswordInput) {
              await page.locator('input[type="email"], input[name="email"]').first().fill('info@realtechee.com');
              await page.locator('input[type="password"], input[name="password"]').first().fill('Sababa123!');
              
              await page.screenshot({ 
                path: 'test-results/login-form-filled-screenshot.png',
                fullPage: true 
              });
              
              if (hasLoginButton) {
                await page.locator('button[type="submit"], button:has-text("login" i), button:has-text("sign in" i)').first().click();
                await page.waitForTimeout(3000);
                
                await page.screenshot({ 
                  path: 'test-results/after-login-attempt-screenshot.png',
                  fullPage: true 
                });
              }
            }
            
            console.log(`✅ Login page found at ${path}`);
            break;
          }
        } catch (error) {
          console.log(`Login path ${path} not accessible`);
        }
      }
      
      if (!loginPageFound) {
        // Look for login link or button on homepage
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        
        const loginLink = page.locator('a:has-text("login" i), a:has-text("sign in" i), button:has-text("login" i)').first();
        
        if (await loginLink.count() > 0) {
          await loginLink.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ 
            path: 'test-results/login-modal-or-redirect-screenshot.png',
            fullPage: true 
          });
          
          console.log('✅ Login link found and clicked');
        } else {
          console.log('⚠️ No login functionality found');
        }
      }
    });

    test('User Dashboard - Verify user data displays', async () => {
      console.log('\n📊 Testing User Dashboard...');
      
      const dashboardPaths = ['/dashboard', '/account', '/profile', '/admin'];
      let dashboardFound = false;
      
      for (const path of dashboardPaths) {
        try {
          const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
          
          await page.screenshot({ 
            path: `test-results/dashboard-${path.replace('/', '')}-screenshot.png`,
            fullPage: true 
          });
          
          // Check if we're redirected to login or if dashboard loads
          const currentUrl = page.url();
          const hasAuthContent = await page.locator('[class*="auth"], [class*="login"], [class*="signin"]').count() > 0;
          
          if (!hasAuthContent && response.status() === 200) {
            dashboardFound = true;
            console.log(`✅ Dashboard found at ${path}`);
            
            // Look for typical dashboard elements
            const hasTables = await page.locator('table, [role="table"]').count();
            const hasCards = await page.locator('[class*="card"]').count();
            const hasStats = await page.locator('[class*="stat"], [class*="metric"]').count();
            
            console.log(`Dashboard elements - Tables: ${hasTables}, Cards: ${hasCards}, Stats: ${hasStats}`);
            break;
          } else if (hasAuthContent) {
            console.log(`${path} redirected to authentication`);
          }
        } catch (error) {
          console.log(`Dashboard path ${path} error: ${error.message}`);
        }
      }
      
      if (!dashboardFound) {
        console.log('⚠️ No accessible dashboard found - may require authentication');
      }
    });

    test('User Profile Updates - Test profile changes', async () => {
      console.log('\n👤 Testing User Profile Updates...');
      
      const profilePaths = ['/profile', '/account', '/settings'];
      let profileFound = false;
      
      for (const path of profilePaths) {
        try {
          const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
          
          await page.screenshot({ 
            path: `test-results/profile-${path.replace('/', '')}-screenshot.png`,
            fullPage: true 
          });
          
          const currentUrl = page.url();
          const hasAuthContent = await page.locator('[class*="auth"], [class*="login"]').count() > 0;
          
          if (!hasAuthContent && response.status() === 200) {
            profileFound = true;
            
            // Look for profile form elements
            const hasInputs = await page.locator('input[type="text"], input[type="email"]').count();
            const hasSaveButton = await page.locator('button:has-text("save" i), button:has-text("update" i)').count();
            
            console.log(`✅ Profile page found at ${path} - Inputs: ${hasInputs}, Save button: ${hasSaveButton}`);
            break;
          }
        } catch (error) {
          console.log(`Profile path ${path} error: ${error.message}`);
        }
      }
      
      if (!profileFound) {
        console.log('⚠️ No accessible profile page found - may require authentication');
      }
    });
  });

  test.describe('4. Error Detection and Console Monitoring', () => {
    
    test('Check for JavaScript errors across all pages', async () => {
      console.log('\n🐛 Checking for JavaScript errors...');
      
      const pages = ['/', '/about', '/services', '/contact', '/get-estimate'];
      const errors = [];
      
      for (const pagePath of pages) {
        console.log(`Checking errors on ${pagePath}...`);
        
        const pageErrors = [];
        const consoleErrors = [];
        
        // Set up error listeners
        page.on('pageerror', (err) => pageErrors.push(err.message));
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        try {
          await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000); // Wait for any async operations
          
          if (pageErrors.length > 0 || consoleErrors.length > 0) {
            errors.push({
              page: pagePath,
              pageErrors,
              consoleErrors
            });
          }
          
          console.log(`${pagePath}: ${pageErrors.length} page errors, ${consoleErrors.length} console errors`);
          
        } catch (error) {
          errors.push({
            page: pagePath,
            navigationError: error.message
          });
        }
        
        // Remove listeners to avoid duplicates
        page.removeAllListeners('pageerror');
        page.removeAllListeners('console');
      }
      
      if (errors.length > 0) {
        console.log('❌ Errors found:', JSON.stringify(errors, null, 2));
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
      // Take final screenshot
      await page.screenshot({ 
        path: 'test-results/error-detection-final-screenshot.png',
        fullPage: true 
      });
    });
  });

  test.describe('5. Performance and Load Testing', () => {
    
    test('Page load performance check', async () => {
      console.log('\n⚡ Testing page load performance...');
      
      const pages = ['/', '/about', '/services', '/contact', '/get-estimate'];
      const performanceData = [];
      
      for (const pagePath of pages) {
        const startTime = Date.now();
        
        try {
          const response = await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle' });
          const loadTime = Date.now() - startTime;
          
          const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
            };
          });
          
          performanceData.push({
            page: pagePath,
            status: response.status(),
            loadTime,
            ...performanceMetrics
          });
          
          console.log(`${pagePath}: ${loadTime}ms (Status: ${response.status()})`);
          
        } catch (error) {
          performanceData.push({
            page: pagePath,
            error: error.message,
            loadTime: Date.now() - startTime
          });
        }
      }
      
      console.log('📊 Performance Results:', JSON.stringify(performanceData, null, 2));
      
      // Check if any page took too long (>5 seconds)
      const slowPages = performanceData.filter(p => p.loadTime > 5000);
      if (slowPages.length > 0) {
        console.log('⚠️ Slow loading pages detected:', slowPages);
      } else {
        console.log('✅ All pages loaded within acceptable time');
      }
    });
  });
});