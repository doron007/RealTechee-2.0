#!/bin/bash

# Simple Data Migration Script - Fixed Version
# Direct record-by-record migration for reliability

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-west-1"
SANDBOX_SUFFIX="fvn7t5hbobaxjklhrqzdl4ac34"
PRODUCTION_SUFFIX="aqnqdrctpzfwfjwyxxsmu6peoq"

echo_step() { echo -e "${GREEN}==>${NC} $1"; }
echo_info() { echo -e "${BLUE}ℹ️  INFO:${NC} $1"; }

# Tables to migrate
TABLES=("Contacts" "Properties" "Projects" "Requests" "Quotes" "NotificationQueue" "NotificationTemplate" "ProjectComments" "ProjectMilestones")

echo_step "🚀 Simple Data Migration"

for table_name in "${TABLES[@]}"; do
  echo_step "Migrating $table_name"
  
  SANDBOX_TABLE="${table_name}-${SANDBOX_SUFFIX}-NONE"
  PRODUCTION_TABLE="${table_name}-${PRODUCTION_SUFFIX}-NONE"
  
  # Get all items from sandbox
  echo_info "Scanning sandbox table: $SANDBOX_TABLE"
  
  aws dynamodb scan \
    --table-name "$SANDBOX_TABLE" \
    --region "$REGION" \
    --output json \
    --query 'Items' > "/tmp/${table_name}_items.json"
  
  RECORD_COUNT=$(jq length "/tmp/${table_name}_items.json")
  echo_info "Found $RECORD_COUNT records"
  
  if [ "$RECORD_COUNT" -eq 0 ]; then
    echo_info "No records to migrate for $table_name"
    continue
  fi
  
  # Import each record individually
  echo_info "Importing records to production..."
  imported_count=0
  
  jq -c '.[]' "/tmp/${table_name}_items.json" | while read -r item; do
    aws dynamodb put-item \
      --table-name "$PRODUCTION_TABLE" \
      --item "$item" \
      --region "$REGION" >/dev/null 2>&1
    
    imported_count=$((imported_count + 1))
    if [ $((imported_count % 10)) -eq 0 ]; then
      echo_info "Imported $imported_count records..."
    fi
  done
  
  # Verify count
  FINAL_COUNT=$(aws dynamodb scan --table-name "$PRODUCTION_TABLE" --region "$REGION" --select COUNT --output text --query 'Count')
  echo_info "Migration complete: $FINAL_COUNT records in production"
  
  rm "/tmp/${table_name}_items.json"
done

echo_step "✅ Migration Summary"
printf "%-25s %-15s %-15s\n" "Table" "Sandbox" "Production"
printf "%-25s %-15s %-15s\n" "-----" "-------" "----------"

for table_name in "${TABLES[@]}"; do
  SANDBOX_TABLE="${table_name}-${SANDBOX_SUFFIX}-NONE"
  PRODUCTION_TABLE="${table_name}-${PRODUCTION_SUFFIX}-NONE"
  
  SANDBOX_COUNT=$(aws dynamodb scan --table-name "$SANDBOX_TABLE" --region "$REGION" --select COUNT --output text --query 'Count')
  PRODUCTION_COUNT=$(aws dynamodb scan --table-name "$PRODUCTION_TABLE" --region "$REGION" --select COUNT --output text --query 'Count')
  
  printf "%-25s %-15s %-15s\n" "$table_name" "$SANDBOX_COUNT" "$PRODUCTION_COUNT"
done