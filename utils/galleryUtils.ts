import { createLogger } from './logger';
import { getFullUrlFromPath } from './s3Utils';

const logger = createLogger('GalleryUtils');

/**
 * Helper function to parse a JSON string or comma-separated list into an array of URLs
 * Handles both simple URL arrays and complex gallery objects with src properties
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
          // Handle array of gallery objects or array of strings
          urls = parsed.map(item => {
            if (typeof item === 'string') {
              return item.trim(); // Handles ["/assets/..."]
            } else if (typeof item === 'object' && item.src) {
              return item.src;
            }
            return null;
          }).filter(url => url && typeof url === 'string');
        }
      } catch (e) {
        logger.warn('Failed to parse gallery JSON', e);
      }
    }

    // If JSON parsing didn't yield results, try comma-separated
    if (urls.length === 0) {
      // Remove brackets if present, then split
      let cleaned = galleryString.trim();
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        cleaned = cleaned.slice(1, -1);
      }
      urls = cleaned.split(',').map(url => url.trim()).filter(url => url.length > 0);
    }

    // Filter out any invalid URLs
    let validUrls = urls.filter(url => url.startsWith('http') || url.startsWith('/'));

    // Append base URL to relative paths
    validUrls = validUrls.map(url => url.startsWith('/') ? getFullUrlFromPath(url) : url);

    // Use fallback if we have no valid URLs
    if (validUrls.length === 0 && fallbackImage) {
      return [fallbackImage];
    }

    // Limit image count to prevent performance issues
    return validUrls.length > maxImages ? validUrls.slice(0, maxImages) : validUrls;
  } catch (error) {
    logger.error('Error parsing gallery string', error);
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
    // Try to use the gallery field (check both lowercase and uppercase variations)
    const galleryData = project.gallery || project.Gallery;
    if (galleryData && typeof galleryData === 'string') {
      logger.debug('Extracting gallery images from project', { 
        galleryDataLength: galleryData.length 
      });
      
      // Parse the gallery field content - should already be processed by the API
      const galleryUrls = parseGalleryString(galleryData, null, maxImages);
      logger.info('Gallery URLs parsed successfully', { 
        imageCount: galleryUrls.length 
      });
      
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
    logger.error('Error in getProjectGalleryImages', error);
    // Return local fallback images if everything else fails
    return localFallbackImages;
  }
};
