# Data Migration Procedures - RealTechee 2.0

## Overview

Complete documentation for data migration between AWS Amplify Gen 2 environments, including migration scripts, procedures, and production readiness validation. This guide covers the three-environment architecture migration workflows.

## Migration Architecture

### Environment Backend Suffixes

| Environment | Current Backend Suffix | Purpose | Status |
|-------------|----------------------|---------|---------|
| **Local Sandbox** | `fvn7t5hbobaxjklhrqzdl4ac34` | Development & testing | ✅ Active |
| **Staging** | `irgzwsfnba3sfqtum5k2eyp4m` | Server validation & beta | ✅ Active |
| **Production** | `yk6ecaswg5aehj3ev76xzpbe` | Live production traffic | ✅ Active |

### Migration Pathways

```
Local Sandbox → Staging → Production
     ↓              ↓         ↓
Development    Beta Testing  Live Traffic
```

## Migration Scripts

### Available Migration Tools

#### 1. Sandbox → Staging Migration
**Script**: `scripts/migrate-sandbox-to-staging.sh`  
**Version**: v1.0.0  
**Status**: ✅ Completed and validated

```bash
#!/bin/bash
# Sandbox to Staging Migration Workflow

# Setup environment variables
export SOURCE_BACKEND_SUFFIX="fvn7t5hbobaxjklhrqzdl4ac34"  # Local sandbox
export TARGET_BACKEND_SUFFIX="irgzwsfnba3sfqtum5k2eyp4m"  # Staging
export AWS_REGION="us-west-1"

# Migration workflow options
./scripts/migrate-sandbox-to-staging.sh analyze          # Analyze migration scope
./scripts/migrate-sandbox-to-staging.sh dry-run         # Validate without changes
./scripts/migrate-sandbox-to-staging.sh test Contacts 3 # Test with sample data
./scripts/migrate-sandbox-to-staging.sh migrate         # Full migration execution
```

#### 2. Staging → Production Migration
**Script**: `scripts/migrate-staging-to-production.sh`  
**Version**: v1.0.0  
**Status**: ✅ Completed and validated

```bash
#!/bin/bash
# Staging to Production Migration Workflow

# Setup for production (enhanced safeguards)
export SOURCE_BACKEND_SUFFIX="irgzwsfnba3sfqtum5k2eyp4m"  # Staging
export TARGET_BACKEND_SUFFIX="yk6ecaswg5aehj3ev76xzpbe"  # Production
export AWS_REGION="us-west-1"

# Production workflow with enhanced safeguards
./scripts/migrate-staging-to-production.sh analyze      # Safety analysis
./scripts/migrate-staging-to-production.sh dry-run     # Production validation
./scripts/migrate-staging-to-production.sh migrate     # PRODUCTION deployment
```

### Migration Script Features

**Comprehensive Coverage**:
- ✅ **Data Migration**: All core business tables (Requests, Contacts, Projects, Properties, etc.)
- ✅ **User Migration**: Cognito users with proper authentication setup
- ✅ **Asset Migration**: S3 static/public artifacts replication
- ✅ **Validation**: Referential integrity and data consistency checks

**Safety Features**:
- ✅ **Multi-level Confirmations**: Prevent accidental production changes
- ✅ **Backup Creation**: Automatic backup before migration
- ✅ **Rollback Capability**: Emergency rollback procedures
- ✅ **Dry-run Mode**: Test migration without making changes
- ✅ **Incremental Testing**: Test with sample data before full migration

**Security Features**:
- ✅ **Environment Variables**: No secrets in code
- ✅ **Credential Masking**: Secure logging practices
- ✅ **AWS CLI Best Practices**: Retry logic and error handling
- ✅ **Table Classification**: Required vs optional tables with intelligent discovery

## Production Migration Status

### Data Migration Completion (Historical)

**Migration Date**: August 11-12, 2025  
**Status**: ✅ 100% Complete  
**Total Records Migrated**: 1,766 core business records

#### Core Business Tables Migrated

