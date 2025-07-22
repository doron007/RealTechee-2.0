/**
 * Admin Authentication Utility
 * Handles authentication for admin tests with proper session management
 */

const { expect } = require('@playwright/test');

class AdminAuthenticator {
  constructor() {
    this.isAuthenticated = false;
    this.authTimeout = 20000; // 20 seconds timeout
  }

  /**
   * Authenticate as admin user
   */
  async authenticate(page) {
    try {
      // Navigate to home page
      await page.goto('/');
      await page.waitForTimeout(2000); // Allow initial page load
      
      // Click sign in link
      const signInSelectors = [
        'a:has-text("Sign In")',
        'button:has-text("Sign In")',
        '[data-testid="sign-in"]',
        '.sign-in-link'
      ];
      
      let signInClicked = false;
      for (const selector of signInSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
          signInClicked = true;
          break;
        }
      }
      
      if (!signInClicked) {
        // Try direct navigation to sign in page
        await page.goto('/auth/signin');
      }
      
      // Wait for sign in form
      await page.waitForSelector('input[name="username"], input[type="email"]', { timeout: 10000 });
      
      // Fill credentials
      const usernameSelectors = [
        'input[name="username"]',
        'input[type="email"]',
        '[data-testid="username"]'
      ];
      
      for (const selector of usernameSelectors) {
        const field = page.locator(selector);
        if (await field.isVisible({ timeout: 2000 })) {
          await field.fill('info@realtechee.com');
          break;
        }
      }
      
      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        '[data-testid="password"]'
      ];
      
      for (const selector of passwordSelectors) {
        const field = page.locator(selector);
        if (await field.isVisible({ timeout: 2000 })) {
          await field.fill('Sababa123!');
          break;
        }
      }
      
      // Submit form
      const submitSelectors = [
        'button:has-text("Sign In")',
        'button[type="submit"]',
        '[data-testid="submit"]',
        'input[type="submit"]'
      ];
      
      for (const selector of submitSelectors) {
        const button = page.locator(selector);
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          break;
        }
      }
      
      // Wait for successful authentication
      const authSuccessSelectors = [
        '[data-testid="admin-dashboard"]',
        '.admin-dashboard',
        'h1:has-text("Dashboard")',
        'main:has-text("Dashboard")',
        '.dashboard-container'
      ];
      
      await page.waitForSelector(authSuccessSelectors.join(', '), { timeout: this.authTimeout });
      
      // Ensure page is fully loaded
      await page.waitForTimeout(3000);
      
      // Verify authentication
      const authIndicators = [
        'text=Dashboard',
        'text=Admin',
        '[data-testid="user-menu"]',
        '.user-menu',
        '.admin-nav'
      ];
      
      let isVerified = false;
      for (const indicator of authIndicators) {
        if (await page.locator(indicator).isVisible({ timeout: 2000 })) {
          isVerified = true;
          break;
        }
      }
      
      if (!isVerified) {
        throw new Error('Authentication verification failed');
      }
      
      this.isAuthenticated = true;
      console.log('✅ Admin authentication successful');
      return true;
      
    } catch (error) {
      console.error('❌ Admin authentication failed:', error.message);
      this.isAuthenticated = false;
      throw error;
    }
  }

  /**
   * Check if currently authenticated
   */
  async isAuthenticatedCheck(page) {
    try {
      const authIndicators = [
        '[data-testid="admin-dashboard"]',
        '.admin-dashboard',
        'h1:has-text("Dashboard")',
        '[data-testid="user-menu"]'
      ];
      
      for (const indicator of authIndicators) {
        if (await page.locator(indicator).isVisible({ timeout: 2000 })) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensure authenticated (authenticate if not already)
   */
  async ensureAuthenticated(page) {
    if (!this.isAuthenticated || !(await this.isAuthenticatedCheck(page))) {
      await this.authenticate(page);
    }
    return true;
  }

  /**
   * Logout
   */
  async logout(page) {
    try {
      const logoutSelectors = [
        'button:has-text("Logout")',
        'a:has-text("Logout")',
        '[data-testid="logout"]',
        '.logout-button'
      ];
      
      for (const selector of logoutSelectors) {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          break;
        }
      }
      
      // Wait for logout to complete
      await page.waitForSelector('a:has-text("Sign In"), button:has-text("Sign In")', { timeout: 10000 });
      
      this.isAuthenticated = false;
      console.log('✅ Logout successful');
      return true;
      
    } catch (error) {
      console.error('❌ Logout failed:', error.message);
      return false;
    }
  }

  /**
   * Navigate to admin section
   */
  async navigateToAdmin(page, section = '') {
    await this.ensureAuthenticated(page);
    
    const targetUrl = `/admin${section ? '/' + section : ''}`;
    await page.goto(targetUrl);
    
    // Wait for page to load
    const pageSelectors = [
      'h1',
      'h2',
      '[data-testid]',
      'main',
      '.content'
    ];
    
    await page.waitForSelector(pageSelectors.join(', '), { timeout: 10000 });
    await page.waitForTimeout(1000); // Additional stability
    
    return true;
  }

  /**
   * Reset authentication state
   */
  reset() {
    this.isAuthenticated = false;
  }
}

module.exports = { AdminAuthenticator };