import React from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { H3, P2 } from '../../typography';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  disableBackdropClick?: boolean;
  className?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  fullWidth = true,
  disableBackdropClick = false,
  className = ''
}) => {
  const handleClose = (event: {}, reason?: "backdropClick" | "escapeKeyDown") => {
    if (disableBackdropClick && reason === "backdropClick") {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        className: `${className} bg-white rounded-lg shadow-xl`,
        style: {
          margin: 16,
          maxHeight: 'calc(100vh - 32px)',
        }
      }}
    >
      <DialogTitle className="border-b border-gray-200 pb-4">
        <Box className="flex items-center justify-between">
          <div>
            <H3 className="mb-1">{title}</H3>
            {subtitle && <P2 className="text-gray-600">{subtitle}</P2>}
          </div>
          <IconButton
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className="pt-6">
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default BaseModal;