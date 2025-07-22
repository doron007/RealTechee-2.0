// Test notification creation to debug the exact issue
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { createNotificationQueue } from '../mutations.ts';
import amplifyconfig from '../amplify_outputs.json' with { type: "json" };

Amplify.configure(amplifyconfig);
const client = generateClient();

async function testNotificationCreation() {
  console.log('🧪 Testing notification creation...');
  
  try {
    const inputData = {
      eventType: 'get_estimate_request',
      payload: JSON.stringify({
        requestId: 'test-request-id',
        agentName: 'Test Agent',
        message: 'Test notification',
        adminLink: 'https://localhost:3000/admin/requests/test'
      }),
      recipientIds: JSON.stringify(['admin-team']),
      channels: JSON.stringify(['EMAIL']),
      templateId: 'get-estimate-template-001', // This should be the issue
      status: 'PENDING',
      retryCount: 0,
      owner: 'system'
    };

    console.log('📋 Input data:', inputData);

    const result = await client.graphql({
      query: createNotificationQueue,
      variables: {
        input: inputData
      }
    });

    console.log('✅ Notification created successfully:', result);
    
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
}

testNotificationCreation();