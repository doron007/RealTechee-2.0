import React from 'react';
import ImageGalleryLib from 'react-image-gallery';

interface ImageGalleryProps {
  images: { url: string; alt: string; description?: string; }[];
  showPlayButton?: boolean;
  showFullscreenButton?: boolean;
  showNav?: boolean;
  autoPlay?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  showPlayButton = true,
  showFullscreenButton = true,
  showNav = true,
  autoPlay = false,
}) => {
  const items = images.map((image) => ({
    original: image.url,
    thumbnail: image.url,
    originalAlt: image.alt,
    thumbnailAlt: image.alt,
    description: image.description
  }));

  return (
    <div className="w-full">
      <ImageGalleryLib
        items={items}
        showPlayButton={showPlayButton}
        showFullscreenButton={showFullscreenButton}
        showNav={showNav}
        autoPlay={autoPlay}
        showThumbnails={true}
        thumbnailPosition="bottom"
        lazyLoad= {true}
        showBullets={true}
        showIndex={true}
      />
    </div>
  );
};
