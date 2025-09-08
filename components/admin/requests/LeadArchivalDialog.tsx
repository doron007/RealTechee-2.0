'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ContactMail as ContactIcon,
  AttachMoney as BudgetIcon,
  Schedule as ScheduleIcon,
  Source as SourceIcon
} from '@mui/icons-material';
import { leadLifecycleService, type ArchivalRequest, type ArchivalResult, type ArchivalReason } from '../../../services/business/leadLifecycleService';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('LeadArchivalDialog');

interface LeadArchivalDialogProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  requestData?: any;
  onSuccess?: (result: ArchivalResult) => void;
}

const LeadArchivalDialog: React.FC<LeadArchivalDialogProps> = ({
  open,
  onClose,
  requestId,
  requestData,
  onSuccess
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [archivalNotes, setArchivalNotes] = useState('');
  const [notifyStakeholders, setNotifyStakeholders] = useState(true);
  const [preserveForAnalytics, setPreserveForAnalytics] = useState(true);
  const [availableReasons, setAvailableReasons] = useState<ArchivalReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadArchivalReasons();
    }
  }, [open]);

  const loadArchivalReasons = () => {
    try {
      const reasons = leadLifecycleService.getArchivalReasons();
      setAvailableReasons(reasons);
      logger.info('Archival reasons loaded', { count: reasons.length });
    } catch (err) {
      logger.error('Error loading archival reasons', err);
      setError('Failed to load archival reasons');
    }
  };

  const getReasonsByCategory = () => {
    const categories = availableReasons.reduce((acc, reason) => {
      if (!acc[reason.category]) {
        acc[reason.category] = [];
      }
      acc[reason.category].push(reason);
      return acc;
    }, {} as Record<string, ArchivalReason[]>);

    // Sort each category by order
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => a.order - b.order);
    });

    return categories;
  };

  const getCategoryDisplayName = (category: string): string => {
    switch (category) {
      case 'completed':
        return 'Successfully Completed';
      case 'cancelled':
        return 'Client Cancelled';
      case 'expired':
        return 'Expired/Timed Out';
      case 'duplicate':
        return 'Duplicate Request';
      case 'unqualified':
        return 'Unqualified Lead';
      case 'other':
        return 'Other Reasons';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'warning';
      case 'expired':
        return 'error';
      case 'duplicate':
        return 'info';
      case 'unqualified':
        return 'default';
      case 'other':
        return 'default';
      default:
        return 'default';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedReasonId) {
      errors.reason = 'Please select an archival reason';
    } else {
      const selectedReason = availableReasons.find(r => r.id === selectedReasonId);
      if (selectedReason?.requiresNotes && !archivalNotes.trim()) {
        errors.notes = 'Notes are required for this archival reason';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleArchive = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setError(null);

      const archivalRequest: ArchivalRequest = {
        requestId,
        reasonId: selectedReasonId,
        notes: archivalNotes.trim() || undefined,
        userId: 'current-user', // Would get from auth context
        preserveForAnalytics,
        notifyStakeholders
      };

      const result = await leadLifecycleService.archiveLead(archivalRequest);

      if (result.success) {
        logger.info('Lead archived successfully', { requestId, result });
        if (onSuccess) {
          onSuccess(result);
        }
        onClose();
      } else {
        setError(result.error || 'Failed to archive lead');
      }

    } catch (err) {
      logger.error('Error archiving lead', { requestId, error: err });
      setError('An unexpected error occurred while archiving the lead');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedReasonId('');
      setArchivalNotes('');
      setError(null);
      setValidationErrors({});
      onClose();
    }
  };

  const selectedReason = availableReasons.find(r => r.id === selectedReasonId);
  const reasonCategories = getReasonsByCategory();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArchiveIcon color="warning" />
          <Typography variant="h6">
            Archive Lead
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Request ID: {requestId}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Lead Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Lead Summary
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<SourceIcon />}
                label={`Source: ${requestData?.leadSource || 'Unknown'}`}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<ContactIcon />}
                label={`Client: ${requestData?.clientName || 'Unknown'}`}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<BudgetIcon />}
                label={`Budget: ${requestData?.budget || 'Not specified'}`}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<ScheduleIcon />}
                label={`Status: ${requestData?.status || 'Unknown'}`}
                color={requestData?.status === 'New' ? 'primary' : 'default'}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Archival Reason Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Reason for Archival
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the primary reason this lead is being archived. This helps with analytics and reporting.
          </Typography>

          <FormControl fullWidth error={!!validationErrors.reason}>
            <InputLabel>Archival Reason</InputLabel>
            <Select
              value={selectedReasonId}
              onChange={(e) => setSelectedReasonId(e.target.value)}
              label="Archival Reason"
            >
              {Object.entries(reasonCategories).map(([category, reasons]) => [
                <ListItem key={`header-${category}`} dense>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" color="primary">
                        {getCategoryDisplayName(category)}
                      </Typography>
                    }
                  />
                </ListItem>,
                ...reasons.map((reason) => (
                  <MenuItem key={reason.id} value={reason.id} sx={{ pl: 4 }}>
                    <Box>
                      <Typography variant="body2">
                        {reason.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reason.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                )),
                <Divider key={`divider-${category}`} />
              ]).flat()}
            </Select>
            {validationErrors.reason && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {validationErrors.reason}
              </Typography>
            )}
          </FormControl>
        </Box>

        {/* Selected Reason Details */}
        {selectedReason && (
          <Alert 
            severity={getCategoryColor(selectedReason.category) as any}
            sx={{ mb: 3 }}
          >
            <Typography variant="body2">
              <strong>{selectedReason.label}:</strong> {selectedReason.description}
              {selectedReason.requiresNotes && (
                <Typography component="span" color="warning.main">
                  {' '}(Notes required)
                </Typography>
              )}
            </Typography>
          </Alert>
        )}

        {/* Archival Notes */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={selectedReason?.requiresNotes ? 'Archival Notes (Required)' : 'Archival Notes (Optional)'}
            value={archivalNotes}
            onChange={(e) => setArchivalNotes(e.target.value)}
            error={!!validationErrors.notes}
            helperText={
              validationErrors.notes || 
              'Provide additional context about why this lead is being archived'
            }
            placeholder="e.g., Client decided to postpone project, No response after multiple attempts, Budget constraints..."
            required={selectedReason?.requiresNotes}
          />
        </Box>

        {/* Archival Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Archival Options
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={preserveForAnalytics}
                onChange={(e) => setPreserveForAnalytics(e.target.checked)}
              />
            }
            label="Preserve for Analytics"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
            Keep this lead data for performance analytics and reporting purposes.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={notifyStakeholders}
                onChange={(e) => setNotifyStakeholders(e.target.checked)}
              />
            }
            label="Notify Stakeholders"
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            Send notification to assigned Account Executive and admin team about the archival.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning">
          <Typography variant="body2">
            <strong>Important:</strong> Archiving this lead will remove it from active work queues 
            and change its status to "Archived". This action can be reversed through the reactivation workflow.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={handleArchive}
          variant="contained"
          color="warning"
          disabled={loading || !selectedReasonId}
          startIcon={<ArchiveIcon />}
        >
          {loading ? 'Archiving...' : 'Archive Lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadArchivalDialog;