// Direct GraphQL test to analyze the issue
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import fs from 'fs';

// Read the amplify outputs
const outputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf8'));

// Configure Amplify
Amplify.configure(outputs);

// Generate client
const client = generateClient();

async function testGraphQLQueries() {
  console.log('🔍 Testing GraphQL Queries After Schema Update...\n');
  
  try {
    // Test Properties (this should work since it never had the ID conflict)
    console.log('📊 Testing Properties Query...');
    const propertiesResult = await client.models.Properties.list({ limit: 3 });
    console.log('Properties Result:', {
      success: !!propertiesResult.data,
      count: propertiesResult.data?.length || 0,
      errors: propertiesResult.errors || null,
      nullItems: propertiesResult.data?.filter(item => item === null).length || 0,
      validItems: propertiesResult.data?.filter(item => item !== null).length || 0,
      sampleItem: propertiesResult.data?.find(item => item !== null) || null
    });
    
    // Test Contacts (this had the ID conflict)
    console.log('\n👥 Testing Contacts Query...');
    const contactsResult = await client.models.Contacts.list({ limit: 3 });
    console.log('Contacts Result:', {
      success: !!contactsResult.data,
      count: contactsResult.data?.length || 0,
      errors: contactsResult.errors || null,
      nullItems: contactsResult.data?.filter(item => item === null).length || 0,
      validItems: contactsResult.data?.filter(item => item !== null).length || 0,
      sampleItem: contactsResult.data?.find(item => item !== null) || null
    });
    
    // Test Projects (this had the ID conflict)
    console.log('\n🏗️ Testing Projects Query...');
    const projectsResult = await client.models.Projects.list({ limit: 3 });
    console.log('Projects Result:', {
      success: !!projectsResult.data,
      count: projectsResult.data?.length || 0,
      errors: projectsResult.errors || null,
      nullItems: projectsResult.data?.filter(item => item === null).length || 0,
      validItems: projectsResult.data?.filter(item => item !== null).length || 0,
      sampleItem: projectsResult.data?.find(item => item !== null) || null
    });
    
    // Test Quotes (this had the ID conflict)  
    console.log('\n💰 Testing Quotes Query...');
    const quotesResult = await client.models.Quotes.list({ limit: 3 });
    console.log('Quotes Result:', {
      success: !!quotesResult.data,
      count: quotesResult.data?.length || 0,
      errors: quotesResult.errors || null,
      nullItems: quotesResult.data?.filter(item => item === null).length || 0,
      validItems: quotesResult.data?.filter(item => item !== null).length || 0,
      sampleItem: quotesResult.data?.find(item => item !== null) || null
    });
    
  } catch (error) {
    console.error('❌ Error testing queries:', error);
  }
}

testGraphQLQueries();