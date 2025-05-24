import axios from 'axios';

const loggedUrls = new Set<string>(); // Ensure loggedUrls is defined

/**
 * Utilities for working with Wix media URLs
 */

/**
 * Verifies if a given URL is accessible by making a HEAD request.
 * @param url - The URL to verify.
 * @returns A promise that resolves to true if the URL is accessible, false otherwise.
 */
async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    // For Wix URLs, skip the check since we're getting 403 errors but images work with <img> tags
    if (url.includes('wixstatic.com')) {
      // We assume Wix URLs will work when used directly in img tags
      // This is to bypass 403 errors during HEAD requests but allow browser to attempt loading
      return true;
    }
    
    const response = await axios.head(url, {
      timeout: 3000, // 3 second timeout to avoid hanging requests
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (compatible; RealTechee/1.0)'
      }
    });
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    console.warn('URL accessibility check failed:', url);
    return false;
  }
}

/**
 * Converts a Wix media URL to a standard URL that can be used in web applications
 * 
 * Based on real-world testing and observed patterns:
 * - Regular image: wix:image://v1/{mediaId}/{fileName} → https://static.wixstatic.com/media/{mediaId}
 * - SVG format:
 *   - Regular SVG: wix:image://v1/{mediaId}/{fileName}.svg → https://static.wixstatic.com/media/{mediaId}
 *   - Shapes SVG: wix:image://v1/shapes_{mediaId}/{fileName} → https://static.wixstatic.com/shapes/{mediaId}.svg
 * - JSON slug format: {"slug":"mediaId"} → https://static.wixstatic.com/media/mediaId
 * - JSON array format: [{"description":"...","uri":"wix:image://v1/mediaId/..."}] → https://static.wixstatic.com/media/mediaId
 * 
 * @param wixUrl - The Wix media URL (e.g. wix:image://v1/daeed6_265c29464acb4f0689fef1333bdde83c~mv2.jpg/27.jpg)
 * @returns A standard URL to the media resource
 */
