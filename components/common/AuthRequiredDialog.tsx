import React from 'react';
import { Dialog, DialogContent, DialogTitle, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Button from './buttons/Button';
import { BodyContent } from '../Typography';
import { useRouter } from 'next/router';

interface AuthRequiredDialogProps {
  open: boolean;
  onClose: () => void;
  action?: string;
  title?: string;
  message?: string;
}

export default function AuthRequiredDialog({ 
  open, 
  onClose, 
  action = "perform this action",
  title = "Login Required",
  message
}: AuthRequiredDialogProps) {
  const router = useRouter();

  const defaultMessage = `You need to be logged in to ${action}. Please sign in to your existing account or create a free account to continue.`;

  const handleLogin = () => {
    const currentPath = router.asPath;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}&action=${encodeURIComponent(action)}`);
    onClose();
  };

  const handleSignUp = () => {
    const currentPath = router.asPath;
    router.push(`/login?signup=true&redirect=${encodeURIComponent(currentPath)}&action=${encodeURIComponent(action)}`);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {title}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <BodyContent className="mb-4">
          {message || defaultMessage}
        </BodyContent>

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            variant="secondary"
            onClick={handleSignUp}
          >
            Create Free Account
          </Button>

          <Button
            variant="primary"
            onClick={handleLogin}
          >
            Sign In
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}