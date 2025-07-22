/**
 * Test Data Utilities
 * Manages test data creation, cleanup, and validation
 */

const { generateTestData, generatePhoneNumber, generateUniqueEmail } = require('./testHelpers');

class TestDataUtils {
  constructor() {
    this.createdItems = new Map(); // Track created items for cleanup
    this.sessionId = '';
  }

  /**
   * Initialize new test session
   */
  initSession(sessionPrefix = 'test') {
    this.sessionId = `${sessionPrefix}-${Date.now()}`;
    this.createdItems.clear();
    return this.sessionId;
  }

  /**
   * Create test request data
   */
  createRequestData(overrides = {}) {
    const testData = generateTestData('req');
    
    const requestData = {
      id: testData.id,
      product: 'Kitchen Renovation',
      leadSource: 'E2E_TEST',
      budget: '$25,000 - $50,000',
      status: 'New',
      message: `Test request for session: ${this.sessionId}`,
      additionalNotes: `E2E Test Data - Session: ${this.sessionId}`,
      clientName: 'Test Client',
      clientEmail: testData.email,
      clientPhone: testData.phone,
      createdAt: new Date().toISOString(),
      ...overrides
    };

    this.createdItems.set(testData.id, {
      type: 'request',
      data: requestData,
      sessionId: this.sessionId
    });

    return requestData;
  }

  /**
   * Create test quote data
   */
  createQuoteData(overrides = {}) {
    const testData = generateTestData('quote');
    
    const quoteData = {
      id: testData.id,
      title: 'Test Quote',
      amount: 45000,
      status: 'pending',
      description: `Test quote for session: ${this.sessionId}`,
      clientName: 'Test Client',
      clientEmail: testData.email,
      clientPhone: testData.phone,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      ...overrides
    };

    this.createdItems.set(testData.id, {
      type: 'quote',
      data: quoteData,
      sessionId: this.sessionId
    });

    return quoteData;
  }

  /**
   * Create test project data
   */
  createProjectData(overrides = {}) {
    const testData = generateTestData('project');
    
    const projectData = {
      id: testData.id,
      title: 'Test Project',
      status: 'active',
      product: 'Kitchen Renovation',
      budget: 50000,
      description: `Test project for session: ${this.sessionId}`,
      address: '123 Test Street, Houston, TX 77001',
      clientName: 'Test Client',
      clientEmail: testData.email,
      clientPhone: testData.phone,
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...overrides
    };

    this.createdItems.set(testData.id, {
      type: 'project',
      data: projectData,
      sessionId: this.sessionId
    });

    return projectData;
  }

  /**
   * Create test contact data
   */
  createContactData(overrides = {}) {
    const testData = generateTestData('contact');
    
    const contactData = {
      id: testData.id,
      name: 'Test Contact',
      email: testData.email,
      phone: testData.phone,
      type: 'client',
      notes: `Test contact for session: ${this.sessionId}`,
      createdAt: new Date().toISOString(),
      ...overrides
    };

    this.createdItems.set(testData.id, {
      type: 'contact',
      data: contactData,
      sessionId: this.sessionId
    });

    return contactData;
  }

  /**
   * Mark item for cleanup
   */
  async markForCleanup(itemType, itemId, sessionId = null) {
    const session = sessionId || this.sessionId;
    
    this.createdItems.set(itemId, {
      type: itemType,
      sessionId: session,
      markedForCleanup: true,
      cleanupTime: new Date().toISOString()
    });
  }

  /**
   * Get all items for cleanup
   */
  getCleanupItems(sessionId = null) {
    const session = sessionId || this.sessionId;
    const items = [];
    
    for (const [itemId, itemData] of this.createdItems.entries()) {
      if (itemData.sessionId === session) {
        items.push({
          id: itemId,
          type: itemData.type,
          data: itemData.data
        });
      }
    }
    
    return items;
  }

