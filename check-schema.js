// Check the current GraphQL schema to see what fields are available
const { generateClient } = require('@aws-amplify/api');
const { Amplify } = require('aws-amplify');
const outputs = require('./amplify_outputs.json');

// Configure Amplify
Amplify.configure(outputs);

// Generate GraphQL client
const client = generateClient({
  authMode: 'apiKey'
});

// Use introspection query to check the schema
const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      types {
        name
        fields {
          name
          type {
            name
          }
        }
      }
    }
  }
`;

async function checkSchema() {
  try {
    const result = await client.graphql({
      query: introspectionQuery
    });
    
    // Find ProjectComments type
    const projectCommentsType = result.data.__schema.types.find(type => type.name === 'ProjectComments');
    
    if (projectCommentsType) {
      console.log('ProjectComments fields:');
      projectCommentsType.fields.forEach(field => {
        console.log(`  ${field.name}: ${field.type.name || 'complex type'}`);
      });
      
      const hasCreatedDate = projectCommentsType.fields.some(f => f.name === 'createdDate');
      const hasUpdatedDate = projectCommentsType.fields.some(f => f.name === 'updatedDate');
      
      console.log(`\nHas createdDate: ${hasCreatedDate}`);
      console.log(`Has updatedDate: ${hasUpdatedDate}`);
    } else {
      console.log('ProjectComments type not found in schema');
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();