import { test } from '@playwright/test';

test('debug templates - inspect database content', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  
  // Handle authentication
  if (page.url().includes('/login')) {
    console.log('🔐 Authenticating...');
    await page.waitForSelector('input[type="email"], input[name="username"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="username"]', 'info@realtechee.com');
    await page.fill('input[type="password"], input[name="password"]', 'Sababa123!');
    
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await signInBtn.click();
    await page.waitForTimeout(5000);
  }

  // Open notifications
  await page.getByRole('button', { name: 'Button icon Notifications' }).click();
  await page.waitForTimeout(2000);

  // Switch to templates tab
  await page.getByRole('button', { name: 'Templates12' }).click();
  await page.waitForTimeout(3000);

  // Listen for console logs from the browser
  page.on('console', msg => {
    if (msg.type() === 'log' && msg.text().includes('templates')) {
      console.log('🔍 Browser Console:', msg.text());
    }
  });

  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'debug-templates-loaded.png', fullPage: false });
  console.log('📸 Screenshot taken: debug-templates-loaded.png');
});