#!/bin/bash

# Deploy to Staging Environment with Versioning
# Creates release candidate and deploys to staging for testing

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
echo_step() { echo -e "${GREEN}==>${NC} $1"; }
echo_warn() { echo -e "${YELLOW}⚠️  WARNING:${NC} $1"; }
echo_error() { echo -e "${RED}❌ ERROR:${NC} $1"; exit 1; }
echo_info() { echo -e "${BLUE}ℹ️  INFO:${NC} $1"; }
echo_success() { echo -e "${GREEN}✅ SUCCESS:${NC} $1"; }

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo_step "Deploy to Staging with Versioning"
cd "$PROJECT_ROOT"

# 1. Pre-flight checks
echo_step "Running pre-flight checks"
if [[ -n $(git status --porcelain) ]]; then
    echo_error "Working directory is not clean. Please commit or stash changes."
fi

# 2. TypeScript check
echo_step "Running TypeScript validation"
npm run type-check || echo_error "TypeScript validation failed"

# 3. Build test
echo_step "Testing production build"
npm run build || echo_error "Build failed"

# 4. Create release candidate version
echo_step "Creating release candidate version"
./scripts/version-manager.sh rc

# 5. Get current version for confirmation
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo_info "Deploying version: $CURRENT_VERSION"

# 6. Environment validation
echo_step "Validating environment configuration"
./scripts/switch-environment.sh status

# 7. Deploy to staging branch
echo_step "Deploying to staging (prod branch)"
git checkout prod 2>/dev/null || git checkout -b prod
git merge main --ff-only || echo_error "Fast-forward merge failed. Please resolve conflicts."
git push origin prod

echo_success "Staging deployment initiated"
echo_info "Staging URL: https://prod.d3atadjk90y9q5.amplifyapp.com/"
echo_info "Version deployed: $CURRENT_VERSION"
echo_info "Monitor deployment at: https://console.aws.amazon.com/amplify/"

# Return to main branch
git checkout main

echo_success "Staging deployment complete with version $CURRENT_VERSION"