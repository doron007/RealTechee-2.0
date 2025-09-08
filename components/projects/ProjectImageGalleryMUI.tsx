import React, { useState, useRef, useEffect } from 'react';
import OptimizedImage from '../common/ui/OptimizedImage';
import { 
  Box, 
  IconButton, 
  Modal, 
  Fade,
  Typography,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';

// Reliable fallback image if loading fails
const FALLBACK_IMAGE = '/assets/images/hero-bg.png';

// Interface for gallery image objects (same as current)
export interface GalleryImage {
  url: string;
  alt: string;
  description?: string;
}

interface ProjectImageGalleryMUIProps {
  images: GalleryImage[];
}

// Styled components to match original design exactly
const GalleryContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#f3f4f6', // gray-100 to match original
  borderRadius: '8px',
  marginBottom: '16px', // space-y-4 equivalent
  position: 'relative',
  // Remove fixed height - use aspect ratio like original
  aspectRatio: '16/10',
  overflow: 'hidden',
  
  // Mobile responsive
  [theme.breakpoints.down('sm')]: {
    borderRadius: '8px'
  }
}));

const MainImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%', // Take full container height since thumbnails are now separate
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}));

const ImageCounter = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '16px',
  right: '16px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  fontSize: '0.875rem',
  padding: '4px 8px',
  borderRadius: '4px',
  zIndex: 10,
  
  [theme.breakpoints.down('sm')]: {
    top: '8px',
    right: '8px',
    fontSize: '0.75rem',
    padding: '2px 6px'
  }
}));

const NavigationButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'white',
  color: '#374151',
  width: '40px',
  height: '40px',
  zIndex: 10,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    backgroundColor: '#f3f4f6'
  },
  
  [theme.breakpoints.down('sm')]: {
    width: '32px',
    height: '32px',
    '& .MuiSvgIcon-root': {
      fontSize: '1rem'
    }
  }
}));

// Separate thumbnail container - no longer overlay
const ThumbnailContainer = styled(Box)(({ theme }) => ({
  marginTop: '16px', // space-y-4 equivalent
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  
  [theme.breakpoints.down('sm')]: {
    marginTop: '12px'
  }
}));

const ThumbnailScroll = styled(Box)(({ theme }) => ({
  width: '100%',
  overflowX: 'auto',
  display: 'flex',
  gap: '8px', // gap-2 to match original
  padding: '4px 4px 4px 4px', // Add left/right padding to prevent clipping
  
  // Custom scrollbar styling
  '&::-webkit-scrollbar': {
    height: '4px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '2px'
  }
}));

const ThumbnailButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSelected'
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  cursor: 'pointer',
  flexShrink: 0,
  position: 'relative',
  width: '64px', // aspect-square to match original
  height: '64px',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#f3f4f6', // bg-gray-100
  // Use ring styling like original instead of borders
  boxShadow: isSelected 
    ? '0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.1)' // ring-2 ring-blue-500 ring-offset-2
    : 'none',
  transition: 'all 0.15s ease-in-out',
  
  '&:hover': {
    boxShadow: isSelected 
      ? '0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.1)'
      : '0 0 0 1px #d1d5db' // hover:ring-1 hover:ring-gray-300
  }
}));

// Modal styling for full-screen view - optimized for image display
const ModalContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95vw',
  height: '90vh', // Reduced from 95vh to provide more breathing room
  backgroundColor: 'black',
  borderRadius: '8px',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
  
  [theme.breakpoints.down('sm')]: {
    width: '100vw',
    height: '100vh',
    borderRadius: 0
  }
}));

const ModalImageContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px', // Reduced from 20px to maximize image space
  // Ensure minimum space for image even with UI elements
  minHeight: 0 // Allow flex item to shrink below content size
}));

const ModalCloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '12px',
  right: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  zIndex: 22, // Above counter
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  
  [theme.breakpoints.down('sm')]: {
    top: '8px',
    right: '8px'
  }
}));

