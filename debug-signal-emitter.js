// Debug signal emitter directly
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);

// Create GraphQL client
const graphqlClient = generateClient({
  authMode: 'apiKey'
});

async function testSignalEmission() {
  console.log('🧪 TESTING SIGNAL EMISSION DIRECTLY');
  console.log('=' .repeat(60));
  
  try {
    console.log('📡 Testing GraphQL client configuration...');
    
    // Test basic GraphQL connection first
    const LIST_SIGNAL_EVENTS = `
      query ListSignalEvents {
        listSignalEvents {
          items {
            id
            signalType
            emittedAt
          }
        }
      }
    `;
    
    console.log('🔍 Fetching existing SignalEvents...');
    const listResult = await graphqlClient.graphql({
      query: LIST_SIGNAL_EVENTS
    });
    
    console.log('✅ GraphQL client working, found events:', listResult.data.listSignalEvents.items.length);
    
    // Now test signal emission
    const CREATE_SIGNAL_EVENT = `
      mutation CreateSignalEvents($input: CreateSignalEventsInput!) {
        createSignalEvents(input: $input) {
          id
          signalType
          payload
          emittedAt
          emittedBy
          source
          processed
          createdAt
          updatedAt
        }
      }
    `;
    
    const testSignalData = {
      signalType: 'form_get_estimate_submission',
      payload: JSON.stringify({
        customerName: 'Debug Test User',
        customerEmail: 'debug@test.com',
        test: true
      }),
      emittedAt: new Date().toISOString(),
      emittedBy: 'debug_test',
      source: 'debug_test',
      processed: false
    };
    
    console.log('🎯 Emitting test signal...');
    const createResult = await graphqlClient.graphql({
      query: CREATE_SIGNAL_EVENT,
      variables: { input: testSignalData }
    });
    
    console.log('✅ Signal emission successful:', createResult.data.createSignalEvents.id);
    
    console.log('\n🎯 DIAGNOSIS: Signal emission system is working!');
    console.log('The issue may be in:');
    console.log('1. Form submission not reaching signal emission code');
    console.log('2. Error handling silencing failures');
    console.log('3. Signal emission happening but Lambda not processing');
    
  } catch (error) {
    console.error('❌ Signal emission failed:', error.message);
    console.log('\n🎯 DIAGNOSIS: Signal emission system has issues:');
    console.log('1. GraphQL client configuration problem');
    console.log('2. API permissions issue'); 
    console.log('3. SignalEvents model not accessible');
  }
}

testSignalEmission().catch(console.error);