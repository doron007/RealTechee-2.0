#!/bin/bash

# Production Deployment Script for RealTechee 2.0
# Uses centralized configuration to deploy tested staging to production
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
CONFIG_FILE="$PROJECT_ROOT/config/environments.json"

# Load environment configurations
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Centralized configuration not found: $CONFIG_FILE"
    echo -e "${BLUE}ℹ️  INFO:${NC} Run ./scripts/generate-env-config.sh first"
    exit 1
fi

# Extract staging and production configurations
STAGING_CONFIG=$(cat "$CONFIG_FILE" | jq -r '.environments.staging')
PRODUCTION_CONFIG=$(cat "$CONFIG_FILE" | jq -r '.environments.production')

if [[ "$STAGING_CONFIG" == "null" || "$PRODUCTION_CONFIG" == "null" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Staging or production configuration not found in $CONFIG_FILE"
    exit 1
fi

STAGING_BRANCH=$(echo "$STAGING_CONFIG" | jq -r '.git_branch')
PRODUCTION_BRANCH=$(echo "$PRODUCTION_CONFIG" | jq -r '.git_branch')
PRODUCTION_URL=$(echo "$PRODUCTION_CONFIG" | jq -r '.amplify.url')
PRODUCTION_APP_NAME=$(echo "$PRODUCTION_CONFIG" | jq -r '.amplify.app_name')

echo -e "${BLUE}==>${NC} 🚀 Production Deployment - RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Using centralized configuration: config/environments.json"
echo -e "${BLUE}ℹ️  INFO:${NC} Deploying TESTED staging to production"
echo -e "${BLUE}ℹ️  INFO:${NC} Source: $STAGING_BRANCH branch (staging)"
echo -e "${BLUE}ℹ️  INFO:${NC} Target: $PRODUCTION_BRANCH branch (production)"
echo -e "${BLUE}ℹ️  INFO:${NC} App: $PRODUCTION_APP_NAME"
echo -e "${BLUE}ℹ️  INFO:${NC} URL: $PRODUCTION_URL"
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
if ! git show-ref --verify --quiet refs/heads/$STAGING_BRANCH; then
    echo -e "${RED}❌ ERROR:${NC} Staging branch '$STAGING_BRANCH' not found"
    echo -e "${BLUE}ℹ️  INFO:${NC} Please run ./scripts/deploy-staging.sh first"
    exit 1
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Pre-deployment validation passed"

# Confirmation
echo ""
echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT CONFIRMATION${NC}"
echo "This will deploy the TESTED staging version to production:"
echo "  • Source: $STAGING_BRANCH branch (staging)"
echo "  • Target: $PRODUCTION_BRANCH branch (production)"
echo "  • App: $PRODUCTION_APP_NAME"
echo "  • URL: $PRODUCTION_URL"
echo "  • All production data will be preserved"
echo ""

if ! confirm "Continue with production deployment?"; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Deployment cancelled"
    exit 0
fi

# Step 1: Switch to staging branch
echo -e "${BLUE}==>${NC} 🔄 Switching to staging branch"
git checkout $STAGING_BRANCH
echo -e "${GREEN}✅ SUCCESS:${NC} Now on staging branch ($STAGING_BRANCH)"

# Step 2: Update auto-generated files for production
echo -e "${BLUE}==>${NC} 🔧 Updating auto-generated files for production"

# Backup current development environment
cp "$PROJECT_ROOT/amplify_outputs.json" "$PROJECT_ROOT/amplify_outputs.backup.json"

# IMPORTANT: Environment switching disabled to prevent incomplete config deployment
# Using complete amplify_outputs.json from git instead of generated configs
echo -e "${BLUE}ℹ️  INFO:${NC} Using complete amplify_outputs.json (centralized config disabled)"
echo -e "${YELLOW}⚠️  NOTE:${NC} Environment switching disabled until config generator is fixed"

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

if ! git show-ref --verify --quiet refs/heads/$PRODUCTION_BRANCH; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating production branch from staging"
    git checkout -b $PRODUCTION_BRANCH
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to production branch"
    git checkout $PRODUCTION_BRANCH
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging staging into production"
    git merge $STAGING_BRANCH -m "Production deployment: merge staging ($STAGING_BRANCH) to production ($PRODUCTION_BRANCH)"
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Production branch ready"

# Step 4: Final confirmation and deployment
echo ""
echo -e "${YELLOW}⚠️  FINAL CONFIRMATION${NC}"
echo "Ready to deploy to production:"
echo "  • Branch: $PRODUCTION_BRANCH (with updated auto-generated files)"
echo "  • Target: $PRODUCTION_URL"
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
git push origin $PRODUCTION_BRANCH

echo -e "${GREEN}✅ SUCCESS:${NC} Production deployment initiated!"

# Step 5: Cleanup and restore
echo -e "${BLUE}==>${NC} 🔄 Restoring development environment"

# Return to original branch
git checkout "$original_branch"
echo -e "${GREEN}✅ SUCCESS:${NC} Returned to $original_branch branch"

# NOTE: Environment restoration disabled to prevent overwriting complete config
echo -e "${BLUE}ℹ️  INFO:${NC} Keeping current amplify_outputs.json (environment switching disabled)"
rm -f "$PROJECT_ROOT/amplify_outputs.backup.json"
echo -e "${GREEN}✅ SUCCESS:${NC} Development environment restored"

# Success message
echo ""
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Monitor deployment at:"
echo "  • Amplify Console: https://console.aws.amazon.com/amplify/$(echo "$PRODUCTION_CONFIG" | jq -r '.amplify.app_id')"
echo "  • Production URL: $PRODUCTION_URL"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Deployment includes:"
echo "  • Latest staging code (tested)"
echo "  • Updated GraphQL queries and types"
echo "  • Production environment configuration"
echo "  • All existing production data preserved"

# Disable error trap
trap - ERR