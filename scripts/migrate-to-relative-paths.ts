#!/usr/bin/env tsx
/**
 * Migrate S3 URLs to Relative Paths Script
 * Converts full S3 URLs to relative paths starting with /assets/
 * and fixes document paths to image paths for project main images
 */

import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import * as fs from 'fs';
import * as path from 'path';

// Load Amplify configuration
const amplifyOutputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../amplify_outputs.json'), 'utf-8')
);

const dynamoClient = new DynamoDBClient({
  region: amplifyOutputs.data.aws_region,
});

const BUCKET_NAME = amplifyOutputs.storage.bucket_name;
const BUCKET_URL = `https://${BUCKET_NAME}.s3.${amplifyOutputs.storage.aws_region}.amazonaws.com`;

interface MigrationTask {
  tableName: string;
  recordId: string;
  fieldName: string;
  originalValue: any;
  fixedValue: any;
  type: 'single' | 'array';
  changeType: 'full-to-relative' | 'documents-to-images';
}

interface MigrationResult {
  task: MigrationTask;
  success: boolean;
  error?: string;
}

class S3PathMigrator {
  private dryRun: boolean;
  private tasks: MigrationTask[] = [];
  private results: MigrationResult[] = [];

  constructor(options: { dryRun?: boolean } = {}) {
    this.dryRun = options.dryRun || false;
  }

  /**
   * Scan all relevant tables for S3 URL migration
   */
  async scanForS3UrlMigration(): Promise<void> {
    console.log('🔍 Scanning tables for S3 URL migration to relative paths...\n');

    const tablesToScan = [
      { name: 'Projects-fvn7t5hbobaxjklhrqzdl4ac34-NONE', type: 'projects' },
      { name: 'Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE', type: 'requests' },
      { name: 'Quotes-fvn7t5hbobaxjklhrqzdl4ac34-NONE', type: 'quotes' },
      { name: 'eSignatureDocuments-fvn7t5hbobaxjklhrqzdl4ac34-NONE', type: 'documents' }
    ];

    for (const table of tablesToScan) {
      await this.scanTable(table.name, table.type);
    }

    console.log(`✅ Scan complete: ${this.tasks.length} migrations needed`);
  }

