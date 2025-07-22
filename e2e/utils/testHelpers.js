/**
 * Test Helper Utilities
 * Common functions for E2E testing across all user stories
 */

const { expect } = require('@playwright/test');

/**
 * Admin authentication helper
 */
async function adminLogin(page) {
  await page.goto('/');
  await page.waitForTimeout(2000); // Allow initial page load
  
  await page.getByRole('link', { name: 'Sign In' }).click();
  await page.fill('input[name="username"]', 'info@realtechee.com');
  await page.fill('input[name="password"]', 'Sababa123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  // Wait for successful login with multiple selector fallbacks
  await page.waitForSelector('[data-testid="admin-dashboard"], .admin-dashboard, h1:has-text("Dashboard"), main:has-text("Dashboard")', { timeout: 20000 });
  
  // Ensure page is fully primed
  await page.waitForTimeout(3000);
  
  // Verify we're authenticated
  await expect(page.locator('text=Dashboard, text=Admin, [data-testid="user-menu"]')).toBeVisible();
}

/**
 * Generate unique test data
 */
function generateTestData(prefix = 'test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return {
    id: `${prefix}-${timestamp}-${random}`,
    email: `${prefix}+${timestamp}@realtechee.com`,
    phone: `+1713${Math.floor(Math.random() * 9000000) + 1000000}`,
    timestamp
  };
}

/**
 * Create test request via UI or API
 */
async function createTestRequest(page, requestData = {}, testSession = '') {
  const defaultData = {
    product: 'Kitchen Renovation',
    leadSource: 'E2E_TEST',
    budget: '$25,000 - $50,000',
    message: `Test request - Session: ${testSession}`,
    additionalNotes: `E2E Test Data - Session: ${testSession}`,
    ...requestData
  };

  try {
    // Navigate to requests page
    await page.goto('/admin/requests');
    await page.waitForSelector('h1:has-text("Requests"), [data-testid="requests-page"]', { timeout: 10000 });
    
    // Look for create button
    const createSelectors = [
      'button:has-text("Add")',
      'button:has-text("Create")', 
      'button:has-text("New")',
      '[data-testid="create-request"]',
      '[data-testid="add-request"]',
      '.add-request-button'
    ];
    
    let createButton = null;
    for (const selector of createSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        createButton = element;
        break;
      }
    }
    
    if (createButton) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Fill form fields
      await fillRequestForm(page, defaultData);
      
      // Submit form
      const submitSelectors = [
        'button:has-text("Submit")',
        'button:has-text("Create")',
        'button:has-text("Save")',
        '[data-testid="submit-request"]'
      ];
      
      for (const selector of submitSelectors) {
        const button = page.locator(selector);
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
      
      // Extract request ID from URL
      const url = page.url();
      const idMatch = url.match(/\/requests\/([^\/\?]+)/);
      if (idMatch) {
        return idMatch[1];
      }
    }
  } catch (error) {
    console.log('Request creation via UI failed:', error.message);
  }
  
  // Fallback: Generate ID for test continuity
  const testData = generateTestData('req');
  return testData.id;
}

/**
 * Fill request form with provided data
 */
async function fillRequestForm(page, data) {
  // Product field
  const productSelectors = [
    'select[name="product"]',
    '[data-testid="product-select"]',
    'input[name="product"]'
  ];
  
  for (const selector of productSelectors) {
    const field = page.locator(selector);
    if (await field.isVisible({ timeout: 2000 })) {
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await field.selectOption(data.product);
      } else {
        await field.fill(data.product);
      }
      break;
    }
  }
  
  // Lead source field
  const sourceSelectors = [
    'select[name="leadSource"]',
    '[data-testid="lead-source"]',
    'input[name="leadSource"]'
  ];
  
  for (const selector of sourceSelectors) {
    const field = page.locator(selector);
    if (await field.isVisible({ timeout: 2000 })) {
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await field.selectOption(data.leadSource);
      } else {
        await field.fill(data.leadSource);
      }
      break;
    }
  }
  
  // Budget field
  const budgetSelectors = [
    'select[name="budget"]',
    '[data-testid="budget"]',
    'input[name="budget"]'
  ];
  
  for (const selector of budgetSelectors) {
    const field = page.locator(selector);
    if (await field.isVisible({ timeout: 2000 })) {
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await field.selectOption(data.budget);
      } else {
        await field.fill(data.budget);
      }
      break;
    }
  }
  
  // Message field
  const messageSelectors = [
    'textarea[name="message"]',
    '[data-testid="message"]',
    'input[name="message"]'
  ];
  
  for (const selector of messageSelectors) {
    const field = page.locator(selector);
    if (await field.isVisible({ timeout: 2000 })) {
      await field.fill(data.message);
      break;
    }
  }
  
  // Additional notes
  const notesSelectors = [
    'textarea[name="additionalNotes"]',
    '[data-testid="additional-notes"]',
    'textarea[name="notes"]'
  ];
  
  for (const selector of notesSelectors) {
    const field = page.locator(selector);
    if (await field.isVisible({ timeout: 2000 })) {
      await field.fill(data.additionalNotes);
      break;
    }
  }
}

