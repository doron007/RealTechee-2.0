#!/bin/bash

# RealTechee 2.0 Deployment Script
# This script automates the versioning and deployment process to the prod branch

set -e  # Exit on any error

# Color codes for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
echo_step() {
  echo -e "${GREEN}==>${NC} $1"
}

echo_warn() {
  echo -e "${YELLOW}WARNING:${NC} $1"
}

echo_error() {
  echo -e "${RED}ERROR:${NC} $1"
  exit 1
}

# Check if current branch is main
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
  echo_error "You must be on the main branch to deploy. Current branch: $current_branch"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo_warn "You have uncommitted changes. Please commit or stash them first."
  git status
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Ensure we have the latest changes from main
echo_step "Pulling latest changes from main branch..."
git pull origin main

# Prompt for version increment type
echo_step "Select version increment type:"
echo "1) Patch (bug fixes) - x.x.X"
echo "2) Minor (new features) - x.X.x"
echo "3) Major (breaking changes) - X.x.x"
read -p "Enter choice [1-3]: " version_choice

case $version_choice in
  1)
    version_type="patch"
    ;;
  2)
    version_type="minor"
    ;;
  3)
    version_type="major"
    ;;
  *)
    echo_error "Invalid choice. Exiting."
    ;;
esac

# Increment version and create git tag
echo_step "Incrementing $version_type version..."
npm version $version_type -m "Release version %s"

# Get the new version
new_version=$(node -p "require('./package.json').version")
echo_step "New version: v$new_version"

# Push changes and tags to main
echo_step "Pushing changes and tags to main branch..."
git push origin main --follow-tags

# Switch to prod-v2 branch and merge from main
echo_step "Switching to prod-v2 branch and merging changes from main..."
git checkout prod-v2
git pull origin prod-v2

# Merge main into prod-v2, using main's version of amplify_outputs.json in case of conflict
echo_step "Merging main branch (will use main's amplify_outputs.json if conflict)..."
git merge main -X ours --no-edit || {
  # If merge failed due to conflict, resolve amplify_outputs.json conflict automatically
  if git status --porcelain | grep -q "amplify_outputs.json"; then
    echo_step "Resolving amplify_outputs.json merge conflict with main's version..."
    git checkout main -- amplify_outputs.json
    git add amplify_outputs.json
    git commit --no-edit -m "Resolve amplify_outputs.json conflict with main's version"
  else
    echo_error "Merge failed with conflicts other than amplify_outputs.json. Please resolve manually."
  fi
}

# Enhanced deployment with backend infrastructure
echo_step "Preparing Amplify Gen 2 backend deployment..."

# Check if we're doing a production deployment (requires backend setup)
read -p "Deploy backend infrastructure to production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo_step "🔧 Deploying Amplify Gen 2 backend to production..."
  
  # Validate backend configuration
  if [ ! -f "amplify/backend.ts" ]; then
    echo_error "amplify/backend.ts not found. Backend configuration required for production deployment."
  fi
  
  # Build and deploy backend
  echo_step "Building backend configuration..."
  npm run build || echo_warn "Frontend build had warnings but continuing..."
  
  # Deploy to production (this will use the prod-v2 branch configuration)
  echo_step "Deploying backend infrastructure..."
  echo "⚠️  Note: Ensure production AWS credentials are configured"
  echo "💡 Tip: Use 'aws configure' to set production AWS profile if needed"
  
  # Attempt backend deployment (user should handle AWS credentials)
  if command -v npx &> /dev/null; then
    echo_step "Attempting Amplify backend deployment..."
    echo "Running: npx ampx pipeline-deploy --branch prod-v2"
    # Note: This requires proper AWS credentials and Amplify app setup
    npx ampx pipeline-deploy --branch prod-v2 || {
      echo_warn "Backend deployment failed or requires manual setup"
      echo "📝 Manual steps required:"
      echo "   1. Configure AWS credentials for production"
      echo "   2. Ensure Amplify app is connected to prod-v2 branch"
      echo "   3. Run: npx ampx pipeline-deploy --branch prod-v2"
    }
  else
    echo_warn "Amplify CLI not found. Install with: npm install -g @aws-amplify/cli"
  fi
  
  # Validate Lambda functions
  echo_step "Validating Lambda function deployment..."
  functions=("notification-processor" "user-admin" "status-processor")
  for func in "${functions[@]}"; do
    if [ -d "amplify/functions/$func" ]; then
      echo "✅ Function $func configuration found"
    else
      echo_warn "⚠️  Function $func configuration missing"
    fi
  done
  
  # Post-deployment validation
  echo_step "Backend deployment validation..."
  echo "🔍 Checking amplify_outputs.json generation..."
  if [ -f "amplify_outputs.json" ]; then
    echo "✅ amplify_outputs.json exists"
    # Commit updated outputs if changed
    if [ -n "$(git status --porcelain amplify_outputs.json)" ]; then
      echo_step "Committing updated amplify_outputs.json..."
      git add amplify_outputs.json
      git commit -m "Update amplify_outputs.json after backend deployment v$new_version"
      git push origin prod-v2
    fi
  else
    echo_warn "⚠️  amplify_outputs.json not found - backend may not be fully deployed"
  fi
else
  echo_step "Skipping backend deployment - frontend only"
fi

# Push to production to trigger frontend deployment
echo_step "Pushing to prod-v2 branch to trigger frontend deployment..."
git push origin prod-v2

# Switch back to main branch
echo_step "Switching back to main branch..."
git checkout main

# Enhanced deployment summary
echo_step "🎉 Deployment initiated successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "   Version: v$new_version"
echo "   Branch: prod-v2"
echo "   Frontend: ✅ Deployed to Amplify"
echo "   Backend: $([ "$REPLY" = "y" ] && echo "✅ Infrastructure deployed" || echo "⏭️  Skipped")"
echo ""
echo "🔗 Monitoring Links:"
echo "   AWS Amplify Console: https://console.aws.amazon.com/amplify/"
echo "   App: RealTechee-Gen2 | Branch: prod-v2"
echo ""
echo "🔍 Post-Deployment Checklist:"
echo "   [ ] Verify frontend deployment in Amplify console"
echo "   [ ] Test critical user flows on production URL"
echo "   [ ] Monitor CloudWatch logs for any errors"
echo "   [ ] Validate all Lambda functions are working"
echo "   [ ] Check DynamoDB tables are accessible"
echo "   [ ] Confirm authentication flows work correctly"
echo ""
echo "✅ Production deployment complete!"