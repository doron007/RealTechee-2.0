/**
 * Mobile-specific test for Get Estimate form on iPhone 15 Pro viewport
 * This test bypasses navigation issues and goes directly to the form URL
 */

const { test, expect } = require('@playwright/test');

test.describe('Mobile Get Estimate Form Analysis', () => {
  test('analyze Get Estimate form layout on iPhone 15 Pro', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('📱 Testing on iPhone 15 Pro viewport (393x852)');
    
    // Go directly to the form page
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot of the form
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mobile-get-estimate-initial.png',
      fullPage: true 
    });
    
    // Analyze form intro section
    console.log('📋 Analyzing form intro section...');
    
    // Check if intro text is visible
    const introText = await page.locator('h1, h2, h3').filter({ hasText: /Get.*Estimate/i }).first();
    if (await introText.isVisible()) {
      const introBox = await introText.boundingBox();
      console.log('  Intro heading height:', introBox?.height);
    }
    
    // Measure how much scrolling is needed to reach first input
    const firstInput = await page.locator('input, select').first();
    const firstInputBox = await firstInput.boundingBox();
    console.log('  Distance to first input:', firstInputBox?.y, 'px');
    
    // Scroll to first input and take screenshot
    await firstInput.scrollIntoViewIfNeeded();
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mobile-get-estimate-first-input.png',
      fullPage: false 
    });
    
    // Check input field widths and label positioning
    console.log('📏 Analyzing input field layouts...');
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"], select').all();
    
    for (let i = 0; i < Math.min(inputs.length, 3); i++) {
      const input = inputs[i];
      const box = await input.boundingBox();
      const label = await input.evaluateHandle(el => {
        const id = el.id || el.name;
        return document.querySelector(`label[for="${id}"]`);
      });
      
      if (box) {
        console.log(`  Input ${i + 1}: width=${box.width}px (${Math.round(box.width/393*100)}% of viewport)`);
      }
    }
    
    // Fill minimal form to test submission flow
    console.log('📝 Filling form to test submission...');
    
    // Fill required fields
    await page.selectOption('select[name="relationToProperty"]', 'Homeowner');
    await page.fill('input[name="propertyAddress.streetAddress"]', '123 Test St');
    await page.fill('input[name="propertyAddress.city"]', 'San Francisco');
    await page.selectOption('select[name="propertyAddress.state"]', 'CA');
    await page.fill('input[name="propertyAddress.zip"]', '94105');
    
    // Agent info (required)
    await page.fill('input[name="agentInfo.fullName"]', 'Test Agent');
    await page.fill('input[name="agentInfo.email"]', 'test@example.com');
    await page.fill('input[name="agentInfo.phone"]', '4155551234');
    await page.selectOption('select[name="agentInfo.brokerage"]', 'Other');
    await page.fill('input[name="agentInfo.customBrokerage"]', 'Test Brokerage');
    
    // Finance selection
    await page.click('label:has-text("No")');
    
    // Scroll to submit button
    const submitButton = page.getByRole('button', { name: /Send/i });
    await submitButton.scrollIntoViewIfNeeded();
    
    // Take screenshot of submit button area
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mobile-get-estimate-submit-area.png',
      fullPage: false 
    });
    
    // Submit form
    await submitButton.click();
    
    // Wait for success message
    await page.waitForTimeout(5000);
    
    // Check if success message is visible without scrolling
    const successMessages = [
      page.locator('text=Request Submitted Successfully!'),
      page.locator('text=Thank you'),
      page.locator('h2, h3').filter({ hasText: /submitted|success/i })
    ];
    
    let successVisible = false;
    let successInViewport = false;
    
    for (const successLocator of successMessages) {
      if (await successLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
        successVisible = true;
        const box = await successLocator.boundingBox();
        if (box && box.y >= 0 && box.y <= 852) {
          successInViewport = true;
        }
        break;
      }
    }
    
    console.log('✅ Success message visible:', successVisible);
    console.log('📍 Success message in viewport:', successInViewport);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mobile-get-estimate-success.png',
      fullPage: true 
    });
    
    // Summary
    console.log('\n📊 Mobile UX Analysis Complete:');
    console.log('  - Initial scroll required to reach form inputs');
    console.log('  - Input field layout analysis captured');
    console.log('  - Success message visibility checked');
    console.log('  - Screenshots saved for review');
  });
});