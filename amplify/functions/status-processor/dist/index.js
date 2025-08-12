import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
// Get table name from environment (Phase 3 refactor – dynamic suffix)
const getTableName = (baseTableName) => {
    // Preferred explicit suffix (injected via Amplify function env vars)
    const suffix = process.env.TABLE_SUFFIX || process.env.NEXT_PUBLIC_BACKEND_SUFFIX;
    if (!suffix) {
        throw new Error('TABLE_SUFFIX (or NEXT_PUBLIC_BACKEND_SUFFIX) not set for status-processor Lambda');
    }
    return `${baseTableName}-${suffix}-NONE`;
};
/**
 * Scheduled Lambda function to process request status expiration
 * Runs daily to check for requests that should be expired due to 14-day inactivity rule
 */
export const handler = async (event) => {
    console.log('Starting status processor scheduled job', {
        time: event.time,
        resources: event.resources
    });
    // DRY_RUN mode: allow local invocation without hitting DynamoDB
    if (process.env.DRY_RUN === 'true') {
        const requestsTableName = getTableName('Requests');
        console.log('[DRY_RUN] Would process table:', requestsTableName);
        console.log('[DRY_RUN] Exiting before DynamoDB operations.');
        return;
    }
    try {
        const requestsTableName = getTableName('Requests');
        console.log('Using Requests table:', requestsTableName);
        // Calculate 14 days ago timestamp
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const expirationThreshold = fourteenDaysAgo.toISOString();
        console.log('Processing requests updated before:', expirationThreshold);
        // Scan for requests that are in 'New' or 'Pending walk-thru' status 
        // and haven't been updated in 14+ days
        const scanParams = {
            TableName: requestsTableName,
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
        const expiredRequests = scanResult.Items || [];
        console.log(`Found ${expiredRequests.length} requests to expire`);
        let processedCount = 0;
        let errorCount = 0;
        // Process each expired request
        for (const request of expiredRequests) {
            try {
                console.log(`Processing request ${request.id} - current status: ${request.status}`);
                // Calculate exact days since last update
                const lastUpdate = new Date(request.updatedAt || request.createdAt);
                const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
                // Create audit trail entry
                const now = new Date().toISOString();
                const auditEntry = `[${now}] Status changed from '${request.status}' to 'Expired' by system - Automatically expired after ${daysSinceUpdate} days of inactivity`;
                const currentNotes = request.officeNotes || '';
                const updatedNotes = currentNotes ? `${currentNotes}\n${auditEntry}` : auditEntry;
                // Update request status to 'Expired'
                const updateParams = {
                    TableName: requestsTableName,
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
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Status processor failed:', error);
        throw error;
    }
};
