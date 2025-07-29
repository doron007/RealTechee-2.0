#!/bin/bash

# Production Deployment Script for RealTechee 2.0
# Comprehensive production deployment with safety checks, data migration, and environment switching

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}==>${NC} 🚀 Production Deployment - RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Project: RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Target: https://d200k2wsaf8th3.amplifyapp.com"
echo -e "${BLUE}ℹ️  INFO:${NC} Timestamp: $(date)"

cd "$PROJECT_ROOT"

# Function to prompt for confirmation
confirm() {
    local message="$1"
    local default="${2:-n}"
    
    if [[ "$default" == "y" ]]; then
        prompt="$message [Y/n]: "
    else
        prompt="$message [y/N]: "
    fi
    
    read -p "$prompt" response
    response=${response:-$default}
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to rollback changes
rollback() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} Initiating rollback procedure"
    
    # Switch back to dev environment
    if [[ -f "$PROJECT_ROOT/scripts/switch-environment.sh" ]]; then
        echo -e "${BLUE}ℹ️  INFO:${NC} Switching back to development environment"
        "$PROJECT_ROOT/scripts/switch-environment.sh" dev
    fi
    
    # Reset git changes if needed
    if [[ "$(git rev-parse --abbrev-ref HEAD)" == "prod-v2" ]]; then
        echo -e "${BLUE}ℹ️  INFO:${NC} Resetting prod-v2 branch changes"
        git reset --hard HEAD~1 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ SUCCESS:${NC} Rollback completed"
}

# Set up trap for cleanup on error
trap rollback ERR

echo -e "${BLUE}==>${NC} 🔍 Pre-deployment safety checks"

# Validate staging deployment exists and is recent
echo -e "${BLUE}ℹ️  INFO:${NC} Validating staging deployment..."
if ! git show-ref --verify --quiet refs/remotes/origin/prod; then
    echo -e "${RED}❌ ERROR:${NC} Staging branch not found on remote"
    echo -e "${BLUE}ℹ️  INFO:${NC} Please deploy to staging first: ./scripts/deploy-staging.sh"
    exit 1
fi

# Check for recent staging activity (within last 24 hours)
last_staging_commit=$(git log -1 --format=%ct origin/prod 2>/dev/null || echo "0")
current_time=$(date +%s)
time_diff=$((current_time - last_staging_commit))
hours_since_staging=$((time_diff / 3600))

if [[ $hours_since_staging -gt 24 ]]; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} Staging deployment is ${hours_since_staging} hours old"
    if ! confirm "Deploy potentially stale staging version to production?"; then
        echo -e "${BLUE}ℹ️  INFO:${NC} Consider running fresh staging deployment first"
        exit 0
    fi
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Staging validation passed"

# Check git status
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ ERROR:${NC} Working directory not clean. Please commit or stash changes."
    git status --short
    exit 1
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Working directory is clean"

# Check current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}ℹ️  INFO:${NC} Current branch: $current_branch"

# Run comprehensive checks
echo -e "${BLUE}==>${NC} 🔧 Running comprehensive validation"

# TypeScript check
echo -e "${BLUE}ℹ️  INFO:${NC} Running TypeScript validation..."
if ! npm run type-check; then
    echo -e "${RED}❌ ERROR:${NC} TypeScript compilation failed"
    exit 1
fi
echo -e "${GREEN}✅ SUCCESS:${NC} TypeScript compilation passed"

# Build check
echo -e "${BLUE}ℹ️  INFO:${NC} Running production build test..."
if ! NODE_OPTIONS="--max-old-space-size=4096" npm run build; then
    echo -e "${RED}❌ ERROR:${NC} Production build failed"
    exit 1
fi
echo -e "${GREEN}✅ SUCCESS:${NC} Production build completed"

# Backup current environment state
echo -e "${BLUE}==>${NC} 💾 Creating environment backups"

# Backup development data
echo -e "${BLUE}ℹ️  INFO:${NC} Backing up development environment..."
if [[ -f "$PROJECT_ROOT/scripts/backup-data.sh" ]]; then
    "$PROJECT_ROOT/scripts/backup-data.sh" --prefix "pre-prod-deploy"
    echo -e "${GREEN}✅ SUCCESS:${NC} Development data backed up"
else
    echo -e "${YELLOW}⚠️  WARNING:${NC} Backup script not found, proceeding without backup"
fi

# Confirm production deployment
echo ""
echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT CONFIRMATION${NC}"
echo "This will:"
echo "  • Switch to production environment configuration"
echo "  • Migrate business data from development to production"
echo "  • Deploy to isolated production backend"
echo "  • This is a LIVE PRODUCTION deployment"
echo ""

if ! confirm "Continue with production deployment?" "n"; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Production deployment cancelled by user"
    exit 0
fi

# Environment switching
echo -e "${BLUE}==>${NC} 🔄 Switching to production environment"

