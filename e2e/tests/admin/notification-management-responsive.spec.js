/**
 * Notification Management System - Responsive Design Tests
 * 
 * Tests responsive behavior across different viewport sizes
 * Separated from main workflow for focused responsive testing
 * 
 * Expected dev tables: NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE
 */

const { test, expect } = require('@playwright/test');

// Test credentials
const TEST_CREDENTIALS = {
  email: 'info@realtechee.com',
  password: 'Sababa123!'
};

// Page selectors
const SELECTORS = {
  notificationSystem: 'h2:has-text("Notification System")',
  notificationTab: 'button:has-text("Notification Management")',
  queueTab: 'button:has-text("Queue Management")',
  templatesTab: 'button:has-text("Template Management")',
  historyTab: 'button:has-text("History & Analytics")',
  monitoringTab: 'button:has-text("AWS Monitoring")',
  searchInput: 'input[placeholder*="Search notifications"]',
  notificationTable: 'table'
};

test.describe('Notification Management - Responsive Design', () => {
  // Handle authentication for responsive tests
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin-legacy?tab=notifications');
    await page.waitForTimeout(2000);
    
    // Handle auth if needed
    if (page.url().includes('/login') || page.url().includes('/auth')) {
      await page.fill('input[type="email"], input[name="email"], [data-testid="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"], input[name="password"], [data-testid="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"], button:has-text("Sign in"), [data-testid="sign-in-button"]');
      await page.waitForURL('**/admin-legacy?tab=notifications', { timeout: 10000 });
    }
    
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile Viewport (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display notification system on mobile', async ({ page }) => {
      console.log('📱 Testing mobile viewport (375x667)...');
      
      // Verify main interface is visible
      await expect(page.locator(SELECTORS.notificationSystem)).toBeVisible();
      
      // Check that tabs are accessible (may be in mobile menu)
      await expect(page.locator(SELECTORS.queueTab)).toBeVisible();
      await expect(page.locator(SELECTORS.templatesTab)).toBeVisible();
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/notification-management-mobile.png',
        fullPage: true 
      });
      
      console.log('✅ Mobile layout verified');
    });

    test('should allow tab navigation on mobile', async ({ page }) => {
      // Test tab switching on mobile
      await page.click(SELECTORS.templatesTab);
      await expect(page.locator('h3:has-text("Notification Templates")')).toBeVisible();
      
      await page.click(SELECTORS.queueTab);
      await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
      
      console.log('✅ Mobile tab navigation working');
    });
  });

  test.describe('Tablet Viewport (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display notification system on tablet', async ({ page }) => {
      console.log('📱 Testing tablet viewport (768x1024)...');
      
      // Verify main interface is visible
      await expect(page.locator(SELECTORS.notificationSystem)).toBeVisible();
      
      // Check all tabs are visible
      const tabs = [SELECTORS.queueTab, SELECTORS.templatesTab, SELECTORS.historyTab, SELECTORS.monitoringTab];
      for (const tab of tabs) {
        await expect(page.locator(tab)).toBeVisible();
      }
      
      // Take tablet screenshot
      await page.screenshot({ 
        path: 'test-results/notification-management-tablet.png',
        fullPage: true 
      });
      
      console.log('✅ Tablet layout verified');
    });

    test('should display table data properly on tablet', async ({ page }) => {
      // Switch to queue tab to test table display
      await page.click(SELECTORS.queueTab);
      
      // Verify table is visible and properly sized
      await expect(page.locator(SELECTORS.notificationTable)).toBeVisible();
      
      // Check that search input is accessible
      await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
      
      console.log('✅ Tablet table display working');
    });
  });

  test.describe('Desktop Viewport (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display full notification system on large desktop', async ({ page }) => {
      console.log('🖥️ Testing large desktop viewport (1920x1080)...');
      
      // Verify main interface is visible
      await expect(page.locator(SELECTORS.notificationSystem)).toBeVisible();
      
      // All tabs should be visible
      const tabs = [SELECTORS.queueTab, SELECTORS.templatesTab, SELECTORS.historyTab, SELECTORS.monitoringTab];
      for (const tab of tabs) {
        await expect(page.locator(tab)).toBeVisible();
      }
      
      // Take desktop screenshot
      await page.screenshot({ 
        path: 'test-results/notification-management-desktop.png',
        fullPage: true 
      });
      
      console.log('✅ Large desktop layout verified');
    });

    test('should show all interface elements on large screen', async ({ page }) => {
      // Switch to queue tab
      await page.click(SELECTORS.queueTab);
      
      // All filter controls should be visible
      await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
      await expect(page.locator('select:has(option:has-text("All Statuses"))')).toBeVisible();
      await expect(page.locator('select:has(option:has-text("All Channels"))')).toBeVisible();
      
      // Table should be fully visible
      await expect(page.locator(SELECTORS.notificationTable)).toBeVisible();
      
      console.log('✅ Large desktop interface elements verified');
    });
  });

  test.describe('Cross-Viewport Functionality', () => {
    test('should maintain functionality across viewports', async ({ page }) => {
      console.log('🔄 Testing cross-viewport functionality...');
      
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.click(SELECTORS.templatesTab);
      await expect(page.locator('h3:has-text("Notification Templates")')).toBeVisible();
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.click(SELECTORS.queueTab);
      await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
      
      // Test desktop
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.click(SELECTORS.historyTab);
      await expect(page.locator('text=Analytics dashboard coming soon')).toBeVisible();
      
      console.log('✅ Cross-viewport functionality verified');
    });
  });

  test.describe('Layout Breakpoints', () => {
    test('should handle common breakpoints gracefully', async ({ page }) => {
      const breakpoints = [
        { width: 320, height: 568, name: 'Small Mobile' },
        { width: 414, height: 896, name: 'Large Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1024, height: 768, name: 'Tablet Landscape' },
        { width: 1366, height: 768, name: 'Small Desktop' },
        { width: 1920, height: 1080, name: 'Large Desktop' }
      ];

      for (const breakpoint of breakpoints) {
        console.log(`📏 Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})...`);
        
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.waitForTimeout(500);
        
        // Verify main interface remains accessible
        await expect(page.locator(SELECTORS.notificationSystem)).toBeVisible();
        
        // Take screenshot for each breakpoint
        await page.screenshot({ 
          path: `test-results/notification-management-${breakpoint.name.toLowerCase().replace(' ', '-')}.png`
        });
      }
      
      console.log('✅ All breakpoints tested successfully');
    });
  });
});