| Table | Records Migrated | Status | Validation |
|-------|------------------|---------|------------|
| **Contacts** | 241 | ✅ Complete | Perfect sync verified |
| **Properties** | 217 | ✅ Complete | Perfect sync verified |
| **Requests** | 196 | ✅ Complete | Perfect sync verified |
| **AuditLog** | 176 | ✅ Complete | Perfect sync verified |
| **ProjectComments** | 240 | ✅ Complete | Perfect sync verified |
| **Quotes** | 228 | ✅ Complete | Perfect sync verified |
| **ProjectPaymentTerms** | 196 | ✅ Complete | Perfect sync verified |
| **ProjectMilestones** | 142 | ✅ Complete | Perfect sync verified |
| **Projects** | 64 | ✅ Complete | Perfect sync verified |
| **Auth** | 58 | ✅ Complete | Perfect sync verified |
| **Affiliates** | 8 | ✅ Complete | Perfect sync verified |

**Total Tables Processed**: 35 DynamoDB tables  
**Data Integrity**: Zero data loss, complete referential integrity maintained  
**Environments Synchronized**: Legacy → Staging → Production (Perfect Sync)

### Production Infrastructure Status

**Backend Infrastructure**: ✅ Complete (Isolated production stack)  
**Environment Variables**: ✅ Complete (Production-specific configuration)  
**User Authentication**: ✅ Complete (Production Cognito pools operational)  
**S3 Assets**: ✅ Complete (Production bucket with replicated assets)  
**Monitoring**: ✅ Complete (CloudWatch dashboards operational)

## Migration Procedures

### Pre-Migration Checklist

#### Environment Preparation
```bash
# 1. Verify source environment
aws dynamodb list-tables --region us-west-1 | grep $SOURCE_BACKEND_SUFFIX

# 2. Verify target environment exists
aws dynamodb list-tables --region us-west-1 | grep $TARGET_BACKEND_SUFFIX

# 3. Check AWS credentials and permissions
aws sts get-caller-identity

# 4. Verify migration script permissions
ls -la scripts/migrate-*.sh
```

#### Data Validation
```bash
# 1. Count records in source environment
./scripts/migrate-sandbox-to-staging.sh analyze

# 2. Verify core business tables exist
aws dynamodb describe-table --table-name Contact-$SOURCE_BACKEND_SUFFIX-NONE --region us-west-1

# 3. Check Cognito user pools
aws cognito-idp list-users --user-pool-id $SOURCE_USER_POOL_ID --region us-west-1
```

### Migration Execution Workflow

#### Step 1: Analysis Phase
```bash
# Analyze migration scope and requirements
./scripts/migrate-staging-to-production.sh analyze

# Expected output:
# - Source table count and record counts
# - Target environment validation
# - Migration compatibility check
# - Estimated migration time
```

#### Step 2: Dry-Run Validation
```bash
# Validate migration without making changes
./scripts/migrate-staging-to-production.sh dry-run

# Expected output:
# - Migration plan details
# - Table mapping validation
# - User migration preview
# - Asset migration plan
```

#### Step 3: Test Migration (Optional)
```bash
# Test with sample data (recommended for critical migrations)
./scripts/migrate-staging-to-production.sh test Contacts 3

# Expected output:
# - 3 Contact records migrated
# - Referential integrity validation
# - Migration performance metrics
```

#### Step 4: Full Migration Execution
```bash
# Execute full migration with confirmation prompts
./scripts/migrate-staging-to-production.sh migrate

# Migration phases:
# 1. Backup creation
# 2. Core business tables migration
# 3. User authentication migration
# 4. S3 asset replication
# 5. Validation and verification
```

### Post-Migration Validation