export async function convertWixMediaUrl(wixUrl: string): Promise<string> {
  // Check if this is already a fully qualified URL or invalid
  if (!wixUrl || typeof wixUrl !== 'string') {
    console.warn('convertWixMediaUrl received invalid input:', wixUrl);
    return '/assets/images/placeholder.jpg'; // Return a placeholder instead of invalid input
  }
  
  // If it's already a standard URL, return as is
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    return wixUrl;
  }
  
  // Structured logging to avoid repetitive logs
  const loggedUrls = new Set<string>();

  if (!loggedUrls.has(wixUrl)) {
    console.log('Processing Wix URL:', wixUrl);
    loggedUrls.add(wixUrl);
  }
  
  // Add debug logging to track URL transformations
  // console.log('Processing Wix URL:', wixUrl);
  
  // Handle JSON array format with broken JSON
  if ((wixUrl.startsWith('[') || wixUrl.startsWith('{'))) {
    try {
      // console.log('Detected JSON format in wixUrl');
      
      // Simple regex-based approach for common patterns
      
      // Extract URI from JSON with description
      const uriMatch = wixUrl.match(/"uri":"([^"]+)"/);
      if (uriMatch && uriMatch[1]) {
        // If we found a URI that's a Wix URL, process it recursively
        if (uriMatch[1].startsWith('wix:image://')) {
          const nestedResult = await convertWixMediaUrl(uriMatch[1]);
          // console.log('Extracted and converted nested Wix URL:', nestedResult);
          return nestedResult;
        } else if (uriMatch[1].startsWith('http')) {
          return uriMatch[1];
        }
      }
    } catch (e) {
      console.warn('Failed to process JSON format:', e);
    }
  }      // Check for JSON slug format
      if (wixUrl.includes('"slug"')) {
      // Try to extract the slug value using regex
      const slugMatch = wixUrl.match(/"slug":"([^"]+)"/);
      if (slugMatch && slugMatch[1]) {
        // Preserve the full slug including any file extension
        const slug = slugMatch[1];
        
        // Check if the slug needs the ~mv2.jpg suffix
        if (!slug.includes('~mv2') && !slug.match(/\.(jpe?g|png|gif|webp|svg)$/i)) {
          // No tilde and no extension, add them
          if (slug.match(/^[a-f0-9_]+$/i)) {
            // Looks like a raw media ID, add the tilde and extension
            const resultUrl = `https://static.wixstatic.com/media/${slug}~mv2.jpg`;
            // console.log('Converted slug to URL with extension:', resultUrl);
            return resultUrl;
          }
        }
        
        // Don't modify the slug at all - preserve tilde and extensions exactly as they are
        const resultUrl = `https://static.wixstatic.com/media/${slug}`;
        // console.log('Converted slug to URL:', resultUrl);
        return resultUrl;
      }
        
        // If regex fails, try as JSON (fallback)
        try {
          const jsonData = JSON.parse(wixUrl);
          if (jsonData && jsonData.slug) {
            const slug = jsonData.slug;
            const resultUrl = `https://static.wixstatic.com/media/${slug}`;
            // console.log('Converted slug using JSON parse to:', resultUrl);
            return resultUrl;
          }
        } catch (e) {
          console.warn('JSON parse failed for slug format:', e);
        }
      }
  
  // Check if it's a Wix media URL format
  if (!wixUrl.startsWith('wix:image://')) {
    // console.log('Not a Wix format URL, returning as-is:', wixUrl);
    return wixUrl;
  }

  try {
    // Remove the prefix but keep the rest intact
    const withoutPrefix = wixUrl.replace('wix:image://', '');
    
    // Remove any hash parameters (like #originWidth=480&originHeight=640)
    const withoutHash = withoutPrefix.split('#')[0];
    
    // Split by slash to separate components
    const parts = withoutHash.split('/');
    
    // Handle invalid format
    if (parts.length < 1) {
      console.warn('Invalid Wix URL format:', wixUrl);
      return '/assets/images/placeholder.jpg';
    }
    
    // Extract media ID and file extension with a simplified approach
    let mediaId = '';
    let fileExtension = '';
    
    // For URLs in format: wix:image://v1/12345/filename.jpg
    if (parts[0] === 'v1' && parts.length >= 2) {
      mediaId = parts[1];
      
      // Check if mediaId includes file extension
      const extMatch = mediaId.match(/\.(jpe?g|png|gif|webp|svg)$/i);
      if (!extMatch && parts.length >= 3) {
        const filename = parts[parts.length - 1];
        const filenameExtMatch = filename.match(/\.(jpe?g|png|gif|webp|svg)$/i);
        if (filenameExtMatch) {
          fileExtension = '';  // Don't add extension, it's already in the filename
        } else {
          fileExtension = '.jpg'; // Default to .jpg if no extension is found
        }
      } else if (!extMatch) {
        fileExtension = '.jpg'; // Default to .jpg if no extension is found
      }
    } 
    // For other formats or simplified processing
    else {
      mediaId = parts[0];
    }
    
    // SVG special handling
    if (mediaId.startsWith('shapes_')) {
      return `https://static.wixstatic.com/shapes/${mediaId.replace('shapes_', '')}.svg`;
    }
    
    // Standard media format - keep exactly as is
    // Check if the mediaId contains tilde and file extension
    if (mediaId.match(/mv2$/i) && !mediaId.includes('~')) {
      // Add tilde and default extension if missing
      mediaId = `${mediaId}~mv2.jpg`;
    } else if (mediaId.match(/^[a-f0-9_]+mv2$/i) && !mediaId.includes('~')) {
      // Add tilde and default extension
      mediaId = `${mediaId}~mv2.jpg`;
    } else if (!mediaId.includes('~mv2') && !mediaId.match(/\.(jpe?g|png|gif|webp|svg)$/i)) {
      // Add tilde and default extension for raw media IDs
      mediaId = `${mediaId}~mv2.jpg`;
    }
    
    // Log transformation details only once per URL
    if (!loggedUrls.has(mediaId)) {
      console.log('Transformed mediaId:', mediaId);
      console.log('Final constructed URL:', `https://static.wixstatic.com/media/${mediaId}${fileExtension}`);
      loggedUrls.add(mediaId);
    }
    
    try {
      // Construct the URL as before
      const constructedUrl = `https://static.wixstatic.com/media/${mediaId}${fileExtension}`;

      // Add cache busting to prevent 403 errors
      const finalUrl = `${constructedUrl}?cb=${Date.now()}`;

      // Verify URL accessibility
      const isAccessible = await isUrlAccessible(finalUrl);
      if (!isAccessible) {
        console.warn('Constructed URL is inaccessible, falling back to placeholder:', finalUrl);
        return '/assets/images/placeholder.jpg';
      }

      return finalUrl;
    } catch (error) {
      console.error('Error converting Wix media URL:', error);
      return '/assets/images/placeholder.jpg'; // Return a placeholder in case of error
    }
  } catch (error) {
    console.error('Error converting Wix media URL:', error);
    return '/assets/images/placeholder.jpg'; // Return a placeholder in case of error
  }
}

