/**
 * Client-side utilities for Wix media URLs using the API
 * This slimmed-down version delegates the complex URL conversion to the server
 */
import axios from 'axios';

// Cache for converted URLs to reduce redundant API calls
const urlCache = new Map<string, string>();

/**
 * Checks if a URL is likely a Wix media URL that needs conversion
 */
export function isWixMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
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
  
  return false;
}

/**
 * Convert a Wix media URL to a standard URL using the API
 * @param wixUrl - The Wix media URL to convert
 * @returns A promise that resolves to the converted URL
 */
export async function convertWixMediaUrl(wixUrl: string): Promise<string> {
  // Check if this is already a fully qualified URL or invalid
  if (!wixUrl || typeof wixUrl !== 'string') {
    return '/assets/images/placeholder.jpg';
  }
  
  // Check cache first
  if (urlCache.has(wixUrl)) {
    return urlCache.get(wixUrl)!;
  }
  
  // If it's already a standard URL, return as is
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    // For Wix URLs, always add cache busting to bypass 403 errors
    if (wixUrl.includes('wixstatic.com')) {
      const cacheBustedUrl = wixUrl.includes('?') 
        ? `${wixUrl}&cb=${Date.now()}` 
        : `${wixUrl}?cb=${Date.now()}`;
      urlCache.set(wixUrl, cacheBustedUrl);
      return cacheBustedUrl;
    }
    
    urlCache.set(wixUrl, wixUrl);
    return wixUrl;
  }
  
  try {
    // Use the server API to convert the URL
    const response = await axios.post('/api/media/convert', { url: wixUrl });
    
    if (response.data && response.data.url) {
      urlCache.set(wixUrl, response.data.url);
      return response.data.url;
    }
    
    throw new Error('Invalid API response');
  } catch (error) {
    console.error('Error calling media conversion API:', error);
    const fallback = '/assets/images/placeholder.jpg';
    urlCache.set(wixUrl, fallback);
    return fallback;
  }
}

/**
 * Process image gallery data using the server API
 * @param galleryData - Array or JSON data containing image URLs
 * @returns A promise that resolves to an array of standard image URLs
 */
export async function processImageGallery(galleryData: any): Promise<string[]> {
  if (!galleryData) {
    return ['/assets/images/placeholder.jpg'];
  }
  
  try {
    // Use the server API to process the gallery data
    const response = await axios.post('/api/media/convert', { gallery: galleryData });
    
    if (response.data && Array.isArray(response.data.urls)) {
      return response.data.urls.length > 0 
        ? response.data.urls 
        : ['/assets/images/placeholder.jpg'];
    }
    
    throw new Error('Invalid API response');
  } catch (error) {
    console.error('Error processing image gallery:', error);
    return ['/assets/images/placeholder.jpg'];
  }
}

/**
 * A simple function to get a safe image URL, using the server if necessary
 * @param imageUrl - The URL string that might need conversion
 * @returns A promise resolving to a valid image URL
 */
export async function safeImageUrl(imageUrl: string): Promise<string> {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '/assets/images/placeholder.jpg';
  }
  
  try {
    // Check if this is a Wix URL that needs conversion
    if (isWixMediaUrl(imageUrl)) {
      return await convertWixMediaUrl(imageUrl);
    }
    
    // If it's already a standard URL
    if (imageUrl.startsWith('http')) {
      // For Wix CDN URLs, add cache busting
      if (imageUrl.includes('wixstatic.com')) {
        return imageUrl.includes('?') 
          ? `${imageUrl}&cb=${Date.now()}` 
          : `${imageUrl}?cb=${Date.now()}`;
      }
      return imageUrl;
    }
    
    // For other formats, use the conversion API
    return await convertWixMediaUrl(imageUrl);
  } catch (error) {
    console.error('Error getting safe image URL:', error);
    return '/assets/images/placeholder.jpg';
  }
}
