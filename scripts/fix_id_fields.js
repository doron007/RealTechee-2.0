// Script to fix ID field conflicts after schema update
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Configure DynamoDB client
const dynamoClient = new DynamoDBClient({ region: 'us-west-1' });

// List of tables that had the ID field conflict
const tables = [
  'Affiliates-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'Auth-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeAssignTo-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeBookingStatuses-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeBrokerage-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeNotifications-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeProducts-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeProjectStatuses-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeQuoteStatuses-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeRequestStatuses-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'BackOfficeRoleTypes-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'ContactUs-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'Contacts-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'Legal-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'MemberSignature-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'PendingAppoitments-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'ProjectComments-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'ProjectMilestones-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'ProjectPaymentTerms-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'ProjectPermissions-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'Projects-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'QuoteItems-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'Quotes-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'Requests-6dll3lrn2fhxdilg4b54pjoaeu-NONE',
  'eSignatureDocuments-6dll3lrn2fhxdilg4b54pjoaeu-NONE'
];

async function fixTableIdFields(tableName) {
  console.log(`\n🔧 Processing table: ${tableName}`);
  
  try {
    // Scan the table to get all items
    const scanCommand = new ScanCommand({ TableName: tableName });
    const response = await dynamoClient.send(scanCommand);
    
    if (!response.Items || response.Items.length === 0) {
      console.log(`   ⚠️  No items found in ${tableName}`);
      return;
    }
    
    console.log(`   📊 Found ${response.Items.length} items`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const item of response.Items) {
      const unmarshalled = unmarshall(item);
      
      // Check if item has ID field but no id field, or id is empty/null
      if (unmarshalled.ID && (!unmarshalled.id || unmarshalled.id === null)) {
        try {
          // Update the item to set id = ID
          const updateCommand = new UpdateItemCommand({
            TableName: tableName,
            Key: marshall({ id: unmarshalled.ID }), // Use ID as the key since that's what DynamoDB is using
            UpdateExpression: 'SET id = :id',
            ExpressionAttributeValues: marshall({ ':id': unmarshalled.ID })
          });
          
          await dynamoClient.send(updateCommand);
          updatedCount++;
          
          if (updatedCount % 10 === 0) {
            console.log(`   📝 Updated ${updatedCount} items so far...`);
          }
        } catch (updateError) {
          console.log(`   ❌ Error updating item ${unmarshalled.ID}:`, updateError.message);
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`   ✅ Completed ${tableName}:`);
    console.log(`      - Updated: ${updatedCount} items`);
    console.log(`      - Skipped: ${skippedCount} items`);
    
  } catch (error) {
    console.error(`   ❌ Error processing ${tableName}:`, error.message);
  }
}

async function fixAllTables() {
  console.log('🚀 Starting ID field fix process...');
  console.log(`📋 Processing ${tables.length} tables`);
  
  for (const table of tables) {
    await fixTableIdFields(table);
    // Add a small delay to avoid overwhelming DynamoDB
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 ID field fix process completed!');
}

// Run the fix
fixAllTables().catch(console.error);