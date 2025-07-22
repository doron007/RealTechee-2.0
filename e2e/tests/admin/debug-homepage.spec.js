/**
 * Debug Homepage
 * Check what elements are actually available on the homepage
 */

const { test, expect } = require('@playwright/test');

test.describe('Debug Homepage', () => {
  test('Check homepage elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-homepage.png' });
    
    // Log all links
    const links = await page.locator('a').all();
    console.log('Found links:');
    for (const link of links) {
      try {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        console.log(`- "${text}" -> ${href}`);
      } catch (e) {
        console.log('- (error reading link)');
      }
    }
    
    // Log all buttons
    const buttons = await page.locator('button').all();
    console.log('Found buttons:');
    for (const button of buttons) {
      try {
        const text = await button.textContent();
        console.log(`- "${text}"`);
      } catch (e) {
        console.log('- (error reading button)');
      }
    }
    
    // Check for authentication-related elements
    const authElements = [
      'text=Sign In',
      'text=Login', 
      'text=Log In',
      'text=Sign Up',
      'text=Auth',
      '[href*="auth"]',
      '[href*="login"]',
      '[href*="signin"]'
    ];
    
    console.log('Checking auth elements:');
    for (const selector of authElements) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`- ${selector}: ${isVisible ? 'FOUND' : 'NOT FOUND'}`);
    }
  });
  
  test('Try direct auth navigation', async ({ page }) => {
    const authUrls = [
      '/auth',
      '/auth/signin',
      '/auth/login',
      '/login',
      '/signin',
      '/sign-in'
    ];
    
    for (const url of authUrls) {
      try {
        await page.goto(url);
        await page.waitForTimeout(2000);
        
        const hasAuthForm = await page.locator('input[type="email"], input[name="username"], input[name="email"]').isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`${url}: ${hasAuthForm ? 'HAS AUTH FORM' : 'NO AUTH FORM'}`);
        
        if (hasAuthForm) {
          console.log(`✅ Found auth form at: ${url}`);
          break;
        }
      } catch (e) {
        console.log(`${url}: ERROR - ${e.message}`);
      }
    }
  });
});