import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert
} from '@mui/material';
import { Restore, DeleteForever, Refresh } from '@mui/icons-material';
import { H3, P2 } from '../../typography';

export interface RestoreChangesDialogProps {
  open: boolean;
  onClose: () => void;
  onRestore: () => void;
  onDiscard: () => void;
  onRefresh: () => void;
  entityType: 'project' | 'quote' | 'request';
  entityId: string;
  lastModified: Date;
  hasChanges?: boolean;
}

const RestoreChangesDialog: React.FC<RestoreChangesDialogProps> = ({
  open,
  onClose,
  onRestore,
  onDiscard,
  onRefresh,
  entityType,
  entityId,
  lastModified,
  hasChanges = true
}) => {
  const getEntityName = () => {
    switch (entityType) {
      case 'project': return 'Project';
      case 'quote': return 'Quote';
      case 'request': return 'Request';
      default: return 'Item';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    }
  };

  const handleRestore = () => {
    onRestore();
    onClose();
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
  };

  const handleRefresh = () => {
    onRefresh();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Restore color="primary" />
          <H3>Unsaved Changes Found</H3>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            We found unsaved changes for this {getEntityName().toLowerCase()}. 
            You can restore your previous work or start fresh.
          </Alert>

          <Box sx={{ mb: 2 }}>
            <P2><strong>{getEntityName()} ID:</strong> {entityId?.slice(0, 8)}...</P2>
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
              <P2><strong>Last saved:</strong></P2>
              <Chip 
                size="small" 
                label={formatTimestamp(lastModified)}
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>

          {hasChanges && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Restoring will apply your previous unsaved changes to the current form. 
              You can continue editing from where you left off.
            </Typography>
          )}
        </Box>

        <Box sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          bgcolor: 'grey.50'
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            What would you like to do?
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              • <strong>Restore Changes:</strong> Apply your saved draft changes
            </Typography>
            <Typography variant="body2">
              • <strong>Start Fresh:</strong> Discard draft and load latest data from database
            </Typography>
            <Typography variant="body2">
              • <strong>Cancel:</strong> Keep current form state as-is
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          size="small"
        >
          Cancel
        </Button>
        
        <Button 
          onClick={handleRefresh}
          variant="outlined"
          startIcon={<Refresh />}
          color="secondary"
          size="small"
        >
          Start Fresh
        </Button>
        
        <Button 
          onClick={handleDiscard}
          variant="outlined"
          startIcon={<DeleteForever />}
          color="error"
          size="small"
        >
          Discard Draft
        </Button>
        
        <Button 
          onClick={handleRestore}
          variant="contained"
          startIcon={<Restore />}
          color="primary"
          size="small"
          autoFocus
        >
          Restore Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestoreChangesDialog;