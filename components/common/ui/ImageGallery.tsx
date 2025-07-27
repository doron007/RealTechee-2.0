import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import ImageModal from './ImageModal';
import { H4, P3 } from '../../typography';

// Fallback images for error cases
const FALLBACK_IMAGES = [
  '/assets/images/shared_projects_project-image1.png',
  '/assets/images/shared_projects_project-image2.png',
  '/assets/images/shared_projects_project-image3.png',
  '/assets/images/shared_projects_project-image4.png',
  '/assets/images/shared_projects_project-image5.png'
];

interface GalleryImage {
  src?: string;
  url?: string; // For compatibility with existing ProjectImageGallery
  alt: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
  lazyLoad?: boolean;
  showThumbnails?: boolean;
  maxVisibleImages?: number;
  quality?: number;
  sizes?: string;
  onImageClick?: (image: GalleryImage, index: number) => void;
}

const ImageGallery = React.memo(function ImageGallery({
  images,
  className = '',
  lazyLoad = true,
  showThumbnails = true,
  maxVisibleImages = 6,
  quality = 75,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onImageClick
}: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageSources, setImageSources] = useState<{[key: number]: string}>({});

  // Helper: is single image gallery
  const isSingleImage = images.length === 1;

  const handleImageClick = useCallback((image: GalleryImage, index: number) => {
    setSelectedImageIndex(index);
    onImageClick?.(image, index);
    setIsModalOpen(true);
  }, [onImageClick]);


  const handleImageError = useCallback((index: number) => {
    const fallbackSrc = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    setImageSources(prev => ({
      ...prev,
      [index]: fallbackSrc
    }));
  }, []);

  const getImageSrc = useCallback((image: GalleryImage, index: number) => {
    return imageSources[index] || image.src || image.url || '';
  }, [imageSources]);

  const isS3Image = useCallback((src: string) => {
    return (src.includes('amplify-realtecheeclone-d-') || src.includes('amplify-realtecheeclone-p-')) && src.includes('.s3.us-west-1.amazonaws.com');
  }, []);

  // Stable click handler that updates selection and applies CSS class
  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    
    // Update CSS classes for visual selection (CSS-only approach)
    const thumbnailButtons = document.querySelectorAll('[data-thumbnail-index]');
    thumbnailButtons.forEach((button, i) => {
      if (i === index) {
        button.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
        button.classList.remove('hover:ring-1', 'hover:ring-gray-300');
      } else {
        button.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1');
        button.classList.add('hover:ring-1', 'hover:ring-gray-300');
      }
    });
  }, []);

  // Create stable click handlers to prevent re-renders
  const stableClickHandlers = useMemo(() => {
    return images.map((_, index) => () => handleThumbnailClick(index));
  }, [images, handleThumbnailClick]);

  // Set initial selection state when component mounts
  useEffect(() => {
    if (images.length > 0) {
      // Apply initial selection styling to first thumbnail
      const thumbnailButtons = document.querySelectorAll('[data-thumbnail-index]');
      if (thumbnailButtons[0]) {
        thumbnailButtons[0].classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
        thumbnailButtons[0].classList.remove('hover:ring-1', 'hover:ring-gray-300');
      }
    }
  }, [images.length]);

  // Completely isolated thumbnail component - zero prop dependencies that change
  const ThumbnailImage = React.memo(function ThumbnailImage({ 
    src,
    alt,
    index,
    onClick
  }: {
    src: string;
    alt: string;
    index: number;
    onClick: () => void;
  }) {  
    const [imageSrc, setImageSrc] = useState(src);
    
    const handleError = useCallback(() => {
      const fallbackSrc = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
      setImageSrc(fallbackSrc);
    }, []);
    
    return (
      <button
        data-thumbnail-index={index}
        onClick={onClick}
        className="relative aspect-square overflow-hidden rounded-md bg-gray-100 transition-all duration-200 hover:ring-1 hover:ring-gray-300"
        style={{ minWidth: 64, minHeight: 64 }}
      >
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes="64px"
          quality={50}
          className="object-cover"
          style={{ color: 'initial' }}
          unoptimized={isS3Image(imageSrc)}
          onError={handleError}
        />
      </button>
    );
  });

  if (!images.length) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg min-h-[200px] ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
          <P3 className="text-gray-500">No images available</P3>
        </div>
      </div>
    );
  }

  const selectedImage = images[selectedImageIndex];
  const selectedImageSrc = getImageSrc(selectedImage, selectedImageIndex);

  return (
    <div className={`space-y-4 ${className}`} data-testid="image-gallery">
      {/* Main Image Display */}
      <div className="relative">
        <div 
          className="aspect-[16/10] relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer transition-transform duration-300"
          onClick={() => handleImageClick(selectedImage, selectedImageIndex)}
        >
          <Image
            src={selectedImageSrc}
            alt={selectedImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 600px, 800px"
            priority={false}
            quality={quality}
            placeholder="empty"
            className="object-cover"
            style={{ color: 'initial' }}
            unoptimized={isS3Image(selectedImageSrc)}
            onError={() => handleImageError(selectedImageIndex)}
          />
          {/* Image Counter */}
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
          {/* Navigation Arrows */}
          {!isSingleImage && (
            <>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
        {/* Image Title and Description */}
        {(selectedImage.title || selectedImage.description) && (
          <div className="mt-3">
            {selectedImage.title && (
              <H4 className="mb-1">{selectedImage.title}</H4>
            )}
            {selectedImage.description && (
              <P3 className="text-gray-600">{selectedImage.description}</P3>
            )}
          </div>
        )}
      </div>
      {/* Thumbnail Scrollable Row */}
      {showThumbnails && !isSingleImage && (
        <div className="flex overflow-x-auto gap-2 py-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {images.map((image, index) => (
            <ThumbnailImage
              key={`thumbnail-${image.src || image.url}-${index}`}
              src={image.src || image.url || ''}
              alt={image.alt}
              index={index}
              onClick={stableClickHandlers[index]}
            />
          ))}
        </div>
      )}
      {/* Modal for full image view */}
      <ImageModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageSrc={selectedImageSrc}
        imageAlt={selectedImage.alt}
        imageDescription={selectedImage.description}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if images array reference changes
  return prevProps.images === nextProps.images && 
         prevProps.className === nextProps.className &&
         prevProps.onImageClick === nextProps.onImageClick;
});

export default ImageGallery;