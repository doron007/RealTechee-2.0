/**
 * Authentication Setup for Playwright Tests
 * 
 * Handles user authentication and saves state for reuse across all tests.
 * This follows enterprise patterns used by Vercel, GitHub, Shopify, etc.
 */

const { test: setup, expect } = require('@playwright/test');

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to load
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  
  // Fill in credentials
  await page.fill('input[type="email"]', 'info@realtechee.com');
  await page.fill('input[type="password"]', 'Sababa123!');
  
  // Submit login form
  await page.click('button[type="submit"]:not(.amplify-tabs__item)');
  
  // Wait for successful authentication (redirect away from login)
  await page.waitForURL(url => !url.pathname.includes('/login'), {
    timeout: 15000
  });
  
  // Verify we're authenticated by checking for admin access
  await page.goto('/admin');
  await expect(page.locator('h1')).toBeVisible();
  
  // Save authentication state for reuse
  await page.context().storageState({ path: authFile });
  
  console.log('✅ Authentication setup complete - state saved to', authFile);
});