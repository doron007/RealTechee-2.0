// Quick test to check if data exists in current sandbox
const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');
const outputs = require('./amplify_outputs.json');

console.log('Testing connection to:', outputs.data.url);
console.log('Using API key:', outputs.data.api_key);

Amplify.configure(outputs);
const client = generateClient();

async function testData() {
  try {
    console.log('\n=== Testing Current Sandbox ===');
    
    // Test Affiliates
    const affiliates = await client.models.Affiliates.list();
    console.log('Affiliates:', affiliates.data?.length || 0);
    
    // Test Properties  
    const properties = await client.models.Properties.list();
    console.log('Properties:', properties.data?.length || 0);
    
    // Test Contacts
    const contacts = await client.models.Contacts.list();
    console.log('Contacts:', contacts.data?.length || 0);
    
    // Test Projects
    const projects = await client.models.Projects.list();
    console.log('Projects:', projects.data?.length || 0);
    
    // Test Quotes
    const quotes = await client.models.Quotes.list();
    console.log('Quotes:', quotes.data?.length || 0);
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error testing sandbox:', error);
  }
}

testData();
