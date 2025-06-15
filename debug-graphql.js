// Debug script to analyze GraphQL queries and responses
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);

// Generate a typed client for your schema
const client = generateClient();

// Function to debug GraphQL queries and responses
async function debugGraphQLQueries() {
  console.log('🔍 Starting GraphQL Debug Analysis...');
  
  // Test Properties query
  console.log('\n📊 Testing Properties Query...');
  try {
    const propertiesResult = await client.models.Properties.list({ limit: 5 });
    console.log('Properties Query Result:', {
      success: !!propertiesResult.data,
      dataLength: propertiesResult.data?.length || 0,
      errors: propertiesResult.errors || 'None',
      firstItem: propertiesResult.data?.[0] || 'None',
      allItems: propertiesResult.data || []
    });
    
    // Check if items are null
    const nullItems = propertiesResult.data?.filter(item => item === null) || [];
    const validItems = propertiesResult.data?.filter(item => item !== null) || [];
    console.log('Null items count:', nullItems.length);
    console.log('Valid items count:', validItems.length);
    
    if (validItems.length > 0) {
      console.log('Sample valid item:', validItems[0]);
      console.log('Sample valid item fields:', Object.keys(validItems[0]));
    }
    
  } catch (error) {
    console.error('Properties query error:', error);
  }
  
  // Test Contacts query
  console.log('\n👥 Testing Contacts Query...');
  try {
    const contactsResult = await client.models.Contacts.list({ limit: 5 });
    console.log('Contacts Query Result:', {
      success: !!contactsResult.data,
      dataLength: contactsResult.data?.length || 0,
      errors: contactsResult.errors || 'None',
      firstItem: contactsResult.data?.[0] || 'None'
    });
    
    const nullContacts = contactsResult.data?.filter(item => item === null) || [];
    const validContacts = contactsResult.data?.filter(item => item !== null) || [];
    console.log('Null contacts count:', nullContacts.length);
    console.log('Valid contacts count:', validContacts.length);
    
    if (validContacts.length > 0) {
      console.log('Sample valid contact:', validContacts[0]);
    }
    
  } catch (error) {
    console.error('Contacts query error:', error);
  }
  
  // Test Projects query  
  console.log('\n🏗️ Testing Projects Query...');
  try {
    const projectsResult = await client.models.Projects.list({ limit: 5 });
    console.log('Projects Query Result:', {
      success: !!projectsResult.data,
      dataLength: projectsResult.data?.length || 0,
      errors: projectsResult.errors || 'None',
      firstItem: projectsResult.data?.[0] || 'None'
    });
    
    const nullProjects = projectsResult.data?.filter(item => item === null) || [];
    const validProjects = projectsResult.data?.filter(item => item !== null) || [];
    console.log('Null projects count:', nullProjects.length);
    console.log('Valid projects count:', validProjects.length);
    
  } catch (error) {
    console.error('Projects query error:', error);
  }
  
  console.log('\n✅ GraphQL Debug Analysis Complete');
}

// Run the debug analysis
debugGraphQLQueries().catch(console.error);