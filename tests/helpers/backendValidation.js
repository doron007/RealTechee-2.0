/**
 * Backend Validation Helpers for Form Submission Tests
 * 
 * Provides comprehensive validation of database records and notifications
 * following form submissions in E2E tests.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { expect } = require('@playwright/test');

// Import Amplify configuration
const amplifyOutputs = require('../../amplify_outputs.json');

// Initialize AWS DynamoDB client
const ddbClient = new DynamoDBClient({ 
  region: amplifyOutputs.data.aws_region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

// Extract table name prefix from amplify outputs
const extractTablePrefix = () => {
  const sampleTable = amplifyOutputs.data.tables?.find(t => t.name);
  if (!sampleTable) throw new Error('No tables found in amplify outputs');
  
  // Table names follow pattern: ModelName-{environmentId}-NONE
  const match = sampleTable.name.match(/^(.+-)([^-]+)(-NONE)$/);
  if (match) {
    return match[1] + match[2] + match[3]; // Full pattern for replacement
  }
  throw new Error(`Cannot extract table prefix from: ${sampleTable.name}`);
};

// Get actual table names from amplify configuration
const getTableName = (modelName) => {
  const tableConfig = amplifyOutputs.data.tables?.find(t => 
    t.name.startsWith(modelName + '-') && t.name.endsWith('-NONE')
  );
  if (!tableConfig) {
    throw new Error(`Table configuration not found for model: ${modelName}`);
  }
  return tableConfig.name;
};

/**
 * Test data identification utilities
 */
const TEST_MARKERS = {
  LEAD_SOURCE: 'E2E_TEST',
  SESSION_PREFIX: 'TEST_SESSION:',
  EMAIL_PATTERNS: ['test@', '@test.', 'playwright@', 'e2e@', 'automation@'],
  NAME_PATTERNS: ['test', 'playwright', 'automation', 'e2e']
};

const isTestData = (record, type = 'request') => {
  if (!record) return false;
  
  switch (type) {
    case 'request':
      return record.leadSource === TEST_MARKERS.LEAD_SOURCE ||
             (record.officeNotes && record.officeNotes.includes(TEST_MARKERS.SESSION_PREFIX));
    
    case 'contact':
      const email = record.email?.toLowerCase() || '';
      const name = record.fullName?.toLowerCase() || '';
      return TEST_MARKERS.EMAIL_PATTERNS.some(pattern => email.includes(pattern)) ||
             TEST_MARKERS.NAME_PATTERNS.some(pattern => name.includes(pattern));
    
    default:
      return false;
  }
};

/**
 * Database query helpers
 */
class DatabaseHelper {
  /**
   * Find records by attribute
   */
  static async findRecordsByAttribute(tableName, attributeName, attributeValue, limit = 50) {
    const params = {
      TableName: getTableName(tableName),
      FilterExpression: `#attr = :value`,
      ExpressionAttributeNames: {
        '#attr': attributeName
      },
      ExpressionAttributeValues: {
        ':value': attributeValue
      },
      Limit: limit
    };

    try {
      const result = await docClient.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error(`Error scanning ${tableName} for ${attributeName}:`, error);
      return [];
    }
  }

  /**
   * Find record by ID
   */
  static async findRecordById(tableName, id) {
    try {
      const records = await this.findRecordsByAttribute(tableName, 'id', id, 1);
      return records[0] || null;
    } catch (error) {
      console.error(`Error finding ${tableName} record by ID:`, error);
      return null;
    }
  }

  /**
   * Find test records by lead source
   */
  static async findTestRequests(limit = 100) {
    return await this.findRecordsByAttribute('Requests', 'leadSource', TEST_MARKERS.LEAD_SOURCE, limit);
  }

  /**
   * Find test records by session ID in office notes
   */
  static async findTestRequestsBySession(sessionId) {
    const params = {
      TableName: getTableName('Requests'),
      FilterExpression: 'contains(officeNotes, :sessionId)',
      ExpressionAttributeValues: {
        ':sessionId': `${TEST_MARKERS.SESSION_PREFIX}${sessionId}`
      }
    };

    try {
      const result = await docClient.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Error finding test requests by session:', error);
      return [];
    }
  }

  /**
   * Find contact by email
   */
  static async findContactByEmail(email) {
    const contacts = await this.findRecordsByAttribute('Contacts', 'email', email.toLowerCase(), 10);
    return contacts[0] || null;
  }

  /**
   * Find property by full address
   */
  static async findPropertyByAddress(fullAddress) {
    const properties = await this.findRecordsByAttribute('Properties', 'propertyFullAddress', fullAddress, 10);
    return properties[0] || null;
  }

  /**
   * Find notifications for a submission
   */
  static async findNotificationsBySubmissionId(submissionId) {
    const params = {
      TableName: getTableName('NotificationQueue'),
      FilterExpression: 'contains(payload, :submissionId)',
      ExpressionAttributeValues: {
        ':submissionId': submissionId
      }
    };

    try {
      const result = await docClient.send(new ScanCommand(params));
      return result.Items || [];
    } catch (error) {
      console.error('Error finding notifications:', error);
      return [];
    }
  }
}

