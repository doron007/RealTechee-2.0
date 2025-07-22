#!/bin/bash

# Protected Deployment Script
# Implements environment-specific deployment with safety checks

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
ENVIRONMENT=""
FORCE=false
SKIP_CHECKS=false

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

# Show usage
show_usage() {
  echo "Usage: $0 --environment <dev|prod> [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --environment <env>   Target environment (dev or prod)"
  echo "  --force              Skip safety prompts (not recommended for prod)"
  echo "  --skip-checks        Skip pre-deployment validation checks"
  echo "  --help               Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --environment dev                    # Deploy to development"
  echo "  $0 --environment prod                   # Deploy to production (with checks)"
  echo "  $0 --environment prod --skip-checks     # Deploy to prod (skip validation)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --skip-checks)
      SKIP_CHECKS=true
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo_error "Unknown option: $1"
      ;;
  esac
done

# Validate environment parameter
if [ -z "$ENVIRONMENT" ]; then
  echo_error "Environment must be specified. Use --environment <dev|prod>"
fi

case $ENVIRONMENT in
  dev|development)
    ENVIRONMENT="development"
    ;;
  prod|production)
    ENVIRONMENT="production"
    ;;
  *)
    echo_error "Invalid environment: $ENVIRONMENT. Use 'dev' or 'prod'"
    ;;
esac

# Pre-deployment safety checks
run_safety_checks() {
  echo_step "🔍 Running pre-deployment safety checks"
  
  if [ "$SKIP_CHECKS" = true ]; then
    echo_warn "Skipping safety checks (--skip-checks specified)"
    return
  fi
  
  # Run environment validation
  if [ -f "$SCRIPT_DIR/validate-environment.sh" ]; then
    echo_info "Running environment validation..."
    "$SCRIPT_DIR/validate-environment.sh"
  else
    echo_warn "Environment validation script not found"
  fi
  
  # Check git status
  if [ -n "$(git status --porcelain)" ]; then
    echo_warn "Working directory has uncommitted changes"
    if [ "$FORCE" = false ] && [ "$ENVIRONMENT" = "production" ]; then
      echo_error "Production deployments require a clean working directory"
    fi
  fi
  
  # Production-specific checks
  if [ "$ENVIRONMENT" = "production" ]; then
    echo_info "Running production-specific checks..."
    
    # Check current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    EXPECTED_BRANCH=$(jq -r '.environments.production.branch' "$CONFIG_FILE" 2>/dev/null || echo "prod-v2")
    
    if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
      echo_warn "Current branch ($CURRENT_BRANCH) doesn't match expected production branch ($EXPECTED_BRANCH)"
      if [ "$FORCE" = false ]; then
        echo_error "Production deployments should be from the $EXPECTED_BRANCH branch"
      fi
    fi
    
    # Check for required status checks
    if gh api repos/:owner/:repo/branches/"$EXPECTED_BRANCH"/protection >/dev/null 2>&1; then
      echo_success "Branch protection is enabled"
    else
      echo_warn "Branch protection is not enabled for production branch"
    fi
    
    # Backup before production deployment
    echo_info "Creating backup before production deployment..."
    if [ -f "$SCRIPT_DIR/backup-data.sh" ]; then
      "$SCRIPT_DIR/backup-data.sh"
    else
      echo_warn "Backup script not found - proceeding without backup"
    fi
  fi
}

# Get environment configuration
get_environment_config() {
  echo_step "📋 Loading environment configuration"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo_error "Environment configuration not found: $CONFIG_FILE"
  fi
  
  # Extract environment-specific configuration
  ENV_CONFIG=$(jq ".environments.$ENVIRONMENT" "$CONFIG_FILE")
  
  if [ "$ENV_CONFIG" = "null" ]; then
    echo_error "Configuration not found for environment: $ENVIRONMENT"
  fi
  
  # Extract key values
  APP_ID=$(echo "$ENV_CONFIG" | jq -r '.amplifyAppId // empty')
  BRANCH=$(echo "$ENV_CONFIG" | jq -r '.branch // empty')
  BACKEND_SUFFIX=$(echo "$ENV_CONFIG" | jq -r '.backendSuffix // empty')
  
  echo_info "Target environment: $ENVIRONMENT"
  echo_info "Amplify App ID: $APP_ID"
  echo_info "Target branch: $BRANCH"
  echo_info "Backend suffix: $BACKEND_SUFFIX"
}

