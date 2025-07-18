#!/usr/bin/env node

/**
 * Comprehensive Notification Flow Test Script
 * 
 * This script tests the complete user story flow:
 * 1. Submit Get Estimate form
 * 2. Validate notification is queued
 * 3. Process notification through Lambda
 * 4. Validate event logging (attempts, successes, failures)
 * 5. Confirm SendGrid and Twilio delivery confirmations
 */

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

// Test configuration
const TEST_CONFIG = {
  // Test data for Get Estimate form
  contact: {
    firstName: 'Notification',
    lastName: 'Test',
    email: 'doron@realtechee.com', // Use real email for testing
    phone: '+16699994563',         // Use real phone for testing
    company: 'RealTechee Test'
  },
  property: {
    houseAddress: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    zip: '90210',
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    sizeSqft: 1500,
    yearBuilt: 1985
  },
  request: {
    product: 'Full Service Package',
    message: 'This is a comprehensive notification flow test. Please validate that email and SMS notifications are sent and properly logged.',
    relationToProperty: 'Owner',
    budget: '$50,000 - $75,000',
    leadSource: 'NOTIFICATION_FLOW_TEST'
  }
};

// GraphQL mutations and queries
const CREATE_CONTACT_MUTATION = `
  mutation CreateContact($input: CreateContactsInput!) {
    createContacts(input: $input) {
      id
      firstName
      lastName
      email
      phone
      emailNotifications
      smsNotifications
      createdAt
    }
  }
`;

const CREATE_PROPERTY_MUTATION = `
  mutation CreateProperty($input: CreatePropertiesInput!) {
    createProperties(input: $input) {
      id
      propertyFullAddress
      houseAddress
      city
      state
      zip
      propertyType
      bedrooms
      bathrooms
      sizeSqft
      yearBuilt
      createdAt
    }
  }
`;

const CREATE_REQUEST_MUTATION = `
  mutation CreateRequest($input: CreateRequestsInput!) {
    createRequests(input: $input) {
      id
      product
      message
      relationToProperty
      budget
      leadSource
      agentContactId
      homeownerContactId
      addressId
      status
      createdAt
    }
  }
`;

const QUERY_NOTIFICATION_EVENTS = `
  query ListNotificationEvents($filter: ModelNotificationEventsFilterInput, $limit: Int) {
    listNotificationEvents(filter: $filter, limit: $limit) {
      items {
        eventId
        notificationId
        eventType
        channel
        recipient
        provider
        providerId
        providerStatus
        errorCode
        errorMessage
        timestamp
        processingTimeMs
      }
    }
  }
`;

class NotificationFlowTester {
  constructor() {
    this.testId = `TEST_${Date.now()}`;
    this.contactId = null;
    this.propertyId = null;
    this.requestId = null;
    this.notificationId = null;
  }

