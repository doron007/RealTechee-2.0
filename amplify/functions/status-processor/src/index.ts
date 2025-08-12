import type { ScheduledHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { requestsTableName } from '../../_shared/tableNames';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface Request {
  id: string;
  status: string;
  updatedAt: string;
  createdAt: string;
  officeNotes?: string;
}

// Wrapper using shared helper (maintain function name for any future imports)
const getRequestsTableName = (): string => requestsTableName();

/**
 * Scheduled Lambda function to process request status expiration
 * Runs daily to check for requests that should be expired due to 14-day inactivity rule
 */
export const handler: ScheduledHandler = async (event): Promise<void> => {
  console.log('Starting status processor scheduled job', { 
    time: event.time,
    resources: event.resources 
  });

  // DRY_RUN mode: allow local invocation without hitting DynamoDB
  if (process.env.DRY_RUN === 'true') {
  const rTable = getRequestsTableName();
  console.log('[DRY_RUN] Would process table:', rTable);
    console.log('[DRY_RUN] Exiting before DynamoDB operations.');
    return;
  }

  try {
  const rTable = getRequestsTableName();
  console.log('Using Requests table:', rTable, { explicit: !!process.env.REQUESTS_TABLE });

    // Calculate 14 days ago timestamp
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const expirationThreshold = fourteenDaysAgo.toISOString();

    console.log('Processing requests updated before:', expirationThreshold);

    // Scan for requests that are in 'New' or 'Pending walk-thru' status 
    // and haven't been updated in 14+ days
    const scanParams = {
      TableName: rTable,
      FilterExpression: '#status IN (:newStatus, :pendingStatus) AND #updatedAt < :threshold',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt'
      },
      ExpressionAttributeValues: {
        ':newStatus': 'New',
        ':pendingStatus': 'Pending walk-thru',
        ':threshold': expirationThreshold
      }
    };

    console.log('Scanning for expired requests with params:', JSON.stringify(scanParams, null, 2));

    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const expiredRequests = scanResult.Items as Request[] || [];

    console.log(`Found ${expiredRequests.length} requests to expire`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each expired request
    for (const request of expiredRequests) {
      try {
        console.log(`Processing request ${request.id} - current status: ${request.status}`);

        // Calculate exact days since last update
        const lastUpdate = new Date(request.updatedAt || request.createdAt);
        const daysSinceUpdate = Math.floor(
          (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Create audit trail entry
        const now = new Date().toISOString();
        const auditEntry = `[${now}] Status changed from '${request.status}' to 'Expired' by system - Automatically expired after ${daysSinceUpdate} days of inactivity`;
        const currentNotes = request.officeNotes || '';
        const updatedNotes = currentNotes ? `${currentNotes}\n${auditEntry}` : auditEntry;

        // Update request status to 'Expired'
        const updateParams = {
          TableName: rTable,
          Key: { id: request.id },
          UpdateExpression: 'SET #status = :expiredStatus, #expiredDate = :now, #officeNotes = :notes, #updatedAt = :now',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#expiredDate': 'expiredDate',
            '#officeNotes': 'officeNotes',
            '#updatedAt': 'updatedAt'
          },
          ExpressionAttributeValues: {
            ':expiredStatus': 'Expired',
            ':now': now,
            ':notes': updatedNotes,
            ':newStatus': 'New',
            ':pendingStatus': 'Pending walk-thru'
          },
          ConditionExpression: '#status IN (:newStatus, :pendingStatus)' // Ensure status hasn't changed
        };

        await docClient.send(new UpdateCommand(updateParams));
        
        console.log(`Successfully expired request ${request.id} after ${daysSinceUpdate} days`);
        processedCount++;

      } catch (error) {
        console.error(`Failed to expire request ${request.id}:`, error);
        errorCount++;
      }
    }

    const result = {
      message: 'Status processor completed',
      processed: processedCount,
      errors: errorCount,
      total: expiredRequests.length,
      expirationThreshold
    };

    console.log('Status processor completed:', result);

  } catch (error) {
    console.error('Status processor failed:', error);
    throw error;
  }
};