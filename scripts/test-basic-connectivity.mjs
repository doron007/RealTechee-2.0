#!/usr/bin/env node

/**
 * Basic Connectivity Test
 * Tests the most fundamental aspects of the notification system
 */

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json' assert { type: 'json' };

console.log('🔧 Basic Connectivity Test');
console.log('=' * 40);

// Configure Amplify
console.log('📡 Configuring Amplify...');
Amplify.configure(outputs);
const client = generateClient();
console.log('✅ Amplify configured');

// Test basic GraphQL connectivity
console.log('\n📊 Testing GraphQL connectivity...');
try {
  const result = await client.graphql({
    query: `query { __typename }`
  });
  console.log('✅ GraphQL connection working');
} catch (error) {
  console.log('❌ GraphQL connection failed:', error.message);
  process.exit(1);
}

// Test specific table queries
console.log('\n🗃️ Testing table access...');

// Test NotificationQueue
try {
  const queueResult = await client.graphql({
    query: `
      query ListNotificationQueue($limit: Int) {
        listNotificationQueue(limit: $limit) {
          items {
            id
            eventType
            status
          }
        }
      }
    `,
    variables: { limit: 1 }
  });
  console.log(`✅ NotificationQueue table accessible (${queueResult.data.listNotificationQueue.items.length} items)`);
} catch (error) {
  console.log('❌ NotificationQueue table error:', error.message);
}

// Test NotificationEvents
try {
  const eventsResult = await client.graphql({
    query: `
      query ListNotificationEvents($limit: Int) {
        listNotificationEvents(limit: $limit) {
          items {
            id
            eventType
            timestamp
          }
        }
      }
    `,
    variables: { limit: 1 }
  });
  console.log(`✅ NotificationEvents table accessible (${eventsResult.data.listNotificationEvents.items.length} items)`);
} catch (error) {
  console.log('❌ NotificationEvents table error:', error.message);
}

// Test creating a simple notification queue entry
console.log('\n📬 Testing notification creation...');
try {
  const testNotification = {
    eventType: 'test_basic_connectivity',
    payload: JSON.stringify({ 
      test: true, 
      timestamp: new Date().toISOString() 
    }),
    recipientIds: JSON.stringify(['test@realtechee.com']),
    channels: JSON.stringify(['EMAIL']),
    templateId: 'test-template',
    status: 'PENDING',
    retryCount: 0,
    owner: 'connectivity-test'
  };

  const result = await client.graphql({
    query: `
      mutation CreateNotificationQueue($input: CreateNotificationQueueInput!) {
        createNotificationQueue(input: $input) {
          id
          eventType
          status
          createdAt
        }
      }
    `,
    variables: { input: testNotification }
  });

  console.log(`✅ Test notification created: ${result.data.createNotificationQueue.id}`);
  
} catch (error) {
  console.log('❌ Failed to create test notification:', error.message);
  if (error.errors) {
    error.errors.forEach(err => {
      console.log(`   Error detail: ${err.message}`);
    });
  }
}

console.log('\n🎯 Basic connectivity test completed');
console.log('If all tests passed, the database layer is working correctly.');
console.log('Next step: Test Lambda function deployment and invocation.');