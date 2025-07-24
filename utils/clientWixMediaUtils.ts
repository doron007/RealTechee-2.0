/**
 * Client-side utilities for Wix media URLs using the API
 * This slimmed-down version delegates the complex URL conversion to the server
 */
import axios from 'axios';
import { getFullUrlFromPath } from './s3Utils';

// Enhanced cache with localStorage persistence and TTL
interface CacheEntry {
  url: string;
  timestamp: number;
  ttl: number;
}

class EnhancedUrlCache {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly CACHE_KEY = 'wix-url-cache';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor() {
    this.loadFromLocalStorage();
  }
  
  private loadFromLocalStorage() {
    try {
      // Only run on client-side
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const entries = JSON.parse(cached);
        Object.entries(entries).forEach(([key, value]) => {
          const entry = value as CacheEntry;
          if (entry.timestamp + entry.ttl > Date.now()) {
            this.memoryCache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }
  
  private saveToLocalStorage() {
    try {
      // Only run on client-side
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      const entries: Record<string, CacheEntry> = {};
      this.memoryCache.forEach((value, key) => {
        if (value.timestamp + value.ttl > Date.now()) {
          entries[key] = value;
        }
      });
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }
  
  get(key: string): string | null {
    const entry = this.memoryCache.get(key);
    if (entry && entry.timestamp + entry.ttl > Date.now()) {
      return entry.url;
    }
    if (entry) {
      this.memoryCache.delete(key);
    }
    return null;
  }
  
  set(key: string, url: string, ttl = this.DEFAULT_TTL) {
    const entry: CacheEntry = {
      url,
      timestamp: Date.now(),
      ttl
    };
    this.memoryCache.set(key, entry);
    
    // Periodically save to localStorage (debounced)
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveToLocalStorage(), 1000);
  }
  
  private saveTimeout: NodeJS.Timeout | undefined;
}

const urlCache = new EnhancedUrlCache();

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
  const cached = urlCache.get(wixUrl);
  if (cached) {
    return cached;
  }
  
  // If it's already a standard URL, return as is
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    // For Wix URLs, return as-is for better caching (CORS fix applied)
    if (wixUrl.includes('wixstatic.com')) {
      urlCache.set(wixUrl, wixUrl);
      return wixUrl;
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
    urlCache.set(wixUrl, fallback, 5 * 60 * 1000); // Shorter TTL for fallback images
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
    // Check if this is a relative path from our new architecture
    if (imageUrl.startsWith('/assets/')) {
      return getFullUrlFromPath(imageUrl);
    }
    
    // Check if this is a Wix URL that needs conversion
    if (isWixMediaUrl(imageUrl)) {
      return await convertWixMediaUrl(imageUrl);
    }
    
    // If it's already a standard URL
    if (imageUrl.startsWith('http')) {
      // For Wix CDN URLs, DO NOT add cache busting to avoid CORS issues
      if (imageUrl.includes('wixstatic.com')) {
        // Return the URL as-is for better browser caching and CORS compatibility
        return imageUrl;
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
