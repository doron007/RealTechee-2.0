/**
 * Global Setup for Seamless Testing
 * 
 * Handles one-time authentication and browser preparation
 * Creates shared state for all subsequent tests
 */

const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Setting up seamless testing environment...');
  
  // Launch browser once for the entire test session - use maximum available screen
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--start-maximized',
      '--start-fullscreen',
      '--disable-web-security', // For seamless testing
      '--disable-features=VizDisplayCompositor' // Better performance on high-res displays
    ]
  });
  
  const context = await browser.newContext({
    viewport: null, // Use full screen - supports up to 3008x1692 external monitors
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🔑 Performing one-time authentication...');
    
    // Navigate to login
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000); // Allow page load
    
    // Check if already authenticated
    const signOutButton = page.locator('button:has-text("Sign Out")').first();
    const isAuthenticated = await signOutButton.isVisible({ timeout: 3000 });
    
    if (!isAuthenticated) {
      // Perform login - look for Login button/link
      const loginButton = page.locator('a[href="/login"], button:has-text("Login")').first();
      await loginButton.click();
      await page.fill('input[name="username"]', 'info@realtechee.com');
      await page.fill('input[name="password"]', 'Sababa123!');
      await page.getByRole('button', { name: 'Sign In' }).click();
      
      // Wait for successful login
      await page.waitForSelector('button:has-text("Sign Out")', { timeout: 15000 });
    }
    
    // Navigate to admin dashboard and ensure it's loaded
    await page.goto('http://localhost:3000/admin');
    await page.waitForSelector('h1:has-text("Dashboard"), [data-testid="admin-dashboard"], main', { timeout: 20000 });
    
    console.log('✅ Authentication successful - saving session state');
    
    // Save the authenticated state for all tests
    await page.context().storageState({ 
      path: 'e2e/playwright/.auth/seamless-user.json' 
    });
    
    console.log('🎯 Seamless testing environment ready!');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

module.exports = globalSetup;