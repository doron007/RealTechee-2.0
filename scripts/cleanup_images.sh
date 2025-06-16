#!/bin/bash

# Create directories for organized cleanup
echo "Creating directories for cleanup..."
mkdir -p "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/icons"
mkdir -p "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/images"
mkdir -p "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/logos"
mkdir -p "/Users/doron/Projects/RealTechee 2.0/public/_delete/unused"

# 1. Move the actions directory if it exists and has files
if [ -d "/Users/doron/Projects/RealTechee 2.0/public/actions" ] && [ "$(ls -A /Users/doron/Projects/RealTechee 2.0/public/actions)" ]; then
  echo "Moving unused /public/actions directory..."
  mkdir -p "/Users/doron/Projects/RealTechee 2.0/public/_delete/unused/actions"
  cp -R "/Users/doron/Projects/RealTechee 2.0/public/actions/"* "/Users/doron/Projects/RealTechee 2.0/public/_delete/unused/actions/"
  rm -rf "/Users/doron/Projects/RealTechee 2.0/public/actions"
  echo "Successfully moved actions directory to _delete"
else
  echo "No actions directory found or it's empty - skipping"
fi

# 2. Handle duplicate step icon files
echo "Moving duplicate step icon files..."
# Keep /public/assets/icons/steps as canonical, move others to _delete
for i in {1..6}; do
  # Check if root icons directory has the step icons
  if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/step${i}-icon.svg" ]; then
    cp "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/step${i}-icon.svg" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/icons/"
    rm "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/step${i}-icon.svg"
    echo "Moved duplicate step${i}-icon.svg from root icons directory"
  fi
  
  # Check if shared directory has the step icons
  if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/shared/step${i}-icon.svg" ]; then
    cp "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/shared/step${i}-icon.svg" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/icons/"
    rm "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/shared/step${i}-icon.svg"
    echo "Moved duplicate step${i}-icon.svg from shared directory"
  fi
done

# 3. Handle duplicate utility icons
echo "Moving duplicate utility icons..."
for icon in "arrow-right.svg" "button-arrow.svg" "home-value.svg" "live-update.svg" "play.svg" "renovation-cost.svg" "top-experts.svg"; do
  # Keep /assets/icons/shared as canonical, move the root ones to _delete
  if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/${icon}" ] && [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/shared/${icon}" ]; then
    cp "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/${icon}" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/icons/"
    rm "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/${icon}"
    echo "Moved duplicate ${icon} from root icons directory"
  fi
done

# 4. Handle duplicate who-we-serve icons
echo "Moving duplicate who-we-serve icons..."
if [ -d "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/shared/who-we-serve" ] && [ -d "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/who-we-serve" ]; then
  mkdir -p "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/icons/who-we-serve"
  cp -R "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/who-we-serve/"* "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/icons/who-we-serve/"
  rm -rf "/Users/doron/Projects/RealTechee 2.0/public/assets/icons/who-we-serve"
  echo "Moved duplicate who-we-serve directory to _delete"
fi

# 5. Handle duplicate partner logos
echo "Moving duplicate partner logos..."
for i in {1..4}; do
  if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/partner-logo-${i}.png" ]; then
    cp "/Users/doron/Projects/RealTechee 2.0/public/assets/images/partner-logo-${i}.png" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/images/"
    rm "/Users/doron/Projects/RealTechee 2.0/public/assets/images/partner-logo-${i}.png"
    echo "Moved duplicate partner-logo-${i}.png to _delete"
  fi
done

# 6. Handle duplicate project images
echo "Moving duplicate project images..."
for i in {1..5}; do
  # Move from root /assets/images to _delete
  if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/project-image${i}.png" ]; then
    cp "/Users/doron/Projects/RealTechee 2.0/public/assets/images/project-image${i}.png" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/images/"
    rm "/Users/doron/Projects/RealTechee 2.0/public/assets/images/project-image${i}.png"
    echo "Moved duplicate project-image${i}.png from root images directory"
  fi
  
  # Move from /assets/images/shared to _delete
  if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/shared/project-image${i}.png" ]; then
    cp "/Users/doron/Projects/RealTechee 2.0/public/assets/images/shared/project-image${i}.png" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/images/"
    rm "/Users/doron/Projects/RealTechee 2.0/public/assets/images/shared/project-image${i}.png"
    echo "Moved duplicate project-image${i}.png from shared directory"
  fi
done

# 7. Handle duplicate CTA background
echo "Moving duplicate CTA background..."
if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/cta-background.jpg" ]; then
  cp "/Users/doron/Projects/RealTechee 2.0/public/assets/images/cta-background.jpg" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/images/"
  rm "/Users/doron/Projects/RealTechee 2.0/public/assets/images/cta-background.jpg"
  echo "Moved duplicate cta-background.jpg to _delete"
fi

# 8. Handle duplicate home pages for buyers and sellers
echo "Moving duplicate buyer/seller home pages..."
if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/buyer-home.jpg" ]; then
  cp "/Users/doron/Projects/RealTechee 2.0/public/assets/images/buyer-home.jpg" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/images/"
  rm "/Users/doron/Projects/RealTechee 2.0/public/assets/images/buyer-home.jpg"
  echo "Moved duplicate buyer-home.jpg to _delete"
fi

if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/seller-home.jpg" ]; then
  cp "/Users/doron/Projects/RealTechee 2.0/public/assets/images/seller-home.jpg" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/images/"
  rm "/Users/doron/Projects/RealTechee 2.0/public/assets/images/seller-home.jpg"
  echo "Moved duplicate seller-home.jpg to _delete"
fi

# 9. Handle duplicate logo files
echo "Moving duplicate logo files..."
# Small logo duplicates
if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/brand/logos/Small logo 118x16.png" ] && [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/brand/logos/web/Small logo 118x16.png" ]; then
  cp "/Users/doron/Projects/RealTechee 2.0/public/assets/images/brand/logos/Small logo 118x16.png" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/logos/"
  rm "/Users/doron/Projects/RealTechee 2.0/public/assets/images/brand/logos/Small logo 118x16.png"
  echo "Moved duplicate Small logo 118x16.png to _delete"
fi

# Logo alternative duplicates
if [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/brand/logos/Logo alternative 39x48.png" ] && [ -f "/Users/doron/Projects/RealTechee 2.0/public/assets/images/brand/logos/web/Logo alternative 39x48.png" ]; then
  cp "/Users/doron/Projects/RealTechee 2.0/public/assets/images/brand/logos/Logo alternative 39x48.png" "/Users/doron/Projects/RealTechee 2.0/public/_delete/duplicates/logos/"
  rm "/Users/doron/Projects/RealTechee 2.0/public/assets/images/brand/logos/Logo alternative 39x48.png"
  echo "Moved duplicate Logo alternative 39x48.png to _delete"
fi

echo "Image cleanup completed successfully!"
echo "All duplicates have been moved to /public/_delete/duplicates/"
echo "Please review before permanently deleting these files."