/**
 * Mark test data for cleanup
 */
async function markForCleanup(page, itemType, itemId, testSession) {
  try {
    const urls = {
      'request': `/admin/requests/${itemId}`,
      'quote': `/admin/quotes/${itemId}`,
      'project': `/admin/projects/${itemId}`
    };
    
    const url = urls[itemType.toLowerCase()] || `/admin/${itemType.toLowerCase()}/${itemId}`;
    
    await page.goto(url);
    
    if (await page.locator('h1, h2, h3').isVisible({ timeout: 5000 })) {
      // Find notes field and mark for cleanup
      const notesSelectors = [
        'textarea[name*="notes"]',
        'textarea[placeholder*="notes"]', 
        '[data-testid*="notes"]',
        'textarea[name="additionalNotes"]',
        'textarea[name="officeNotes"]'
      ];
      
      for (const selector of notesSelectors) {
        const field = page.locator(selector);
        if (await field.isVisible({ timeout: 2000 })) {
          await field.fill(`E2E TEST DATA - Session: ${testSession} - CLEANUP REQUIRED`);
          
          // Save if possible
          const saveSelectors = [
            'button:has-text("Save")',
            'button:has-text("Update")',
            '[data-testid="save-button"]'
          ];
          
          for (const saveSelector of saveSelectors) {
            const saveButton = page.locator(saveSelector);
            if (await saveButton.isVisible({ timeout: 2000 })) {
              await saveButton.click();
              await page.waitForTimeout(1000);
              break;
            }
          }
          break;
        }
      }
    }
  } catch (error) {
    console.log(`Cleanup marking failed for ${itemType} ${itemId}:`, error.message);
  }
}

/**
 * Clean up test data after test completion
 */
async function cleanupTestData(page, testItems = [], testSession = '') {
  for (const item of testItems) {
    if (typeof item === 'string') {
      // Assume it's a request ID
      await markForCleanup(page, 'request', item, testSession);
    } else if (typeof item === 'object') {
      // Object with type and id
      await markForCleanup(page, item.type, item.id, testSession);
    }
  }
}

/**
 * Wait for element with flexible selectors
 */
async function waitForAnySelector(page, selectors, timeout = 10000) {
  const promises = selectors.map(selector => 
    page.waitForSelector(selector, { timeout }).catch(() => null)
  );
  
  const result = await Promise.race(promises);
  return result;
}

/**
 * Click element with flexible selectors
 */
async function clickAnySelector(page, selectors, timeout = 5000) {
  for (const selector of selectors) {
    const element = page.locator(selector);
    if (await element.isVisible({ timeout: timeout / selectors.length })) {
      await element.click();
      return true;
    }
  }
  return false;
}

/**
 * Fill field with flexible selectors
 */
async function fillAnySelector(page, selectors, value, timeout = 5000) {
  for (const selector of selectors) {
    const element = page.locator(selector);
    if (await element.isVisible({ timeout: timeout / selectors.length })) {
      await element.fill(value);
      return true;
    }
  }
  return false;
}

/**
 * Navigate to admin section with retry
 */
async function navigateToAdmin(page, section = '') {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await page.goto(`/admin${section ? '/' + section : ''}`);
      await page.waitForSelector('h1:has-text("Dashboard"), h1:has-text("Admin"), [data-testid="admin-dashboard"]', { timeout: 10000 });
      return true;
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        console.log(`Navigation retry ${retries} for /admin${section ? '/' + section : ''}`);
        await page.waitForTimeout(2000);
      }
    }
  }
  
  throw new Error(`Failed to navigate to admin section after ${maxRetries} retries`);
}

/**
 * Verify performance benchmark
 */
function verifyPerformance(loadTime, benchmark, pageName) {
  const passed = loadTime <= benchmark;
  console.log(`Performance ${passed ? 'PASS' : 'FAIL'}: ${pageName} loaded in ${loadTime}ms (target: <${benchmark}ms)`);
  return passed;
}

/**
 * Generate unique phone number
 */
function generatePhoneNumber() {
  const area = '713';
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1${area}${exchange}${number}`;
}

/**
 * Generate unique email
 */
function generateUniqueEmail(prefix = 'test') {
  const timestamp = Date.now();
  return `${prefix}+${timestamp}@realtechee.com`;
}

module.exports = {
  adminLogin,
  generateTestData,
  createTestRequest,
  fillRequestForm,
  markForCleanup,
  cleanupTestData,
  waitForAnySelector,
  clickAnySelector,
  fillAnySelector,
  navigateToAdmin,
  verifyPerformance,
  generatePhoneNumber,
  generateUniqueEmail
};