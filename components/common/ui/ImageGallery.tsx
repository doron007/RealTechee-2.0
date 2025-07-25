import React, { useState, useCallback, useMemo } from 'react';
import ImageModal from './ImageModal';
import OptimizedImage from './OptimizedImage';
import { H4, P3 } from '../../typography';

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

export default function ImageGallery({
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
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0])); // Load first image immediately
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize visible images to prevent unnecessary re-renders
  // For horizontal scrolling, show all images
  const visibleImages = images;

  // Helper: is single image gallery
  const isSingleImage = images.length === 1;

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(Array.from(prev).concat(index)));
  }, []);

  const handleImageClick = useCallback((image: GalleryImage, index: number) => {
    setSelectedImageIndex(index);
    onImageClick?.(image, index);
    setIsModalOpen(true);
  }, [onImageClick]);

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    // Preload the clicked image if not already loaded
    if (!loadedImages.has(index)) {
      setLoadedImages(prev => new Set(Array.from(prev).concat(index)));
    }
  }, [loadedImages]);

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
  const selectedImageSrc = selectedImage.src || selectedImage.url;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <div className="relative">
        <div 
          className="aspect-[16/10] relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer transition-transform duration-300"
          onClick={() => handleImageClick(selectedImage, selectedImageIndex)}
        >
          <OptimizedImage
            src={selectedImageSrc || ''}
            alt={selectedImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            priority={selectedImageIndex === 0}
            quality={quality}
            placeholder="empty"
            className="object-cover"
            lazyLoad={lazyLoad && selectedImageIndex !== 0}
            onLoad={() => handleImageLoad(selectedImageIndex)}
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
          {visibleImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`relative aspect-square overflow-hidden rounded-md bg-gray-100 transition-all duration-200 ${
                selectedImageIndex === index 
                  ? 'ring-2 ring-blue-500 ring-offset-1' 
                  : 'hover:ring-1 hover:ring-gray-300'
              }`}
              style={{ minWidth: 64, minHeight: 64 }}
            >
              <OptimizedImage
                src={image.thumbnail || image.src || image.url || ''}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 25vw, (max-width: 1200px) 15vw, 10vw"
                quality={50}
                className="object-cover"
                lazyLoad={lazyLoad}
                onLoad={() => handleImageLoad(index)}
              />
            </button>
          ))}
        </div>
      )}
      {/* Modal for full image view */}
      <ImageModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageSrc={selectedImageSrc || ''}
        imageAlt={selectedImage.alt}
        imageDescription={selectedImage.description}
      />
    </div>
  );
}