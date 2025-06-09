#!/bin/bash

# Production Data to Sandbox Sync Script
# This script exports production DynamoDB data and imports it into your sandbox

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROD_REGION="us-west-1"  # Your production region
SANDBOX_REGION="us-west-1"  # Your sandbox region
SANDBOX_ID="doron"
BACKUP_DIR="./data/backups/$(date +%Y%m%d_%H%M%S)"

# Helper functions
echo_step() {
  echo -e "${GREEN}==>${NC} $1"
}

echo_warn() {
  echo -e "${YELLOW}WARNING:${NC} $1"
}

echo_error() {
  echo -e "${RED}ERROR:${NC} $1"
  exit 1
}

echo_info() {
  echo -e "${BLUE}INFO:${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo_step "🚀 Starting production data sync to sandbox..."

# Step 1: Get production table names
echo_step "📋 Getting production table names..."

# You'll need to replace these with your actual production table names
# These would be the table names in your production environment
PROD_TABLES=(
  "Contact-prod-table-id-NONE"
  "Property-prod-table-id-NONE" 
  "Project-prod-table-id-NONE"
  "Quote-prod-table-id-NONE"
  "Request-prod-table-id-NONE"
)

# Get sandbox table names (your current sandbox tables)
echo_step "📋 Getting sandbox table names..."
SANDBOX_TABLES=(
  "Contact-jv5p7hexdbakfgsncppv5qoike-NONE"
  "Property-jv5p7hexdbakfgsncppv5qoike-NONE"
  "Project-jv5p7hexdbakfgsncppv5qoike-NONE"
  "Quote-jv5p7hexdbakfgsncppv5qoike-NONE"
  "Request-jv5p7hexdbakfgsncppv5qoike-NONE"
)

# Step 2: Export production data
echo_step "📤 Exporting production data..."

for i in "${!PROD_TABLES[@]}"; do
  PROD_TABLE="${PROD_TABLES[$i]}"
  MODEL_NAME=$(echo "$PROD_TABLE" | cut -d'-' -f1)
  
  echo_info "Exporting $MODEL_NAME from $PROD_TABLE..."
  
  # Export to JSON
  aws dynamodb scan \
    --table-name "$PROD_TABLE" \
    --region "$PROD_REGION" \
    --output json > "$BACKUP_DIR/${MODEL_NAME}_prod_export.json"
    
  echo_info "✅ Exported $MODEL_NAME ($(jq '.Items | length' "$BACKUP_DIR/${MODEL_NAME}_prod_export.json") records)"
done

# Step 3: Clear sandbox data (optional - ask user)
echo_warn "This will CLEAR all data in your sandbox tables."
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo_info "Sync cancelled. Exported data is available in: $BACKUP_DIR"
  exit 0
fi

echo_step "🗑️  Clearing sandbox tables..."

for SANDBOX_TABLE in "${SANDBOX_TABLES[@]}"; do
  MODEL_NAME=$(echo "$SANDBOX_TABLE" | cut -d'-' -f1)
  echo_info "Clearing $MODEL_NAME in $SANDBOX_TABLE..."
  
  # Get all items and delete them
  aws dynamodb scan \
    --table-name "$SANDBOX_TABLE" \
    --region "$SANDBOX_REGION" \
    --query 'Items[].{id: id}' \
    --output json | \
  jq -r '.[] | .id.S' | \
  while read -r item_id; do
    if [ ! -z "$item_id" ]; then
      aws dynamodb delete-item \
        --table-name "$SANDBOX_TABLE" \
        --region "$SANDBOX_REGION" \
        --key "{\"id\": {\"S\": \"$item_id\"}}" \
        >/dev/null 2>&1
    fi
  done
done

# Step 4: Import production data to sandbox
echo_step "📥 Importing production data to sandbox..."

for i in "${!SANDBOX_TABLES[@]}"; do
  SANDBOX_TABLE="${SANDBOX_TABLES[$i]}"
  MODEL_NAME=$(echo "$SANDBOX_TABLE" | cut -d'-' -f1)
  EXPORT_FILE="$BACKUP_DIR/${MODEL_NAME}_prod_export.json"
  
  if [ -f "$EXPORT_FILE" ]; then
    echo_info "Importing $MODEL_NAME to $SANDBOX_TABLE..."
    
    # Convert and import each item
    jq -r '.Items[]' "$EXPORT_FILE" | while IFS= read -r item; do
      aws dynamodb put-item \
        --table-name "$SANDBOX_TABLE" \
        --region "$SANDBOX_REGION" \
        --item "$item" \
        >/dev/null 2>&1
    done
    
    # Verify import
    IMPORTED_COUNT=$(aws dynamodb scan \
      --table-name "$SANDBOX_TABLE" \
      --region "$SANDBOX_REGION" \
      --select COUNT \
      --output text --query 'Count')
    
    echo_info "✅ Imported $MODEL_NAME ($IMPORTED_COUNT records)"
  else
    echo_warn "Export file not found: $EXPORT_FILE"
  fi
done

echo_step "🎉 Production data sync completed!"
echo_info "Backup saved to: $BACKUP_DIR"
echo_info "You can now test your changes with production data in sandbox."

# Step 5: Reminder about data sensitivity
echo_warn "⚠️  IMPORTANT REMINDERS:"
echo "• You now have PRODUCTION DATA in your sandbox"
echo "• Be careful with API keys and access"
echo "• Consider anonymizing sensitive data"
echo "• This data should be used for testing only"
echo "• Delete sandbox data when testing is complete"
