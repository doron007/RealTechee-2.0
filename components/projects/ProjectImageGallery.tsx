import React, { useState } from 'react';
import Image from 'next/image';

// Reliable fallback image if loading fails
const FALLBACK_IMAGE = '/assets/images/hero-bg.png';

// Interface for gallery image objects
export interface GalleryImage {
  url: string;
  alt: string;
  description?: string;
}

interface ProjectImageGalleryProps {
  images: GalleryImage[];
}

const ProjectImageGallery: React.FC<ProjectImageGalleryProps> = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  // No images to display
  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg h-96 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-600">No images available</p>
        </div>
      </div>
    );
  }
  
  const currentImage = images[currentImageIndex];
  const imageUrl = imageErrors.has(currentImageIndex) ? FALLBACK_IMAGE : currentImage.url;
  
  return (
    <div className="bg-black rounded-lg h-[620px] mb-8 relative overflow-hidden">
      <div className="relative w-full h-[calc(100%-180px)] flex items-center justify-center">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70 z-10">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
              <p className="text-white mt-4">Loading image...</p>
            </div>
          </div>
        )}
        
        <Image
          src={imageUrl}
          alt={currentImage.alt || `Project image ${currentImageIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
          className="rounded-lg"
          priority={currentImageIndex === 0}
          unoptimized={true}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            console.error(`Failed to load image: ${currentImage.url}`);
            setIsLoading(false);
            
            // Mark this image as having an error to use the fallback
            setImageErrors(prev => {
              const newSet = new Set(prev);
              newSet.add(currentImageIndex);
              return newSet;
            });
          }}
        />
        
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow hover:bg-gray-100 transition-colors z-10 w-10 h-10 flex items-center justify-center"
            onClick={() => {
              setIsLoading(true);
              setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            }}
            aria-label="Previous image"
          >
            <span className="text-gray-700 text-2xl font-bold">&lt;</span>
          </button>
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow hover:bg-gray-100 transition-colors z-10 w-10 h-10 flex items-center justify-center"
            onClick={() => {
              setIsLoading(true);
              setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }}
            aria-label="Next image"
          >
            <span className="text-gray-700 text-2xl font-bold">&gt;</span>
          </button>
        </>
      )}
      
      {/* Thumbnails navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[90px] bg-gray-900 bg-opacity-80 flex items-center px-4">
          <div className="w-full overflow-x-auto flex gap-4 py-2 px-4">
            {images.map((img, idx) => (
              <div 
                key={idx}
                className={`cursor-pointer flex-shrink-0 relative w-[80px] h-[60px] border-2 transition-all ${
                  idx === currentImageIndex 
                    ? 'border-blue-500 scale-110 shadow-lg' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                onClick={() => {
                  setIsLoading(true);
                  setCurrentImageIndex(idx);
                }}
              >
                <Image
                  src={imageErrors.has(idx) ? FALLBACK_IMAGE : img.url}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  onError={() => {
                    // Mark this thumbnail as having an error
                    setImageErrors(prev => {
                      const newSet = new Set(prev);
                      newSet.add(idx);
                      return newSet;
                    });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectImageGallery;
