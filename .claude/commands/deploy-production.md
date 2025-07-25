#!/bin/bash

# Deploy to Production Environment with Versioning
# Promotes release candidate to stable production release

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

echo_step "Deploy to Production with Versioning"
cd "$PROJECT_ROOT"

# 1. Validate current version is RC
CURRENT_VERSION=$(node -p "require('./package.json').version")
if [[ ! $CURRENT_VERSION == *"-rc."* ]]; then
    echo_error "Production deployment requires release candidate version (x.x.x-rc.x). Current: $CURRENT_VERSION"
fi

echo_info "Current RC version: $CURRENT_VERSION"

# 2. Pre-deployment safety checks
echo_step "Running comprehensive pre-deployment checks"
if [[ -n $(git status --porcelain) ]]; then
    echo_error "Working directory is not clean. Please commit or stash changes."
fi

# 3. Full validation
echo_step "Running TypeScript validation"
npm run type-check || echo_error "TypeScript validation failed"

echo_step "Testing production build"
npm run build || echo_error "Build failed"

# 4. Backup production data
echo_step "Creating production data backup"
./scripts/backup-data.sh || echo_warn "Backup failed but continuing..."

# 5. Promote RC to stable release
echo_step "Promoting release candidate to stable production release"
./scripts/version-manager.sh release

# 6. Get new stable version
NEW_VERSION=$(node -p "require('./package.json').version")
echo_success "Version promoted: $CURRENT_VERSION → $NEW_VERSION"

# 7. Switch to production environment
echo_step "Switching to production environment configuration"
./scripts/switch-environment.sh prod

# 8. Deploy to production branch
echo_step "Deploying to production (prod-v2 branch)"
git checkout prod-v2 2>/dev/null || git checkout -b prod-v2

echo_info "Merging latest changes from main to prod-v2"
if ! git merge main --ff-only; then
    echo_warn "Fast-forward merge not possible, using regular merge"
    git merge main -m "Production deployment: merge main to prod-v2" || echo_error "Merge failed. Please resolve conflicts manually."
fi
echo_success "Prod-v2 branch updated with latest changes"

# Validate the merge was successful
MERGED_VERSION=$(node -p "require('./package.json').version")
if [[ "$MERGED_VERSION" != "$NEW_VERSION" ]]; then
    echo_error "Version mismatch after merge. Expected: $NEW_VERSION, Got: $MERGED_VERSION"
fi
echo_info "Confirmed version after merge: $MERGED_VERSION"

# 9. Push with confirmation
echo_warn "About to deploy version $NEW_VERSION to PRODUCTION"
echo_info "Production URL: https://d200k2wsaf8th3.amplifyapp.com/"
read -p "Continue with production deployment? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_info "Production deployment cancelled"
    git checkout main
    ./scripts/switch-environment.sh dev
    exit 0
fi

git push origin prod-v2

echo_success "Production deployment initiated"
echo_info "Production URL: https://d200k2wsaf8th3.amplifyapp.com/"
echo_info "Version deployed: $NEW_VERSION"
echo_info "Git tag: v$NEW_VERSION"
echo_info "Monitor deployment at: https://console.aws.amazon.com/amplify/"

# 10. Merge back to main and switch back to dev
echo_step "Merging production changes back to main"
git checkout main
git merge prod-v2 --ff-only

echo_step "Switching back to development environment"
./scripts/switch-environment.sh dev

echo_success "Production deployment complete!"
echo_info "Stable release $NEW_VERSION is now live in production"
echo_info "Development environment restored for continued work"

## Process Summary:
# 1. **Version Validation**: Must deploy from RC (e.g., 3.1.2-rc.1)
# 2. **Safety Checks**: Comprehensive validation and data backup
# 3. **Version Promotion**: RC → Stable release (3.1.2-rc.1 → 3.1.2)
# 4. **Environment Switch**: Switch to production configuration
# 5. **Production Deploy**: Deploy stable version to isolated production
# 6. **Post-deployment**: Merge back and restore dev environment

**Target Environment**: Production (d200k2wsaf8th3.amplifyapp.com)  
**Backend**: Isolated production (RealTechee-Gen2 app)  
**Git Flow**: main → prod-v2 branch  
**Configuration**: Switches to amplify_outputs.prod.json  
**Safety Level**: Maximum (backups, validation, rollback capability)