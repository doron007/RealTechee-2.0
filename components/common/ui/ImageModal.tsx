import React from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { P3 } from '../../typography';

interface ImageModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  imageDescription?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  open,
  onClose,
  imageSrc,
  imageAlt,
  imageDescription
}) => {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleDialogClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth={false}
      PaperProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          boxShadow: 'none',
          margin: 0,
          maxHeight: '100vh',
          maxWidth: '100vw',
        },
      }}
    >
      <DialogContent style={{ padding: 0, position: 'relative' }}>
        {/* Close button */}
        <IconButton
          onClick={handleCloseClick}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
          size="large"
        >
          <CloseIcon />
        </IconButton>

        {/* Image container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            minWidth: '100vw',
            padding: '64px 16px 16px 16px',
          }}
          onClick={handleCloseClick} // Click background to close
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }} // Prevent close when clicking image
          >
            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
              <Image
                src={imageSrc}
                alt={imageAlt}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                }}
                width={1200}
                height={800}
                unoptimized // Allow external images
                onError={(e) => {
                  console.error('Error loading image:', imageSrc);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            {/* Image description */}
            {imageDescription && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '8px',
                maxWidth: '90vw',
              }}>
                <P3 style={{ color: 'white', textAlign: 'center' }}>
                  {imageDescription}
                </P3>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;