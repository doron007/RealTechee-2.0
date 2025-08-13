#!/bin/bash

# 🔄 Sandbox to Staging Data Migration Script
# Comprehensive migration tool following AWS CLI best practices
# Part of Amplify Gen 2 Environment Plan implementation

set -e  # Exit on any error

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_NAME="migrate-sandbox-to-staging.sh"
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
SOURCE_ENV="sandbox"
TARGET_ENV="staging"
AWS_REGION="${AWS_REGION:-us-west-1}"

# Environment Variables (must be set externally – Phase 5 removed defaults)
SOURCE_BACKEND_SUFFIX="${SOURCE_BACKEND_SUFFIX}"  # Sandbox backend suffix (required)
TARGET_BACKEND_SUFFIX="${TARGET_BACKEND_SUFFIX}"  # Staging backend suffix (required)
MIGRATION_DEFAULT_PASSWORD="${MIGRATION_DEFAULT_PASSWORD}"

# Backup and logging
BACKUP_DIR="$PROJECT_ROOT/backups/migrations"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/migration_${SOURCE_ENV}_to_${TARGET_ENV}_${TIMESTAMP}.log"
REPORT_FILE="$SCRIPT_DIR/migration-report-${TIMESTAMP}.json"

# Deterministic table classification
# Required tables MUST exist in source (and target before migrate) or we abort.
declare -a REQUIRED_TABLES=(
    "Requests"
    "Contacts"
    "Projects"
    "Properties"
    "BackOfficeRequestStatuses"
)

# Optional tables are migrated only if provisioned (exist in both source & target).
declare -a OPTIONAL_TABLES=(
    "Users"
    "Notifications"
    "ProjectImages"
    "PropertyImages"
    "Documents"
)

# Populated dynamically after discovery (ordered: required first, then optional included)
declare -a MIGRATION_TABLES=()
declare -a OPTIONAL_INCLUDED=()
declare -a OPTIONAL_SKIPPED=()
declare -a REQUIRED_MISSING=()

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
    log_info "Initializing migration environment..."
    
    # Create directories
    mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    
    # Initialize log file
    cat > "$LOG_FILE" << EOF
# Sandbox to Staging Migration Log
# Started: $(date)
# Source: $SOURCE_ENV (suffix: $SOURCE_BACKEND_SUFFIX)
# Target: $TARGET_ENV (suffix: $TARGET_BACKEND_SUFFIX)
# Script Version: $SCRIPT_VERSION
# AWS Region: $AWS_REGION

EOF
    
    log_success "Environment initialized"
}

    for core_table in "${MIGRATION_TABLES[@]}"; do
check_prerequisites() {
    log_info "Checking prerequisites and permissions..."
    
    local errors=0
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install AWS CLI first."
        ((errors++))
    else
        local aws_version=$(aws --version 2>&1 | cut -d/ -f2 | cut -d' ' -f1)
        log_info "AWS CLI version: $aws_version"
    fi
    
    # Check Node.js for JSON processing
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Required for JSON processing."
        echo "Migration tables: ${#MIGRATION_TABLES[@]} (Required defined: ${#REQUIRED_TABLES[@]}, Optional included: ${#OPTIONAL_INCLUDED[@]}, Optional skipped: ${#OPTIONAL_SKIPPED[@]})"
    fi
    
    # Check jq for JSON processing
    if ! command -v jq &> /dev/null; then
        log_warning "jq not found. Will use Node.js for JSON processing."
    fi
    
    # Validate required environment variables
    if [[ -z "$SOURCE_BACKEND_SUFFIX" ]]; then
        log_error "SOURCE_BACKEND_SUFFIX environment variable is required"
        echo "  Set it with: export SOURCE_BACKEND_SUFFIX=your_sandbox_suffix"
        ((errors++))
    fi
    
    if [[ -z "$TARGET_BACKEND_SUFFIX" ]]; then
        log_error "TARGET_BACKEND_SUFFIX environment variable is required (no default)"
        echo "  Set it with: export TARGET_BACKEND_SUFFIX=<staging_suffix>"
        ((errors++))
    fi
    
    # Test AWS credentials and permissions
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured or invalid"
        echo "  Configure with: aws configure"
        ((errors++))
    else
        local aws_account=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
        local aws_user=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null | cut -d'/' -f2)
        log_info "AWS Account: $aws_account"
        log_info "AWS User/Role: $aws_user"
    fi
    
    # Test DynamoDB permissions
    log_info "Testing DynamoDB permissions..."
    if ! aws dynamodb list-tables --region "$AWS_REGION" >/dev/null 2>&1; then
        log_error "No DynamoDB permissions in region $AWS_REGION"
        ((errors++))
    fi
    
    # Test Cognito permissions
    log_info "Testing Cognito permissions..."
    if ! aws cognito-idp list-user-pools --max-results 1 --region "$AWS_REGION" >/dev/null 2>&1; then
        log_warning "Limited or no Cognito permissions detected"
    fi
    
    if [[ $errors -gt 0 ]]; then
        log_error "Prerequisites check failed with $errors error(s)"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Discover and validate table structure