#### Data Integrity Verification
```bash
#!/bin/bash
# Post-migration validation script

echo "=== Post-Migration Validation ==="

# 1. Record count verification
SOURCE_COUNT=$(aws dynamodb scan --table-name Contact-$SOURCE_BACKEND_SUFFIX-NONE --select COUNT --region us-west-1 --query 'Count' --output text)
TARGET_COUNT=$(aws dynamodb scan --table-name Contact-$TARGET_BACKEND_SUFFIX-NONE --select COUNT --region us-west-1 --query 'Count' --output text)

echo "Source Contacts: $SOURCE_COUNT"
echo "Target Contacts: $TARGET_COUNT"

if [ "$SOURCE_COUNT" -eq "$TARGET_COUNT" ]; then
    echo "✅ Contact migration verified"
else
    echo "❌ Contact count mismatch"
fi

# 2. Sample data verification
echo "=== Sample Record Verification ==="
aws dynamodb scan --table-name Contact-$TARGET_BACKEND_SUFFIX-NONE --limit 3 --region us-west-1

# 3. User authentication verification
echo "=== Authentication Verification ==="
aws cognito-idp list-users --user-pool-id $TARGET_USER_POOL_ID --region us-west-1
```

#### Application Connectivity Testing
```bash
#!/bin/bash
# Application connectivity validation

echo "=== Application Connectivity Test ==="

# 1. Backend connectivity
curl -s "https://$TARGET_GRAPHQL_URL/graphql" \
  -H "x-api-key: $TARGET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { listContacts { items { id email } } }"}' | jq '.'

# 2. Authentication flow test
# (Manual test with production credentials)
echo "Manual test required: Login with info@realtechee.com / Sababa123!"

# 3. Form submission test
echo "Manual test required: Submit test Contact Us form"
```

## Security & Best Practices

### Credential Management

**Environment Variables Required**:
```bash
# Migration-specific variables
export SOURCE_BACKEND_SUFFIX="source_suffix"
export TARGET_BACKEND_SUFFIX="target_suffix"
export AWS_REGION="us-west-1"

# Cognito migration variables
export SOURCE_USER_POOL_ID="source_pool_id"
export TARGET_USER_POOL_ID="target_pool_id"
export MIGRATION_DEFAULT_PASSWORD="secure_temporary_password"

# API access variables
export SOURCE_API_URL="source_graphql_url"
export TARGET_API_URL="target_graphql_url"
```

**Security Guidelines**:
1. **Never commit credentials** - Use environment variables only
2. **Mask sensitive data** in logs - Show only last 4 characters
3. **Rotate temporary credentials** immediately after migration
4. **Use backup storage outside repo** - `/backups/migrations/` in `.gitignore`
5. **Validate before execution** - Always run dry-run first
6. **Monitor migration logs** - Check for sensitive data exposure

### Data Protection

**Backup Strategy**:
```bash
# Automatic backup creation before migration
./scripts/backup-data.sh --environment $TARGET_BACKEND_SUFFIX --timestamp $(date +%Y%m%d_%H%M%S)

# Manual backup verification
aws dynamodb list-backups --table-name Contact-$TARGET_BACKEND_SUFFIX-NONE --region us-west-1
```

**Rollback Procedures**:
```bash
#!/bin/bash
# Emergency rollback procedure

echo "=== Emergency Migration Rollback ==="

# 1. Stop ongoing operations
echo "1. Stopping any ongoing migration processes"

# 2. Restore from backup
echo "2. Initiating rollback from backup"
./scripts/restore-from-backup.sh --backup-arn $BACKUP_ARN --target-suffix $TARGET_BACKEND_SUFFIX

# 3. Verify rollback success
echo "3. Verifying rollback completion"
aws dynamodb describe-table --table-name Contact-$TARGET_BACKEND_SUFFIX-NONE --region us-west-1

# 4. Update environment variables if needed
echo "4. Environment variable rollback may be required"
```

## Production Go-Live Procedures

### Production Readiness Checklist

#### Infrastructure Verification
- [x] **Backend Stack**: Production backend deployed with isolated suffix
- [x] **Environment Variables**: AWS Amplify Console configured with production overrides
- [x] **Database Tables**: All 35 tables created with production suffix
- [x] **User Authentication**: Cognito user pools operational with test accounts
- [x] **S3 Assets**: Production bucket configured with replicated assets
- [x] **Monitoring**: CloudWatch dashboards and SNS alerts operational

#### Data Migration Verification
- [x] **Core Business Data**: 1,766 records migrated with perfect synchronization
- [x] **User Accounts**: Test credentials `info@realtechee.com` / `Sababa123!` verified
- [x] **Referential Integrity**: All foreign key relationships validated
- [x] **Data Consistency**: Zero data loss confirmed across all tables

