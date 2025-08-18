import { test, expect } from '@playwright/test';

test('debug QA issues with screenshots', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  
  // Handle authentication
  if (page.url().includes('/login')) {
    console.log('🔐 Authenticating...');
    await page.waitForSelector('input[type="email"], input[name="username"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="username"]', 'info@realtechee.com');
    await page.fill('input[type="password"], input[name="password"]', 'Sababa123!');
    
    // Submit login form
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await expect(signInBtn).toBeVisible({ timeout: 10000 });
    await expect(signInBtn).toBeEnabled();
    await signInBtn.click();

    // Wait for redirect
    await Promise.race([
      page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }),
      page.waitForSelector('[data-testid="admin-layout"], .admin-layout, [data-testid="admin-data-grid"], main', { timeout: 15000 })
    ]).catch(() => {});
    
    await page.waitForTimeout(5000);
  }

  // Take screenshot of admin header to check issue #5
  await page.screenshot({ path: 'debug-issue5-header.png', fullPage: false });
  console.log('📸 Screenshot taken: debug-issue5-header.png');

  // Open notifications
  await page.getByRole('button', { name: 'Button icon Notifications' }).click();
  await page.waitForTimeout(2000);

  // Check History tab and take screenshot for issue #1
  await page.getByRole('button', { name: 'History100' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug-issue1-history.png', fullPage: false });
  console.log('📸 Screenshot taken: debug-issue1-history.png - Check font size of notification names');

  // Click notification detail to check issues #2 and #3
  try {
    await page.locator('.flex > .flex > .px-3.py-1.text-sm.bg-blue-100').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'debug-issue2-3-modal.png', fullPage: false });
    console.log('📸 Screenshot taken: debug-issue2-3-modal.png - Check modal header spacing and JSON formatting');
    await page.getByRole('button', { name: 'Cancel' }).click();
  } catch (e) {
    console.log('Could not click notification detail button');
  }

  // Switch to templates tab to check issue #4
  await page.getByRole('button', { name: 'Templates12' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-issue4-templates.png', fullPage: false });
  console.log('📸 Screenshot taken: debug-issue4-templates.png - Check template loading error');

  // Switch to Signals tab to check issues #6 and #7
  await page.getByRole('button', { name: 'Signals' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-issue6-7-signals.png', fullPage: false });
  console.log('📸 Screenshot taken: debug-issue6-7-signals.png - Check signals loading and dropdown placement');

  // Take a screenshot of the full page for overall view
  await page.screenshot({ path: 'debug-full-page.png', fullPage: true });
  console.log('📸 Screenshot taken: debug-full-page.png - Full page view');
});