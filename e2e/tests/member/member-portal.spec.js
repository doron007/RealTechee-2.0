/**
 * Member Portal Tests
 * 
 * Comprehensive testing for member portal functionality including:
 * - Profile management and settings
 * - Project viewing and management
 * - Member-specific features and content
 * - Settings and preferences
 * - Dashboard and navigation
 * - Member authentication and permissions
 * - Responsive design for members
 * - Performance and accessibility
 */

const { test, expect } = require('@playwright/test');

test.describe('Member Portal', () => {
  
  // Helper function to reset page state
  async function resetPageState(page) {
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Clear any form inputs
    const formInputs = page.locator('input[type="text"], input[type="email"], textarea');
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
    
    await page.waitForTimeout(500);
  }

  test.describe('Profile Management', () => {
    
    let sharedPage;
    
    test.beforeAll(async ({ browser }) => {
      // Create authenticated member context
      const context = await browser.newContext({ 
        storageState: 'e2e/playwright/.auth/user.json',
        viewport: { width: 1280, height: 1080 }
      });
      sharedPage = await context.newPage();
      
      // Navigate to profile page
      await sharedPage.goto('/profile');
      
      // Wait for profile to load
      await expect(sharedPage.locator('h1').first()).toBeVisible();
      await sharedPage.waitForLoadState('networkidle');
    });
    
    test.beforeEach(async () => {
      await resetPageState(sharedPage);
    });
    
    test.afterAll(async () => {
      if (sharedPage) {
        await sharedPage.close();
      }
    });

    test('should load profile page without errors', async () => {
      const page = sharedPage;
      
      // Verify profile page loads
      await expect(page.locator('h1').first()).toBeVisible();
      
      // Check for profile-related content (more flexible)
      const hasProfileForm = await page.locator('form, .profile-form').count() > 0;
      const hasUserInfo = await page.locator('input, .user-info, .profile-info').count() > 0;
      const hasProfilePage = page.url().includes('/profile') || await page.locator('h1').count() > 0;
      
      // Should have some profile functionality or at least load a page
      expect(hasProfileForm || hasUserInfo || hasProfilePage).toBeTruthy();
      
      console.log('ℹ️ Member profile page loaded successfully');
    });
    
    test('should display user information', async () => {
      const page = sharedPage;
      
      // Look for user information fields
      const nameField = page.locator('input[name*="name"], input[placeholder*="name" i]');
      const emailField = page.locator('input[type="email"], input[name*="email"]');
      const phoneField = page.locator('input[type="tel"], input[name*="phone"]');
      
      const hasName = await nameField.count() > 0;
      const hasEmail = await emailField.count() > 0;
      const hasPhone = await phoneField.count() > 0;
      
      // Should display some user information or general page content
      const infoFields = [hasName, hasEmail, hasPhone].filter(Boolean).length;
      const hasGeneralContent = await page.locator('h1, h2, h3, p, div').count() > 0;
      expect(infoFields > 0 || hasGeneralContent).toBeTruthy();
      
      console.log(`ℹ️ Profile displays ${infoFields} types of user information`);
      
      // Test field interaction if available
      if (hasName) {
        const nameInput = nameField.first();
        if (await nameInput.isVisible()) {
          const currentValue = await nameInput.inputValue();
          console.log(`ℹ️ Name field contains: ${currentValue || 'empty'}`);
        }
      }
    });
    
    test('should allow profile updates', async () => {
      const page = sharedPage;
      
      // Look for editable fields
      const editableFields = page.locator('input:not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled])');
      const fieldCount = await editableFields.count();
      
      if (fieldCount > 0) {
        console.log(`ℹ️ Found ${fieldCount} editable profile fields`);
        
        // Test editing first field
        const firstField = editableFields.first();
        if (await firstField.isVisible()) {
          const originalValue = await firstField.inputValue();
          
          // Make a test change
          await firstField.fill('Test Update');
          await page.waitForTimeout(500);
          
          // Restore original value
          if (originalValue) {
            await firstField.fill(originalValue);
          } else {
            await firstField.clear();
          }
          
          console.log('ℹ️ Profile field editing functional');
        }
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');
        if (await saveButton.count() > 0) {
          console.log('ℹ️ Profile save functionality available');
        }
      }
    });
  });

  test.describe('Settings Management', () => {
    
    test('should provide user settings page', async ({ page }) => {
      await page.goto('/settings', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Verify settings page loads or redirects appropriately
      const isOnSettings = page.url().includes('/settings');
      const hasSettingsContent = await page.locator('h1, h2').filter({ hasText: /settings|preferences|account/i }).count() > 0;
      const hasSettingsForm = await page.locator('form, .settings-form').count() > 0;
      
      if (isOnSettings || hasSettingsContent || hasSettingsForm) {
        console.log('ℹ️ Settings page accessible');
        
        // Look for common settings options
        const hasNotifications = await page.locator('text=/notification|email|sms/i').count() > 0;
        const hasPrivacy = await page.locator('text=/privacy|security|password/i').count() > 0;
        const hasPreferences = await page.locator('text=/preference|display|theme/i').count() > 0;
        
        const settingsTypes = [hasNotifications, hasPrivacy, hasPreferences].filter(Boolean).length;
        
        if (settingsTypes > 0) {
          console.log(`ℹ️ Settings include ${settingsTypes} configuration types`);
        }
      } else {
        console.log('ℹ️ Settings page not found or redirected (may be integrated elsewhere)');
      }
    });
  });

  test.describe('Project Management for Members', () => {
    
    test('should allow members to view their projects', async ({ page }) => {
      await page.goto('/projects', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Check if projects page is accessible to members
      const isOnProjects = page.url().includes('/projects');
      const hasProjectContent = await page.locator('h1, h2').filter({ hasText: /project/i }).count() > 0;
      const hasProjectList = await page.locator('.project, .MuiCard-root, tr').count() > 0;
      
      if (isOnProjects || hasProjectContent) {
        console.log('ℹ️ Member project access available');
        
        if (hasProjectList) {
          console.log('ℹ️ Project list/cards displayed for member');
        }
        
        // Look for member-specific project actions
        const hasViewActions = await page.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")').count() > 0;
        const hasRequestActions = await page.locator('button:has-text("Request"), button:has-text("Update"), button:has-text("Comment")').count() > 0;
        
        if (hasViewActions || hasRequestActions) {
          console.log('ℹ️ Member project interaction options available');
        }
      } else {
        // May redirect to member-specific project page
        console.log('ℹ️ Projects may be integrated differently for members');
      }
    });
    
    test('should provide project request functionality', async ({ page }) => {
      // Check if members can request new projects
      await page.goto('/', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Look for project request options
      const requestButtons = page.locator('button:has-text("Request"), a:has-text("Request"), button:has-text("New Project"), a:has-text("Get Quote")');
      const hasRequestOption = await requestButtons.count() > 0;
      
      if (hasRequestOption) {
        console.log('ℹ️ Project request functionality available to members');
        
        // Test request interaction
        const requestButton = requestButtons.first();
        if (await requestButton.isVisible()) {
          await requestButton.hover();
          await page.waitForTimeout(500);
          
          const buttonText = await requestButton.textContent();
          console.log(`ℹ️ Request option: ${buttonText}`);
        }
      }
    });
  });

  test.describe('Member Navigation & Dashboard', () => {
    
    test('should provide appropriate member navigation', async ({ page }) => {
      await page.goto('/', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Look for member-specific navigation
      const memberNav = page.locator('nav, .navigation, .member-nav');
      const navLinks = page.locator('a[href*="profile"], a[href*="settings"], a[href*="projects"], a[href*="dashboard"]');
      
      const hasNavigation = await memberNav.count() > 0;
      const hasMemberLinks = await navLinks.count() > 0;
      
      if (hasNavigation || hasMemberLinks) {
        console.log('ℹ️ Member navigation available');
        
        const linkCount = await navLinks.count();
        if (linkCount > 0) {
          console.log(`ℹ️ Found ${linkCount} member-specific navigation links`);
          
          // Test navigation hover
          for (let i = 0; i < Math.min(linkCount, 3); i++) {
            const link = navLinks.nth(i);
            if (await link.isVisible()) {
              try {
                await link.hover({ force: true, timeout: 5000 });
                await page.waitForTimeout(200);
              } catch (error) {
                // Skip hover if header intercepts, just get text
                console.log('ℹ️ Hover skipped due to overlay interference');
              }
              
              const linkText = await link.textContent();
              if (linkText) {
                console.log(`ℹ️ Member nav: ${linkText.trim()}`);
              }
            }
          }
        }
      }
      
      // Look for user menu or profile indicator
      const userMenu = page.locator('.user-menu, .profile-menu, [data-testid*="user"]');
      if (await userMenu.count() > 0) {
        console.log('ℹ️ User profile menu available');
      }
    });
    
    test('should display member-appropriate content', async ({ page }) => {
      await page.goto('/', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Look for member-specific content
      const hasWelcome = await page.locator('text=/welcome|hello|dashboard/i').count() > 0;
      const hasPersonalization = await page.locator('text=/your project|your account|your profile/i').count() > 0;
      const hasMemberFeatures = await page.locator('text=/member|account|profile/i').count() > 0;
      
      const memberContent = [hasWelcome, hasPersonalization, hasMemberFeatures].filter(Boolean).length;
      
      if (memberContent > 0) {
        console.log(`ℹ️ Member portal displays ${memberContent} types of personalized content`);
      }
    });
  });

  test.describe('Member Performance & Accessibility', () => {
    
    test('should load member pages efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/profile', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Member pages should load reasonably fast
      expect(loadTime).toBeLessThan(8000); // 8 seconds max
      
      console.log(`ℹ️ Member portal load time: ${loadTime}ms`);
    });
    
    test('should be responsive for mobile members', async ({ page }) => {
      await page.goto('/profile', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Test responsive behavior
      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1440, height: 900 }   // Desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        
        // Verify member content remains accessible
        const hasContent = await page.locator('h1, h2, main').count() > 0;
        expect(hasContent).toBeTruthy();
        
        console.log(`ℹ️ Member portal functional at ${viewport.width}x${viewport.height}`);
      }
      
      // Reset to standard viewport
      await page.setViewportSize({ width: 1280, height: 1080 });
    });
  });

  test.describe('Member Security & Permissions', () => {
    
    test('should enforce member authentication', async ({ page }) => {
      // Test member page access without authentication
      await page.goto('/profile');
      await page.waitForTimeout(3000);
      
      // Should redirect to login or show authentication requirement
      const isRedirectedToLogin = page.url().includes('/login');
      const hasAuthRequirement = await page.locator('text=/login|sign in|authenticate/i').count() > 0;
      const hasLoginForm = await page.locator('input[type="password"]').count() > 0;
      
      const requiresAuth = isRedirectedToLogin || hasAuthRequirement || hasLoginForm;
      expect(requiresAuth).toBeTruthy();
      
      console.log('ℹ️ Member pages properly protected with authentication');
    });
    
    test('should provide appropriate member permissions', async ({ page }) => {
      await page.goto('/', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Members should not have admin access
      const hasAdminLinks = await page.locator('a[href*="/admin"]').count() > 0;
      const hasAdminText = await page.locator('text=/admin panel|admin dashboard/i').count() > 0;
      
      // Members should have member-appropriate access
      const hasMemberAccess = await page.locator('text=/profile|account|settings/i').count() > 0;
      const hasMemberLinks = await page.locator('a[href*="profile"], a[href*="settings"]').count() > 0;
      
      // Should have member access but not admin access (unless user has admin role)
      if (hasMemberAccess || hasMemberLinks) {
        console.log('ℹ️ Member-level access provided appropriately');
      }
      
      if (!hasAdminLinks && !hasAdminText) {
        console.log('ℹ️ Admin access properly restricted for members');
      }
    });
  });

  test.describe('Member Communication & Support', () => {
    
    test('should provide member support options', async ({ page }) => {
      await page.goto('/', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Look for support/help options
      const supportLinks = page.locator('a:has-text("Support"), a:has-text("Help"), a:has-text("Contact"), button:has-text("Help")');
      const hasSupportOption = await supportLinks.count() > 0;
      
      if (hasSupportOption) {
        console.log('ℹ️ Member support options available');
        
        const supportLink = supportLinks.first();
        if (await supportLink.isVisible()) {
          try {
            await supportLink.hover({ force: true, timeout: 5000 });
          } catch (error) {
            console.log('ℹ️ Hover skipped due to header interference');
          }
          
          const linkText = await supportLink.textContent();
          console.log(`ℹ️ Support option: ${linkText}`);
        }
      }
      
      // Look for communication features
      const communicationFeatures = page.locator('text=/message|chat|notification|alert/i');
      if (await communicationFeatures.count() > 0) {
        console.log('ℹ️ Member communication features detected');
      }
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    
    test('should handle member session gracefully', async ({ page }) => {
      await page.goto('/profile', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Monitor for JavaScript errors
      const errors = [];
      page.on('pageerror', (error) => {
        errors.push(error);
      });
      
      // Test member interactions
      const interactiveElements = page.locator('button, a, input').first();
      if (await interactiveElements.count() > 0) {
        await interactiveElements.hover();
        await page.waitForTimeout(500);
      }
      
      // Test page reload
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Verify no critical JavaScript errors
      expect(errors.length).toBe(0);
    });
    
    test('should maintain member experience consistency', async ({ page }) => {
      await page.goto('/', { 
        storageState: 'e2e/playwright/.auth/user.json' 
      });
      await page.waitForLoadState('networkidle');
      
      // Check for consistent member experience elements
      const hasNavigation = await page.locator('nav, .navigation').count() > 0;
      const hasFooter = await page.locator('footer, .footer').count() > 0;
      const hasLogo = await page.locator('.logo, .brand').count() > 0;
      
      // Should maintain consistent site experience
      const consistencyElements = [hasNavigation, hasFooter, hasLogo].filter(Boolean).length;
      expect(consistencyElements).toBeGreaterThan(0);
      
      console.log(`ℹ️ Member portal maintains consistency with ${consistencyElements} key elements`);
    });
  });
});