# Production deployment confirmation
confirm_production_deployment() {
  if [ "$ENVIRONMENT" = "production" ] && [ "$FORCE" = false ]; then
    echo_step "🚨 Production Deployment Confirmation"
    echo_warn "You are about to deploy to PRODUCTION environment"
    echo_info "This will affect live users and production data"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " -r REPLY
    echo ""
    
    case $REPLY in
      yes|YES|Yes|y|Y)
        echo_info "Proceeding with production deployment..."
        ;;
      *)
        echo_info "Deployment cancelled by user"
        exit 0
        ;;
    esac
  fi
}

# Execute deployment
execute_deployment() {
  echo_step "🚀 Executing deployment to $ENVIRONMENT"
  
  case $ENVIRONMENT in
    development)
      echo_info "Deploying to development environment..."
      
      # Development deployment - use sandbox
      echo_info "Starting Amplify sandbox..."
      npx ampx sandbox --once
      
      echo_info "Building and deploying frontend..."
      npm run build
      ;;
      
    production)
      echo_info "Deploying to production environment..."
      
      # Production deployment - trigger via git push
      if [ "$APP_ID" != "sandbox" ] && [ -n "$BRANCH" ]; then
        echo_info "Triggering production deployment via git push..."
        
        # Ensure we're on the correct branch
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
          echo_info "Switching to production branch: $BRANCH"
          git checkout "$BRANCH"
        fi
        
        # Push to trigger deployment
        git push origin "$BRANCH"
        
        echo_info "Deployment triggered. Monitoring AWS Amplify console..."
        echo_info "App URL: https://$APP_ID.amplifyapp.com"
      else
        echo_error "Production deployment configuration invalid"
      fi
      ;;
  esac
}

# Monitor deployment status
monitor_deployment() {
  if [ "$ENVIRONMENT" = "production" ] && [ -n "$APP_ID" ] && [ -n "$BRANCH" ]; then
    echo_step "📊 Monitoring deployment status"
    
    # Get latest job ID
    JOB_ID=$(aws amplify list-jobs --app-id "$APP_ID" --branch-name "$BRANCH" --region us-west-1 --max-results 1 --query 'jobSummaries[0].jobId' --output text 2>/dev/null || echo "")
    
    if [ -n "$JOB_ID" ] && [ "$JOB_ID" != "None" ]; then
      echo_info "Latest deployment job: $JOB_ID"
      echo_info "Monitor at: https://us-west-1.console.aws.amazon.com/amplify/home?region=us-west-1#/$APP_ID/$BRANCH/$JOB_ID"
    fi
  fi
}

# Post-deployment validation
post_deployment_validation() {
  echo_step "✅ Post-deployment validation"
  
  # Basic health check
  if [ "$ENVIRONMENT" = "production" ] && [ -n "$APP_ID" ]; then
    PROD_URL="https://$APP_ID.amplifyapp.com"
    echo_info "Testing production URL: $PROD_URL"
    
    if curl -f -s "$PROD_URL" >/dev/null; then
      echo_success "Production site is responding"
    else
      echo_warn "Production site health check failed"
    fi
  fi
  
  # Environment-specific validation
  if [ -f "$SCRIPT_DIR/validate-environment.sh" ]; then
    echo_info "Running post-deployment environment validation..."
    "$SCRIPT_DIR/validate-environment.sh" --deployment
  fi
}

# Main execution
main() {
  echo_step "🛡️  Protected Deployment - $ENVIRONMENT Environment"
  echo_info "Project: $(basename "$PROJECT_ROOT")"
  echo_info "Timestamp: $(date)"
  echo ""
  
  get_environment_config
  run_safety_checks
  confirm_production_deployment
  execute_deployment
  monitor_deployment
  post_deployment_validation
  
  echo ""
  echo_success "Deployment completed successfully!"
  echo ""
  
  if [ "$ENVIRONMENT" = "production" ]; then
    echo "🎉 PRODUCTION DEPLOYMENT COMPLETE!"
    echo "   URL: https://$APP_ID.amplifyapp.com"
    echo "   Monitor: AWS Amplify Console"
  else
    echo "✅ DEVELOPMENT DEPLOYMENT COMPLETE!"
    echo "   Local: http://localhost:3000"
    echo "   Backend: Sandbox environment"
  fi
}

# Execute main function
main