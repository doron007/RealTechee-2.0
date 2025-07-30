#!/bin/bash

# Staging Deployment Script for RealTechee 2.0
# Uses centralized configuration to deploy main branch to staging environment

set -e

# Check for dry-run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
fi

# Colors for output  
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/config/environments.json"

# Load staging configuration
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Centralized configuration not found: $CONFIG_FILE"
    echo -e "${BLUE}ℹ️  INFO:${NC} Run ./scripts/generate-env-config.sh first"
    exit 1
fi

# Extract staging configuration
STAGING_CONFIG=$(cat "$CONFIG_FILE" | jq -r '.environments.staging')
if [[ "$STAGING_CONFIG" == "null" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Staging configuration not found in $CONFIG_FILE"
    exit 1
fi

STAGING_URL=$(echo "$STAGING_CONFIG" | jq -r '.amplify.url')
STAGING_BRANCH=$(echo "$STAGING_CONFIG" | jq -r '.git_branch')
STAGING_APP_NAME=$(echo "$STAGING_CONFIG" | jq -r '.amplify.app_name')

echo -e "${BLUE}==>${NC} 🚀 Staging Deployment - RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Using centralized configuration: config/environments.json"
echo -e "${BLUE}ℹ️  INFO:${NC} Target App: $STAGING_APP_NAME"
echo -e "${BLUE}ℹ️  INFO:${NC} Target URL: $STAGING_URL"
echo -e "${BLUE}ℹ️  INFO:${NC} Target Branch: $STAGING_BRANCH"
echo -e "${BLUE}ℹ️  INFO:${NC} Timestamp: $(date)"

cd "$PROJECT_ROOT"

# Store original branch for restoration
original_branch=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}ℹ️  INFO:${NC} Original branch: $original_branch"

# Function to restore original state on error
cleanup() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} Error occurred, cleaning up..."
    
    # Return to original branch
    git checkout "$original_branch" 2>/dev/null || true
    
    exit 1
}

trap cleanup ERR

echo -e "${BLUE}==>${NC} 🔍 Pre-flight checks"

# Check git status
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ ERROR:${NC} Working directory not clean. Please commit or stash changes."
    git status --short
    exit 1
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Working directory is clean"

# Validate branch (staging typically deploys from main)
if [[ "$original_branch" != "main" ]]; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} Not on main branch. Staging deployment typically happens from main."
    echo -e "${BLUE}ℹ️  INFO:${NC} Continuing with current branch: $original_branch"
fi

# Run TypeScript check
echo -e "${BLUE}==>${NC} 🔧 Running TypeScript validation"
if ! npm run type-check; then
    echo -e "${RED}❌ ERROR:${NC} TypeScript compilation failed"
    exit 1
fi
echo -e "${GREEN}✅ SUCCESS:${NC} TypeScript compilation passed"

# Create release candidate version
echo -e "${BLUE}==>${NC} 📦 Creating release candidate version"
./scripts/version-manager.sh rc

# Get current version for confirmation
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}ℹ️  INFO:${NC} Deploying version: $CURRENT_VERSION"

# IMPORTANT: Environment switching disabled to prevent incomplete config deployment
# The centralized config system generates incomplete amplify_outputs.json files
# that break authentication. Using complete configuration from git instead.
echo -e "${BLUE}==>${NC} 🔧 Environment configuration"
echo -e "${BLUE}ℹ️  INFO:${NC} Using complete amplify_outputs.json from git (centralized config disabled)"
echo -e "${YELLOW}⚠️  NOTE:${NC} Environment switching disabled until config generator is fixed"

# Check if staging branch exists
if ! git show-ref --verify --quiet refs/heads/$STAGING_BRANCH; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating $STAGING_BRANCH branch from current branch"
    git checkout -b $STAGING_BRANCH
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to $STAGING_BRANCH branch"
    git checkout $STAGING_BRANCH
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging $original_branch into $STAGING_BRANCH"
    if ! git merge "$original_branch" --ff-only; then
        echo -e "${YELLOW}⚠️  WARNING:${NC} Fast-forward merge not possible, using regular merge"
        git merge "$original_branch" -m "Merge $original_branch for staging deployment"
    fi
fi

echo -e "${GREEN}✅ SUCCESS:${NC} $STAGING_BRANCH branch updated"

# Push to remote
echo -e "${BLUE}==>${NC} 🚀 Pushing to remote (triggers Amplify deployment)"
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}⚠️  DRY RUN:${NC} Would push to remote: git push origin $STAGING_BRANCH"
else
    git push origin $STAGING_BRANCH
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Staging deployment initiated"

# Return to original development branch
echo -e "${BLUE}==>${NC} 🔄 Restoring development environment"
if [[ "$original_branch" != "$STAGING_BRANCH" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching back to $original_branch for continued development"
    git checkout "$original_branch"
    echo -e "${GREEN}✅ SUCCESS:${NC} Returned to development branch ($original_branch)"
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Already on target branch ($original_branch)"
fi

# NOTE: Environment restoration disabled to prevent overwriting complete config
# The complete amplify_outputs.json should remain active for local development
echo -e "${BLUE}ℹ️  INFO:${NC} Complete amplify_outputs.json preserved for development (6,371 lines)"
echo -e "${GREEN}✅ SUCCESS:${NC} Development environment ready for continued work"

# Disable error trap
trap - ERR

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Deployment Status:"
echo "  • Staging URL: $STAGING_URL"
echo "  • Backend: $(echo "$STAGING_CONFIG" | jq -r '.description')"
echo "  • Amplify will automatically build and deploy from $STAGING_BRANCH branch"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Next Steps:"
echo "  • Monitor Amplify console for deployment progress"
echo "  • Test staging environment once deployment completes"
echo "  • Continue development work on $original_branch"
echo ""
echo -e "${YELLOW}⚠️  NOTE:${NC} $(echo "$STAGING_CONFIG" | jq -r '.description')"