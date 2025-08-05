import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export interface SuppressionRecord {
  id: string;
  emailAddress: string;
  suppressionType: 'BOUNCE' | 'COMPLAINT' | 'MANUAL';
  reason: string;
  bounceType?: 'Permanent' | 'Transient';
  bounceSubType?: string;
  complaintType?: string;
  originalMessageId?: string;
  suppressedAt: string;
  source: 'SES_NOTIFICATION' | 'MANUAL_ADMIN' | 'USER_REQUEST';
  metadata?: any;
  isActive: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export class SuppressionListService {
  private dynamoClient: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;
  private suppressionTableName: string;

  constructor() {
    this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.docClient = DynamoDBDocumentClient.from(this.dynamoClient);
    this.suppressionTableName = process.env.EMAIL_SUPPRESSION_LIST_TABLE || '';
    
    if (!this.suppressionTableName) {
      console.warn('⚠️ EMAIL_SUPPRESSION_LIST_TABLE environment variable not set');
    }
  }

  /**
   * Check if an email address is suppressed
   */
  async isEmailSuppressed(emailAddress: string): Promise<{
    suppressed: boolean;
    reason?: string;
    suppressionType?: string;
    suppressedAt?: string;
  }> {
    if (!this.suppressionTableName) {
      console.warn('⚠️ Suppression list not configured, allowing email');
      return { suppressed: false };
    }

    try {
      const normalizedEmail = emailAddress.toLowerCase().trim();
      
      // Query for active suppression records for this email
      const command = new ScanCommand({
        TableName: this.suppressionTableName,
        FilterExpression: 'emailAddress = :email AND isActive = :active',
        ExpressionAttributeValues: {
          ':email': normalizedEmail,
          ':active': true
        }
      });

      const result = await this.docClient.send(command);
      
      if (result.Items && result.Items.length > 0) {
        // Email is suppressed - return the most recent suppression
        const mostRecent = result.Items.sort((a, b) => 
          new Date(b.suppressedAt).getTime() - new Date(a.suppressedAt).getTime()
        )[0];

        return {
          suppressed: true,
          reason: mostRecent.reason,
          suppressionType: mostRecent.suppressionType,
          suppressedAt: mostRecent.suppressedAt
        };
      }

      return { suppressed: false };
    } catch (error) {
      console.error('❌ Error checking suppression list:', error);
      // On error, allow email to be sent (fail open)
      return { suppressed: false };
    }
  }

  /**
   * Get all suppressed emails for admin dashboard
   */
  async getSuppressedEmails(limit: number = 100): Promise<SuppressionRecord[]> {
    if (!this.suppressionTableName) {
      return [];
    }

    try {
      const command = new ScanCommand({
        TableName: this.suppressionTableName,
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: {
          ':active': true
        },
        Limit: limit
      });

      const result = await this.docClient.send(command);
      return (result.Items as SuppressionRecord[]) || [];
    } catch (error) {
      console.error('❌ Error fetching suppressed emails:', error);
      return [];
    }
  }

  /**
   * Get suppression statistics
   */
  async getSuppressionStats(): Promise<{
    totalSuppressed: number;
    bounces: number;
    complaints: number;
    manual: number;
    permanentBounces: number;
    transientBounces: number;
  }> {
    if (!this.suppressionTableName) {
      return {
        totalSuppressed: 0,
        bounces: 0,
        complaints: 0,
        manual: 0,
        permanentBounces: 0,
        transientBounces: 0
      };
    }

    try {
      const command = new ScanCommand({
        TableName: this.suppressionTableName,
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: {
          ':active': true
        }
      });

      const result = await this.docClient.send(command);
      const records = (result.Items as SuppressionRecord[]) || [];

      const stats = {
        totalSuppressed: records.length,
        bounces: records.filter(r => r.suppressionType === 'BOUNCE').length,
        complaints: records.filter(r => r.suppressionType === 'COMPLAINT').length,
        manual: records.filter(r => r.suppressionType === 'MANUAL').length,
        permanentBounces: records.filter(r => r.suppressionType === 'BOUNCE' && r.bounceType === 'Permanent').length,
        transientBounces: records.filter(r => r.suppressionType === 'BOUNCE' && r.bounceType === 'Transient').length
      };

      return stats;
    } catch (error) {
      console.error('❌ Error fetching suppression stats:', error);
      return {
        totalSuppressed: 0,
        bounces: 0,
        complaints: 0,
        manual: 0,
        permanentBounces: 0,
        transientBounces: 0
      };
    }
  }

  /**
   * Remove an email from suppression list (reactivate)
   */
  async removeFromSuppressionList(emailAddress: string, removedBy: string = 'admin'): Promise<boolean> {
    if (!this.suppressionTableName) {
      return false;
    }

    try {
      const normalizedEmail = emailAddress.toLowerCase().trim();
      
      // Find active suppression records for this email
      const findCommand = new ScanCommand({
        TableName: this.suppressionTableName,
        FilterExpression: 'emailAddress = :email AND isActive = :active',
        ExpressionAttributeValues: {
          ':email': normalizedEmail,
          ':active': true
        }
      });

      const findResult = await this.docClient.send(findCommand);
      
      if (!findResult.Items || findResult.Items.length === 0) {
        return false; // Email not found in suppression list
      }

      // Deactivate all suppression records for this email
      for (const item of findResult.Items) {
        await this.docClient.send(new UpdateCommand({
          TableName: this.suppressionTableName,
          Key: { id: item.id },
          UpdateExpression: 'SET isActive = :inactive, updatedAt = :now, updatedBy = :updatedBy',
          ExpressionAttributeValues: {
            ':inactive': false,
            ':now': new Date().toISOString(),
            ':updatedBy': removedBy
          }
        }));
      }

      console.log(`✅ Removed ${normalizedEmail} from suppression list`);
      return true;
    } catch (error) {
      console.error(`❌ Error removing ${emailAddress} from suppression list:`, error);
      return false;
    }
  }
}