# AWS Amplify Gen 2 Complete Deployment Guide

## 🎯 Official AWS Pattern Implementation

This comprehensive guide consolidates the complete AWS Amplify Gen 2 deployment strategy for RealTechee 2.0, covering development workflow, production deployment, and troubleshooting.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Structure](#environment-structure)
3. [Development Workflow](#development-workflow)
4. [Deployment Strategies](#deployment-strategies)
5. [Production Migration](#production-migration)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## 🏗️ Architecture Overview

### Problem Solved

**Previous Issue**: Deployment scripts committed environment-specific `amplify_outputs.json` files to git branches, causing:
- ❌ Permanent branch divergence and merge conflicts
- ❌ Git history pollution with config changes
- ❌ Risk of deploying wrong environment configurations
- ❌ Complex config switching and rollback procedures

**New Solution**: AWS Amplify Gen 2 **official pattern** where:
- ✅ Zero config files committed to git
- ✅ Build-time config generation using `amplify.yml`
- ✅ Branch-specific configurations via `npx ampx generate outputs`
- ✅ No merge conflicts or branch divergence
- ✅ Official AWS Amplify recommended approach

### Core Principle

**Never permanently commit environment-specific configurations to git branches.**

## 🌐 Environment Structure

```
Development  → main branch       → Single Amplify App (d200k2wsaf8th3)
Staging      → staging branch    → Single Amplify App (d200k2wsaf8th3)  
Production   → production branch → Single Amplify App (d200k2wsaf8th3)
```

**Key Architecture Change**: Now using a single AWS Amplify app with three branches, each automatically deployed when pushed to respective git branches.

### Configuration Generation Flow

```
AWS Amplify Build Process:
1. Code checkout from git branch
2. Backend phase: Run amplify.yml backend commands
3. Generate amplify_outputs.json via npx ampx generate outputs
4. Frontend phase: Build with generated config
5. Deploy to AWS infrastructure
```

## 🔧 Development Workflow

### Daily Development Session

#### 1. Start Your Environment
```bash
# Terminal 1: Start sandbox (leave running)
npx ampx sandbox --identifier doron --watch

# Terminal 2: Start Next.js (leave running)  
npm run dev
```

#### 2. Making Backend Changes

**Example: Adding a new field to Property model**

```typescript
// amplify/data/resource.ts
const Property = a.model({
  id: a.id().required(),
  fullAddress: a.string(),
  address: a.string(),
  city: a.string(),
  state: a.string(),
  zip: a.string(),
  // NEW FIELD: Add property type
  propertyType: a.string(), // 🆕 New field
}).authorization((allow) => allow.publicApiKey());
```

**What happens automatically:**
1. Save file → Amplify detects change
2. Redeploys sandbox (30-60 seconds)
3. Updates `amplify_outputs.json`
4. New GraphQL schema available

#### 3. Using the API in Your Frontend

```typescript
// utils/amplifyClient.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';

Amplify.configure(outputs);
const client = generateClient<Schema>();

// Create a property
export async function createProperty(propertyData: {
  fullAddress: string;
  city: string;
  state: string;
  propertyType: string; // 🆕 Use new field
}) {
  const result = await client.models.Property.create(propertyData);
  return result;
}

// List properties  
export async function listProperties() {
  const result = await client.models.Property.list();
  return result.data;
}
```

## 🚀 Deployment Strategies

### amplify.yml Configuration

The `amplify.yml` file defines branch-specific config generation:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        # Generate amplify_outputs.json based on branch/environment
        - echo "🔧 Generating environment-specific amplify_outputs.json"
        - |
          if [ "$AWS_BRANCH" = "main" ]; then
            echo "📍 Development environment (main branch)"
            npx ampx generate outputs --app-id d200k2wsaf8th3 --branch main
          elif [ "$AWS_BRANCH" = "staging" ]; then
            echo "📍 Staging environment (staging branch)"
            npx ampx generate outputs --app-id d200k2wsaf8th3 --branch staging
          elif [ "$AWS_BRANCH" = "production" ]; then
            echo "📍 Production environment (production branch)"
            npx ampx generate outputs --app-id d200k2wsaf8th3 --branch production
          else
            echo "⚠️  Unknown branch: $AWS_BRANCH, using development config"
            npx ampx generate outputs --app-id d200k2wsaf8th3 --branch main
          fi
        - echo "✅ Environment-specific amplify_outputs.json generated"
```

### Git Configuration

`amplify_outputs.json` is ignored in `.gitignore`:

```gitignore
# AWS Amplify Gen 2: configs generated during build, never commit
amplify_outputs.json
amplify_outputs*.json
```

### Temporary Commit Pattern (Legacy Prevention)

For understanding what we **avoid** with the new pattern:

```bash
# OLD PATTERN (DO NOT USE): Apply environment config
./scripts/switch-environment.sh staging

# OLD PATTERN (DO NOT USE): Create temporary commit for deployment
git add amplify_outputs.json
git commit -m "TEMP: staging config for deployment - will be reverted"

# OLD PATTERN (DO NOT USE): Deploy (triggers Amplify build with correct config)
git push origin prod

# OLD PATTERN (DO NOT USE): IMMEDIATELY revert to prevent divergence
git reset --hard HEAD~1
```

**New Pattern**: No commits needed - config generated automatically during build.

## 🚀 Deployment Commands

### Staging Deployment
```bash
# Simple git workflow - no scripts needed
git checkout staging
git merge main
git push origin staging
```

**Process**:
1. Merge latest changes from `main` to `staging`
2. Push to `staging` branch (triggers automatic AWS Amplify build)
3. AWS Amplify generates staging config via `amplify.yml`
4. Deployment completes automatically with correct staging configuration

### Production Deployment
```bash
# Simple git workflow - no scripts needed
git checkout production
git merge staging  # Deploy from tested staging
git push origin production
```

**Process**:
1. Merge tested changes from `staging` to `production`
2. Push to `production` branch (triggers automatic AWS Amplify build)
3. AWS Amplify generates production config via `amplify.yml`
4. Deployment completes automatically with production infrastructure

## 🔄 Production Migration Strategy

### ⚠️ **Critical Understanding: YOU Handle Data Migration**

Amplify Gen 2 **does NOT automatically migrate data** when you make schema changes. You must plan and execute migrations manually to prevent data loss.

### Schema Change Categories

#### ✅ **SAFE CHANGES** (Auto-handled by AWS)
- **Adding optional fields**: `newField: a.string()`
- **Adding new models**: `const NewModel = a.model({...})`
- **Adding indexes**: New `secondaryKey` definitions
- **Updating authorization rules**: Changes to `allow` rules

#### ⚠️ **BREAKING CHANGES** (YOU must handle)
- **Renaming fields**: `name → fullName` 
- **Changing field types**: `a.string() → a.integer()`
- **Making fields required**: `a.string() → a.string().required()`
- **Removing fields**: Deleting existing fields
- **Renaming models**: `User → Customer`

#### 🔥 **DANGEROUS CHANGES** (Risk data loss)
- **Dropping models**: Removing entire tables
- **Complex type changes**: Object structure modifications
- **Constraint changes**: Primary key modifications

### Migration Strategies

#### **Strategy 1: Additive Migrations (Recommended)**

```typescript
// BEFORE (amplify/data/resource.ts)
const Contact = a.model({
  name: a.string().required(),
  email: a.string()
}).authorization((allow) => allow.publicApiKey());

// AFTER - Add new field alongside old one
const Contact = a.model({
  name: a.string().required(),        // Keep old field
  firstName: a.string(),              // Add new field
  lastName: a.string(),               // Add new field
  email: a.string()
}).authorization((allow) => allow.publicApiKey());
```

**Migration Process:**
1. Deploy new schema with both old + new fields
2. Run data migration script to populate new fields
3. Update frontend to use new fields
4. Deploy removal of old fields (separate deployment)

#### **Strategy 2: Blue-Green Migration**

```typescript
// Create new model alongside old one
const ContactV2 = a.model({
  firstName: a.string().required(),
  lastName: a.string().required(),
  email: a.string()
}).authorization((allow) => allow.publicApiKey());

const Contact = a.model({  // Keep old model temporarily
  name: a.string().required(),
  email: a.string()
}).authorization((allow) => allow.publicApiKey());
```

### Data Migration Script Template

```typescript
// scripts/migrate-production-data.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

async function migrateContacts() {
  console.log('🔄 Starting contact migration...');
  
  // 1. Fetch all existing contacts
  const { data: contacts } = await client.models.Contact.list({
    limit: 1000  // Handle pagination for large datasets
  });
  
  // 2. Migrate each contact
  for (const contact of contacts) {
    if (contact.name && !contact.firstName) {
      const nameParts = contact.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // 3. Update with new structure
      await client.models.Contact.update({
        id: contact.id,
        firstName,
        lastName,
        schemaVersion: 2
      });
      
      console.log(`✅ Migrated: ${contact.name} → ${firstName} ${lastName}`);
    }
  }
  
  console.log('🎉 Migration completed!');
}

// Run migration
migrateContacts().catch(console.error);
```

### Production Deployment Checklist

#### **Pre-Deployment**
- [ ] **Backup production data** (DynamoDB backup/export)
- [ ] **Test migration in staging** with production-like data
- [ ] **Verify rollback procedure** works
- [ ] **Monitor script ready** for post-deployment validation
- [ ] **Communication plan** for downtime (if any)

#### **Deployment Steps**
1. **Deploy non-breaking changes first**
   ```bash
   # Deploy additive changes only
   npx ampx pipeline deploy --branch main
   ```

2. **Run data migration scripts**
   ```bash
   # Custom script to migrate existing data
   node scripts/migrate-contacts-to-v2.js
   ```

3. **Deploy frontend updates**
   ```bash
   # Frontend uses new fields
   git push origin main
   ```

4. **Clean up old fields** (separate deployment)
   ```bash
   # Remove deprecated fields
   npx ampx pipeline deploy --branch main
   ```

## 🔍 Debugging & Troubleshooting

### Check Sandbox Status
```bash
# See if sandbox is running
ps aux | grep "ampx sandbox"

# Check CloudFormation stacks
aws cloudformation list-stacks --region us-west-1 | grep doron
```

### View API in AWS Console
1. Open [AWS AppSync Console](https://console.aws.amazon.com/appsync/)
2. Find your API: `amplify-realtecheeclone-doron-sandbox-*`
3. Use Queries tab to test GraphQL

### Common Commands
```bash
# Stop sandbox
npx ampx sandbox delete --identifier doron

# Restart sandbox  
npx ampx sandbox --identifier doron --watch

# Deploy without watch
npx ampx sandbox --identifier doron
```

### Branch Synchronization Verification
```bash
# Before deployment
git rev-parse main
git rev-parse prod
# → Should be identical

# After deployment  
git rev-parse main
git rev-parse prod
# → Should still be identical
```

### If Merge Conflicts Still Occur
1. **Check branch synchronization**: `git rev-parse main prod prod-v2`
2. **Reset diverged branch**: `git reset --hard <source-branch>`
3. **Force push if needed**: `git push --force-with-lease origin <branch>`

### If Deployment Has Wrong Config
1. **Check local config**: Environment switches correctly applied
2. **Verify Amplify build**: Check Amplify console for deployment status
3. **Re-run deployment**: Scripts are now idempotent and safe to re-run

## 🚨 Rollback Procedures

### Emergency Rollback Steps
1. **Revert to previous branch deployment**
   ```bash
   git checkout main~1  # Previous commit
   npx ampx pipeline deploy --branch main
   ```

2. **Restore from DynamoDB backup**
   ```bash
   aws dynamodb restore-table-from-backup \
     --backup-arn arn:aws:dynamodb:us-west-1:...:backup/table/backup-id \
     --target-table-name Contact-new-table-id-NONE
   ```

3. **Update DNS/traffic routing** if needed

## ✅ Benefits Achieved

### 1. Zero Merge Conflicts
- **Before**: Config commits caused permanent branch divergence
- **After**: No config commits, branches stay synchronized

### 2. Official AWS Pattern
- **Before**: Custom config switching scripts
- **After**: Standard `npx ampx generate outputs` commands

### 3. Environment Safety
- **Before**: Risk of wrong config deployment
- **After**: Branch-specific auto-generation prevents config errors

### 4. Simplified Management
- **Before**: Complex config file switching and backup/restore
- **After**: Single `amplify.yml` manages all environments

### 5. Git Cleanliness
- **Before**: Git history polluted with config changes
- **After**: Clean git history with only application code

## 🔄 Testing with Production Data

### 📂 Latest CSV Data Location
**Important:** The latest CSV files for import are located in:
```
/data/csv/final/*.csv
```

Available datasets:
- `Contacts.csv` - Customer and lead information
- `Properties.csv` - Property listings and details  
- `Projects.csv` - Project data and status
- `Quotes.csv` & `QuoteItems.csv` - Quote information
- `Requests.csv` - Service requests
- And 20+ other data files

### Before Major Changes - Sync Production Data to Sandbox

**Method 1: DynamoDB Direct Export/Import**
```bash
# Sync production data to sandbox for testing
./scripts/sync-prod-to-sandbox.sh
```

**Method 2: Amplify GraphQL API Sync (Recommended)**
```bash
# Install dependencies first
npm install esbuild-register

# Sync with anonymized data (recommended)
node -r esbuild-register scripts/sync-amplify-data.ts \
  --models Contact,Property,Project,Quote,Request \
  --anonymize

# Dry run to preview what would be synced
node -r esbuild-register scripts/sync-amplify-data.ts \
  --models Contact,Property \
  --dry-run
```

**Method 3: Import from Latest CSV Files**
```bash
# Import from the latest CSV data in /data/csv/final/
node scripts/import-csv-data.ts --source /data/csv/final/ --models all

# Import specific models only
node scripts/import-csv-data.ts --source /data/csv/final/ --models Contact,Property,Project
```

### When to Sync Production Data
- ✅ **Before schema changes** that might affect existing data
- ✅ **Before complex query modifications**
- ✅ **Before authorization rule changes**
- ✅ **Before deploying to staging/production**
- ❌ **Don't sync for simple frontend changes**

### Data Safety Reminders
- 🔒 **Always anonymize** sensitive data when syncing
- 🗑️ **Clear sandbox data** when testing is complete
- 📋 **Use staging environment** for final production testing
- 🔑 **Protect API keys** and credentials

## 🛡️ Best Practices

### Environment Management
1. **Always test locally first**: `npm run build && npm run type-check`
2. **Verify branch sync**: Check that source and target branches match after deployment
3. **Monitor Amplify console**: Ensure deployments complete successfully
4. **Test environment**: Verify correct configuration is live after deployment

### Migration Best Practices
1. **Always test migrations in staging first**
2. **Use additive changes when possible**
3. **Keep old and new fields during transition**
4. **Plan for rollback scenarios**
5. **Monitor everything during deployment**
6. **Communicate changes to your team**
7. **Document all migration procedures**

### Development Best Practices
- **Keep sandbox running** during development (watch mode)
- **amplify_outputs.json** is your connection config (don't edit manually)
- **Backend changes** = save → auto-redeploy → test
- **Frontend changes** = save → hot-reload → immediate feedback
- **One sandbox per developer** (use unique identifier)
- **Plan migrations** before deploying breaking changes to production

## 🔍 Validation & Testing

### Local Development Testing
```bash
# Test current amplify_outputs.json (should not exist in git)
ls -la amplify_outputs*.json

# Expected: Only backup files, no committed configs
# amplify_outputs.backup.json (temporary, ignored)
```

### Deployment Testing
```bash
# 1. Test staging deployment
git checkout staging && git merge main && git push origin staging

# 2. Monitor AWS Amplify console for config generation
# 3. Verify staging environment loads correctly
# 4. Test production deployment
/deploy-production

# 5. Verify production isolation and config correctness
```

### Environment Verification
```bash
# Verify amplify_outputs.json is ignored
git status
# Should show: nothing to commit, working tree clean

# Verify no config files in git history
git log --oneline --grep="amplify_outputs"
# Should show: no config-related commits
```

## 📚 Migration Notes

### From Legacy Pattern
If upgrading from the old config-committing pattern:

1. **Remove committed configs**:
   ```bash
   git rm amplify_outputs.json
   git commit -m "Remove committed config - using build-time generation"
   ```

2. **Update `.gitignore`**:
   ```bash
   echo "amplify_outputs.json" >> .gitignore
   echo "amplify_outputs*.json" >> .gitignore
   ```

3. **Use new deployment commands**:
   - Old: `./scripts/deploy-staging.sh` 
   - New: `git checkout staging && git merge main && git push origin staging`

### Branch Cleanup
```bash
# Clean up any diverged branches (if needed)
git checkout main
git branch -D staging production  # Delete old branches if needed
# Recreate branches from main if necessary
git checkout -b staging
git checkout -b production
```

## 📊 Monitoring & Validation

### Key Metrics to Monitor
- API error rates
- Database query performance
- Frontend loading times
- User session errors
- Data consistency checks

### Validation Scripts
```typescript
// scripts/validate-migration.ts
async function validateMigration() {
  // Check data integrity
  const contacts = await client.models.Contact.list();
  const invalidContacts = contacts.data.filter(c => 
    !c.firstName || !c.lastName
  );
  
  if (invalidContacts.length > 0) {
    console.error('❌ Migration incomplete:', invalidContacts.length);
    return false;
  }
  
  console.log('✅ All contacts migrated successfully');
  return true;
}
```

## 📁 File Structure Impact

```
Your Project/
├── amplify/                    ← Backend definition
│   ├── data/resource.ts       ← Your models (Property, Contact, etc.)
│   └── backend.ts             ← Backend configuration
├── amplify_outputs.json       ← Generated API config (auto-updates)
├── utils/amplifyClient.ts     ← Your API client code
└── pages/components/          ← Frontend using the API
```

## 🛡️ Security & Best Practices

### 1. Environment Isolation
- **Development/Staging**: Shared backend for cost efficiency
- **Production**: Completely isolated infrastructure
- **Config Generation**: Environment-specific during build

### 2. Access Control
- **Development**: Full access for rapid iteration
- **Production**: Protected with confirmation prompts
- **AWS Console**: Monitor all deployments via Amplify console

### 3. Backup Strategy
- **Data Backups**: Automatic before production deployments
- **Config Backups**: No longer needed (build-time generation)
- **Rollback**: Git tags enable instant version rollback

## 📖 References

- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Multi-Environment Setup](https://docs.amplify.aws/gen2/deploy-and-host/branch-deployments/)
- [Build Configuration](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html)

---

**Implementation Status**: ✅ Complete  
**Pattern Type**: Official AWS Amplify Gen 2 Single-App Multi-Branch  
**Benefits**: Zero merge conflicts, simplified git workflow, automatic deployments  
**Deployment Method**: Simple git push to respective branches (main, staging, production)

*Updated: August 5, 2025 - Consolidated deployment guide with simplified git workflow*