/**
 * Form-specific validation classes
 */
class GetEstimateValidator {
  constructor(formData, testSessionId) {
    this.formData = formData;
    this.testSessionId = testSessionId;
    this.submissionResults = {};
  }

  /**
   * Validate complete Get Estimate form submission
   */
  async validateSubmission() {
    console.log('🔍 Starting Get Estimate backend validation...');

    // Wait for database operations to complete
    await this._waitForDatabaseSync();

    // Validate request record
    await this._validateRequestRecord();
    
    // Validate contact records
    await this._validateContactRecords();
    
    // Validate property record
    await this._validatePropertyRecord();
    
    // Validate notifications
    await this._validateNotifications();

    console.log('✅ Get Estimate backend validation completed');
    return this.submissionResults;
  }

  async _waitForDatabaseSync() {
    console.log('⏳ Waiting for database sync...');
    // AWS DynamoDB eventual consistency - wait for writes to propagate
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  async _validateRequestRecord() {
    console.log('🔍 Validating request record...');
    
    const testRequests = await DatabaseHelper.findTestRequestsBySession(this.testSessionId);
    
    expect(testRequests.length).toBeGreaterThan(0);
    expect(testRequests.length).toBeLessThanOrEqual(1); // Should be exactly 1 for single submission
    
    const request = testRequests[0];
    this.submissionResults.request = request;
    
    // Validate request fields
    expect(request.relationToProperty).toBe(this.formData.relationToProperty);
    expect(request.needFinance).toBe(this.formData.needFinance);
    expect(request.rtDigitalSelection).toBe(this.formData.rtDigitalSelection);
    expect(request.leadSource).toBe(TEST_MARKERS.LEAD_SOURCE);
    expect(request.status).toBe('New');
    expect(request.assignedTo).toBeDefined(); // Should be assigned by auto-assignment
    
    // Validate optional fields
    if (this.formData.notes) {
      expect(request.message).toBe(this.formData.notes);
    }
    
    if (this.formData.requestedVisitDateTime) {
      expect(request.requestedVisitDateTime).toBeDefined();
    }
    
    // Validate file uploads
    if (this.formData.uploadedMedia && this.formData.uploadedMedia.length > 0) {
      expect(request.uploadedMedia).toBeDefined();
      const mediaUrls = JSON.parse(request.uploadedMedia || '[]');
      expect(mediaUrls.length).toBeGreaterThan(0);
    }

    console.log('✅ Request record validation passed');
  }

  async _validateContactRecords() {
    console.log('🔍 Validating contact records...');
    
    // Validate agent contact
    if (this.formData.agentInfo) {
      const agentContact = await DatabaseHelper.findContactByEmail(this.formData.agentInfo.email);
      expect(agentContact).toBeTruthy();
      
      expect(agentContact.fullName).toBe(this.formData.agentInfo.fullName);
      expect(agentContact.phone).toBe(this.formData.agentInfo.phone);
      expect(agentContact.brokerage).toBe(this.formData.agentInfo.brokerage);
      
      this.submissionResults.agentContact = agentContact;
      console.log('✅ Agent contact validation passed');
    }
    
    // Validate homeowner contact (if provided and different from agent)
    if (this.formData.homeownerInfo && this.formData.homeownerInfo.email) {
      const homeownerContact = await DatabaseHelper.findContactByEmail(this.formData.homeownerInfo.email);
      
      if (this.formData.homeownerInfo.email !== this.formData.agentInfo?.email) {
        expect(homeownerContact).toBeTruthy();
        expect(homeownerContact.fullName).toBe(this.formData.homeownerInfo.fullName);
        expect(homeownerContact.phone).toBe(this.formData.homeownerInfo.phone);
        
        this.submissionResults.homeownerContact = homeownerContact;
        console.log('✅ Homeowner contact validation passed');
      } else {
        console.log('ℹ️ Homeowner and agent emails match - single contact expected');
      }
    }
  }

  async _validatePropertyRecord() {
    console.log('🔍 Validating property record...');
    
    const expectedAddress = `${this.formData.propertyAddress.streetAddress}, ${this.formData.propertyAddress.city}, ${this.formData.propertyAddress.state} ${this.formData.propertyAddress.zip}`;
    
    const property = await DatabaseHelper.findPropertyByAddress(expectedAddress);
    expect(property).toBeTruthy();
    
    expect(property.houseAddress).toBe(this.formData.propertyAddress.streetAddress);
    expect(property.city).toBe(this.formData.propertyAddress.city);
    expect(property.state).toBe(this.formData.propertyAddress.state);
    expect(property.zip).toBe(this.formData.propertyAddress.zip);
    
    this.submissionResults.property = property;
    console.log('✅ Property record validation passed');
  }

  async _validateNotifications() {
    console.log('🔍 Validating notifications...');
    
    const request = this.submissionResults.request;
    const notifications = await DatabaseHelper.findNotificationsBySubmissionId(request.id);
    
    expect(notifications.length).toBeGreaterThan(0);
    
    const notification = notifications[0];
    expect(notification.eventType).toBe('get_estimate_request');
    expect(notification.status).toMatch(/PENDING|SENT|PROCESSING/);
    
    // Validate payload contains expected data
    const payload = JSON.parse(notification.payload);
    expect(payload.customer.email).toBe(this.formData.agentInfo.email);
    expect(payload.customer.name).toBe(this.formData.agentInfo.fullName);
    expect(payload.property.address).toContain(this.formData.propertyAddress.streetAddress);
    
    this.submissionResults.notifications = notifications;
    console.log('✅ Notification validation passed');
  }
}

class ContactUsValidator {
  constructor(formData, testSessionId) {
    this.formData = formData;
    this.testSessionId = testSessionId;
    this.submissionResults = {};
  }

