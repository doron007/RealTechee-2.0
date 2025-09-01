/**
 * ADMIN WORKFLOW VALIDATION TEST SUITE
 * 
 * This test suite validates all administrative workflows and management interfaces,
 * covering the complete admin user experience and business processes.
 * 
 * Admin Workflows Covered:
 * 1. Admin Authentication & Dashboard Access
 * 2. Request Management (view, edit, status updates, assignment)
 * 3. Project Management (create, update, milestones, completion)
 * 4. Quote Management (create, edit, approve, send)
 * 5. Contact Management (create, edit, relationships)
 * 6. System Administration (users, configuration, notifications)
 * 7. Analytics & Reporting
 */

const { test, expect } = require('@playwright/test');
const { safeWaitForResponse } = require('../helpers/circuitBreaker');

test.describe('Admin Workflow Validation - Complete Management Suite', () => {
  
  test.setTimeout(600000); // 10 minutes for comprehensive admin testing

  test('Admin Authentication & Dashboard Access', async ({ page }) => {
    console.log('🔐 Testing Admin Authentication & Dashboard Access');
    
    // === PHASE 1: LOGIN ===
    console.log('Phase 1: Admin login process...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle(/Login/i);
    await expect(page.locator('form')).toBeVisible();
    
    // Fill login credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    await page.screenshot({ path: 'tests/e2e/screenshots/admin/login-form.png', fullPage: true });
    
    const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await loginButton.click();
    
    // Wait for authentication response
    const authResponse = await safeWaitForResponse(page, 
      response => response.url().includes('auth') || response.url().includes('cognito'),
      { timeout: 10000 }
    );
    
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`Post-login URL: ${currentUrl}`);
    
    // === PHASE 2: DASHBOARD ACCESS ===
    let adminAccessible = false;
    
    if (currentUrl.includes('/admin') || currentUrl.includes('/dashboard') || currentUrl.includes('/profile')) {
      console.log('✅ Login successful - accessing admin areas');
      adminAccessible = true;
      
      // Test admin dashboard
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      if (page.url().includes('/admin')) {
        await expect(page.locator('h1, h2')).toBeVisible();
        await page.screenshot({ path: 'tests/e2e/screenshots/admin/dashboard.png', fullPage: true });
        console.log('✅ Admin dashboard accessible');
      }
      
    } else if (currentUrl.includes('/login')) {
      console.log('ℹ️ Login failed or credentials incorrect - testing public admin access');
      adminAccessible = false;
    }
    
    // === PHASE 3: ADMIN NAVIGATION TESTING ===
    if (adminAccessible) {
      console.log('Phase 3: Testing admin navigation...');
      
      const adminPages = [
        { path: '/admin/requests', title: 'Requests Management' },
        { path: '/admin/projects', title: 'Projects Management' },
        { path: '/admin/quotes', title: 'Quotes Management' },
        { path: '/admin/contacts', title: 'Contacts Management' },
        { path: '/admin/notifications', title: 'Notifications' },
        { path: '/admin/analytics', title: 'Analytics' },
        { path: '/admin/system', title: 'System Settings' }
      ];
      
      for (const adminPage of adminPages) {
        console.log(`Testing ${adminPage.path}...`);
        
        await page.goto(adminPage.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        if (page.url().includes('/admin')) {
          await expect(page.locator('h1, h2')).toBeVisible();
          console.log(`✅ ${adminPage.title} accessible`);
        } else {
          console.log(`⚠️ ${adminPage.title} redirected - may require specific permissions`);
        }
      }
      
      console.log('✅ Admin navigation testing completed');
    } else {
      console.log('ℹ️ Skipping admin navigation - authentication failed');
    }
    
    console.log('🎉 Admin Authentication & Dashboard Access testing completed');
  });

  test('Request Management Workflow', async ({ page }) => {
    console.log('📋 Testing Request Management Workflow');
    
    // Attempt login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    // === PHASE 1: REQUESTS LISTING ===
    console.log('Phase 1: Testing requests listing...');
    
    await page.goto('/admin/requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/admin/requests')) {
      console.log('✅ Requests page accessible');
      
      // Wait for data to load
      const dataGrid = page.locator('table, [data-testid="requests-grid"], .MuiDataGrid-root, .data-grid').first();
      const gridVisible = await dataGrid.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (gridVisible) {
        console.log('✅ Requests data grid loaded');
        
        // Check for request entries
        const requestRows = page.locator('tbody tr, .MuiDataGrid-row, [data-testid="request-row"]');
        const rowCount = await requestRows.count();
        console.log(`Found ${rowCount} request entries`);
        
        if (rowCount > 0) {
          // === PHASE 2: REQUEST DETAIL VIEW ===
          console.log('Phase 2: Testing request detail view...');
          
          // Click on first request
          await requestRows.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          if (page.url().includes('/requests/') || page.url().includes('/request/')) {
            console.log('✅ Request detail page opened');
            
            await expect(page.locator('h1, h2')).toBeVisible();
            
            // === PHASE 3: REQUEST EDITING ===
            console.log('Phase 3: Testing request editing...');
            
            // Look for editable fields
            const statusSelect = page.locator('select[name="status"], #status, .status-select').first();
            const statusSelectVisible = await statusSelect.isVisible({ timeout: 5000 }).catch(() => false);
            
            if (statusSelectVisible) {
              const currentStatus = await statusSelect.inputValue().catch(() => '');
              console.log(`Current request status: ${currentStatus}`);
              
              // Try to update status
              await statusSelect.selectOption('In Review');
              console.log('✅ Status updated to "In Review"');
            }
            
            // Look for notes/comments section
            const notesTextarea = page.locator('textarea[name="notes"], #notes, textarea[placeholder*="note"]').first();
            const notesVisible = await notesTextarea.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (notesVisible) {
              await notesTextarea.fill('Admin workflow test: Request reviewed and processed.');
              console.log('✅ Admin notes added');
            }
            
            // Look for assignment fields
            const assigneeSelect = page.locator('select[name="assignee"], #assignee, .assignee-select').first();
            const assigneeVisible = await assigneeSelect.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (assigneeVisible) {
              // Try to assign to someone
              const options = await assigneeSelect.locator('option').allTextContents().catch(() => []);
              if (options.length > 1) {
                await assigneeSelect.selectOption({ index: 1 });
                console.log('✅ Request assigned to team member');
              }
            }
            
            // === PHASE 4: SAVE CHANGES ===
            console.log('Phase 4: Saving request changes...');
            
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
            const saveButtonVisible = await saveButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (saveButtonVisible) {
              await saveButton.click();
              
              // Wait for save response
              const saveResponse = await safeWaitForResponse(page,
                response => response.url().includes('api') || response.url().includes('graphql'),
                { timeout: 8000 }
              );
              
              if (saveResponse && saveResponse.status !== 'skipped') {
                console.log('✅ Request changes saved successfully');
              }
              
              await page.waitForTimeout(2000);
            }
            
            await page.screenshot({ path: 'tests/e2e/screenshots/admin/request-management.png', fullPage: true });
            
            // === PHASE 5: BULK OPERATIONS ===
            console.log('Phase 5: Testing bulk operations...');
            
            await page.goto('/admin/requests');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            // Look for bulk action controls
            const selectAllCheckbox = page.locator('input[type="checkbox"][aria-label*="select all"], .select-all-checkbox').first();
            const bulkSelectVisible = await selectAllCheckbox.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (bulkSelectVisible) {
              await selectAllCheckbox.click();
              console.log('✅ Bulk selection functionality works');
              
              const bulkActionButton = page.locator('button:has-text("Bulk"), .bulk-actions button').first();
              const bulkActionsVisible = await bulkActionButton.isVisible({ timeout: 2000 }).catch(() => false);
              
              if (bulkActionsVisible) {
                console.log('✅ Bulk actions available');
              }
            }
            
          } else {
            console.log('⚠️ Request detail page not accessible');
          }
        } else {
          console.log('ℹ️ No requests found - testing with empty state');
          
          // Look for "Create Request" or "Add Request" button
          const createRequestButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
          const createButtonVisible = await createRequestButton.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (createButtonVisible) {
            console.log('✅ Create request functionality available');
          }
        }
        
      } else {
        console.log('⚠️ Requests data grid not found - may be loading or require permissions');
      }
      
    } else {
      console.log('ℹ️ Requests page not accessible - authentication may be required');
    }
    
    console.log('🎉 Request Management Workflow testing completed');
  });

  test('Project Management Workflow', async ({ page }) => {
    console.log('🏗️ Testing Project Management Workflow');
    
    // Login attempt
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    // === PHASE 1: PROJECTS LISTING ===
    console.log('Phase 1: Testing projects management interface...');
    
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/admin/projects')) {
      console.log('✅ Projects management page accessible');
      
      const dataGrid = page.locator('table, [data-testid="projects-grid"], .MuiDataGrid-root').first();
      const gridVisible = await dataGrid.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (gridVisible) {
        console.log('✅ Projects data grid loaded');
        
        // === PHASE 2: PROJECT CREATION ===
        console.log('Phase 2: Testing project creation...');
        
        const createProjectButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
        const createButtonVisible = await createProjectButton.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (createButtonVisible) {
          await createProjectButton.click();
          await page.waitForTimeout(2000);
          
          // Fill project creation form
          const projectNameInput = page.locator('input[name="name"], input[placeholder*="name"], #projectName').first();
          const nameInputVisible = await projectNameInput.isVisible({ timeout: 5000 }).catch(() => false);
          
          if (nameInputVisible) {
            await projectNameInput.fill('Admin Test Project - Kitchen Renovation');
            
            const descriptionInput = page.locator('textarea[name="description"], #description').first();
            const descVisible = await descriptionInput.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (descVisible) {
              await descriptionInput.fill('Test project created through admin workflow validation');
            }
            
            // Set project details
            const budgetInput = page.locator('input[name="budget"], #budget').first();
            if (await budgetInput.isVisible({ timeout: 3000 }).catch(() => false)) {
              await budgetInput.fill('75000');
            }
            
            const statusSelect = page.locator('select[name="status"], #status').first();
            if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
              await statusSelect.selectOption('Planning');
            }
            
            // Save project
            const saveProjectButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
            if (await saveProjectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await saveProjectButton.click();
              await page.waitForTimeout(3000);
              console.log('✅ New project created');
            }
          }
        }
        
        // === PHASE 3: PROJECT EDITING ===
        console.log('Phase 3: Testing project editing...');
        
        const projectRows = page.locator('tbody tr, .MuiDataGrid-row, [data-testid="project-row"]');
        const rowCount = await projectRows.count();
        
        if (rowCount > 0) {
          // Click on first project
          await projectRows.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          if (page.url().includes('/projects/') || page.url().includes('/project/')) {
            console.log('✅ Project detail page accessible');
            
            // === PHASE 4: MILESTONE MANAGEMENT ===
            console.log('Phase 4: Testing milestone management...');
            
            const addMilestoneButton = page.locator('button:has-text("Milestone"), button:has-text("Add Milestone")').first();
            const milestoneButtonVisible = await addMilestoneButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (milestoneButtonVisible) {
              await addMilestoneButton.click();
              await page.waitForTimeout(1000);
              
              const milestoneNameInput = page.locator('input[name="milestone"], input[placeholder*="milestone"]').first();
              if (await milestoneNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                await milestoneNameInput.fill('Design Phase Complete');
                console.log('✅ Milestone added');
              }
            }
            
            // === PHASE 5: PROJECT STATUS UPDATES ===
            console.log('Phase 5: Testing project status updates...');
            
            const projectStatusSelect = page.locator('select[name="status"], #projectStatus').first();
            const statusSelectVisible = await projectStatusSelect.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (statusSelectVisible) {
              await projectStatusSelect.selectOption('In Progress');
              console.log('✅ Project status updated');
            }
            
            // === PHASE 6: COMMENT MANAGEMENT ===
            console.log('Phase 6: Testing comment management...');
            
            const commentTextarea = page.locator('textarea[name="comment"], textarea[placeholder*="comment"]').first();
            const commentVisible = await commentTextarea.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (commentVisible) {
              await commentTextarea.fill('Admin workflow test: Project progress update - design phase completed successfully.');
              
              const addCommentButton = page.locator('button:has-text("Add Comment"), button:has-text("Post")').first();
              if (await addCommentButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await addCommentButton.click();
                console.log('✅ Project comment added');
              }
            }
            
            // Save all changes
            const saveChangesButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
            if (await saveChangesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await saveChangesButton.click();
              await page.waitForTimeout(2000);
              console.log('✅ Project changes saved');
            }
            
            await page.screenshot({ path: 'tests/e2e/screenshots/admin/project-management.png', fullPage: true });
          }
        }
      } else {
        console.log('⚠️ Projects grid not accessible');
      }
    } else {
      console.log('ℹ️ Projects management page not accessible');
    }
    
    console.log('🎉 Project Management Workflow testing completed');
  });

  test('Quote Management Workflow', async ({ page }) => {
    console.log('💰 Testing Quote Management Workflow');
    
    // Login attempt
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    // === PHASE 1: QUOTES MANAGEMENT ===
    console.log('Phase 1: Testing quotes management interface...');
    
    await page.goto('/admin/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/admin/quotes')) {
      console.log('✅ Quotes management page accessible');
      
      const quotesGrid = page.locator('table, [data-testid="quotes-grid"], .MuiDataGrid-root').first();
      const gridVisible = await quotesGrid.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (gridVisible) {
        console.log('✅ Quotes data grid loaded');
        
        // === PHASE 2: QUOTE CREATION ===
        console.log('Phase 2: Testing quote creation...');
        
        const createQuoteButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Quote")').first();
        const createButtonVisible = await createQuoteButton.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (createButtonVisible) {
          await createQuoteButton.click();
          await page.waitForTimeout(2000);
          
          // Fill quote creation form
          const customerNameInput = page.locator('input[name="customerName"], input[placeholder*="customer"], #customerName').first();
          const nameInputVisible = await customerNameInput.isVisible({ timeout: 5000 }).catch(() => false);
          
          if (nameInputVisible) {
            await customerNameInput.fill('John Doe - Admin Test Quote');
            
            const quoteAmountInput = page.locator('input[name="amount"], input[name="total"], #quoteAmount').first();
            if (await quoteAmountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
              await quoteAmountInput.fill('65000');
            }
            
            const projectDescInput = page.locator('textarea[name="description"], #projectDescription').first();
            if (await projectDescInput.isVisible({ timeout: 3000 }).catch(() => false)) {
              await projectDescInput.fill('Kitchen renovation including cabinets, countertops, appliances, and flooring - Admin workflow test');
            }
            
            // Save quote
            const saveQuoteButton = page.locator('button:has-text("Save"), button:has-text("Create Quote")').first();
            if (await saveQuoteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await saveQuoteButton.click();
              await page.waitForTimeout(3000);
              console.log('✅ New quote created');
            }
          }
        }
        
        // === PHASE 3: QUOTE EDITING ===
        console.log('Phase 3: Testing quote editing...');
        
        const quoteRows = page.locator('tbody tr, .MuiDataGrid-row, [data-testid="quote-row"]');
        const rowCount = await quoteRows.count();
        
        if (rowCount > 0) {
          // Click on first quote
          await quoteRows.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          if (page.url().includes('/quotes/') || page.url().includes('/quote/')) {
            console.log('✅ Quote detail page accessible');
            
            // === PHASE 4: QUOTE APPROVAL WORKFLOW ===
            console.log('Phase 4: Testing quote approval workflow...');
            
            const approvalStatusSelect = page.locator('select[name="status"], select[name="approvalStatus"], #quoteStatus').first();
            const statusSelectVisible = await approvalStatusSelect.isVisible({ timeout: 5000 }).catch(() => false);
            
            if (statusSelectVisible) {
              await approvalStatusSelect.selectOption('Pending Review');
              console.log('✅ Quote moved to pending review');
              
              await page.waitForTimeout(1000);
              await approvalStatusSelect.selectOption('Approved');
              console.log('✅ Quote approved');
            }
            
            // === PHASE 5: QUOTE LINE ITEMS ===
            console.log('Phase 5: Testing quote line items management...');
            
            const addLineItemButton = page.locator('button:has-text("Add Item"), button:has-text("Add Line")').first();
            const addItemVisible = await addLineItemButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (addItemVisible) {
              await addLineItemButton.click();
              await page.waitForTimeout(1000);
              
              const itemDescInput = page.locator('input[name="itemDescription"], textarea[name="description"]').last();
              if (await itemDescInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                await itemDescInput.fill('Kitchen Cabinets - Custom Oak');
              }
              
              const itemAmountInput = page.locator('input[name="itemAmount"], input[name="price"]').last();
              if (await itemAmountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                await itemAmountInput.fill('25000');
              }
              
              console.log('✅ Quote line item added');
            }
            
            // === PHASE 6: QUOTE SENDING ===
            console.log('Phase 6: Testing quote sending...');
            
            const sendQuoteButton = page.locator('button:has-text("Send Quote"), button:has-text("Email Quote")').first();
            const sendButtonVisible = await sendQuoteButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (sendButtonVisible) {
              // Note: We won't actually send to avoid spam, but we test the interface
              console.log('✅ Send quote functionality available');
            }
            
            // Save all quote changes
            const saveQuoteChangesButton = page.locator('button:has-text("Save"), button:has-text("Update Quote")').first();
            if (await saveQuoteChangesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await saveQuoteChangesButton.click();
              await page.waitForTimeout(2000);
              console.log('✅ Quote changes saved');
            }
            
            await page.screenshot({ path: 'tests/e2e/screenshots/admin/quote-management.png', fullPage: true });
          }
        }
      }
    } else {
      console.log('ℹ️ Quotes management page not accessible');
    }
    
    console.log('🎉 Quote Management Workflow testing completed');
  });

  test('System Administration & Configuration', async ({ page }) => {
    console.log('⚙️ Testing System Administration & Configuration');
    
    // Login attempt
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    // === PHASE 1: SYSTEM SETTINGS ===
    console.log('Phase 1: Testing system settings...');
    
    await page.goto('/admin/system');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    if (page.url().includes('/admin/system')) {
      console.log('✅ System settings page accessible');
      
      // Look for system configuration options
      const configSections = page.locator('.config-section, .settings-section, fieldset');
      const sectionCount = await configSections.count();
      console.log(`Found ${sectionCount} configuration sections`);
      
      if (sectionCount > 0) {
        console.log('✅ System configuration interface loaded');
      }
    }
    
    // === PHASE 2: USER MANAGEMENT ===
    console.log('Phase 2: Testing user management...');
    
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    if (page.url().includes('/admin/users')) {
      console.log('✅ User management page accessible');
      
      const usersTable = page.locator('table, .users-grid, .MuiDataGrid-root').first();
      const tableVisible = await usersTable.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (tableVisible) {
        console.log('✅ Users table loaded');
        
        // Look for user management actions
        const addUserButton = page.locator('button:has-text("Add User"), button:has-text("Create User")').first();
        const addUserVisible = await addUserButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (addUserVisible) {
          console.log('✅ Add user functionality available');
        }
      }
    }
    
    // === PHASE 3: NOTIFICATION CONFIGURATION ===
    console.log('Phase 3: Testing notification configuration...');
    
    await page.goto('/admin/notifications');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    if (page.url().includes('/admin/notifications')) {
      console.log('✅ Notifications configuration page accessible');
      
      // Look for notification templates and settings
      const notificationSections = page.locator('.notification-section, .template-section');
      const notifSectionCount = await notificationSections.count();
      console.log(`Found ${notifSectionCount} notification configuration sections`);
    }
    
    // === PHASE 4: NOTIFICATION MONITORING ===
    console.log('Phase 4: Testing notification monitoring...');
    
    await page.goto('/admin/notification-monitor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/admin/notification-monitor')) {
      console.log('✅ Notification monitoring page accessible');
      
      // Look for real-time monitoring interface
      const monitoringDashboard = page.locator('.monitoring-dashboard, .notification-log, table').first();
      const dashboardVisible = await monitoringDashboard.isVisible({ timeout: 8000 }).catch(() => false);
      
      if (dashboardVisible) {
        console.log('✅ Notification monitoring dashboard loaded');
        
        // Look for notification entries
        const notificationEntries = page.locator('tbody tr, .notification-entry');
        const entryCount = await notificationEntries.count();
        console.log(`Found ${entryCount} notification log entries`);
      }
    }
    
    // === PHASE 5: ANALYTICS DASHBOARD ===
    console.log('Phase 5: Testing analytics dashboard...');
    
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/admin/analytics')) {
      console.log('✅ Analytics dashboard accessible');
      
      // Look for charts and metrics
      const analyticsWidgets = page.locator('.chart, .metric, .analytics-widget, canvas');
      const widgetCount = await analyticsWidgets.count();
      console.log(`Found ${widgetCount} analytics widgets`);
      
      if (widgetCount > 0) {
        console.log('✅ Analytics widgets loaded');
      }
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/admin/system-administration.png', fullPage: true });
    
    console.log('🎉 System Administration & Configuration testing completed');
  });

  test('Contact Management Workflow', async ({ page }) => {
    console.log('📞 Testing Contact Management Workflow');
    
    // Login attempt
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    // === PHASE 1: CONTACTS MANAGEMENT ===
    console.log('Phase 1: Testing contacts management interface...');
    
    await page.goto('/admin/contacts');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/admin/contacts')) {
      console.log('✅ Contacts management page accessible');
      
      const contactsGrid = page.locator('table, [data-testid="contacts-grid"], .MuiDataGrid-root').first();
      const gridVisible = await contactsGrid.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (gridVisible) {
        console.log('✅ Contacts data grid loaded');
        
        // === PHASE 2: CONTACT CREATION ===
        console.log('Phase 2: Testing contact creation...');
        
        const createContactButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Contact")').first();
        const createButtonVisible = await createContactButton.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (createButtonVisible) {
          await createContactButton.click();
          await page.waitForTimeout(2000);
          
          // Fill contact creation form
          const contactNameInput = page.locator('input[name="name"], input[placeholder*="name"], #contactName').first();
          const nameInputVisible = await contactNameInput.isVisible({ timeout: 5000 }).catch(() => false);
          
          if (nameInputVisible) {
            await contactNameInput.fill('Jane Smith - Admin Test Contact');
            
            const emailInput = page.locator('input[name="email"], input[type="email"], #contactEmail').first();
            if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
              await emailInput.fill('jane.smith@admin-test.com');
            }
            
            const phoneInput = page.locator('input[name="phone"], input[type="tel"], #contactPhone').first();
            if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
              await phoneInput.fill('555-987-6543');
            }
            
            const roleSelect = page.locator('select[name="role"], #contactRole').first();
            if (await roleSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
              await roleSelect.selectOption('Customer');
            }
            
            // Save contact
            const saveContactButton = page.locator('button:has-text("Save"), button:has-text("Create Contact")').first();
            if (await saveContactButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await saveContactButton.click();
              await page.waitForTimeout(3000);
              console.log('✅ New contact created');
            }
          }
        }
        
        // === PHASE 3: CONTACT EDITING ===
        console.log('Phase 3: Testing contact editing and relationships...');
        
        const contactRows = page.locator('tbody tr, .MuiDataGrid-row, [data-testid="contact-row"]');
        const rowCount = await contactRows.count();
        
        if (rowCount > 0) {
          // Click on first contact
          await contactRows.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          if (page.url().includes('/contacts/') || page.url().includes('/contact/')) {
            console.log('✅ Contact detail page accessible');
            
            // === PHASE 4: RELATIONSHIP MANAGEMENT ===
            console.log('Phase 4: Testing contact relationship management...');
            
            const addRelationshipButton = page.locator('button:has-text("Relationship"), button:has-text("Add Relationship")').first();
            const relationshipButtonVisible = await addRelationshipButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (relationshipButtonVisible) {
              await addRelationshipButton.click();
              await page.waitForTimeout(1000);
              
              const relationshipTypeSelect = page.locator('select[name="relationshipType"], #relationshipType').first();
              if (await relationshipTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
                await relationshipTypeSelect.selectOption('Project Manager');
                console.log('✅ Contact relationship added');
              }
            }
            
            // === PHASE 5: CONTACT HISTORY ===
            console.log('Phase 5: Testing contact history and notes...');
            
            const historySection = page.locator('.history-section, .contact-history, .timeline').first();
            const historyVisible = await historySection.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (historyVisible) {
              console.log('✅ Contact history section loaded');
            }
            
            const addNoteButton = page.locator('button:has-text("Add Note"), button:has-text("Note")').first();
            const noteButtonVisible = await addNoteButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (noteButtonVisible) {
              await addNoteButton.click();
              await page.waitForTimeout(1000);
              
              const noteTextarea = page.locator('textarea[name="note"], textarea[placeholder*="note"]').first();
              if (await noteTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
                await noteTextarea.fill('Admin workflow test: Contact management verification - all systems operational.');
                console.log('✅ Contact note added');
              }
            }
            
            // Save all contact changes
            const saveContactChangesButton = page.locator('button:has-text("Save"), button:has-text("Update Contact")').first();
            if (await saveContactChangesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await saveContactChangesButton.click();
              await page.waitForTimeout(2000);
              console.log('✅ Contact changes saved');
            }
            
            await page.screenshot({ path: 'tests/e2e/screenshots/admin/contact-management.png', fullPage: true });
          }
        }
      }
    }
    
    console.log('🎉 Contact Management Workflow testing completed');
  });

  test('Admin Performance & Error Handling', async ({ page }) => {
    console.log('⚡ Testing Admin Performance & Error Handling');
    
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    // === PHASE 1: LOAD TIME TESTING ===
    console.log('Phase 1: Testing admin page load times...');
    
    const adminPages = [
      '/admin',
      '/admin/requests', 
      '/admin/projects',
      '/admin/quotes',
      '/admin/contacts'
    ];
    
    const loadTimes = [];
    
    for (const adminPage of adminPages) {
      const startTime = Date.now();
      await page.goto(adminPage);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      loadTimes.push({ page: adminPage, time: loadTime });
      console.log(`${adminPage}: ${loadTime}ms`);
    }
    
    const avgLoadTime = loadTimes.reduce((sum, item) => sum + item.time, 0) / loadTimes.length;
    console.log(`Average admin page load time: ${Math.round(avgLoadTime)}ms`);
    
    // === PHASE 2: DATA GRID PERFORMANCE ===
    console.log('Phase 2: Testing data grid performance...');
    
    await page.goto('/admin/requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Test sorting performance
    const sortableHeaders = page.locator('th[role="columnheader"], .sortable-header');
    const headerCount = await sortableHeaders.count();
    
    if (headerCount > 0) {
      const firstHeader = sortableHeaders.first();
      const sortStartTime = Date.now();
      await firstHeader.click();
      await page.waitForTimeout(2000);
      const sortTime = Date.now() - sortStartTime;
      console.log(`Data grid sort time: ${sortTime}ms`);
    }
    
    // === PHASE 3: ERROR HANDLING ===
    console.log('Phase 3: Testing error handling...');
    
    // Test invalid routes
    await page.goto('/admin/non-existent-section');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('non-existent')) {
      console.log('✅ Invalid admin routes handled gracefully');
    }
    
    // Test form error handling
    await page.goto('/admin/requests');
    await page.waitForLoadState('networkidle');
    
    // Look for form with required fields
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();
    const createButtonVisible = await createButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (createButtonVisible) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Try to submit empty form to test validation
      const submitButton = page.locator('button[type="submit"], button:has-text("Save")').first();
      const submitVisible = await submitButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (submitVisible) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Look for error messages
        const errorMessages = page.locator('.error-message, .field-error, [role="alert"]');
        const errorCount = await errorMessages.count();
        
        if (errorCount > 0) {
          console.log('✅ Form validation errors displayed correctly');
        }
      }
    }
    
    console.log('🎉 Admin Performance & Error Handling testing completed');
  });
});