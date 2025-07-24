/**
 * Server-side utilities for working with Wix media URLs
 * This module handles URL conversion on the server to improve performance
 * and simplify client-side components.
 */
import axios from 'axios';

// Cache for converted URLs to reduce redundant processing
const urlCache = new Map<string, string>();

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
 * Extracts image URLs from various data formats
 * @param imageData - The input data which might contain image URLs in various formats
 * @returns An array of extracted image URLs
 */
export function extractImageUrls(imageData: any): string[] {
  const extracted: string[] = [];
  
  // Handle null or undefined
  if (!imageData) {
    return extracted;
  }
  
  // Handle string input (could be a URL or JSON)
  if (typeof imageData === 'string') {
    // If it looks like JSON, try to extract URLs from it
    if ((imageData.startsWith('[') && imageData.endsWith(']')) || 
        (imageData.startsWith('{') && imageData.endsWith('}'))) {
      
      try {
        // Try parsing as JSON
        const parsed = JSON.parse(imageData);
        
        // Handle array format
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item === 'object') {
              // Extract src, uri, or other common URL properties
              if (item.src && typeof item.src === 'string') {
                extracted.push(item.src);
              } else if (item.uri && typeof item.uri === 'string') {
                extracted.push(item.uri);
              } else if (item.url && typeof item.url === 'string') {
                extracted.push(item.url);
              }
            } else if (typeof item === 'string') {
              extracted.push(item);
            }
          }
        }
        // Handle object format
        else if (parsed && typeof parsed === 'object') {
          if (parsed.src && typeof parsed.src === 'string') {
            extracted.push(parsed.src);
          } else if (parsed.uri && typeof parsed.uri === 'string') {
            extracted.push(parsed.uri);
          } else if (parsed.url && typeof parsed.url === 'string') {
            extracted.push(parsed.url);
          } else if (parsed.slug && typeof parsed.slug === 'string') {
            // Wix specific slug format
            const slug = parsed.slug;
            extracted.push(`wix:image://v1/${slug}`);
          }
        }
      } catch (e) {
        // If JSON parsing fails, try regex approach
        console.warn('JSON parse failed, using regex approach:', e);
        
        // Try regex-based extraction for "src" values
        const srcRegex = /"src":"([^"]+)"/g;
        let srcMatch;
        while ((srcMatch = srcRegex.exec(imageData)) !== null) {
          if (srcMatch[1]) {
            extracted.push(srcMatch[1]);
          }
        }
        
        // Try regex-based extraction for Wix image URLs
        const wixRegex = /(wix:image:\/\/[^"]+)/g;
        let wixMatch;
        while ((wixMatch = wixRegex.exec(imageData)) !== null) {
          if (wixMatch[1]) {
            extracted.push(wixMatch[1]);
          }
        }
      }
    } else {
      // Treat as direct URL
      extracted.push(imageData);
    }
    return extracted;
  }
  
  // Handle array input
  if (Array.isArray(imageData)) {
    for (const item of imageData) {
      if (typeof item === 'string') {
        // Process each string item recursively
        const urls = extractImageUrls(item);
        extracted.push(...urls);
      } else if (item && typeof item === 'object') {
        // Extract from common URL properties in objects
        if (item.src && typeof item.src === 'string') {
          extracted.push(item.src);
        } else if (item.uri && typeof item.uri === 'string') {
          extracted.push(item.uri);
        } else if (item.url && typeof item.url === 'string') {
          extracted.push(item.url);
        }
      }
    }
    return extracted;
  }
  
  return extracted;
}

