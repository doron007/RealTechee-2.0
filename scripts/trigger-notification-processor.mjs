#!/usr/bin/env node

/**
 * Manual Notification Processor Trigger
 * 
 * Since EventBridge scheduling is not set up yet, this script manually
 * invokes the notification processor Lambda function to process queued notifications.
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import outputs from '../amplify_outputs.json' assert { type: 'json' };

// Extract AWS configuration from amplify outputs
const awsConfig = {
  region: outputs.aws_project_region,
  credentials: {
    // Note: This will use default AWS credentials (AWS CLI, env vars, etc.)
    // For production, you'd want to configure appropriate credentials
  }
};

const lambda = new LambdaClient(awsConfig);

async function invokeLambda(functionName, payload = {}) {
  try {
    console.log(`🚀 Invoking Lambda function: ${functionName}`);
    console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
      InvocationType: 'RequestResponse' // Synchronous invocation
    });

    const response = await lambda.send(command);
    
    if (response.StatusCode === 200) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      console.log(`✅ Lambda invocation successful`);
      console.log(`📥 Response:`, JSON.stringify(result, null, 2));
      return result;
    } else {
      console.error(`❌ Lambda invocation failed with status code: ${response.StatusCode}`);
      return null;
    }
  } catch (error) {
    console.error(`💥 Error invoking Lambda:`, error);
    throw error;
  }
}

async function findNotificationProcessorFunction() {
  // Try to find the function name from amplify outputs
  const customOutputs = outputs.custom || {};
  
  // Look for notification processor ARN
  const processorArn = customOutputs.notificationProcessorArn;
  if (processorArn) {
    // Extract function name from ARN
    const functionName = processorArn.split(':').pop();
    console.log(`🔍 Found notification processor function: ${functionName}`);
    return functionName;
  }

  // Fallback: try common naming patterns
  const possibleNames = [
    'amplify-realtecheeclone-doron-sandbox-648934873b-notificationProcessor',
    'notification-processor',
    'notificationProcessor'
  ];

  console.log(`🔍 Could not find function ARN in outputs, trying common names...`);
  return possibleNames[0]; // Use the most likely name
}

async function triggerNotificationProcessor() {
  console.log('🧪 Manual Notification Processor Trigger');
  console.log('=' * 50);

  try {
    // Find the Lambda function name
    const functionName = await findNotificationProcessorFunction();
    
    // Trigger the notification processor
    const result = await invokeLambda(functionName, {
      source: 'manual-trigger',
      requestId: `manual-${Date.now()}`,
      timestamp: new Date().toISOString()
    });

    if (result) {
      console.log('\n📊 Processing Summary:');
      if (result.processedNotifications) {
        console.log(`   Notifications processed: ${result.processedNotifications}`);
      }
      if (result.errors && result.errors.length > 0) {
        console.log(`   Errors encountered: ${result.errors.length}`);
        result.errors.forEach((error, index) => {
          console.log(`     ${index + 1}. ${error}`);
        });
      }
      if (result.emailsSent) {
        console.log(`   Emails sent: ${result.emailsSent}`);
      }
      if (result.smsSent) {
        console.log(`   SMS messages sent: ${result.smsSent}`);
      }
    }

    console.log('\n✅ Notification processor trigger completed');
    console.log('💡 Check CloudWatch logs for detailed execution information');
    
  } catch (error) {
    console.error('\n💥 Failed to trigger notification processor:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure AWS credentials are configured');
    console.log('   2. Verify the Lambda function name is correct');
    console.log('   3. Check that the function has been deployed');
    console.log('   4. Ensure you have permissions to invoke Lambda functions');
    throw error;
  }
}

// Run the trigger
async function main() {
  try {
    await triggerNotificationProcessor();
  } catch (error) {
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { triggerNotificationProcessor };