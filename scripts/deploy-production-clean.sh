#!/bin/bash

# AWS Amplify Gen 2 Official Pattern: Production Deployment
# Zero config commits - amplify.yml handles environment-specific config generation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}==>${NC} 🚀 AWS Amplify Gen 2 Production Deployment"
echo -e "${BLUE}ℹ️  INFO:${NC} Official pattern: Zero config commits, build-time generation"
echo -e "${BLUE}ℹ️  INFO:${NC} Target: Production environment (prod-v2 branch)"
echo -e "${BLUE}ℹ️  INFO:${NC} Backend: Isolated production infrastructure"
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

if [[ "$current_branch" != "prod" ]]; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} Production deployment typically happens from prod branch."
    echo -e "${BLUE}ℹ️  INFO:${NC} Current branch: $current_branch"
    echo ""
    read -p "Continue with production deployment from $current_branch? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  INFO:${NC} Deployment cancelled. Switch to prod branch first."
        exit 0
    fi
fi

# Run comprehensive validation
echo -e "${BLUE}==>${NC} 🔧 Running comprehensive validation"

# TypeScript check
if ! npm run type-check; then
    echo -e "${RED}❌ ERROR:${NC} TypeScript compilation failed"
    exit 1
fi
echo -e "${GREEN}✅ SUCCESS:${NC} TypeScript validation passed"

# Build test
echo -e "${BLUE}ℹ️  INFO:${NC} Testing production build"
if ! npm run build; then
    echo -e "${RED}❌ ERROR:${NC} Production build failed"
    exit 1
fi
echo -e "${GREEN}✅ SUCCESS:${NC} Production build test passed"

# Promote release candidate to stable
echo -e "${BLUE}==>${NC} 📦 Promoting release candidate to stable version"
./scripts/version-manager.sh stable

# Get current version for confirmation
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}ℹ️  INFO:${NC} Deploying stable version: $CURRENT_VERSION"

# Production deployment confirmation
echo ""
echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT CONFIRMATION${NC}"
echo -e "${BLUE}ℹ️  INFO:${NC} You are about to deploy to PRODUCTION:"
echo "  • Version: $CURRENT_VERSION"
echo "  • Source Branch: $current_branch"
echo "  • Target Branch: prod-v2"
echo "  • Environment: Production (isolated backend)"
echo "  • URL: https://prod-v2.d200k2wsaf8th3.amplifyapp.com"
echo ""
read -p "Proceed with production deployment? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Production deployment cancelled."
    exit 0
fi

# Push main branch changes (version bump + tag) if we're on main
if [[ "$current_branch" == "main" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Pushing main branch version bump to remote"
    git push origin main
    git push origin "v$CURRENT_VERSION"
fi

# Check if production branch exists
if ! git show-ref --verify --quiet refs/heads/prod-v2; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Creating prod-v2 branch from current branch"
    git checkout -b prod-v2
else
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching to prod-v2 branch"
    git checkout prod-v2
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Merging $current_branch into prod-v2"
    if ! git merge "$current_branch" --ff-only; then
        echo -e "${YELLOW}⚠️  WARNING:${NC} Fast-forward merge not possible, using regular merge"
        git merge "$current_branch" -m "Merge $current_branch for production deployment"
    fi
fi

echo -e "${GREEN}✅ SUCCESS:${NC} prod-v2 branch updated"

# Push to remote (AWS Amplify will handle config generation via amplify.yml)
echo -e "${BLUE}==>${NC} 🚀 Deploying to production (amplify.yml will generate config)"
git push origin prod-v2
echo -e "${GREEN}✅ SUCCESS:${NC} Production deployment initiated"

# Switch back to original branch
if [[ "$current_branch" != "prod-v2" ]]; then
    echo -e "${BLUE}ℹ️  INFO:${NC} Switching back to $current_branch"
    git checkout "$current_branch"
fi

echo ""
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Deployment Status:"
echo "  • Production URL: https://prod-v2.d200k2wsaf8th3.amplifyapp.com"
echo "  • Backend: Isolated production infrastructure"
echo "  • Config Generation: AWS Amplify will auto-generate amplify_outputs.json"
echo "  • Branch: prod-v2 (AWS_BRANCH=prod-v2 in amplify.yml)"
echo "  • Version: $CURRENT_VERSION (stable)"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Next Steps:"
echo "  • Monitor AWS Amplify console for deployment progress"
echo "  • Perform production smoke tests once deployment completes"
echo "  • Monitor production logs and metrics"
echo "  • Continue development work on $current_branch"
echo ""
echo -e "${GREEN}✅ BENEFIT:${NC} Zero merge conflicts - no config files committed!"
echo -e "${GREEN}✅ BENEFIT:${NC} Isolated production backend with auto-generated config!"