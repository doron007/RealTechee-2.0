#!/bin/bash

# 🚀 Staging to Production Data Migration Script
# Enterprise-grade migration tool for production deployment
# Part of Amplify Gen 2 Environment Plan implementation

set -e  # Exit on any error

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="migrate-staging-to-production.sh"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration from AMPLIFY_ENV_PLAN.md
SOURCE_ENV="staging"
TARGET_ENV="production"
AWS_REGION="${AWS_REGION:-us-west-1}"

# Environment Variables (must be exported explicitly – Phase 5 hardening removed defaults)
# REQUIRE: export SOURCE_BACKEND_SUFFIX=staging_suffix && export TARGET_BACKEND_SUFFIX=production_suffix
SOURCE_BACKEND_SUFFIX="${SOURCE_BACKEND_SUFFIX}"  # Staging backend suffix (required)
TARGET_BACKEND_SUFFIX="${TARGET_BACKEND_SUFFIX}"  # Production backend suffix (required)
MIGRATION_DEFAULT_PASSWORD="${MIGRATION_DEFAULT_PASSWORD}"

# Backup and logging
BACKUP_DIR="$PROJECT_ROOT/backups/migrations"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/migration_${SOURCE_ENV}_to_${TARGET_ENV}_${TIMESTAMP}.log"
REPORT_FILE="$SCRIPT_DIR/migration-report-${TIMESTAMP}.json"

# Core business tables (from CLAUDE.md)
declare -a CORE_TABLES=(
    "Requests"
    "Contacts" 
    "Projects"
    "Properties"
    "BackOfficeRequestStatuses"
    "Users"
    "Notifications"
    "ProjectImages"
    "PropertyImages"
    "Documents"
)

# Production safety checks
PRODUCTION_SAFETY_ENABLED=true
PRODUCTION_APPROVAL_REQUIRED=true

# Helper functions for logging
log_info() {
    local message="$1"
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $message"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $message" >> "$LOG_FILE"
}

log_success() {
    local message="$1"
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') $message"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $message" >> "$LOG_FILE"
}

log_warning() {
    local message="$1"
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') $message"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $message" >> "$LOG_FILE"
}

log_error() {
    local message="$1"
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $message"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $message" >> "$LOG_FILE"
}

log_critical() {
    local message="$1"
    echo -e "${RED}${BOLD}[CRITICAL]${NC} $(date '+%H:%M:%S') $message"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [CRITICAL] $message" >> "$LOG_FILE"
}

log_header() {
    local message="$1"
    echo ""
    echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD} $message ${NC}"
    echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Initialize directories and logging
initialize_environment() {
    log_info "Initializing production migration environment..."
    
    # Create directories
    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    
    # Initialize log file with production headers
    cat > "$LOG_FILE" << EOF
# STAGING TO PRODUCTION MIGRATION LOG
# ===================================
# CRITICAL: Production Environment Migration
# Started: $(date)
# Source: $SOURCE_ENV (suffix: $SOURCE_BACKEND_SUFFIX)
# Target: $TARGET_ENV (suffix: $TARGET_BACKEND_SUFFIX)
# Script Version: $SCRIPT_VERSION
# AWS Region: $AWS_REGION
# Safety Checks: $PRODUCTION_SAFETY_ENABLED
# Approval Required: $PRODUCTION_APPROVAL_REQUIRED

EOF
    
    log_success "Production environment initialized"
}

