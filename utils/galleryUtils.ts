
/**
 * Helper function to parse a JSON string or comma-separated list into an array of URLs
 * This function is Wix-agnostic and only deals with standard URLs
 * 
 * @param galleryString - String that may contain JSON or comma-separated URLs
 * @param fallbackImage - Fallback image URL if parsing fails
 * @param maxImages - Maximum number of images to return
 * @returns Array of valid image URLs
 */
export const parseGalleryString = (
  galleryString: string | undefined | null,
  fallbackImage: string | undefined | null,
  maxImages: number = 20
): string[] => {
  // Return empty array if no gallery data
  if (!galleryString) {
    return fallbackImage ? [fallbackImage] : [];
  }
  
  try {
    let urls: string[] = [];
    
    // Try to parse as JSON first
    if ((galleryString.startsWith('[') && galleryString.endsWith(']')) || 
        (galleryString.startsWith('{') && galleryString.endsWith('}'))) {
      try {
        const parsed = JSON.parse(galleryString);
        if (Array.isArray(parsed)) {
          // If it's an array, extract strings directly
          urls = parsed.filter(item => typeof item === 'string');
        }
      } catch (e) {
        console.warn('Failed to parse gallery JSON:', e);
      }
    }
    
    // If JSON parsing didn't yield results, try comma-separated
    if (urls.length === 0) {
      urls = galleryString.split(',').map(url => url.trim()).filter(url => url.length > 0);
    }
    
    // Filter out any invalid URLs
    const validUrls = urls.filter(url => url.startsWith('http') || url.startsWith('/'));
    
    // Use fallback if we have no valid URLs
    if (validUrls.length === 0 && fallbackImage) {
      return [fallbackImage];
    }
    
    // Limit image count to prevent performance issues
    return validUrls.length > maxImages ? validUrls.slice(0, maxImages) : validUrls;
  } catch (error) {
    console.error('Error parsing gallery string:', error);
    return fallbackImage ? [fallbackImage] : [];
  }
};

/**
 * Extract gallery images from a project object
 * This function is Wix-agnostic and only deals with standard URLs
 * 
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
      // console.log('Extracting gallery images from project');
      
      // Parse the Gallery field content - should already be processed by the API
      const galleryUrls = parseGalleryString(project.Gallery, null, maxImages);
      
      if (galleryUrls.length > 0) {
        return galleryUrls;
      }
    }

    // Fallback to main image if no gallery
    if (project.imageUrl && typeof project.imageUrl === 'string') {
      // ImageUrl should already be processed by the API
      return [project.imageUrl];
    }
    
    // Last resort: use local fallback images
    return localFallbackImages;
  } catch (error) {
    console.error('Error in getProjectGalleryImages:', error);
    // Return local fallback images if everything else fails
    return localFallbackImages;
  }
};