const ProjectImageGalleryMUI: React.FC<ProjectImageGalleryMUIProps> = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Scroll selected thumbnail into view when currentImageIndex changes
  useEffect(() => {
    if (thumbnailScrollRef.current && thumbnailRefs.current[currentImageIndex]) {
      const scrollContainer = thumbnailScrollRef.current;
      const selectedThumbnail = thumbnailRefs.current[currentImageIndex];
      
      if (selectedThumbnail) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const thumbnailRect = selectedThumbnail.getBoundingClientRect();
        
        // Calculate if thumbnail is out of view
        const isLeftOfView = thumbnailRect.left < containerRect.left;
        const isRightOfView = thumbnailRect.right > containerRect.right;
        
        if (isLeftOfView || isRightOfView) {
          // Scroll to center the thumbnail in view
          const scrollLeft = selectedThumbnail.offsetLeft - (scrollContainer.clientWidth / 2) + (selectedThumbnail.clientWidth / 2);
          scrollContainer.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentImageIndex]);
  
  // No images to display
  if (!images || images.length === 0) {
    return (
      <GalleryContainer>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="body1" sx={{ color: '#9ca3af' }}>
            No images available
          </Typography>
        </Box>
      </GalleryContainer>
    );
  }
  
  const currentImage = images[currentImageIndex];
  const imageUrl = imageErrors.has(currentImageIndex) ? FALLBACK_IMAGE : currentImage.url;
  
  // Navigation functions
  const goToPrevious = () => {
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };
  
  const goToNext = () => {
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };
  
  const handleThumbnailClick = (index: number) => {
    // NO setIsLoading(true) - this was the bug!
    setCurrentImageIndex(index);
  };
  
  const handleImageError = (index: number) => {
    console.error(`Failed to load image: ${images[index].url}`);
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  };
  
  return (
    <>
      {/* Main Image Container - matches original layout */}
      <GalleryContainer>
        <MainImageContainer>
          {/* Main Image */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setIsModalOpen(true)}
          >
            <OptimizedImage
              src={imageUrl}
              alt={currentImage.alt || `Project image ${currentImageIndex + 1}`}
              fill
              style={{
                objectFit: 'contain',
                borderRadius: '8px'
              }}
              onError={() => handleImageError(currentImageIndex)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority={currentImageIndex === 0}
              thumbnailSrc={images.length > currentImageIndex ? images[currentImageIndex].url.replace(/w=\d+/, 'w=64').replace(/q=\d+/, 'q=50') : undefined}
            />
          </Box>
          
          {/* Image Counter */}
          <ImageCounter>
            {currentImageIndex + 1} / {images.length}
          </ImageCounter>
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <NavigationButton
                sx={{ left: '16px' }}
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <ArrowBackIosIcon fontSize={isMobile ? 'small' : 'medium'} />
              </NavigationButton>
              
              <NavigationButton
                sx={{ right: '16px' }}
                onClick={goToNext}
                aria-label="Next image"
              >
                <ArrowForwardIosIcon fontSize={isMobile ? 'small' : 'medium'} />
              </NavigationButton>
            </>
          )}
        </MainImageContainer>
      </GalleryContainer>
      
      {/* Thumbnails Navigation - separate from main container like original */}
      {images.length > 1 && (
        <ThumbnailContainer>
          <ThumbnailScroll ref={thumbnailScrollRef}>
            {images.map((img, idx) => (
              <ThumbnailButton
                key={idx}
                ref={(el) => {
                  thumbnailRefs.current[idx] = el as HTMLDivElement | null;
                }}
                isSelected={idx === currentImageIndex}
                onClick={() => handleThumbnailClick(idx)}
              >
                <OptimizedImage
                  src={imageErrors.has(idx) ? FALLBACK_IMAGE : img.url}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  fill
                  style={{
                    objectFit: 'cover'
                  }}
                  onError={() => handleImageError(idx)}
                  sizes="64px"
                  lazyLoad={false}
                />
              </ThumbnailButton>
            ))}
          </ThumbnailScroll>
        </ThumbnailContainer>
      )}
      
      {/* Full Screen Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeAfterTransition
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Fade in={isModalOpen}>
          <ModalContainer>
            <ModalCloseButton
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              <CloseIcon />
            </ModalCloseButton>
            
            <ModalImageContainer>
              <OptimizedImage
                src={imageUrl}
                alt={currentImage.alt || `Project image ${currentImageIndex + 1}`}
                fill
                style={{
                  objectFit: 'contain'
                }}
                sizes="1200px"
                priority
                thumbnailSrc={images.length > currentImageIndex ? images[currentImageIndex].url.replace(/w=\d+/, 'w=64').replace(/q=\d+/, 'q=50') : undefined}
              />
              
              {/* Modal Navigation */}
              {images.length > 1 && (
                <>
                  <NavigationButton
                    sx={{ 
                      left: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': { backgroundColor: 'white' }
                    }}
                    onClick={goToPrevious}
                    aria-label="Previous image"
                  >
                    <ArrowBackIosIcon />
                  </NavigationButton>
                  
                  <NavigationButton
                    sx={{ 
                      right: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': { backgroundColor: 'white' }
                    }}
                    onClick={goToNext}
                    aria-label="Next image"
                  >
                    <ArrowForwardIosIcon />
                  </NavigationButton>
                </>
              )}
              
            </ModalImageContainer>
            
            {/* Modal Counter - positioned outside image area */}
            <Box
              sx={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '0.875rem',
                zIndex: 21 // Above close button
              }}
            >
              {currentImageIndex + 1} / {images.length}
            </Box>
          </ModalContainer>
        </Fade>
      </Modal>
    </>
  );
};

export default ProjectImageGalleryMUI;