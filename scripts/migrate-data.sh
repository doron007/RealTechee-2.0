#!/bin/bash

# 🚀 Data Migration Wrapper Scripts
# Easy-to-use scripts for data migration between environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_ENGINE="$SCRIPT_DIR/data-migration-engine.js"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Load AWS credentials from CLI config
    if [[ -f "$SCRIPT_DIR/../aws-credentials.sh" ]]; then
        log_info "Loading AWS credentials from CLI configuration..."
        source "$SCRIPT_DIR/../aws-credentials.sh"
    elif [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
        log_error "AWS credentials not found."
        echo "Option 1: Use existing AWS CLI config (recommended):"
        echo "  aws configure"
        echo ""
        echo "Option 2: Set environment variables:"
        echo "  export AWS_ACCESS_KEY_ID=your_access_key_id"
        echo "  export AWS_SECRET_ACCESS_KEY=your_secret_access_key"
        exit 1
    fi
    
    # Check migration engine exists
    if [[ ! -f "$MIGRATION_ENGINE" ]]; then
        log_error "Migration engine not found: $MIGRATION_ENGINE"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Show usage
show_usage() {
    echo "🚀 Data Migration Tool"
    echo "===================="
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  analyze     - Analyze source data and generate migration plan (dry run)"
    echo "  test        - Test migration with single record from specified table"
    echo "  migrate     - Perform full migration (requires confirmation)"
    echo "  status      - Check current migration status"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 analyze                    # Analyze what would be migrated"
    echo "  $0 test Contacts              # Test with single Contacts record"
    echo "  $0 migrate                    # Full migration (with confirmation)"
    echo "  $0 status                     # Check migration status"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_ACCESS_KEY_ID             # Required: AWS Access Key"
    echo "  AWS_SECRET_ACCESS_KEY         # Required: AWS Secret Key"
    echo "  AWS_REGION                    # Optional: AWS Region (default: us-west-1)"
    echo ""
}

# Analyze command - dry run
cmd_analyze() {
    log_info "Starting migration analysis (dry run)..."
    echo "This will analyze the source data and show what would be migrated"
    echo "without making any changes to the production environment."
    echo ""
    
    read -p "Continue with analysis? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Analysis cancelled"
        exit 0
    fi
    
    log_info "Running migration analysis..."
    node "$MIGRATION_ENGINE" --mode=dry-run
    
    log_success "Analysis completed! Check the generated analysis file for details."
}

# Test command - single record test
cmd_test() {
    local table="$1"
    
    if [[ -z "$table" ]]; then
        log_error "Table name required for test command"
        echo "Usage: $0 test <table_name>"
        echo "Example: $0 test Contacts"
        exit 1
    fi
    
    log_info "Starting test migration for table: $table"
    echo "This will migrate a single record from $table to test the process."
    echo ""
    
    read -p "Continue with test migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Test migration cancelled"
        exit 0
    fi
    
    log_info "Running test migration..."
    node "$MIGRATION_ENGINE" --mode=test --table="$table" --limit=1
    
    log_success "Test migration completed!"
}

# Migration command - full migration
cmd_migrate() {
    log_warning "⚠️  FULL DATA MIGRATION"
    echo "========================================"
    echo ""
    echo "This will migrate ALL data from the development/staging environment"
    echo "to the production environment. This is a significant operation that:"
    echo ""
    echo "• Migrates thousands of records across 26+ tables"
    echo "• Preserves all relationships and foreign keys" 
    echo "• Takes 10-30 minutes to complete"
    echo "• Includes automatic rollback on failure"
    echo ""
    echo "Source Environment: ${SOURCE_BACKEND_SUFFIX:?SOURCE_BACKEND_SUFFIX required} (dev/staging)"
    echo "Target Environment: ${TARGET_BACKEND_SUFFIX:?TARGET_BACKEND_SUFFIX required} (production)"
    echo ""
    
    # Phase5: explicit suffix confirmation
    if [[ "$CONFIRM_SUFFIX" != "$TARGET_BACKEND_SUFFIX" ]]; then
        log_error "--confirm-suffix $CONFIRM_SUFFIX must match TARGET_BACKEND_SUFFIX $TARGET_BACKEND_SUFFIX"
        exit 2
    fi
    read -p "Type 'FULLMIGRATE' to confirm full migration: " -r
    echo
    if [[ "$REPLY" != "FULLMIGRATE" ]]; then
        log_info "Migration cancelled"
        exit 0
    fi
    
    log_info "Starting full migration..."
    log_info "Migration progress will be shown below. Please do not interrupt."
    echo ""
    
    # Run the migration
    node "$MIGRATION_ENGINE" --mode=full --confirm=true
    
    log_success "🎉 Full migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify the migration using: $0 status"
    echo "2. Test the production application functionality"
    echo "3. Monitor for any issues in the first 24 hours"
}

# Status command - check migration status
cmd_status() {
    log_info "Checking migration status..."
    
    # Look for recent migration reports
    local reports_found=0
    for report in "$SCRIPT_DIR"/migration-report-*.json; do
        if [[ -f "$report" ]]; then
            echo ""
            echo "Recent migration report: $(basename "$report")"
            
            # Extract key stats from the report
            local stats=$(cat "$report" | node -p "
                const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
                const duration = Math.round(data.migration?.durationSeconds || 0);
                const tables = data.statistics?.tablesProcessed || 0;
                const records = data.statistics?.recordsMigrated || 0;
                const errors = data.statistics?.errorsEncountered || 0;
                console.log('  Duration: ' + duration + ' seconds');
                console.log('  Tables: ' + tables);
                console.log('  Records: ' + records);
                console.log('  Errors: ' + errors);
                ''
            " 2>/dev/null || echo "  (Could not parse report)")
            
            reports_found=1
            break
        fi
    done
    
    if [[ $reports_found -eq 0 ]]; then
        echo "No migration reports found."
        echo "Run '$0 analyze' to start with a migration analysis."
    fi
    
    # Check for analysis files
    for analysis in "$SCRIPT_DIR"/migration-analysis-*.json; do
        if [[ -f "$analysis" ]]; then
            echo ""
            echo "Recent analysis: $(basename "$analysis")"
            break
        fi
    done
    
    log_success "Status check completed"
}

# Main command dispatcher
CONFIRM_SUFFIX=""
args=()
while [[ $# -gt 0 ]]; do
    case $1 in
        --confirm-suffix)
            shift; CONFIRM_SUFFIX="$1"; shift;;
        *) args+=("$1"); shift;;
    esac
done
set -- "${args[@]}"

main() {
    # Check prerequisites first
    check_prerequisites
    
    local command="$1"
    shift || true
    
    case "$command" in
        "analyze"|"analyse")
            cmd_analyze "$@"
            ;;
        "test")
            cmd_test "$@"
            ;;
        "migrate")
            cmd_migrate "$@"
            ;;
        "status")
            cmd_status "$@"
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

# Run main function with all arguments
main "$@"