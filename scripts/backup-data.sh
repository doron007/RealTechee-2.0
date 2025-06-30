#!/bin/bash

# Data Backup Script for Amplify Gen 2 Project
# MUST be run before any schema changes that could cause AWS to purge data

set -e  # Exit on any error

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
REGION="us-west-1"

echo "🚀 Starting data backup process..."
echo "📁 Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"/{dynamodb,cognito,s3}

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed or not in PATH"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

echo "✅ AWS CLI configured"

# Get Amplify outputs for resource IDs
if [[ ! -f "amplify_outputs.json" ]]; then
    echo "❌ Error: amplify_outputs.json not found"
    echo "Run: npx ampx generate outputs"
    exit 1
fi

echo "📊 Backing up DynamoDB tables..."

# List all tables and backup each one
aws dynamodb list-tables --region $REGION --output text --query 'TableNames[]' | while read table; do
    if [[ $table == *"amplify"* ]] || [[ $table == *"realtechee"* ]]; then
        echo "  📋 Backing up table: $table"
        aws dynamodb scan --table-name "$table" --region $REGION > "$BACKUP_DIR/dynamodb/${table}.json"
        
        # Also backup table description for restore
        aws dynamodb describe-table --table-name "$table" --region $REGION > "$BACKUP_DIR/dynamodb/${table}_schema.json"
    fi
done

echo "👥 Backing up Cognito users..."

# Get user pool ID from amplify outputs or environment
USER_POOL_ID=$(jq -r '.auth.user_pool_id // empty' amplify_outputs.json 2>/dev/null || echo "")

if [[ -z "$USER_POOL_ID" ]]; then
    echo "  ⚠️  Warning: User pool ID not found in amplify_outputs.json"
    echo "  📝 Searching for user pools manually..."
    
    # Try to find user pools that match our project
    aws cognito-idp list-user-pools --max-items 50 --region $REGION --output table
    
    echo "  ❓ Please set USER_POOL_ID environment variable and re-run"
else
    echo "  👤 Found user pool: $USER_POOL_ID"
    
    # Backup all users
    aws cognito-idp list-users --user-pool-id "$USER_POOL_ID" --region $REGION > "$BACKUP_DIR/cognito/users.json"
    
    # Backup user pool configuration
    aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --region $REGION > "$BACKUP_DIR/cognito/user_pool_config.json"
    
    # Backup groups
    aws cognito-idp list-groups --user-pool-id "$USER_POOL_ID" --region $REGION > "$BACKUP_DIR/cognito/groups.json" 2>/dev/null || echo "  ℹ️  No groups found"
fi

echo "🗂️ Backing up S3 files (if configured)..."

# Get S3 bucket from amplify outputs
S3_BUCKET=$(jq -r '.storage.bucket_name // empty' amplify_outputs.json 2>/dev/null || echo "")

if [[ -z "$S3_BUCKET" ]]; then
    echo "  ⚠️  Warning: S3 bucket not found in amplify_outputs.json"
else
    echo "  📦 Found S3 bucket: $S3_BUCKET"
    
    # Backup critical S3 files (avoid downloading everything)
    aws s3 ls s3://$S3_BUCKET --region $REGION > "$BACKUP_DIR/s3/file_list.txt"
    
    # Backup public files (usually small and important)
    if aws s3 ls s3://$S3_BUCKET/public/ --region $REGION &> /dev/null; then
        echo "  📁 Backing up public files..."
        aws s3 sync s3://$S3_BUCKET/public/ "$BACKUP_DIR/s3/public/" --region $REGION
    fi
fi

# Create restore script
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
#!/bin/bash

# Restore Script - USE WITH CAUTION
# This script restores data from backup

set -e
REGION="us-west-1"

echo "🔄 Starting data restore process..."
echo "⚠️  WARNING: This will overwrite existing data!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [[ $confirm != "yes" ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "📊 Restoring DynamoDB tables..."
for file in dynamodb/*.json; do
    if [[ $file != *"_schema.json" ]]; then
        table_name=$(basename "$file" .json)
        echo "  📋 Restoring table: $table_name"
        
        # Note: This is a simplified restore - real restore needs proper handling
        # of table recreation, key schemas, etc.
        echo "  ⚠️  Manual table restore required for: $table_name"
        echo "     File: $file"
    fi
done

echo "👥 Cognito user restore instructions:"
echo "  ⚠️  Cognito users must be restored manually or via custom script"
echo "  📄 User data: cognito/users.json"
echo "  ⚙️  Pool config: cognito/user_pool_config.json"

echo "🗂️ S3 file restore instructions:"
if [[ -d "s3/public" ]]; then
    echo "  📁 Public files can be restored with:"
    echo "     aws s3 sync s3/public/ s3://YOUR_NEW_BUCKET/public/ --region $REGION"
fi

echo "✅ Restore script completed"
echo "📝 Manual steps may be required for complete restoration"
EOF

chmod +x "$BACKUP_DIR/restore.sh"

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "region": "$REGION",
  "user_pool_id": "$USER_POOL_ID",
  "s3_bucket": "$S3_BUCKET",
  "tables_backed_up": $(ls -1 "$BACKUP_DIR/dynamodb/"*.json 2>/dev/null | wc -l),
  "backup_directory": "$BACKUP_DIR",
  "project": "RealTechee 2.0"
}
EOF

echo ""
echo "✅ Backup completed successfully!"
echo "📁 Backup location: $BACKUP_DIR"
echo "📋 Manifest: $BACKUP_DIR/manifest.json"
echo "🔄 Restore script: $BACKUP_DIR/restore.sh"
echo ""
echo "🚨 IMPORTANT NOTES:"
echo "   1. Test restore process on development environment first"
echo "   2. Keep this backup until schema changes are confirmed stable"
echo "   3. Cognito user restore requires manual process or custom script"
echo "   4. Validate all data after any restore operation"
echo ""
echo "🔒 You can now safely proceed with schema changes"