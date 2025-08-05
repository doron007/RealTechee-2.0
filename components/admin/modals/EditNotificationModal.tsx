import React, { useState, useEffect } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Box } from '@mui/material';
import BaseModal from '../../common/modals/BaseModal';
import { H4, P2 } from '../../typography';
import { NotificationItem, NotificationQueueStatus } from '../../../types/notifications';

interface EditNotificationModalProps {
  open: boolean;
  onClose: () => void;
  notification: NotificationItem | null;
  onSave: (updatedNotification: Partial<NotificationItem>) => Promise<void>;
  onResend: (notification: NotificationItem) => Promise<void>;
}

const EditNotificationModal: React.FC<EditNotificationModalProps> = ({
  open,
  onClose,
  notification,
  onSave,
  onResend
}) => {
  const [editedData, setEditedData] = useState<Partial<NotificationItem>>({});
  const [loading, setLoading] = useState(false);
  const [payloadError, setPayloadError] = useState('');

  useEffect(() => {
    if (notification) {
      setEditedData({
        eventType: notification.eventType,
        templateId: notification.templateId,
        payload: notification.payload,
        recipientIds: notification.recipientIds,
        channels: notification.channels,
        status: notification.status
      });
      setPayloadError('');
    }
  }, [notification]);

  const parseChannels = (channels: string | string[]) => {
    try {
      if (typeof channels !== 'string') {
        return Array.isArray(channels) ? channels : [];
      }
      let parsed = JSON.parse(channels);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseRecipients = (recipients: string | string[]) => {
    try {
      if (typeof recipients !== 'string') {
        return Array.isArray(recipients) ? recipients : [];
      }
      let parsed = JSON.parse(recipients);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handlePayloadChange = (value: string) => {
    setEditedData(prev => ({ ...prev, payload: value }));
    
    // Validate JSON
    try {
      JSON.parse(value);
      setPayloadError('');
    } catch (error) {
      setPayloadError('Invalid JSON format');
    }
  };

  const handleChannelChange = (newChannels: string[]) => {
    setEditedData(prev => ({ 
      ...prev, 
      channels: JSON.stringify(newChannels) 
    }));
  };

  const handleRecipientChange = (newRecipients: string[]) => {
    setEditedData(prev => ({ 
      ...prev, 
      recipientIds: JSON.stringify(newRecipients) 
    }));
  };

  const handleSave = async () => {
    if (payloadError || !notification) return;
    
    setLoading(true);
    try {
      await onSave(editedData);
      onClose();
    } catch (error) {
      console.error('Failed to save notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!notification) return;
    
    setLoading(true);
    try {
      const updatedNotification = { ...notification, ...editedData };
      await onResend(updatedNotification as NotificationItem);
      onClose();
    } catch (error) {
      console.error('Failed to resend notification:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!notification) return null;

  const currentChannels = parseChannels(editedData.channels || notification.channels);
  const currentRecipients = parseRecipients(editedData.recipientIds || notification.recipientIds);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Edit & Resend Notification"
      subtitle={`ID: ${notification.id.slice(0, 8)}... | ${notification.eventType}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Event Type"
            value={editedData.eventType || ''}
            onChange={(e) => setEditedData(prev => ({ ...prev, eventType: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
          />
          <TextField
            label="Template ID"
            value={editedData.templateId || ''}
            onChange={(e) => setEditedData(prev => ({ ...prev, templateId: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
          />
        </div>

        {/* Status */}
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={editedData.status || notification.status}
            onChange={(e) => setEditedData(prev => ({ ...prev, status: e.target.value as NotificationQueueStatus }))}
            label="Status"
          >
            <MenuItem value={NotificationQueueStatus.PENDING}>Pending</MenuItem>
            <MenuItem value={NotificationQueueStatus.SENT}>Sent</MenuItem>
            <MenuItem value={NotificationQueueStatus.FAILED}>Failed</MenuItem>
            <MenuItem value={NotificationQueueStatus.RETRYING}>Retrying</MenuItem>
          </Select>
        </FormControl>

        {/* Channels */}
        <div>
          <H4 className="mb-2">Channels</H4>
          <div className="flex flex-wrap gap-2 mb-2">
            {['EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM'].map(channel => (
              <Chip
                key={channel}
                label={channel}
                variant={currentChannels.includes(channel) ? 'filled' : 'outlined'}
                onClick={() => {
                  const newChannels = currentChannels.includes(channel)
                    ? currentChannels.filter(c => c !== channel)
                    : [...currentChannels, channel];
                  handleChannelChange(newChannels);
                }}
                className="cursor-pointer"
                color={currentChannels.includes(channel) ? 'primary' : 'default'}
              />
            ))}
          </div>
          <P2 className="text-gray-500">Selected: {currentChannels.join(', ') || 'None'}</P2>
        </div>

        {/* Recipients */}
        <div>
          <H4 className="mb-2">Recipients</H4>
          <div className="flex flex-wrap gap-2 mb-2">
            {['admin-team', 'sales-team', 'support-team'].map(recipient => (
              <Chip
                key={recipient}
                label={recipient}
                variant={currentRecipients.includes(recipient) ? 'filled' : 'outlined'}
                onClick={() => {
                  const newRecipients = currentRecipients.includes(recipient)
                    ? currentRecipients.filter(r => r !== recipient)
                    : [...currentRecipients, recipient];
                  handleRecipientChange(newRecipients);
                }}
                className="cursor-pointer"
                color={currentRecipients.includes(recipient) ? 'primary' : 'default'}
              />
            ))}
          </div>
          <P2 className="text-gray-500">Selected: {currentRecipients.join(', ') || 'None'}</P2>
        </div>

        {/* Payload Editor */}
        <div>
          <H4 className="mb-2">Payload Data</H4>
          <TextField
            multiline
            rows={8}
            value={editedData.payload || ''}
            onChange={(e) => handlePayloadChange(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="Enter JSON payload..."
            error={!!payloadError}
            helperText={payloadError || 'Must be valid JSON format'}
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: '12px'
              }
            }}
          />
        </div>

        {/* Action Buttons */}
        <Box className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSave}
            disabled={loading || !!payloadError}
          >
            Save Changes
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleResend}
            disabled={loading || !!payloadError}
          >
            {loading ? 'Processing...' : 'Save & Resend'}
          </Button>
        </Box>
      </div>
    </BaseModal>
  );
};

export default EditNotificationModal;