  /**
   * Generate test form data for get estimate
   */
  generateEstimateFormData() {
    const testData = generateTestData('estimate');
    
    return {
      name: 'Test Customer',
      email: testData.email,
      phone: testData.phone,
      product: 'Kitchen Renovation',
      budget: '$25,000 - $50,000',
      timeline: '3-6 months',
      message: `Test estimate request - Session: ${this.sessionId}`,
      source: 'E2E_TEST'
    };
  }

  /**
   * Generate test meeting data
   */
  generateMeetingData() {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    return {
      date: futureDate.toISOString().split('T')[0],
      time: '14:00',
      duration: 60,
      type: 'consultation',
      notes: `Test meeting - Session: ${this.sessionId}`,
      location: 'Test Location'
    };
  }

  /**
   * Validate test data integrity
   */
  validateTestData(data, requiredFields = []) {
    const errors = [];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate email format
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    // Validate phone format
    if (data.phone && !/^\+1\d{10}$/.test(data.phone)) {
      errors.push('Invalid phone format (expected: +1XXXXXXXXXX)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean up all test data for session
   */
  async performCleanup(page) {
    const items = this.getCleanupItems();
    const cleanupResults = [];
    
    for (const item of items) {
      try {
        await this.cleanupSingleItem(page, item);
        cleanupResults.push({ id: item.id, type: item.type, status: 'cleaned' });
      } catch (error) {
        console.log(`Cleanup failed for ${item.type} ${item.id}:`, error.message);
        cleanupResults.push({ id: item.id, type: item.type, status: 'failed', error: error.message });
      }
    }
    
    // Clear the session items
    this.createdItems.clear();
    
    return cleanupResults;
  }

  /**
   * Clean up individual item
   */
  async cleanupSingleItem(page, item) {
    const urlMap = {
      'request': `/admin/requests/${item.id}`,
      'quote': `/admin/quotes/${item.id}`,
      'project': `/admin/projects/${item.id}`,
      'contact': `/admin/contacts/${item.id}`
    };
    
    const url = urlMap[item.type];
    if (!url) {
      throw new Error(`Unknown item type: ${item.type}`);
    }
    
    await page.goto(url);
    
    // Check if item exists
    if (await page.locator('h1, h2, h3').isVisible({ timeout: 5000 })) {
      // Mark with cleanup note
      const notesSelectors = [
        'textarea[name*="notes"]',
        'textarea[placeholder*="notes"]',
        '[data-testid*="notes"]'
      ];
      
      for (const selector of notesSelectors) {
        const field = page.locator(selector);
        if (await field.isVisible({ timeout: 2000 })) {
          await field.fill(`E2E TEST DATA - Session: ${this.sessionId} - CLEANUP REQUIRED`);
          
          // Save
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
      
      // Try to delete if delete button is available
      const deleteSelectors = [
        'button:has-text("Delete")',
        'button:has-text("Remove")',
        '[data-testid="delete-button"]'
      ];
      
      for (const selector of deleteSelectors) {
        const deleteButton = page.locator(selector);
        if (await deleteButton.isVisible({ timeout: 2000 })) {
          await deleteButton.click();
          
          // Confirm deletion if modal appears
          await page.waitForTimeout(1000);
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
          if (await confirmButton.isVisible({ timeout: 3000 })) {
            await confirmButton.click();
            await page.waitForTimeout(1000);
          }
          break;
        }
      }
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const stats = {
      sessionId: this.sessionId,
      totalItems: this.createdItems.size,
      itemsByType: {},
      markedForCleanup: 0
    };
    
    for (const [itemId, itemData] of this.createdItems.entries()) {
      const type = itemData.type;
      stats.itemsByType[type] = (stats.itemsByType[type] || 0) + 1;
      
      if (itemData.markedForCleanup) {
        stats.markedForCleanup++;
      }
    }
    
    return stats;
  }

  /**
   * Reset utility state
   */
  reset() {
    this.createdItems.clear();
    this.sessionId = '';
  }
}

// Create singleton instance
const testDataUtils = new TestDataUtils();

module.exports = {
  testDataUtils,
  TestDataUtils
};