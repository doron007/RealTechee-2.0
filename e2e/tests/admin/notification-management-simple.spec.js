/**
 * Notification Management System - Focused Test
 * 
 * Key validation tests for notification management interface
 * Expected dev tables: NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE
 */

const { test, expect } = require('@playwright/test');

// Configure for single window workflow - must be at top level
test.use({ 
  headless: false,  // Keep browser visible for manual validation
  viewport: { width: 1400, height: 1400 }  // Proper viewport height
});

// Test credentials
const TEST_CREDENTIALS = {
  email: 'info@realtechee.com',
  password: 'Sababa123!'
};

test.describe('Notification Management', () => {

  test('should load notification management page and test functionality', async ({ page }) => {
    console.log('🎯 Testing notification management system...');
    
    // Navigate to notification management (auth handled inline)
    await page.goto('/admin-legacy?tab=notifications');
    await page.waitForTimeout(2000);
    
    // Handle authentication in same window if needed
    if (page.url().includes('/login') || page.url().includes('/auth')) {
      console.log('🔑 Login required - performing authentication in same window...');
      
      await page.fill('input[type="email"], input[name="email"], [data-testid="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"], input[name="password"], [data-testid="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"], button:has-text("Sign in"), [data-testid="sign-in-button"]');
      await page.waitForURL('**/admin-legacy?tab=notifications', { timeout: 10000 });
      
      console.log('✅ Authentication successful - staying in same window');
    } else {
      console.log('✅ Already authenticated');
    }
    
    await page.waitForLoadState('networkidle');
    
    // Verify main interface loads
    await expect(page.locator('h2:has-text("Notification System")')).toBeVisible();
    console.log('✅ Page loaded successfully');
    
    // Test tab navigation
    await page.click('button:has-text("Template Management")');
    await expect(page.locator('h3:has-text("Notification Templates")')).toBeVisible();
    console.log('✅ Template tab working');
    
    // Test create template button
    await page.click('button:has-text("Create Test Template")');
    await page.waitForTimeout(2000);
    console.log('✅ Create template button clicked');
    
    // Switch to queue tab
    await page.click('button:has-text("Queue Management")');
    await expect(page.locator('input[placeholder*="Search notifications"]')).toBeVisible();
    console.log('✅ Queue tab working');
    
    // Test send notification button
    await page.click('button:has-text("Send Test")');
    await page.waitForTimeout(2000);
    console.log('✅ Send test button clicked');
    
    // Test other tabs
    await page.click('button:has-text("History & Analytics")');
    await expect(page.locator('text=Analytics dashboard coming soon')).toBeVisible();
    
    await page.click('button:has-text("AWS Monitoring")');
    await expect(page.locator('text=AWS monitoring dashboard coming soon')).toBeVisible();
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/notification-management-complete.png',
      fullPage: true 
    });
    
    console.log('🎉 Notification management test completed successfully');
    console.log('🔍 Browser window will remain open for manual validation');
    console.log('📋 Manual validation: Check NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE in AWS');
    console.log('💡 Window stays open - you can continue testing manually or take screenshots');
  });
});