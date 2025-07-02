// Test what fields are returned by client.models
const { generateClient } = require('@aws-amplify/data');
const { Amplify } = require('aws-amplify');
const outputs = require('./amplify_outputs.json');

// Configure Amplify
Amplify.configure(outputs);

// Generate client
const client = generateClient({
  authMode: 'apiKey'
});

async function testClientModels() {
  const projectId = 'ce1b5212-c72a-2adc-9af3-5158955a182b';
  
  console.log('Testing client.models to see what fields are returned...');
  
  try {
    // Test ProjectComments
    const filter = { projectId: { eq: projectId } };
    const result = await client.models.ProjectComments.list({ filter, limit: 5 });
    
    console.log('ProjectComments result:', {
      success: !!result.data,
      count: result.data?.length || 0,
      hasErrors: !!result.errors
    });
    
    if (result.data && result.data.length > 0) {
      console.log('\nFirst comment fields:');
      const firstComment = result.data[0];
      Object.keys(firstComment).forEach(key => {
        console.log(`  ${key}: ${firstComment[key]}`);
      });
      
      console.log('\nDate fields specifically:');
      console.log('  createdAt:', firstComment.createdAt);
      console.log('  updatedAt:', firstComment.updatedAt);
      console.log('  createdDate:', firstComment.createdDate);
      console.log('  updatedDate:', firstComment.updatedDate);
    }
    
    if (result.errors) {
      console.error('Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testClientModels();