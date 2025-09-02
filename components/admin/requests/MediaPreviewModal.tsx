import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button as MuiButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BaseModal from '../../common/modals/BaseModal';
import { P3 } from '../../typography';

interface MediaPreviewModalProps {
  open: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'document';
  fileName: string;
  onDownload?: () => void;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  open,
  onClose,
  mediaUrl,
  mediaType,
  fileName,
  onDownload
}) => {
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = fileName;
      link.click();
    }
  }, [onDownload, mediaUrl, fileName]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'd' || event.key === 'D') {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleDownload();
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling on the body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose, handleDownload]);

  const renderContent = () => {
    switch (mediaType) {
      case 'image':
        return (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-4xl">
              <Image
                src={mediaUrl}
                alt={fileName}
                width={800}
                height={600}
                className="w-full h-auto max-h-[70vh] object-contain rounded border border-gray-200"
                onError={(e) => {
                  console.error('Failed to load image:', mediaUrl);
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAzMEMyNS41MjI5IDMwIDMwIDI1LjUyMjkgMzAgMjBDMzAgMTQuNDc3MSAyNS41MjI5IDEwIDIwIDEwQzE0LjQ3NzEgMTAgMTAgMTQuNDc3MSAxMCAyMEMxMCAyNS41MjI5IDE0LjQ3NzEgMzAgMjAgMzBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Im0yNSAyNS0zLjUtMy41YTQuNSA0LjUgMCAwIDAtNi4zNiAwTDEyIDI1IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjxwb2ludCBjeD0iMTcuNSIgY3k9IjE3LjUiIHI9IjEuNSIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                }}
              />
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="flex flex-col items-center">
            <video
              src={mediaUrl}
              controls
              className="w-full max-w-4xl max-h-[70vh] rounded border border-gray-200"
              onError={() => {
                console.error('Failed to load video:', mediaUrl);
              }}
            >
              <P3 className="text-red-600">Your browser does not support video playback.</P3>
            </video>
          </div>
        );
      
      case 'document':
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        
        if (fileExtension === 'pdf') {
          return (
            <div className="flex flex-col items-center">
              <iframe
                src={`${mediaUrl}#view=FitH`}
                className="w-full h-[70vh] border border-gray-200 rounded"
                title={fileName}
                onError={() => {
                  console.error('Failed to load PDF:', mediaUrl);
                }}
              />
              <P3 className="text-gray-600 mt-2">
                If the PDF doesn't display properly, click Download to view it externally.
              </P3>
            </div>
          );
        } else {
          // For non-PDF documents, show a placeholder with download option
          const fileIcon = ['doc', 'docx'].includes(fileExtension) ? '📝' : 
                           ['xls', 'xlsx'].includes(fileExtension) ? '📊' : 
                           ['txt'].includes(fileExtension) ? '📄' : '📁';
          
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-6xl mb-4">
                {fileIcon}
              </div>
              <P3 className="text-gray-600 mb-4 text-center">
                Preview not available for {fileExtension.toUpperCase()} files.
                <br />
                Click Download to view the file.
              </P3>
            </div>
          );
        }
      
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <P3 className="text-gray-600">Preview not available for this file type.</P3>
          </div>
        );
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={fileName}
      maxWidth="lg"
      className="media-preview-modal"
    >
      <div className="space-y-4">
        {renderContent()}
        
        {/* Download Button */}
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <MuiButton
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            className="px-6 py-2"
          >
            Download {fileName}
          </MuiButton>
          <P3 className="text-gray-500 text-sm ml-4 self-center">
            Press ESC to close • Ctrl+D to download
          </P3>
        </div>
      </div>
    </BaseModal>
  );
};

export default MediaPreviewModal;