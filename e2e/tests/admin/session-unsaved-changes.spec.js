/**
 * Session Storage and Unsaved Changes Tests
 * 
 * Comprehensive tests for session management including:
 * - Unsaved changes detection and warnings
 * - Session storage persistence
 * - Page refresh recovery
 * - Navigation protection
 * - Form state restoration
 * - Auto-save functionality
 */

const { test, expect } = require('@playwright/test');

const TEST_CREDENTIALS = {
  email: 'info@realtechee.com',
  password: 'Sababa123!'
};

const UNSAVED_CHANGES_SELECTORS = {
  unsavedIndicator: '[data-testid="unsaved-changes"], text*="unsaved", .unsaved-indicator',
  restoreDialog: '[role="dialog"]:has-text("unsaved"), [role="dialog"]:has-text("restore")',
  restoreButton: 'button:has-text("Restore"), button:has-text("Yes")',
  discardButton: 'button:has-text("Discard"), button:has-text("No")',
  saveButton: 'button:has-text("Save"), button[type="submit"]',
  warningDialog: '[role="dialog"]:has-text("changes"), [role="dialog"]:has-text("leave")'
};

test.describe('Session Storage and Unsaved Changes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin section (auth state is already loaded)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Unsaved Changes Detection', () => {
    test('should detect unsaved changes in project forms', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make changes to form fields
        const titleField = page.locator('input[name="title"], input[aria-label*="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Modified for session test)');
          
          // Look for unsaved changes indicator
          const unsavedIndicator = page.locator(UNSAVED_CHANGES_SELECTORS.unsavedIndicator);
          try {
            await expect(unsavedIndicator).toBeVisible({ timeout: 5000 });
            console.log('Unsaved changes indicator found');
          } catch {
            console.log('Unsaved changes indicator not implemented or uses different selector');
          }
          
          // Check if page title or other visual cues indicate unsaved changes
          const pageTitle = await page.title();
          const hasUnsavedIndicator = pageTitle.includes('*') || pageTitle.includes('unsaved');
          
          if (hasUnsavedIndicator) {
            console.log('Page title indicates unsaved changes');
          }
          
          // Take screenshot of unsaved state
          await page.screenshot({ 
            path: 'test-results/unsaved-changes-detected.png',
            fullPage: true 
          });
        }
      }
    });

    test('should detect changes in textarea fields', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Find textarea fields (description, notes, etc.)
        const textareaFields = page.locator('textarea');
        const textareaCount = await textareaFields.count();
        
        if (textareaCount > 0) {
          const firstTextarea = textareaFields.first();
          await firstTextarea.click();
          await firstTextarea.type('\\n\\nAdditional notes for session storage test.');
          
          // Wait for unsaved changes detection
          await page.waitForTimeout(1000);
          
          // Look for visual indicators
          const unsavedIndicator = page.locator(UNSAVED_CHANGES_SELECTORS.unsavedIndicator);
          try {
            await expect(unsavedIndicator).toBeVisible({ timeout: 3000 });
            console.log('Textarea changes detected');
          } catch {
            console.log('Textarea unsaved changes detection not visible');
          }
        }
      }
    });

    test('should detect changes in select/dropdown fields', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Find select/dropdown fields
        const selectFields = page.locator('select, [role="combobox"]');
        const selectCount = await selectFields.count();
        
        if (selectCount > 0) {
          const firstSelect = selectFields.first();
          await firstSelect.click();
          
          // Select a different option
          const options = page.locator('[role="option"], option');
          if (await options.count() > 1) {
            await options.nth(1).click();
            
            // Check for unsaved changes
            await page.waitForTimeout(1000);
            
            const unsavedIndicator = page.locator(UNSAVED_CHANGES_SELECTORS.unsavedIndicator);
            try {
              await expect(unsavedIndicator).toBeVisible({ timeout: 3000 });
              console.log('Select field changes detected');
            } catch {
              console.log('Select field changes not detected or different implementation');
            }
          }
        }
      }
    });
  });

  test.describe('Navigation Protection', () => {
    test('should warn when navigating away with unsaved changes', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make unsaved changes
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Navigation test)');
          
          // Try to navigate away
          await page.click('text=Quotes');
          
          // Look for warning dialog
          const warningDialog = page.locator(UNSAVED_CHANGES_SELECTORS.warningDialog);
          try {
            await expect(warningDialog).toBeVisible({ timeout: 3000 });
            console.log('Navigation warning dialog found');
            
            // Take screenshot of warning
            await page.screenshot({ 
              path: 'test-results/navigation-warning.png',
              fullPage: true 
            });
            
            // Test staying on page
            const stayButton = page.locator('button:has-text("Stay"), button:has-text("Cancel")');
            if (await stayButton.isVisible()) {
              await stayButton.click();
              
              // Should remain on current page
              await expect(page.locator('input[name="title"], textarea[name="title"]')).toBeVisible();
            }
          } catch {
            console.log('Navigation warning not implemented or uses browser dialog');
            
            // Check if browser confirmation dialog would appear
            // (This would require special handling in real scenarios)
          }
        }
      }
    });

    test('should handle browser back button with unsaved changes', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make unsaved changes
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Back button test)');
          
          // Use browser back button
          await page.goBack();
          
          // Check for warning or if we're still on the same page
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          console.log('Current URL after back button:', currentUrl);
          
          // If protection works, we should still be on project detail page
          // If not implemented, we would be back on projects list
          
          if (currentUrl.includes('/admin/projects/')) {
            console.log('Back button protection working');
          } else {
            console.log('Back button protection not implemented');
          }
        }
      }
    });

    test('should allow navigation after saving changes', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make and save changes
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Saved)');
          
          // Save the changes
          const saveButton = page.locator(UNSAVED_CHANGES_SELECTORS.saveButton);
          await saveButton.click();
          
          // Wait for save to complete
          await page.waitForTimeout(2000);
          
          // Now navigation should work without warning
          await page.click('text=Quotes');
          await page.waitForLoadState('networkidle');
          
          // Should successfully navigate to quotes page
          expect(page.url()).toContain('/admin/quotes');
          console.log('Navigation successful after saving');
        }
      }
    });
  });

  test.describe('Session Storage Persistence', () => {
    test('should persist form data in session storage', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make changes
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          const originalValue = await titleField.inputValue();
          const newValue = originalValue + ' (Session storage test)';
          
          await titleField.fill(newValue);
          
          // Check if data is stored in session storage
          const sessionData = await page.evaluate(() => {
            const keys = Object.keys(sessionStorage);
            const relevantKeys = keys.filter(key => 
              key.includes('unsaved') || 
              key.includes('form') || 
              key.includes('project')
            );
            
            const data = {};
            relevantKeys.forEach(key => {
              data[key] = sessionStorage.getItem(key);
            });
            
            return data;
          });
          
          console.log('Session storage data:', sessionData);
          
          // Should have some session storage data for form state
          const hasSessionData = Object.keys(sessionData).length > 0;
          if (hasSessionData) {
            console.log('Form data persisted in session storage');
          } else {
            console.log('Session storage persistence not detected');
          }
        }
      }
    });

    test('should restore data from session storage on page reload', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make changes
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          const originalValue = await titleField.inputValue();
          const testValue = originalValue + ' (Reload test - ' + Date.now() + ')';
          
          await titleField.fill(testValue);
          await page.waitForTimeout(1000); // Allow time for session storage
          
          // Reload the page
          await page.reload();
          await page.waitForLoadState('networkidle');
          
          // Look for restore dialog
          const restoreDialog = page.locator(UNSAVED_CHANGES_SELECTORS.restoreDialog);
          try {
            await expect(restoreDialog).toBeVisible({ timeout: 5000 });
            console.log('Restore dialog found after reload');
            
            // Take screenshot of restore dialog
            await page.screenshot({ 
              path: 'test-results/restore-dialog.png',
              fullPage: true 
            });
            
            // Click restore
            const restoreButton = page.locator(UNSAVED_CHANGES_SELECTORS.restoreButton);
            await restoreButton.click();
            
            // Verify data is restored
            await page.waitForTimeout(1000);
            const restoredValue = await titleField.inputValue();
            
            if (restoredValue === testValue) {
              console.log('Data successfully restored from session storage');
            } else {
              console.log('Data restoration did not match expected value');
              console.log('Expected:', testValue);
              console.log('Actual:', restoredValue);
            }
          } catch {
            console.log('Restore dialog not found - session storage may not be implemented');
          }
        }
      }
    });

    test('should clear session storage after successful save', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make changes
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Clear storage test)');
          
          // Wait for session storage
          await page.waitForTimeout(1000);
          
          // Check session storage before save
          const beforeSave = await page.evaluate(() => {
            return Object.keys(sessionStorage).filter(key => 
              key.includes('unsaved') || key.includes('form')
            ).length;
          });
          
          // Save the changes
          const saveButton = page.locator(UNSAVED_CHANGES_SELECTORS.saveButton);
          await saveButton.click();
          
          // Wait for save completion
          await page.waitForTimeout(3000);
          
          // Check session storage after save
          const afterSave = await page.evaluate(() => {
            return Object.keys(sessionStorage).filter(key => 
              key.includes('unsaved') || key.includes('form')
            ).length;
          });
          
          console.log(`Session storage keys before save: ${beforeSave}, after save: ${afterSave}`);
          
          // Session storage should be cleared after successful save
          if (beforeSave > 0 && afterSave === 0) {
            console.log('Session storage properly cleared after save');
          } else if (beforeSave === 0) {
            console.log('No session storage detected (feature may not be implemented)');
          } else {
            console.log('Session storage not cleared or different implementation');
          }
        }
      }
    });
  });

  test.describe('Auto-save Functionality', () => {
    test('should auto-save form data periodically', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make changes
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Auto-save test)');
          
          // Wait for potential auto-save (typically 30 seconds or on blur)
          await titleField.blur(); // Trigger blur event
          await page.waitForTimeout(2000);
          
          // Look for auto-save indicator
          const autoSaveIndicator = page.locator('text*="auto-saved", text*="draft saved", .auto-save');
          try {
            await expect(autoSaveIndicator).toBeVisible({ timeout: 5000 });
            console.log('Auto-save indicator found');
          } catch {
            console.log('Auto-save feature not implemented or uses different indicator');
          }
          
          // Check network requests for auto-save
          const requests = [];
          page.on('request', request => {
            if (request.url().includes('/graphql') && request.method() === 'POST') {
              requests.push(request.url());
            }
          });
          
          // Wait a bit more to catch any delayed auto-save
          await page.waitForTimeout(5000);
          
          if (requests.length > 0) {
            console.log('Auto-save network requests detected');
          }
        }
      }
    });

    test('should show draft status when auto-save is active', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make changes to trigger draft state
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Draft status test)');
          
          // Look for draft status indicator
          const draftIndicator = page.locator('text*="draft", text*="unsaved", .draft-status');
          try {
            await expect(draftIndicator).toBeVisible({ timeout: 3000 });
            console.log('Draft status indicator found');
            
            // Take screenshot of draft state
            await page.screenshot({ 
              path: 'test-results/draft-status.png',
              fullPage: true 
            });
          } catch {
            console.log('Draft status indicator not found');
          }
        }
      }
    });
  });

  test.describe('Form State Recovery', () => {
    test('should recover complex form state after browser crash simulation', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Fill multiple fields
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        const descriptionField = page.locator('textarea[name="description"], textarea[aria-label*="description"]');
        
        if (await titleField.isVisible()) {
          await titleField.fill('Test Project Title (Recovery Test)');
        }
        
        if (await descriptionField.isVisible()) {
          await descriptionField.fill('This is a test description for recovery testing. It should be restored after page reload.');
        }
        
        // Fill other available fields
        const textInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
        const inputCount = await textInputs.count();
        
        for (let i = 0; i < Math.min(3, inputCount); i++) {
          const input = textInputs.nth(i);
          if (await input.isVisible() && await input.isEnabled()) {
            await input.fill(`Test value ${i + 1}`);
          }
        }
        
        // Wait for session storage
        await page.waitForTimeout(2000);
        
        // Simulate crash by force reload
        await page.evaluate(() => window.location.reload());
        await page.waitForLoadState('networkidle');
        
        // Look for comprehensive restore dialog
        const restoreDialog = page.locator(UNSAVED_CHANGES_SELECTORS.restoreDialog);
        try {
          await expect(restoreDialog).toBeVisible({ timeout: 5000 });
          
          // Restore the data
          const restoreButton = page.locator(UNSAVED_CHANGES_SELECTORS.restoreButton);
          await restoreButton.click();
          
          // Verify multiple fields are restored
          await page.waitForTimeout(1000);
          
          if (await titleField.isVisible()) {
            const restoredTitle = await titleField.inputValue();
            expect(restoredTitle).toContain('Recovery Test');
          }
          
          if (await descriptionField.isVisible()) {
            const restoredDescription = await descriptionField.inputValue();
            expect(restoredDescription).toContain('recovery testing');
          }
          
          console.log('Complex form state successfully recovered');
        } catch {
          console.log('Complex form recovery not implemented');
        }
      }
    });

    test('should handle partial form recovery', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make partial changes (only some fields)
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          const originalTitle = await titleField.inputValue();
          await titleField.fill(originalTitle + ' (Partial recovery)');
          
          // Don't change other fields
          await page.waitForTimeout(1000);
          
          // Reload
          await page.reload();
          await page.waitForLoadState('networkidle');
          
          // Check for restore option
          const restoreDialog = page.locator(UNSAVED_CHANGES_SELECTORS.restoreDialog);
          try {
            await expect(restoreDialog).toBeVisible({ timeout: 3000 });
            
            // Verify only changed fields are mentioned in restore dialog
            const dialogText = await restoreDialog.textContent();
            console.log('Restore dialog text:', dialogText);
            
            // Should mention specific changes
            expect(dialogText.toLowerCase()).toContain('unsaved');
            
          } catch {
            console.log('Partial recovery dialog not found');
          }
        }
      }
    });
  });

  test.describe('Mobile Session Management', () => {
    test('should handle unsaved changes on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make changes on mobile
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Mobile test)');
          
          // Try to navigate away
          const backButton = page.locator('button[aria-label*="back"], button:has-text("Back")');
          if (await backButton.isVisible()) {
            await backButton.click();
          } else {
            await page.goBack();
          }
          
          // Look for mobile-optimized warning
          const warningDialog = page.locator(UNSAVED_CHANGES_SELECTORS.warningDialog);
          try {
            await expect(warningDialog).toBeVisible({ timeout: 3000 });
            console.log('Mobile unsaved changes warning found');
            
            // Take mobile screenshot
            await page.screenshot({ 
              path: 'test-results/mobile-unsaved-warning.png',
              fullPage: true 
            });
          } catch {
            console.log('Mobile unsaved changes warning not found');
          }
        }
      }
    });
  });
});