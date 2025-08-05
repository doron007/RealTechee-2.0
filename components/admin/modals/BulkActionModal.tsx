import React, { useState } from 'react';
import { Button, Alert, List, ListItem, ListItemText, Chip, Box } from '@mui/material';
import BaseModal from '../../common/modals/BaseModal';
import { H4, P2 } from '../../typography';
import { NotificationItem, NotificationQueueStatus } from '../../../types/notifications';

interface BulkActionModalProps {
  open: boolean;
  onClose: () => void;
  selectedNotifications: NotificationItem[];
  action: 'delete' | 'retry' | 'fail';
  onConfirm: () => Promise<void>;
}

const BulkActionModal: React.FC<BulkActionModalProps> = ({
  open,
  onClose,
  selectedNotifications,
  action,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  const getActionConfig = () => {
    switch (action) {
      case 'delete':
        return {
          title: 'Delete Notifications',
          description: 'This will permanently delete the selected notifications from the queue.',
          confirmText: 'Delete All',
          alertSeverity: 'error' as const,
          buttonColor: 'error' as const
        };
      case 'retry':
        return {
          title: 'Retry Notifications',
          description: 'This will reset the selected notifications to PENDING status for retry.',
          confirmText: 'Retry All',
          alertSeverity: 'info' as const,
          buttonColor: 'primary' as const
        };
      case 'fail':
        return {
          title: 'Mark as Failed',
          description: 'This will mark the selected notifications as FAILED.',
          confirmText: 'Mark All Failed',
          alertSeverity: 'warning' as const,
          buttonColor: 'warning' as const
        };
      default:
        return {
          title: 'Bulk Action',
          description: 'Perform bulk action on selected notifications.',
          confirmText: 'Confirm',
          alertSeverity: 'info' as const,
          buttonColor: 'primary' as const
        };
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const config = getActionConfig();

  const getStatusBadgeClass = (status: NotificationQueueStatus) => {
    const classes = {
      [NotificationQueueStatus.SENT]: 'bg-green-100 text-green-800',
      [NotificationQueueStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [NotificationQueueStatus.FAILED]: 'bg-red-100 text-red-800',
      [NotificationQueueStatus.RETRYING]: 'bg-orange-100 text-orange-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={config.title}
      subtitle={`${selectedNotifications.length} notification(s) selected`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <Alert severity={config.alertSeverity}>
          {config.description}
        </Alert>

        <div>
          <H4 className="mb-2">Selected Notifications:</H4>
          <div className="max-h-64 overflow-y-auto border rounded">
            <List dense>
              {selectedNotifications.map((notification) => (
                <ListItem key={notification.id} divider>
                  <ListItemText
                    primary={
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{notification.eventType}</span>
                        <Chip
                          label={notification.status}
                          size="small"
                          className={getStatusBadgeClass(notification.status)}
                        />
                      </div>
                    }
                    secondary={
                      <div className="text-sm text-gray-600">
                        <div>ID: {notification.id.slice(0, 12)}...</div>
                        <div>Created: {new Date(notification.createdAt).toLocaleString()}</div>
                        {notification.errorMessage && (
                          <div className="text-red-600 mt-1">
                            Error: {notification.errorMessage.substring(0, 60)}...
                          </div>
                        )}
                      </div>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded">
          <P2 className="font-medium mb-1">Summary:</P2>
          <div className="text-sm text-gray-600">
            <div>Total notifications: {selectedNotifications.length}</div>
            <div>Pending: {selectedNotifications.filter(n => n.status === NotificationQueueStatus.PENDING).length}</div>
            <div>Sent: {selectedNotifications.filter(n => n.status === NotificationQueueStatus.SENT).length}</div>
            <div>Failed: {selectedNotifications.filter(n => n.status === NotificationQueueStatus.FAILED).length}</div>
            <div>Retrying: {selectedNotifications.filter(n => n.status === NotificationQueueStatus.RETRYING).length}</div>
          </div>
        </div>

        {action === 'delete' && (
          <Alert severity="warning">
            <strong>Warning:</strong> This action cannot be undone. Deleted notifications will be logged for audit purposes.
          </Alert>
        )}

        <Box className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={config.buttonColor}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : config.confirmText}
          </Button>
        </Box>
      </div>
    </BaseModal>
  );
};

export default BulkActionModal;