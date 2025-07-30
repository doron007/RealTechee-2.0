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

echo -e "${BLUE}==>${NC} 🔍 Pre-flight checks"

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

if [[ "$current_branch" != "main" ]]; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} Not on main branch. Staging deployment typically happens from main."
    echo -e "${BLUE}ℹ️  INFO:${NC} Continuing with current branch: $current_branch"
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

# Check if staging branch exists
if ! git show-ref --verify --quiet refs/heads/$STAGING_BRANCH; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating $STAGING_BRANCH branch from current branch"
    git checkout -b $STAGING_BRANCH
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to $STAGING_BRANCH branch"
    git checkout $STAGING_BRANCH
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging $current_branch into $STAGING_BRANCH"
    if ! git merge "$current_branch" --ff-only; then
        echo -e "${YELLOW}⚠️  WARNING:${NC} Fast-forward merge not possible, using regular merge"
        git merge "$current_branch" -m "Merge $current_branch for staging deployment"
    fi
fi

echo -e "${GREEN}✅ SUCCESS:${NC} $STAGING_BRANCH branch updated"

# Apply staging environment configuration AFTER git operations
echo -e "${BLUE}==>${NC} 🔧 Applying staging environment configuration"
if ! ./scripts/switch-environment.sh staging >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} Could not switch to staging environment config"
    echo -e "${BLUE}ℹ️  INFO:${NC} Manually copying staging config..."
    cp config/amplify_outputs.staging.json amplify_outputs.json
fi

# Commit the staging configuration
if ! git diff-index --quiet HEAD --; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Committing staging configuration..."
    git add amplify_outputs.json
    git commit -m "chore: apply staging environment configuration for deployment"
    echo -e "${GREEN}✅ SUCCESS:${NC} Staging configuration committed"
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Staging configuration already up to date"
fi

# Push to remote
echo -e "${BLUE}==>${NC} 🚀 Pushing to remote (triggers Amplify deployment)"
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}⚠️  DRY RUN:${NC} Would push to remote: git push origin $STAGING_BRANCH"
else
    git push origin $STAGING_BRANCH
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Staging deployment initiated"

# Switch back to original branch
if [[ "$current_branch" != "$STAGING_BRANCH" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching back to $current_branch"
    git checkout "$current_branch"
fi

# Restore development environment configuration
echo -e "${BLUE}ℹ️  INFO:${NC} Restoring development environment configuration"
./scripts/switch-environment.sh development >/dev/null 2>&1 || true

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
echo "  • Continue development work on $current_branch"
echo ""
echo -e "${YELLOW}⚠️  NOTE:${NC} $(echo "$STAGING_CONFIG" | jq -r '.description')"