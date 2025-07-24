#!/usr/bin/env tsx
/**
 * Fix Projects Image URLs Script
 * Fixes double S3 URL concatenation in Projects table image and gallery fields
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

interface UrlFixTask {
  projectId: string;
  fieldName: string;
  originalValue: any;
  fixedValue: any;
  type: 'single' | 'array';
}

interface FixResult {
  task: UrlFixTask;
  success: boolean;
  error?: string;
}

class ProjectsImageUrlFixer {
  private dryRun: boolean;
  private tasks: UrlFixTask[] = [];
  private results: FixResult[] = [];

  constructor(options: { dryRun?: boolean } = {}) {
    this.dryRun = options.dryRun || false;
  }

  /**
   * Scan Projects tables for double URL issues
   */
  async scanProjectsForDoubleUrls(): Promise<void> {
    console.log('🔍 Scanning Projects tables for double S3 URL issues...\n');

    // Focus on development environment first
    const tableName = 'Projects-fvn7t5hbobaxjklhrqzdl4ac34-NONE';
    await this.scanTable(tableName);

    console.log(`✅ Scan complete: ${this.tasks.length} URL fixes needed`);
  }

  /**
   * Scan a specific Projects table
   */
  private async scanTable(tableName: string): Promise<void> {
    console.log(`   📋 Scanning table: ${tableName}`);

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
            const project = unmarshall(item);
            const projectIssues = this.analyzeProjectForDoubleUrls(tableName, project);
            this.tasks.push(...projectIssues);
            issuesFound += projectIssues.length;
            totalItems++;
          }
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      console.log(`      Items scanned: ${totalItems}, Issues found: ${issuesFound}`);

    } catch (error) {
      if (error instanceof Error && error.name === 'ResourceNotFoundException') {
        console.log(`      ⚠️ Table not found: ${tableName}`);
      } else {
        console.error(`      ❌ Error scanning ${tableName}:`, error);
      }
    }
  }

  /**
   * Analyze a project record for double URL issues
   */
  private analyzeProjectForDoubleUrls(tableName: string, project: any): UrlFixTask[] {
    const issues: UrlFixTask[] = [];

    // Check image field (single URL)
    if (project.image && typeof project.image === 'string') {
      if (this.hasDoubleS3Concatenation(project.image)) {
        issues.push({
          projectId: project.id,
          fieldName: 'image',
          originalValue: project.image,
          fixedValue: this.fixDoubleS3Url(project.image),
          type: 'single'
        });
      }
    }

    // Check imageUrl field (alternative field name)
    if (project.imageUrl && typeof project.imageUrl === 'string') {
      if (this.hasDoubleS3Concatenation(project.imageUrl)) {
        issues.push({
          projectId: project.id,
          fieldName: 'imageUrl',
          originalValue: project.imageUrl,
          fixedValue: this.fixDoubleS3Url(project.imageUrl),
          type: 'single'
        });
      }
    }

    // Check gallery field (array of URLs)
    if (project.gallery && Array.isArray(project.gallery)) {
      const fixedGallery = project.gallery.map((url: any) => {
        if (typeof url === 'string' && this.hasDoubleS3Concatenation(url)) {
          return this.fixDoubleS3Url(url);
        }
        return url;
      });

      // Only add task if there were changes
      if (JSON.stringify(project.gallery) !== JSON.stringify(fixedGallery)) {
        issues.push({
          projectId: project.id,
          fieldName: 'gallery',
          originalValue: project.gallery,
          fixedValue: fixedGallery,
          type: 'array'
        });
      }
    }

    return issues;
  }

  /**
   * Check if URL has double S3 concatenation
   */
  private hasDoubleS3Concatenation(url: string): boolean {
    const bucketUrlCount = (url.match(new RegExp(BUCKET_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    return bucketUrlCount > 1;
  }

  /**
   * Fix double S3 URL concatenation
   */
  private fixDoubleS3Url(url: string): string {
    // Find the second occurrence of the bucket URL
    const firstIndex = url.indexOf(BUCKET_URL);
    if (firstIndex === -1) return url;

    const secondIndex = url.indexOf(BUCKET_URL, firstIndex + BUCKET_URL.length);
    if (secondIndex === -1) return url;

    // Return the URL starting from the second occurrence
    return url.substring(secondIndex);
  }

  /**
   * Execute URL fixes
   */
  async executeUrlFixes(): Promise<void> {
    console.log(`\n🔧 Starting URL fixes (${this.dryRun ? 'DRY RUN' : 'LIVE MODE'})`);
    console.log(`   URLs to fix: ${this.tasks.length}`);

    if (this.dryRun) {
      console.log('\n📋 DRY RUN - Preview of fixes:');
      this.tasks.slice(0, 5).forEach((task, i) => {
        console.log(`\n${i + 1}. Project ID: ${task.projectId}`);
        console.log(`   Field: ${task.fieldName}`);
        if (task.type === 'single') {
          console.log(`   Original: ${task.originalValue.substring(0, 80)}...`);
          console.log(`   Fixed:    ${task.fixedValue.substring(0, 80)}...`);
        } else {
          console.log(`   Gallery URLs: ${task.originalValue.length} items`);
          console.log(`   Fixed URLs: ${task.fixedValue.length} items`);
        }
      });
      if (this.tasks.length > 5) {
        console.log(`   ... and ${this.tasks.length - 5} more fixes`);
      }
      return;
    }

    let processed = 0;
    const startTime = Date.now();
    const tableName = 'Projects-fvn7t5hbobaxjklhrqzdl4ac34-NONE'; // Development table

    // Process each task individually to avoid DynamoDB conflicts
    for (const task of this.tasks) {
      try {
        const result = await this.executeSingleTaskFix(tableName, task);
        this.results.push(result);
        
        processed++;
        
        if (processed % 10 === 0 || !result.success) {
          console.log(`   Progress: ${processed}/${this.tasks.length} (${(processed/this.tasks.length*100).toFixed(1)}%)`);
        }
        
        if (!result.success) {
          console.error(`   ❌ Failed: ${task.projectId}.${task.fieldName}: ${result.error}`);
        }
        
      } catch (error) {
        this.results.push({
          task,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`   ❌ Task failed: ${error}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const successful = this.results.filter(r => r.success).length;
    
    console.log(`\n✅ URL fixes complete!`);
    console.log(`   Duration: ${duration} minutes`);
    console.log(`   Successful: ${successful}/${this.tasks.length}`);
    console.log(`   Failed: ${this.tasks.length - successful}`);
  }

  /**
   * Execute fix for a single task
   */
  private async executeSingleTaskFix(tableName: string, task: UrlFixTask): Promise<FixResult> {
    try {
      const updateExpression = `SET ${task.fieldName} = :newValue`;
      const expressionAttributeValues = marshall({
        ':newValue': task.fixedValue
      });

      await dynamoClient.send(new UpdateItemCommand({
        TableName: tableName,
        Key: marshall({ id: task.projectId }),
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
   * Generate final report
   */
  generateReport(): void {
    const report = {
      completedAt: new Date().toISOString(),
      dryRun: this.dryRun,
      summary: {
        totalTasks: this.tasks.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        byFieldType: this.getTasksByFieldType()
      },
      tasks: this.tasks,
      results: this.results
    };

    const filename = `projects-image-fix-results-${Date.now()}.json`;
    fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Final Report:`);
    console.log(`   Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`) ;
    console.log(`   Tasks: ${report.summary.totalTasks}`);
    console.log(`   Successful: ${report.summary.successful}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Report saved: ${filename}`);

    console.log('\n📊 By Field Type:');
    Object.entries(report.summary.byFieldType).forEach(([field, count]) => {
      console.log(`   ${field}: ${count}`);
    });
  }

  /**
   * Get task counts by field type
   */
  private getTasksByFieldType(): Record<string, number> {
    const byType: Record<string, number> = {};
    this.tasks.forEach(task => {
      byType[task.fieldName] = (byType[task.fieldName] || 0) + 1;
    });
    return byType;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🔧 PROJECTS IMAGE URL FIXER');
  console.log('===========================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);

  const fixer = new ProjectsImageUrlFixer({ dryRun });

  try {
    // Scan for double URL issues
    await fixer.scanProjectsForDoubleUrls();

    // Execute fixes
    await fixer.executeUrlFixes();

    // Generate report
    fixer.generateReport();

    console.log('\n🎉 Projects image URL fix completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Projects image URL fix failed:', error);
    process.exit(1);
  }
}

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🔧 Projects Image URL Fixer');
  console.log('Usage: npx tsx scripts/fix-projects-image-urls.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run          Show what would be done without executing');
  console.log('  --help, -h         Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npx tsx scripts/fix-projects-image-urls.ts --dry-run     # Preview fixes');
  console.log('  npx tsx scripts/fix-projects-image-urls.ts               # Execute fixes');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}