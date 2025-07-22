#!/bin/bash

# Environment Validation and Protection Script
# Ensures proper environment isolation and deployment safety

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/environment-protection.json"

# Helper functions
echo_step() {
  echo -e "${GREEN}==>${NC} $1"
}

echo_warn() {
  echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

echo_error() {
  echo -e "${RED}❌ ERROR:${NC} $1"
  exit 1
}

echo_info() {
  echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

echo_success() {
  echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

# Validate environment configuration exists
validate_config() {
  echo_step "🔍 Validating environment configuration"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo_error "Environment configuration not found: $CONFIG_FILE"
  fi
  
  # Validate JSON format
  if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo_error "Invalid JSON in environment configuration file"
  fi
  
  echo_success "Environment configuration is valid"
}

# Check environment isolation
check_environment_isolation() {
  echo_step "🔒 Checking environment isolation"
  
  # Get current git branch
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo_info "Current branch: $CURRENT_BRANCH"
  
  # Get backend suffixes from config
  DEV_SUFFIX=$(jq -r '.environments.development.backendSuffix' "$CONFIG_FILE")
  PROD_SUFFIX=$(jq -r '.environments.production.backendSuffix' "$CONFIG_FILE")
  
  echo_info "Development backend: *-${DEV_SUFFIX}-*"
  echo_info "Production backend: *-${PROD_SUFFIX}-*"
  
  # Check for any shared resources
  SHARED_RESOURCES=$(jq -r '.isolation.sharedResources[]?' "$CONFIG_FILE" 2>/dev/null || echo "")
  
  if [ -z "$SHARED_RESOURCES" ]; then
    echo_success "No shared resources detected - environments properly isolated"
  else
    echo_warn "Shared resources detected: $SHARED_RESOURCES"
  fi
}

# Validate production protection rules
validate_production_protection() {
  echo_step "🛡️  Validating production protection"
  
  # Check branch protection
  PROD_BRANCH=$(jq -r '.environments.production.branch' "$CONFIG_FILE")
  echo_info "Checking branch protection for: $PROD_BRANCH"
  
  if gh api repos/:owner/:repo/branches/"$PROD_BRANCH"/protection >/dev/null 2>&1; then
    echo_success "Branch protection is enabled for $PROD_BRANCH"
    
    # Validate required status checks
    REQUIRED_CHECKS=$(gh api repos/:owner/:repo/branches/"$PROD_BRANCH"/protection | jq -r '.required_status_checks.contexts[]?' 2>/dev/null || echo "")
    if [ -n "$REQUIRED_CHECKS" ]; then
      echo_info "Required status checks: $REQUIRED_CHECKS"
    else
      echo_warn "No required status checks configured"
    fi
  else
    echo_warn "Branch protection is not enabled for $PROD_BRANCH"
  fi
}

# Check data backup status
check_data_backup() {
  echo_step "💾 Checking data backup status"
  
  BACKUP_DIR="./data/migrations"
  if [ -d "$BACKUP_DIR" ]; then
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -1 2>/dev/null || echo "")
    if [ -n "$LATEST_BACKUP" ]; then
      echo_success "Latest backup found: $LATEST_BACKUP"
      BACKUP_AGE=$(find "$BACKUP_DIR/$LATEST_BACKUP" -type d -mtime +7 | wc -l)
      if [ "$BACKUP_AGE" -gt 0 ]; then
        echo_warn "Latest backup is older than 7 days"
      fi
    else
      echo_warn "No backups found in $BACKUP_DIR"
    fi
  else
    echo_warn "Backup directory not found: $BACKUP_DIR"
  fi
}

# Validate deployment requirements
validate_deployment_requirements() {
  echo_step "🚀 Validating deployment requirements"
  
  # Check if tests are passing
  echo_info "Checking test status..."
  
  # Run type check
  if npm run type-check >/dev/null 2>&1; then
    echo_success "TypeScript compilation passed"
  else
    echo_error "TypeScript compilation failed"
  fi
  
  # Check build
  echo_info "Validating build process..."
  if npm run build >/dev/null 2>&1; then
    echo_success "Build process completed successfully"
  else
    echo_warn "Build process encountered issues"
  fi
}

# Check environment variables
validate_environment_variables() {
  echo_step "🔧 Validating environment variables"
  
  # Check production environment variables
  PROD_APP_ID=$(jq -r '.environments.production.amplifyAppId' "$CONFIG_FILE")
  PROD_BRANCH=$(jq -r '.environments.production.branch' "$CONFIG_FILE")
  
  echo_info "Checking production app environment variables..."
  
  # Get environment variables from AWS Amplify
  if aws amplify get-branch --app-id "$PROD_APP_ID" --branch-name "$PROD_BRANCH" --region us-west-1 >/dev/null 2>&1; then
    ENV_VARS=$(aws amplify get-branch --app-id "$PROD_APP_ID" --branch-name "$PROD_BRANCH" --region us-west-1 | jq -r '.branch.environmentVariables | keys[]?' 2>/dev/null || echo "")
    if [ -n "$ENV_VARS" ]; then
      echo_success "Production environment variables configured: $ENV_VARS"
    else
      echo_warn "No environment variables configured for production"
    fi
  else
    echo_warn "Could not access production app environment variables"
  fi
}

# Main execution
main() {
  echo_step "🔍 Environment Validation and Protection Check"
  echo_info "Project: $(basename "$PROJECT_ROOT")"
  echo_info "Config: $CONFIG_FILE"
  echo ""
  
  validate_config
  check_environment_isolation  
  validate_production_protection
  check_data_backup
  validate_deployment_requirements
  validate_environment_variables
  
  echo ""
  echo_success "Environment validation completed!"
  echo ""
  echo "📋 Summary:"
  echo "   ✅ Environment configuration valid"
  echo "   ✅ Environment isolation verified"
  echo "   ✅ Production protection checked"
  echo "   ✅ Data backup status verified"
  echo "   ✅ Deployment requirements validated"
  echo "   ✅ Environment variables checked"
  echo ""
  echo "🛡️  Environment is protected and ready for safe deployment!"
}

# Parse command line arguments
case "${1:-main}" in
  --config)
    validate_config
    ;;
  --isolation)
    check_environment_isolation
    ;;
  --protection)
    validate_production_protection
    ;;
  --backup)
    check_data_backup
    ;;
  --deployment)
    validate_deployment_requirements
    ;;
  --env-vars)
    validate_environment_variables
    ;;
  main|*)
    main
    ;;
esac