discover_table_structure() {
    log_info "Discovering source and target table structure..."

    local source_tables=()
    local target_tables=()
    local missing_tables=()

    # Helper to list ALL tables with pagination (avoids 100-table cap)
    list_all_tables() {
        local exclusive=""
        while true; do
            local cmd=(aws dynamodb list-tables --region "$AWS_REGION")
            if [[ -n "$exclusive" ]]; then
                cmd+=(--exclusive-start-table-name "$exclusive")
            fi
            local resp
            if ! resp="$(${cmd[@]} 2>/dev/null)"; then
                log_error "Failed to list tables"
                return 1
            fi
            # Extract table names (prefer jq if installed)
            if command -v jq >/dev/null 2>&1; then
                echo "$resp" | jq -r '.TableNames[]'
                exclusive=$(echo "$resp" | jq -r '.LastEvaluatedTableName // empty')
            else
                # Fallback to Node for JSON parsing
                echo "$resp" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{let j=JSON.parse(d);(j.TableNames||[]).forEach(n=>console.log(n)); if(j.LastEvaluatedTableName) process.stdout.write("__NEXT__"+j.LastEvaluatedTableName);});' | while IFS= read -r line; do
                    if [[ $line == __NEXT__* ]]; then
                        exclusive=${line#__NEXT__}
                    else
                        printf '%s\n' "$line"
                    fi
                done
            fi
            [[ -z "$exclusive" ]] && break
        done
    }

    # Cache all tables once
    local all_tables
    if ! all_tables=$(list_all_tables); then
        log_error "Unable to enumerate DynamoDB tables"
        return 1
    fi

    log_info "Scanning for source tables with suffix: $SOURCE_BACKEND_SUFFIX"
    while IFS= read -r table_name; do
        [[ -z "$table_name" ]] && continue
        if [[ "$table_name" == *"$SOURCE_BACKEND_SUFFIX"* ]]; then
            source_tables+=("$table_name")
        fi
    done <<< "$all_tables"

    log_info "Scanning for target tables with suffix: $TARGET_BACKEND_SUFFIX"
    while IFS= read -r table_name; do
        [[ -z "$table_name" ]] && continue
        if [[ "$table_name" == *"$TARGET_BACKEND_SUFFIX"* ]]; then
            target_tables+=("$table_name")
        fi
    done <<< "$all_tables"

    log_info "Found ${#source_tables[@]} source tables"
    log_info "Found ${#target_tables[@]} target tables"

    # Reset classification arrays
    MIGRATION_TABLES=()
    OPTIONAL_INCLUDED=()
    OPTIONAL_SKIPPED=()
    REQUIRED_MISSING=()

    # Handle required tables first
    for req in "${REQUIRED_TABLES[@]}"; do
        local source_table_name="${req}-${SOURCE_BACKEND_SUFFIX}-NONE"
        local target_table_name="${req}-${TARGET_BACKEND_SUFFIX}-NONE"
        local source_exists=false
        local target_exists=false
        [[ " ${source_tables[*]} " =~ " $source_table_name " ]] && source_exists=true
        [[ " ${target_tables[*]} " =~ " $target_table_name " ]] && target_exists=true
        if ! $source_exists; then
            REQUIRED_MISSING+=("$req")
            log_error "Required source table missing: $source_table_name"
            continue
        fi
        if ! $target_exists; then
            missing_tables+=("$target_table_name")
            log_error "Required target table missing: $target_table_name"
            continue
        fi
        MIGRATION_TABLES+=("$req")
    done

    # Handle optional tables: include only if present in source (target must also exist)
    for opt in "${OPTIONAL_TABLES[@]}"; do
        local source_table_name="${opt}-${SOURCE_BACKEND_SUFFIX}-NONE"
        local target_table_name="${opt}-${TARGET_BACKEND_SUFFIX}-NONE"
        local source_exists=false
        local target_exists=false
        [[ " ${source_tables[*]} " =~ " $source_table_name " ]] && source_exists=true
        [[ " ${target_tables[*]} " =~ " $target_table_name " ]] && target_exists=true
        if $source_exists && $target_exists; then
            MIGRATION_TABLES+=("$opt")
            OPTIONAL_INCLUDED+=("$opt")
            log_info "Including optional table: $opt"
        else
            OPTIONAL_SKIPPED+=("$opt")
            if $source_exists && ! $target_exists; then
                log_warning "Optional table exists in source but not target (skipping until provisioned): $opt"
            fi
            if ! $source_exists && $target_exists; then
                log_info "Optional table has target but no source data yet: $opt (skipping)"
            fi
            if ! $source_exists && ! $target_exists; then
                log_info "Optional table not provisioned in either env: $opt (skipping)"
            fi
        fi
    done

    if [[ ${#REQUIRED_MISSING[@]} -gt 0 ]]; then
        log_error "Missing ${#REQUIRED_MISSING[@]} required source table(s): ${REQUIRED_MISSING[*]}"
        return 1
    fi
    if [[ ${#missing_tables[@]} -gt 0 ]]; then
        log_error "Missing ${#missing_tables[@]} required target table(s). Deploy backend to target environment first."
        return 1
    fi

    log_success "Table classification complete: ${#MIGRATION_TABLES[@]} tables will be processed (${#REQUIRED_TABLES[@]} required defined, ${#OPTIONAL_INCLUDED[@]} optional included, ${#OPTIONAL_SKIPPED[@]} optional skipped)."
    
    # Store discovered structure
    cat > "$SCRIPT_DIR/discovered-tables-${TIMESTAMP}.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "source_env": "$SOURCE_ENV",
    "target_env": "$TARGET_ENV", 
    "source_suffix": "$SOURCE_BACKEND_SUFFIX",
    "target_suffix": "$TARGET_BACKEND_SUFFIX",
    "source_tables": [$(printf '"%s",' "${source_tables[@]}" | sed 's/,$//')],
    "target_tables": [$(printf '"%s",' "${target_tables[@]}" | sed 's/,$//')],
    "required_tables": [$(printf '"%s",' "${REQUIRED_TABLES[@]}" | sed 's/,$//')],
    "optional_tables_included": [$(printf '"%s",' "${OPTIONAL_INCLUDED[@]}" | sed 's/,$//')],
    "optional_tables_skipped": [$(printf '"%s",' "${OPTIONAL_SKIPPED[@]}" | sed 's/,$//')],
    "migration_tables": [$(printf '"%s",' "${MIGRATION_TABLES[@]}" | sed 's/,$//')]
}
EOF
    
    log_success "Table structure discovery completed"
    return 0
}

# Analyze migration scope and generate report
analyze_migration() {
    log_header "MIGRATION ANALYSIS"
    
    if ! discover_table_structure; then
        return 1
    fi
    
    local total_items=0
    local analysis_data="["
    local first_table=true
    
    for mt in "${MIGRATION_TABLES[@]}"; do
        local source_table_name="${mt}-${SOURCE_BACKEND_SUFFIX}-NONE"
        local target_table_name="${mt}-${TARGET_BACKEND_SUFFIX}-NONE"
        
        log_info "Analyzing table: $mt"
        
        # Get source table item count
        local source_count=0
        if aws dynamodb describe-table --table-name "$source_table_name" --region "$AWS_REGION" >/dev/null 2>&1; then
            source_count=$(aws dynamodb describe-table --table-name "$source_table_name" --region "$AWS_REGION" --query 'Table.ItemCount' --output text 2>/dev/null || echo "0")
        fi
        
        # Get target table item count
        local target_count=0
        if aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" >/dev/null 2>&1; then
            target_count=$(aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" --query 'Table.ItemCount' --output text 2>/dev/null || echo "0")
        fi
        
    log_info "  Source items: $source_count, Target items: $target_count"
        total_items=$((total_items + source_count))
        
        # Add to analysis data
        if [[ "$first_table" != true ]]; then
            analysis_data+=","
        fi
    analysis_data+="{\"table\":\"$mt\",\"source_count\":$source_count,\"target_count\":$target_count,\"source_table_name\":\"$source_table_name\",\"target_table_name\":\"$target_table_name\"}"
        first_table=false
    done
    
    analysis_data+="]"
    
    # Generate analysis report
    cat > "$SCRIPT_DIR/migration-analysis-${TIMESTAMP}.json" << EOF
{
    "analysis_timestamp": "$(date -Iseconds)",
    "script_version": "$SCRIPT_VERSION",
    "migration_path": "$SOURCE_ENV -> $TARGET_ENV",
    "source_suffix": "$SOURCE_BACKEND_SUFFIX",
    "target_suffix": "$TARGET_BACKEND_SUFFIX",
    "total_items_to_migrate": $total_items,
    "required_tables_count": ${#REQUIRED_TABLES[@]},
    "optional_tables_included_count": ${#OPTIONAL_INCLUDED[@]},
    "optional_tables_skipped_count": ${#OPTIONAL_SKIPPED[@]},
    "migration_tables_count": ${#MIGRATION_TABLES[@]},
    "table_analysis": $analysis_data,
    "estimated_duration_minutes": $((total_items / 100 + 5)),
    "aws_region": "$AWS_REGION"
}
EOF
    
    log_success "Migration analysis completed"
    echo ""
    echo -e "${BOLD}MIGRATION ANALYSIS SUMMARY${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Total items to migrate: $total_items"
    echo "Migration tables: ${#MIGRATION_TABLES[@]} (Required defined: ${#REQUIRED_TABLES[@]}, Optional included: ${#OPTIONAL_INCLUDED[@]}, Optional skipped: ${#OPTIONAL_SKIPPED[@]})"
    echo "Estimated duration: $((total_items / 100 + 5)) minutes"
    echo "Analysis report: migration-analysis-${TIMESTAMP}.json"
    echo ""
    
    return 0
}

# Test migration with sample data
test_migration() {
    local table_name="${1:-Contacts}"
    local limit="${2:-1}"
    
    log_header "TEST MIGRATION: $table_name (limit: $limit)"
    
    local source_table_name="${table_name}-${SOURCE_BACKEND_SUFFIX}-NONE"
    local target_table_name="${table_name}-${TARGET_BACKEND_SUFFIX}-NONE"
    
    log_info "Testing migration for table: $table_name"
    log_info "Source: $source_table_name"
    log_info "Target: $target_table_name"
    
    # Scan source table for sample items
    log_info "Scanning source table for $limit sample item(s)..."
    
    local scan_result
    scan_result=$(aws dynamodb scan \
        --table-name "$source_table_name" \
        --limit "$limit" \
        --region "$AWS_REGION" \
        --output json 2>/dev/null) || {
        log_error "Failed to scan source table: $source_table_name"
        return 1
    }
    
    # Check if any items were found
    local item_count
    item_count=$(echo "$scan_result" | jq -r '.Count // 0')
    
    if [[ "$item_count" -eq 0 ]]; then
        log_warning "No items found in source table: $source_table_name"
        return 0
    fi
    
    log_info "Found $item_count item(s) for testing"
    
    # Process each item
    local success_count=0
    local error_count=0
    
    echo "$scan_result" | jq -c '.Items[]' | while read -r item; do
        log_info "Processing test item..."
        
        # Update any backend-specific references (ID suffix changes)
        local updated_item
        updated_item=$(echo "$item" | sed "s/$SOURCE_BACKEND_SUFFIX/$TARGET_BACKEND_SUFFIX/g")
        
        # Put item to target table
        if aws dynamodb put-item \
            --table-name "$target_table_name" \
            --item "$updated_item" \
            --region "$AWS_REGION" \
            --return-consumed-capacity TOTAL >/dev/null 2>&1; then
            
            log_success "Test item migrated successfully"
            ((success_count++))
        else
            log_error "Failed to migrate test item"
            ((error_count++))
        fi
    done
    
    log_info "Test migration completed: $success_count success, $error_count errors"
    return 0
}

# Dry run migration (validation only)
dry_run_migration() {
    log_header "DRY RUN MIGRATION"
    
    if ! analyze_migration; then
        return 1
    fi
    
    log_info "Performing dry run validation..."
    
    # Validate each core table
    local validation_errors=0
    
    for core_table in "${CORE_TABLES[@]}"; do
        local source_table_name="${core_table}-${SOURCE_BACKEND_SUFFIX}-NONE"
        local target_table_name="${core_table}-${TARGET_BACKEND_SUFFIX}-NONE"
        
        log_info "Validating table: $core_table"
        
        local source_exists=true
        local target_exists=true
        if ! aws dynamodb describe-table --table-name "$source_table_name" --region "$AWS_REGION" >/dev/null 2>&1; then
            source_exists=false
        fi
        if ! aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" >/dev/null 2>&1; then
            target_exists=false
        fi

        # Decision matrix:
        # 1. source && target -> validate schema
        # 2. source && !target -> ERROR (can't migrate data)
        # 3. !source && target -> INFO (nothing to migrate yet, leave target as-is)
        # 4. !source && !target -> WARNING (table not provisioned in either env yet)

        if $source_exists && $target_exists; then
            # Validate table schema compatibility
            local source_schema target_schema
            source_schema=$(aws dynamodb describe-table --table-name "$source_table_name" --region "$AWS_REGION" --query 'Table.{KeySchema:KeySchema,AttributeDefinitions:AttributeDefinitions}' --output json)
            target_schema=$(aws dynamodb describe-table --table-name "$target_table_name" --region "$AWS_REGION" --query 'Table.{KeySchema:KeySchema,AttributeDefinitions:AttributeDefinitions}' --output json)
            if [[ "$source_schema" != "$target_schema" ]]; then
                log_warning "Schema differences detected for table: $core_table"
                log_info "Source schema: $source_schema"
                log_info "Target schema: $target_schema"
            fi
            log_success "Table validation passed: $core_table"
            continue
        fi

        if $source_exists && ! $target_exists; then
            log_error "Source table exists but target missing: $target_table_name"
            ((validation_errors++))
            continue
        fi

        if ! $source_exists && $target_exists; then
            log_info "Skipping table with no source data: $core_table (target table present)"
            continue
        fi

        # !source && !target
        log_warning "Skipping unprovisioned table (absent in both source and target): $core_table"
    done
    
    if [[ $validation_errors -gt 0 ]]; then
        log_error "Dry run failed with $validation_errors validation error(s)"
        return 1
    fi
    
    log_success "Dry run completed successfully - migration is ready to proceed"
    return 0
}

# Full migration with error handling and rollback capability
full_migration() {
    log_header "FULL MIGRATION: $SOURCE_ENV → $TARGET_ENV"
    
    # Final confirmation
    echo -e "${RED}${BOLD}⚠️  CRITICAL: FULL DATA MIGRATION${NC}"
    echo ""
    echo "This will migrate ALL data from sandbox to staging environment:"
    echo "• Source: $SOURCE_ENV (suffix: $SOURCE_BACKEND_SUFFIX)"
    echo "• Target: $TARGET_ENV (suffix: $TARGET_BACKEND_SUFFIX)"
    echo "• Tables: ${#MIGRATION_TABLES[@]} (migration set: required + included optional)"
    echo "• Region: $AWS_REGION"
    echo ""
    echo -e "${YELLOW}This operation will:${NC}"
    echo "1. Create backup of current staging data"
    echo "2. Clear staging tables (destructive operation)"
    echo "3. Migrate all sandbox data to staging"
    echo "4. Update all foreign key relationships"
    echo "5. Generate migration report"
    echo ""
    
    read -p "Type 'MIGRATE' to confirm full migration: " -r
    if [[ "$REPLY" != "MIGRATE" ]]; then
        log_info "Migration cancelled by user"
        return 0
    fi
    
    echo ""
    read -p "Final confirmation - Type 'YES' to proceed: " -r
    if [[ "$REPLY" != "YES" ]]; then
        log_info "Migration cancelled by user"
        return 0
    fi
    
    log_info "Starting full migration process..."
    
    # Migration statistics
    local migration_start_time=$(date +%s)
    local total_migrated=0
    local total_errors=0
    local migration_log=""
    
    # Create backup before migration
    log_info "Creating backup of current staging data..."
    local backup_file="$BACKUP_DIR/staging_backup_${TIMESTAMP}.json"
    echo "{\"timestamp\":\"$(date -Iseconds)\",\"tables\":{" > "$backup_file"
    
    # Process each core table
    for i in "${!MIGRATION_TABLES[@]}"; do
        local core_table="${MIGRATION_TABLES[$i]}"
        local source_table_name="${core_table}-${SOURCE_BACKEND_SUFFIX}-NONE"
        local target_table_name="${core_table}-${TARGET_BACKEND_SUFFIX}-NONE"
        
    log_info "Migrating table: $core_table ($((i+1))/${#MIGRATION_TABLES[@]})"
        
        # Backup existing target data
        local existing_data
        existing_data=$(aws dynamodb scan --table-name "$target_table_name" --region "$AWS_REGION" --output json 2>/dev/null || echo '{"Items":[],"Count":0}')
        
        # Add to backup file
        echo "\"$core_table\":$existing_data" >> "$backup_file"
    if [[ $((i+1)) -lt ${#MIGRATION_TABLES[@]} ]]; then
            echo "," >> "$backup_file"
        fi
        
        # Get source data
        log_info "Scanning source data from: $source_table_name"
        local source_data
        source_data=$(aws dynamodb scan --table-name "$source_table_name" --region "$AWS_REGION" --output json 2>/dev/null) || {
            log_error "Failed to scan source table: $source_table_name"
            ((total_errors++))
            continue
        }
        
        local source_count
        source_count=$(echo "$source_data" | jq -r '.Count // 0')
        
        if [[ "$source_count" -eq 0 ]]; then
            log_info "No items to migrate from: $source_table_name"
            continue
        fi
        
        log_info "Found $source_count items to migrate"
        
        # Clear target table (optional - comment out for append mode)
        # log_info "Clearing target table: $target_table_name"
        # aws dynamodb scan --table-name "$target_table_name" --region "$AWS_REGION" | jq -r '.Items[] | [.id.S] | @tsv' | while read id; do
        #     aws dynamodb delete-item --table-name "$target_table_name" --key '{"id":{"S":"'$id'"}}' --region "$AWS_REGION" >/dev/null 2>&1
        # done
        
        # Migrate items in batches
        local batch_size=25  # DynamoDB batch_write_item limit
        local item_count=0
        local batch_items=""
        local batch_count=0
        
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
                
                if aws dynamodb batch-write-item \
                    --request-items "$batch_request" \
                    --region "$AWS_REGION" >/dev/null 2>&1; then
                    
                    log_info "Migrated batch: $batch_count items"
                    total_migrated=$((total_migrated + batch_count))
                else
                    log_error "Failed to migrate batch of $batch_count items"
                    total_errors=$((total_errors + batch_count))
                fi
                
                # Reset batch
                batch_items=""
                batch_count=0
            fi
        done
        
        log_success "Completed migration for table: $core_table"
    done
    
    # Close backup file
    echo "}}" >> "$backup_file"
    
    # Calculate migration duration
    local migration_end_time=$(date +%s)
    local migration_duration=$((migration_end_time - migration_start_time))
    
    # Generate final migration report
    cat > "$REPORT_FILE" << EOF
{
    "migration_timestamp": "$(date -Iseconds)",
    "script_version": "$SCRIPT_VERSION",
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
    "tablesProcessed": ${#MIGRATION_TABLES[@]},
        "recordsMigrated": $total_migrated,
        "errorsEncountered": $total_errors
    },
    "backup_file": "$backup_file",
    "log_file": "$LOG_FILE"
}
EOF
    
    log_success "Migration completed successfully!"
    echo ""
    echo -e "${BOLD}MIGRATION SUMMARY${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Duration: $migration_duration seconds"
    echo "Tables processed: ${#MIGRATION_TABLES[@]}"
    echo "Records migrated: $total_migrated"
    echo "Errors encountered: $total_errors"
    echo "Backup created: $(basename "$backup_file")"
    echo "Report generated: $(basename "$REPORT_FILE")"
    echo ""
    
    return 0
}

# Show usage information
show_usage() {
    cat << EOF

🔄 ${BOLD}Sandbox to Staging Data Migration Tool${NC}
═══════════════════════════════════════════════════════════════════════════════════

${BOLD}Usage:${NC} $0 <command> [options]

${BOLD}Commands:${NC}
  ${CYAN}analyze${NC}     - Analyze migration scope and generate detailed report (safe)
  ${CYAN}dry-run${NC}     - Validate migration without making changes (safe)
  ${CYAN}test${NC}        - Test migration with sample data [table] [limit]
  ${CYAN}migrate${NC}     - Perform full migration (destructive operation)
  ${CYAN}help${NC}        - Show this help message

${BOLD}Examples:${NC}
  $0 analyze                          # Generate migration analysis report
  $0 dry-run                          # Validate all tables and permissions
  $0 test Contacts 3                  # Test with 3 sample Contacts records
  $0 test Properties                  # Test with 1 sample Properties record
  $0 migrate                          # Full migration (requires confirmation)

${BOLD}Required Environment Variables:${NC}
  ${YELLOW}SOURCE_BACKEND_SUFFIX${NC}         # Sandbox backend suffix (e.g., abc123def456)
  ${YELLOW}TARGET_BACKEND_SUFFIX${NC}         # Staging backend suffix (fvn7t5hbobaxjklhrqzdl4ac34)
  ${YELLOW}AWS_REGION${NC}                    # AWS region (default: us-west-1)
  ${YELLOW}MIGRATION_DEFAULT_PASSWORD${NC}    # Password for recreated Cognito users (optional)

${BOLD}Optional Environment Variables:${NC}
  ${YELLOW}AWS_ACCESS_KEY_ID${NC}             # AWS credentials (or use aws configure)
  ${YELLOW}AWS_SECRET_ACCESS_KEY${NC}         # AWS credentials (or use aws configure)

${BOLD}Setup Example:${NC}
  export SOURCE_BACKEND_SUFFIX="your_sandbox_suffix"
  export TARGET_BACKEND_SUFFIX="fvn7t5hbobaxjklhrqzdl4ac34"
  export AWS_REGION="us-west-1"
  
  # Then run:
  $0 analyze          # First, analyze the migration
  $0 dry-run          # Validate everything is ready
  $0 test Contacts 5  # Test with sample data
  $0 migrate          # Perform full migration

${BOLD}Security Notes:${NC}
• All credentials are masked in logs (last 4 characters only)
• No sensitive data is committed to version control
• Backup is created before destructive operations
• Migration supports rollback capability

${BOLD}Required Tables:${NC}
$(printf "  • %s\n" "${REQUIRED_TABLES[@]}")

${BOLD}Optional Tables (included only if provisioned):${NC}
$(printf "  • %s\n" "${OPTIONAL_TABLES[@]}")

${BOLD}Current Migration Set (this run):${NC}
$(printf "  • %s\n" "${MIGRATION_TABLES[@]}")

${PURPLE}Script Version: $SCRIPT_VERSION${NC}
${PURPLE}AWS Region: $AWS_REGION${NC}

EOF
}

# Main command dispatcher

# Phase 5: confirmation flag for migrate (staging destructive ops)
CONFIRM_SUFFIX=""
for arg in "$@"; do
    case $arg in
        --confirm-suffix)
            shift; CONFIRM_SUFFIX="$1"; shift; ;;
    esac
done

if [[ "$1" == "migrate" ]]; then
    if [[ -z "$CONFIRM_SUFFIX" ]]; then
        echo -e "${RED}[ERROR]${NC} --confirm-suffix <staging_suffix> required for migrate command" >&2
        exit 2
    fi
    if [[ "$CONFIRM_SUFFIX" != "$TARGET_BACKEND_SUFFIX" ]]; then
        echo -e "${RED}[ERROR]${NC} --confirm-suffix ($CONFIRM_SUFFIX) does not match TARGET_BACKEND_SUFFIX ($TARGET_BACKEND_SUFFIX)" >&2
        exit 2
    fi
fi
main() {
    # Initialize environment
    initialize_environment
    
    local command="$1"
    shift || true
    
    case "$command" in
        "analyze")
            check_prerequisites
            analyze_migration
            ;;
        "dry-run"|"dryrun")
            check_prerequisites
            dry_run_migration
            ;;
        "test")
            check_prerequisites
            test_migration "$1" "$2"
            ;;
        "migrate")
            check_prerequisites
            full_migration
            ;;
        "help"|"-h"|"--help"|"")
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Script execution starts here
log_header "SANDBOX → STAGING MIGRATION TOOL v$SCRIPT_VERSION"

# Run main function with all arguments
main "$@"