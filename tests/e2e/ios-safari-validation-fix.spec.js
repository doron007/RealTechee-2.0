const { test, expect } = require('@playwright/test');

test.describe('iOS Safari Validation Fix', () => {
  // iPhone viewport with iOS Safari user agent
  test.use({ 
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  test('Get Estimate form - iOS validation with already focused field', async ({ page }) => {
    console.log('\n=== Testing iOS Safari Validation Fix ===');
    
    await page.goto('http://localhost:3000/contact/get-estimate');
    await page.waitForLoadState('networkidle');

    // Simulate the user scenario: focus on phone field but don't fill it
    const phoneField = page.locator('input[name="agentInfo.phone"]');
    await expect(phoneField).toBeVisible();
    
    // Focus the phone field (required field)
    await phoneField.focus();
    console.log('✅ Phone field focused');

    // Scroll down to submit button (simulating user scrolling while field is focused)
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.scrollIntoViewIfNeeded();
    console.log('✅ Scrolled to submit button (phone field now out of view but still focused)');

    // Check that phone field is still focused but out of viewport
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? {
        name: active.name || active.id || 'no-name',
        tagName: active.tagName,
        isInViewport: active.getBoundingClientRect().top >= 0 && 
                     active.getBoundingClientRect().bottom <= window.innerHeight
      } : null;
    });
    
    console.log('Focused element before submit:', focusedElement);
    expect(focusedElement.name).toBe('agentInfo.phone');
    console.log('✅ Phone field still has focus');

    // Try to submit the form (should trigger validation)
    await submitButton.click();
    console.log('✅ Clicked submit button');

    // Wait for validation to complete and our iOS fix to execute
    await page.waitForTimeout(500);

    // Check if validation occurred and field is visible/focused
    const postValidationState = await page.evaluate(() => {
      const phoneField = document.querySelector('input[name="agentInfo.phone"]');
      const activeElement = document.activeElement;
      
      return {
        phoneFieldExists: !!phoneField,
        phoneFieldFocused: activeElement === phoneField,
        phoneFieldInViewport: phoneField ? 
          phoneField.getBoundingClientRect().top >= 0 && 
          phoneField.getBoundingClientRect().bottom <= window.innerHeight : false,
        phoneFieldValue: phoneField ? phoneField.value : null,
        phoneFieldRequired: phoneField ? phoneField.required : false,
        phoneFieldValid: phoneField ? phoneField.validity.valid : null
      };
    });

    console.log('Post-validation state:', postValidationState);

    // Verify iOS fix worked:
    // 1. Phone field should be back in focus (after blur/refocus)
    expect(postValidationState.phoneFieldFocused).toBe(true);
    console.log('✅ Phone field regained focus after validation');

    // 2. Phone field should be visible in viewport (scrolled to)
    expect(postValidationState.phoneFieldInViewport).toBe(true);
    console.log('✅ Phone field is now visible in viewport');

    // 3. Field should be invalid (empty required field)
    expect(postValidationState.phoneFieldValid).toBe(false);
    console.log('✅ Phone field correctly shows invalid state');

    // 4. Verify the field shows validation message (iOS Safari specific)
    const validationMessage = await page.evaluate(() => {
      const phoneField = document.querySelector('input[name="agentInfo.phone"]');
      return phoneField ? phoneField.validationMessage : null;
    });

    console.log('Validation message:', validationMessage);
    expect(validationMessage).toBeTruthy(); // Should have some validation message
    console.log('✅ Validation message is displayed');

    console.log('\n🎉 iOS Safari validation fix working correctly!');
  });

  test('Contact Us form - iOS validation with different field types', async ({ page }) => {
    await page.goto('http://localhost:3000/contact/contact-us');
    await page.waitForLoadState('networkidle');

    // Test with email field (different input type)
    const emailField = page.locator('input[name="contactInfo.email"]');
    await emailField.focus();
    await emailField.fill('invalid-email'); // Invalid email format

    // Scroll away and submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Check if email field is back in focus and visible
    const emailFieldState = await page.evaluate(() => {
      const field = document.querySelector('input[name="contactInfo.email"]');
      return {
        focused: document.activeElement === field,
        inViewport: field ? 
          field.getBoundingClientRect().top >= 0 && 
          field.getBoundingClientRect().bottom <= window.innerHeight : false,
        valid: field ? field.validity.valid : null,
        validationMessage: field ? field.validationMessage : null
      };
    });

    console.log('\nEmail field validation state:', emailFieldState);
    expect(emailFieldState.focused).toBe(true);
    expect(emailFieldState.inViewport).toBe(true);
    console.log('✅ Email field validation and focus management working');
  });
});