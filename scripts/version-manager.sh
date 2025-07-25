#!/bin/bash

# Version Management Script for SDLC Best Practices
# Supports: development, release candidates, hotfixes, and production releases

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Helper functions
echo_step() { echo -e "${GREEN}==>${NC} $1"; }
echo_warn() { echo -e "${YELLOW}⚠️  WARNING:${NC} $1"; }
echo_error() { echo -e "${RED}❌ ERROR:${NC} $1"; exit 1; }
echo_info() { echo -e "${BLUE}ℹ️  INFO:${NC} $1"; }
echo_success() { echo -e "${GREEN}✅ SUCCESS:${NC} $1"; }

# Show usage
show_usage() {
  echo "Version Management Script - SDLC Best Practices"
  echo ""
  echo "Usage: $0 <command> [options]"
  echo ""
  echo "Commands:"
  echo "  dev                    Create development version (3.1.2-dev.1)"
  echo "  rc                     Create release candidate (3.1.2-rc.1)"
  echo "  release                Create production release (3.1.2)"
  echo "  hotfix <version>       Create hotfix version (3.1.3)"
  echo "  current                Show current version"
  echo ""
  echo "Examples:"
  echo "  $0 dev                 # 3.1.1 → 3.1.2-dev.1"
  echo "  $0 rc                  # 3.1.2-dev.1 → 3.1.2-rc.1"
  echo "  $0 release             # 3.1.2-rc.1 → 3.1.2"
  echo "  $0 hotfix 3.1.3        # Create hotfix branch and version"
  echo ""
}

# Get current version
get_current_version() {
  cd "$PROJECT_ROOT"
  node -p "require('./package.json').version"
}

# Create development version
create_dev_version() {
  echo_step "Creating development version"
  cd "$PROJECT_ROOT"
  
  local current_version=$(get_current_version)
  echo_info "Current version: $current_version"
  
  # Check if already a dev version
  if [[ $current_version == *"-dev."* ]]; then
    # Increment dev version
    npm version prerelease --preid=dev --no-git-tag-version
  else
    # Create new dev version
    npm version minor --no-git-tag-version
    npm version prerelease --preid=dev --no-git-tag-version
  fi
  
  local new_version=$(get_current_version)
  echo_success "Development version created: $new_version"
}

# Create release candidate
create_rc_version() {
  echo_step "Creating release candidate"
  cd "$PROJECT_ROOT"
  
  local current_version=$(get_current_version)
  echo_info "Current version: $current_version"
  
  # Check if already an RC version
  if [[ $current_version == *"-rc."* ]]; then
    # Increment RC version
    npm version prerelease --preid=rc --no-git-tag-version
  elif [[ $current_version == *"-dev."* ]]; then
    # Convert dev to RC
    npm version prerelease --preid=rc --no-git-tag-version
  else
    # Create new RC from stable
    npm version patch --no-git-tag-version
    npm version prerelease --preid=rc --no-git-tag-version
  fi
  
  local new_version=$(get_current_version)
  
  # Commit and tag the RC
  git add package.json package-lock.json
  git commit -m "chore: bump version to $new_version"
  git tag "v$new_version"
  
  echo_success "Release candidate created: $new_version"
  echo_info "Tagged as: v$new_version"
}

# Create production release
create_release() {
  echo_step "Creating production release"
  cd "$PROJECT_ROOT"
  
  local current_version=$(get_current_version)
  echo_info "Current version: $current_version"
  
  # Must be from RC version
  if [[ $current_version != *"-rc."* ]]; then
    echo_error "Production release must be created from release candidate (x.x.x-rc.x)"
  fi
  
  # Remove prerelease suffix
  local base_version=$(echo $current_version | sed 's/-rc\.[0-9]*$//')
  npm version $base_version --no-git-tag-version
  
  local new_version=$(get_current_version)
  
  # Commit and tag the release
  git add package.json package-lock.json
  git commit -m "chore: release version $new_version"
  git tag "v$new_version"
  
  echo_success "Production release created: $new_version"
  echo_info "Tagged as: v$new_version"
}

# Create hotfix
create_hotfix() {
  local hotfix_version=$1
  
  if [[ -z "$hotfix_version" ]]; then
    echo_error "Hotfix version required. Usage: $0 hotfix 3.1.3"
  fi
  
  echo_step "Creating hotfix version: $hotfix_version"
  cd "$PROJECT_ROOT"
  
  # Find the latest production tag
  local latest_tag=$(git tag -l "v*" | grep -E "^v[0-9]+\.[0-9]+\.[0-9]+$" | sort -V | tail -1)
  echo_info "Latest production tag: $latest_tag"
  
  # Create hotfix branch
  local hotfix_branch="hotfix/$hotfix_version"
  git checkout -b $hotfix_branch $latest_tag
  
  # Update version
  npm version $hotfix_version --no-git-tag-version
  
  echo_success "Hotfix branch created: $hotfix_branch"
  echo_info "Version set to: $hotfix_version"
  echo_warn "Make your hotfix changes, then run './scripts/version-manager.sh release' to finalize"
}

# Main script logic
case "$1" in
  "dev")
    create_dev_version
    ;;
  "rc")
    create_rc_version
    ;;
  "release")
    create_release
    ;;
  "hotfix")
    create_hotfix "$2"
    ;;
  "current")
    echo "Current version: $(get_current_version)"
    ;;
  *)
    show_usage
    exit 1
    ;;
esac