import React, { useState, useRef } from 'react';
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
  '/assets/images/hero-bg.png',
  '/assets/images/properties/property-1.jpg',
  '/assets/images/properties/property-2.jpg'
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
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Use intersection observer for advanced lazy loading
  const isInView = useIntersectionObserver(imageRef, {
    threshold: 0.1,
    rootMargin: '50px',
    freezeOnceVisible: true
  });

  // Determine if image should load
  const shouldLoad = !lazyLoad || priority || isInView;

  const handleLoad = () => {
    setIsLoaded(true);
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

  return (
    <div ref={imageRef} className={`relative overflow-hidden ${className}`} style={style}>
      {shouldLoad ? (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          sizes={sizes}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? optimizedBlurDataURL : undefined}
          loading={priority ? 'eager' : loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      ) : (
        // Placeholder while not in view
        <div 
          className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center ${
            fill ? 'absolute inset-0' : ''
          }`}
          style={{ 
            width: fill ? '100%' : width, 
            height: fill ? '100%' : height 
          }}
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