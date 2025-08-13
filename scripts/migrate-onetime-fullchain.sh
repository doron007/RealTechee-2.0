#!/bin/bash

# 🔄 One-Time Full Chain Migration Script
# Quick and dirty hardcoded migration: Legacy Staging → New Staging → Production
# Preserves all IDs exactly as they are (no FK recalculation needed)

set -e  # Exit on any error

# Hardcoded backend suffixes
LEGACY_SUFFIX="fvn7t5hbobaxjklhrqzdl4ac34"    # Legacy staging (source)
STAGING_SUFFIX="irgzgwsfnzba3fqtum5k2eyp4m"   # New staging
PRODUCTION_SUFFIX="yk6ecaswg5aehjn3ev76xzpbfe"  # Production
AWS_REGION="us-west-1"

# Hardcoded table list (35 tables from legacy environment)
declare -a TABLES=(
    "Affiliates"
    "AppPreferences"
    "AuditLog"
    "Auth"
    "BackOfficeAssignTo"
    "BackOfficeBookingStatuses"
    "BackOfficeBrokerage"
    "BackOfficeNotifications"
    "BackOfficeProducts"
    "BackOfficeProjectStatuses"
    "BackOfficeQuoteStatuses"
    "BackOfficeRequestStatuses"
    "BackOfficeRoleTypes"
    "ContactAuditLog"
    "ContactUs"
    "Contacts"
    "EmailSuppressionList"
    "Legal"
    "MemberSignature"
    "NotificationEvents"
    "NotificationQueue"
    "NotificationTemplate"
    "PendingAppoitments"
    "ProjectComments"
    "ProjectMilestones"
    "ProjectPaymentTerms"
    "ProjectPermissions"
    "Projects"
    "Properties"
    "QuoteItems"
    "Quotes"
    "Requests"
    "SESReputationMetrics"
    "SecureConfig"
    "eSignatureDocuments"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="../backups/migrations"
LOG_FILE="../logs/fullchain_migration_${TIMESTAMP}.log"

mkdir -p "$(dirname "$BACKUP_DIR")" "$(dirname "$LOG_FILE")"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
}

# Get item count for a table
get_item_count() {
    local table_name="$1"
    local count=$(aws dynamodb describe-table --table-name "$table_name" --region "$AWS_REGION" --query 'Table.ItemCount' --output text 2>/dev/null || echo "0")
    echo "$count"
}

# Get actual item count via scan (more accurate for verification)
get_scan_count() {
    local table_name="$1"
    local count=$(aws dynamodb scan --table-name "$table_name" --region "$AWS_REGION" --select "COUNT" --query 'Count' --output text 2>/dev/null || echo "0")
    echo "$count"
}

# Clear all items from a table
clear_table() {
    local table_name="$1"
    log_info "Clearing table: $table_name"
    
    # Get all items and delete them
    aws dynamodb scan --table-name "$table_name" --region "$AWS_REGION" --query 'Items[].{id: id}' --output json 2>/dev/null | \
    jq -c '.[]' | while read -r item; do
        if [[ -n "$item" && "$item" != "null" ]]; then
            aws dynamodb delete-item --table-name "$table_name" --key "$item" --region "$AWS_REGION" >/dev/null 2>&1 || true
        fi
    done
}

# Export table data to JSON file
export_table() {
    local source_table="$1"
    local export_file="$2"
    
    log_info "Exporting: $source_table"
    
    aws dynamodb scan --table-name "$source_table" --region "$AWS_REGION" --output json > "$export_file" 2>/dev/null || {
        log_error "Failed to export $source_table"
        return 1
    }
    
    local item_count=$(jq -r '.Count // 0' "$export_file")
    log_info "Exported $item_count items from $source_table"
    return 0
}

# Import data from JSON file to table
import_table() {
    local target_table="$1"
    local import_file="$2"
    
    log_info "Importing to: $target_table"
    
    local item_count=$(jq -r '.Count // 0' "$import_file")
    if [[ "$item_count" -eq 0 ]]; then
        log_warning "No items to import to $target_table"
        return 0
    fi
    
    # Import in batches of 25 (DynamoDB batch limit)
    local batch_size=25
    local imported=0
    
    jq -c '.Items[]' "$import_file" | while read -r item; do
        if [[ -n "$item" && "$item" != "null" ]]; then
            aws dynamodb put-item --table-name "$target_table" --item "$item" --region "$AWS_REGION" >/dev/null 2>&1 && {
                ((imported++))
                if [[ $((imported % 100)) -eq 0 ]]; then
                    log_info "Imported $imported items to $target_table"
                fi
            } || {
                log_warning "Failed to import item to $target_table"
            }
        fi
    done
    
    log_success "Import completed: $target_table"
}

# Validate counts match
validate_counts() {
    local source_table="$1"
    local target_table="$2"
    
    local source_count=$(get_scan_count "$source_table")
    local target_count=$(get_scan_count "$target_table")
    
    log_info "Validation: $source_table($source_count) → $target_table($target_count)"
    
    if [[ "$source_count" -eq "$target_count" ]]; then
        log_success "✓ Counts match: $source_count"
        return 0
    else
        log_error "✗ Count mismatch: source=$source_count, target=$target_count"
        return 1
    fi
}

