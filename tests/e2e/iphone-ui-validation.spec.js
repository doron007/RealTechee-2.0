const { test, expect } = require('@playwright/test');

test.describe('iPhone UI Validation - Quick Check', () => {
  // iPhone 15 Pro viewport
  test.use({ 
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  test('Get Estimate form - iPhone UI improvements', async ({ page }) => {
    await page.goto('http://localhost:3000/contact/get-estimate');
    await page.waitForLoadState('networkidle');

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/iphone-get-estimate-debug.png', fullPage: true });

    // Check if page title is updated for iPhone
    const title = await page.locator('h1').textContent();
    console.log('Page title:', title);

    // Check if buttons are visible in hero section
    const heroSection = page.locator('#hero');
    const buttonCount = await heroSection.locator('a').filter({ hasText: /Get an Estimate|Contact Us|Get Qualified|Affiliate/ }).count();
    console.log('Category buttons count in hero section:', buttonCount);

    // Check form visibility and position
    const form = page.locator('form');
    await expect(form).toBeVisible();
    const formBox = await form.boundingBox();
    console.log('Form position - Y:', formBox.y, 'Height:', formBox.height);

    // Test font size on first input
    const firstInput = page.locator('input').first();
    if (await firstInput.count() > 0) {
      const fontSize = await firstInput.evaluate(el => window.getComputedStyle(el).fontSize);
      console.log('First input font size:', fontSize);
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
    }

    // Basic validation test - try submitting empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Just log if there are any error messages visible
    const errors = await page.locator('[class*="error"], .text-red-500, .text-red-600').count();
    console.log('Validation errors displayed:', errors);
  });
});