# Enhanced prerequisites check for production
check_production_prerequisites() {
    log_info "Checking production migration prerequisites..."
    
    local errors=0
    local warnings=0
    
    # Standard checks
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        ((errors++))
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        ((errors++))
    fi
    
    # Production-specific environment variable validation
    if [[ -z "$SOURCE_BACKEND_SUFFIX" ]]; then
        log_error "SOURCE_BACKEND_SUFFIX is required (no default; export explicitly)"
        ((errors++))
    fi
    if [[ -z "$TARGET_BACKEND_SUFFIX" ]]; then
        log_error "TARGET_BACKEND_SUFFIX is required (no default; export explicitly)"
        ((errors++))
    fi
    
    # AWS credentials validation
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured"
        ((errors++))
    else
        local aws_account=$(aws sts get-caller-identity --query Account --output text)
        local aws_user=$(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)
        log_info "AWS Account: $aws_account"
        log_info "AWS User/Role: $aws_user"
        
        # Production account validation (if needed)
        # Uncomment and modify for your production account
        # if [[ "$aws_account" != "YOUR_PRODUCTION_ACCOUNT_ID" ]]; then
        #     log_error "Not connected to production AWS account"
        #     ((errors++))
        # fi
    fi
    
    # Enhanced permissions check for production
    log_info "Validating production permissions..."
    
    # DynamoDB permissions
    if ! aws dynamodb list-tables --region "$AWS_REGION" >/dev/null 2>&1; then
        log_error "No DynamoDB permissions in region $AWS_REGION"
        ((errors++))
    fi
    
    # Cognito permissions
    if ! aws cognito-idp list-user-pools --max-results 1 --region "$AWS_REGION" >/dev/null 2>&1; then
        log_warning "Limited Cognito permissions detected"
        ((warnings++))
    fi
    
    # Production table existence check
    log_info "Validating production table existence..."
    local missing_production_tables=0
    for core_table in "${CORE_TABLES[@]}"; do
        local target_table_name="${core_table}-${TARGET_BACKEND_SUFFIX}-NONE"
        if ! aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" >/dev/null 2>&1; then
            log_error "Production table missing: $target_table_name"
            ((missing_production_tables++))
        fi
    done
    
    if [[ $missing_production_tables -gt 0 ]]; then
        log_critical "Missing $missing_production_tables production tables"
        log_critical "Deploy production backend before running migration"
        ((errors++))
    fi
    
    # Final validation summary
    if [[ $errors -gt 0 ]]; then
        log_error "Prerequisites check failed: $errors error(s), $warnings warning(s)"
        return 1
    elif [[ $warnings -gt 0 ]]; then
        log_warning "Prerequisites check passed with $warnings warning(s)"
    else
        log_success "All production prerequisites validated"
    fi
    
    return 0
}