# Main migration function
migrate_table() {
    local table_base="$1"
    local legacy_table="${table_base}-${LEGACY_SUFFIX}-NONE"
    local staging_table="${table_base}-${STAGING_SUFFIX}-NONE"
    local production_table="${table_base}-${PRODUCTION_SUFFIX}-NONE"
    local export_file="${BACKUP_DIR}/fullchain_export_${table_base}_${TIMESTAMP}.json"
    
    log_info "🔄 Migrating table: $table_base"
    
    # Step 1: Export from legacy
    if ! export_table "$legacy_table" "$export_file"; then
        log_error "Export failed for $table_base - SKIPPING"
        return 1
    fi
    
    # Step 2: Clear staging table
    clear_table "$staging_table"
    sleep 2  # Allow time for deletions to propagate
    
    # Step 3: Validate staging is empty
    local staging_count=$(get_scan_count "$staging_table")
    if [[ "$staging_count" -ne 0 ]]; then
        log_warning "Staging table not empty: $staging_count items remaining"
    fi
    
    # Step 4: Import to staging
    import_table "$staging_table" "$export_file"
    sleep 3  # Allow time for writes to propagate
    
    # Step 5: Validate staging import
    if ! validate_counts "$legacy_table" "$staging_table"; then
        log_error "Staging validation failed for $table_base"
    fi
    
    # Step 6: Clear production table
    clear_table "$production_table"
    sleep 2
    
    # Step 7: Validate production is empty
    local production_count=$(get_scan_count "$production_table")
    if [[ "$production_count" -ne 0 ]]; then
        log_warning "Production table not empty: $production_count items remaining"
    fi
    
    # Step 8: Import to production
    import_table "$production_table" "$export_file"
    sleep 3
    
    # Step 9: Validate production import
    if ! validate_counts "$legacy_table" "$production_table"; then
        log_error "Production validation failed for $table_base"
    fi
    
    log_success "✅ Completed: $table_base"
    echo ""
}

# Show usage
show_usage() {
    echo "🔄 One-Time Full Chain Migration"
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  all        - Run full migration for all 35 tables"
    echo "  export     - Export all tables from legacy to JSON files"
    echo "  staging    - Import all exports to staging"
    echo "  production - Import all exports to production"
    echo "  test TABLE - Test migration for single table"
    echo ""
    echo "Hardcoded suffixes:"
    echo "  Legacy:     $LEGACY_SUFFIX"
    echo "  Staging:    $STAGING_SUFFIX"
    echo "  Production: $PRODUCTION_SUFFIX"
    echo ""
}

# Main execution
case "${1:-help}" in
    "all")
        echo "🚀 Starting full chain migration for ${#TABLES[@]} tables..."
        echo "This will export from legacy → import to staging → import to production"
        echo ""
        read -p "Continue? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Migration cancelled"
            exit 0
        fi
        
        for table in "${TABLES[@]}"; do
            migrate_table "$table"
        done
        
        log_success "🎉 Full chain migration completed!"
        ;;
        
    "export")
        echo "📤 Exporting all ${#TABLES[@]} tables from legacy..."
        mkdir -p "$BACKUP_DIR"
        
        for table in "${TABLES[@]}"; do
            legacy_table="${table}-${LEGACY_SUFFIX}-NONE"
            export_file="${BACKUP_DIR}/fullchain_export_${table}_${TIMESTAMP}.json"
            export_table "$legacy_table" "$export_file"
        done
        ;;
        
    "staging")
        echo "📥 Importing all exports to staging..."
        
        for table in "${TABLES[@]}"; do
            staging_table="${table}-${STAGING_SUFFIX}-NONE"
            # Find the latest export file for this table
            export_file=$(ls -t "${BACKUP_DIR}/fullchain_export_${table}_"*.json 2>/dev/null | head -1)
            
            if [[ -f "$export_file" ]]; then
                log_info "Using export file: $(basename "$export_file")"
                clear_table "$staging_table"
                sleep 1
                import_table "$staging_table" "$export_file"
            else
                log_warning "No export file found for table: $table"
            fi
        done
        ;;
        
    "production")
        echo "📥 Importing all exports to production..."
        
        for table in "${TABLES[@]}"; do
            production_table="${table}-${PRODUCTION_SUFFIX}-NONE"
            # Find the latest export file for this table
            export_file=$(ls -t "${BACKUP_DIR}/fullchain_export_${table}_"*.json 2>/dev/null | head -1)
            
            if [[ -f "$export_file" ]]; then
                log_info "Using export file: $(basename "$export_file")"
                clear_table "$production_table"
                sleep 1
                import_table "$production_table" "$export_file"
            else
                log_warning "No export file found for table: $table"
            fi
        done
        ;;
        
    "test")
        if [[ -z "$2" ]]; then
            echo "Usage: $0 test <TABLE_NAME>"
            exit 1
        fi
        
        migrate_table "$2"
        ;;
        
    *)
        show_usage
        ;;
esac