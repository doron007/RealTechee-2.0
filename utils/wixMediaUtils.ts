/**
 * Utilities for working with Wix media URLs
 */

/**
 * Converts a Wix media URL to a standard URL that can be used in web applications
 * 
 * Based on real-world testing and observed patterns:
 * - Regular image: wix:image://v1/{mediaId}/{fileName} → https://static.wixstatic.com/media/{mediaId}
 * - SVG format:
 *   - Regular SVG: wix:image://v1/{mediaId}/{fileName}.svg → https://static.wixstatic.com/media/{mediaId}
 *   - Shapes SVG: wix:image://v1/shapes_{mediaId}/{fileName} → https://static.wixstatic.com/shapes/{mediaId}.svg
 * 
 * @param wixUrl - The Wix media URL (e.g. wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg)
 * @returns A standard URL to the media resource
 */
export function convertWixMediaUrl(wixUrl: string): string {
  // Check if this is already a fully qualified URL or invalid
  if (!wixUrl || typeof wixUrl !== 'string') {
    return wixUrl;
  }
  
  // If it's already a standard URL, return as is
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    return wixUrl;
  }
  
  // Check if it's a Wix media URL format
  if (!wixUrl.startsWith('wix:image://')) {
    return wixUrl;
  }

  try {
    // Remove the prefix
    const withoutPrefix = wixUrl.replace('wix:image://', '');
    
    // Remove any hash parameters (like #originWidth=480&originHeight=640)
    const withoutHash = withoutPrefix.split('#')[0];
    
    // Split by slash to separate components
    const parts = withoutHash.split('/');
    
    // Handle invalid format
    if (parts.length < 2) {
      console.warn('Invalid Wix URL format:', wixUrl);
      return wixUrl;
    }
    
    // Extract the media ID based on user's trial and error findings
    let mediaId;
    const versionPath = parts[0]; // Usually "v1"
    
    if (versionPath === 'v1' && parts.length >= 2) {
      // Format: wix:image://v1/mediaId/filename
      mediaId = parts[1];
    } else if (versionPath.startsWith('v1/')) {
      // Format: wix:image://v1/mediaId/...
      mediaId = versionPath.substring(3);
    } else {
      // Fallback if format is unexpected
      mediaId = parts[0];
    }
    
    // Determine URL format based on the media ID pattern and file extension
    
    // First priority: Check for 'shapes_' pattern in mediaId, which indicates an SVG shape
    if (mediaId.startsWith('shapes_')) {
      // Extract the actual ID part after 'shapes_'
      return `https://static.wixstatic.com/shapes/${mediaId.replace('shapes_', '')}.svg`;
    }
    
    // Otherwise, use the standard media URL format
    return `https://static.wixstatic.com/media/${mediaId}`;
  } catch (error) {
    console.error('Error converting Wix media URL:', error);
    return wixUrl; // Return the original URL in case of an error
  }
}

/**
 * Checks if a given URL is a Wix media URL
 * 
 * @param url - The URL to check
 * @returns True if the URL is a Wix media URL, false otherwise
 */
export function isWixMediaUrl(url: string): boolean {
  return typeof url === 'string' && url.startsWith('wix:image://');
}

/**
 * Get image dimensions from a Wix URL if available
 * Extracts dimensions from the hash parameters in the URL (#originWidth=480&originHeight=640)
 * 
 * @param wixUrl - The Wix media URL
 * @returns Object with width and height if available, empty object otherwise
 */
export function getWixImageDimensions(wixUrl: string): { width?: number; height?: number } {
  // Check if URL is valid
  if (!wixUrl || typeof wixUrl !== 'string') {
    return {};
  }
  
  try {
    // Check if there's a hash with parameters
    const hashPart = wixUrl.split('#')[1];
    if (!hashPart) {
      return {};
    }
    
    // Parse parameters
    const params = new URLSearchParams(hashPart);
    
    // Try to get width and height from different possible parameter names
    const width = parseInt(
      params.get('originWidth') || 
      params.get('width') || 
      params.get('w') || 
      '', 
      10
    );
    
    const height = parseInt(
      params.get('originHeight') || 
      params.get('height') || 
      params.get('h') || 
      '', 
      10
    );
    
    return {
      width: isNaN(width) ? undefined : width,
      height: isNaN(height) ? undefined : height
    };
  } catch (error) {
    console.error('Error parsing dimensions from Wix URL:', error);
    return {};
  }
}

/**
 * Optimize Wix image URL with width, height, quality and other transformation parameters
 * Uses Wix's image service parameters to transform images
 * 
 * @param url - The standard Wix image URL (already converted from wix:image:// format)
 * @param options - Transformation options
 * @returns Optimized image URL with transformation parameters
 */
export interface WixImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpg' | 'jpeg' | 'png' | 'webp' | 'auto';
  fit?: 'crop' | 'fill' | 'inside' | 'outside';
}

/**
 * Optimizes a Wix image URL with transformations like resizing, quality adjustments, and format conversion
 * 
 * @param url - The standard Wix image URL (already converted from wix:image:// format)
 * @param options - Transformation options
 * @returns Optimized image URL with transformation parameters
 */
export function optimizeWixImage(url: string, options: WixImageOptions = {}): string {
  // Only process valid URLs that are from Wix static domain
  if (!url || typeof url !== 'string' || !url.includes('wixstatic.com')) {
    return url;
  }
  
  try {
    // Initialize parameters array
    const params: string[] = [];
    
    // Add dimensions if specified
    if (options.width) {
      params.push(`w_${options.width}`);
    }
    
    if (options.height) {
      params.push(`h_${options.height}`);
    }
    
    // Add quality if specified (1-100)
    if (options.quality && options.quality >= 1 && options.quality <= 100) {
      params.push(`q_${options.quality}`);
    }
    
    // Add image format if specified
    if (options.format) {
      params.push(`f_${options.format}`);
    }
    
    // Add fit parameter if specified
    if (options.fit) {
      params.push(`c_${options.fit}`);
    }
    
    // If we have parameters to add
    if (params.length > 0) {
      // Don't optimize SVG files - they don't support these transformations
      if (url.includes('.svg') || url.includes('/shapes/')) {
        return url;
      }
      
      // Check if URL already has image service transformation parameters
      if (url.includes('/image/v1/')) {
        // URL already has transformation parameters, update them
        const baseUrl = url.split('/image/v1/')[0];
        const imagePath = url.split('/image/v1/')[1].split('/')[1];
        return `${baseUrl}/image/v1/${params.join(',')}/cm/${imagePath}`;
      } else {
        // Standard URL without parameters, insert parameters
        // Extract the domain and path
        const urlParts = url.split('/media/');
        
        if (urlParts.length === 2) {
          return `${urlParts[0]}/image/v1/${params.join(',')}/cm/${urlParts[1]}`;
        }
      }
    }
    
    // Return original URL if no transformations
    return url;
  } catch (error) {
    console.error('Error optimizing Wix image URL:', error);
    return url;
  }
}

/**
 * Combines conversion and optimization in one step
 * First converts a Wix media URL to standard format, then applies optimization
 * 
 * @param wixUrl - The original Wix media URL (wix:image:// format)
 * @param options - Transformation options for optimization
 * @returns Optimized standard URL
 */
export function getOptimizedWixImage(wixUrl: string, options: WixImageOptions = {}): string {
  // First convert the Wix URL to standard URL
  const standardUrl = convertWixMediaUrl(wixUrl);
  
  // Then optimize it with the provided options
  return optimizeWixImage(standardUrl, options);
}