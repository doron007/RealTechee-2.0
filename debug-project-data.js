// Debug script to test project data queries
// Run this with: node debug-project-data.js

const { generateClient } = require('@aws-amplify/api');
const { Amplify } = require('aws-amplify');
const outputs = require('./amplify_outputs.json');

// Configure Amplify
Amplify.configure(outputs);

// Generate GraphQL client
const client = generateClient({
  authMode: 'apiKey'
});

const listProjectComments = `query ListProjectComments(
  $filter: ModelProjectCommentsFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjectComments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      addToGallery
      comment
      createdAt
      createdDate
      files
      id
      isPrivate
      nickname
      owner
      postedByContactId
      postedByProfileImage
      projectId
      updatedAt
      updatedDate
      __typename
    }
    nextToken
    __typename
  }
}`;

async function testProjectData() {
  const projectId = 'ce1b5212-c72a-2adc-9af3-5158955a182b';
  
  console.log('Testing project ID:', projectId);
  
  try {
    // First, let's get all comments to see what projectIds exist
    console.log('\n1. Getting ALL comments to see available projectIds...');
    const allCommentsResult = await client.graphql({
      query: listProjectComments,
      variables: { limit: 100 }
    });
    
    console.log('Total comments found:', allCommentsResult.data.listProjectComments.items?.length || 0);
    
    // Show sample projectIds
    const sampleProjectIds = allCommentsResult.data.listProjectComments.items
      ?.slice(0, 10)
      ?.map(item => ({ id: item.id, projectId: item.projectId, nickname: item.nickname }));
    console.log('Sample projectIds in comments:', sampleProjectIds);
    
    // Now test our specific filter
    console.log('\n2. Testing filter for specific project...');
    const filter = { projectId: { eq: projectId } };
    const result = await client.graphql({
      query: listProjectComments,
      variables: { filter, limit: 100 }
    });
    
    console.log('Filtered result:', {
      success: !!result.data.listProjectComments.items,
      count: result.data.listProjectComments.items?.length || 0,
      hasErrors: !!result.errors,
      filter: filter
    });
    
    if (result.errors) {
      console.error('Query errors:', result.errors);
    }
    
    if (result.data.listProjectComments.items?.length > 0) {
      console.log('Found comments:', result.data.listProjectComments.items.map(item => ({
        id: item.id,
        projectId: item.projectId,
        nickname: item.nickname,
        createdDate: item.createdDate,
        createdAt: item.createdAt
      })));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testProjectData();