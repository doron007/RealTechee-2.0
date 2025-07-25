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
  const [hasErrored, setHasErrored] = useState(false);
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
            placeholder={placeholder === 'blur' && blurDataURL ? 'blur' : 'empty'}
            blurDataURL={blurDataURL}
            loading={priority ? 'eager' : loading}
            onLoad={handleLoad}
            onError={handleError}
            className={`object-cover object-center ${className}`}
            {...props}
          />
        ) : (
          // Simple CSS placeholder for better performance
          <div className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`} />
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
          placeholder={placeholder === 'blur' && blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL}
          loading={priority ? 'eager' : loading}
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          {...props}
        />
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