# Check if production config exists
if [[ ! -f "$PROJECT_ROOT/amplify_outputs.prod.json" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Production configuration not found"
    echo -e "${BLUE}ℹ️  INFO:${NC} Please ensure amplify_outputs.prod.json exists with production configuration"
    exit 1
fi

# Skip environment switching and data migration for production deployment
# Production environment will be handled by Amplify automatically
echo -e "${BLUE}ℹ️  INFO:${NC} Production environment will be configured automatically by Amplify"
echo -e "${BLUE}ℹ️  INFO:${NC} No data migration needed - production data will be preserved"

# Git operations
echo -e "${BLUE}==>${NC} 🔀 Git branch operations"

# Validate staging branch exists and is up to date
if ! git show-ref --verify --quiet refs/heads/prod; then
    echo -e "${RED}❌ ERROR:${NC} Staging branch 'prod' not found"
    echo -e "${BLUE}ℹ️  INFO:${NC} Please run './scripts/deploy-staging.sh' first"
    exit 1
fi

# Fetch latest changes to ensure we have up-to-date branches
echo -e "${BLUE}ℹ️  INFO:${NC} Fetching latest changes from remote..."
git fetch origin

# Check if staging is ahead of production (has new changes to deploy)
if git merge-base --is-ancestor origin/prod origin/prod-v2 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} No new changes in staging since last production deployment"
    if ! confirm "Continue deployment anyway?"; then
        echo -e "${BLUE}ℹ️  INFO:${NC} Production deployment cancelled"
        exit 0
    fi
fi

# Switch to staging branch for deployment
echo -e "${BLUE}ℹ️  INFO:${NC} Switching to staging branch (prod) for production deployment"
git checkout prod

# Check if prod-v2 branch exists
if ! git show-ref --verify --quiet refs/heads/prod-v2; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating prod-v2 branch from staging (prod)"
    git checkout -b prod-v2
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to prod-v2 branch"
    git checkout prod-v2
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging staging (prod) into production (prod-v2)"
    if ! git merge prod --ff-only; then
        echo -e "${YELLOW}⚠️  WARNING:${NC} Fast-forward merge not possible, using regular merge"
        git merge prod -m "Production deployment: merge staging (prod) to production (prod-v2)"
    fi
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Prod-v2 branch updated"

# Final confirmation before push
echo ""
echo -e "${YELLOW}⚠️  FINAL CONFIRMATION${NC}"
echo "Ready to push to production:"
echo "  • Branch: prod-v2"
echo "  • Target: RealTechee-Gen2 (d200k2wsaf8th3)"
echo "  • Environment: Production (isolated)"
echo "  • URL: https://d200k2wsaf8th3.amplifyapp.com"
echo ""

if ! confirm "Push to production now?" "n"; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Production push cancelled by user"
    rollback
    exit 0
fi

# Push to production
echo -e "${BLUE}==>${NC} 🚀 Pushing to production"
if ! git push origin prod-v2; then
    echo -e "${RED}❌ ERROR:${NC} Failed to push to production branch"
    echo -e "${BLUE}ℹ️  INFO:${NC} This could be due to:"
    echo "  • Network connectivity issues"
    echo "  • Branch protection rules"
    echo "  • Authentication problems"
    rollback
    exit 1
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Production deployment initiated"

# Monitor deployment status
echo -e "${BLUE}==>${NC} 📊 Deployment monitoring"
echo -e "${BLUE}ℹ️  INFO:${NC} Production deployment has been triggered"
echo -e "${YELLOW}⚠️  IMPORTANT:${NC} Monitor the deployment status at:"
echo "  • Amplify Console: https://console.aws.amazon.com/amplify/d200k2wsaf8th3"
echo "  • Production URL: https://d200k2wsaf8th3.amplifyapp.com"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} If deployment fails, common issues:"
echo "  • Environment variables not configured in Amplify"
echo "  • Build process timeout (check amplify.yml)"
echo "  • Dependency conflicts (check package.json)"
echo "  • TypeScript compilation errors"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} For Amplify sandbox regeneration (if needed):"
echo "  • Run: npx ampx sandbox --profile production"
echo "  • This will NOT recreate resources or cause data loss"
echo "  • Only regenerates environment configuration"

# Switch back to original branch (main)
echo -e "${BLUE}==>${NC} 🔄 Restoring original branch"
if [[ "$current_branch" != "prod-v2" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching back to $current_branch"
    git checkout "$current_branch"
fi

# Restore development environment only if we switched it
if [[ -f "$PROJECT_ROOT/amplify_outputs.backup.json" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Restoring development environment configuration"
    cp "$PROJECT_ROOT/amplify_outputs.backup.json" "$PROJECT_ROOT/amplify_outputs.json"
    rm "$PROJECT_ROOT/amplify_outputs.backup.json"
    echo -e "${GREEN}✅ SUCCESS:${NC} Development environment restored"
fi

echo ""
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Deployment Status:"
echo "  • Production URL: https://d200k2wsaf8th3.amplifyapp.com"
echo "  • Backend: Isolated production (RealTechee-Gen2 app)"
echo "  • Configuration: Restored to development"
echo "  • Branch: Returned to $current_branch"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Next Steps:"
echo "  • Monitor Amplify console for deployment progress"
echo "  • Verify production functionality once deployment completes"
echo "  • Continue development work normally"
echo ""
echo -e "${GREEN}✅ SUCCESS:${NC} Environment restored for continued development"

# Disable trap
trap - ERR