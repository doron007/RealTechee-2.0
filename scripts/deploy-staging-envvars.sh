#!/bin/bash

# Environment Variable-Driven Staging Deployment
# NO config file commits - uses AWS Amplify environment variables

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

# Check for dry-run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
fi

echo -e "${BLUE}==>${NC} 🚀 Environment Variable-Driven Staging Deployment"
echo -e "${BLUE}ℹ️  INFO:${NC} NO config commits - using AWS environment variables"

# Load staging configuration
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Configuration file not found: $CONFIG_FILE"
    exit 1
fi

STAGING_CONFIG=$(cat "$CONFIG_FILE" | jq -r '.environments.staging')
STAGING_URL=$(echo "$STAGING_CONFIG" | jq -r '.amplify.url')
STAGING_BRANCH=$(echo "$STAGING_CONFIG" | jq -r '.git_branch')
STAGING_APP_ID=$(echo "$STAGING_CONFIG" | jq -r '.amplify.app_id')

echo -e "${BLUE}ℹ️  INFO:${NC} Target App: $STAGING_APP_ID"
echo -e "${BLUE}ℹ️  INFO:${NC} Target URL: $STAGING_URL"
echo -e "${BLUE}ℹ️  INFO:${NC} Target Branch: $STAGING_BRANCH"

cd "$PROJECT_ROOT"

echo -e "${BLUE}==>${NC} 🔍 Pre-flight checks"

# Check git status
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ ERROR:${NC} Working directory not clean. Please commit or stash changes."
    git status --short
    exit 1
fi

current_branch=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}ℹ️  INFO:${NC} Current branch: $current_branch"

# Run TypeScript check
echo -e "${BLUE}==>${NC} 🔧 Running TypeScript validation"
if ! npm run type-check; then
    echo -e "${RED}❌ ERROR:${NC} TypeScript compilation failed"
    exit 1
fi

# Create release candidate version
echo -e "${BLUE}==>${NC} 📦 Creating release candidate version"
./scripts/version-manager.sh rc

CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}ℹ️  INFO:${NC} Deploying version: $CURRENT_VERSION"

# Push version changes to main
git push origin main
git push origin "v$CURRENT_VERSION"

# Ensure AWS Amplify environment variables are set
echo -e "${BLUE}==>${NC} 🔧 Ensuring AWS Amplify environment variables"
echo -e "${BLUE}ℹ️  INFO:${NC} Environment variables should be pre-configured in AWS Amplify Console"
echo -e "${BLUE}ℹ️  INFO:${NC} If not set, run: ./scripts/set-amplify-env-vars.sh staging $STAGING_APP_ID"

# Update staging branch (NO CONFIG COMMITS)
if ! git show-ref --verify --quiet refs/heads/$STAGING_BRANCH; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating $STAGING_BRANCH branch from $current_branch"
    git checkout -b $STAGING_BRANCH
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to $STAGING_BRANCH branch"
    git checkout $STAGING_BRANCH
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging $current_branch into $STAGING_BRANCH"
    git merge "$current_branch" --ff-only
fi

echo -e "${GREEN}✅ SUCCESS:${NC} $STAGING_BRANCH branch updated (no config changes)"

# Deploy to staging (NO CONFIG COMMIT NEEDED)
echo -e "${BLUE}==>${NC} 🚀 Deploying to staging"
echo -e "${BLUE}ℹ️  INFO:${NC} AWS Amplify will generate config from environment variables"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}⚠️  DRY RUN:${NC} Would push to remote: git push origin $STAGING_BRANCH"
else
    git push origin $STAGING_BRANCH
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Staging deployment initiated"

# Return to original branch
if [[ "$current_branch" != "$STAGING_BRANCH" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching back to $current_branch"
    git checkout "$current_branch"
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Deployment Status:"
echo "  • Staging URL: $STAGING_URL"
echo "  • Configuration: Generated from AWS environment variables"
echo "  • No git commits for config files - branches stay synchronized"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Next Steps:"
echo "  • Monitor Amplify console for deployment progress"
echo "  • Verify environment variables are set in AWS Amplify Console"
echo "  • Test staging environment once deployment completes"