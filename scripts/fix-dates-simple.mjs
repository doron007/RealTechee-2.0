// Simple script to fix datetime issues for one table at a time
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-west-1' });

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  
  try {
    const trimmed = dateStr.trim();
    
    // Handle MM/DD/YY format (e.g., "6/4/25")
    const mmddyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (mmddyyMatch) {
      const [, month, day, year] = mmddyyMatch;
      const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
      const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
      return date.toISOString();
    }
    
    // Handle MM/DD/YYYY format
    const mmddyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
      const [, month, day, year] = mmddyyyyMatch;
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
      return date.toISOString();
    }
    
    // If already ISO format, return as-is
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return trimmed;
    }
    
    return null;
  } catch (error) {
    console.warn(`Error parsing date "${dateStr}":`, error.message);
    return null;
  }
}

async function fixTableDates(tableName) {
  console.log(`\n🔧 Fixing dates in table: ${tableName}`);
  
  try {
    const scanCommand = new ScanCommand({ TableName: tableName });
    const response = await dynamoClient.send(scanCommand);
    
    if (!response.Items || response.Items.length === 0) {
      console.log(`   ⚠️  No items found`);
      return;
    }
    
    console.log(`   📊 Found ${response.Items.length} items`);
    
    let updated = 0;
    const now = new Date().toISOString();
    
    for (const item of response.Items) {
      const unmarshalled = unmarshall(item);
      const updates = [];
      const expressionAttributeValues = {};
      
      // Fix createdDate if it exists and is in wrong format
      if (unmarshalled.createdDate) {
        const fixedDate = parseDate(unmarshalled.createdDate);
        if (fixedDate && fixedDate !== unmarshalled.createdDate) {
          updates.push('createdDate = :createdDate');
          expressionAttributeValues[':createdDate'] = fixedDate;
        }
      }
      
      // Fix updatedDate if it exists and is in wrong format
      if (unmarshalled.updatedDate) {
        const fixedDate = parseDate(unmarshalled.updatedDate);
        if (fixedDate && fixedDate !== unmarshalled.updatedDate) {
          updates.push('updatedDate = :updatedDate');
          expressionAttributeValues[':updatedDate'] = fixedDate;
        }
      }
      
      // Add createdAt if missing
      if (!unmarshalled.createdAt) {
        updates.push('createdAt = :createdAt');
        expressionAttributeValues[':createdAt'] = now;
      }
      
      // Add updatedAt if missing
      if (!unmarshalled.updatedAt) {
        updates.push('updatedAt = :updatedAt');
        expressionAttributeValues[':updatedAt'] = now;
      }
      
      if (updates.length > 0) {
        try {
          const updateCommand = new UpdateItemCommand({
            TableName: tableName,
            Key: marshall({ id: unmarshalled.id }),
            UpdateExpression: `SET ${updates.join(', ')}`,
            ExpressionAttributeValues: marshall(expressionAttributeValues)
          });
          
          await dynamoClient.send(updateCommand);
          updated++;
          
          if (updated % 10 === 0) {
            console.log(`   📝 Updated ${updated} items so far...`);
          }
        } catch (updateError) {
          console.log(`   ❌ Error updating item ${unmarshalled.id}:`, updateError.message);
        }
      }
    }
    
    console.log(`   ✅ Updated ${updated} items in ${tableName}`);
    
  } catch (error) {
    console.error(`   ❌ Error processing ${tableName}:`, error.message);
  }
}

// Test with Properties table first
console.log('🧪 Testing date parsing...');
console.log('"6/4/25" ->', parseDate('6/4/25'));
console.log('"12/31/23" ->', parseDate('12/31/23'));

await fixTableDates('Properties-ukgxireroncqrdrirvf222rkai-NONE');