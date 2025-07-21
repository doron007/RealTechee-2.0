/**
 * Responsive Testing Only - Separate from Business Logic
 * 
 * Tests responsive design after functionality is solid
 * Only runs after business flows are 100% successful
 */

const { test, expect } = require('@playwright/test');

test.describe('Responsive Design Testing - Post Functionality Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Simple setup - navigate to admin (already authenticated)
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText(['Dashboard', 'Admin']);
  });

  test('Mobile Responsive - Admin Dashboard', async ({ page }) => {
    console.log('📱 Testing mobile responsive design...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile navigation works
    await expect(page.locator('nav, aside')).toBeVisible();
    
    // Test key elements are accessible on mobile
    await expect(page.locator('button, a')).toHaveCount.greaterThan(3);
    
    console.log('✅ Mobile responsive verified');
  });

  test('Tablet Responsive - Admin Dashboard', async ({ page }) => {
    console.log('📱 Testing tablet responsive design...');
    
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Verify tablet layout
    await expect(page.locator('nav, aside')).toBeVisible();
    
    console.log('✅ Tablet responsive verified');
  });

  test('Desktop Large Screen - Admin Dashboard', async ({ page }) => {
    console.log('🖥️ Testing large desktop responsive design...');
    
    // Set large desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Verify large screen layout
    await expect(page.locator('nav, aside')).toBeVisible();
    
    console.log('✅ Large desktop responsive verified');
  });
});