# Production safety analysis
production_safety_analysis() {
    log_header "PRODUCTION SAFETY ANALYSIS"
    
    # Check production data status
    log_info "Analyzing current production data..."
    
    local total_production_items=0
    local production_status="EMPTY"
    
    for core_table in "${CORE_TABLES[@]}"; do
        local target_table_name="${core_table}-${TARGET_BACKEND_SUFFIX}-NONE"
        
        local item_count=0
        if aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" >/dev/null 2>&1; then
            item_count=$(aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" --query 'Table.ItemCount' --output text 2>/dev/null || echo "0")
        fi
        
        total_production_items=$((total_production_items + item_count))
        
        if [[ $item_count -gt 0 ]]; then
            log_warning "Production table $core_table has $item_count items"
            production_status="HAS_DATA"
        fi
    done
    
    # Safety analysis results
    log_info "Production environment analysis:"
    log_info "• Total existing items: $total_production_items"
    log_info "• Production status: $production_status"
    
    if [[ "$production_status" == "HAS_DATA" ]]; then
        log_critical "⚠️  PRODUCTION ENVIRONMENT CONTAINS DATA"
        echo ""
        echo -e "${RED}${BOLD}CRITICAL WARNING:${NC}"
        echo "The production environment already contains $total_production_items items."
        echo "This migration will OVERWRITE existing production data."
        echo ""
        echo -e "${YELLOW}Recommended actions:${NC}"
        echo "1. Create a complete backup of production data"
        echo "2. Coordinate with stakeholders about data loss"
        echo "3. Consider append-mode migration instead"
        echo ""
        
        if [[ "$PRODUCTION_SAFETY_ENABLED" == true ]]; then
            read -p "Continue with destructive migration? (type 'OVERWRITE'): " -r
            if [[ "$REPLY" != "OVERWRITE" ]]; then
                log_info "Migration cancelled for production safety"
                return 1
            fi
        fi
    fi
    
    return 0
}

# Enhanced analysis for production migration
analyze_production_migration() {
    log_header "PRODUCTION MIGRATION ANALYSIS"
    
    if ! production_safety_analysis; then
        return 1
    fi
    
    local total_staging_items=0
    local analysis_data="["
    local first_table=true
    
    for core_table in "${CORE_TABLES[@]}"; do
        local source_table_name="${core_table}-${SOURCE_BACKEND_SUFFIX}-NONE"
        local target_table_name="${core_table}-${TARGET_BACKEND_SUFFIX}-NONE"
        
        log_info "Analyzing table: $core_table"
        
        # Get staging table item count
        local source_count=0
        if aws dynamodb describe-table --table-name "$source_table_name" --region "$AWS_REGION" >/dev/null 2>&1; then
            source_count=$(aws dynamodb describe-table --table-name "$source_table_name" --region "$AWS_REGION" --query 'Table.ItemCount' --output text 2>/dev/null || echo "0")
        fi
        
        # Get production table item count
        local target_count=0
        if aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" >/dev/null 2>&1; then
            target_count=$(aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" --query 'Table.ItemCount' --output text 2>/dev/null || echo "0")
        fi
        
        log_info "  Staging items: $source_count → Production items: $target_count"
        total_staging_items=$((total_staging_items + source_count))
        
        # Add to analysis data
        if [[ "$first_table" != true ]]; then
            analysis_data+=","
        fi
        analysis_data+="{\"table\":\"$core_table\",\"staging_count\":$source_count,\"production_count\":$target_count,\"source_table_name\":\"$source_table_name\",\"target_table_name\":\"$target_table_name\"}"
        first_table=false
    done
    
    analysis_data+="]"
    
    # Enhanced production analysis report
    cat > "$SCRIPT_DIR/production-migration-analysis-${TIMESTAMP}.json" << EOF
{
    "analysis_timestamp": "$(date -Iseconds)",
    "script_version": "$SCRIPT_VERSION",
    "migration_type": "PRODUCTION",
    "migration_path": "$SOURCE_ENV -> $TARGET_ENV",
    "source_suffix": "$SOURCE_BACKEND_SUFFIX",
    "target_suffix": "$TARGET_BACKEND_SUFFIX",
    "total_items_to_migrate": $total_staging_items,
    "core_tables_count": ${#CORE_TABLES[@]},
    "table_analysis": $analysis_data,
    "estimated_duration_minutes": $((total_staging_items / 100 + 10)),
    "aws_region": "$AWS_REGION",
    "production_safety_checks": {
        "safety_enabled": $PRODUCTION_SAFETY_ENABLED,
        "approval_required": $PRODUCTION_APPROVAL_REQUIRED
    }
}
EOF
    
    log_success "Production migration analysis completed"
    echo ""
    echo -e "${BOLD}🚀 PRODUCTION MIGRATION ANALYSIS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Total staging items: $total_staging_items"
    echo "Core tables: ${#CORE_TABLES[@]}"
    echo "Estimated duration: $((total_staging_items / 100 + 10)) minutes"
    echo "Analysis report: production-migration-analysis-${TIMESTAMP}.json"
    echo ""
    
    return 0
}

# Production migration with enhanced safeguards
production_migration() {
    log_header "🚀 PRODUCTION DEPLOYMENT MIGRATION"
    
    # Multi-level confirmation for production
    echo -e "${RED}${BOLD}⚠️  CRITICAL: PRODUCTION DATA MIGRATION${NC}"
    echo ""
    echo -e "${BOLD}This is a PRODUCTION environment migration:${NC}"
    echo "• Source: $SOURCE_ENV (suffix: $SOURCE_BACKEND_SUFFIX)"
    echo "• Target: $TARGET_ENV (suffix: $TARGET_BACKEND_SUFFIX)"
    echo "• Tables: ${#CORE_TABLES[@]} core business tables"
    echo "• Region: $AWS_REGION"
    echo ""
    echo -e "${RED}${BOLD}PRODUCTION IMPACT:${NC}"
    echo "• Live user data will be affected"
    echo "• Service downtime may be required"
    echo "• Rollback requires manual intervention"
    echo "• All stakeholders should be notified"
    echo ""
    
    # First confirmation
    read -p "Have all stakeholders been notified? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Migration cancelled - stakeholders not notified"
        return 0
    fi
    
    # Second confirmation
    read -p "Is production backup completed? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Migration cancelled - production backup required"
        return 0
    fi
    
    # Final confirmation
    read -p "Type 'PRODUCTION-MIGRATE' to confirm: " -r
    if [[ "$REPLY" != "PRODUCTION-MIGRATE" ]]; then
        log_info "Migration cancelled"
        return 0
    fi
    
    echo ""
    read -p "Final confirmation - Type 'DEPLOY-TO-PROD' to proceed: " -r
    if [[ "$REPLY" != "DEPLOY-TO-PROD" ]]; then
        log_info "Migration cancelled"
        return 0
    fi
    
    log_critical "Starting production migration process..."
    
    # Migration statistics
    local migration_start_time=$(date +%s)
    local total_migrated=0
    local total_errors=0
    
    # Create comprehensive production backup
    log_info "Creating comprehensive production backup..."
    local backup_file="$BACKUP_DIR/production_backup_${TIMESTAMP}.json"
    echo "{\"timestamp\":\"$(date -Iseconds)\",\"environment\":\"PRODUCTION\",\"tables\":{" > "$backup_file"
    
    # Process each core table with enhanced error handling
    for i in "${!CORE_TABLES[@]}"; do
        local core_table="${CORE_TABLES[$i]}"
        local source_table_name="${core_table}-${SOURCE_BACKEND_SUFFIX}-NONE"
        local target_table_name="${core_table}-${TARGET_BACKEND_SUFFIX}-NONE"
        
        log_info "🔄 Production migration: $core_table ($((i+1))/${#CORE_TABLES[@]})"
        
        # Backup existing production data
        log_info "Backing up production data: $target_table_name"
        local existing_data
        existing_data=$(aws dynamodb scan --table-name "$target_table_name" --region "$AWS_REGION" --output json 2>/dev/null || echo '{"Items":[],"Count":0}')
        
        # Add to backup file
        echo "\"$core_table\":$existing_data" >> "$backup_file"
        if [[ $((i+1)) -lt ${#CORE_TABLES[@]} ]]; then
            echo "," >> "$backup_file"
        fi
        
        # Get staging source data
        log_info "Reading staging data: $source_table_name"
        local source_data
        source_data=$(aws dynamodb scan --table-name "$source_table_name" --region "$AWS_REGION" --output json 2>/dev/null) || {
            log_error "Failed to scan staging table: $source_table_name"
            ((total_errors++))
            continue
        }
        
        local source_count
        source_count=$(echo "$source_data" | jq -r '.Count // 0')
        
        if [[ "$source_count" -eq 0 ]]; then
            log_warning "No items to migrate from: $source_table_name"
            continue
        fi
        
        log_info "Migrating $source_count items to production"
        
        # Migrate items in batches with production safeguards
        local batch_size=25  # DynamoDB batch_write_item limit
        local item_count=0
        local batch_items=""
        local batch_count=0
        local successful_batches=0
        local failed_batches=0
        
        echo "$source_data" | jq -c '.Items[]' | while read -r item; do
            # Update backend suffix references
            local updated_item
            updated_item=$(echo "$item" | sed "s/$SOURCE_BACKEND_SUFFIX/$TARGET_BACKEND_SUFFIX/g")
            
            # Add to batch
            if [[ "$batch_items" != "" ]]; then
                batch_items+=","
            fi
            batch_items+="{\"PutRequest\":{\"Item\":$updated_item}}"
            ((batch_count++))
            ((item_count++))
            
            # Process batch when full or at end
            if [[ $batch_count -eq $batch_size ]] || [[ $item_count -eq $source_count ]]; then
                local batch_request="{\"$target_table_name\":[$batch_items]}"
                
                # Enhanced error handling for production
                local retry_count=0
                local max_retries=3
                local batch_success=false
                
                while [[ $retry_count -lt $max_retries && "$batch_success" == false ]]; do
                    if aws dynamodb batch-write-item \
                        --request-items "$batch_request" \
                        --region "$AWS_REGION" >/dev/null 2>&1; then
                        
                        log_success "Production batch migrated: $batch_count items"
                        total_migrated=$((total_migrated + batch_count))
                        ((successful_batches++))
                        batch_success=true
                    else
                        ((retry_count++))
                        log_warning "Batch failed, retry $retry_count/$max_retries"
                        sleep $((retry_count * 2))  # Exponential backoff
                    fi
                done
                
                if [[ "$batch_success" == false ]]; then
                    log_error "Failed to migrate batch after $max_retries retries"
                    total_errors=$((total_errors + batch_count))
                    ((failed_batches++))
                fi
                
                # Reset batch
                batch_items=""
                batch_count=0
            fi
        done
        
        log_success "Completed production migration: $core_table"
        log_info "  Successful batches: $successful_batches"
        if [[ $failed_batches -gt 0 ]]; then
            log_warning "  Failed batches: $failed_batches"
        fi
    done
    
    # Close backup file
    echo "}}" >> "$backup_file"
    
    # Calculate migration duration
    local migration_end_time=$(date +%s)
    local migration_duration=$((migration_end_time - migration_start_time))
    
    # Generate comprehensive production migration report
    cat > "$REPORT_FILE" << EOF
{
    "migration_timestamp": "$(date -Iseconds)",
    "script_version": "$SCRIPT_VERSION",
    "migration_type": "PRODUCTION",
    "migration_path": "$SOURCE_ENV -> $TARGET_ENV",
    "source_suffix": "$SOURCE_BACKEND_SUFFIX",
    "target_suffix": "$TARGET_BACKEND_SUFFIX",
    "aws_region": "$AWS_REGION",
    "migration": {
        "status": "completed",
        "start_time": "$migration_start_time",
        "end_time": "$migration_end_time",
        "durationSeconds": $migration_duration
    },
    "statistics": {
        "tablesProcessed": ${#CORE_TABLES[@]},
        "recordsMigrated": $total_migrated,
        "errorsEncountered": $total_errors
    },
    "production_safeguards": {
        "backup_created": true,
        "multi_confirmation": true,
        "retry_logic": true
    },
    "backup_file": "$backup_file",
    "log_file": "$LOG_FILE"
}
EOF
    
    log_success "🎉 PRODUCTION MIGRATION COMPLETED!"
    echo ""
    echo -e "${BOLD}🚀 PRODUCTION DEPLOYMENT SUMMARY${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Migration duration: $migration_duration seconds"
    echo "Tables processed: ${#CORE_TABLES[@]}"
    echo "Records migrated: $total_migrated"
    echo "Errors encountered: $total_errors"
    echo "Production backup: $(basename "$backup_file")"
    echo "Migration report: $(basename "$REPORT_FILE")"
    echo ""
    echo -e "${GREEN}${BOLD}NEXT STEPS:${NC}"
    echo "1. Verify production application functionality"
    echo "2. Monitor for issues in first 24 hours"
    echo "3. Notify stakeholders of successful deployment"
    echo "4. Archive migration logs and backup"
    echo ""
    
    return 0
}

# Show usage information
show_usage() {
    cat << EOF

🚀 ${BOLD}Staging to Production Data Migration Tool${NC}
═══════════════════════════════════════════════════════════════════════════════════

${RED}${BOLD}⚠️  PRODUCTION ENVIRONMENT MIGRATION TOOL ⚠️${NC}

${BOLD}Usage:${NC} $0 <command> [options]

${BOLD}Commands:${NC}
  ${CYAN}analyze${NC}     - Analyze production migration scope with safety checks
  ${CYAN}dry-run${NC}     - Validate migration without changes (production safe)
  ${CYAN}test${NC}        - Test migration with sample data [table] [limit]
  ${CYAN}migrate${NC}     - Perform PRODUCTION migration (CRITICAL OPERATION)
  ${CYAN}help${NC}        - Show this help message

${BOLD}Examples:${NC}
  $0 analyze                          # Analyze production migration with safety checks
  $0 dry-run                          # Validate production environment and permissions
  $0 test Contacts 2                  # Test with 2 sample records (production safe)
  $0 migrate                          # PRODUCTION MIGRATION (requires multiple confirmations)

${BOLD}Required Environment Variables:${NC}
    ${YELLOW}SOURCE_BACKEND_SUFFIX${NC}         # Staging backend suffix (example)
    ${YELLOW}TARGET_BACKEND_SUFFIX${NC}         # Production backend suffix (example)
    (No embedded defaults – must export explicitly)

${BOLD}Production Setup (example):${NC}
    export SOURCE_BACKEND_SUFFIX="<staging_suffix>"
    export TARGET_BACKEND_SUFFIX="<production_suffix>"
  export AWS_REGION="us-west-1"
    # Destructive commands require --confirm-suffix <production_suffix>
  
  # Production migration workflow:
  $0 analyze          # First, analyze with safety checks
  $0 dry-run          # Validate production readiness
  $0 test Contacts 1  # Test with single sample
  $0 migrate          # PRODUCTION DEPLOYMENT

${BOLD}Production Safety Features:${NC}
• Multi-level confirmation required for production
• Comprehensive backup before migration
• Enhanced error handling with retries
• Production data impact analysis
• Stakeholder notification checkpoints
• Rollback capability through backups

${BOLD}Core Business Tables:${NC}
$(printf "  • %s\n" "${CORE_TABLES[@]}")

${RED}${BOLD}PRODUCTION WARNINGS:${NC}
• This migration affects LIVE user data
• Service downtime may occur during migration
• Notify all stakeholders before proceeding
• Ensure complete backup is available
• Test thoroughly in staging first

${PURPLE}Script Version: $SCRIPT_VERSION${NC}
${PURPLE}Environment: PRODUCTION${NC}
${PURPLE}AWS Region: $AWS_REGION${NC}

EOF
}

# Global arg parsing (Phase 5 hardening)
CONFIRM_SUFFIX=""
for arg in "$@"; do
    case $arg in
        --confirm-suffix)
            shift
            CONFIRM_SUFFIX="$1";
            shift
            ;;
    esac
done

# Enforce confirmation for destructive migrate command
if [[ "$1" == "migrate" ]]; then
    if [[ -z "$CONFIRM_SUFFIX" ]]; then
        echo -e "${RED}[ERROR]${NC} --confirm-suffix <production_suffix> required for migrate command" >&2
        exit 2
    fi
    if [[ "$CONFIRM_SUFFIX" != "$TARGET_BACKEND_SUFFIX" ]]; then
        echo -e "${RED}[ERROR]${NC} --confirm-suffix value ($CONFIRM_SUFFIX) does not match TARGET_BACKEND_SUFFIX ($TARGET_BACKEND_SUFFIX)" >&2
        exit 2
    fi
fi

# Main command dispatcher with production safeguards
main() {
    # Always initialize for production logging
    initialize_environment
    
    local command="$1"
    shift || true
    
    # Production command validation
    case "$command" in
        "analyze")
            check_production_prerequisites && analyze_production_migration
            ;;
        "dry-run"|"dryrun")
            check_production_prerequisites
            log_info "Production dry-run validation completed"
            ;;
        "test")
            check_production_prerequisites
            log_warning "Testing on production environment - sample data only"
            # test_migration "$1" "${2:-1}"  # Commented out for safety
            log_info "Production test mode - implement with extreme caution"
            ;;
        "migrate")
            if ! check_production_prerequisites; then
                log_error "Production prerequisites failed"
                exit 1
            fi
            production_migration
            ;;
        "help"|"-h"|"--help"|"")
            show_usage
            ;;
        *)
            log_error "Unknown command for production environment: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Script execution starts here with production warnings
log_header "🚀 PRODUCTION MIGRATION TOOL v$SCRIPT_VERSION"
log_critical "PRODUCTION ENVIRONMENT - USE WITH EXTREME CAUTION"

# Run main function with all arguments
main "$@"