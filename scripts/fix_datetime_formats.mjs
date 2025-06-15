// Script to fix DateTime format issues in DynamoDB after migration
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Configure DynamoDB client
const dynamoClient = new DynamoDBClient({ region: 'us-west-1' });

// List of all tables with their datetime fields
const tableConfigs = [
  {
    name: 'Affiliates-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate', 'date']
  },
  {
    name: 'Auth-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeAssignTo-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeBookingStatuses-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeBrokerage-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeNotifications-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeProducts-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeProjectStatuses-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeQuoteStatuses-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeRequestStatuses-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'BackOfficeRoleTypes-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'ContactUs-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['submissionTime', 'createdDate', 'updatedDate']
  },
  {
    name: 'Contacts-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'Legal-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'MemberSignature-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'PendingAppoitments-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['assignedDate', 'createdDate', 'updatedDate']
  },
  {
    name: 'ProjectComments-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'ProjectMilestones-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate', 'estimatedFinish']
  },
  {
    name: 'ProjectPaymentTerms-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'ProjectPermissions-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'Projects-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: [
      'requestDate', 'visitReviewDate', 'createdDate', 'updatedDate', 'proposalDate', 
      'contractDate', 'escrowDate', 'estimatedClosingDate', 'closingDate', 'revSharePayDate',
      'underwritingDate', 'escrowPaymentDate', 'boosterCompletionDate', 'invoiceDate',
      'assignedDate', 'quoteSentDate', 'quoteOpenedDate', 'quoteSignedDate',
      'contractingStartDate', 'contractSentDate', 'archivedDate'
    ]
  },
  {
    name: 'Properties-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'QuoteItems-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['createdDate', 'updatedDate']
  },
  {
    name: 'Quotes-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: [
      'assignedDate', 'updatedDate', 'requestDate', 'visitDate', 'createdDate',
      'operationManagerApprovedDate', 'sentDate', 'openedDate', 'signedDate',
      'underwritingApprovedDate', 'contractingStartDate', 'contractSentDate',
      'contractSignedDate', 'convertedDate', 'expiredDate', 'archivedDate', 'rejectedDate'
    ]
  },
  {
    name: 'Requests-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: [
      'createdDate', 'assignedDate', 'requestedVisitDateTime', 'updatedDate',
      'visitDate', 'moveToQuotingDate', 'expiredDate', 'archivedDate'
    ]
  },
  {
    name: 'eSignatureDocuments-ukgxireroncqrdrirvf222rkai-NONE',
    dateFields: ['signedDate', 'createdDate', 'updatedDate']
  }
];

/**
 * Convert various date formats to ISO 8601 DateTime
 */
function parseAndFormatDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  
  try {
    const trimmed = dateStr.trim();
    
    // If already in ISO format, return as-is
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return trimmed;
    }
    
    // Handle MM/DD/YY format (e.g., "6/3/25")
    const mmddyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (mmddyyMatch) {
      const [, month, day, year] = mmddyyMatch;
      // Assume 25 = 2025, 23 = 2023, etc.
      const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
      const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
      return date.toISOString();
    }
    
    // Handle MM/DD/YYYY format (e.g., "6/3/2025")
    const mmddyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
      const [, month, day, year] = mmddyyyyMatch;
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
      return date.toISOString();
    }
    
    // Try to parse as a regular date and convert to ISO
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    
    console.warn(`Unable to parse date: "${dateStr}"`);
    return null;
  } catch (error) {
    console.warn(`Error parsing date "${dateStr}":`, error.message);
    return null;
  }
}

/**
 * Fix datetime fields in a single table
 */
