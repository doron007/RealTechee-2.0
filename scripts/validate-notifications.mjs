#!/usr/bin/env node

/**
 * Quick Notification Validation Script
 * 
 * This script validates that:
 * 1. Notification events are being logged properly
 * 2. SendGrid and Twilio are providing delivery status
 * 3. Event logging system is working
 */

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

const QUERY_RECENT_EVENTS = `
  query ListNotificationEvents($limit: Int) {
    listNotificationEvents(limit: $limit) {
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
        metadata
      }
    }
  }
`;

const QUERY_RECENT_REQUESTS = `
  query ListRequests($limit: Int) {
    listRequests(limit: $limit) {
      items {
        id
        status
        product
        leadSource
        homeownerContactId
        createdAt
      }
    }
  }
`;

const QUERY_NOTIFICATION_QUEUE = `
  query ListNotificationQueue($limit: Int) {
    listNotificationQueue(limit: $limit) {
      items {
        id
        eventType
        status
        retryCount
        scheduledAt
        sentAt
        errorMessage
        createdAt
      }
    }
  }
`;

async function validateNotifications() {
  console.log('🔍 Validating Notification System...');
  console.log('='.repeat(50));

  try {
    // Check recent notification events
    console.log('📊 Checking recent notification events...');
    
    let events = [];
    try {
      const eventsResult = await client.graphql({
        query: QUERY_RECENT_EVENTS,
        variables: { limit: 20 }
      });
      events = eventsResult.data.listNotificationEvents.items;
      console.log(`Found ${events.length} recent notification events`);
    } catch (eventsError) {
      console.log(`❌ Failed to query notification events: ${eventsError.message}`);
    }

    if (events.length === 0) {
      console.log('⚠️  No notification events found in database');
      console.log('   This could mean:');
      console.log('   - No notifications have been processed yet');
      console.log('   - Event logging is not working');
      console.log('   - Database permissions issue');
    } else {
      // Analyze events
      analyzeEvents(events);
    }

    // Check notification queue
    console.log('\n📬 Checking notification queue...');
    let queuedNotifications = [];
    try {
      const queueResult = await client.graphql({
        query: QUERY_NOTIFICATION_QUEUE,
        variables: { limit: 10 }
      });
      queuedNotifications = queueResult.data.listNotificationQueue.items;
      console.log(`Found ${queuedNotifications.length} queued notifications`);
    } catch (queueError) {
      console.log(`❌ Failed to query notification queue: ${queueError.message}`);
    }

    if (queuedNotifications.length > 0) {
      queuedNotifications.forEach(notification => {
        console.log(`   ${notification.id.slice(-8)}: ${notification.eventType} (${notification.status})`);
        if (notification.errorMessage) {
          console.log(`     Error: ${notification.errorMessage}`);
        }
      });
    }

    // Check recent requests
    console.log('\n📋 Checking recent requests...');
    let requests = [];
    try {
      const requestsResult = await client.graphql({
        query: QUERY_RECENT_REQUESTS,
        variables: { limit: 10 }
      });
      requests = requestsResult.data.listRequests.items;
      console.log(`Found ${requests.length} recent requests`);
    } catch (requestsError) {
      console.log(`❌ Failed to query requests: ${requestsError.message}`);
    }

    if (requests.length > 0) {
      const latestRequest = requests[0];
      console.log(`Latest request: ${latestRequest.id} (${latestRequest.status})`);
      console.log(`Lead source: ${latestRequest.leadSource}`);
      console.log(`Created: ${latestRequest.createdAt}`);

      // Check if there are events for this request
      const requestEvents = events.filter(e => 
        e.notificationId.includes(latestRequest.id) ||
        e.notificationId === `request_${latestRequest.id}`
      );

      if (requestEvents.length > 0) {
        console.log(`✅ Found ${requestEvents.length} events for latest request`);
      } else {
        console.log(`⚠️  No events found for latest request ${latestRequest.id}`);
      }
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

function analyzeEvents(events) {
  console.log('\n📈 Event Analysis:');
  
  // Group by event type
  const eventsByType = {};
  events.forEach(event => {
    if (!eventsByType[event.eventType]) {
      eventsByType[event.eventType] = [];
    }
    eventsByType[event.eventType].push(event);
  });

  // Display event type summary
  Object.keys(eventsByType).sort().forEach(eventType => {
    const count = eventsByType[eventType].length;
    console.log(`  ${eventType}: ${count} events`);
  });

  // Check provider status
  console.log('\n📡 Provider Status Analysis:');
  
  const emailEvents = events.filter(e => e.channel === 'EMAIL');
  const smsEvents = events.filter(e => e.channel === 'SMS');

  if (emailEvents.length > 0) {
    console.log(`📧 Email Events: ${emailEvents.length}`);
    const sendGridEvents = emailEvents.filter(e => e.provider === 'SENDGRID');
    console.log(`   SendGrid events: ${sendGridEvents.length}`);
    
    const successfulEmails = emailEvents.filter(e => e.eventType === 'EMAIL_SUCCESS');
    const failedEmails = emailEvents.filter(e => e.eventType === 'EMAIL_FAILED');
    console.log(`   Successful: ${successfulEmails.length}, Failed: ${failedEmails.length}`);

    if (successfulEmails.length > 0) {
      console.log('   ✅ SendGrid delivery confirmations working');
    }
    if (failedEmails.length > 0) {
      console.log('   ❌ Some email failures detected');
      failedEmails.forEach(event => {
        console.log(`      Error: ${event.errorCode} - ${event.errorMessage}`);
      });
    }
  }

  if (smsEvents.length > 0) {
    console.log(`📱 SMS Events: ${smsEvents.length}`);
    const twilioEvents = smsEvents.filter(e => e.provider === 'TWILIO');
    console.log(`   Twilio events: ${twilioEvents.length}`);
    
    const successfulSMS = smsEvents.filter(e => e.eventType === 'SMS_SUCCESS');
    const failedSMS = smsEvents.filter(e => e.eventType === 'SMS_FAILED');
    console.log(`   Successful: ${successfulSMS.length}, Failed: ${failedSMS.length}`);

    if (successfulSMS.length > 0) {
      console.log('   ✅ Twilio delivery confirmations working');
    }
    if (failedSMS.length > 0) {
      console.log('   ❌ Some SMS failures detected');
      failedSMS.forEach(event => {
        console.log(`      Error: ${event.errorCode} - ${event.errorMessage}`);
      });
    }
  }

  // Performance analysis
  console.log('\n⏱️  Performance Analysis:');
  const eventsWithTiming = events.filter(e => e.processingTimeMs);
  
  if (eventsWithTiming.length > 0) {
    const avgTime = eventsWithTiming.reduce((sum, e) => sum + e.processingTimeMs, 0) / eventsWithTiming.length;
    const maxTime = Math.max(...eventsWithTiming.map(e => e.processingTimeMs));
    const minTime = Math.min(...eventsWithTiming.map(e => e.processingTimeMs));
    
    console.log(`   Average processing time: ${Math.round(avgTime)}ms`);
    console.log(`   Fastest: ${minTime}ms, Slowest: ${maxTime}ms`);
  } else {
    console.log('   No timing data available');
  }

  // Recent activity
  console.log('\n🕐 Recent Activity:');
  const recentEvents = events
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  recentEvents.forEach(event => {
    const time = new Date(event.timestamp).toLocaleString();
    console.log(`   ${time}: ${event.eventType} (${event.channel || 'N/A'})`);
  });
}

// Run validation
async function main() {
  try {
    await validateNotifications();
    console.log('\n✅ Notification validation completed');
  } catch (error) {
    console.error('\n💥 Validation failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateNotifications };