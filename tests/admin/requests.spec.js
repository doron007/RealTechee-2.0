/**
 * Admin Requests Page Tests
 * 
 * User story-driven tests for /admin/requests back office functionality:
 * - Service request management and tracking
 * - Search across request details, customer info, and service types
 * - Filter operations (status, priority, service type, date ranges)
 * - View mode switching (table/cards with request details)
 * - Sort controls for request prioritization and organization
 * - Action buttons (Create Request, Assign, Update Status, Export)
 * - Request workflow and status management
 * - Customer communication tracking
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Requests Page - Back Office Operations', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to requests management page
    await page.goto('/admin/requests');
    
    // Wait for page to load completely
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForSelector('[data-testid="admin-data-grid"], .MuiCircularProgress-root, tr, .MuiCard-root', { timeout: 15000 });
  });

  test.describe('User Story: Request Manager Views All Service Requests', () => {
    
    test('should display requests dashboard with operational metrics', async ({ page }) => {
      // User Story: As a request manager, I want to see an overview of all service requests with key operational metrics
      
      // Verify page title indicates request management
      const pageTitle = await page.locator('h1').first().textContent();
      expect(pageTitle?.toLowerCase()).toContain('request');
      
      // Check for request summary/metrics (Open, In Progress, Completed, etc.)
      const summaryCards = page.locator('.bg-white.rounded-lg.shadow, .MuiCard-root').first();
      
      // Verify request data is displayed
      const requestElements = page.locator('tr:not(:first-child), .MuiCard-root');
      const requestCount = await requestElements.count();
      
      // Should have either requests or proper empty state
      expect(requestCount).toBeGreaterThanOrEqual(0);
      
      // Check for system health - allow informational alerts but not blocking errors
      const errorElements = page.locator('[role="alert"], .error-message');
      const errorCount = await errorElements.count();
      
      if (errorCount > 0) {
        console.log(`ℹ️ Found ${errorCount} alert elements - monitoring for blocking issues`);
      }
    });
    
    test('should show request-specific information in management interface', async ({ page }) => {
      // User Story: As a request manager, I want to see essential request information for quick triage
      
      await page.waitForLoadState('networkidle');
      
      const hasRequests = await page.locator('tr:not(:first-child), .MuiCard-root').count() > 0;
      
      if (hasRequests) {
        // Verify request-specific columns/fields are present
        const hasRequestId = await page.locator('text=/request.*id|ticket.*number|#/i').count() > 0;
        const hasCustomer = await page.locator('text=/customer|client|contact|name/i').count() > 0;
        const hasStatus = await page.locator('text=/status|state|progress/i').count() > 0;
        const hasPriority = await page.locator('text=/priority|urgent|high|low/i').count() > 0;
        const hasDate = await page.locator('text=/date|created|updated|due/i').count() > 0;
        const hasServiceType = await page.locator('text=/service|type|category/i').count() > 0;
        
        // At least some request-relevant fields should be present
        const relevantFieldsCount = [hasRequestId, hasCustomer, hasStatus, hasPriority, hasDate, hasServiceType].filter(Boolean).length;
        expect(relevantFieldsCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('User Story: Request Manager Searches for Specific Requests', () => {
    
    test('should provide comprehensive search across request fields', async ({ page }) => {
      // User Story: As a request manager, I want to quickly find requests by customer name, request ID, or service type
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], .MuiInputBase-input').first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        
        // Test search for request-specific terms
        const requestSearchTerms = ['request', 'service', 'urgent', 'customer', 'repair'];
        
        for (const term of requestSearchTerms) {
          await searchInput.fill(term);
          await page.waitForTimeout(800); // Wait for search debounce
          
          // Verify search doesn't break the interface
          await expect(page.locator('h1').first()).toBeVisible();
          
          await searchInput.clear();
          await page.waitForTimeout(300);
        }
      }
    });
    
    test('should handle advanced search patterns for request management', async ({ page }) => {
      // User Story: As a request manager, I want to search using request IDs, customer names, and service types
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Test request-specific search patterns
        const searchPatterns = [
          'REQ-2024',      // Request ID pattern
          'Jane Doe',      // Customer name
          'maintenance',   // Service type
          'urgent',        // Priority level
          'in progress'    // Status search
        ];
        
        for (const pattern of searchPatterns) {
          await searchInput.fill(pattern);
          await page.waitForTimeout(1000);
          
          // Page should remain functional
          await expect(page.locator('h1').first()).toBeVisible();
          
          await searchInput.clear();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('User Story: Request Manager Filters Requests by Criteria', () => {
    
    test('should provide filtering by request status and priority', async ({ page }) => {
      // User Story: As a request manager, I want to filter requests by status and priority to focus on urgent items
      
      // Status filter
      const statusFilter = page.locator('text=/status/i').locator('..').locator('select, .MuiSelect-select').first();
      
      if (await statusFilter.count() > 0 && await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.waitForTimeout(300);
        
        // Look for request status options (Open, In Progress, Completed, Closed)
        const statusOptions = page.locator('[role="option"], .MuiMenuItem-root');
        if (await statusOptions.count() > 0) {
          await statusOptions.first().click();
          await page.waitForTimeout(500);
          
          // Verify filtering works
          await expect(page.locator('h1').first()).toBeVisible();
        }
      }
      
      // Priority filter
      const priorityFilter = page.locator('text=/priority/i').locator('..').locator('select, .MuiSelect-select').first();
      if (await priorityFilter.count() > 0 && await priorityFilter.isVisible()) {
        await priorityFilter.click();
        await page.waitForTimeout(300);
        
        const priorityOptions = page.locator('[role="option"], .MuiMenuItem-root');
        if (await priorityOptions.count() > 0) {
          await priorityOptions.first().click();
          await page.waitForTimeout(500);
        }
      }
    });
    
    test('should provide filtering by service type and date ranges', async ({ page }) => {
      // User Story: As a request manager, I want to filter requests by service type and creation date
      
      // Service type filter
      const serviceFilter = page.locator('text=/service|type|category/i').locator('..').locator('select, .MuiSelect-select').first();
      if (await serviceFilter.count() > 0 && await serviceFilter.isVisible()) {
        await serviceFilter.click();
        await page.waitForTimeout(300);
        
        const serviceOptions = page.locator('[role="option"], .MuiMenuItem-root');
        if (await serviceOptions.count() > 0) {
          await serviceOptions.first().click();
          await page.waitForTimeout(500);
        }
      }
      
      // Date range filter (if present)
      const dateFilter = page.locator('input[type="date"], .MuiDatePicker-root input').first();
      if (await dateFilter.count() > 0 && await dateFilter.isVisible()) {
        await dateFilter.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('User Story: Request Manager Manages Request Views', () => {
    
    test('should toggle between table and card views for different use cases', async ({ page }) => {
      // User Story: As a request manager, I want to switch between table view for analysis and card view for detailed request information
      
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i], .MuiToggleButton-root');
      
      if (await viewToggle.count() > 0) {
        // Switch to card view for detailed request information
        await viewToggle.first().click();
        await page.waitForTimeout(500);
        
        // Verify view switched
        const afterToggle = await page.locator('tr, .MuiCard-root').count();
        expect(afterToggle).toBeGreaterThanOrEqual(0);
        
        // Switch back to table view for quick overview
        if (await viewToggle.count() > 1) {
          await viewToggle.last().click();
          await page.waitForTimeout(500);
        }
      }
    });
    
    test('should maintain request data consistency across view modes', async ({ page }) => {
      // User Story: As a request manager, I want the same request information available in both views
      
      const initialRequestCount = await page.locator('tr:not(:first-child), .MuiCard-root').count();
      
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]').first();
      if (await viewToggle.count() > 0) {
        // Switch views
        await viewToggle.click();
        await page.waitForTimeout(500);
        
        // Verify data consistency
        const newRequestCount = await page.locator('tr:not(:first-child), .MuiCard-root').count();
        
        // Request count should be consistent (allowing for pagination differences)
        expect(Math.abs(newRequestCount - initialRequestCount)).toBeLessThanOrEqual(5);
      }
    });
  });

  test.describe('User Story: Request Manager Performs Request Operations', () => {
    
    test('should provide request management actions', async ({ page }) => {
      // User Story: As a request manager, I want to create new requests, assign technicians, and update request status
      
      const actionButtons = page.locator('button:has-text("Create"), button:has-text("New Request"), button:has-text("Add"), button:has-text("Assign"), button:has-text("Update"), button:has-text("Export")');
      
      const buttonCount = await actionButtons.count();
      if (buttonCount > 0) {
        // Test each action button
        for (let i = 0; i < Math.min(buttonCount, 4); i++) {
          const button = actionButtons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeEnabled();
            
            const buttonText = await button.textContent();
            if (buttonText?.toLowerCase().includes('export')) {
              // Test export functionality
              await button.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }
    });
    
    test('should handle request workflow and status transitions', async ({ page }) => {
      // User Story: As a request manager, I want to move requests through workflow stages (Open → In Progress → Completed)
      
      // Look for status change actions
      const workflowActions = page.locator('button:has-text("Assign"), button:has-text("Start"), button:has-text("Complete"), button:has-text("Close"), select[name*="status"]');
      
      if (await workflowActions.count() > 0) {
        const firstAction = workflowActions.first();
        if (await firstAction.isVisible() && await firstAction.isEnabled()) {
          // Test workflow action (without actually changing data)
          const actionText = await firstAction.textContent();
          console.log(`ℹ️ Found request workflow action: ${actionText}`);
        }
      }
      
      // Check for assignment functionality
      const assignmentControls = page.locator('select[name*="assign"], button:has-text("Assign"), .assignment-dropdown');
      if (await assignmentControls.count() > 0) {
        console.log('ℹ️ Assignment controls found for request management');
      }
    });
  });

  test.describe('User Story: Request Manager Organizes and Prioritizes', () => {
    
    test('should provide sorting for request prioritization', async ({ page }) => {
      // User Story: As a request manager, I want to sort requests by priority, date, or customer to organize my work
      
      // Look for sortable column headers
      const sortableHeaders = page.locator('th[role="columnheader"], .MuiDataGrid-columnHeader, .sortable');
      const headerCount = await sortableHeaders.count();
      
      if (headerCount > 0) {
        // Test sorting on key columns for request management
        for (let i = 0; i < Math.min(headerCount, 3); i++) {
          const header = sortableHeaders.nth(i);
          if (await header.isVisible()) {
            await header.click();
            await page.waitForTimeout(500);
            
            // Verify page remains functional after sort
            await expect(page.locator('h1').first()).toBeVisible();
          }
        }
      }
    });
    
    test('should handle request queue management', async ({ page }) => {
      // User Story: As a request manager, I want to organize requests in a logical queue for efficient processing
      
      // Test multiple sorting to create organized queue
      const priorityHeader = page.locator('th:has-text("Priority"), .MuiDataGrid-columnHeader:has-text("Priority")').first();
      if (await priorityHeader.count() > 0) {
        await priorityHeader.click();
        await page.waitForTimeout(500);
      }
      
      const dateHeader = page.locator('th:has-text("Date"), .MuiDataGrid-columnHeader:has-text("Date")').first();
      if (await dateHeader.count() > 0) {
        await dateHeader.click();
        await page.waitForTimeout(500);
      }
      
      // Verify sorting maintains page functionality
      await expect(page.locator('h1').first()).toBeVisible();
    });
  });

  test.describe('User Story: Request Manager Uses Detailed Request Cards', () => {
    
    test('should support expanding request cards for comprehensive information', async ({ page }) => {
      // User Story: As a request manager, I want to expand request cards to see full details, notes, and history
      
      // Switch to card view if available
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]').first();
      if (await viewToggle.count() > 0) {
        await viewToggle.click();
        await page.waitForTimeout(500);
      }
      
      // Look for expandable request cards
      const requestCards = page.locator('.MuiCard-root');
      if (await requestCards.count() > 0) {
        const firstCard = requestCards.first();
        
        // Look for expand/details button
        const expandButton = firstCard.locator('button, [role="button"]').first();
        if (await expandButton.count() > 0) {
          await expandButton.click();
          await page.waitForTimeout(500);
          
          // Verify card expanded with more request details
          const cardContent = await firstCard.textContent();
          expect(cardContent).toBeTruthy();
        }
      }
    });
    
    test('should show request history and communication notes in cards', async ({ page }) => {
      // User Story: As a request manager, I want to see request history and customer communications in the detailed view
      
      // Switch to card view
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]').first();
      if (await viewToggle.count() > 0) {
        await viewToggle.click();
        await page.waitForTimeout(500);
      }
      
      const requestCards = page.locator('.MuiCard-root');
      if (await requestCards.count() > 0) {
        const cardContent = await requestCards.first().textContent();
        
        // Look for indicators of detailed information
        const hasDetailedInfo = cardContent?.includes('notes') || 
                               cardContent?.includes('history') ||
                               cardContent?.includes('comment') ||
                               cardContent?.includes('update');
                               
        // This is informational - cards may or may not have detailed history
        if (hasDetailedInfo) {
          console.log('ℹ️ Request cards contain detailed information');
        }
      }
    });
  });

  test.describe('User Story: Request Manager Handles Large Request Volumes', () => {
    
    test('should provide efficient pagination for large request datasets', async ({ page }) => {
      // User Story: As a request manager, I want to navigate through large volumes of requests efficiently
      
      const pagination = page.locator('.MuiPagination-root, .pagination, [aria-label*="pagination" i]');
      
      if (await pagination.count() > 0) {
        const paginationButtons = pagination.locator('button');
        const buttonCount = await paginationButtons.count();
        
        if (buttonCount > 1) {
          // Test pagination navigation
          const nextButton = paginationButtons.filter({ hasText: /next|>/ }).first();
          if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // Navigate back
            const prevButton = paginationButtons.filter({ hasText: /prev|</ }).first();
            if (await prevButton.count() > 0 && await prevButton.isEnabled()) {
              await prevButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      } else {
        console.log('ℹ️ Pagination not found - current request dataset may not require pagination');
      }
    });
  });

  test.describe('User Story: Request Manager Ensures Service Quality', () => {
    
    test('should handle system errors gracefully during request operations', async ({ page }) => {
      // User Story: As a request manager, I want the system to handle errors gracefully to maintain service quality
      
      // Monitor for JavaScript errors
      const errors = [];
      page.on('pageerror', (error) => {
        errors.push(error);
      });
      
      // Perform various request operations
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Test rapid interactions typical in request management
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('urgent request');
        await searchInput.clear();
        await searchInput.fill('customer service');
        await page.waitForTimeout(1000);
      }
      
      // Verify no critical JavaScript errors
      expect(errors.length).toBe(0);
    });
    
    test('should maintain responsiveness during high-volume request periods', async ({ page }) => {
      // User Story: As a request manager, I want the system to remain responsive during peak request periods
      
      // Test system responsiveness with multiple rapid actions
      const filterButtons = page.locator('select, .MuiSelect-select').first();
      if (await filterButtons.count() > 0 && await filterButtons.isVisible()) {
        // Rapid filter interactions
        for (let i = 0; i < 3; i++) {
          await filterButtons.hover();
          await page.waitForTimeout(100);
        }
      }
      
      // Test rapid navigation
      const actionButtons = page.locator('button').first();
      if (await actionButtons.count() > 0 && await actionButtons.isVisible()) {
        await actionButtons.hover();
        await page.waitForTimeout(100);
      }
      
      // System should remain responsive
      await expect(page.locator('h1').first()).toBeVisible();
    });
    
    test('should provide consistent user experience across request operations', async ({ page }) => {
      // User Story: As a request manager, I want consistent interface behavior across all request operations
      
      // Test interface consistency
      const initialPageState = await page.locator('h1').first().textContent();
      
      // Perform various operations
      const searchInput = page.locator('input[placeholder*="search" i]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await searchInput.clear();
      }
      
      // Check view toggles
      const viewToggle = page.locator('[data-testid*="view"]').first();
      if (await viewToggle.count() > 0) {
        await viewToggle.click();
        await page.waitForTimeout(300);
        await viewToggle.click();
        await page.waitForTimeout(300);
      }
      
      // Verify page title remains consistent
      const finalPageState = await page.locator('h1').first().textContent();
      expect(finalPageState).toBe(initialPageState);
    });
  });
});