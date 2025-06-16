#!/bin/bash
# Migration script for Wix media URL handling
# This script migrates the application from client-side to server-side URL conversion

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting migration to server-side Wix media URL conversion...${NC}"

# Step 1: Back up original files
echo "Creating backups of original files..."
cp ./components/projects/ProjectImageGallery.tsx ./components/projects/ProjectImageGallery.tsx.bak
cp ./components/projects/ProjectCard.tsx ./components/projects/ProjectCard.tsx.bak
cp ./utils/projectsService.ts ./utils/projectsService.ts.bak

# Step 2: Move new files into place
echo "Moving new implementations into place..."
mv ./components/projects/ProjectImageGallery.new.tsx ./components/projects/ProjectImageGallery.tsx
mv ./components/projects/ProjectCard.new.tsx ./components/projects/ProjectCard.tsx

# Step 3: Run type checking to ensure everything compiles
echo "Checking for TypeScript errors..."
npm run typecheck

# Check if the previous command succeeded
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Migration completed successfully!${NC}"
  echo -e "The application is now using server-side Wix media URL conversion."
  echo -e "Benefits:"
  echo -e "  - Improved performance (URLs are converted once on the server)"
  echo -e "  - Reduced client-side complexity"
  echo -e "  - Better initial page load with properly converted URLs"
  echo -e "  - Centralized error handling and caching"
else
  echo -e "${RED}Migration encountered errors. Rolling back...${NC}"
  mv ./components/projects/ProjectImageGallery.tsx.bak ./components/projects/ProjectImageGallery.tsx
  mv ./components/projects/ProjectCard.tsx.bak ./components/projects/ProjectCard.tsx
  mv ./utils/projectsService.ts.bak ./utils/projectsService.ts
  echo -e "${RED}Rollback completed. The original files have been restored.${NC}"
  exit 1
fi

# Optional cleanup of backup files if everything is working
echo "Removing backup files..."
rm ./components/projects/ProjectImageGallery.tsx.bak
rm ./components/projects/ProjectCard.tsx.bak
rm ./utils/projectsService.ts.bak

echo -e "${GREEN}All done! The application is now using server-side Wix media URL conversion.${NC}"
echo "To test the changes, run: npm run dev"