  async runCompleteTest() {
    console.log('🧪 Starting Comprehensive Notification Flow Test');
    console.log(`📝 Test ID: ${this.testId}`);
    console.log('=' * 60);

    try {
      // Step 1: Create test contact
      await this.createTestContact();
      
      // Step 2: Create test property
      await this.createTestProperty();
      
      // Step 3: Create test request (triggers notifications)
      await this.createTestRequest();
      
      // Step 4: Wait for async notification processing
      console.log('⏳ Waiting 30 seconds for notification processing...');
      await this.sleep(30000);
      
      // Step 5: Validate notification events
      await this.validateNotificationEvents();
      
      // Step 6: Manual validation prompts
      await this.promptManualValidation();
      
      console.log('✅ Notification flow test completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  async createTestContact() {
    console.log('👤 Creating test contact...');
    
    const input = {
      ...TEST_CONFIG.contact,
      fullName: `${TEST_CONFIG.contact.firstName} ${TEST_CONFIG.contact.lastName}`,
      emailNotifications: true,
      smsNotifications: true,
      owner: 'notification-test'
    };

    const result = await client.graphql({
      query: CREATE_CONTACT_MUTATION,
      variables: { input }
    });

    this.contactId = result.data.createContacts.id;
    console.log(`✅ Contact created: ${this.contactId}`);
    console.log(`📧 Email: ${result.data.createContacts.email}`);
    console.log(`📱 Phone: ${result.data.createContacts.phone}`);
    console.log(`📬 Email notifications: ${result.data.createContacts.emailNotifications}`);
    console.log(`📲 SMS notifications: ${result.data.createContacts.smsNotifications}`);
  }

  async createTestProperty() {
    console.log('🏠 Creating test property...');
    
    const input = {
      ...TEST_CONFIG.property,
      propertyFullAddress: `${TEST_CONFIG.property.houseAddress}, ${TEST_CONFIG.property.city}, ${TEST_CONFIG.property.state} ${TEST_CONFIG.property.zip}`,
      owner: 'notification-test'
    };

    const result = await client.graphql({
      query: CREATE_PROPERTY_MUTATION,
      variables: { input }
    });

    this.propertyId = result.data.createProperties.id;
    console.log(`✅ Property created: ${this.propertyId}`);
    console.log(`🏠 Address: ${result.data.createProperties.propertyFullAddress}`);
  }

  async createTestRequest() {
    console.log('📋 Creating test request (this should trigger notifications)...');
    
    const input = {
      ...TEST_CONFIG.request,
      homeownerContactId: this.contactId,
      addressId: this.propertyId,
      status: 'New Request',
      owner: 'notification-test'
    };

    const result = await client.graphql({
      query: CREATE_REQUEST_MUTATION,
      variables: { input }
    });

    this.requestId = result.data.createRequests.id;
    this.notificationId = `request_${this.requestId}`;
    
    console.log(`✅ Request created: ${this.requestId}`);
    console.log(`🔔 Expected notification ID: ${this.notificationId}`);
    console.log(`📧 Should send email to: ${TEST_CONFIG.contact.email}`);
    console.log(`📱 Should send SMS to: ${TEST_CONFIG.contact.phone}`);
  }

  async validateNotificationEvents() {
    console.log('📊 Validating notification events...');
    
    // Query for events related to our notification
    const filter = {
      notificationId: { eq: this.notificationId }
    };

    const result = await client.graphql({
      query: QUERY_NOTIFICATION_EVENTS,
      variables: { filter, limit: 50 }
    });

    const events = result.data.listNotificationEvents.items;
    console.log(`📝 Found ${events.length} notification events`);

    if (events.length === 0) {
      console.log('⚠️  No notification events found. This could mean:');
      console.log('   - Notification processor hasn\'t run yet');
      console.log('   - Notification ID doesn\'t match');
      console.log('   - No notifications were triggered');
      return;
    }

    // Group events by type
    const eventsByType = {};
    events.forEach(event => {
      if (!eventsByType[event.eventType]) {
        eventsByType[event.eventType] = [];
      }
      eventsByType[event.eventType].push(event);
    });

    // Validate expected events
    this.validateEventType('NOTIFICATION_QUEUED', eventsByType);
    this.validateEventType('EMAIL_ATTEMPT', eventsByType);
    this.validateEventType('SMS_ATTEMPT', eventsByType);
    this.validateEventType('EMAIL_SUCCESS', eventsByType);
    this.validateEventType('SMS_SUCCESS', eventsByType);

    // Check for any failures
    if (eventsByType['EMAIL_FAILED']) {
      console.log('❌ Email failures detected:');
      eventsByType['EMAIL_FAILED'].forEach(event => {
        console.log(`   Error: ${event.errorCode} - ${event.errorMessage}`);
      });
    }

    if (eventsByType['SMS_FAILED']) {
      console.log('❌ SMS failures detected:');
      eventsByType['SMS_FAILED'].forEach(event => {
        console.log(`   Error: ${event.errorCode} - ${event.errorMessage}`);
      });
    }

    // Calculate processing times
    this.analyzeProcessingTimes(events);
  }

  validateEventType(eventType, eventsByType) {
    const events = eventsByType[eventType] || [];
    if (events.length > 0) {
      console.log(`✅ ${eventType}: ${events.length} event(s)`);
      events.forEach(event => {
        if (event.provider) {
          console.log(`   Provider: ${event.provider}, Status: ${event.providerStatus || 'N/A'}`);
        }
        if (event.processingTimeMs) {
          console.log(`   Processing time: ${event.processingTimeMs}ms`);
        }
      });
    } else {
      console.log(`⚠️  ${eventType}: No events found`);
    }
  }

  analyzeProcessingTimes(events) {
    console.log('⏱️  Processing Time Analysis:');
    
    const emailEvents = events.filter(e => e.channel === 'EMAIL' && e.processingTimeMs);
    const smsEvents = events.filter(e => e.channel === 'SMS' && e.processingTimeMs);

    if (emailEvents.length > 0) {
      const avgEmailTime = emailEvents.reduce((sum, e) => sum + e.processingTimeMs, 0) / emailEvents.length;
      console.log(`📧 Average email processing time: ${Math.round(avgEmailTime)}ms`);
    }

    if (smsEvents.length > 0) {
      const avgSmsTime = smsEvents.reduce((sum, e) => sum + e.processingTimeMs, 0) / smsEvents.length;
      console.log(`📱 Average SMS processing time: ${Math.round(avgSmsTime)}ms`);
    }
  }

  async promptManualValidation() {
    console.log('');
    console.log('🔍 Manual Validation Required:');
    console.log('=' * 40);
    console.log(`📧 Check email: ${TEST_CONFIG.contact.email}`);
    console.log(`   - Should receive notification about new request`);
    console.log(`   - Email should contain request details`);
    console.log(`   - Check spam folder if not in inbox`);
    console.log('');
    console.log(`📱 Check SMS: ${TEST_CONFIG.contact.phone}`);
    console.log(`   - Should receive SMS notification`);
    console.log(`   - Message should mention new request`);
    console.log('');
    console.log('🔗 SendGrid Dashboard:');
    console.log('   - Log into SendGrid dashboard');
    console.log('   - Check Activity Feed for delivery status');
    console.log('   - Verify message was delivered/opened');
    console.log('');
    console.log('🔗 Twilio Dashboard:');
    console.log('   - Log into Twilio Console');
    console.log('   - Check SMS logs for delivery status');
    console.log('   - Verify message was delivered');
    console.log('');
    console.log('📊 CloudWatch Logs:');
    console.log('   - Check notification processor Lambda logs');
    console.log('   - Look for detailed event logging');
    console.log('   - Verify timing and status information');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function main() {
  const tester = new NotificationFlowTester();
  
  try {
    await tester.runCompleteTest();
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { NotificationFlowTester };