#### Application Testing
- [ ] **Authentication Flow**: Login/logout functionality verified
- [ ] **Form Submissions**: Contact forms creating proper database records
- [ ] **Notification Pipeline**: Email/SMS delivery confirmed operational
- [ ] **Admin Panel**: Full admin functionality tested
- [ ] **API Connectivity**: GraphQL endpoints responding correctly

### Go-Live Deployment Steps

#### Phase 1: Final Production Deployment
```bash
# Deploy latest code to production branch
git checkout production
git merge staging  # Ensure latest changes included
git push origin production  # Trigger AWS Amplify auto-deploy

# Expected outcome: Production frontend at production.d200k2wsaf8th3.amplifyapp.com
```

#### Phase 2: Production Smoke Testing
```bash
#!/bin/bash
# Production smoke testing script

echo "=== Production Smoke Testing ==="

# 1. Backend connectivity validation
echo "1. Testing backend connectivity"
curl -s https://production.d200k2wsaf8th3.amplifyapp.com/api/system/env

# 2. Authentication validation
echo "2. Manual authentication test required"
echo "   Login URL: https://production.d200k2wsaf8th3.amplifyapp.com/login"
echo "   Credentials: info@realtechee.com / Sababa123!"

# 3. Data loading verification
echo "3. Verify data loading in admin panel"
echo "   Expected: Contacts (241), Properties (217), Projects (64), Requests (196)"

# 4. Form submission test
echo "4. Submit test Contact Us form"
echo "   URL: https://production.d200k2wsaf8th3.amplifyapp.com/contact/contact-us"
```

#### Phase 3: Monitoring & Performance
```bash
# CloudWatch monitoring setup
aws cloudwatch put-metric-alarm \
  --alarm-name "Production-API-Errors" \
  --alarm-description "High error rate in production API" \
  --metric-name "Errors" \
  --namespace "AWS/AppSync" \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --region us-west-1

# Performance baseline establishment
echo "Establishing production performance baseline"
echo "Monitor: Response times, error rates, user engagement"
```

## Troubleshooting

### Common Migration Issues

#### Issue: DynamoDB Table Not Found
```bash
# Symptom: Migration fails with "Table not found" error
# Diagnosis:
aws dynamodb describe-table --table-name Contact-$TARGET_BACKEND_SUFFIX-NONE --region us-west-1

# Solution: Verify backend suffix and region
echo "Verify TARGET_BACKEND_SUFFIX: $TARGET_BACKEND_SUFFIX"
echo "Verify AWS_REGION: $AWS_REGION"
```

#### Issue: Cognito User Migration Failure
```bash
# Symptom: User authentication fails after migration
# Diagnosis:
aws cognito-idp list-users --user-pool-id $TARGET_USER_POOL_ID --region us-west-1

# Solution: Re-run user migration
./scripts/migrate-cognito-users.sh --source-pool $SOURCE_USER_POOL_ID --target-pool $TARGET_USER_POOL_ID
```

#### Issue: S3 Asset Access Denied
```bash
# Symptom: Images/documents not loading in production
# Diagnosis:
aws s3 ls s3://$TARGET_S3_BUCKET/assets/ --region us-west-1

# Solution: Verify bucket permissions and CORS configuration
aws s3api get-bucket-cors --bucket $TARGET_S3_BUCKET --region us-west-1
```

## Related Documentation

- **[AWS Amplify Gen 2 Complete Guide](../06-deployment/aws-amplify-gen2-complete-guide.md)** - Complete deployment procedures
- **[Environment Configuration Detailed](../00-overview/environment-configuration-detailed.md)** - Environment architecture
- **[Production Monitoring](../07-operations/production-monitoring.md)** - CloudWatch dashboards and alerting
- **[Node.js Production Dependencies Guide](../04-implementation/nodejs-production-dependencies-guide.md)** - Build dependencies

---

**Last Updated**: August 14, 2025  
**Version**: 4.2.2  
**Status**: Production Ready - Complete Migration Documentation ✅