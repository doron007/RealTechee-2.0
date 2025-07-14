import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Divider
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { H3, P2, P3 } from '../../typography';

interface ArchiveItem {
  id: string;
  title?: string;
  address?: string;
  type?: 'project' | 'quote' | 'request';
  status?: string;
}

interface ArchiveConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: ArchiveItem[];
  itemType: 'projects' | 'quotes' | 'requests';
  loading?: boolean;
}

const getItemIcon = (type?: string) => {
  switch (type) {
    case 'project':
      return <HomeIcon color="primary" />;
    case 'quote':
      return <ReceiptIcon color="primary" />;
    case 'request':
      return <BusinessIcon color="primary" />;
    default:
      return <ArchiveIcon color="primary" />;
  }
};

const getItemTypeLabel = (itemType: string) => {
  switch (itemType) {
    case 'projects':
      return 'Project';
    case 'quotes':
      return 'Quote';
    case 'requests':
      return 'Request';
    default:
      return 'Item';
  }
};

export default function ArchiveConfirmationDialog({
  open,
  onClose,
  onConfirm,
  items,
  itemType,
  loading = false
}: ArchiveConfirmationDialogProps) {
  const itemCount = items.length;
  const isMultiple = itemCount > 1;
  const itemLabel = getItemTypeLabel(itemType);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 1
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ArchiveIcon color="warning" fontSize="large" />
          <Box>
            <H3>Archive {isMultiple ? `${itemCount} ${itemType}` : itemLabel}</H3>
            <P3 color="text.secondary">
              {isMultiple 
                ? `You are about to archive ${itemCount} ${itemType}`
                : `You are about to archive this ${itemLabel.toLowerCase()}`
              }
            </P3>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Archived items will be moved to the archive and hidden from the main view. 
            You can restore them later from the archived items view.
          </Typography>
        </Alert>

        <Box>
          <P2 className="mb-2 font-medium">
            {isMultiple 
              ? `${itemCount} ${itemType} will be archived:`
              : `This ${itemLabel.toLowerCase()} will be archived:`
            }
          </P2>

          <List sx={{ 
            maxHeight: 300, 
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'grey.50'
          }}>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getItemIcon(item.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.title || `${itemLabel} ${index + 1}`}
                        </Typography>
                        {item.status && (
                          <Typography variant="caption" color="text.secondary">
                            Status: {item.status}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      item.address && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ mt: 0.5, fontStyle: 'italic' }}
                        >
                          📍 {item.address}
                        </Typography>
                      )
                    }
                  />
                </ListItem>
                {index < items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {itemCount > 5 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              You are archiving a large number of items ({itemCount}). 
              This action may take a moment to complete.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="warning"
          disabled={loading}
          startIcon={loading ? undefined : <ArchiveIcon />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Archiving...' : `Archive ${isMultiple ? 'All' : itemLabel}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}