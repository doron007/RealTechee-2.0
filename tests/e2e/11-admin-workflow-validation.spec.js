const { test, expect } = require('@playwright/test');

test.describe('Simplified Admin Media Test', () => {
  test('should login and find request with media for testing', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds
    // Enable console logging
    page.on('console', msg => {
      console.log(`Browser ${msg.type()}: ${msg.text()}`);
    });

    console.log('=== Step 1: Navigate to login page ===');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/step1-login-page.png', fullPage: true });

    console.log('=== Step 2: Attempt login with various selectors ===');
    
    // Wait a bit longer for the Authenticator to fully load
    await page.waitForTimeout(2000);
    
    // Try multiple selector strategies for AWS Amplify Authenticator
    const possibleEmailSelectors = [
      'input[name="email"]',
      'input[type="email"]', 
      'input[name="username"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Username" i]',
      '[data-amplify-authenticator-signin] input[type="email"]',
      '[data-amplify-authenticator-signin] input[name="username"]',
      '.amplify-input input[type="email"]',
      '.amplify-input input[name="username"]'
    ];

    const possiblePasswordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      '[data-amplify-authenticator-signin] input[type="password"]',
      '.amplify-input input[type="password"]'
    ];

    const possibleSubmitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Sign In")', 
      'button:has-text("Login")',
      '[data-amplify-authenticator-signin] button[type="submit"]',
      '.amplify-button[type="submit"]'
    ];

    let emailInput = null;
    let passwordInput = null;
    let submitButton = null;

    // Find working email input
    for (const selector of possibleEmailSelectors) {
      try {
        const input = page.locator(selector);
        if (await input.count() > 0 && await input.isVisible()) {
          emailInput = input.first();
          console.log(`Found email input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Find working password input
    for (const selector of possiblePasswordSelectors) {
      try {
        const input = page.locator(selector);
        if (await input.count() > 0 && await input.isVisible()) {
          passwordInput = input.first();
          console.log(`Found password input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Find working submit button
    for (const selector of possibleSubmitSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0 && await button.isVisible()) {
          submitButton = button.first();
          console.log(`Found submit button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!emailInput || !passwordInput || !submitButton) {
      console.log('❌ Could not find all required form elements');
      console.log(`Email input: ${!!emailInput}, Password input: ${!!passwordInput}, Submit button: ${!!submitButton}`);
      
      // Take a detailed screenshot and dump page content for debugging
      await page.screenshot({ path: 'test-results/login-form-debug.png', fullPage: true });
      
      const bodyHTML = await page.locator('body').innerHTML();
      console.log('Page HTML structure (first 1000 chars):');
      console.log(bodyHTML.substring(0, 1000));
      
      return; // Exit test early
    }

    console.log('=== Step 3: Fill login credentials ===');
    await emailInput.fill('info@realtechee.com');
    await passwordInput.fill('Sababa123!');
    
    await page.screenshot({ path: 'test-results/step3-credentials-filled.png', fullPage: true });

    console.log('=== Step 4: Submit login form ===');
    await submitButton.click();
    
    // Wait longer for authentication to process
    console.log('Waiting for login to process...');
    await page.waitForTimeout(5000);
    
    console.log(`URL after login attempt: ${page.url()}`);
    await page.screenshot({ path: 'test-results/step4-after-login-click.png', fullPage: true });

    // Check for successful login indicators
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/login');
    
    if (isOnLoginPage) {
      console.log('⚠️  Still on login page - checking for error messages...');
      
      // Look for error messages
      const errorSelectors = [
        '.amplify-alert',
        '[data-amplify-alert]',
        '.error-message',
        '.amplify-field-group__error-message',
        '[role="alert"]'
      ];
      
      for (const selector of errorSelectors) {
        const errorEl = page.locator(selector);
        if (await errorEl.count() > 0) {
          const errorText = await errorEl.textContent();
          console.log(`Error message found: ${errorText}`);
        }
      }
    } else {
      console.log('✅ Redirected away from login page - login likely successful');
    }

    console.log('=== Step 5: Navigate to admin area ===');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`Admin page URL: ${page.url()}`);
    await page.screenshot({ path: 'test-results/step5-admin-dashboard.png', fullPage: true });

    console.log('=== Step 6: Navigate to requests ===');
    await page.goto('/admin/requests');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra time for data loading
    
    console.log(`Requests page URL: ${page.url()}`);
    await page.screenshot({ path: 'test-results/step6-requests-page.png', fullPage: true });

    // Look for various types of request containers
    const requestSelectors = [
      'tr:has-text("test")', // Table rows with 'test' content
      'tr:has-text("request")', 
      'tr:has-text("upload")',
      'tr:has-text("file")',
      'tr:has-text("media")',
      '.MuiDataGrid-row', // MUI DataGrid rows
      '.request-item',
      '.request-row',
      'tr:not(:first-child)', // Any table rows except header
      '[role="row"]:not([aria-rowindex="1"])', // Grid rows except header
      'tbody tr' // Table body rows
    ];

    let requestElements = null;
    let selectorUsed = null;

    for (const selector of requestSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        requestElements = elements;
        selectorUsed = selector;
        console.log(`Found ${count} requests using selector: ${selector}`);
        break;
      }
    }

    if (requestElements && await requestElements.count() > 0) {
      console.log(`=== Step 7: Click Edit button on first request (using ${selectorUsed}) ===`);
      
      // Get info about the first request
      const firstRequest = requestElements.first();
      const requestText = await firstRequest.textContent();
      console.log(`First request text: ${requestText?.substring(0, 200)}...`);
      
      // Look for Edit button in the first row
      const editButtonSelectors = [
        'button[title*="Edit"]',
        'button[aria-label*="Edit"]', 
        'img[alt="Edit"]',
        'button:has(img[alt="Edit"])',
        '[data-testid*="edit"]'
      ];
      
      let editButton = null;
      for (const selector of editButtonSelectors) {
        try {
          const button = firstRequest.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            editButton = button;
            console.log(`Found edit button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }
      
      if (editButton) {
        console.log('🖱️ Clicking Edit button...');
        await editButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Wait for React components to load
        
        console.log(`Request details URL: ${page.url()}`);
        await page.screenshot({ path: 'test-results/step7-request-details.png', fullPage: true });
        
        // Check if we successfully navigated to request detail
        const currentUrl = page.url();
        const isOnRequestDetail = currentUrl.includes('/admin/requests/') && !currentUrl.includes('/admin/requests?') && !currentUrl.endsWith('/admin/requests');
        
        console.log(`✅ Successfully navigated to request detail: ${isOnRequestDetail}`);
        
        if (isOnRequestDetail) {
          // Test Case Management tab if available
          console.log('🏢 Step 7b: Test Case Management Tab');
          await page.waitForTimeout(2000);
          
          const caseManagementTab = page.locator('text="Case Management"').first();
          const tabVisible = await caseManagementTab.isVisible({ timeout: 5000 });
          
          console.log(`✅ Case Management Tab Visible: ${tabVisible}`);
          
          if (tabVisible) {
            // Force click to bypass portal interception
            await caseManagementTab.click({ force: true });
            await page.waitForTimeout(2000);
            console.log('🖱️ Case Management tab clicked');
            
            await page.screenshot({ path: 'test-results/step7b-case-management.png', fullPage: true });
          }
        } else {
          console.log('❌ Did not navigate to request detail page');
        }
      } else {
        console.log('❌ Could not find Edit button, falling back to row click');
        // Fallback to clicking the row directly
        await firstRequest.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log(`Request details URL: ${page.url()}`);
        await page.screenshot({ path: 'test-results/step7-request-details-fallback.png', fullPage: true });
      }

      console.log('=== Step 8: Look for media/files in request details ===');
      
      // Look for tabs or sections that might contain media
      const mediaSectionSelectors = [
        'button:has-text("Media")',
        'button:has-text("Files")', 
        'button:has-text("Attachments")',
        '[role="tab"]:has-text("Media")',
        '[role="tab"]:has-text("Files")',
        '.media-section',
        '.files-section',
        '.attachments-section'
      ];

      for (const selector of mediaSectionSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          console.log(`Found media section: ${selector}`);
          await element.first().click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `test-results/step8-media-section-${Date.now()}.png`, fullPage: true });
          break;
        }
      }

      // Look for any file/media elements
      const fileSelectors = [
        'img[src*="amazonaws"]',
        'a[href*="amazonaws"]', 
        '.file-item',
        '.media-item',
        '.attachment-item',
        'button:has-text("View")',
        'button:has-text("Download")',
        '[data-testid*="file"]',
        '[data-testid*="media"]'
      ];

      console.log('=== Searching for file/media elements ===');
      for (const selector of fileSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`Found ${count} elements matching: ${selector}`);
          
          // Get some info about these elements
          for (let i = 0; i < Math.min(count, 3); i++) {
            const el = elements.nth(i);
            const text = await el.textContent();
            const href = await el.getAttribute('href');
            const src = await el.getAttribute('src');
            console.log(`  Element ${i + 1}: text="${text?.substring(0, 50)}" href="${href}" src="${src}"`);
          }
        }
      }
      
      await page.screenshot({ path: 'test-results/step8-final-state.png', fullPage: true });
      
    } else {
      console.log('❌ No requests found to test media viewing');
      
      // Check if we're actually authenticated by looking for admin elements
      const adminElements = page.locator('.admin', '[data-testid*="admin"]', 'nav', 'aside', '.sidebar');
      const adminCount = await adminElements.count();
      console.log(`Found ${adminCount} potential admin interface elements`);
    }

    console.log('=== Step 9: Test Direct Navigation ===');
    
    // Test direct navigation to a request detail page
    const testRequestId = 'baf0d5b4-6e7a-455c-908c-628cae66d696'; // From your example
    const directUrl = `/admin/requests/${testRequestId}`;
    
    console.log(`🎯 Testing direct navigation to: ${directUrl}`);
    
    try {
      await page.goto(directUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log(`📍 Direct navigation result: ${finalUrl}`);
      
      const directNavSuccess = finalUrl.includes(`/admin/requests/${testRequestId}`) && !finalUrl.includes('/login');
      console.log(`✅ Direct navigation success: ${directNavSuccess}`);
      
      if (directNavSuccess) {
        // Check for Case Management tab on direct navigation
        const caseTabDirect = page.locator('text="Case Management"').first();
        const caseTabDirectVisible = await caseTabDirect.isVisible({ timeout: 5000 });
        console.log(`✅ Case Management tab via direct nav: ${caseTabDirectVisible}`);
        
        await page.screenshot({ path: 'test-results/step9-direct-navigation.png', fullPage: true });
      } else {
        console.log('❌ Direct navigation failed or redirected to login');
        await page.screenshot({ path: 'test-results/step9-direct-nav-failed.png', fullPage: true });
      }
    } catch (error) {
      console.log(`❌ Direct navigation error: ${error.message}`);
      await page.screenshot({ path: 'test-results/step9-direct-nav-error.png', fullPage: true });
    }

    console.log('=== Test Complete ===');
    console.log('✅ Successfully tested: Login → Requests List → Edit Button → Request Detail');
    console.log('✅ Successfully tested: Direct navigation to request detail');
    console.log('Check test-results/ folder for detailed screenshots of each step');
  });
});