// Test a single table to understand the data structure
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-west-1' });

async function testSingleTable() {
  try {
    console.log('🔍 Testing Properties table structure...');
    
    const scanCommand = new ScanCommand({ 
      TableName: 'Properties-ukgxireroncqrdrirvf222rkai-NONE',
      Limit: 3
    });
    
    const response = await dynamoClient.send(scanCommand);
    console.log('Raw response:', JSON.stringify(response, null, 2));
    
    if (response.Items) {
      console.log('\n📊 Found', response.Items.length, 'items');
      
      response.Items.forEach((item, index) => {
        const unmarshalled = unmarshall(item);
        console.log(`\nItem ${index + 1}:`);
        console.log('  ID:', unmarshalled.id);
        console.log('  createdDate:', unmarshalled.createdDate);
        console.log('  updatedDate:', unmarshalled.updatedDate);
        console.log('  createdAt:', unmarshalled.createdAt);
        console.log('  updatedAt:', unmarshalled.updatedAt);
        console.log('  All fields:', Object.keys(unmarshalled));
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSingleTable();