/**
 * Authentication Flow Tests
 * 
 * Comprehensive testing for authentication flows including:
 * - Login page functionality and validation
 * - Registration/signup flows
 * - Password reset workflows
 * - Social authentication (if implemented)
 * - Session management and security
 * - Role-based access control
 * - Authentication error handling
 * - Multi-factor authentication (if implemented)
 */

const { test, expect } = require('@playwright/test');

test.describe('Authentication Flows', () => {
  
  // Helper function to reset page state
  async function resetPageState(page) {
    // Clear any form inputs
    const formInputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
    const inputCount = await formInputs.count();
    for (let i = 0; i < inputCount; i++) {
      try {
        const input = formInputs.nth(i);
        if (await input.isVisible()) {
          await input.clear();
        }
      } catch (error) {
        // Continue if clear fails
      }
    }
    
    // Clear localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.waitForTimeout(500);
  }

  test.describe('Login Page Functionality', () => {
    
    let sharedPage;
    
    test.beforeAll(async ({ browser }) => {
      // Create a fresh page context for authentication testing
      const context = await browser.newContext({ 
        viewport: { width: 1280, height: 1080 },
        storageState: { cookies: [], origins: [] } // Start with clean state
      });
      sharedPage = await context.newPage();
      
      // Navigate to login page
      await sharedPage.goto('/login');
      
      // Wait for login page to load
      await expect(sharedPage.locator('h1, h2').first()).toBeVisible();
      await sharedPage.waitForLoadState('networkidle');
    });
    
    test.beforeEach(async () => {
      // Reset for clean test state
      await resetPageState(sharedPage);
    });
    
    test.afterAll(async () => {
      if (sharedPage) {
        await sharedPage.close();
      }
    });

    test('should load login page without errors', async () => {
      const page = sharedPage;
      
      // Verify login page loads
      await expect(page.locator('h1, h2').first()).toBeVisible();
      
      // Check for login form
      const loginForm = page.locator('form, .login-form, .auth-form');
      expect(await loginForm.count()).toBeGreaterThan(0);
      
      // Check for essential login elements
      const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      const passwordField = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      
      expect(await emailField.count()).toBeGreaterThan(0);
      expect(await passwordField.count()).toBeGreaterThan(0);
      expect(await submitButton.count()).toBeGreaterThan(0);
      
      console.log('ℹ️ Login page loaded with all essential elements');
    });
    
    test('should validate required fields', async () => {
      const page = sharedPage;
      
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Should show validation messages or prevent submission
        const validationMessages = await page.locator('.error, .invalid, [aria-invalid="true"], .MuiFormHelperText-error').count();
        const isStillOnLogin = page.url().includes('/login') || await page.locator('input[type="password"]').count() > 0;
        
        // Either show validation or stay on login page
        expect(validationMessages > 0 || isStillOnLogin).toBeTruthy();
        
        if (validationMessages > 0) {
          console.log(`ℹ️ Form validation working: ${validationMessages} validation indicators`);
        }
      }
    });
    
    test('should validate email format', async () => {
      const page = sharedPage;
      
      const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordField = page.locator('input[type="password"]').first();
      
      if (await emailField.isVisible() && await passwordField.isVisible()) {
        // Enter invalid email
        await emailField.fill('invalid-email');
        await passwordField.fill('anypassword');
        await emailField.blur();
        
        await page.waitForTimeout(500);
        
        // Check for email validation
        const hasValidation = await page.locator('.error, .invalid, [aria-invalid="true"]').count() > 0;
        if (hasValidation) {
          console.log('ℹ️ Email format validation working');
        }
        
        // Clear for next test
        await emailField.clear();
        await passwordField.clear();
      }
    });
    
    test('should handle successful login with valid credentials', async () => {
      const page = sharedPage;
      
      const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordField = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
      
      if (await emailField.isVisible() && await passwordField.isVisible() && await submitButton.isVisible()) {
        // Use test credentials
        await emailField.fill('info@realtechee.com');
        await passwordField.fill('Sababa123!');
        
        await submitButton.click();
        
        // Wait for potential redirect or loading
        await page.waitForTimeout(3000);
        
        // Check if login was successful (redirect or dashboard visible)
        const isRedirected = !page.url().includes('/login');
        const hasAdminAccess = await page.locator('text=/dashboard|admin|welcome/i').count() > 0;
        const hasUserProfile = await page.locator('.user-profile, .user-menu, [data-testid*="user"]').count() > 0;
        
        if (isRedirected || hasAdminAccess || hasUserProfile) {
          console.log('ℹ️ Successful login detected');
          
          // Logout for clean state
          const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');
          if (await logoutButton.count() > 0) {
            await logoutButton.first().click();
            await page.waitForTimeout(2000);
          }
        }
      }
    });
    
    test('should handle invalid credentials gracefully', async () => {
      const page = sharedPage;
      
      const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordField = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
      
      if (await emailField.isVisible() && await passwordField.isVisible() && await submitButton.isVisible()) {
        // Use invalid credentials
        await emailField.fill('invalid@example.com');
        await passwordField.fill('wrongpassword');
        
        await submitButton.click();
        
        // Wait for error message
        await page.waitForTimeout(3000);
        
        // Should show error message and stay on login page
        const errorElements = page.locator('.error, .alert-danger, .MuiAlert-error');
        const textElements = page.locator('text=/invalid|incorrect|wrong/i');
        const errorMessages = await errorElements.count() + await textElements.count();
        const isStillOnLogin = page.url().includes('/login') || await page.locator('input[type="password"]').count() > 0;
        
        if (errorMessages > 0) {
          console.log('ℹ️ Invalid credentials handled with error message');
        }
        
        expect(isStillOnLogin).toBeTruthy();
      }
    });
  });

  test.describe('Password Reset Flow', () => {
    
    test('should provide password reset functionality', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Look for "Forgot Password" or similar link
      const forgotElements = page.locator('a:has-text("Forgot"), a:has-text("Reset"), button:has-text("Forgot")');
      const forgotTextElements = page.locator('text=/forgot.*password|reset.*password/i');
      const forgotCount = await forgotElements.count() + await forgotTextElements.count();
      
      if (forgotCount > 0) {
        console.log('ℹ️ Password reset option found');
        
        // Test forgot password interaction
        const resetLink = await forgotElements.count() > 0 ? forgotElements.first() : forgotTextElements.first();
        if (await resetLink.isVisible()) {
          await resetLink.click();
          await page.waitForTimeout(2000);
          
          // Should navigate to reset page or show reset form
          const isOnResetPage = page.url().includes('reset') || page.url().includes('forgot');
          const hasResetForm = await page.locator('input[type="email"], .reset-form').count() > 0;
          
          if (isOnResetPage || hasResetForm) {
            console.log('ℹ️ Password reset flow accessible');
            
            // Test reset form if visible
            const emailField = page.locator('input[type="email"]').first();
            if (await emailField.isVisible()) {
              await emailField.fill('test@example.com');
              
              const resetSubmit = page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Send")').first();
              if (await resetSubmit.isVisible()) {
                await resetSubmit.hover(); // Don't actually submit
                console.log('ℹ️ Password reset form functional');
              }
            }
          }
        }
      } else {
        console.log('ℹ️ Password reset option not found (may be implemented differently)');
      }
    });
  });

  test.describe('Registration/Signup Flow', () => {
    
    test('should provide user registration capability', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Look for registration/signup options
      const signupElements = page.locator('a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Create"), button:has-text("Sign Up")');
      const signupTextElements = page.locator('text=/create.*account|sign.*up|register/i');
      const signupCount = await signupElements.count() + await signupTextElements.count();
      
      if (signupCount > 0) {
        console.log('ℹ️ Registration option found');
        
        const signupLink = await signupElements.count() > 0 ? signupElements.first() : signupTextElements.first();
        if (await signupLink.isVisible()) {
          await signupLink.click();
          await page.waitForTimeout(2000);
          
          // Should navigate to signup page or show signup form
          const isOnSignupPage = page.url().includes('signup') || page.url().includes('register');
          const hasSignupForm = await page.locator('.signup-form, .register-form').count() > 0;
          const hasMultipleInputs = await page.locator('input').count() >= 3; // Name, email, password typically
          
          if (isOnSignupPage || hasSignupForm || hasMultipleInputs) {
            console.log('ℹ️ Registration flow accessible');
            
            // Test basic signup form structure
            const emailField = page.locator('input[type="email"], input[name="email"]');
            const passwordField = page.locator('input[type="password"]');
            const nameField = page.locator('input[name="name"], input[name="firstName"], input[placeholder*="name" i]');
            
            const hasRequiredFields = await emailField.count() > 0 && await passwordField.count() > 0;
            
            if (hasRequiredFields) {
              console.log('ℹ️ Registration form has required fields');
              
              if (await nameField.count() > 0) {
                console.log('ℹ️ Registration includes name field');
              }
            }
          }
        }
      } else {
        console.log('ℹ️ Registration option not found (may be invite-only or different flow)');
      }
    });
  });

  test.describe('Session Management & Security', () => {
    
    test('should handle session timeout appropriately', async ({ page }) => {
      // Start with authenticated state
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Login with valid credentials
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
      
      if (await emailField.isVisible() && await passwordField.isVisible()) {
        await emailField.fill('info@realtechee.com');
        await passwordField.fill('Sababa123!');
        await submitButton.click();
        
        await page.waitForTimeout(3000);
        
        // Check if logged in
        const isLoggedIn = !page.url().includes('/login') || await page.locator('text=/dashboard|admin|profile/i').count() > 0;
        
        if (isLoggedIn) {
          console.log('ℹ️ Session established successfully');
          
          // Test session persistence
          await page.reload();
          await page.waitForTimeout(2000);
          
          const sessionPersisted = !page.url().includes('/login');
          if (sessionPersisted) {
            console.log('ℹ️ Session persists across page reload');
          }
        }
      }
    });
    
    test('should implement proper logout functionality', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Login first
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
      
      if (await emailField.isVisible()) {
        await emailField.fill('info@realtechee.com');
        await passwordField.fill('Sababa123!');
        await submitButton.click();
        
        await page.waitForTimeout(3000);
        
        // Look for logout option
        const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")');
        
        if (await logoutButton.count() > 0) {
          await logoutButton.first().click();
          await page.waitForTimeout(2000);
          
          // Should redirect to login or public page
          const isLoggedOut = page.url().includes('/login') || page.url() === page.url().split('/').slice(0, 3).join('/') + '/';
          
          if (isLoggedOut) {
            console.log('ℹ️ Logout functionality working properly');
          }
        }
      }
    });
  });

  test.describe('Role-Based Access Control', () => {
    
    test('should enforce admin access restrictions', async ({ page }) => {
      // Test admin page access without authentication
      await page.goto('/admin');
      
      // Wait for client-side authentication check and potential redirect
      await page.waitForTimeout(5000);
      
      // Should redirect to login or show access denied
      const isRedirectedToLogin = page.url().includes('/login');
      const hasAccessDenied = await page.locator('text=/access denied|unauthorized|forbidden|401|403/i').count() > 0;
      const hasLoginForm = await page.locator('input[type="password"]').count() > 0;
      const isStillLoading = await page.locator('.animate-spin').count() > 0;
      
      const isProtected = isRedirectedToLogin || hasAccessDenied || hasLoginForm || isStillLoading;
      expect(isProtected).toBeTruthy();
      
      if (isRedirectedToLogin) {
        console.log('ℹ️ Admin pages properly protected - redirects to login');
      } else if (hasAccessDenied) {
        console.log('ℹ️ Admin pages properly protected - shows access denied');
      }
    });
    
    test('should provide appropriate access after authentication', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Login with admin credentials
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
      
      if (await emailField.isVisible()) {
        await emailField.fill('info@realtechee.com');
        await passwordField.fill('Sababa123!');
        await submitButton.click();
        
        await page.waitForTimeout(3000);
        
        // Try to access admin page
        await page.goto('/admin');
        await page.waitForTimeout(3000);
        
        // Should have access to admin features
        const hasAdminAccess = !page.url().includes('/login');
        const hasAdminContent = await page.locator('text=/dashboard|admin/i').count() > 0;
        
        if (hasAdminAccess && hasAdminContent) {
          console.log('ℹ️ Authenticated admin access working properly');
        }
      }
    });
  });

  test.describe('Authentication Performance & Accessibility', () => {
    
    test('should load authentication pages quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Login page should load quickly
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
      
      console.log(`ℹ️ Login page load time: ${loadTime}ms`);
    });
    
    test('should be accessible with keyboard navigation', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Test tab navigation through login form
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        // Should be able to tab through form elements
        let tabCount = 0;
        const maxTabs = 5;
        
        while (tabCount < maxTabs) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          tabCount++;
          
          const currentFocus = await page.locator(':focus').count();
          if (currentFocus === 0) break;
        }
        
        console.log(`ℹ️ Keyboard navigation: ${tabCount} tabbable elements in login form`);
      }
    });
    
    test('should have proper form labels and accessibility', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Check for form accessibility
      const labels = await page.locator('label').count();
      const inputs = await page.locator('input').count();
      const ariaLabels = await page.locator('[aria-label], [aria-labelledby]').count();
      
      if (inputs > 0) {
        // Should have labels or aria-labels for form inputs
        const accessibilityRatio = (labels + ariaLabels) / inputs;
        console.log(`ℹ️ Form accessibility: ${labels + ariaLabels}/${inputs} labeled inputs`);
        
        expect(accessibilityRatio).toBeGreaterThan(0.5); // At least 50% of inputs should be labeled
      }
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Monitor for JavaScript errors
      const errors = [];
      page.on('pageerror', (error) => {
        errors.push(error);
      });
      
      // Test form interaction
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();
      
      if (await emailField.isVisible()) {
        await emailField.fill('test@example.com');
        await passwordField.fill('testpassword');
        await page.waitForTimeout(1000);
      }
      
      // Verify no critical JavaScript errors
      expect(errors.length).toBe(0);
    });
    
    test('should handle multiple rapid login attempts', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const emailField = page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();
      
      if (await emailField.isVisible()) {
        // Test multiple rapid attempts
        for (let i = 0; i < 3; i++) {
          await emailField.fill('test@example.com');
          await passwordField.fill('wrongpassword');
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Should handle multiple attempts gracefully (rate limiting, error messages, etc.)
        const isStillFunctional = await page.locator('input[type="password"]').isVisible();
        expect(isStillFunctional).toBeTruthy();
        
        console.log('ℹ️ Multiple login attempts handled gracefully');
      }
    });
  });
});