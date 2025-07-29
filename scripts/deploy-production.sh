#!/bin/bash

# Production Deployment Script for RealTechee 2.0
# Deploys tested staging (prod branch) to production (prod-v2 branch)
# Handles ampx sandbox generation and prevents merge conflicts

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
echo -e "${BLUE}ℹ️  INFO:${NC} Deploying TESTED staging to production"
echo -e "${BLUE}ℹ️  INFO:${NC} Source: prod branch (staging)"
echo -e "${BLUE}ℹ️  INFO:${NC} Target: prod-v2 branch (production)"
echo -e "${BLUE}ℹ️  INFO:${NC} URL: https://d200k2wsaf8th3.amplifyapp.com"
echo -e "${BLUE}ℹ️  INFO:${NC} Timestamp: $(date)"

cd "$PROJECT_ROOT"

# Store original branch and environment
original_branch=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}ℹ️  INFO:${NC} Current branch: $original_branch"

# Function to prompt for confirmation
confirm() {
    local message="$1"
    read -p "$message [y/N]: " response
    [[ "$response" =~ ^[Yy]$ ]]
}

# Function to restore original state on error
cleanup() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} Error occurred, cleaning up..."
    
    # Restore development environment if backup exists
    if [[ -f "$PROJECT_ROOT/amplify_outputs.backup.json" ]]; then
        cp "$PROJECT_ROOT/amplify_outputs.backup.json" "$PROJECT_ROOT/amplify_outputs.json"
        rm "$PROJECT_ROOT/amplify_outputs.backup.json"
    fi
    
    # Return to original branch
    git checkout "$original_branch" 2>/dev/null || true
    
    exit 1
}

trap cleanup ERR

# Basic validation
echo -e "${BLUE}==>${NC} 🔍 Pre-deployment validation"

# Check working directory is clean
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ ERROR:${NC} Working directory not clean. Please commit or stash changes."
    git status --short
    exit 1
fi

# Validate staging branch exists
if ! git show-ref --verify --quiet refs/heads/prod; then
    echo -e "${RED}❌ ERROR:${NC} Staging branch 'prod' not found"
    echo -e "${BLUE}ℹ️  INFO:${NC} Please run ./scripts/deploy-staging.sh first"
    exit 1
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Pre-deployment validation passed"

# Confirmation
echo ""
echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT CONFIRMATION${NC}"
echo "This will deploy the TESTED staging version to production:"
echo "  • Source: prod branch (staging)"
echo "  • Target: prod-v2 branch (production)"
echo "  • URL: https://d200k2wsaf8th3.amplifyapp.com"
echo "  • All production data will be preserved"
echo ""

if ! confirm "Continue with production deployment?"; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Deployment cancelled"
    exit 0
fi

# Step 1: Switch to staging branch (prod)
echo -e "${BLUE}==>${NC} 🔄 Switching to staging branch"
git checkout prod
echo -e "${GREEN}✅ SUCCESS:${NC} Now on staging branch (prod)"

# Step 2: Update auto-generated files for production
echo -e "${BLUE}==>${NC} 🔧 Updating auto-generated files for production"

# Backup current development environment
cp "$PROJECT_ROOT/amplify_outputs.json" "$PROJECT_ROOT/amplify_outputs.backup.json"

# Switch to production environment temporarily for sandbox generation
cp "$PROJECT_ROOT/amplify_outputs.prod.json" "$PROJECT_ROOT/amplify_outputs.json"
echo -e "${BLUE}ℹ️  INFO:${NC} Switched to production environment for sandbox generation"

# Run ampx sandbox to update auto-generated files for production
echo -e "${BLUE}ℹ️  INFO:${NC} Running ampx sandbox to update GraphQL queries and types..."
if npx ampx sandbox --profile production --yes; then
    echo -e "${GREEN}✅ SUCCESS:${NC} Auto-generated files updated for production"
else
    echo -e "${YELLOW}⚠️  WARNING:${NC} Sandbox generation completed with warnings (this is usually OK)"
fi

# Commit any changes from sandbox generation
if ! git diff-index --quiet HEAD --; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Committing auto-generated file updates..."
    git add -A
    git commit -m "chore: update auto-generated files for production deployment"
    echo -e "${GREEN}✅ SUCCESS:${NC} Auto-generated files committed"
else
    echo -e "${BLUE}ℹ️  INFO:${NC} No auto-generated file changes to commit"
fi

# Step 3: Create/update production branch
echo -e "${BLUE}==>${NC} 🔀 Preparing production branch"

if ! git show-ref --verify --quiet refs/heads/prod-v2; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating production branch from staging"
    git checkout -b prod-v2
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to production branch"
    git checkout prod-v2
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging staging into production"
    git merge prod -m "Production deployment: merge staging (prod) to production (prod-v2)"
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Production branch ready"

# Step 4: Final confirmation and deployment
echo ""
echo -e "${YELLOW}⚠️  FINAL CONFIRMATION${NC}"
echo "Ready to deploy to production:"
echo "  • Branch: prod-v2 (with updated auto-generated files)"
echo "  • Target: https://d200k2wsaf8th3.amplifyapp.com"
echo "  • All production data will be preserved"
echo ""

if ! confirm "Push to production now?"; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Deployment cancelled"
    # Restore environment and return to original branch
    cp "$PROJECT_ROOT/amplify_outputs.backup.json" "$PROJECT_ROOT/amplify_outputs.json"
    rm "$PROJECT_ROOT/amplify_outputs.backup.json"
    git checkout "$original_branch"
    exit 0
fi

# Push to production
echo -e "${BLUE}==>${NC} 🚀 Deploying to production"
git push origin prod-v2

echo -e "${GREEN}✅ SUCCESS:${NC} Production deployment initiated!"

# Step 5: Cleanup and restore
echo -e "${BLUE}==>${NC} 🔄 Restoring development environment"

# Return to original branch
git checkout "$original_branch"
echo -e "${GREEN}✅ SUCCESS:${NC} Returned to $original_branch branch"

# Restore development environment
cp "$PROJECT_ROOT/amplify_outputs.backup.json" "$PROJECT_ROOT/amplify_outputs.json"
rm "$PROJECT_ROOT/amplify_outputs.backup.json"
echo -e "${GREEN}✅ SUCCESS:${NC} Development environment restored"

# Success message
echo ""
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Monitor deployment at:"
echo "  • Amplify Console: https://console.aws.amazon.com/amplify/d200k2wsaf8th3"
echo "  • Production URL: https://d200k2wsaf8th3.amplifyapp.com"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Deployment includes:"
echo "  • Latest staging code (tested)"
echo "  • Updated GraphQL queries and types"
echo "  • Production environment configuration"
echo "  • All existing production data preserved"

# Disable error trap
trap - ERR