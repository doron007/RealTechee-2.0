/**
 * Authentication Setup for Playwright Tests
 * 
 * Handles user authentication and saves state for reuse across all tests.
 * This follows enterprise patterns used by Vercel, GitHub, Shopify, etc.
 */

const { test: setup, expect } = require('@playwright/test');

const authFile = 'e2e/playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const isCI = process.env.CI === 'true';
  const maxRetries = isCI ? 3 : 1;
  const baseTimeout = isCI ? 30000 : 15000;
  
  console.log(`🔐 Starting authentication setup (CI: ${isCI})`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Authentication attempt ${attempt}/${maxRetries}`);
      
      // Navigate to login page with extended timeout for CI
      await page.goto('/login', { timeout: baseTimeout });
      
      // Wait for login form to load with better error handling
      await page.waitForSelector('input[type="email"]', { timeout: baseTimeout });
      await page.waitForSelector('input[type="password"]', { timeout: baseTimeout });
      
      // Verify form elements are visible
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
      
      // Clear fields first (in case of previous attempt)
      await page.fill('input[type="email"]', '');
      await page.fill('input[type="password"]', '');
      
      // Fill in credentials
      await page.fill('input[type="email"]', 'info@realtechee.com');
      await page.fill('input[type="password"]', 'Sababa123!');
      
      // Wait a bit for form validation
      await page.waitForTimeout(isCI ? 2000 : 1000);
      
      // Submit login form
      await page.click('button[type="submit"]:not(.amplify-tabs__item)');
      
      // Wait for successful authentication (redirect away from login)
      await page.waitForURL(url => !url.pathname.includes('/login'), {
        timeout: baseTimeout
      });
      
      console.log('🎯 Login successful, verifying admin access...');
      
      // Verify we're authenticated by checking for admin access
      await page.goto('/admin', { timeout: baseTimeout });
      await page.waitForSelector('h1, h2, [data-testid="admin-dashboard"], .admin-header', { 
        timeout: baseTimeout 
      });
      
      // Ensure the auth directory exists
      const fs = require('fs');
      const path = require('path');
      const authDir = path.dirname(authFile);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
        console.log(`📁 Created auth directory: ${authDir}`);
      }
      
      // Save authentication state for reuse
      await page.context().storageState({ path: authFile });
      
      console.log('✅ Authentication setup complete - state saved to', authFile);
      return; // Success, exit retry loop
      
    } catch (error) {
      console.error(`❌ Authentication attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('🚨 All authentication attempts failed');
        throw error;
      }
      
      // Wait before retry
      console.log(`⏳ Waiting ${attempt * 2}s before retry...`);
      await page.waitForTimeout(attempt * 2000);
      
      // Try to reset page state
      try {
        await page.goto('/login', { timeout: 10000 });
      } catch (navError) {
        console.warn('⚠️ Could not navigate to login for retry:', navError.message);
      }
    }
  }
});