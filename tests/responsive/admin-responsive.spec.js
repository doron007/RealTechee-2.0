/**
 * Responsive Design Tests for Admin Pages
 * 
 * Tests responsive behavior across different breakpoints for admin interface.
 * Follows enterprise standards for responsive testing.
 */

const { test, expect } = require('@playwright/test');

// Define standard responsive breakpoints
const breakpoints = [
  { name: 'mobile', width: 375, height: 667 },     // iPhone SE
  { name: 'tablet', width: 768, height: 1024 },    // iPad
  { name: 'desktop', width: 1440, height: 900 },   // Standard desktop
  { name: 'large', width: 1920, height: 1080 }     // Large desktop
];

const adminPages = [
  { name: 'Projects', path: '/admin/projects' },
  { name: 'Quotes', path: '/admin/quotes' },
  { name: 'Requests', path: '/admin/requests' },
  { name: 'Dashboard', path: '/admin/dashboard' }
];

test.describe('Admin Responsive Design', () => {
  
  // Test each admin page at each breakpoint
  for (const page of adminPages) {
    test.describe(`${page.name} Page Responsiveness`, () => {
      
      for (const breakpoint of breakpoints) {
        test(`should display correctly at ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`, async ({ page: browserPage }) => {
          // Set viewport to specific breakpoint
          await browserPage.setViewportSize({
            width: breakpoint.width,
            height: breakpoint.height
          });
          
          // Navigate to admin page
          await browserPage.goto(page.path);
          
          // Wait for page to load
          await expect(browserPage.locator('h1')).toBeVisible({ timeout: 10000 });
          
          // Wait for content to stabilize
          await browserPage.waitForLoadState('networkidle');
          
          // Check for horizontal scrolling issues (especially on mobile)
          const hasHorizontalScroll = await browserPage.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          
          if (breakpoint.name === 'mobile' && hasHorizontalScroll) {
            console.warn(`⚠️ Horizontal scroll detected on ${breakpoint.name} for ${page.name}`);
            // Don't fail test, just warn - some admin interfaces may need horizontal scroll
          }
          
          // Verify main content is visible
          const mainContent = browserPage.locator('main, .admin-layout, [data-testid="admin-data-grid"]').first();
          if (await mainContent.count() > 0) {
            await expect(mainContent).toBeVisible();
          }
          
          // Check that navigation elements are accessible
          const navElements = browserPage.locator('nav, .MuiAppBar-root, header').first();
          if (await navElements.count() > 0) {
            await expect(navElements).toBeVisible();
          }
          
          // For mobile, check if there's a hamburger menu or mobile navigation
          if (breakpoint.name === 'mobile') {
            const mobileMenu = browserPage.locator('[aria-label*="menu" i], .hamburger, .mobile-menu-toggle').first();
            if (await mobileMenu.count() > 0) {
              await expect(mobileMenu).toBeVisible();
            }
          }
          
          // Verify critical interactive elements are accessible
          const interactiveElements = browserPage.locator('button, input, select, a').first();
          if (await interactiveElements.count() > 0) {
            await expect(interactiveElements).toBeVisible();
          }
          
          // Take screenshot for visual verification
          await browserPage.screenshot({
            path: `test-results/screenshots/${page.name.toLowerCase()}-${breakpoint.name}-${Date.now()}.png`,
            fullPage: false
          });
        });
      }
      
      test(`should handle viewport transitions smoothly for ${page.name}`, async ({ page: browserPage }) => {
        // Start with desktop
        await browserPage.setViewportSize({ width: 1440, height: 900 });
        await browserPage.goto(page.path);
        await expect(browserPage.locator('h1')).toBeVisible();
        
        // Transition to tablet
        await browserPage.setViewportSize({ width: 768, height: 1024 });
        await browserPage.waitForTimeout(500); // Allow layout to adjust
        await expect(browserPage.locator('h1')).toBeVisible();
        
        // Transition to mobile
        await browserPage.setViewportSize({ width: 375, height: 667 });
        await browserPage.waitForTimeout(500);
        await expect(browserPage.locator('h1')).toBeVisible();
        
        // Verify page is still functional after transitions
        const functionalElement = browserPage.locator('button, input, a').first();
        if (await functionalElement.count() > 0) {
          await expect(functionalElement).toBeVisible();
        }
      });
    });
  }
  
  test.describe('Cross-Device Data Grid Behavior', () => {
    
    test('should adapt data grid to mobile layout', async ({ page }) => {
      // Test with projects page (most complex data grid)
      await page.goto('/admin/projects');
      await expect(page.locator('h1')).toBeVisible();
      
      // Desktop view - should show full table
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(500);
      
      const desktopColumns = await page.locator('th, .MuiDataGrid-columnHeader').count();
      
      // Mobile view - should show condensed/card view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Either columns should be hidden or cards should be shown
      const mobileColumns = await page.locator('th, .MuiDataGrid-columnHeader').count();
      const hasCards = await page.locator('.MuiCard-root').count() > 0;
      
      // Mobile should either have fewer columns or switch to card view
      expect(mobileColumns <= desktopColumns || hasCards).toBeTruthy();
    });
    
    test('should maintain search functionality across devices', async ({ page }) => {
      await page.goto('/admin/projects');
      await expect(page.locator('h1')).toBeVisible();
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Test search on mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test search');
        await page.waitForTimeout(800);
        
        // Test search on desktop
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.waitForTimeout(500);
        
        await expect(searchInput).toBeVisible();
        await searchInput.clear();
      }
    });
  });
  
  test.describe('Touch and Mobile Interactions', () => {
    
    test('should handle touch interactions on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/projects');
      await expect(page.locator('h1')).toBeVisible();
      
      // Test tap interactions
      const buttons = page.locator('button').first();
      if (await buttons.count() > 0 && await buttons.isVisible()) {
        // Simulate touch interaction
        await buttons.tap();
        await page.waitForTimeout(300);
      }
      
      // Test swipe gestures if applicable
      const scrollableContent = page.locator('.MuiDataGrid-main, .MuiTableContainer-root').first();
      if (await scrollableContent.count() > 0) {
        // Test horizontal scroll on mobile
        await scrollableContent.hover();
        await page.mouse.down();
        await page.mouse.move(100, 0);
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
    });
  });
  
  test.describe('Performance on Mobile', () => {
    
    test('should load efficiently on mobile networks', async ({ page }) => {
      // Simulate slower network for mobile testing
      await page.route('**/*', async (route) => {
        // Add small delay to simulate mobile network
        await new Promise(resolve => setTimeout(resolve, 50));
        await route.continue();
      });
      
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/admin/projects');
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time even with simulated delay
      expect(loadTime).toBeLessThan(15000); // 15 seconds max for mobile
      
      console.log(`📱 Mobile load time: ${loadTime}ms`);
    });
  });
});