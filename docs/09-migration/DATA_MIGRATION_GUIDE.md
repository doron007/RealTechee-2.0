# 🚀 Data Migration Guide

Comprehensive guide for migrating data from dev/staging environment to production with relationship preservation and rollback capability.

## 📋 Overview

The data migration system provides a systematic way to transfer all data from development/staging DynamoDB tables (`*-fvn7t5hbobaxjklhrqzdl4ac34-*`) to production tables (`*-aqnqdrctpzfwfjwyxxsmu6peoq-*`) while preserving all relationships and foreign keys.

### Key Features

- **🔄 Deterministic ID Mapping**: Ensures consistent relationship preservation
- **🧪 Multi-Stage Execution**: Dry-run → Single-record test → Full migration  
- **🔒 Automatic Rollback**: Emergency rollback on any failure
- **✅ Comprehensive Validation**: Pre/post migration integrity checks
- **📊 Detailed Reporting**: Complete audit trail and statistics
- **🚨 Safety First**: Multiple confirmation steps for destructive operations

## 🗄️ Database Architecture

### Table Migration Order (Respects Dependencies)

```
Level 1 (Independent):
├── Properties
├── Contacts  
├── BackOffice* tables (9 tables)
├── NotificationTemplate
├── Auth, AppPreferences, SecureConfig

Level 2 (Level 1 Dependencies):
├── ContactUs (→ Contacts, Properties)
├── Requests (→ Contacts, Properties)
├── Affiliates (→ Contacts, Properties)
└── Other support tables (6 tables)

Level 3 (Level 2 Dependencies):  
└── Projects (→ Contacts, Properties)

Level 4 (Level 3 Dependencies):
├── Quotes (→ Projects, Contacts)
└── Project* tables (4 tables)

Level 5 (Level 4 Dependencies):
└── QuoteItems (→ Projects, Quotes)
```

### Relationship Mapping

The migration engine automatically maps these foreign key relationships:

- **Requests**: `agentContactId`, `homeownerContactId`, `addressId`
- **Projects**: `agentContactId`, `homeownerContactId`, `homeowner2ContactId`, `homeowner3ContactId`, `addressId`
- **Quotes**: `projectId`, `agentContactId`, `homeownerContactId`, `addressId`
- **QuoteItems**: `projectId`
- **ContactUs**: `contactId`, `addressId`

## 🚀 Quick Start

### Prerequisites

1. **AWS Credentials** - Set environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID=your_access_key_id
   export AWS_SECRET_ACCESS_KEY=your_secret_access_key
   export AWS_REGION=us-west-1
   ```

2. **Node.js** - Version 16+ required

3. **Access to Both Environments** - Read access to dev/staging, write access to production

### Step 1: Analyze (Dry Run)

Start with a safe analysis of what would be migrated:

```bash
# Method 1: Direct script
./scripts/migrate-data.sh analyze

# Method 2: npm script  
npm run migrate:data:analyze
```

**Output**: 
- Total records count across all tables
- Relationship mapping analysis  
- Estimated migration duration
- Detailed analysis JSON file

### Step 2: Test Single Record

Test the migration process with a single record:

```bash
# Test with Contacts table
./scripts/migrate-data.sh test Contacts

# Test with Properties table  
./scripts/migrate-data.sh test Properties
```

**What this does**:
- Migrates 1 record from the specified table
- Tests foreign key mapping logic
- Validates the complete process
- Can be safely run multiple times

### Step 3: Full Migration

⚠️ **DESTRUCTIVE OPERATION** - Only run after successful testing:

```bash
# Interactive migration with confirmations
./scripts/migrate-data.sh migrate

# npm script alternative
npm run migrate:data:full
```

**Safety Features**:
- Double confirmation required
- Automatic rollback on failure  
- Progress tracking with detailed logs
- Complete audit trail

### Step 4: Check Status

Monitor migration progress and results:

```bash
./scripts/migrate-data.sh status
npm run migrate:data:status
```

## 🔧 Advanced Usage

### Direct Node.js Execution

For advanced users or automation:

```bash
# Dry run analysis
node scripts/data-migration-engine.js --mode=dry-run