/**
 * Checks if a given URL is a Wix media URL
 * 
 * @param url - The URL to check
 * @returns True if the URL is a Wix media URL or JSON format, false otherwise
 */
export function isWixMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    console.warn('isWixMediaUrl received invalid input:', url);
    return false;
  }
  
  // Handle the specific problematic format that was causing errors
  if (url.startsWith('[{"description":')) {
    return true; // Identify it as Wix so we can handle it safely
  }
  
  // Check for wix:image protocol
  if (url.startsWith('wix:image://')) {
    return true;
  }
  
  // Check for JSON slug format
  if (url.includes('"slug"')) {
    return true;
  }
  
  // Check for JSON format (could be array or object)
  if ((url.startsWith('{') && url.endsWith('}')) || 
      (url.startsWith('[') && url.endsWith(']'))) {
    return true;
  }
  
  // Additional check for potential Wix URLs (might be incomplete URLs)
  if (url.includes('wixstatic.com')) {
    return true;
  }
  
  return false;
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
 * @returns A promise that resolves to the optimized standard URL.
 */
export async function getOptimizedWixImage(wixUrl: string, options: WixImageOptions = {}): Promise<string> {
  // First convert the Wix URL to standard URL
  const standardUrl = await convertWixMediaUrl(wixUrl);

  // Then optimize it with the provided options
  return optimizeWixImage(standardUrl, options);
}

/**
 * Enhanced extractImageFromJsonArray - Helper function to extract image URL from JSON array format
 * 
 * @param jsonString - The JSON string that may contain image data
 * @returns A promise that resolves to a valid image URL if found, or null if not.
 */
async function extractImageFromJsonArray(jsonString: string): Promise<string | null> {
  try {
    // Try parsing the JSON
    const parsed = JSON.parse(jsonString);

    // Handle array format
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        // Look for common image URL patterns in the object
        if (item.uri && typeof item.uri === 'string') {
          if (item.uri.startsWith('wix:image://')) {
            // If it's a Wix image URL, process it recursively
            return await convertWixMediaUrl(item.uri);
          } else if (item.uri.startsWith('http')) {
            // If it's already a standard URL, return it
            return item.uri;
          }
        }

        // Check for image URL properties
        if (item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
          return item.url;
        }

        // Check for image src properties
        if (item.src && typeof item.src === 'string' && item.src.startsWith('http')) {
          return item.src;
        }

        // Check for Wix media ID
        if (item.mediaId && typeof item.mediaId === 'string') {
          const mediaId = item.mediaId;
          // Check if the mediaId contains tilde and file extension
          if (!mediaId.includes('~mv2') && !mediaId.match(/\.(jpe?g|png|gif|webp|svg)$/i)) {
            // No tilde and no extension, add them
            if (mediaId.match(/^[a-f0-9_]+$/i)) {
              // Looks like a raw media ID, add the tilde and extension
              return `https://static.wixstatic.com/media/${mediaId}~mv2.jpg`;
            }
          }
          return `https://static.wixstatic.com/media/${mediaId}`;
        }

        // Check for image path properties
        if (item.path && typeof item.path === 'string' && item.path.startsWith('http')) {
          return item.path;
        }
      }
    }

    // Handle single object format
    if (parsed && typeof parsed === 'object') {
      if (parsed.uri && typeof parsed.uri === 'string') {
        if (parsed.uri.startsWith('wix:image://')) {
          return await convertWixMediaUrl(parsed.uri);
        } else if (parsed.uri.startsWith('http')) {
          return parsed.uri;
        }
      }

      // Check common URL properties
      if (parsed.url && typeof parsed.url === 'string' && parsed.url.startsWith('http')) {
        return parsed.url;
      }
      
      if (parsed.src && typeof parsed.src === 'string' && parsed.src.startsWith('http')) {
        return parsed.src;
      }
      
      if (parsed.path && typeof parsed.path === 'string' && parsed.path.startsWith('http')) {
        return parsed.path;
      }
    }
  } catch (e) {
    console.warn('Failed to parse JSON in extractImageFromJsonArray:', e);
  }
  
  return null;
}

/**
 * A simple function to safely handle potential JSON format image URLs
 * This is used as a safety net before passing any URL to the next/image component
 * 
 * @param imageUrl - The URL string that might be malformed JSON
 * @returns A promise that resolves to a valid image URL or a placeholder.
 */
// Cache to avoid repeated processing of the same URL
const urlCache = new Map<string, string>();

