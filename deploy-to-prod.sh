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
npm version $version_type

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
git merge main

# Push to production to trigger deployment
echo_step "Pushing to prod-v2 branch to trigger deployment..."
git push origin prod-v2

# Switch back to main branch
echo_step "Switching back to main branch..."
git checkout main

echo_step "Deployment initiated successfully! Version v$new_version is now being deployed."
echo "You can check the deployment status in the AWS Amplify console."
echo "App: RealTechee-Gen2 | Branch: prod-v2"