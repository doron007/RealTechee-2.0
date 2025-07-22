import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json' assert { type: 'json' };

// Define GraphQL queries directly
const listRequests = `
  query ListRequests($limit: Int) {
    listRequests(limit: $limit) {
      items {
        id
        status
        leadSource
        message
        additionalNotes
        createdAt
        updatedAt
      }
    }
  }
`;

const listProperties = `
  query ListProperties($limit: Int) {
    listProperties(limit: $limit) {
      items {
        id
        propertyFullAddress
        houseAddress
        city
        state
        zip
        createdAt
        updatedAt
      }
    }
  }
`;

const listContacts = `
  query ListContacts($limit: Int) {
    listContacts(limit: $limit) {
      items {
        id
        fullName
        firstName
        lastName
        email
        phone
        createdAt
        updatedAt
      }
    }
  }
`;

// Configure Amplify
Amplify.configure(outputs);

// Generate client with API key for public access
const client = generateClient({
  authMode: 'apiKey'
});

async function checkData() {
  console.log('🔍 Checking DynamoDB data...');
  
  try {
    // Check Requests
    console.log('\n📋 Checking Requests table...');
    const requestsResponse = await client.graphql({
      query: listRequests,
      variables: { limit: 10 }
    });
    
    const requests = requestsResponse.data.listRequests.items;
    console.log(`Found ${requests.length} requests`);
    
    if (requests.length > 0) {
      console.log('Latest 3 requests:');
      requests.slice(0, 3).forEach((req, i) => {
        console.log(`  ${i+1}. ID: ${req.id}`);
        console.log(`     Status: ${req.status}`);
        console.log(`     Source: ${req.leadSource}`);
        console.log(`     Created: ${req.createdAt}`);
        console.log(`     Message: ${req.message || 'N/A'}`);
        console.log(`     Test Data: ${req.additionalNotes || 'N/A'}`);
        console.log('');
      });
    }
    
    // Check Properties  
    console.log('🏠 Checking Properties table...');
    const propertiesResponse = await client.graphql({
      query: listProperties,
      variables: { limit: 5 }
    });
    
    const properties = propertiesResponse.data.listProperties.items;
    console.log(`Found ${properties.length} properties`);
    
    if (properties.length > 0) {
      console.log('Latest 3 properties:');
      properties.slice(0, 3).forEach((prop, i) => {
        console.log(`  ${i+1}. ID: ${prop.id}`);
        console.log(`     Address: ${prop.propertyFullAddress || 'N/A'}`);
        console.log(`     Created: ${prop.createdAt}`);
        console.log('');
      });
    }
    
    // Check Contacts
    console.log('👥 Checking Contacts table...');
    const contactsResponse = await client.graphql({
      query: listContacts,
      variables: { limit: 5 }
    });
    
    const contacts = contactsResponse.data.listContacts.items;
    console.log(`Found ${contacts.length} contacts`);
    
    if (contacts.length > 0) {
      console.log('Latest 3 contacts:');
      contacts.slice(0, 3).forEach((contact, i) => {
        console.log(`  ${i+1}. ID: ${contact.id}`);
        console.log(`     Name: ${contact.fullName || 'N/A'}`);
        console.log(`     Email: ${contact.email || 'N/A'}`);
        console.log(`     Created: ${contact.createdAt}`);
        console.log('');
      });
    }
    
    // Summary
    console.log('📊 Data Summary:');
    console.log(`  Requests: ${requests.length}`);
    console.log(`  Properties: ${properties.length}`);
    console.log(`  Contacts: ${contacts.length}`);
    
    // Check for recent test data
    const testRequests = requests.filter(r => r.leadSource === 'E2E_TEST' || (r.additionalNotes && r.additionalNotes.includes('TEST_SESSION')));
    console.log(`  Test Requests: ${testRequests.length}`);
    
    if (testRequests.length > 0) {
      console.log('\n🧪 Recent test submissions:');
      testRequests.forEach(req => {
        console.log(`  - ${req.id} (${req.createdAt})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  }
}

checkData();