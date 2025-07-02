// Debug script to investigate backend data for the project
// This will help us understand what fields are actually returned

const { generateClient } = require('@aws-amplify/api');
const { generateClient: generateDataClient } = require('@aws-amplify/data');
const { Amplify } = require('aws-amplify');
const outputs = require('./amplify_outputs.json');

// Configure Amplify
Amplify.configure(outputs);

// Generate both clients
const graphqlClient = generateClient({ authMode: 'apiKey' });
const dataClient = generateDataClient({ authMode: 'apiKey' });

const projectId = 'ce1b5212-c72a-2adc-9af3-5158955a182b';

// Test queries
const listProjectCommentsQuery = `query ListProjectComments($filter: ModelProjectCommentsFilterInput, $limit: Int) {
  listProjectComments(filter: $filter, limit: $limit) {
    items {
      id
      projectId
      nickname
      comment
      files
      isPrivate
      postedByContactId
      postedByProfileImage
      addToGallery
      owner
      createdAt
      updatedAt
      createdDate
      updatedDate
      __typename
    }
    nextToken
    __typename
  }
}`;

const listProjectMilestonesQuery = `query ListProjectMilestones($filter: ModelProjectMilestonesFilterInput, $limit: Int) {
  listProjectMilestones(filter: $filter, limit: $limit) {
    items {
      id
      projectId
      name
      description
      order
      isComplete
      owner
      createdAt
      updatedAt
      createdDate
      updatedDate
      __typename
    }
    nextToken
    __typename
  }
}`;

const listProjectPaymentTermsQuery = `query ListProjectPaymentTerms($filter: ModelProjectPaymentTermsFilterInput, $limit: Int) {
  listProjectPaymentTerms(filter: $filter, limit: $limit) {
    items {
      id
      projectId
      paymentName
      paymentAmount
      description
      order
      paid
      type
      owner
      createdAt
      updatedAt
      createdDate
      updatedDate
      __typename
    }
    nextToken
    __typename
  }
}`;

async function testBackendData() {
  console.log('='.repeat(60));
  console.log('BACKEND DATA INVESTIGATION');
  console.log('='.repeat(60));
  console.log(`Testing project ID: ${projectId}\n`);

  const filter = { projectId: { eq: projectId } };

  try {
    // Test 1: GraphQL Comments Query
    console.log('1. Testing GraphQL Comments Query...');
    try {
      const commentsResult = await graphqlClient.graphql({
        query: listProjectCommentsQuery,
        variables: { filter, limit: 10 }
      });
      
      console.log(`   ✅ SUCCESS: Found ${commentsResult.data.listProjectComments.items?.length || 0} comments`);
      
      if (commentsResult.data.listProjectComments.items?.length > 0) {
        const firstComment = commentsResult.data.listProjectComments.items[0];
        console.log('   📋 Sample comment fields:', Object.keys(firstComment));
        console.log('   📅 Date fields:');
        console.log(`      createdAt: ${firstComment.createdAt}`);
        console.log(`      updatedAt: ${firstComment.updatedAt}`);
        console.log(`      createdDate: ${firstComment.createdDate}`);
        console.log(`      updatedDate: ${firstComment.updatedDate}`);
      }
      
      if (commentsResult.errors) {
        console.log('   ⚠️  Errors:', commentsResult.errors);
      }
    } catch (error) {
      console.log('   ❌ FAILED:', error.message);
    }

    console.log('');

    // Test 2: client.models Comments
    console.log('2. Testing client.models Comments...');
    try {
      const commentsResult = await dataClient.models.ProjectComments.list({ filter, limit: 10 });
      
      console.log(`   ✅ SUCCESS: Found ${commentsResult.data?.length || 0} comments`);
      
      if (commentsResult.data?.length > 0) {
        const firstComment = commentsResult.data[0];
        console.log('   📋 Sample comment fields:', Object.keys(firstComment));
        console.log('   📅 Date fields:');
        console.log(`      createdAt: ${firstComment.createdAt}`);
        console.log(`      updatedAt: ${firstComment.updatedAt}`);
        console.log(`      createdDate: ${firstComment.createdDate || 'NOT FOUND'}`);
        console.log(`      updatedDate: ${firstComment.updatedDate || 'NOT FOUND'}`);
      }
      
      if (commentsResult.errors) {
        console.log('   ⚠️  Errors:', commentsResult.errors);
      }
    } catch (error) {
      console.log('   ❌ FAILED:', error.message);
    }

    console.log('');

    // Test 3: GraphQL Milestones Query
    console.log('3. Testing GraphQL Milestones Query...');
    try {
      const milestonesResult = await graphqlClient.graphql({
        query: listProjectMilestonesQuery,
        variables: { filter, limit: 10 }
      });
      
      console.log(`   ✅ SUCCESS: Found ${milestonesResult.data.listProjectMilestones.items?.length || 0} milestones`);
      
      if (milestonesResult.data.listProjectMilestones.items?.length > 0) {
        const firstMilestone = milestonesResult.data.listProjectMilestones.items[0];
        console.log('   📋 Sample milestone fields:', Object.keys(firstMilestone));
        console.log('   📅 Date fields:');
        console.log(`      createdAt: ${firstMilestone.createdAt}`);
        console.log(`      updatedAt: ${firstMilestone.updatedAt}`);
        console.log(`      createdDate: ${firstMilestone.createdDate}`);
        console.log(`      updatedDate: ${firstMilestone.updatedDate}`);
      }
      
      if (milestonesResult.errors) {
        console.log('   ⚠️  Errors:', milestonesResult.errors);
      }
    } catch (error) {
      console.log('   ❌ FAILED:', error.message);
    }

    console.log('');

    // Test 4: GraphQL Payment Terms Query  
    console.log('4. Testing GraphQL Payment Terms Query...');
    try {
      const paymentsResult = await graphqlClient.graphql({
        query: listProjectPaymentTermsQuery,
        variables: { filter, limit: 10 }
      });
      
      console.log(`   ✅ SUCCESS: Found ${paymentsResult.data.listProjectPaymentTerms.items?.length || 0} payment terms`);
      
      if (paymentsResult.data.listProjectPaymentTerms.items?.length > 0) {
        const firstPayment = paymentsResult.data.listProjectPaymentTerms.items[0];
        console.log('   📋 Sample payment fields:', Object.keys(firstPayment));
        console.log('   📅 Date fields:');
        console.log(`      createdAt: ${firstPayment.createdAt}`);
        console.log(`      updatedAt: ${firstPayment.updatedAt}`);
        console.log(`      createdDate: ${firstPayment.createdDate}`);
        console.log(`      updatedDate: ${firstPayment.updatedDate}`);
      }
      
      if (paymentsResult.errors) {
        console.log('   ⚠️  Errors:', paymentsResult.errors);
      }
    } catch (error) {
      console.log('   ❌ FAILED:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('INVESTIGATION COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Overall error:', error);
  }
}

testBackendData();