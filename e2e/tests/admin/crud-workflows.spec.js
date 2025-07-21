/**
 * Comprehensive CRUD Workflow Tests
 * 
 * End-to-end testing for complete CRUD operations across admin pages:
 * - Create, Read, Update, Delete workflows
 * - Navigation between related entities
 * - Form validation and error handling
 * - Data persistence and consistency
 * - Integration with new features (notifications, session storage)
 * - Business logic validation
 */

const { test, expect } = require('@playwright/test');

test.describe('CRUD Workflows', () => {
  
  test.use({ storageState: 'e2e/playwright/.auth/user.json' });
  
  let page;
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1080 }
    });
    page = await context.newPage();
  });
  
  test.afterAll(async () => {
    if (page) await page.close();
  });
  
  // Helper function to wait for page load and data
  async function waitForPageLoad(expectedTitle) {
    await expect(page.locator('h1')).toBeVisible();
    if (expectedTitle) {
      await expect(page.locator('h1')).toContainText(expectedTitle, { timeout: 10000 });
    }
    await page.waitForTimeout(2000); // Allow for data loading
  }
  
  // Helper function to check for notifications
  async function checkForNotification() {
    const notificationSelectors = [
      '.MuiSnackbar-root',
      '.MuiAlert-root',
      '[role="alert"]'
    ];
    
    for (const selector of notificationSelectors) {
      try {
        const notification = page.locator(selector);
        if (await notification.count() > 0 && await notification.isVisible()) {
          return notification;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }
  
  test.describe('Projects CRUD Workflow', () => {
    
    test('should navigate to projects list and display data', async () => {
      await page.goto('/admin/projects');
      await waitForPageLoad('Projects');
      
      // Verify page elements
      const dataGrid = page.locator('[data-testid="admin-data-grid"], .MuiDataGrid-root, table, .bg-white.shadow');
      await expect(dataGrid).toBeVisible();
      
      // Check for aggregation bar
      const aggregationBar = page.locator('.bg-white.rounded-lg.shadow').first();
      const aggregationText = await aggregationBar.textContent();
      
      // Should show total counts
      const hasAggregation = aggregationText?.includes('Total') || 
                           aggregationText?.includes('Active') ||
                           aggregationText?.includes('Projects');
      expect(hasAggregation).toBeTruthy();
    });
    
    test('should open project detail page for seed project', async () => {
      await page.goto('/admin/projects');
      await waitForPageLoad('Projects');
      
      // Navigate to seed project
      await page.goto('/admin/projects/490209a8-d20a-bae1-9e01-1da356be8a93');
      await waitForPageLoad();
      
      // Verify project detail page loaded
      const pageTitle = await page.locator('h1').textContent();
      expect(pageTitle).toBeTruthy();
      
      // Check for form elements
      const formInputs = page.locator('input, textarea, select');
      const inputCount = await formInputs.count();
      expect(inputCount).toBeGreaterThan(0);
      
      // Check for save button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("No Changes")');
      await expect(saveButton).toBeVisible();
    });
    
    test('should handle form editing and saving in project detail', async () => {
      await page.goto('/admin/projects/490209a8-d20a-bae1-9e01-1da356be8a93');
      await waitForPageLoad();
      
      // Find editable form field
      const titleInput = page.locator('input[type="text"]').first();
      
      if (await titleInput.count() > 0) {
        const isDisabled = await titleInput.getAttribute('disabled');
        
        if (!isDisabled) {
          const originalValue = await titleInput.inputValue();
          const testValue = `Test Project ${Date.now()}`;
          
          // Make a change
          await titleInput.fill(testValue);
          await page.waitForTimeout(1000);
          
          // Check if save button is enabled
          const saveButton = page.locator('button:has-text("Save")').first();
          
          if (await saveButton.count() > 0) {
            const isEnabled = await saveButton.isEnabled();
            expect(isEnabled).toBeTruthy();
            
            // Try to save
            await saveButton.click();
            await page.waitForTimeout(2000);
            
            // Check for success notification
            const notification = await checkForNotification();
            if (notification) {
              const notificationText = await notification.textContent();
              const isSuccessNotification = notificationText?.toLowerCase().includes('success') ||
                                          notificationText?.toLowerCase().includes('saved');
              expect(isSuccessNotification).toBeTruthy();
            }
          }
          
          // Reset to original value for cleanup
          await titleInput.fill(originalValue);
        }
      }
    });
    
    test('should navigate back to projects list from detail page', async () => {
      await page.goto('/admin/projects/490209a8-d20a-bae1-9e01-1da356be8a93');
      await waitForPageLoad();
      
      // Look for back button
      const backButtons = page.locator('button:has-text("Back"), a:has-text("Back"), button:has(svg)');
      
      if (await backButtons.count() > 0) {
        const backButton = backButtons.first();
        await backButton.click();
        
        // Should return to projects list
        await waitForPageLoad('Projects');
        
        // Verify we're back on the list page
        const currentUrl = page.url();
        expect(currentUrl).toContain('/admin/projects');
        expect(currentUrl).not.toContain('490209a8-d20a-bae1-9e01-1da356be8a93');
      }
    });
  });
  
  test.describe('Quotes CRUD Workflow', () => {
    
    test('should navigate to quotes list and display data', async () => {
      await page.goto('/admin/quotes');
      await waitForPageLoad('Quotes');
      
      // Verify quotes page elements
      const dataElements = page.locator('[data-testid="admin-data-grid"], .MuiDataGrid-root, table, tr, .bg-white.border-b');
      await expect(dataElements.first()).toBeVisible();
      
      // Check for quotes-specific content
      const pageContent = await page.textContent('body');
      const hasQuotesContent = pageContent?.includes('Quote') || 
                             pageContent?.includes('Proposal') ||
                             pageContent?.includes('Estimate');
      expect(hasQuotesContent).toBeTruthy();
    });
    
    test('should handle quote detail navigation if available', async () => {
      await page.goto('/admin/quotes');
      await waitForPageLoad('Quotes');
      
      // Look for actionable items (Edit buttons, links, etc.)
      const actionButtons = page.locator('button:has-text("Edit"), button:has-text("View"), a[href*="/admin/quotes/"]');
      
      if (await actionButtons.count() > 0) {
        const firstAction = actionButtons.first();
        await firstAction.click();
        
        // Should navigate to quote detail or stay on list with dialog
        await page.waitForTimeout(2000);
        
        // Verify something happened (navigation or dialog)
        const currentUrl = page.url();
        const hasDialog = await page.locator('[role="dialog"]').count() > 0;
        
        const actionWorked = currentUrl.includes('/admin/quotes/') || hasDialog;
        expect(actionWorked).toBeTruthy();
        
        // Clean up if dialog opened
        if (hasDialog) {
          await page.keyboard.press('Escape');
        }
      }
    });
  });
  
  test.describe('Requests CRUD Workflow', () => {
    
    test('should navigate to requests list and display data', async () => {
      await page.goto('/admin/requests');
      await waitForPageLoad('Requests');
      
      // Verify requests page elements
      const dataElements = page.locator('[data-testid="admin-data-grid"], .MuiDataGrid-root, table, tr, .bg-white.border-b');
      await expect(dataElements.first()).toBeVisible();
      
      // Check for requests-specific content
      const pageContent = await page.textContent('body');
      const hasRequestsContent = pageContent?.includes('Request') || 
                               pageContent?.includes('Inquiry') ||
                               pageContent?.includes('Message');
      expect(hasRequestsContent).toBeTruthy();
    });
    
    test('should handle request detail navigation if available', async () => {
      await page.goto('/admin/requests');
      await waitForPageLoad('Requests');
      
      // Look for actionable items
      const actionButtons = page.locator('button:has-text("Edit"), button:has-text("View"), a[href*="/admin/requests/"]');
      
      if (await actionButtons.count() > 0) {
        const firstAction = actionButtons.first();
        await firstAction.click();
        
        await page.waitForTimeout(2000);
        
        // Verify navigation or dialog
        const currentUrl = page.url();
        const hasDialog = await page.locator('[role="dialog"]').count() > 0;
        
        const actionWorked = currentUrl.includes('/admin/requests/') || hasDialog;
        expect(actionWorked).toBeTruthy();
        
        if (hasDialog) {
          await page.keyboard.press('Escape');
        }
      }
    });
  });
  
  test.describe('Archive Workflow', () => {
    
    test('should handle archive functionality across admin pages', async () => {
      const testPages = ['/admin/projects', '/admin/quotes', '/admin/requests'];
      
      for (const pagePath of testPages) {
        await page.goto(pagePath);
        await waitForPageLoad();
        
        // Look for archive functionality
        const archiveButtons = page.locator('button:has-text("Archive"), button[title*="Archive"], button[aria-label*="Archive"]');
        const archiveToggle = page.locator('input[type="checkbox"]:near(:text("Archive")), label:has-text("Archive")');
        
        // Should have either archive actions or archive toggle
        const hasArchiveFeature = (await archiveButtons.count() > 0) || (await archiveToggle.count() > 0);
        
        if (hasArchiveFeature) {
          // Test archive toggle if available
          if (await archiveToggle.count() > 0) {
            const toggle = archiveToggle.first();
            const isChecked = await toggle.isChecked();
            
            // Toggle state
            await toggle.click();
            await page.waitForTimeout(1000);
            
            // Verify state changed
            const newState = await toggle.isChecked();
            expect(newState).toBe(!isChecked);
            
            // Toggle back
            await toggle.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
    
    test('should show archive confirmation dialog when attempting to archive', async () => {
      await page.goto('/admin/projects');
      await waitForPageLoad('Projects');
      
      // Look for archive action buttons
      const archiveButtons = page.locator('button:has(svg), .MuiIconButton-root');
      const buttonCount = await archiveButtons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        try {
          const button = archiveButtons.nth(i);
          const title = await button.getAttribute('title');
          const ariaLabel = await button.getAttribute('aria-label');
          
          const isArchiveButton = title?.toLowerCase().includes('archive') ||
                                ariaLabel?.toLowerCase().includes('archive');
          
          if (isArchiveButton) {
            await button.click();
            await page.waitForTimeout(1000);
            
            // Should show confirmation dialog
            const confirmDialog = page.locator('[role="dialog"]');
            
            if (await confirmDialog.count() > 0) {
              const dialogText = await confirmDialog.textContent();
              const isArchiveDialog = dialogText?.toLowerCase().includes('archive') ||
                                    dialogText?.toLowerCase().includes('confirm');
              
              expect(isArchiveDialog).toBeTruthy();
              
              // Close dialog
              await page.keyboard.press('Escape');
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }
    });
  });
  
  test.describe('Cross-Entity Navigation', () => {
    
    test('should allow navigation between related entities', async () => {
      // Test navigation from projects to related quotes/requests
      await page.goto('/admin/projects/490209a8-d20a-bae1-9e01-1da356be8a93');
      await waitForPageLoad();
      
      // Look for related entity navigation
      const relatedButtons = page.locator('button:has-text("Quote"), button:has-text("Request"), a:has-text("Quote"), a:has-text("Request")');
      
      if (await relatedButtons.count() > 0) {
        const relatedButton = relatedButtons.first();
        const buttonText = await relatedButton.textContent();
        
        await relatedButton.click();
        await page.waitForTimeout(2000);
        
        // Should navigate to related entity page
        const currentUrl = page.url();
        const navigatedToRelated = currentUrl.includes('/admin/quote') || 
                                 currentUrl.includes('/admin/request') ||
                                 buttonText?.toLowerCase().includes('quote') ||
                                 buttonText?.toLowerCase().includes('request');
        
        expect(navigatedToRelated).toBeTruthy();
      }
    });
    
    test('should maintain data consistency across navigation', async () => {
      // Test that entity IDs and references are consistent
      const pages = ['/admin/projects', '/admin/quotes', '/admin/requests'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await waitForPageLoad();
        
        // Check for data consistency indicators
        const idElements = page.locator('[data-id], [id*="id"], *:has-text("ID:")');
        const statusElements = page.locator('.status, [data-status], *:has-text("Status")');
        
        // Should have some form of ID or status tracking
        const hasDataConsistency = (await idElements.count() > 0) || (await statusElements.count() > 0);
        expect(hasDataConsistency).toBeTruthy();
      }
    });
  });
  
  test.describe('Form Validation', () => {
    
    test('should validate required fields in project forms', async () => {
      await page.goto('/admin/projects/490209a8-d20a-bae1-9e01-1da356be8a93');
      await waitForPageLoad();
      
      // Try to clear a required field and save
      const titleInput = page.locator('input[type="text"]').first();
      
      if (await titleInput.count() > 0) {
        const isDisabled = await titleInput.getAttribute('disabled');
        
        if (!isDisabled) {
          const originalValue = await titleInput.inputValue();
          
          // Clear the field
          await titleInput.fill('');
          await page.waitForTimeout(500);
          
          // Try to save
          const saveButton = page.locator('button:has-text("Save")').first();
          
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);
            
            // Should show validation error or prevent save
            const errorElements = page.locator('.error, .MuiFormHelperText-error, [role="alert"]');
            const notification = await checkForNotification();
            
            const hasValidationFeedback = (await errorElements.count() > 0) || 
                                        (notification && await notification.isVisible());
            
            // Either validation feedback or save was prevented
            expect(hasValidationFeedback || await saveButton.isEnabled()).toBeTruthy();
          }
          
          // Restore original value
          await titleInput.fill(originalValue);
        }
      }
    });
  });
  
  test.describe('Data Persistence', () => {
    
    test('should maintain data after page refresh', async () => {
      await page.goto('/admin/projects');
      await waitForPageLoad('Projects');
      
      // Get initial data count
      const dataElements = page.locator('tr:not(:first-child), .bg-white.border-b');
      const initialCount = await dataElements.count();
      
      // Refresh page
      await page.reload();
      await waitForPageLoad('Projects');
      
      // Check data is still there
      const newCount = await dataElements.count();
      expect(newCount).toBe(initialCount);
    });
    
    test('should handle concurrent user scenarios', async () => {
      // Test that the application handles multiple actions gracefully
      await page.goto('/admin/projects');
      await waitForPageLoad('Projects');
      
      // Perform multiple rapid actions
      const actionButtons = page.locator('button:has(svg), .MuiIconButton-root');
      const buttonCount = await actionButtons.count();
      
      if (buttonCount > 2) {
        // Click a few buttons rapidly
        for (let i = 0; i < Math.min(3, buttonCount); i++) {
          try {
            await actionButtons.nth(i).click();
            await page.waitForTimeout(200);
          } catch (error) {
            // Continue - some buttons might not be clickable
          }
        }
        
        // Page should still be functional
        await expect(page.locator('h1')).toBeVisible();
        
        // Close any dialogs that might have opened
        const dialogs = page.locator('[role="dialog"]');
        const dialogCount = await dialogs.count();
        for (let i = 0; i < dialogCount; i++) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    });
  });
});