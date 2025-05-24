#!/bin/bash
# Script to update galleryUtils.ts to use server-side Wix media processing

# Back up the original file
cp /Users/doron/Projects/RealTechee\ 2.0/utils/galleryUtils.ts /Users/doron/Projects/RealTechee\ 2.0/utils/galleryUtils.ts.bak

# Create the new file with updated implementation
cat > /Users/doron/Projects/RealTechee\ 2.0/utils/galleryUtils.ts << 'EOL'
// filepath: /Users/doron/Projects/RealTechee 2.0/utils/galleryUtils.ts
import { safeImageUrl, processImageGallery } from './clientWixMediaUtils';

/**
 * Process gallery image strings into validated image URLs
 * Using server-side processing via client utilities
 * @param galleryString - Comma-separated string of image URLs or JSON data
 * @param fallbackImage - Fallback image URL if gallery processing fails
 * @param maxImages - Maximum number of images
 * @returns Array of validated image URLs
 */
export const processGalleryImages = async (
  galleryString: string | undefined | null,
  fallbackImage: string | undefined | null,
  maxImages: number = 20
): Promise<string[]> => {
  // Return empty array if no gallery data
  if (!galleryString) {
    return fallbackImage ? [fallbackImage] : [];
  }
  
  try {
    console.log('Processing gallery via server-side utilities');
    
    // Use the new server-side API to process the entire gallery data at once
    const processedUrls = await processImageGallery(galleryString);
    
    // If we have no valid images after processing, use the fallback
    if (!processedUrls || processedUrls.length === 0) {
      return fallbackImage ? [fallbackImage] : [];
    }
    
    // Limit image count to prevent performance issues
    if (processedUrls.length > maxImages) {
      console.warn(`Too many images (${processedUrls.length}), limiting to ${maxImages}`);
      return processedUrls.slice(0, maxImages);
    }
    
    return processedUrls;
  } catch (error) {
    console.error('Error processing gallery images:', error);
    // Fallback to main image if gallery processing fails
    return fallbackImage ? [fallbackImage] : [];
  }
};

/**
 * Process a project's gallery data
 * @param project - Project object with gallery and image data
 * @param maxImages - Maximum number of images to return
 * @returns Array of validated image URLs
 */
export const getProjectGalleryImages = async (
  project: any, 
  maxImages: number = 20
): Promise<string[]> => {
  if (!project) return [];

  const localFallbackImages = [
    '/assets/images/hero-bg.png',
    '/assets/images/properties/property-1.jpg',
    '/assets/images/properties/property-2.jpg',
    '/assets/images/properties/property-3.jpg',
    '/assets/images/properties/property-4.jpg'
  ];

  try {
    // Try to use the Gallery field which should contain our image data
    if (project.Gallery && typeof project.Gallery === 'string') {
      console.log('Processing project gallery via server-side API');
      
      // Use the new server-side processing for the entire gallery
      const processedGallery = await processImageGallery(project.Gallery);
      
      if (Array.isArray(processedGallery) && processedGallery.length > 0) {
        // Limit to maxImages
        return processedGallery.slice(0, maxImages);
      }
    }

    // Fallback to main image if no gallery
    if (project.imageUrl) {
      const safeUrl = await safeImageUrl(project.imageUrl);
      return [safeUrl];
    } else if (project.Image) {
      const safeUrl = await safeImageUrl(project.Image);
      return [safeUrl];
    }
    
    // Last resort: use local fallback images
    return localFallbackImages;
  } catch (error) {
    console.error('Error in getProjectGalleryImages:', error);
    // Return local fallback images if everything else fails
    return localFallbackImages;
  }
};
EOL

echo "Updated galleryUtils.ts to use server-side processing"
