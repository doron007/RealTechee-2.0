import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Amplify } from 'aws-amplify';
import fs from 'fs';
import path from 'path';

// Production configuration  
const prodConfig = {
  API: {
    GraphQL: {
      endpoint: 'https://your-prod-api-endpoint.appsync-api.us-west-1.amazonaws.com/graphql',
      region: 'us-west-1',
      defaultAuthMode: 'apiKey' as const,
      apiKey: 'your-production-api-key'
    }
  }
};

// Sandbox configuration (current)
const sandboxConfig = {
  API: {
    GraphQL: {
      endpoint: 'https://ajdut2nnz5hm7nxbz4yujdpqni.appsync-api.us-west-1.amazonaws.com/graphql',
      region: 'us-west-1', 
      defaultAuthMode: 'apiKey' as const,
      apiKey: 'your-sandbox-api-key'
    }
  }
};

interface SyncOptions {
  models: string[];
  anonymize?: boolean;
  limit?: number;
  dryRun?: boolean;
}

class AmplifyDataSync {
  private prodClient: any;
  private sandboxClient: any;
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(__dirname, '../data/backups', new Date().toISOString().split('T')[0]);
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async initialize() {
    console.log('🔧 Initializing Amplify clients...');
    
    // Configure for production
    Amplify.configure(prodConfig);
    this.prodClient = generateClient<Schema>();
    
    // Note: You'll need to switch configs or use different instances
    // This is a simplified example - in practice, you'd need separate client instances
  }

  async exportFromProduction(modelName: string, limit: number = 1000): Promise<any[]> {
    console.log(`📤 Exporting ${modelName} from production...`);
    
    try {
      // Configure for production
      Amplify.configure(prodConfig);
      const client = generateClient<Schema>();
      
      // Generic way to list items from any model
      const result = await (client.models as any)[modelName].list({ limit });
      
      if (result.errors && result.errors.length > 0) {
        console.error(`❌ Error exporting ${modelName}:`, result.errors);
        return [];
      }
      
      const data = result.data || [];
      console.log(`✅ Exported ${data.length} ${modelName} records`);
      
      // Save backup
      const backupFile = path.join(this.backupDir, `${modelName}_prod_backup.json`);
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      console.error(`❌ Failed to export ${modelName}:`, error);
      return [];
    }
  }

  async importToSandbox(modelName: string, data: any[], options: { anonymize?: boolean } = {}): Promise<void> {
    console.log(`📥 Importing ${data.length} records to ${modelName} in sandbox...`);
    
    try {
      // Configure for sandbox
      Amplify.configure(sandboxConfig);
      const client = generateClient<Schema>();
      
      let processed = 0;
      
      for (const item of data) {
        try {
          // Remove system fields that shouldn't be copied
          const cleanItem = this.cleanItemForImport(item, options.anonymize);
          
          // Create new record in sandbox
          const result = await (client.models as any)[modelName].create(cleanItem);
          
          if (result.errors && result.errors.length > 0) {
            console.warn(`⚠️  Warning creating ${modelName}:`, result.errors);
          } else {
            processed++;
          }
        } catch (error) {
          console.warn(`⚠️  Failed to import ${modelName} record:`, error);
        }
      }
      
      console.log(`✅ Successfully imported ${processed}/${data.length} ${modelName} records`);
    } catch (error) {
      console.error(`❌ Failed to import ${modelName}:`, error);
    }
  }

  private cleanItemForImport(item: any, anonymize: boolean = false): any {
    // Remove system-generated fields
    const cleaned = { ...item };
    delete cleaned.id;
    delete cleaned.createdAt;
    delete cleaned.updatedAt;
    delete cleaned.owner;
    
    // Anonymize sensitive data if requested
    if (anonymize) {
      if (cleaned.email) {
        cleaned.email = this.anonymizeEmail(cleaned.email);
      }
      if (cleaned.phone) {
        cleaned.phone = this.anonymizePhone(cleaned.phone);
      }
      if (cleaned.name) {
        cleaned.name = this.anonymizeName(cleaned.name);
      }
      if (cleaned.fullAddress) {
        cleaned.fullAddress = this.anonymizeAddress(cleaned.fullAddress);
      }
    }
    
    return cleaned;
  }

