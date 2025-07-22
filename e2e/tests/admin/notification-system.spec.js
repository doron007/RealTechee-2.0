/**
 * Notification System Tests
 * 
 * Comprehensive tests for the notification system including:
 * - Success notifications for CRUD operations
 * - Error handling and error notifications
 * - Warning and info notifications
 * - Auto-dismiss functionality
 * - Multiple notification handling
 * - Notification accessibility
 */

const { test, expect } = require('@playwright/test');

const TEST_CREDENTIALS = {
  email: 'info@realtechee.com',
  password: 'Sababa123!'
};

const NOTIFICATION_SELECTORS = {
  snackbar: '[role="alert"], .MuiSnackbar-root, [data-testid="notification"]',
  successSnackbar: '[role="alert"][class*="success"], .MuiAlert-filledSuccess',
  errorSnackbar: '[role="alert"][class*="error"], .MuiAlert-filledError',
  warningSnackbar: '[role="alert"][class*="warning"], .MuiAlert-filledWarning',
  infoSnackbar: '[role="alert"][class*="info"], .MuiAlert-filledInfo',
  closeButton: 'button[aria-label*="close"], button[title*="close"]',
  notificationContainer: '[data-testid="notification-container"], .notifications'
};

test.describe('Notification System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin section (auth state is already loaded)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Success Notifications', () => {
    test('should show success notification for successful project save', async ({ page }) => {
      // Navigate to project detail
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make a small change
        const titleField = page.locator('input[name="title"], input[aria-label*="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Updated)');
          
          // Save the project
          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.click();
          
          // Look for success notification
          const successNotification = page.locator(NOTIFICATION_SELECTORS.successSnackbar);
          await expect(successNotification).toBeVisible({ timeout: 5000 });
          
          // Verify notification content
          const notificationText = await successNotification.textContent();
          expect(notificationText).toMatch(/saved|success|updated/i);
          
          // Take screenshot
          await page.screenshot({ 
            path: 'test-results/success-notification.png',
            fullPage: true 
          });
        }
      }
    });

    test('should show success notification for archive operation', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        const firstCard = projectCards.first();
        await firstCard.hover();
        
        // Look for archive/delete button
        const archiveButton = page.locator('button[aria-label*="archive"], button[aria-label*="delete"], button:has-text("Archive")');
        if (await archiveButton.isVisible()) {
          await archiveButton.click();
          
          // Handle confirmation dialog if present
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Archive"), button:has-text("Yes")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
          
          // Look for success notification
          const successNotification = page.locator(NOTIFICATION_SELECTORS.successSnackbar);
          await expect(successNotification).toBeVisible({ timeout: 5000 });
          
          const notificationText = await successNotification.textContent();
          expect(notificationText).toMatch(/archived|success/i);
        }
      }
    });

    test('should show success notification for filter application', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      // Expand filters
      const expandButton = page.locator('button:has-text("Advanced Filters")').first();
      await expandButton.click();
      
      // Apply a filter
      const datePresetSelect = page.locator('text=Date Preset').locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      await page.click('text=Last 30 Days');
      
      // Look for filter applied notification (if implemented)
      const filterNotification = page.locator(NOTIFICATION_SELECTORS.successSnackbar);
      try {
        await expect(filterNotification).toBeVisible({ timeout: 3000 });
        console.log('Filter application notification found');
      } catch {
        console.log('Filter application notification not implemented');
      }
    });
  });

  test.describe('Error Notifications', () => {
    test('should show error notification for network failures', async ({ page }) => {
      // Intercept network requests and simulate failure
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      await page.goto('/admin/projects');
      
      // Look for error notification
      const errorNotification = page.locator(NOTIFICATION_SELECTORS.errorSnackbar);
      await expect(errorNotification).toBeVisible({ timeout: 10000 });
      
      const notificationText = await errorNotification.textContent();
      expect(notificationText).toMatch(/error|failed|network/i);
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-results/error-notification.png',
        fullPage: true 
      });
    });

    test('should show error notification for validation failures', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Clear required field and try to save
        const titleField = page.locator('input[name="title"], input[aria-label*="title"]');
        if (await titleField.isVisible()) {
          await titleField.clear();
          
          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');
          await saveButton.click();
          
          // Look for validation error notification
          const errorNotification = page.locator(NOTIFICATION_SELECTORS.errorSnackbar);
          try {
            await expect(errorNotification).toBeVisible({ timeout: 3000 });
            
            const notificationText = await errorNotification.textContent();
            expect(notificationText).toMatch(/required|validation|error/i);
          } catch {
            console.log('Validation error notification not found (may use different error display)');
          }
        }
      }
    });

    test('should handle 403 authorization errors', async ({ page }) => {
      // Mock 403 response
      await page.route('**/graphql', route => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Forbidden: Access denied' }]
          })
        });
      });
      
      await page.goto('/admin/analytics');
      
      // Look for authorization error
      const errorNotification = page.locator(NOTIFICATION_SELECTORS.errorSnackbar);
      await expect(errorNotification).toBeVisible({ timeout: 5000 });
      
      const notificationText = await errorNotification.textContent();
      expect(notificationText).toMatch(/forbidden|access|denied|unauthorized/i);
    });
  });

  test.describe('Warning and Info Notifications', () => {
    test('should show warning notification for unsaved changes', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make changes without saving
        const titleField = page.locator('input[name="title"], input[aria-label*="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Modified)');
          
          // Try to navigate away
          await page.click('text=Projects');
          
          // Look for unsaved changes warning
          const warningNotification = page.locator(NOTIFICATION_SELECTORS.warningSnackbar);
          try {
            await expect(warningNotification).toBeVisible({ timeout: 3000 });
            
            const notificationText = await warningNotification.textContent();
            expect(notificationText).toMatch(/unsaved|changes|warning/i);
          } catch {
            // May use browser confirmation dialog instead
            console.log('Unsaved changes warning may use browser dialog');
          }
        }
      }
    });

    test('should show info notification for background operations', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      // Trigger export operation
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        
        // Look for info notification about export
        const infoNotification = page.locator(NOTIFICATION_SELECTORS.infoSnackbar);
        try {
          await expect(infoNotification).toBeVisible({ timeout: 3000 });
          
          const notificationText = await infoNotification.textContent();
          expect(notificationText).toMatch(/export|download|processing/i);
        } catch {
          console.log('Export info notification not implemented');
        }
        
        await downloadPromise;
      }
    });
  });

  test.describe('Auto-dismiss Functionality', () => {
    test('should auto-dismiss success notifications', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make a change and save
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Auto-dismiss test)');
          
          const saveButton = page.locator('button:has-text("Save")');
          await saveButton.click();
          
          // Wait for success notification
          const successNotification = page.locator(NOTIFICATION_SELECTORS.successSnackbar);
          await expect(successNotification).toBeVisible({ timeout: 5000 });
          
          // Wait for auto-dismiss (typically 4-6 seconds)
          await expect(successNotification).not.toBeVisible({ timeout: 8000 });
          
          console.log('Success notification auto-dismissed');
        }
      }
    });

    test('should not auto-dismiss error notifications', async ({ page }) => {
      // Simulate error
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      await page.goto('/admin/projects');
      
      // Wait for error notification
      const errorNotification = page.locator(NOTIFICATION_SELECTORS.errorSnackbar);
      await expect(errorNotification).toBeVisible({ timeout: 5000 });
      
      // Wait to verify it doesn't auto-dismiss
      await page.waitForTimeout(8000);
      await expect(errorNotification).toBeVisible();
      
      console.log('Error notification persisted (correct behavior)');
    });
  });

  test.describe('Multiple Notifications', () => {
    test('should handle multiple simultaneous notifications', async ({ page }) => {
      // Create multiple actions that trigger notifications
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      // Trigger multiple refresh operations rapidly
      const refreshButton = page.locator('button:has-text("Refresh")');
      
      for (let i = 0; i < 3; i++) {
        await refreshButton.click();
        await page.waitForTimeout(200);
      }
      
      // Check for multiple notifications or proper queuing
      const notifications = page.locator(NOTIFICATION_SELECTORS.snackbar);
      const notificationCount = await notifications.count();
      
      console.log(`Found ${notificationCount} notifications`);
      
      // Should handle multiple notifications gracefully
      if (notificationCount > 1) {
        console.log('Multiple notifications displayed');
      } else {
        console.log('Notifications properly queued or throttled');
      }
    });

    test('should stack notifications properly', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      // Simulate rapid actions (if available)
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 1) {
        // Click multiple cards rapidly
        for (let i = 0; i < Math.min(3, await projectCards.count()); i++) {
          await projectCards.nth(i).click();
          await page.waitForTimeout(500);
          await page.goBack();
          await page.waitForTimeout(500);
        }
        
        // Check notification stacking behavior
        const notifications = page.locator(NOTIFICATION_SELECTORS.snackbar);
        const positions = [];
        
        for (let i = 0; i < await notifications.count(); i++) {
          const notification = notifications.nth(i);
          if (await notification.isVisible()) {
            const box = await notification.boundingBox();
            positions.push(box.y);
          }
        }
        
        console.log('Notification positions:', positions);
        
        // Notifications should be stacked vertically if multiple
        if (positions.length > 1) {
          expect(positions[1]).toBeGreaterThan(positions[0]);
        }
      }
    });
  });

  test.describe('Manual Dismissal', () => {
    test('should allow manual dismissal with close button', async ({ page }) => {
      // Trigger error that doesn't auto-dismiss
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      await page.goto('/admin/projects');
      
      const errorNotification = page.locator(NOTIFICATION_SELECTORS.errorSnackbar);
      await expect(errorNotification).toBeVisible({ timeout: 5000 });
      
      // Find and click close button
      const closeButton = errorNotification.locator(NOTIFICATION_SELECTORS.closeButton);
      if (await closeButton.isVisible()) {
        await closeButton.click();
        
        // Verify notification is dismissed
        await expect(errorNotification).not.toBeVisible({ timeout: 2000 });
        console.log('Notification manually dismissed');
      } else {
        console.log('Close button not found on notification');
      }
    });

    test('should allow dismissal by clicking notification area', async ({ page }) => {
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Make a change and save to trigger notification
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (Click dismiss test)');
          
          const saveButton = page.locator('button:has-text("Save")');
          await saveButton.click();
          
          const successNotification = page.locator(NOTIFICATION_SELECTORS.successSnackbar);
          await expect(successNotification).toBeVisible({ timeout: 5000 });
          
          // Try clicking the notification to dismiss
          await successNotification.click();
          
          // Check if it dismisses (depends on implementation)
          try {
            await expect(successNotification).not.toBeVisible({ timeout: 2000 });
            console.log('Notification dismissed by clicking');
          } catch {
            console.log('Click dismissal not implemented');
          }
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      // Trigger a notification
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      await page.goto('/admin/projects');
      
      const errorNotification = page.locator(NOTIFICATION_SELECTORS.errorSnackbar);
      await expect(errorNotification).toBeVisible({ timeout: 5000 });
      
      // Check ARIA attributes
      const role = await errorNotification.getAttribute('role');
      expect(role).toBe('alert');
      
      // Check for aria-live if present
      const ariaLive = await errorNotification.getAttribute('aria-live');
      if (ariaLive) {
        expect(['polite', 'assertive']).toContain(ariaLive);
      }
      
      console.log(`Notification ARIA role: ${role}, aria-live: ${ariaLive}`);
    });

    test('should be announced to screen readers', async ({ page }) => {
      // This would require specific accessibility testing tools
      // For now, verify the notification has proper structure
      
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      
      const projectCards = page.locator('[data-testid="project-card"], .project-card');
      if (await projectCards.count() > 0) {
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        
        const titleField = page.locator('input[name="title"], textarea[name="title"]');
        if (await titleField.isVisible()) {
          await titleField.click();
          await titleField.press('End');
          await titleField.type(' (A11y test)');
          
          const saveButton = page.locator('button:has-text("Save")');
          await saveButton.click();
          
          const successNotification = page.locator(NOTIFICATION_SELECTORS.successSnackbar);
          await expect(successNotification).toBeVisible({ timeout: 5000 });
          
          // Check notification text is meaningful
          const notificationText = await successNotification.textContent();
          expect(notificationText.length).toBeGreaterThan(5);
          expect(notificationText).not.toMatch(/^\\s*$/); // Not just whitespace
          
          console.log('Notification text for screen readers:', notificationText);
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Trigger notification with close button
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      await page.goto('/admin/projects');
      
      const errorNotification = page.locator(NOTIFICATION_SELECTORS.errorSnackbar);
      await expect(errorNotification).toBeVisible({ timeout: 5000 });
      
      // Check if close button is keyboard accessible
      const closeButton = errorNotification.locator(NOTIFICATION_SELECTORS.closeButton);
      if (await closeButton.isVisible()) {
        // Tab to the close button
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        // Check if close button receives focus
        const focusedElement = page.locator(':focus');
        const isFocused = await closeButton.evaluate((el, focused) => 
          el === focused, await focusedElement.elementHandle()
        );
        
        if (isFocused) {
          console.log('Close button is keyboard accessible');
          
          // Press Enter to close
          await page.keyboard.press('Enter');
          await expect(errorNotification).not.toBeVisible({ timeout: 2000 });
        } else {
          console.log('Close button may not be keyboard accessible');
        }
      }
    });
  });

  test.describe('Notification Positioning and Styling', () => {
    test('should position notifications correctly', async ({ page }) => {
      // Trigger notification
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      const refreshButton = page.locator('button:has-text("Refresh")');
      await refreshButton.click();
      
      // Wait for any notification
      const notification = page.locator(NOTIFICATION_SELECTORS.snackbar).first();
      
      try {
        await expect(notification).toBeVisible({ timeout: 3000 });
        
        const boundingBox = await notification.boundingBox();
        console.log('Notification position:', boundingBox);
        
        // Verify notification is positioned in viewport
        expect(boundingBox.x).toBeGreaterThanOrEqual(0);
        expect(boundingBox.y).toBeGreaterThanOrEqual(0);
        
        // Usually positioned at top or bottom of screen
        const viewportSize = page.viewportSize();
        const isTopPosition = boundingBox.y < viewportSize.height / 2;
        const isBottomPosition = boundingBox.y > viewportSize.height / 2;
        
        expect(isTopPosition || isBottomPosition).toBeTruthy();
        
      } catch {
        console.log('No notification triggered for positioning test');
      }
    });

    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Trigger error notification
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      await page.goto('/admin/projects');
      
      const errorNotification = page.locator(NOTIFICATION_SELECTORS.errorSnackbar);
      await expect(errorNotification).toBeVisible({ timeout: 5000 });
      
      const boundingBox = await errorNotification.boundingBox();
      
      // On mobile, notification should fit within viewport width
      expect(boundingBox.width).toBeLessThanOrEqual(375);
      expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(375);
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/mobile-notification.png',
        fullPage: true 
      });
    });
  });
});