const { test, expect } = require('@playwright/test');

test.describe('Admin iPhone Hamburger Menu', () => {
  test('iPhone admin hamburger menu functionality', async ({ page }) => {
    // Set iPhone viewport to trigger hamburger mode
    await page.setViewportSize({ width: 393, height: 852 });
    await page.setExtraHTTPHeaders({ 
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    
    // Navigate to admin and authenticate
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('/login')) {
      await page.waitForSelector('input[type="email"], input[name="username"]', { timeout: 10000 });
      await page.fill('input[type="email"], input[name="username"]', 'info@realtechee.com');
      await page.fill('input[type="password"], input[name="password"]', 'Sababa123!');
      
      const signInBtn = page.getByRole('button', { name: /sign in/i });
      await expect(signInBtn).toBeVisible({ timeout: 10000 });
      await signInBtn.click();
      
      await Promise.race([
        page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }),
        page.waitForSelector('[data-testid="admin-layout"], .admin-layout, main', { timeout: 15000 })
      ]).catch(() => {});
      
      await page.waitForTimeout(3000);
    }
    
    // Verify admin page loaded
    expect(page.url()).toContain('/admin');
    
    // Find hamburger button
    const hamburgerButton = page.getByRole('button', { name: 'Open menu' });
    await expect(hamburgerButton).toBeVisible();
    
    // Click hamburger to open menu
    await hamburgerButton.click();
    await page.waitForTimeout(1000);
    
    // Verify menu opened - look for sidebar with navigation items
    const sidebar = page.locator('div.fixed.left-0.bg-gray-900');
    await expect(sidebar).toBeVisible();
    
    // Check that sidebar has slid into view (not off-screen)
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.x).toBeGreaterThanOrEqual(0);
    
    // Verify key navigation items are visible in sidebar
    await expect(sidebar.locator('text=Dashboard')).toBeVisible();
    await expect(sidebar.locator('text=Projects')).toBeVisible();
    await expect(sidebar.locator('text=Requests')).toBeVisible();
    
    // Verify backdrop overlay appeared
    const backdrop = page.locator('div.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(backdrop).toBeVisible();
    
    // Test close functionality - click X button to close
    const closeButton = sidebar.locator('button[aria-label="Close menu"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await page.waitForTimeout(1000);
    
    // Verify menu closed - sidebar should be off-screen
    const closedSidebarBox = await sidebar.boundingBox();
    expect(closedSidebarBox?.x).toBeLessThan(0);
  });
});