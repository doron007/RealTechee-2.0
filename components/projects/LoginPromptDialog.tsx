import React from 'react';
import { Dialog, DialogContent, DialogTitle, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Button from '../common/buttons/Button';
import P2 from '../typography/P2';
import { useRouter } from 'next/router';

interface LoginPromptDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginPromptDialog({ open, onClose }: LoginPromptDialogProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
    onClose();
  };

  const handleSignUp = () => {
    router.push('/login?signup=true');
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
          Login Required
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <P2 className="mb-4">
          You need to be logged in to add comments. Please sign in to your existing account or create a free account to continue.
        </P2>

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
