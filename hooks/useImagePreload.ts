import { useEffect } from 'react';
import { safeImageUrl } from '../utils/clientWixMediaUtils';

interface PreloadOptions {
  images: string[];
  priority?: boolean;
}

/**
 * Hook to preload critical images for better perceived performance
 * @param images - Array of image URLs to preload
 * @param priority - Whether to preload with high priority
 */
export function useImagePreload({ images, priority = false }: PreloadOptions) {
  useEffect(() => {
    if (images.length === 0) return;

    const preloadImages = async () => {
      // Process URLs through our safe image URL converter
      const processedUrls = await Promise.all(
        images.map(async (url) => {
          try {
            return await safeImageUrl(url);
          } catch (error) {
            console.warn('Failed to process URL for preload:', url, error);
            return null;
          }
        })
      );

      // Filter out failed URLs and create preload links
      const validUrls = processedUrls.filter((url): url is string => url !== null);
      
      validUrls.forEach((url) => {
        // Check if preload link already exists
        const existingLink = document.querySelector(`link[href="${url}"]`);
        if (existingLink) return;

        // Create preload link
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        
        if (priority) {
          link.setAttribute('fetchpriority', 'high');
        }
        
        // Add to document head
        document.head.appendChild(link);
        
        // Clean up on page unload to prevent memory leaks
        const cleanup = () => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
        
        window.addEventListener('beforeunload', cleanup, { once: true });
      });
    };

    preloadImages();
  }, [images, priority]);
}

/**
 * Hook specifically for preloading project images on the projects page
 * @param projects - Array of projects with image URLs
 * @param count - Number of images to preload (default: 3)
 */
export function useProjectImagePreload(projects: any[], count: number = 3) {
  const images = projects
    .slice(0, count)
    .map(project => project.imageUrl || project.image)
    .filter(Boolean);

  useImagePreload({ images, priority: true });
}