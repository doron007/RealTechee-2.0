#!/bin/bash

echo "Starting empty directory cleanup..."

# List of directories to ignore (don't remove these even if empty)
IGNORE_DIRS=(
  ".git"
  ".next"
  "node_modules"
  ".vscode"
  "_delete" # The _delete directory itself should stay, even if empty
)

# Function to check if a directory should be ignored
should_ignore() {
  local path="$1"
  for ignore in "${IGNORE_DIRS[@]}"; do
    if [[ "$path" == *"/$ignore"* ]]; then
      return 0 # True, should ignore
    fi
  done
  return 1 # False, don't ignore
}

# Function to safely delete empty directories
remove_empty_dirs() {
  local base_dir="$1"
  
  # Find all empty directories, sort by depth (deepest first)
  find "$base_dir" -type d -empty | sort -r | while read -r dir; do
    if ! should_ignore "$dir"; then
      echo "Removing empty directory: $dir"
      rmdir "$dir"
    fi
  done
}

# Main project directory
PROJECT_DIR="/Users/doron/Projects/RealTechee 2.0"

# Remove empty directories in public
echo "Cleaning public directory..."
remove_empty_dirs "$PROJECT_DIR/public"

# Remove empty directories in components
echo "Cleaning components directory..."
remove_empty_dirs "$PROJECT_DIR/components"

echo "Empty directory cleanup completed!"
