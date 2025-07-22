#!/bin/bash

# Batch Data Migration Script - More Efficient Version
# Migrates data using batch operations for better performance

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-west-1"
SANDBOX_SUFFIX="fvn7t5hbobaxjklhrqzdl4ac34"
PRODUCTION_SUFFIX="aqnqdrctpzfwfjwyxxsmu6peoq"
BACKUP_DIR="./data/migrations/batch_$(date +%Y%m%d_%H%M%S)"
BATCH_SIZE=25

# Helper functions
echo_step() {
  echo -e "${GREEN}==>${NC} $1"
}

echo_success() {
  echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

echo_info() {
  echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo_step "🚀 Starting Batch Data Migration"
echo_info "Batch size: $BATCH_SIZE records"
echo_info "Backup directory: $BACKUP_DIR"

# Core tables to migrate
CORE_TABLES=(
  "Contacts"
  "Properties"
  "Projects" 
  "Requests"
  "Quotes"
  "BackOfficeRequestStatuses"
  "NotificationQueue"
  "NotificationTemplate"
  "ProjectComments"
  "ProjectMilestones"
)

# Batch migration function
batch_migrate_table() {
  local table_name=$1
  local sandbox_table="${table_name}-${SANDBOX_SUFFIX}-NONE"
  local production_table="${table_name}-${PRODUCTION_SUFFIX}-NONE"
  
  echo_step "Batch migrating $table_name"
  
  # Export all data from sandbox
  echo_info "Exporting from sandbox: $sandbox_table"
  aws dynamodb scan \
    --table-name "$sandbox_table" \
    --region "$REGION" \
    --output json > "$BACKUP_DIR/${table_name}_export.json"
  
  local record_count=$(jq '.Items | length' "$BACKUP_DIR/${table_name}_export.json")
  echo_info "Found $record_count records to migrate"
  
  if [ "$record_count" -eq 0 ]; then
    echo_info "No data to migrate for $table_name"
    return
  fi
  
  # Split into batches and use batch-write-item
  echo_info "Processing in batches of $BATCH_SIZE..."
  
  local batch_count=0
  local imported_count=0
  
  jq -c ".Items | _nthchunk($BATCH_SIZE)" "$BACKUP_DIR/${table_name}_export.json" | while read -r batch; do
    if [ "$batch" = "null" ] || [ -z "$batch" ]; then
      continue
    fi
    
    batch_count=$((batch_count + 1))
    
    # Create batch write request
    local batch_request=$(echo "$batch" | jq -c "{
      \"$production_table\": [
        .[] | {
          \"PutRequest\": {
            \"Item\": .
          }
        }
      ]
    }")
    
    # Execute batch write
    echo "$batch_request" > "$BACKUP_DIR/batch_${batch_count}.json"
    
    aws dynamodb batch-write-item \
      --request-items file://"$BACKUP_DIR/batch_${batch_count}.json" \
      --region "$REGION" >/dev/null 2>&1
    
    local batch_size_actual=$(echo "$batch" | jq length)
    imported_count=$((imported_count + batch_size_actual))
    
    echo_info "Batch $batch_count: $batch_size_actual records imported"
    
    # Small delay to avoid throttling
    sleep 0.1
  done
  
  # Verify final count
  local final_count=$(aws dynamodb scan --table-name "$production_table" --region "$REGION" --select COUNT --output text --query 'Count' 2>/dev/null || echo "0")
  
  echo_success "$table_name migration completed: $final_count records in production"
}

# Main migration loop
for table_name in "${CORE_TABLES[@]}"; do
  batch_migrate_table "$table_name"
done

# Final verification
echo_step "🔍 Migration Verification"
printf "%-25s %-15s %-15s %-10s\n" "Table" "Sandbox" "Production" "Status"
printf "%-25s %-15s %-15s %-10s\n" "-----" "-------" "----------" "------"

for table_name in "${CORE_TABLES[@]}"; do
  SANDBOX_TABLE="${table_name}-${SANDBOX_SUFFIX}-NONE"
  PRODUCTION_TABLE="${table_name}-${PRODUCTION_SUFFIX}-NONE"
  
  SANDBOX_COUNT=$(aws dynamodb scan --table-name "$SANDBOX_TABLE" --region "$REGION" --select COUNT --output text --query 'Count' 2>/dev/null || echo "0")
  PRODUCTION_COUNT=$(aws dynamodb scan --table-name "$PRODUCTION_TABLE" --region "$REGION" --select COUNT --output text --query 'Count' 2>/dev/null || echo "0")
  STATUS=$([ "$SANDBOX_COUNT" -eq "$PRODUCTION_COUNT" ] && echo "✅ MATCH" || echo "⚠️  DIFF")
  
  printf "%-25s %-15s %-15s %-10s\n" "$table_name" "$SANDBOX_COUNT" "$PRODUCTION_COUNT" "$STATUS"
done

echo ""
echo_success "Batch migration completed!"
echo_info "Backup location: $BACKUP_DIR"