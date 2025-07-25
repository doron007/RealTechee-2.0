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

# Switch to production environment
if [[ -f "$PROJECT_ROOT/scripts/switch-environment.sh" ]]; then
    "$PROJECT_ROOT/scripts/switch-environment.sh" prod
    echo -e "${GREEN}✅ SUCCESS:${NC} Switched to production environment"
else
    # Fallback: manual copy
    cp "$PROJECT_ROOT/amplify_outputs.prod.json" "$PROJECT_ROOT/amplify_outputs.json"
    echo -e "${GREEN}✅ SUCCESS:${NC} Production configuration activated"
fi

# Data migration (placeholder - will be enhanced based on schema analysis)
echo -e "${BLUE}==>${NC} 📊 Business data migration"
echo -e "${BLUE}ℹ️  INFO:${NC} Migrating business configuration data..."

# This is where we would run data migration scripts
# For now, we'll create a placeholder
echo -e "${YELLOW}⚠️  WARNING:${NC} Data migration not yet implemented"
echo -e "${BLUE}ℹ️  INFO:${NC} Future implementation will migrate:"
echo "  • BackOfficeRequestStatuses"
echo "  • Staff and role configurations"
echo "  • Business reference data"

if ! confirm "Continue without data migration?" "y"; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Deployment cancelled - data migration required"
    rollback
    exit 1
fi

# Git operations
echo -e "${BLUE}==>${NC} 🔀 Git branch operations"

# Ensure we're on main for the merge
if [[ "$current_branch" != "main" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to main branch for production deployment"
    git checkout main
fi

# Check if prod-v2 branch exists
if ! git show-ref --verify --quiet refs/heads/prod-v2; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating prod-v2 branch from main"
    git checkout -b prod-v2
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to prod-v2 branch"
    git checkout prod-v2
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging main into prod-v2"
    if ! git merge main --ff-only; then
        echo -e "${YELLOW}⚠️  WARNING:${NC} Fast-forward merge not possible, using regular merge"
        git merge main -m "Production deployment: merge main to prod-v2"
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
git push origin prod-v2

echo -e "${GREEN}✅ SUCCESS:${NC} Production deployment initiated"

# Switch back to development environment
echo -e "${BLUE}==>${NC} 🔄 Restoring development environment"
if [[ -f "$PROJECT_ROOT/scripts/switch-environment.sh" ]]; then
    "$PROJECT_ROOT/scripts/switch-environment.sh" dev
else
    cp "$PROJECT_ROOT/amplify_outputs.dev.json" "$PROJECT_ROOT/amplify_outputs.json"
fi

# Switch back to original branch
if [[ "$current_branch" != "prod-v2" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching back to $current_branch"
    git checkout "$current_branch"
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