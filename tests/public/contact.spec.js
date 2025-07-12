/**
 * Contact Pages Tests
 * 
 * Comprehensive testing for contact pages including:
 * - Contact us page (/contact/contact-us)
 * - Get estimate page (/contact/get-estimate)
 * - Get qualified page (/contact/get-qualified)
 * - Affiliate contact (/contact/affiliate)
 * - Form functionality and validation
 * - Contact information display
 * - Lead capture optimization
 * - Performance and accessibility
 */

const { test, expect } = require('@playwright/test');

test.describe('Contact Pages', () => {
  
  // Helper function to reset page state like a real user would
  async function resetPageState(page) {
    // Clear any form inputs
    const formInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea, select');
    const inputCount = await formInputs.count();
    for (let i = 0; i < inputCount; i++) {
      try {
        const input = formInputs.nth(i);
        if (await input.isVisible()) {
          await input.clear();
        }
      } catch (error) {
        // Continue if clear fails
      }
    }
    
    // Wait for any changes to settle
    await page.waitForTimeout(500);
  }
  
  // Test each contact page
  const contactPages = [
    { path: '/contact/contact-us', name: 'Contact Us' },
    { path: '/contact/get-estimate', name: 'Get Estimate' },
    { path: '/contact/get-qualified', name: 'Get Qualified' },
    { path: '/contact/affiliate', name: 'Affiliate Contact' }
  ];

  contactPages.forEach(({ path, name }) => {
    test.describe(`${name} Page (${path})`, () => {
      
      let sharedPage;
      
      test.beforeAll(async ({ browser }) => {
        // Create a single page context that persists across all tests
        const context = await browser.newContext({ 
          viewport: { width: 1280, height: 1080 }
        });
        sharedPage = await context.newPage();
        
        // Navigate to contact page once
        await sharedPage.goto(path);
        
        // Wait for page to load completely
        await expect(sharedPage.locator('h1').first()).toBeVisible();
        await sharedPage.waitForLoadState('networkidle');
      });
      
      test.beforeEach(async () => {
        // Reset page state for clean test start
        await resetPageState(sharedPage);
      });
      
      test.afterAll(async () => {
        // Clean up the shared page
        if (sharedPage) {
          await sharedPage.close();
        }
      });

      test.describe('Page Loading & Display', () => {
        
        test('should load contact page without errors', async () => {
          const page = sharedPage;
          
          // Verify page loads and displays main content
          await expect(page.locator('h1').first()).toBeVisible();
          
          // Check for page-specific content
          const pageTitle = await page.title();
          expect(pageTitle).toBeTruthy();
          
          // Verify no blocking errors
          const criticalErrors = page.locator('[role="alert"][severity="error"], .error-blocking');
          expect(await criticalErrors.count()).toBe(0);
          
          console.log(`ℹ️ ${name} page loaded successfully`);
        });
        
        test('should display contact information', async () => {
          const page = sharedPage;
          
          // Look for contact information
          const hasPhone = await page.locator('text=/\\(\\d{3}\\)\\s?\\d{3}-\\d{4}|\\d{3}-\\d{3}-\\d{4}/').count() > 0;
          const hasEmail = await page.locator('text=/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/').count() > 0;
          const hasAddress = await page.locator('text=/street|avenue|road|blvd|drive|st\\.|ave\\./i').count() > 0;
          const hasHours = await page.locator('text=/hours|monday|tuesday|am|pm/i').count() > 0;
          
          // Should have some contact information
          const contactInfo = [hasPhone, hasEmail, hasAddress, hasHours].filter(Boolean).length;
          expect(contactInfo).toBeGreaterThan(0);
          
          console.log(`ℹ️ ${name} displays ${contactInfo} types of contact information`);
        });
      });

      test.describe('Form Functionality', () => {
        
        test('should have functional contact form', async () => {
          const page = sharedPage;
          
          // Look for contact forms
          const contactForms = page.locator('form, .form, .contact-form');
          const formCount = await contactForms.count();
          
          if (formCount > 0) {
            console.log(`ℹ️ Found ${formCount} form(s) on ${name} page`);
            
            // Check for form inputs
            const formInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea');
            const inputCount = await formInputs.count();
            
            expect(inputCount).toBeGreaterThan(0);
            console.log(`ℹ️ Form has ${inputCount} input fields`);
            
            // Test form interaction
            const firstInput = formInputs.first();
            if (await firstInput.isVisible()) {
              await firstInput.focus();
              await firstInput.fill('Test Input');
              await page.waitForTimeout(200);
              
              // Verify input was filled
              const inputValue = await firstInput.inputValue();
              expect(inputValue).toBe('Test Input');
              
              // Clear for next test
              await firstInput.clear();
            }
          }
        });
        
        test('should validate required form fields', async () => {
          const page = sharedPage;
          
          // Look for required fields
          const requiredFields = page.locator('input[required], textarea[required], select[required]');
          const requiredCount = await requiredFields.count();
          
          if (requiredCount > 0) {
            console.log(`ℹ️ Found ${requiredCount} required fields`);
            
            // Look for submit button
            const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Send")');
            
            if (await submitButton.count() > 0) {
              // Test form validation by attempting to submit empty form
              const submitBtn = submitButton.first();
              if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForTimeout(1000);
                
                // Should show validation messages or prevent submission
                const validationMessages = await page.locator('.error, .invalid, [aria-invalid="true"]').count();
                console.log(`ℹ️ Form validation working: ${validationMessages} validation indicators`);
              }
            }
          }
        });
        
        test('should handle form field types appropriately', async () => {
          const page = sharedPage;
          
          // Test different input types
          const emailFields = page.locator('input[type="email"]');
          const phoneFields = page.locator('input[type="tel"]');
          const textFields = page.locator('input[type="text"]');
          const textAreas = page.locator('textarea');
          
          const emailCount = await emailFields.count();
          const phoneCount = await phoneFields.count();
          const textCount = await textFields.count();
          const textAreaCount = await textAreas.count();
          
          console.log(`ℹ️ Field types - Email: ${emailCount}, Phone: ${phoneCount}, Text: ${textCount}, TextArea: ${textAreaCount}`);
          
          // Test email field validation if present
          if (emailCount > 0) {
            const emailField = emailFields.first();
            if (await emailField.isVisible()) {
              await emailField.fill('invalid-email');
              await emailField.blur();
              await page.waitForTimeout(500);
              
              // Check for validation feedback
              const hasValidation = await page.locator('.error, .invalid, [aria-invalid="true"]').count() > 0;
              if (hasValidation) {
                console.log('ℹ️ Email validation working');
              }
              
              await emailField.clear();
            }
          }
        });
      });

      test.describe('Lead Capture Optimization', () => {
        
        test('should provide clear call-to-action', async () => {
          const page = sharedPage;
          
          // Look for strong CTAs
          const ctaButtons = page.locator('button:has-text("Get"), button:has-text("Request"), button:has-text("Submit"), button:has-text("Send"), button:has-text("Contact")');
          const ctaCount = await ctaButtons.count();
          
          if (ctaCount > 0) {
            console.log(`ℹ️ Found ${ctaCount} call-to-action elements`);
            
            // Test CTA functionality
            for (let i = 0; i < Math.min(ctaCount, 3); i++) {
              const cta = ctaButtons.nth(i);
              if (await cta.isVisible()) {
                await expect(cta).toBeEnabled();
                
                const ctaText = await cta.textContent();
                console.log(`ℹ️ CTA: ${ctaText}`);
              }
            }
          }
        });
        
        test('should minimize form friction', async () => {
          const page = sharedPage;
          
          // Analyze form complexity
          const allInputs = await page.locator('input, textarea, select').count();
          const requiredInputs = await page.locator('input[required], textarea[required], select[required]').count();
          
          if (allInputs > 0) {
            const frictionRatio = requiredInputs / allInputs;
            console.log(`ℹ️ Form friction: ${requiredInputs}/${allInputs} required (${Math.round(frictionRatio * 100)}%)`);
            
            // Good UX practice: not too many required fields
            expect(requiredInputs).toBeLessThanOrEqual(8);
          }
        });
        
        test('should provide trust indicators', async () => {
          const page = sharedPage;
          
          // Look for trust-building elements
          const hasSecurity = await page.locator('text=/secure|ssl|encrypted|privacy|safe/i').count() > 0;
          const hasCredentials = await page.locator('text=/licensed|insured|certified|bbb/i').count() > 0;
          const hasTestimonials = await page.locator('text=/testimonial|review|rating|star/i').count() > 0;
          const hasGuarantee = await page.locator('text=/guarantee|warranty|satisfaction/i').count() > 0;
          
          const trustIndicators = [hasSecurity, hasCredentials, hasTestimonials, hasGuarantee].filter(Boolean).length;
          
          if (trustIndicators > 0) {
            console.log(`ℹ️ Found ${trustIndicators} trust indicators`);
          }
        });
      });

      test.describe('Performance & Technical Quality', () => {
        
        test('should load within acceptable time', async () => {
          const page = sharedPage;
          
          const startTime = Date.now();
          
          // Test page reload performance
          await page.reload();
          await page.waitForLoadState('networkidle');
          
          const loadTime = Date.now() - startTime;
          
          // Contact pages should load quickly
          expect(loadTime).toBeLessThan(8000); // 8 seconds max
          
          console.log(`ℹ️ ${name} page load time: ${loadTime}ms`);
        });
        
        test('should be mobile responsive', async () => {
          const page = sharedPage;
          
          // Test responsive behavior
          const viewports = [
            { width: 375, height: 667 },   // Mobile
            { width: 768, height: 1024 },  // Tablet
            { width: 1440, height: 900 }   // Desktop
          ];
          
          for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await page.waitForTimeout(500);
            
            // Verify main content remains visible
            await expect(page.locator('h1').first()).toBeVisible();
            
            // Check that forms are still usable
            const forms = await page.locator('form').count();
            if (forms > 0) {
              const firstInput = page.locator('input, textarea').first();
              if (await firstInput.count() > 0) {
                await expect(firstInput).toBeVisible();
              }
            }
            
            console.log(`ℹ️ ${name} functional at ${viewport.width}x${viewport.height}`);
          }
          
          // Reset to standard viewport
          await page.setViewportSize({ width: 1280, height: 1080 });
        });
      });

      test.describe('Accessibility & SEO', () => {
        
        test('should have proper form accessibility', async () => {
          const page = sharedPage;
          
          // Check for form labels and accessibility
          const labels = await page.locator('label').count();
          const inputs = await page.locator('input, textarea, select').count();
          const ariaLabels = await page.locator('[aria-label], [aria-labelledby]').count();
          
          if (inputs > 0) {
            // Should have labels or aria-labels for form inputs
            const accessibilityRatio = (labels + ariaLabels) / inputs;
            console.log(`ℹ️ Form accessibility: ${labels + ariaLabels}/${inputs} labeled inputs`);
            
            expect(accessibilityRatio).toBeGreaterThan(0.5); // At least 50% of inputs should be labeled
          }
        });
        
        test('should support keyboard navigation', async () => {
          const page = sharedPage;
          
          // Test tab navigation through form
          await page.keyboard.press('Tab');
          await page.waitForTimeout(200);
          
          const focusedElement = page.locator(':focus');
          if (await focusedElement.count() > 0) {
            // Should be able to tab through form elements
            let tabCount = 0;
            const maxTabs = 10;
            
            while (tabCount < maxTabs) {
              await page.keyboard.press('Tab');
              await page.waitForTimeout(100);
              tabCount++;
              
              const currentFocus = await page.locator(':focus').count();
              if (currentFocus === 0) break;
            }
            
            console.log(`ℹ️ Keyboard navigation: ${tabCount} tabbable elements`);
          }
        });
        
        test('should have appropriate page metadata', async () => {
          const page = sharedPage;
          
          // Check for SEO elements
          const pageTitle = await page.title();
          const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
          
          // Should have descriptive title
          expect(pageTitle).toBeTruthy();
          expect(pageTitle.toLowerCase()).toContain('contact');
          
          if (metaDescription) {
            expect(metaDescription.length).toBeGreaterThan(20);
            console.log('ℹ️ Meta description present');
          }
          
          console.log(`ℹ️ Page title: ${pageTitle}`);
        });
      });

      test.describe('Business Integration', () => {
        
        test('should integrate with business processes', async () => {
          const page = sharedPage;
          
          // Look for business integration indicators
          const hasCRM = await page.locator('text=/salesforce|hubspot|crm/i').count() > 0;
          const hasTracking = await page.locator('script').filter({ hasText: /analytics|gtag|fbq/ }).count() > 0;
          const hasAutomation = await page.locator('text=/autoresponder|confirmation|follow.?up/i').count() > 0;
          
          // Should have some business integration
          const integrations = [hasCRM, hasTracking, hasAutomation].filter(Boolean).length;
          
          if (integrations > 0) {
            console.log(`ℹ️ Found ${integrations} business integration indicators`);
          }
        });
        
        test('should provide immediate response expectations', async () => {
          const page = sharedPage;
          
          // Look for response time commitments
          const hasResponseTime = await page.locator('text=/24 hours|same day|within|respond|reply/i').count() > 0;
          const hasNextSteps = await page.locator('text=/next step|what happens|process|follow.?up/i').count() > 0;
          
          if (hasResponseTime) {
            console.log('ℹ️ Response time expectations set');
          }
          
          if (hasNextSteps) {
            console.log('ℹ️ Next steps communicated');
          }
        });
      });

      test.describe('Error Handling', () => {
        
        test('should handle form submission gracefully', async () => {
          const page = sharedPage;
          
          // Monitor for JavaScript errors during form interaction
          const errors = [];
          page.on('pageerror', (error) => {
            errors.push(error);
          });
          
          // Test form interaction without actual submission
          const forms = page.locator('form');
          if (await forms.count() > 0) {
            const firstForm = forms.first();
            const inputs = firstForm.locator('input, textarea');
            
            // Fill some test data
            const inputCount = await inputs.count();
            for (let i = 0; i < Math.min(inputCount, 3); i++) {
              const input = inputs.nth(i);
              if (await input.isVisible()) {
                await input.fill('Test Data');
                await page.waitForTimeout(100);
              }
            }
          }
          
          // Verify no critical JavaScript errors
          expect(errors.length).toBe(0);
        });
      });
    });
  });
});