export async function safeImageUrl(imageUrl: string): Promise<string> {
  // If it's not a string or empty, return a placeholder
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '/assets/images/placeholder.jpg';
  }
  
  // Check cache first
  if (urlCache.has(imageUrl)) {
    return urlCache.get(imageUrl)!;
  }

  try {
    // If it's already a valid HTTP URL, check if it's a Wix URL that needs tilde and extension
    if (imageUrl.startsWith('http')) {
      // For Wix URLs, always add cache busting to bypass 403 errors
      if (imageUrl.includes('wixstatic.com')) {
        const cacheBustedUrl = imageUrl.includes('?') 
          ? `${imageUrl}&cb=${Date.now()}` 
          : `${imageUrl}?cb=${Date.now()}`;
        urlCache.set(imageUrl, cacheBustedUrl);
        return cacheBustedUrl;
      }
      
      // For non-Wix URLs, verify accessibility
      const isAccessible = await isUrlAccessible(imageUrl);
      if (isAccessible) {
        urlCache.set(imageUrl, imageUrl);
        return imageUrl;
      } else {
        urlCache.set(imageUrl, '/assets/images/placeholder.jpg');
        return '/assets/images/placeholder.jpg';
      }
    }

    // For JSON formats that would break the Image component
    if (imageUrl.startsWith('[') || imageUrl.startsWith('{')) {
      try {
        // Handle the description+slug format directly
        if (imageUrl.includes('"description"') && imageUrl.includes('"slug"')) {
          // Extract the slug directly using regex
          const slugMatch = imageUrl.match(/"slug":"([^"]+)"/);
          if (slugMatch && slugMatch[1]) {
            const slug = slugMatch[1];
            const result = `https://static.wixstatic.com/media/${slug}`;
            urlCache.set(imageUrl, result);
            // Force unoptimized access by adding a cache-busting param
            return `${result}?cb=${Date.now()}`;
          }
        }
        
        // First, try to handle common JSON formats
        if (imageUrl.includes('"uri"')) {
          const uriMatch = imageUrl.match(/"uri":"([^"]+)"/);
          if (uriMatch && uriMatch[1]) {
            const extractedUri = uriMatch[1];

            if (extractedUri.startsWith('wix:image://')) {
              const converted = await convertWixMediaUrl(extractedUri);
              urlCache.set(imageUrl, converted);
              return converted;
            } else if (extractedUri.startsWith('http')) {
              urlCache.set(imageUrl, extractedUri);
              return extractedUri;
            }
          }
        }

        // Then try slug format
        if (imageUrl.includes('"slug"')) {
          const slugMatch = imageUrl.match(/"slug":"([^"]+)"/);
          if (slugMatch && slugMatch[1]) {
            const slug = slugMatch[1];
            // Check if the slug contains tilde and file extension
            if (!slug.includes('~mv2') && !slug.match(/\.(jpe?g|png|gif|webp|svg)$/i)) {
              // No tilde and no extension, add them
              if (slug.match(/^[a-f0-9_]+$/i)) {
                // Looks like a raw media ID, add the tilde and extension
                const result = `https://static.wixstatic.com/media/${slug}~mv2.jpg`;
                urlCache.set(imageUrl, result);
                // Add cache busting to prevent 403s
                return `${result}?cb=${Date.now()}`;
              }
            }
            const result = `https://static.wixstatic.com/media/${slug}`;
            urlCache.set(imageUrl, result);
            // Add cache busting to prevent 403s
            return `${result}?cb=${Date.now()}`;
          }
        }

        // If specific patterns fail, try the general conversion
        const convertedUrl = await convertWixMediaUrl(imageUrl);
        if (convertedUrl && convertedUrl.startsWith('http')) {
          urlCache.set(imageUrl, convertedUrl);
          return convertedUrl;
        }
      } catch (e) {
        console.error('Error handling JSON format image:', e);
      }

      // If all conversions fail, return placeholder
      urlCache.set(imageUrl, '/assets/images/placeholder.jpg');
      return '/assets/images/placeholder.jpg';
    }

    // For Wix URLs
    if (isWixMediaUrl(imageUrl)) {
      try {
        const result = await convertWixMediaUrl(imageUrl);
        urlCache.set(imageUrl, result);
        return result;
      } catch (e) {
        console.error('Error converting Wix media URL:', e);
      }
    }
  } catch (e) {
    console.error('Error processing image URL:', e);
  }

  // If all else fails, return a placeholder
  urlCache.set(imageUrl, '/assets/images/placeholder.jpg');
  return '/assets/images/placeholder.jpg';
}