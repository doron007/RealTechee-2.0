#!/bin/bash

echo "Starting asset flattening process..."

# Base paths
BASE_DIR="/Users/doron/Projects/RealTechee 2.0"
ASSETS_DIR="${BASE_DIR}/public/assets"
BACKUP_DIR="${BASE_DIR}/public/_delete/assets_backup_$(date +%Y%m%d_%H%M%S)"

# Create backup of current assets
echo "Creating backup of current assets structure..."
mkdir -p "${BACKUP_DIR}"
cp -R "${ASSETS_DIR}"/* "${BACKUP_DIR}/"

# Create destination directories
echo "Setting up new directory structure..."
mkdir -p "${ASSETS_DIR}/icons_new"
mkdir -p "${ASSETS_DIR}/images_new"
mkdir -p "${ASSETS_DIR}/logos_new"
# Keep fonts structure as-is

# Process icons
echo "Processing icons..."
find "${ASSETS_DIR}/icons" -type f \( -name "*.svg" -o -name "*.png" \) | while read -r file; do
  # Get relative path and filename
  rel_path="${file#${ASSETS_DIR}/icons/}"
  filename=$(basename "$file")
  extension="${filename##*.}"
  basename="${filename%.*}"
  
  # Create prefix from directory structure
  prefix=""
  dir_path=$(dirname "${rel_path}")
  if [ "$dir_path" != "." ]; then
    # Replace directory separators with underscores
    prefix=$(echo "${dir_path}" | sed 's|/|_|g')
    prefix="${prefix}_"
  fi
  
  # Create new filename
  new_name="${prefix}${basename}.${extension}"
  
  echo "Moving $filename to icons_new/$new_name"
  cp "$file" "${ASSETS_DIR}/icons_new/${new_name}"
done

# Process images
echo "Processing images..."
find "${ASSETS_DIR}/images" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -o -name "*.webp" -o -name "*.svg" \) | while read -r file; do
  # Get relative path and filename
  rel_path="${file#${ASSETS_DIR}/images/}"
  filename=$(basename "$file")
  extension="${filename##*.}"
  basename="${filename%.*}"
  
  # Create prefix from directory structure
  prefix=""
  dir_path=$(dirname "${rel_path}")
  if [ "$dir_path" != "." ]; then
    # Replace directory separators with underscores
    prefix=$(echo "${dir_path}" | sed 's|/|_|g')
    prefix="${prefix}_"
  fi
  
  # Create new filename
  new_name="${prefix}${basename}.${extension}"
  
  echo "Moving $filename to images_new/$new_name"
  cp "$file" "${ASSETS_DIR}/images_new/${new_name}"
done

# Process logos
echo "Processing logos..."
# First, collect logos from the dedicated logos directory
find "${ASSETS_DIR}/logos" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.svg" \) | while read -r file; do
  # Get relative path and filename
  rel_path="${file#${ASSETS_DIR}/logos/}"
  filename=$(basename "$file")
  extension="${filename##*.}"
  basename="${filename%.*}"
  
  # Create prefix from directory structure
  prefix=""
  dir_path=$(dirname "${rel_path}")
  if [ "$dir_path" != "." ]; then
    # Replace directory separators with underscores
    prefix=$(echo "${dir_path}" | sed 's|/|_|g')
    prefix="${prefix}_"
  fi
  
  # Create new filename
  new_name="${prefix}${basename}.${extension}"
  
  echo "Moving $filename to logos_new/$new_name"
  cp "$file" "${ASSETS_DIR}/logos_new/${new_name}"
done

# Then collect logos from brand/logos
find "${ASSETS_DIR}/images/brand/logos" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.svg" \) 2>/dev/null | while read -r file; do
  # Get relative path and filename
  rel_path="${file#${ASSETS_DIR}/images/brand/logos/}"
  filename=$(basename "$file")
  extension="${filename##*.}"
  basename="${filename%.*}"
  
  # Create prefix from directory structure
  prefix=""
  dir_path=$(dirname "${rel_path}")
  if [ "$dir_path" != "." ]; then
    # Replace directory separators with underscores
    prefix=$(echo "${dir_path}" | sed 's|/|_|g')
    prefix="${prefix}_"
  fi
  
  # Create new filename
  new_name="${prefix}${basename}.${extension}"
  
  echo "Moving $filename to logos_new/$new_name"
  cp "$file" "${ASSETS_DIR}/logos_new/${new_name}"
done

# Once all files are copied, swap the directories
echo "Finalizing directory structure..."
# Rename old directories
mv "${ASSETS_DIR}/icons" "${ASSETS_DIR}/icons_old" || echo "No icons directory to move"
mv "${ASSETS_DIR}/images" "${ASSETS_DIR}/images_old" || echo "No images directory to move"
mv "${ASSETS_DIR}/logos" "${ASSETS_DIR}/logos_old" || echo "No logos directory to move"

# Rename new directories
mv "${ASSETS_DIR}/icons_new" "${ASSETS_DIR}/icons" || echo "Failed to move icons_new"
mv "${ASSETS_DIR}/images_new" "${ASSETS_DIR}/images" || echo "Failed to move images_new"
mv "${ASSETS_DIR}/logos_new" "${ASSETS_DIR}/logos" || echo "Failed to move logos_new"

# Move old directories to backup
echo "Moving old directories to backup..."
mkdir -p "${BACKUP_DIR}/icons_old"
mkdir -p "${BACKUP_DIR}/images_old"
mkdir -p "${BACKUP_DIR}/logos_old"

# Move old directories to backup if they exist
if [ -d "${ASSETS_DIR}/icons_old" ]; then
  cp -r "${ASSETS_DIR}/icons_old/"* "${BACKUP_DIR}/icons_old/" 2>/dev/null || echo "No files to copy from icons_old"
  rm -rf "${ASSETS_DIR}/icons_old"
fi

if [ -d "${ASSETS_DIR}/images_old" ]; then
  cp -r "${ASSETS_DIR}/images_old/"* "${BACKUP_DIR}/images_old/" 2>/dev/null || echo "No files to copy from images_old"
  rm -rf "${ASSETS_DIR}/images_old"
fi

if [ -d "${ASSETS_DIR}/logos_old" ]; then
  cp -r "${ASSETS_DIR}/logos_old/"* "${BACKUP_DIR}/logos_old/" 2>/dev/null || echo "No files to copy from logos_old"
  rm -rf "${ASSETS_DIR}/logos_old"
fi

echo "Asset flattening complete!"
echo "The backup of your original assets is stored at: ${BACKUP_DIR}"
echo ""
echo "Next steps:"
echo "1. Test your application to ensure all assets are loading correctly"
echo "2. Update any import paths in your code that reference the old paths"
echo "3. Once everything is working, you can delete the backup at ${BACKUP_DIR}"
