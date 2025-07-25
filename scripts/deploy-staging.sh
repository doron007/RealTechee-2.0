#!/bin/bash

# Staging Deployment Script for RealTechee 2.0
# Deploys main branch to staging environment (prod branch → prod.d3atadjk90y9q5.amplifyapp.com)

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

echo -e "${BLUE}==>${NC} 🚀 Staging Deployment - RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Project: RealTechee 2.0"
echo -e "${BLUE}ℹ️  INFO:${NC} Target: https://prod.d3atadjk90y9q5.amplifyapp.com/"
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

# Check if prod branch exists
if ! git show-ref --verify --quiet refs/heads/prod; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating prod branch from current branch"
    git checkout -b prod
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to prod branch"
    git checkout prod
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging $current_branch into prod"
    if ! git merge "$current_branch" --ff-only; then
        echo -e "${YELLOW}⚠️  WARNING:${NC} Fast-forward merge not possible, using regular merge"
        git merge "$current_branch" -m "Merge $current_branch for staging deployment"
    fi
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Prod branch updated"

# Push to remote
echo -e "${BLUE}==>${NC} 🚀 Pushing to remote (triggers Amplify deployment)"
if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}⚠️  DRY RUN:${NC} Would push to remote: git push origin prod"
else
    git push origin prod
fi

echo -e "${GREEN}✅ SUCCESS:${NC} Staging deployment initiated"

# Switch back to original branch
if [[ "$current_branch" != "prod" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching back to $current_branch"
    git checkout "$current_branch"
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Deployment Status:"
echo "  • Staging URL: https://prod.d3atadjk90y9q5.amplifyapp.com/"
echo "  • Backend: Shared with development (RealTechee-2.0 app)"
echo "  • Amplify will automatically build and deploy from prod branch"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Next Steps:"
echo "  • Monitor Amplify console for deployment progress"
echo "  • Test staging environment once deployment completes"
echo "  • Continue development work on $current_branch"
echo ""
echo -e "${YELLOW}⚠️  NOTE:${NC} Staging shares backend with development environment"