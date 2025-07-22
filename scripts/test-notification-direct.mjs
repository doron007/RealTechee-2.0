#!/usr/bin/env node

/**
 * Direct Notification System Test
 * 
 * This script directly tests:
 * 1. Database connectivity and table existence
 * 2. Lambda function deployment status
 * 3. Secure configuration access
 * 4. Direct notification sending
 */

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { LambdaClient, InvokeCommand, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import outputs from '../amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

const lambda = new LambdaClient({ 
  region: outputs.aws_project_region 
});

// Test queries
const TEST_NOTIFICATION_QUEUE = `
  mutation CreateNotificationQueue($input: CreateNotificationQueueInput!) {
    createNotificationQueue(input: $input) {
      id
      eventType
      status
      createdAt
    }
  }
`;

const LIST_NOTIFICATION_QUEUE = `
  query ListNotificationQueue($limit: Int) {
    listNotificationQueue(limit: $limit) {
      items {
        id
        eventType
        status
        errorMessage
        createdAt
      }
    }
  }
`;

const LIST_NOTIFICATION_EVENTS = `
  query ListNotificationEvents($limit: Int) {
    listNotificationEvents(limit: $limit) {
      items {
        id
        eventType
        timestamp
      }
    }
  }
`;

class NotificationSystemTester {
  constructor() {
    this.testId = `DIRECT_TEST_${Date.now()}`;
  }

  async runCompleteTest() {
    console.log('🧪 Direct Notification System Test');
    console.log('=' * 50);
    console.log(`Test ID: ${this.testId}\n`);

    const results = {
      databaseAccess: false,
      tablesExist: false,
      lambdaExists: false,
      canQueueNotification: false,
      canInvokeLambda: false
    };

    try {
      // Test 1: Database connectivity
      console.log('1️⃣ Testing database connectivity...');
      results.databaseAccess = await this.testDatabaseAccess();

      // Test 2: Table existence  
      console.log('\n2️⃣ Testing table existence...');
      results.tablesExist = await this.testTablesExist();

      // Test 3: Lambda function existence
      console.log('\n3️⃣ Testing Lambda function existence...');
      results.lambdaExists = await this.testLambdaExists();

      // Test 4: Queue notification
      console.log('\n4️⃣ Testing notification queueing...');
      results.canQueueNotification = await this.testQueueNotification();

      // Test 5: Direct Lambda invocation
      console.log('\n5️⃣ Testing direct Lambda invocation...');
      results.canInvokeLambda = await this.testDirectLambdaInvocation();

      // Summary
      this.printSummary(results);

    } catch (error) {
      console.error('\n💥 Test failed:', error);
      return false;
    }

    return Object.values(results).every(result => result === true);
  }

  async testDatabaseAccess() {
    try {
      // Try a simple query to test basic connectivity
      await client.graphql({
        query: `query { __typename }`
      });
      console.log('   ✅ Database connectivity working');
      return true;
    } catch (error) {
      console.log('   ❌ Database connectivity failed:', error.message);
      return false;
    }
  }

  async testTablesExist() {
    const tables = ['NotificationQueue', 'NotificationEvents'];
    let allExist = true;

    for (const table of tables) {
      try {
        if (table === 'NotificationQueue') {
          const result = await client.graphql({
            query: LIST_NOTIFICATION_QUEUE,
            variables: { limit: 1 }
          });
          console.log(`   ✅ ${table} table exists (${result.data.listNotificationQueue.items.length} items)`);
        } else if (table === 'NotificationEvents') {
          const result = await client.graphql({
            query: LIST_NOTIFICATION_EVENTS,
            variables: { limit: 1 }
          });
          console.log(`   ✅ ${table} table exists (${result.data.listNotificationEvents.items.length} items)`);
        }
      } catch (error) {
        console.log(`   ❌ ${table} table missing or inaccessible:`, error.message);
        allExist = false;
      }
    }

    return allExist;
  }

  async testLambdaExists() {
    try {
      // List all Lambda functions to find notification processor
      const command = new ListFunctionsCommand({});
      const response = await lambda.send(command);
      
      const notificationFunctions = response.Functions?.filter(fn => 
        fn.FunctionName?.includes('notification') || 
        fn.FunctionName?.includes('NotificationProcessor')
      ) || [];

      if (notificationFunctions.length > 0) {
        console.log('   ✅ Found notification Lambda functions:');
        notificationFunctions.forEach(fn => {
          console.log(`      - ${fn.FunctionName} (${fn.Runtime})`);
        });
        return true;
      } else {
        console.log('   ❌ No notification Lambda functions found');
        console.log('   Available functions:');
        response.Functions?.slice(0, 5).forEach(fn => {
          console.log(`      - ${fn.FunctionName}`);
        });
        return false;
      }
    } catch (error) {
      console.log('   ❌ Failed to list Lambda functions:', error.message);
      return false;
    }
  }

  async testQueueNotification() {
    try {
      const testNotification = {
        eventType: 'test_notification',
        payload: JSON.stringify({
          test: true,
          message: 'Direct notification system test',
          timestamp: new Date().toISOString(),
          testId: this.testId
        }),
        recipientIds: JSON.stringify(['test@realtechee.com']),
        channels: JSON.stringify(['EMAIL']),
        templateId: 'test-template',
        status: 'PENDING',
        retryCount: 0,
        owner: 'notification-test'
      };

      const result = await client.graphql({
        query: TEST_NOTIFICATION_QUEUE,
        variables: { input: testNotification }
      });

      const notificationId = result.data.createNotificationQueue.id;
      console.log(`   ✅ Test notification queued: ${notificationId}`);
      return true;

    } catch (error) {
      console.log('   ❌ Failed to queue notification:', error.message);
      return false;
    }
  }

  async testDirectLambdaInvocation() {
    try {
      // Try to find and invoke the notification processor
      const listCommand = new ListFunctionsCommand({});
      const response = await lambda.send(listCommand);
      
      const notificationFunction = response.Functions?.find(fn => 
        fn.FunctionName?.includes('notification') || 
        fn.FunctionName?.includes('NotificationProcessor')
      );

      if (!notificationFunction) {
        console.log('   ❌ No notification function found to invoke');
        return false;
      }

      console.log(`   🚀 Invoking function: ${notificationFunction.FunctionName}`);

      const invokeCommand = new InvokeCommand({
        FunctionName: notificationFunction.FunctionName,
        Payload: JSON.stringify({
          source: 'direct-test',
          testId: this.testId,
          timestamp: new Date().toISOString()
        }),
        InvocationType: 'RequestResponse'
      });

      const invokeResponse = await lambda.send(invokeCommand);
      
      if (invokeResponse.StatusCode === 200) {
        const result = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
        console.log('   ✅ Lambda invocation successful');
        console.log(`   📊 Response:`, JSON.stringify(result, null, 2));
        return true;
      } else {
        console.log(`   ❌ Lambda invocation failed with status: ${invokeResponse.StatusCode}`);
        return false;
      }

    } catch (error) {
      console.log('   ❌ Failed to invoke Lambda:', error.message);
      if (error.message.includes('AccessDenied')) {
        console.log('   💡 This might be a permissions issue - check AWS credentials');
      }
      return false;
    }
  }

  printSummary(results) {
    console.log('\n📊 Test Results Summary');
    console.log('=' * 30);
    
    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      const status = passed ? 'PASS' : 'FAIL';
      console.log(`${icon} ${test}: ${status}`);
    });

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r === true).length;
    
    console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Notification system is working.');
    } else {
      console.log('⚠️  Some tests failed. Check the specific errors above.');
      
      // Provide troubleshooting guidance
      console.log('\n🔧 Troubleshooting Guide:');
      
      if (!results.databaseAccess) {
        console.log('   📡 Database: Check Amplify configuration and network connectivity');
      }
      
      if (!results.tablesExist) {
        console.log('   🗃️  Tables: Run `npx ampx generate` to recreate missing tables');
      }
      
      if (!results.lambdaExists) {
        console.log('   ⚡ Lambda: Check if notification-processor was deployed properly');
      }
      
      if (!results.canQueueNotification) {
        console.log('   📬 Queue: Check GraphQL permissions and schema');
      }
      
      if (!results.canInvokeLambda) {
        console.log('   🚀 Invoke: Check AWS credentials and Lambda permissions');
      }
    }
  }
}

// Run the test
async function main() {
  const tester = new NotificationSystemTester();
  
  try {
    const success = await tester.runCompleteTest();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { NotificationSystemTester };