/**
 * Converts a Wix media URL to a standard URL that can be used in web applications
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
  
  // Check cache first
  if (urlCache.has(wixUrl)) {
    return urlCache.get(wixUrl)!;
  }
  
  // If it's already a standard URL, return as is
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    urlCache.set(wixUrl, wixUrl);
    return wixUrl;
  }
  
  // Handle JSON array format with broken JSON
  if ((wixUrl.startsWith('[') || wixUrl.startsWith('{'))) {
    try {
      // Extract URI from JSON with description
      const uriMatch = wixUrl.match(/"uri":"([^"]+)"/);
      if (uriMatch && uriMatch[1]) {
        // If we found a URI that's a Wix URL, process it recursively
        if (uriMatch[1].startsWith('wix:image://')) {
          const nestedResult = await convertWixMediaUrl(uriMatch[1]);
          urlCache.set(wixUrl, nestedResult);
          return nestedResult;
        } else if (uriMatch[1].startsWith('http')) {
          urlCache.set(wixUrl, uriMatch[1]);
          return uriMatch[1];
        }
      }
    } catch (e) {
      console.warn('Failed to process JSON format:', e);
    }
  }
  
  // Check for JSON slug format
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
          urlCache.set(wixUrl, resultUrl);
          return resultUrl;
        }
      }
      
      // Don't modify the slug at all - preserve tilde and extensions exactly as they are
      const resultUrl = `https://static.wixstatic.com/media/${slug}`;
      urlCache.set(wixUrl, resultUrl);
      return resultUrl;
    }
      
    // If regex fails, try as JSON (fallback)
    try {
      const jsonData = JSON.parse(wixUrl);
      if (jsonData && jsonData.slug) {
        const slug = jsonData.slug;
        const resultUrl = `https://static.wixstatic.com/media/${slug}`;
        urlCache.set(wixUrl, resultUrl);
        return resultUrl;
      }
    } catch (e) {
      console.warn('JSON parse failed for slug format:', e);
    }
  }

  // Check if it's a Wix media URL format
  if (!wixUrl.startsWith('wix:image://')) {
    urlCache.set(wixUrl, wixUrl);
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
      const placeholder = '/assets/images/placeholder.jpg';
      urlCache.set(wixUrl, placeholder);
      return placeholder;
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
      const resultUrl = `https://static.wixstatic.com/shapes/${mediaId.replace('shapes_', '')}.svg`;
      urlCache.set(wixUrl, resultUrl);
      return resultUrl;
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
    
    // Construct the final URL
    const constructedUrl = `https://static.wixstatic.com/media/${mediaId}${fileExtension}`;

    // Return URL as-is to avoid CORS issues with cache busting
    const finalUrl = constructedUrl;

    // Store in cache
    urlCache.set(wixUrl, finalUrl);
    return finalUrl;
  } catch (error) {
    console.error('Error converting Wix media URL:', error);
    const placeholder = '/assets/images/placeholder.jpg';
    urlCache.set(wixUrl, placeholder);
    return placeholder;
  }
}

/**
 * Process an array of image data to extract and convert all URLs
 * @param imagesData - The input data which might contain image URLs
 * @returns An array of converted image URLs
 */
export async function processImageGallery(imagesData: any): Promise<string[]> {
  try {
    // Extract URLs from the input data
    const extractedUrls = extractImageUrls(imagesData);
    
    if (extractedUrls.length === 0) {
      return ['/assets/images/placeholder.jpg'];
    }
    
    // Convert each URL
    const convertedUrls = await Promise.all(
      extractedUrls.map(url => convertWixMediaUrl(url))
    );
    
    // Filter out duplicates and placeholders
    const uniqueUrls = Array.from(new Set(
      convertedUrls.filter(url => 
        url && 
        url !== '' && 
        url !== '/assets/images/placeholder.jpg'
      )
    ));
    
    return uniqueUrls.length > 0 ? uniqueUrls : ['/assets/images/placeholder.jpg'];
  } catch (error) {
    console.error('Error processing image gallery:', error);
    return ['/assets/images/placeholder.jpg'];
  }
}

/**
 * Process a single image URL to convert it if needed
 * @param imageUrl - The input URL which might need conversion
 * @returns A converted standard URL
 */
export async function processImageUrl(imageUrl: string | undefined): Promise<string> {
  if (!imageUrl) {
    return '/assets/images/placeholder.jpg';
  }
  
  try {
    return await convertWixMediaUrl(imageUrl);
  } catch (error) {
    console.error('Error processing image URL:', error);
    return '/assets/images/placeholder.jpg';
  }
}
