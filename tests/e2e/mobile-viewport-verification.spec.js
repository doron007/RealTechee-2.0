/**
 * Mobile Viewport Verification Test
 * Quick test to verify all form elements are properly rendered on mobile
 */

const { test, expect } = require('@playwright/test');

test.describe('Mobile Viewport Verification - iPhone 15 Pro', () => {
  test.use({ viewport: { width: 393, height: 852 } });
  
  const FORMS = [
    { name: 'Get Estimate', url: '/contact/get-estimate' },
    { name: 'Contact Us', url: '/contact/contact-us' },
    { name: 'Get Qualified', url: '/contact/get-qualified' },
    { name: 'Affiliate', url: '/contact/affiliate' }
  ];

  FORMS.forEach(form => {
    test(`${form.name} mobile DOM verification`, async ({ page }) => {
      test.setTimeout(30000);
      
      console.log(`\n📱 === ${form.name.toUpperCase()} MOBILE DOM TEST ===\n`);
      
      await page.goto(form.url);
      await page.waitForLoadState('networkidle');
      
      // Count all form inputs
      const textInputs = await page.locator('input[type="text"]').count();
      const emailInputs = await page.locator('input[type="email"]').count();
      const phoneInputs = await page.locator('input[type="tel"]').count();
      const textareas = await page.locator('textarea').count();
      const selects = await page.locator('select').count();
      
      const totalInputs = textInputs + emailInputs + phoneInputs + textareas + selects;
      
      console.log(`📊 Element Count:`);
      console.log(`  Text inputs: ${textInputs}`);
      console.log(`  Email inputs: ${emailInputs}`);
      console.log(`  Phone inputs: ${phoneInputs}`);
      console.log(`  Textareas: ${textareas}`);
      console.log(`  Dropdowns: ${selects}`);
      console.log(`  Total form elements: ${totalInputs}`);
      
      // Check if all inputs are visible
      let visibleInputs = 0;
      let inViewportInputs = 0;
      
      // Check text inputs
      const textInputElements = await page.locator('input[type="text"]').all();
      for (const input of textInputElements) {
        if (await input.isVisible()) {
          visibleInputs++;
          const box = await input.boundingBox();
          if (box && box.x >= 0 && box.x + box.width <= 393) {
            inViewportInputs++;
          }
        }
      }
      
      // Check email inputs
      const emailInputElements = await page.locator('input[type="email"]').all();
      for (const input of emailInputElements) {
        if (await input.isVisible()) {
          visibleInputs++;
          const box = await input.boundingBox();
          if (box && box.x >= 0 && box.x + box.width <= 393) {
            inViewportInputs++;
          }
        }
      }
      
      // Check phone inputs
      const phoneInputElements = await page.locator('input[type="tel"]').all();
      for (const input of phoneInputElements) {
        if (await input.isVisible()) {
          visibleInputs++;
          const box = await input.boundingBox();
          if (box && box.x >= 0 && box.x + box.width <= 393) {
            inViewportInputs++;
          }
        }
      }
      
      // Check textareas
      const textareaElements = await page.locator('textarea').all();
      for (const textarea of textareaElements) {
        if (await textarea.isVisible()) {
          visibleInputs++;
          const box = await textarea.boundingBox();
          if (box && box.x >= 0 && box.x + box.width <= 393) {
            inViewportInputs++;
          }
        }
      }
      
      // Check selects
      const selectElements = await page.locator('select').all();
      for (const select of selectElements) {
        if (await select.isVisible()) {
          visibleInputs++;
          const box = await select.boundingBox();
          if (box && box.x >= 0 && box.x + box.width <= 393) {
            inViewportInputs++;
          }
        }
      }
      
      const visibilityRate = Math.round((visibleInputs / totalInputs) * 100);
      const viewportRate = Math.round((inViewportInputs / totalInputs) * 100);
      
      console.log(`\n📊 Visibility Analysis:`);
      console.log(`  Visible elements: ${visibleInputs}/${totalInputs} (${visibilityRate}%)`);
      console.log(`  In viewport elements: ${inViewportInputs}/${totalInputs} (${viewportRate}%)`);
      
      // Test form functionality
      const firstInput = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').first();
      let inputWorks = false;
      if (await firstInput.isVisible()) {
        await firstInput.fill('Test');
        const value = await firstInput.inputValue();
        inputWorks = value === 'Test';
      }
      
      // Check horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      // Get first input width for utilization
      let inputUtilization = 0;
      if (await firstInput.isVisible()) {
        const box = await firstInput.boundingBox();
        if (box) {
          inputUtilization = Math.round((box.width / 393) * 100);
        }
      }
      
      console.log(`\n🔧 Functionality Tests:`);
      console.log(`  Input works: ${inputWorks ? '✅' : '❌'}`);
      console.log(`  No horizontal scroll: ${hasHorizontalScroll ? '❌' : '✅'}`);
      console.log(`  Input width utilization: ${inputUtilization}%`);
      
      // Take screenshot
      await page.screenshot({ 
        path: `tests/e2e/screenshots/mobile-verification-${form.name.toLowerCase().replace(/\\s+/g, '-')}.png`,
        fullPage: false 
      });
      
      console.log(`\n📸 Screenshot: mobile-verification-${form.name.toLowerCase().replace(/\\s+/g, '-')}.png`);
      console.log(`\n📊 === ${form.name.toUpperCase()} MOBILE TEST COMPLETED ===\n`);
      
      // Assertions
      expect(totalInputs).toBeGreaterThan(0); // Form has inputs
      expect(visibilityRate).toBeGreaterThanOrEqual(90); // 90%+ visible
      expect(viewportRate).toBeGreaterThanOrEqual(90); // 90%+ in viewport
      expect(hasHorizontalScroll).toBeFalsy(); // No horizontal scroll
      expect(inputWorks).toBeTruthy(); // Inputs work
    });
  });
  
  test('Mobile cross-form consistency', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🔄 === MOBILE CROSS-FORM CONSISTENCY ===\n');
    
    const formData = [];
    
    for (const form of FORMS) {
      await page.goto(form.url);
      await page.waitForLoadState('networkidle');
      
      const totalInputs = await page.locator('input, textarea, select').count();
      const visibleInputs = await page.locator('input:visible, textarea:visible, select:visible').count();
      
      const firstInput = page.locator('input[type="text"], input[type="email"], input[type="tel"]').first();
      let utilization = 0;
      
      if (await firstInput.isVisible()) {
        const box = await firstInput.boundingBox();
        if (box) {
          utilization = Math.round((box.width / 393) * 100);
        }
      }
      
      const hasScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      formData.push({
        name: form.name,
        totalInputs,
        visibleInputs,
        utilization,
        hasScroll,
        visibilityRate: Math.round((visibleInputs / totalInputs) * 100)
      });
      
      console.log(`${form.name}: ${visibleInputs}/${totalInputs} visible (${Math.round((visibleInputs / totalInputs) * 100)}%), ${utilization}% utilization, scroll: ${hasScroll ? 'YES' : 'NO'}`);
    }
    
    // Check consistency
    const visibilityRates = formData.map(f => f.visibilityRate);
    const utilizations = formData.map(f => f.utilization);
    const scrollIssues = formData.filter(f => f.hasScroll).length;
    
    const minVisibility = Math.min(...visibilityRates);
    const maxVisibility = Math.max(...visibilityRates);
    const minUtilization = Math.min(...utilizations);
    const maxUtilization = Math.max(...utilizations);
    
    console.log(`\n📊 Consistency Summary:`);
    console.log(`  Visibility: ${minVisibility}%-${maxVisibility}%`);
    console.log(`  Input utilization: ${minUtilization}%-${maxUtilization}%`);
    console.log(`  Forms with scroll issues: ${scrollIssues}/4`);
    
    const allConsistent = (maxVisibility - minVisibility) <= 10 && 
                         (maxUtilization - minUtilization) <= 15 && 
                         scrollIssues === 0;
    
    console.log(`  ${allConsistent ? '✅' : '❌'} Overall consistency: ${allConsistent ? 'PASS' : 'FAIL'}`);
    console.log('\n📊 === MOBILE CONSISTENCY COMPLETED ===\n');
    
    expect(minVisibility).toBeGreaterThanOrEqual(90);
    expect(scrollIssues).toBe(0);
  });
});