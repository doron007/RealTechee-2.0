import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  fallbackSrc?: string;
  lazyLoad?: boolean;
  loading?: 'lazy' | 'eager';
}

const FALLBACK_IMAGES = [
  '/assets/images/shared_projects_project-image1.png',
  '/assets/images/shared_projects_project-image2.png',
  '/assets/images/shared_projects_project-image3.png',
  '/assets/images/shared_projects_project-image4.png',
  '/assets/images/shared_projects_project-image5.png'
];

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  className = '',
  style,
  onLoad,
  onError,
  fallbackSrc,
  lazyLoad = true,
  loading = 'lazy',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Use intersection observer for lazy loading, but with fallback for elements already in view
  const isInView = useIntersectionObserver(imageRef, {
    threshold: 0.1,
    rootMargin: '50px', // Optimized margin for better performance
    freezeOnceVisible: true
  });

  // Update src when prop changes
  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
  }, [src]);

  // Fixed logic: Load if priority, no lazy loading, OR in view
  // For lazy loading, we need to load if either the observer says it's in view OR if lazy loading is disabled
  const shouldLoad = priority || !lazyLoad || isInView;

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!imageError) {
      setImageError(true);
      
      // Try fallback image if provided
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        // Use random fallback from predefined list
        const randomFallback = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
        setImageSrc(randomFallback);
      }
    }
    
    onError?.(event);
  };

  // Generate blur placeholder for better UX
  const generateBlurPlaceholder = (w: number = 10, h: number = 10) => {
    const canvas = typeof window !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return '';
    
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Create a simple gradient blur effect
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    return canvas.toDataURL();
  };

  const optimizedBlurDataURL = blurDataURL || generateBlurPlaceholder();

  // For fill images, don't add wrapper div - return the image directly
  if (fill) {
    return (
      <div ref={imageRef} className="contents">
        {shouldLoad ? (
          <Image
            src={imageSrc}
            alt={alt}
            fill={fill}
            sizes={sizes}
            priority={priority}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={placeholder === 'blur' ? optimizedBlurDataURL : undefined}
            loading={priority ? 'eager' : loading}
            onLoad={handleLoad}
            onError={handleError}
            className={`object-cover object-center ${className}`}
            {...props}
          />
        ) : (
          // Placeholder for lazy loading
          <div className={`absolute inset-0 bg-gray-200 flex items-center justify-center ${className}`}>
            <div className="w-8 h-8 text-gray-400">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  // For non-fill images, use the wrapper
  return (
    <div ref={imageRef} className={`relative overflow-hidden ${className}`} style={style}>
      {shouldLoad ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? optimizedBlurDataURL : undefined}
          loading={priority ? 'eager' : loading}
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          {...props}
        />
      ) : (
        // Placeholder while not in view
        <div 
          className="w-full h-full bg-gray-200 flex items-center justify-center"
          style={{ width: width, height: height }}
        >
          <div className="w-8 h-8 text-gray-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}