# Single table test
node scripts/data-migration-engine.js --mode=test --table=Contacts --limit=1

# Full migration (requires confirmation)
node scripts/data-migration-engine.js --mode=full --confirm
```

### Custom Limits and Filters

The migration engine supports various options:

- `--limit=N`: Limit number of records (test mode only)
- `--table=TableName`: Specify single table (test mode)
- `--confirm`: Required for full migration mode

## 📊 Migration Process Details

### ID Generation Strategy

The engine creates deterministic new IDs using:
- Source table name  
- Source record ID
- Target environment suffix
- SHA-256 hash for uniqueness

Example: `a1b2c3d4-1j2k3l4m` → Consistent mapping every time

### Relationship Preservation

1. **Dependency Order**: Tables migrated in dependency order
2. **ID Mapping**: Source IDs mapped to target IDs in memory
3. **FK Resolution**: Foreign keys updated to use target IDs  
4. **Validation**: Post-migration relationship integrity check

### Error Handling

- **Pre-Migration**: Environment access, table structure, data integrity checks
- **During Migration**: Record-level error handling with detailed logging
- **Post-Migration**: Relationship validation and final integrity check
- **Failure Recovery**: Automatic rollback of all migrated data

## 📈 Monitoring & Reporting

### Generated Files

After each operation, you'll find these files in the `scripts/` directory:

```
migration-analysis-{timestamp}.json    # Dry run analysis
migration-report-{timestamp}.json      # Full migration report  
migration-checkpoint-{timestamp}.json  # Rollback information
```

### Report Contents

Migration reports include:
- **Statistics**: Tables processed, records migrated, errors encountered
- **Timing**: Start time, end time, duration
- **ID Mappings**: Complete source → target ID mapping
- **Validation Results**: All integrity checks performed
- **Migration Log**: Detailed step-by-step operations

## 🚨 Troubleshooting

### Common Issues

**Issue**: AWS credentials not found
```bash
# Solution: Set environment variables
export AWS_ACCESS_KEY_ID=your_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_key
```

**Issue**: Table not found errors
```bash  
# Solution: Verify environment suffixes are correct
# Check that both source and target environments exist
```

**Issue**: Foreign key mapping failures
```bash
# Solution: Run dependencies first
# The engine handles this automatically in full mode
```

**Issue**: Migration stops mid-process
```bash
# Check the migration log for specific error
# Automatic rollback will have been initiated
# Re-run after fixing the root cause
```

### Recovery Procedures

**If Migration Fails**:
1. Check generated log files for error details
2. Automatic rollback will have cleaned up partial data
3. Fix the root cause (permissions, data integrity, etc.)
4. Re-run the migration process

**Manual Rollback** (if needed):
```bash
# Emergency cleanup - use with extreme caution
node scripts/data-migration-engine.js --mode=rollback --checkpoint=checkpoint-file.json
```

## ⚠️ Important Warnings

1. **Production Data**: This migration will modify production DynamoDB tables
2. **Backup First**: Consider backing up production data before migration
3. **Test Thoroughly**: Always run dry-run and single-record tests first  
4. **Monitor Closely**: Watch the migration process for any errors
5. **Timing**: Plan for 10-30 minutes migration time depending on data volume
6. **No Interruption**: Do not interrupt the migration process once started

## 📞 Support

If you encounter issues:

1. Check the generated log files for error details
2. Review this documentation for troubleshooting steps  
3. Contact the development team with:
   - Error messages from logs
   - Migration report files
   - Steps to reproduce the issue

## 🎯 Next Steps After Migration

1. **Verify Data**: Use the status command to check migration results
2. **Test Application**: Thoroughly test production functionality
3. **Monitor Performance**: Watch for any database performance issues
4. **Update Documentation**: Update any environment-specific documentation
5. **Clean Up**: Archive migration reports and logs as needed

---

*Generated by the RealTechee Data Migration Engine v3.4.1*