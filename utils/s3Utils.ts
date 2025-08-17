/**
 * S3 utility functions for handling file URLs and paths
 * Provides centralized S3 URL management with environment-based configuration
 */

// Get S3 public base URL from environment
const getS3BaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_S3_PUBLIC_BASE_URL environment variable is not configured');
  }
  return baseUrl;
};

/**
 * Convert a full S3 URL to a relative path
 * @param fullUrl - Full S3 URL
 * @returns Relative path starting with /
 */
export const getRelativePathFromUrl = (fullUrl: string): string => {
  try {
    const baseUrl = getS3BaseUrl();
    if (fullUrl.startsWith(baseUrl)) {
      return fullUrl.replace(baseUrl, '');
    }
    
    // Handle legacy URLs or other S3 URL formats
    const url = new URL(fullUrl);
    let pathname = url.pathname;
    
    // Remove /public/ prefix if it exists (legacy format)
    if (pathname.startsWith('/public/')) {
      pathname = pathname.substring('/public'.length);
    }
    
    // Fallback: return the pathname as-is
    return pathname;
  } catch (error) {
    console.error('Error parsing S3 URL:', error);
    return fullUrl; // Return original if parsing fails
  }
};

/**
 * Convert a relative path to a full S3 URL
 * @param relativePath - Relative path starting with / or full URL
 * @returns Full S3 public URL
 */
export const getFullUrlFromPath = (relativePath: string): string => {
  // If it's already a full URL, return as-is (prevents double concatenation)
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  const baseUrl = getS3BaseUrl();
  
  // Ensure path starts with /
  let normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  // Remove /public/ prefix if it exists (legacy format)
  if (normalizedPath.startsWith('/public/')) {
    normalizedPath = normalizedPath.substring('/public'.length);
  }
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Generate a clean S3 key for file upload
 * @param projectId - Project ID for organization
 * @param fileName - Original file name
 * @returns S3 key for upload
 */
export const generateS3Key = (projectId: string, fileName: string): string => {
  const timestamp = new Date().getTime();
  const cleanFileName = fileName.replace(/\s+/g, '_');
  return `${projectId}/${timestamp}-${cleanFileName}`;
};

/**
 * Get the relative path for a newly uploaded file
 * @param category - File category (images, videos, docs)
 * @param timestamp - Timestamp for file uniqueness
 * @param fileName - Original file name
 * @param cleanAddress - Normalized property address
 * @returns Relative path that matches actual S3 upload location
 */
export const getRelativePathForUpload = (category: string, timestamp: number, fileName: string, cleanAddress: string): string => {
  const sanitizedFileName = fileName.replace(/\s+/g, '_');
  return `/public/${cleanAddress}/requests/${category}/${timestamp}-${sanitizedFileName}`;
};

/**
 * Parse file URLs from JSON string and convert to relative paths
 * @param filesJson - JSON string containing array of file URLs
 * @returns Array of relative paths
 */
export const parseFileUrlsToRelativePaths = (filesJson: string | null): string[] => {
  if (!filesJson) return [];
  
  try {
    const urls = JSON.parse(filesJson) as string[];
    return urls.map(url => getRelativePathFromUrl(url));
  } catch (error) {
    console.error('Error parsing file URLs:', error);
    return [];
  }
};

/**
 * Convert array of relative paths to full URLs for display
 * @param relativePaths - Array of relative paths
 * @returns Array of full S3 URLs
 */
export const convertPathsToUrls = (relativePaths: string[]): string[] => {
  return relativePaths.map(path => getFullUrlFromPath(path));
};

/**
 * Convert array of relative paths to JSON string for database storage
 * @param relativePaths - Array of relative paths
 * @returns JSON string
 */
export const convertPathsToJson = (relativePaths: string[]): string => {
  return JSON.stringify(relativePaths);
};