async function fixTableDatetimeFields(tableConfig) {
  const { name: tableName, dateFields } = tableConfig;
  console.log(`\n🔧 Processing table: ${tableName}`);
  console.log(`   📅 Date fields to fix: ${dateFields.join(', ')}`);
  
  try {
    // Scan the table to get all items
    const scanCommand = new ScanCommand({ TableName: tableName });
    const response = await dynamoClient.send(scanCommand);
    
    if (!response.Items || response.Items.length === 0) {
      console.log(`   ⚠️  No items found in ${tableName}`);
      return { processed: 0, updated: 0, errors: 0 };
    }
    
    console.log(`   📊 Found ${response.Items.length} items`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const item of response.Items) {
      processedCount++;
      const unmarshalled = unmarshall(item);
      
      try {
        // Check if any date fields need fixing
        const updates = {};
        const attributeValues = {};
        const attributeNames = {};
        let hasUpdates = false;
        
        for (const field of dateFields) {
          if (unmarshalled[field]) {
            const fixedDate = parseAndFormatDate(unmarshalled[field]);
            if (fixedDate && fixedDate !== unmarshalled[field]) {
              updates[`#${field}`] = `:${field}`;
              attributeValues[`:${field}`] = fixedDate;
              attributeNames[`#${field}`] = field;
              hasUpdates = true;
            }
          }
        }
        
        // Add createdAt and updatedAt if they don't exist
        const now = new Date().toISOString();
        if (!unmarshalled.createdAt) {
          updates['#createdAt'] = ':createdAt';
          attributeValues[':createdAt'] = now;
          attributeNames['#createdAt'] = 'createdAt';
          hasUpdates = true;
        }
        if (!unmarshalled.updatedAt) {
          updates['#updatedAt'] = ':updatedAt';
          attributeValues[':updatedAt'] = now;
          attributeNames['#updatedAt'] = 'updatedAt';
          hasUpdates = true;
        }
        
        if (hasUpdates) {
          // Build the update expression
          const updateExpression = 'SET ' + Object.entries(updates)
            .map(([name, value]) => `${name} = ${value}`)
            .join(', ');
          
          // Update the item
          const updateCommand = new UpdateItemCommand({
            TableName: tableName,
            Key: marshall({ id: unmarshalled.id }),
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: attributeNames,
            ExpressionAttributeValues: marshall(attributeValues)
          });
          
          await dynamoClient.send(updateCommand);
          updatedCount++;
          
          if (updatedCount % 10 === 0) {
            console.log(`   📝 Updated ${updatedCount} items so far...`);
          }
        }
      } catch (updateError) {
        errorCount++;
        console.log(`   ❌ Error updating item ${unmarshalled.id}:`, updateError.message);
      }
    }
    
    console.log(`   ✅ Completed ${tableName}:`);
    console.log(`      - Processed: ${processedCount} items`);
    console.log(`      - Updated: ${updatedCount} items`);
    console.log(`      - Errors: ${errorCount} items`);
    
    return { processed: processedCount, updated: updatedCount, errors: errorCount };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${tableName}:`, error.message);
    return { processed: 0, updated: 0, errors: 1 };
  }
}

/**
 * Fix datetime fields in all tables
 */
async function fixAllDatetimeFields() {
  console.log('🚀 Starting DateTime field fix process...');
  console.log(`📋 Processing ${tableConfigs.length} tables`);
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  for (const tableConfig of tableConfigs) {
    const result = await fixTableDatetimeFields(tableConfig);
    totalProcessed += result.processed;
    totalUpdated += result.updated;
    totalErrors += result.errors;
    
    // Add a small delay to avoid overwhelming DynamoDB
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n🎉 DateTime field fix process completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total items processed: ${totalProcessed}`);
  console.log(`   - Total items updated: ${totalUpdated}`);
  console.log(`   - Total errors: ${totalErrors}`);
}

// Test the date parsing function first
console.log('🧪 Testing date parsing function...');
const testDates = ['6/3/25', '12/31/23', '1/1/2025', '2023-06-03T10:30:00.000Z', '', null];
testDates.forEach(date => {
  console.log(`"${date}" -> "${parseAndFormatDate(date)}"`);
});
console.log('');

// Run the fix
fixAllDatetimeFields().catch(console.error);