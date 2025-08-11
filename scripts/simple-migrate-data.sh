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

# Tables to migrate - in dependency order
TABLES=(
  # Level 1: Independent tables (no foreign keys)
  "Properties" "Contacts" "BackOfficeAssignTo" "BackOfficeNotifications" "BackOfficeProducts" 
  "BackOfficeProjectStatuses" "BackOfficeQuoteStatuses" "BackOfficeRequestStatuses" "BackOfficeRoleTypes"
  "NotificationTemplate" "Auth" "AppPreferences"
  
  # Level 2: Tables with Level 1 dependencies  
  "ContactUs" "Requests" "AuditLog" "ContactAuditLog" "NotificationQueue"
  
  # Level 3: Tables with Level 2 dependencies
  "Projects" 
  
  # Level 4: Tables with Level 3 dependencies
  "Quotes" "ProjectComments" "ProjectMilestones" "ProjectPaymentTerms"
  
  # Level 5: Tables with Level 4 dependencies
  "QuoteItems"
)

# Add mode parameter
MODE=${1:-analyze}

if [ "$MODE" = "analyze" ]; then
  echo_step "🔍 Data Migration Analysis"
  echo_info "Analyzing data in both environments..."
  
  printf "%-25s %-15s %-15s %-15s\n" "Table" "Sandbox" "Production" "Status"
  printf "%-25s %-15s %-15s %-15s\n" "-----" "-------" "----------" "------"
  
  total_sandbox=0
  total_production=0
  
  for table_name in "${TABLES[@]}"; do
    SANDBOX_TABLE="${table_name}-${SANDBOX_SUFFIX}-NONE"
    PRODUCTION_TABLE="${table_name}-${PRODUCTION_SUFFIX}-NONE"
    
    # Get counts (handle table not found errors)
    SANDBOX_COUNT=$(aws dynamodb scan --table-name "$SANDBOX_TABLE" --region "$REGION" --select COUNT --output text --query 'Count' 2>/dev/null || echo "N/A")
    PRODUCTION_COUNT=$(aws dynamodb scan --table-name "$PRODUCTION_TABLE" --region "$REGION" --select COUNT --output text --query 'Count' 2>/dev/null || echo "N/A")
    
    # Determine status
    if [ "$SANDBOX_COUNT" = "N/A" ]; then
      STATUS="Missing"
    elif [ "$PRODUCTION_COUNT" = "N/A" ]; then
      STATUS="Missing Prod"  
    elif [ "$SANDBOX_COUNT" = "0" ]; then
      STATUS="Empty"
    elif [ "$PRODUCTION_COUNT" = "0" ]; then
      STATUS="Ready"
    else
      STATUS="Has Data"
    fi
    
    printf "%-25s %-15s %-15s %-15s\n" "$table_name" "$SANDBOX_COUNT" "$PRODUCTION_COUNT" "$STATUS"
    
    # Add to totals if numeric
    if [[ "$SANDBOX_COUNT" =~ ^[0-9]+$ ]]; then
      total_sandbox=$((total_sandbox + SANDBOX_COUNT))
    fi
    if [[ "$PRODUCTION_COUNT" =~ ^[0-9]+$ ]]; then
      total_production=$((total_production + PRODUCTION_COUNT))
    fi
  done
  
  printf "%-25s %-15s %-15s %-15s\n" "-----" "-------" "----------" "------"
  printf "%-25s %-15s %-15s %-15s\n" "TOTAL" "$total_sandbox" "$total_production" ""
  
  echo ""
  echo_step "Analysis Summary"
  echo_info "Total records to migrate: $total_sandbox"
  echo_info "Current production records: $total_production" 
  echo_info "Estimated migration time: $((total_sandbox / 10)) seconds"
  
elif [ "$MODE" = "migrate" ]; then
  echo_step "🚀 Data Migration (Full)"
  echo_info "This will migrate ALL data from sandbox to production"
  echo ""
  read -p "Are you sure? Type 'YES' to continue: " confirm
  
  if [ "$confirm" != "YES" ]; then
    echo_info "Migration cancelled"
    exit 0
  fi
  
  for table_name in "${TABLES[@]}"; do
    echo_step "Migrating $table_name"
    
    SANDBOX_TABLE="${table_name}-${SANDBOX_SUFFIX}-NONE"
    PRODUCTION_TABLE="${table_name}-${PRODUCTION_SUFFIX}-NONE"
    
    # Check if tables exist
    if ! aws dynamodb describe-table --table-name "$SANDBOX_TABLE" --region "$REGION" >/dev/null 2>&1; then
      echo_info "Skipping $table_name - sandbox table not found"
      continue
    fi
    
    if ! aws dynamodb describe-table --table-name "$PRODUCTION_TABLE" --region "$REGION" >/dev/null 2>&1; then
      echo_info "Skipping $table_name - production table not found"
      continue  
    fi
    
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
      rm "/tmp/${table_name}_items.json"
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
  
else
  echo "Usage: $0 [analyze|migrate]"
  echo ""
  echo "  analyze  - Show what would be migrated (safe, no changes)"
  echo "  migrate  - Perform full migration (destructive)"
  echo ""
  exit 1
fi

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