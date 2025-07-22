#!/usr/bin/env node

/**
 * Direct Lambda Test
 * 
 * Tests the Lambda function directly without going through GraphQL
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({ region: 'us-west-1' });
const functionName = 'amplify-realtecheeclone-d-notificationprocessorlam-sLgeFvCfN0xX';

console.log('🧪 Direct Lambda Function Test');
console.log('=' * 40);

// Test 1: Basic Lambda invocation
console.log('\n1️⃣ Testing basic Lambda invocation...');
try {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify({
      source: 'direct-test',
      action: 'health-check',
      timestamp: new Date().toISOString()
    }),
    InvocationType: 'RequestResponse'
  });

  const response = await lambda.send(command);
  
  if (response.StatusCode === 200) {
    console.log('✅ Lambda invocation successful');
    
    if (response.Payload) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      console.log('📊 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('📊 No response payload (might indicate no notifications to process)');
    }
  } else {
    console.log(`❌ Lambda invocation failed with status: ${response.StatusCode}`);
  }
} catch (error) {
  console.log('❌ Lambda invocation error:', error.message);
}

// Test 2: Test with a simulated notification payload
console.log('\n2️⃣ Testing with simulated notification processing...');
try {
  const testPayload = {
    source: 'direct-test',
    action: 'process-notifications',
    debug: true,
    forceProcess: true,
    timestamp: new Date().toISOString()
  };

  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(testPayload),
    InvocationType: 'RequestResponse'
  });

  const response = await lambda.send(command);
  
  if (response.StatusCode === 200) {
    console.log('✅ Test notification processing successful');
    
    if (response.Payload) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      console.log('📊 Processing result:', JSON.stringify(result, null, 2));
    }
  } else {
    console.log(`❌ Test processing failed with status: ${response.StatusCode}`);
  }
} catch (error) {
  console.log('❌ Test processing error:', error.message);
}

console.log('\n🎯 Direct Lambda test completed');
console.log('\n🔧 Next steps:');
console.log('   1. Check CloudWatch logs for detailed execution info');
console.log('   2. Verify database table connections');
console.log('   3. Check API key configuration in Parameter Store');