  /**
   * Scan a specific table for S3 URLs
   */
  private async scanTable(tableName: string, tableType: string): Promise<void> {
    console.log(`   📋 Scanning table: ${tableName} (${tableType})`);

    try {
      let lastEvaluatedKey: any = undefined;
      let totalItems = 0;
      let issuesFound = 0;

      do {
        const scanCommand = new ScanCommand({
          TableName: tableName,
          ExclusiveStartKey: lastEvaluatedKey,
          Limit: 100
        });

        const response = await dynamoClient.send(scanCommand);
        
        if (response.Items) {
          for (const item of response.Items) {
            const record = unmarshall(item);
            const recordTasks = this.analyzeRecordForMigration(tableName, tableType, record);
            this.tasks.push(...recordTasks);
            issuesFound += recordTasks.length;
            totalItems++;
          }
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      console.log(`      Items scanned: ${totalItems}, Migrations found: ${issuesFound}`);

    } catch (error) {
      if (error instanceof Error && error.name === 'ResourceNotFoundException') {
        console.log(`      ⚠️ Table not found: ${tableName}`);
      } else {
        console.error(`      ❌ Error scanning ${tableName}:`, error);
      }
    }
  }

  /**
   * Analyze a record for S3 URL migration needs
   */
  private analyzeRecordForMigration(tableName: string, tableType: string, record: any): MigrationTask[] {
    const tasks: MigrationTask[] = [];

    // Define fields that contain S3 URLs based on table type
    const fieldsToCheck = this.getFieldsForTableType(tableType);

    for (const fieldName of fieldsToCheck) {
      if (record[fieldName]) {
        const fieldTasks = this.analyzeFieldForMigration(tableName, record.id, fieldName, record[fieldName], tableType);
        tasks.push(...fieldTasks);
      }
    }

    return tasks;
  }

  /**
   * Get fields to check based on table type
   */
  private getFieldsForTableType(tableType: string): string[] {
    switch (tableType) {
      case 'projects':
        return ['image', 'imageUrl', 'gallery', 'documents', 'media', 'attachments'];
      case 'requests':
        return ['documents', 'attachments', 'media', 'images'];
      case 'quotes':
        return ['documentUrl', 'attachments', 'media'];
      case 'documents':
        return ['documentUrl', 'signedDocumentUrl', 'attachments'];
      default:
        return ['documents', 'media', 'images', 'attachments', 'documentUrl', 'imageUrl'];
    }
  }

  /**
   * Analyze a field for migration needs
   */
  private analyzeFieldForMigration(tableName: string, recordId: string, fieldName: string, fieldValue: any, tableType: string): MigrationTask[] {
    const tasks: MigrationTask[] = [];

    if (typeof fieldValue === 'string') {
      // Single URL field
      const migrationResult = this.getMigrationForUrl(fieldValue, fieldName, tableType);
      if (migrationResult) {
        tasks.push({
          tableName,
          recordId,
          fieldName,
          originalValue: fieldValue,
          fixedValue: migrationResult.newUrl,
          type: 'single',
          changeType: migrationResult.changeType
        });
      }
    } else if (Array.isArray(fieldValue)) {
      // Array of URLs
      let hasChanges = false;
      const fixedArray = fieldValue.map((item: any) => {
        if (typeof item === 'string') {
          const migrationResult = this.getMigrationForUrl(item, fieldName, tableType);
          if (migrationResult) {
            hasChanges = true;
            return migrationResult.newUrl;
          }
        }
        return item;
      });

      if (hasChanges) {
        tasks.push({
          tableName,
          recordId,
          fieldName,
          originalValue: fieldValue,
          fixedValue: fixedArray,
          type: 'array',
          changeType: 'full-to-relative'
        });
      }
    }

    return tasks;
  }

  /**
   * Determine if a URL needs migration and return the new URL
   */
  private getMigrationForUrl(url: string, fieldName: string, tableType: string): { newUrl: string; changeType: 'full-to-relative' | 'documents-to-images' } | null {
    // Skip if not an S3 URL
    if (!url.includes(BUCKET_URL) && !url.startsWith('/assets/')) {
      return null;
    }

    let newUrl = url;
    let changeType: 'full-to-relative' | 'documents-to-images' = 'full-to-relative';

    // Convert full URL to relative path
    if (url.includes(BUCKET_URL)) {
      newUrl = url.replace(BUCKET_URL, '');
      changeType = 'full-to-relative';
    }

    // Special handling for project main images pointing to documents
    if (tableType === 'projects' && (fieldName === 'image' || fieldName === 'imageUrl')) {
      if (newUrl.includes('/documents/doc-')) {
        // Convert from documents/doc-XXX.ext to images/gallery-001.ext
        const parts = newUrl.split('/');
        const filename = parts[parts.length - 1]; // doc-XXX.ext
        const extension = filename.split('.').pop(); // ext
        
        // Replace documents/doc-XXX.ext with images/gallery-001.ext
        newUrl = newUrl.replace(/\/documents\/doc-\d+\.\w+$/, `/images/gallery-001.${extension}`);
        changeType = 'documents-to-images';
      }
    }

    // Return null if no changes needed
    return newUrl === url ? null : { newUrl, changeType };
  }

  /**
   * Execute migrations
   */
  async executeMigrations(): Promise<void> {
    console.log(`\n🔧 Starting S3 path migrations (${this.dryRun ? 'DRY RUN' : 'LIVE MODE'})`);
    console.log(`   Migrations to execute: ${this.tasks.length}`);

    if (this.dryRun) {
      console.log('\n📋 DRY RUN - Preview of migrations:');
      this.tasks.slice(0, 10).forEach((task, i) => {
        console.log(`\n${i + 1}. ${task.tableName.split('-')[0]} - ${task.recordId.substring(0, 8)}...`);
        console.log(`   Field: ${task.fieldName}`);
        console.log(`   Type: ${task.changeType}`);
        if (task.type === 'single') {
          console.log(`   Original: ${task.originalValue.substring(0, 80)}...`);
          console.log(`   Fixed:    ${task.fixedValue.substring(0, 80)}...`);
        } else {
          console.log(`   Array items: ${task.originalValue.length} → ${task.fixedValue.length}`);
        }
      });
      if (this.tasks.length > 10) {
        console.log(`   ... and ${this.tasks.length - 10} more migrations`);
      }
      return;
    }

    let processed = 0;
    const startTime = Date.now();

    for (const task of this.tasks) {
      try {
        const result = await this.executeSingleMigration(task);
        this.results.push(result);
        
        processed++;
        
        if (processed % 20 === 0 || !result.success) {
          console.log(`   Progress: ${processed}/${this.tasks.length} (${(processed/this.tasks.length*100).toFixed(1)}%)`);
        }
        
        if (!result.success) {
          console.error(`   ❌ Failed: ${task.recordId}.${task.fieldName}: ${result.error}`);
        }
        
      } catch (error) {
        this.results.push({
          task,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`   ❌ Migration failed: ${error}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const successful = this.results.filter(r => r.success).length;
    
    console.log(`\n✅ Migrations complete!`);
    console.log(`   Duration: ${duration} minutes`);
    console.log(`   Successful: ${successful}/${this.tasks.length}`);
    console.log(`   Failed: ${this.tasks.length - successful}`);
  }

  /**
   * Execute a single migration task
   */
  private async executeSingleMigration(task: MigrationTask): Promise<MigrationResult> {
    try {
      const updateExpression = `SET ${task.fieldName} = :newValue`;
      const expressionAttributeValues = marshall({
        ':newValue': task.fixedValue
      });

      await dynamoClient.send(new UpdateItemCommand({
        TableName: task.tableName,
        Key: marshall({ id: task.recordId }),
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues
      }));

      return {
        task,
        success: true
      };

    } catch (error) {
      return {
        task,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate migration report
   */
  generateReport(): void {
    const report = {
      completedAt: new Date().toISOString(),
      dryRun: this.dryRun,
      summary: {
        totalTasks: this.tasks.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        byChangeType: this.getTasksByChangeType(),
        byTable: this.getTasksByTable()
      },
      tasks: this.tasks,
      results: this.results
    };

    const filename = `s3-path-migration-results-${Date.now()}.json`;
    fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Migration Report:`);
    console.log(`   Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`) ;
    console.log(`   Tasks: ${report.summary.totalTasks}`);
    console.log(`   Successful: ${report.summary.successful}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Report saved: ${filename}`);

    console.log('\n📊 By Change Type:');
    Object.entries(report.summary.byChangeType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log('\n📊 By Table:');
    Object.entries(report.summary.byTable).forEach(([table, count]) => {
      console.log(`   ${table.split('-')[0]}: ${count}`);
    });
  }

  /**
   * Get task counts by change type
   */
  private getTasksByChangeType(): Record<string, number> {
    const byType: Record<string, number> = {};
    this.tasks.forEach(task => {
      byType[task.changeType] = (byType[task.changeType] || 0) + 1;
    });
    return byType;
  }

  /**
   * Get task counts by table
   */
  private getTasksByTable(): Record<string, number> {
    const byTable: Record<string, number> = {};
    this.tasks.forEach(task => {
      const tableName = task.tableName.split('-')[0];
      byTable[tableName] = (byTable[tableName] || 0) + 1;
    });
    return byTable;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🔧 S3 PATH MIGRATION TO RELATIVE PATHS');
  console.log('====================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
  console.log(`Target: Convert full S3 URLs to relative paths starting with /assets/`);
  console.log(`Special: Fix project images from /documents/ to /images/ paths\n`);

  const migrator = new S3PathMigrator({ dryRun });

  try {
    // Scan for S3 URLs that need migration
    await migrator.scanForS3UrlMigration();

    // Execute migrations
    await migrator.executeMigrations();

    // Generate report
    migrator.generateReport();

    console.log('\n🎉 S3 path migration completed successfully!');
    
  } catch (error) {
    console.error('\n💥 S3 path migration failed:', error);
    process.exit(1);
  }
}

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🔧 S3 Path Migration to Relative Paths');
  console.log('Usage: npx tsx scripts/migrate-to-relative-paths.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run          Show what would be done without executing');
  console.log('  --help, -h         Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npx tsx scripts/migrate-to-relative-paths.ts --dry-run     # Preview migrations');
  console.log('  npx tsx scripts/migrate-to-relative-paths.ts               # Execute migrations');
  console.log('');
  console.log('What this script does:');
  console.log('  - Converts full S3 URLs to relative paths starting with /assets/');
  console.log('  - Fixes project main images from /documents/ to /images/ paths');
  console.log('  - Updates Projects, Requests, Quotes, and Documents tables');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}