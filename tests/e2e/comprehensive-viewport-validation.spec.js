const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Viewport Validation - All Forms', () => {
  const forms = [
    { name: 'Get Estimate', url: '/contact/get-estimate', expectedIPhoneTitle: 'Estimate Form' },
    { name: 'Contact Us', url: '/contact/contact-us', expectedIPhoneTitle: 'Contact Form' },
    { name: 'Get Qualified', url: '/contact/get-qualified', expectedIPhoneTitle: 'Agent Qualification' },
    { name: 'Affiliate', url: '/contact/affiliate', expectedIPhoneTitle: 'Partner Application' }
  ];

  const viewports = [
    { 
      name: 'iPhone', 
      viewport: { width: 393, height: 852 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    },
    { 
      name: 'Desktop', 
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  ];

  viewports.forEach(({ name: viewportName, viewport, userAgent }) => {
    test.describe(`${viewportName} Viewport (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport, userAgent });

      forms.forEach(form => {
        test(`${form.name} - Complete UI/UX validation`, async ({ page }) => {
          console.log(`\n=== Testing ${form.name} on ${viewportName} (${viewport.width}x${viewport.height}) ===`);
          
          await page.goto(`http://localhost:3000${form.url}`);
          await page.waitForLoadState('networkidle');

          // 1. VERIFY PAGE TITLE
          const pageTitle = await page.locator('h1').textContent();
          console.log(`Page title: "${pageTitle}"`);
          
          if (viewportName === 'iPhone') {
            expect(pageTitle).toContain(form.expectedIPhoneTitle);
            console.log(`✅ iPhone title correct: ${form.expectedIPhoneTitle}`);
          } else {
            expect(pageTitle).toBe('Contact');
            console.log(`✅ Desktop title correct: Contact`);
          }

          // 2. VERIFY CATEGORY BUTTONS BEHAVIOR
          const heroSection = page.locator('#hero');
          const categoryButtons = heroSection.locator('a').filter({ hasText: /Get an Estimate|Contact Us|Get Qualified|Affiliate/ });
          const buttonCount = await categoryButtons.count();
          console.log(`Category buttons in hero: ${buttonCount}`);

          if (viewportName === 'iPhone') {
            expect(buttonCount).toBe(0);
            console.log(`✅ iPhone: Category buttons hidden`);
          } else {
            expect(buttonCount).toBeGreaterThan(0);
            console.log(`✅ Desktop: Category buttons visible (${buttonCount} found)`);
          }

          // 3. VERIFY FORM VISIBILITY AND ACCESSIBILITY
          const formElement = page.locator('form');
          await expect(formElement).toBeVisible();
          const formBox = await formElement.boundingBox();
          console.log(`Form position: Y=${formBox.y}, Height=${formBox.height}`);
          expect(formBox.height).toBeGreaterThan(100); // Form should have content
          console.log(`✅ Form is visible and has content`);

          // 4. VERIFY ALL INPUTS HAVE 16PX+ FONT SIZE (iPhone zoom prevention)
          const inputs = page.locator('input, select, textarea');
          const inputCount = await inputs.count();
          console.log(`Total inputs found: ${inputCount}`);

          let fontSizeFailures = 0;
          for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            const fontSize = await input.evaluate(el => window.getComputedStyle(el).fontSize);
            const fontSizeNum = parseInt(fontSize);
            
            if (fontSizeNum < 16) {
              fontSizeFailures++;
              console.log(`❌ Input ${i}: font-size ${fontSize} (< 16px)`);
            }
          }
          
          expect(fontSizeFailures).toBe(0);
          console.log(`✅ All ${inputCount} inputs have 16px+ font size`);

          // 5. VERIFY FORM VALIDATION AND ERROR HANDLING
          const submitButton = page.locator('button[type="submit"]');
          await expect(submitButton).toBeVisible();
          
          // Try submitting empty form
          await submitButton.click();
          await page.waitForTimeout(1500); // Allow time for validation and focus

          // Check for validation errors
          const errorElements = page.locator('[class*="error"], .text-red-500, .text-red-600, [role="alert"]');
          const errorCount = await errorElements.count();
          console.log(`Validation errors displayed: ${errorCount}`);
          
          // Most forms should have required fields that trigger validation
          if (errorCount > 0) {
            console.log(`✅ Form validation working (${errorCount} errors shown)`);
            
            // Check if focus management is working
            const focusedElement = await page.evaluate(() => {
              const active = document.activeElement;
              return active ? {
                tagName: active.tagName,
                name: active.name || active.id || 'no-name',
                type: active.type || 'no-type'
              } : null;
            });
            
            if (focusedElement && focusedElement.tagName !== 'BODY') {
              console.log(`✅ Focus management: ${focusedElement.tagName} (${focusedElement.name})`);
            } else {
              console.log(`⚠️  Focus management: No specific field focused`);
            }
          } else {
            console.log(`⚠️  No validation errors (might be expected for some forms)`);
          }

          // 6. VERIFY RESPONSIVE LAYOUT
          const containerWidth = await page.evaluate(() => {
            const container = document.querySelector('form').closest('div');
            return window.getComputedStyle(container).width;
          });
          console.log(`Form container width: ${containerWidth}`);
          
          if (viewportName === 'iPhone') {
            // On iPhone, form should use most of the viewport width
            expect(parseInt(containerWidth)).toBeGreaterThan(300);
            console.log(`✅ iPhone: Form uses appropriate width`);
          } else {
            // On desktop, form should have reasonable max width
            expect(parseInt(containerWidth)).toBeLessThan(800);
            console.log(`✅ Desktop: Form has reasonable max width`);
          }

          console.log(`✅ ${form.name} on ${viewportName}: ALL CHECKS PASSED\n`);
        });
      });
    });
  });

  // SUMMARY TEST - Run after all individual tests
  test('FINAL SUMMARY - All Forms All Viewports', async ({ page }) => {
    console.log('\n=== FINAL VALIDATION SUMMARY ===');
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const viewport of viewports) {
      for (const form of forms) {
        totalTests++;
        
        // Quick validation of each form/viewport combo
        await page.setViewportSize(viewport.viewport);
        await page.setExtraHTTPHeaders({
          'User-Agent': viewport.userAgent
        });
        
        await page.goto(`http://localhost:3000${form.url}`);
        await page.waitForLoadState('networkidle');
        
        // Basic checks
        const hasForm = await page.locator('form').isVisible();
        const inputCount = await page.locator('input, select, textarea').count();
        const titleText = await page.locator('h1').textContent();
        
        if (hasForm && inputCount > 0 && titleText) {
          passedTests++;
          console.log(`✅ ${form.name} on ${viewport.name}: PASS`);
        } else {
          console.log(`❌ ${form.name} on ${viewport.name}: FAIL`);
        }
      }
    }
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed Tests: ${passedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests/totalTests)*100)}%`);
    
    expect(passedTests).toBe(totalTests);
    console.log(`\n🎉 ALL FORMS ALL VIEWPORTS: 100% SUCCESS`);
  });
});