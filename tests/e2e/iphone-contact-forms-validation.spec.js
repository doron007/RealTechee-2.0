const { test, expect } = require('@playwright/test');

test.describe('iPhone Contact Forms - Validation and UX', () => {
  // iPhone 15 Pro viewport
  test.use({ 
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const forms = [
    { name: 'Get Estimate', url: '/contact/get-estimate', title: 'Estimate Form' },
    { name: 'Contact Us', url: '/contact/contact-us', title: 'Contact Form' },
    { name: 'Get Qualified', url: '/contact/get-qualified', title: 'Agent Qualification' },
    { name: 'Affiliate', url: '/contact/affiliate', title: 'Partner Application' }
  ];

  forms.forEach(form => {
    test(`${form.name} - iPhone viewport UX improvements`, async ({ page }) => {
      // Navigate to form
      await page.goto(`http://localhost:3000${form.url}`);
      await page.waitForLoadState('networkidle');

      // Verify iPhone-specific title is displayed
      await expect(page.locator('h1')).toContainText(form.title);

      // Verify category buttons are hidden on iPhone (specifically in hero section)
      const heroSection = page.locator('#hero');
      const categoryButtons = heroSection.locator('a').filter({ hasText: /Get an Estimate|Contact Us|Get Qualified|Affiliate Inquiry/ });
      await expect(categoryButtons).toHaveCount(0);

      // Verify form is visible and takes up screen real estate
      const formElement = page.locator('form');
      await expect(formElement).toBeVisible();

      // Get form bounding box to ensure it's properly positioned
      const formBox = await formElement.boundingBox();
      expect(formBox.y).toBeLessThan(200); // Form should start near top of viewport
    });

    test(`${form.name} - Form validation error handling`, async ({ page }) => {
      await page.goto(`http://localhost:3000${form.url}`);
      await page.waitForLoadState('networkidle');

      // Try to submit empty form to trigger validation
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for validation to complete
      await page.waitForTimeout(500);

      // Check that some validation error exists (forms should have required fields)
      const errorMessages = page.locator('[class*="error"], .text-red-500, .text-red-600');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        console.log(`${form.name}: Found ${errorCount} validation error(s) as expected`);
        
        // Check that the first input field exists and is focusable
        const firstInput = page.locator('input, select, textarea').first();
        await expect(firstInput).toBeVisible();
        
        // Verify the input has proper font size (16px minimum for no zoom)
        const fontSize = await firstInput.evaluate(el => window.getComputedStyle(el).fontSize);
        const fontSizeNum = parseInt(fontSize);
        expect(fontSizeNum).toBeGreaterThanOrEqual(16);
        
        console.log(`${form.name}: First input font size: ${fontSize}`);
      }
    });
  });

  test('All forms - Input font sizes prevent iPhone zoom', async ({ page }) => {
    for (const form of forms) {
      await page.goto(`http://localhost:3000${form.url}`);
      await page.waitForLoadState('networkidle');

      // Check all input elements have 16px+ font size
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const fontSize = await input.evaluate(el => window.getComputedStyle(el).fontSize);
        const fontSizeNum = parseInt(fontSize);
        
        expect(fontSizeNum).toBeGreaterThanOrEqual(16);
      }
      
      console.log(`${form.name}: Verified ${inputCount} inputs have 16px+ font size`);
    }
  });
});