  private anonymizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `test${Math.random().toString(36).substr(2, 5)}@${domain}`;
  }

  private anonymizePhone(phone: string): string {
    return phone.replace(/\d/g, () => Math.floor(Math.random() * 10).toString());
  }

  private anonymizeName(name: string): string {
    return `Test ${name.split(' ').map(() => 'User').join(' ')}`;
  }

  private anonymizeAddress(address: string): string {
    return address.replace(/\d+/g, '123').replace(/[A-Za-z]+ St|[A-Za-z]+ Ave|[A-Za-z]+ Rd/g, 'Test St');
  }

  async clearSandboxData(modelName: string): Promise<void> {
    console.log(`🗑️  Clearing ${modelName} data from sandbox...`);
    
    try {
      // Configure for sandbox
      Amplify.configure(sandboxConfig);
      const client = generateClient<Schema>();
      
      // List all items
      const result = await (client.models as any)[modelName].list({ limit: 1000 });
      const items = result.data || [];
      
      console.log(`Found ${items.length} ${modelName} records to delete`);
      
      // Delete each item
      for (const item of items) {
        try {
          await (client.models as any)[modelName].delete({ id: item.id });
        } catch (error) {
          console.warn(`⚠️  Failed to delete ${modelName} ${item.id}:`, error);
        }
      }
      
      console.log(`✅ Cleared ${modelName} data from sandbox`);
    } catch (error) {
      console.error(`❌ Failed to clear ${modelName}:`, error);
    }
  }

  async syncModels(options: SyncOptions): Promise<void> {
    console.log('🚀 Starting production to sandbox data sync...');
    console.log(`Models to sync: ${options.models.join(', ')}`);
    console.log(`Anonymize data: ${options.anonymize ? 'Yes' : 'No'}`);
    console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
    
    if (options.dryRun) {
      console.log('🧪 DRY RUN MODE - No data will be modified');
    }
    
    for (const modelName of options.models) {
      console.log(`\n📊 Processing ${modelName}...`);
      
      // Export from production
      const prodData = await this.exportFromProduction(modelName, options.limit);
      
      if (prodData.length === 0) {
        console.log(`⚠️  No data found for ${modelName} in production`);
        continue;
      }
      
      if (!options.dryRun) {
        // Clear sandbox data
        await this.clearSandboxData(modelName);
        
        // Import to sandbox
        await this.importToSandbox(modelName, prodData, { 
          anonymize: options.anonymize 
        });
      }
    }
    
    console.log('\n🎉 Data sync completed!');
    console.log(`📁 Backups saved to: ${this.backupDir}`);
    
    if (options.anonymize) {
      console.log('🔒 Data has been anonymized for testing');
    } else {
      console.log('⚠️  WARNING: Production data copied as-is. Handle with care!');
    }
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
Usage: node -r esbuild-register scripts/sync-amplify-data.ts [options]

Options:
  --models <model1,model2>  Comma-separated list of models to sync
  --anonymize              Anonymize sensitive data (recommended)
  --limit <number>         Limit number of records per model (default: 1000)
  --dry-run               Preview what would be synced without making changes
  --help                  Show this help

Examples:
  # Sync all models with anonymization
  node -r esbuild-register scripts/sync-amplify-data.ts --models Contact,Property,Project --anonymize

  # Dry run to see what would be synced
  node -r esbuild-register scripts/sync-amplify-data.ts --models Contact --dry-run

  # Sync specific models without anonymization (careful!)
  node -r esbuild-register scripts/sync-amplify-data.ts --models Contact,Property
`);
    return;
  }
  
  const modelsArg = args[args.indexOf('--models') + 1];
  const models = modelsArg ? modelsArg.split(',').map(m => m.trim()) : ['Contact', 'Property', 'Project', 'Quote', 'Request'];
  
  const options: SyncOptions = {
    models,
    anonymize: args.includes('--anonymize'),
    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 1000,
    dryRun: args.includes('--dry-run')
  };
  
  const syncer = new AmplifyDataSync();
  await syncer.initialize();
  await syncer.syncModels(options);
}

// Export for use in other scripts
export { AmplifyDataSync };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
