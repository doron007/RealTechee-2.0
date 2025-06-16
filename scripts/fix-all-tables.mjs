// Fix datetime issues for all tables
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

async function fixTableDates(tableName, dateFields = []) {
  console.log(`\n🔧 Fixing dates in table: ${tableName}`);
  console.log(`   📅 Date fields: ${dateFields.join(', ')}`);
  
  try {
    const scanCommand = new ScanCommand({ TableName: tableName });
    const response = await dynamoClient.send(scanCommand);
    
    if (!response.Items || response.Items.length === 0) {
      console.log(`   ⚠️  No items found`);
      return { updated: 0, errors: 0 };
    }
    
    console.log(`   📊 Found ${response.Items.length} items`);
    
    let updated = 0;
    let errors = 0;
    const now = new Date().toISOString();
    
    for (const item of response.Items) {
      const unmarshalled = unmarshall(item);
      const updates = [];
      const expressionAttributeValues = {};
      
      // Fix all the specified date fields
      for (const field of dateFields) {
        if (unmarshalled[field]) {
          const fixedDate = parseDate(unmarshalled[field]);
          if (fixedDate && fixedDate !== unmarshalled[field]) {
            updates.push(`${field} = :${field}`);
            expressionAttributeValues[`:${field}`] = fixedDate;
          }
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
          
          if (updated % 50 === 0) {
            console.log(`   📝 Updated ${updated} items so far...`);
          }
        } catch (updateError) {
          console.log(`   ❌ Error updating item ${unmarshalled.id}:`, updateError.message);
          errors++;
        }
      }
    }
    
    console.log(`   ✅ Updated ${updated} items, ${errors} errors in ${tableName}`);
    return { updated, errors };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${tableName}:`, error.message);
    return { updated: 0, errors: 1 };
  }
}

// Define all tables and their date fields
const tablesToFix = [
  { name: 'Contacts-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'Projects-ukgxireroncqrdrirvf222rkai-NONE', dateFields: [
    'requestDate', 'visitReviewDate', 'createdDate', 'updatedDate', 'proposalDate', 
    'contractDate', 'escrowDate', 'estimatedClosingDate', 'closingDate', 'revSharePayDate',
    'underwritingDate', 'escrowPaymentDate', 'boosterCompletionDate', 'invoiceDate',
    'assignedDate', 'quoteSentDate', 'quoteOpenedDate', 'quoteSignedDate',
    'contractingStartDate', 'contractSentDate', 'archivedDate'
  ]},
  { name: 'Quotes-ukgxireroncqrdrirvf222rkai-NONE', dateFields: [
    'assignedDate', 'updatedDate', 'requestDate', 'visitDate', 'createdDate',
    'operationManagerApprovedDate', 'sentDate', 'openedDate', 'signedDate',
    'underwritingApprovedDate', 'contractingStartDate', 'contractSentDate',
    'contractSignedDate', 'convertedDate', 'expiredDate', 'archivedDate', 'rejectedDate'
  ]},
  { name: 'Requests-ukgxireroncqrdrirvf222rkai-NONE', dateFields: [
    'createdDate', 'assignedDate', 'requestedVisitDateTime', 'updatedDate',
    'visitDate', 'moveToQuotingDate', 'expiredDate', 'archivedDate'
  ]},
  { name: 'Affiliates-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate', 'date'] },
  { name: 'Auth-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeAssignTo-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeBookingStatuses-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeBrokerage-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeNotifications-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeProducts-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeProjectStatuses-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeQuoteStatuses-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeRequestStatuses-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'BackOfficeRoleTypes-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'ContactUs-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['submissionTime', 'createdDate', 'updatedDate'] },
  { name: 'Legal-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'MemberSignature-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'PendingAppoitments-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['assignedDate', 'createdDate', 'updatedDate'] },
  { name: 'ProjectComments-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'ProjectMilestones-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate', 'estimatedFinish'] },
  { name: 'ProjectPaymentTerms-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'ProjectPermissions-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'QuoteItems-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['createdDate', 'updatedDate'] },
  { name: 'eSignatureDocuments-ukgxireroncqrdrirvf222rkai-NONE', dateFields: ['signedDate', 'createdDate', 'updatedDate'] }
];

console.log('🚀 Starting datetime fix for all tables...');

let totalUpdated = 0;
let totalErrors = 0;

for (const table of tablesToFix) {
  const result = await fixTableDates(table.name, table.dateFields);
  totalUpdated += result.updated;
  totalErrors += result.errors;
  
  // Small delay to avoid overwhelming DynamoDB
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log('\n🎉 Datetime fix completed!');
console.log(`📊 Summary:`);
console.log(`   - Total items updated: ${totalUpdated}`);
console.log(`   - Total errors: ${totalErrors}`);