  async validateSubmission() {
    console.log('🔍 Starting Contact Us backend validation...');
    
    await this._waitForDatabaseSync();
    
    // Find the contact us record
    await this._validateContactUsRecord();
    
    // Validate contact record
    await this._validateContactRecord();

    console.log('✅ Contact Us backend validation completed');
    return this.submissionResults;
  }

  async _waitForDatabaseSync() {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async _validateContactUsRecord() {
    console.log('🔍 Validating ContactUs record...');
    
    // Find ContactUs records by email (since they don't have leadSource)
    const contactUsRecords = await DatabaseHelper.findRecordsByAttribute(
      'ContactUs', 'subject', this.formData.subject || 'Contact Form Submission'
    );
    
    // Filter to recent test submissions
    const recentRecords = contactUsRecords.filter(record => {
      const createdTime = new Date(record.createdAt);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return createdTime > fiveMinutesAgo;
    });
    
    expect(recentRecords.length).toBeGreaterThan(0);
    
    const contactUs = recentRecords[0];
    expect(contactUs.message).toBe(this.formData.message);
    
    this.submissionResults.contactUs = contactUs;
    console.log('✅ ContactUs record validation passed');
  }

  async _validateContactRecord() {
    console.log('🔍 Validating contact record...');
    
    const contact = await DatabaseHelper.findContactByEmail(this.formData.email);
    expect(contact).toBeTruthy();
    
    expect(contact.fullName).toBe(this.formData.fullName);
    expect(contact.phone).toBe(this.formData.phone || '');
    
    this.submissionResults.contact = contact;
    console.log('✅ Contact record validation passed');
  }
}

/**
 * Main validation factory
 */
class BackendValidator {
  static async validateFormSubmission(formType, formData, testSessionId) {
    let validator;
    
    switch (formType.toLowerCase()) {
      case 'get-estimate':
        validator = new GetEstimateValidator(formData, testSessionId);
        break;
        
      case 'contact-us':
        validator = new ContactUsValidator(formData, testSessionId);
        break;
        
      // Add other form validators here
      case 'get-qualified':
        // Similar to get-estimate but may have different validation rules
        validator = new GetEstimateValidator(formData, testSessionId);
        break;
        
      case 'affiliate':
        // TODO: Implement AffiliateValidator
        throw new Error('Affiliate form validation not yet implemented');
        
      default:
        throw new Error(`Unknown form type: ${formType}`);
    }
    
    return await validator.validateSubmission();
  }

  /**
   * Clean up test data after tests complete
   */
  static async cleanupTestData(testSessionId) {
    console.log(`🧹 Cleaning up test data for session: ${testSessionId}`);
    
    try {
      // Find and delete test requests
      const testRequests = await DatabaseHelper.findTestRequestsBySession(testSessionId);
      console.log(`Found ${testRequests.length} test requests to clean up`);
      
      // Find and delete test contacts
      const allContacts = await DatabaseHelper.findRecordsByAttribute('Contacts', 'email', '', 1000);
      const testContacts = allContacts.filter(contact => isTestData(contact, 'contact'));
      console.log(`Found ${testContacts.length} test contacts to clean up`);
      
      // Note: Actual deletion would require delete operations
      // For now, just log what would be deleted
      console.log('ℹ️ Test data cleanup logged - implement actual deletion if needed');
      
      return {
        requestsFound: testRequests.length,
        contactsFound: testContacts.length,
        cleaned: false // Set to true when implementing actual deletion
      };
    } catch (error) {
      console.error('Error during test data cleanup:', error);
      return { error: error.message };
    }
  }
}

/**
 * Test utilities for session management
 */
class TestSession {
  static generateSessionId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static extractSessionId(request) {
    if (!request?.officeNotes) return null;
    
    const match = request.officeNotes.match(/TEST_SESSION:\s*([^\s]+)/);
    return match ? match[1] : null;
  }
}

module.exports = {
  BackendValidator,
  DatabaseHelper,
  GetEstimateValidator,
  ContactUsValidator,
  TestSession,
  TEST_MARKERS,
  isTestData
};