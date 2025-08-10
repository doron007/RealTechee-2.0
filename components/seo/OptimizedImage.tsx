import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  alt: string; // Make alt required for SEO
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallbackSrc?: string;
  className?: string;
}

/**
 * SEO-Optimized Image Component
 * Provides automatic lazy loading, proper alt tags, and performance optimization
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  alt,
  loading = 'lazy',
  priority = false,
  quality = 85,
  sizes,
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc = '/assets/images/placeholder.jpg',
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(props.src);
  const [hasError, setHasError] = useState(false);

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || `
    (max-width: 768px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  `;

  // Handle image error
  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
  };

  // Generate structured data for images when relevant
  const generateImageStructuredData = () => {
    if (typeof imageSrc === 'string' && imageSrc.includes('portfolio') || alt.toLowerCase().includes('before') || alt.toLowerCase().includes('after')) {
      return {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        contentUrl: imageSrc,
        description: alt,
        name: alt,
        author: {
          '@type': 'Organization',
          name: 'RealTechee'
        },
        copyrightHolder: {
          '@type': 'Organization',
          name: 'RealTechee'
        }
      };
    }
    return null;
  };

  const structuredData = generateImageStructuredData();

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        loading={priority ? 'eager' : loading}
        priority={priority}
        quality={quality}
        sizes={responsiveSizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={`${className} ${hasError ? 'opacity-75' : ''}`}
        onError={handleError}
        // SEO optimizations
        decoding="async"
        style={{
          objectFit: 'cover',
          ...props.style
        }}
      />
    </>
  );
};

export default OptimizedImage;