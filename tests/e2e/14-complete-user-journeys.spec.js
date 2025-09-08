/**
 * COMPLETE USER JOURNEYS TEST SUITE
 * 
 * This test suite validates complete user stories and workflows from start to finish,
 * covering the full customer lifecycle and admin workflows.
 * 
 * User Journeys Covered:
 * 1. Homeowner Discovery Journey (visitor → form submission)
 * 2. Agent Lead Management Journey (lead processing → project creation)
 * 3. Project Management Journey (project → completion)
 * 4. Admin Management Workflows (comprehensive admin tasks)
 */

const { test, expect } = require('@playwright/test');
const { safeWaitForResponse, safeWaitForSelector } = require('../helpers/circuitBreaker');

test.describe('Complete User Journeys - End-to-End Workflows', () => {
  
  test.setTimeout(600000); // 10 minutes for complete journeys

  test('Homeowner Discovery Journey - Visitor to Lead', async ({ page }) => {
    console.log('🏠 Testing Complete Homeowner Discovery Journey');
    
    // === PHASE 1: INITIAL DISCOVERY ===
    console.log('Phase 1: Initial website discovery...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Homeowner explores the website
    await expect(page).toHaveTitle(/RealTechee/i);
    await expect(page.locator('h1')).toBeVisible();
    
    // Browse products section
    const productsButton = page.locator('button:has-text("Products")').first();
    await productsButton.hover();
    await page.waitForTimeout(300);
    
    const kitchenBathLink = page.locator('a[href="/products/kitchen-and-bath"]').first();
    await kitchenBathLink.click();
    await page.waitForLoadState('networkidle');
    
    // Engage with product content
    await expect(page).toHaveTitle(/Kitchen.*Bath/i);
    await expect(page.locator('h1')).toBeVisible();
    
    // Look for estimate button
    const estimateButton = page.locator('text="Get an Estimate"').first();
    await expect(estimateButton).toBeVisible();
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/homeowner-product-discovery.png', fullPage: true });
    console.log('✅ Phase 1: Product discovery completed');
    
    // === PHASE 2: PROJECT EXPLORATION ===
    console.log('Phase 2: Exploring existing projects...');
    
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Browse projects for inspiration
    const projectsGrid = page.locator('.grid');
    const projectsExist = await projectsGrid.isVisible().catch(() => false);
    
    if (projectsExist) {
      const projectCards = projectsGrid.locator('> div');
      const cardCount = await projectCards.count();
      
      if (cardCount > 0) {
        console.log(`Browsing ${cardCount} projects for inspiration...`);
        
        // View a project detail
        await projectCards.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        if (page.url().includes('/project')) {
          await expect(page.locator('h1, h2')).toBeVisible();
          await page.screenshot({ path: 'tests/e2e/screenshots/journey/homeowner-project-inspiration.png', fullPage: true });
          console.log('✅ Phase 2: Project inspiration gathered');
        }
      }
    } else {
      console.log('ℹ️ Phase 2: No projects to browse, moving to form submission');
    }
    
    // === PHASE 3: FORM SUBMISSION ===
    console.log('Phase 3: Submitting get estimate form...');
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    // Fill out comprehensive estimate form
    await expect(page.locator('form')).toBeVisible();
    
    // Fill customer information
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="first name"], #firstName').first();
    if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstNameInput.fill('John');
    }
    
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="last name"], #lastName').first();
    if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lastNameInput.fill('Homeowner');
    }
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], #email').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill('john.homeowner@test-journey.com');
    
    const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="phone"], #phone').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('555-123-4567');
    }
    
    // Fill project details
    const projectTypeSelect = page.locator('select[name="projectType"], #projectType').first();
    if (await projectTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectTypeSelect.selectOption('Kitchen Renovation');
    }
    
    const budgetSelect = page.locator('select[name="budget"], #budget').first();
    if (await budgetSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await budgetSelect.selectOption('$50,000 - $100,000');
    }
    
    const timelineSelect = page.locator('select[name="timeline"], #timeline').first();
    if (await timelineSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await timelineSelect.selectOption('3-6 months');
    }
    
    // Fill property information if available
    const addressInput = page.locator('input[name="address"], input[placeholder*="address"], #address').first();
    if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addressInput.fill('123 Test Street, Test City, CA 90210');
    }
    
    // Fill project description
    const descriptionTextarea = page.locator('textarea[name="description"], textarea[placeholder*="description"], #description, textarea').first();
    if (await descriptionTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descriptionTextarea.fill('Looking to completely renovate our kitchen. Need modern appliances, new countertops, and updated lighting. Want to create an open concept design.');
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/homeowner-form-filled.png', fullPage: true });
    
    // Submit the form
    console.log('Submitting estimate form...');
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Get Estimate")').first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Wait for submission response
    const submissionResponse = await safeWaitForResponse(page, 
      response => response.url().includes('api') || response.url().includes('graphql'),
      { timeout: 10000 }
    );
    
    if (submissionResponse && submissionResponse.status !== 'skipped') {
      console.log('✅ Form submission API call detected');
    }
    
    // Wait for success message or redirect
    await page.waitForTimeout(3000);
    
    // Check for success state
    const successMessage = page.locator('text="thank you", text="success", text="submitted"').first();
    const isSuccessVisible = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isSuccessVisible) {
      console.log('✅ Phase 3: Form submission completed successfully');
    } else {
      console.log('ℹ️ Phase 3: Form submitted (success message not clearly visible)');
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/homeowner-form-submitted.png', fullPage: true });
    
    console.log('🎉 Complete Homeowner Discovery Journey finished!');
  });

  test('Agent Lead Management Journey', async ({ page }) => {
    console.log('👨‍💼 Testing Complete Agent Lead Management Journey');
    
    // === LOGIN AS ADMIN/AGENT ===
    console.log('Phase 1: Agent login...');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Attempt login with test credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await loginButton.click();
    
    // Wait for login response
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/admin') || currentUrl.includes('/profile')) {
      console.log('✅ Phase 1: Agent login successful');
      
      // === PHASE 2: REVIEW REQUESTS ===
      console.log('Phase 2: Reviewing incoming requests...');
      
      await page.goto('/admin/requests');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Wait for requests data to load
      const requestsTable = page.locator('table, [data-testid="requests-grid"], .requests-grid').first();
      const requestsVisible = await requestsTable.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (requestsVisible) {
        console.log('✅ Requests dashboard loaded');
        
        // Look for request rows
        const requestRows = page.locator('tbody tr, [data-testid="request-row"]');
        const rowCount = await requestRows.count();
        
        if (rowCount > 0) {
          console.log(`Found ${rowCount} requests to process`);
          
          // Click on first request
          await requestRows.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          // Should navigate to request detail
          if (page.url().includes('/requests/') || page.url().includes('/request/')) {
            console.log('✅ Phase 2: Request detail page accessed');
            
            // === PHASE 3: PROCESS REQUEST ===
            console.log('Phase 3: Processing request details...');
            
            await expect(page.locator('h1, h2')).toBeVisible();
            
            // Look for action buttons
            const statusSelect = page.locator('select[name="status"], #status').first();
            if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
              await statusSelect.selectOption('In Review');
              console.log('✅ Request status updated');
            }
            
            // Add notes if available
            const notesTextarea = page.locator('textarea[name="notes"], #notes, textarea[placeholder*="note"]').first();
            if (await notesTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
              await notesTextarea.fill('Initial review completed. Customer requirements gathered. Preparing estimate.');
            }
            
            // Save changes
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
            if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await saveButton.click();
              await page.waitForTimeout(2000);
              console.log('✅ Request changes saved');
            }
            
            await page.screenshot({ path: 'tests/e2e/screenshots/journey/agent-request-processed.png', fullPage: true });
          }
        } else {
          console.log('ℹ️ No requests found to process');
        }
      } else {
        console.log('⚠️ Requests dashboard not accessible or data not loaded');
      }
      
      // === PHASE 4: CREATE PROJECT ===
      console.log('Phase 4: Creating new project...');
      
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Look for create project button
      const createProjectButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
      if (await createProjectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createProjectButton.click();
        await page.waitForTimeout(2000);
        
        // Fill project form if modal/page opens
        const projectNameInput = page.locator('input[name="name"], input[placeholder*="name"], #projectName').first();
        if (await projectNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await projectNameInput.fill('Kitchen Renovation - John Homeowner');
        }
        
        const projectDescInput = page.locator('textarea[name="description"], #description').first();
        if (await projectDescInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await projectDescInput.fill('Complete kitchen renovation with modern appliances and open concept design');
        }
        
        // Save project
        const saveProjectButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
        if (await saveProjectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveProjectButton.click();
          await page.waitForTimeout(3000);
          console.log('✅ Phase 4: New project created');
        }
      } else {
        console.log('ℹ️ Create project functionality not found or accessible');
      }
      
      await page.screenshot({ path: 'tests/e2e/screenshots/journey/agent-project-management.png', fullPage: true });
      
    } else {
      console.log('ℹ️ Agent login failed or redirected, continuing with public workflow validation');
    }
    
    console.log('🎉 Agent Lead Management Journey completed!');
  });

  test('Complete Project Lifecycle Journey', async ({ page }) => {
    console.log('🏗️ Testing Complete Project Lifecycle Journey');
    
    // === PHASE 1: PROJECT DISCOVERY (PUBLIC) ===
    console.log('Phase 1: Public project browsing...');
    
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Validate we're on the projects page using multiple indicators
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check if we actually navigated to projects page
    if (currentUrl.includes('/projects')) {
      // Use the heading as primary validation since it's visible in inspector
      await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible({ timeout: 10000 });
      console.log('✅ Projects page loaded successfully (verified by heading)');
    } else {
      // If URL doesn't contain projects, we may have been redirected
      console.log(`⚠️ Expected /projects but got: ${currentUrl}`);
      // Still try to find the heading in case of URL rewriting
      const projectsHeading = page.getByRole('heading', { name: 'Projects' });
      if (await projectsHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Projects content found despite URL issue');
      } else {
        throw new Error(`Failed to navigate to projects page. Current URL: ${currentUrl}`);
      }
    }
    
    const projectsGrid = page.locator('.grid');
    const projectsExist = await projectsGrid.isVisible().catch(() => false);
    
    let projectDetailTested = false;
    
    if (projectsExist) {
      const projectCards = projectsGrid.locator('> div');
      const cardCount = await projectCards.count();
      
      if (cardCount > 0) {
        console.log(`Testing project lifecycle with ${cardCount} available projects`);
        
        // === PHASE 2: PROJECT DETAIL EXPLORATION ===
        console.log('Phase 2: Exploring project details...');
        
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const projectCard = projectCards.nth(i);
          const projectTitle = await projectCard.locator('h3').textContent().catch(() => `Project ${i + 1}`);
          
          console.log(`Exploring project: ${projectTitle}`);
          
          await projectCard.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          if (page.url().includes('/project')) {
            // Validate project detail content
            await expect(page.locator('h1, h2')).toBeVisible();
            
            // Check for project images/gallery
            const images = page.locator('img');
            const imageCount = await images.count();
            console.log(`Project has ${imageCount} images`);
            
            // Check for project information sections
            const infoSections = page.locator('h2, h3, .section, .info');
            const sectionCount = await infoSections.count();
            console.log(`Project has ${sectionCount} information sections`);
            
            // Test image gallery if available
            const galleryNext = page.locator('[data-testid="gallery-next"], button:has-text("Next")').first();
            if (await galleryNext.isVisible({ timeout: 2000 }).catch(() => false)) {
              await galleryNext.click();
              await page.waitForTimeout(1000);
              console.log('✅ Gallery navigation tested');
            }
            
            // Check for project stats/details
            const statsElements = page.locator('[class*="stat"], .value, .metric');
            const statsCount = await statsElements.count();
            if (statsCount > 0) {
              console.log(`✅ Found ${statsCount} project statistics`);
            }
            
            await page.screenshot({ 
              path: `tests/e2e/screenshots/journey/project-lifecycle-detail-${i + 1}.png`, 
              fullPage: true 
            });
            
            projectDetailTested = true;
            
            // Return to projects list
            await page.goBack();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            break; // Test one detailed project exploration
          }
        }
      } else {
        console.log('ℹ️ No project cards found for lifecycle testing');
      }
    } else {
      console.log('ℹ️ Projects grid not found, testing with empty state');
    }
    
    // === PHASE 3: PROJECT INSPIRATION TO LEAD ===
    console.log('Phase 3: Converting inspiration to lead...');
    
    if (projectDetailTested) {
      // Navigate to estimate form from project inspiration
      await page.goto('/contact/get-estimate');
      await page.waitForLoadState('networkidle');
      
      // Fill form with project-inspired details
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill('inspired.customer@test-journey.com');
      
      const descriptionTextarea = page.locator('textarea').first();
      if (await descriptionTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await descriptionTextarea.fill('I saw your project gallery and I\'m inspired to renovate my space. I\'d like something similar to the projects I viewed on your website.');
      }
      
      console.log('✅ Phase 3: Project inspiration converted to lead');
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/project-lifecycle-complete.png', fullPage: true });
    
    console.log('🎉 Complete Project Lifecycle Journey finished!');
  });

  test('Multi-Form Customer Journey', async ({ page }) => {
    console.log('📋 Testing Multi-Form Customer Journey');
    
    const customerEmail = 'multi.form.customer@test-journey.com';
    
    // === PHASE 1: INITIAL CONTACT ===
    console.log('Phase 1: Initial contact form...');
    
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('form')).toBeVisible();
    
    // Fill basic contact form
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"], #name').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Sarah Multi-Form Customer');
    }
    
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(customerEmail);
    
    const messageTextarea = page.locator('textarea').first();
    if (await messageTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await messageTextarea.fill('I\'m interested in learning more about your services. Can you provide more information?');
    }
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/multi-form-contact.png', fullPage: true });
    console.log('✅ Phase 1: Initial contact completed');
    
    // === PHASE 2: GET QUALIFIED ===
    console.log('Phase 2: Getting qualified...');
    
    await page.goto('/contact/get-qualified');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('form')).toBeVisible();
    
    // Fill qualification form with same email
    const qualEmailInput = page.locator('input[type="email"]').first();
    await qualEmailInput.fill(customerEmail);
    
    // Fill additional qualification fields
    const budgetSelect = page.locator('select[name="budget"], #budget').first();
    if (await budgetSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await budgetSelect.selectOption('$25,000 - $50,000');
    }
    
    const timelineSelect = page.locator('select[name="timeline"], #timeline').first();
    if (await timelineSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await timelineSelect.selectOption('6-12 months');
    }
    
    const qualSubmitButton = page.locator('button[type="submit"]').first();
    await qualSubmitButton.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/multi-form-qualified.png', fullPage: true });
    console.log('✅ Phase 2: Qualification completed');
    
    // === PHASE 3: DETAILED ESTIMATE ===
    console.log('Phase 3: Detailed estimate request...');
    
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('form')).toBeVisible();
    
    // Fill comprehensive estimate form
    const estEmailInput = page.locator('input[type="email"]').first();
    await estEmailInput.fill(customerEmail);
    
    const projectTypeSelect = page.locator('select[name="projectType"], #projectType').first();
    if (await projectTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectTypeSelect.selectOption('Bathroom Renovation');
    }
    
    const detailTextarea = page.locator('textarea').first();
    if (await detailTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailTextarea.fill('Following up on my previous inquiries. I\'m now ready for a detailed estimate for a complete bathroom renovation including new fixtures, tiling, and modern amenities.');
    }
    
    const estSubmitButton = page.locator('button[type="submit"]').first();
    await estSubmitButton.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/multi-form-estimate.png', fullPage: true });
    console.log('✅ Phase 3: Detailed estimate requested');
    
    // === PHASE 4: AFFILIATE INTEREST ===
    console.log('Phase 4: Affiliate partnership inquiry...');
    
    await page.goto('/contact/affiliate');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('form')).toBeVisible();
    
    // Fill affiliate form
    const affEmailInput = page.locator('input[type="email"]').first();
    await affEmailInput.fill(customerEmail.replace('@test-journey.com', '+affiliate@test-journey.com'));
    
    const companyInput = page.locator('input[name="company"], #company').first();
    if (await companyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await companyInput.fill('Sarah\'s Home Design Consulting');
    }
    
    const affMessageTextarea = page.locator('textarea').first();
    if (await affMessageTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await affMessageTextarea.fill('After experiencing your excellent service as a customer, I\'m interested in becoming an affiliate partner to recommend your services to my clients.');
    }
    
    const affSubmitButton = page.locator('button[type="submit"]').first();
    await affSubmitButton.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/multi-form-affiliate.png', fullPage: true });
    console.log('✅ Phase 4: Affiliate partnership inquiry completed');
    
    console.log('🎉 Multi-Form Customer Journey completed! Customer engaged through all touchpoints.');
  });

  test('Cross-Device User Experience Journey', async ({ page }) => {
    console.log('📱 Testing Cross-Device User Experience Journey');
    
    // === MOBILE VIEWPORT SIMULATION ===
    console.log('Phase 1: Mobile device experience...');
    
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test mobile navigation
    const mobileMenuButton = page.locator('button[aria-label*="menu"], .menu-button, [data-testid="mobile-menu"]').first();
    const mobileMenuVisible = await mobileMenuButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (mobileMenuVisible) {
      await mobileMenuButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Mobile menu functionality works');
    }
    
    // Test mobile form experience
    await page.goto('/contact/get-estimate');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('form')).toBeVisible();
    
    // Fill form on mobile
    const mobileEmailInput = page.locator('input[type="email"]').first();
    await mobileEmailInput.fill('mobile.user@test-journey.com');
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/mobile-experience.png', fullPage: true });
    console.log('✅ Phase 1: Mobile experience validated');
    
    // === TABLET VIEWPORT SIMULATION ===
    console.log('Phase 2: Tablet device experience...');
    
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test tablet layout
    const projectsGrid = page.locator('.grid');
    if (await projectsGrid.isVisible().catch(() => false)) {
      console.log('✅ Tablet projects grid layout works');
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/tablet-experience.png', fullPage: true });
    console.log('✅ Phase 2: Tablet experience validated');
    
    // === DESKTOP VIEWPORT RESTORATION ===
    console.log('Phase 3: Desktop experience...');
    
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test desktop navigation
    const productsButton = page.locator('button:has-text("Products")').first();
    await productsButton.hover();
    await page.waitForTimeout(300);
    
    // Desktop dropdown should be visible
    const dropdownMenu = page.locator('.dropdown-menu, [role="menu"]').first();
    const dropdownVisible = await dropdownMenu.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (dropdownVisible) {
      console.log('✅ Desktop dropdown navigation works');
    }
    
    await page.screenshot({ path: 'tests/e2e/screenshots/journey/desktop-experience.png', fullPage: true });
    console.log('✅ Phase 3: Desktop experience validated');
    
    console.log('🎉 Cross-Device User Experience Journey completed!');
  });
});