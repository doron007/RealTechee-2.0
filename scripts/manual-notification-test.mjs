#!/usr/bin/env node

/**
 * Manual Notification Test
 * 
 * Bypasses GraphQL auth by directly inserting into DynamoDB,
 * then triggers the Lambda to process the notification
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const dynamoClient = new DynamoDBClient({ region: 'us-west-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const lambda = new LambdaClient({ region: 'us-west-1' });

const NOTIFICATION_QUEUE_TABLE = 'NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE';
const LAMBDA_FUNCTION = 'amplify-realtecheeclone-d-notificationprocessorlam-sLgeFvCfN0xX';

console.log('🧪 Manual Notification Test');
console.log('=' * 40);

async function createTestNotification() {
  console.log('\n1️⃣ Creating test notification in DynamoDB...');
  
  const testNotification = {
    id: `test-${Date.now()}`,
    eventType: 'test_manual_notification',
    payload: JSON.stringify({
      customer: {
        name: 'Test User',
        email: 'doron@realtechee.com',  // Use your real email
        phone: '+16699994563'           // Use your real phone
      },
      property: {
        address: '123 Test Street, Test City, CA 90210'
      },
      project: {
        product: 'Manual Test Notification',
        message: 'This is a manual test to verify the notification system is working.'
      },
      submission: {
        id: `TEST-${Date.now()}`,
        timestamp: new Date().toLocaleString()
      },
      admin: {
        dashboardUrl: 'http://localhost:3001/admin/requests'
      }
    }),
    recipientIds: JSON.stringify(['admin-team']),
    channels: JSON.stringify(['EMAIL', 'SMS']),
    templateId: 'get-estimate-template-001',
    status: 'PENDING',
    retryCount: 0,
    scheduledAt: new Date().toISOString(),
    owner: 'manual-test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    __typename: 'NotificationQueue'
  };

  try {
    const command = new PutCommand({
      TableName: NOTIFICATION_QUEUE_TABLE,
      Item: testNotification
    });

    await docClient.send(command);
    console.log(`✅ Test notification created: ${testNotification.id}`);
    return testNotification.id;
  } catch (error) {
    console.log('❌ Failed to create test notification:', error.message);
    throw error;
  }
}

async function triggerLambdaProcessor() {
  console.log('\n2️⃣ Triggering Lambda notification processor...');
  
  try {
    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION,
      Payload: JSON.stringify({
        source: 'manual-test',
        time: new Date().toISOString(),
        debug: true
      }),
      InvocationType: 'RequestResponse'
    });

    const response = await lambda.send(command);
    
    if (response.StatusCode === 200) {
      console.log('✅ Lambda executed successfully');
      
      if (response.Payload) {
        const result = JSON.parse(new TextDecoder().decode(response.Payload));
        console.log('📊 Lambda response:', JSON.stringify(result, null, 2));
      } else {
        console.log('📊 Lambda completed (no response data)');
      }
      return true;
    } else {
      console.log(`❌ Lambda failed with status: ${response.StatusCode}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Lambda execution error:', error.message);
    return false;
  }
}

async function checkLogs() {
  console.log('\n3️⃣ Checking recent CloudWatch logs...');
  
  try {
    const { execSync } = await import('child_process');
    const startTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    
    const logCommand = `aws logs filter-log-events --region us-west-1 --log-group-name "/aws/lambda/amplify-realtecheeclone-d-notificationprocessorlam-GeYcNdEsJclH" --start-time ${startTime} --query 'events[*].message' --output text`;
    
    const logs = execSync(logCommand, { encoding: 'utf8' }).trim();
    
    if (logs) {
      console.log('📜 Recent logs:');
      console.log(logs);
    } else {
      console.log('📜 No recent logs found');
    }
  } catch (error) {
    console.log('❌ Failed to retrieve logs:', error.message);
  }
}

async function runFullTest() {
  try {
    console.log('🎯 Starting manual notification test...');
    
    // Step 1: Create test notification
    const notificationId = await createTestNotification();
    
    // Step 2: Trigger Lambda
    await triggerLambdaProcessor();
    
    // Step 3: Wait a moment for processing
    console.log('\n⏳ Waiting 10 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 4: Check logs
    await checkLogs();
    
    console.log('\n✅ Manual test completed!');
    console.log('\n🔍 What to check:');
    console.log(`   📧 Email: Check doron@realtechee.com for test notification`);
    console.log(`   📱 SMS: Check +16699994563 for test notification`);
    console.log(`   📊 SendGrid: Check activity dashboard for email delivery`);
    console.log(`   📊 Twilio: Check console for SMS delivery`);
    console.log(`   📜 Logs: Check CloudWatch for detailed execution logs`);
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Execute the test
runFullTest();