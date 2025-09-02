import React, { useState, useRef, useEffect } from 'react';
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
  thumbnailSrc?: string; // For progressive loading
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
  thumbnailSrc,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasErrored, setHasErrored] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(!!thumbnailSrc);
  const imageRef = useRef<HTMLDivElement>(null);
  const prevSrcRef = useRef<string>(src);

  // Use intersection observer for lazy loading only when needed
  const isInView = useIntersectionObserver(imageRef, {
    threshold: 0.1,
    rootMargin: '50px',
    freezeOnceVisible: true
  });

  // Simplified: Load if priority, no lazy loading, OR in view
  const shouldLoad = priority || !lazyLoad || isInView;

  const handleLoad = () => {
    setImageLoaded(true);
    setShowPlaceholder(false);
    onLoad?.();
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasErrored) {
      setHasErrored(true);
      
      // Try fallback image if provided, otherwise use random fallback
      const fallback = fallbackSrc || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
      setImageSrc(fallback);
    }
    
    onError?.(event);
  };

  // Update src when prop changes - fixed dependency cycle
  useEffect(() => {
    if (src !== prevSrcRef.current) {
      prevSrcRef.current = src;
      setImageSrc(src);
      setHasErrored(false);
    }
  }, [src]);

  // Generate thumbnail from main src if not provided
  const getEffectiveThumbnail = () => {
    if (thumbnailSrc) return thumbnailSrc;
    if (src.includes('_next/image')) {
      return src.replace(/w=\d+/, 'w=64').replace(/q=\d+/, 'q=50');
    }
    return src; // Use same src for direct S3 URLs
  };

  const effectiveThumbnail = getEffectiveThumbnail();

  // Base image styles
  const baseImageStyle: React.CSSProperties = fill 
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }
    : {
        width: width || '100%',
        height: height || 'auto'
      };

  // For fill images, don't add wrapper div - return the image directly
  if (fill) {
    return (
      <div ref={imageRef} className="contents" style={{ position: 'relative', ...style }}>
        {shouldLoad ? (
          <>
            {/* Thumbnail/placeholder for progressive loading */}
            {thumbnailSrc && showPlaceholder && (
              <img
                src={effectiveThumbnail}
                alt={alt}
                style={{
                  ...baseImageStyle,
                  filter: 'blur(2px)',
                  transition: 'opacity 0.3s ease-in-out',
                  opacity: showPlaceholder && !imageLoaded ? 1 : 0,
                  zIndex: 1
                }}
                loading="eager"
              />
            )}
            {/* Main high-resolution image */}
            <img
              src={imageSrc}
              alt={alt}
              style={{
                ...baseImageStyle,
                transition: 'opacity 0.3s ease-in-out',
                opacity: imageLoaded || !thumbnailSrc ? 1 : 0,
                zIndex: 2
              }}
              loading={priority ? 'eager' : loading}
              onLoad={handleLoad}
              onError={handleError}
              className={className}
              {...props}
            />
          </>
        ) : (
          // Simple CSS placeholder for better performance
          <div className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`} />
        )}
      </div>
    );
  }

  // For non-fill images, use the wrapper
  return (
    <div 
      ref={imageRef} 
      className={`relative overflow-hidden ${className}`} 
      style={{
        display: 'inline-block',
        width: width || 'auto',
        height: height || 'auto',
        ...style
      }}
    >
      {shouldLoad ? (
        <>
          {/* Thumbnail/placeholder for progressive loading */}
          {thumbnailSrc && showPlaceholder && (
            <img
              src={effectiveThumbnail}
              alt={alt}
              style={{
                ...baseImageStyle,
                filter: 'blur(2px)',
                transition: 'opacity 0.3s ease-in-out',
                opacity: showPlaceholder && !imageLoaded ? 1 : 0,
                position: 'absolute',
                zIndex: 1
              }}
              loading="eager"
            />
          )}
          {/* Main high-resolution image */}
          <img
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            style={{
              ...baseImageStyle,
              transition: 'opacity 0.3s ease-in-out',
              opacity: imageLoaded || !thumbnailSrc ? 1 : 0,
              position: thumbnailSrc ? 'absolute' : 'static',
              zIndex: 2
            }}
            loading={priority ? 'eager' : loading}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </>
      ) : (
        // Simple CSS placeholder for better performance
        <div 
          className="w-full h-full bg-gray-200 animate-pulse"
          style={{ width: width, height: height }}
        />
      )}
    </div>
  );
}