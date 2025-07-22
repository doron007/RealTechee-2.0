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
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControlLabel,
  Switch,
  Card,
  CardContent
} from '@mui/material';
import {
  RestoreFromTrash as RestoreIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  NotificationsActive as NotificationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { requestsAPI, backOfficeAssignToAPI } from '../../../utils/amplifyAPI';
import { leadLifecycleService, type ReactivationRequest, type ReactivationResult } from '../../../services/leadLifecycleService';
import { assignmentService } from '../../../services/assignmentService';
import { leadScoringService } from '../../../services/leadScoringService';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('LeadReactivationWorkflow');

interface LeadReactivationWorkflowProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  requestData?: any;
  onSuccess?: (result: ReactivationResult) => void;
}

interface ReactivationStep {
  label: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

const LeadReactivationWorkflow: React.FC<LeadReactivationWorkflowProps> = ({
  open,
  onClose,
  requestId,
  requestData,
  onSuccess
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reactivationReason, setReactivationReason] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [resetTimer, setResetTimer] = useState(true);
  const [availableAssignees, setAvailableAssignees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadScore, setLeadScore] = useState<any>(null);
  const [reactivationHistory, setReactivationHistory] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const steps: ReactivationStep[] = [
    {
      label: 'Reactivation Assessment',
      description: 'Review lead quality and reactivation eligibility',
      completed: false
    },
    {
      label: 'Reactivation Details',
      description: 'Provide reason and configure reactivation settings',
      completed: false
    },
    {
      label: 'Assignment Selection',
      description: 'Choose the Account Executive for the reactivated lead',
      completed: false,
      optional: true
    },
    {
      label: 'Review & Confirm',
      description: 'Review all settings and confirm reactivation',
      completed: false
    }
  ];

  useEffect(() => {
    if (open && requestId) {
      initializeWorkflow();
    }
  }, [open, requestId]);

  const initializeWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available assignees
      const assignees = await assignmentService.getAvailableAEs();
      setAvailableAssignees(assignees);

      // Load lead score for assessment
      if (requestData?.status !== 'Archived') {
        try {
          const score = await leadScoringService.getLeadScore(requestId);
          setLeadScore(score);
        } catch (err) {
          logger.warn('Could not load lead score for assessment', { requestId, error: err });
        }
      }

      // Load reactivation history
      loadReactivationHistory();

    } catch (err) {
      logger.error('Error initializing reactivation workflow', { requestId, error: err });
      setError('Failed to initialize reactivation workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadReactivationHistory = async () => {
    try {
      // Parse office notes for previous reactivations
      const officeNotes = requestData?.officeNotes || '';
      const reactivationEntries = officeNotes
        .split('\n')
        .filter((line: string) => line.includes('Reactivated:'))
        .map((line: string, index: number) => ({
          id: index,
          timestamp: 'Previous', // Would parse from actual timestamps
          reason: line.replace('Reactivated:', '').trim()
        }));

      setReactivationHistory(reactivationEntries);
    } catch (err) {
      logger.warn('Error loading reactivation history', { requestId, error: err });
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    switch (activeStep) {
      case 1: // Reactivation Details
        if (!reactivationReason.trim()) {
          errors.reason = 'Reactivation reason is required';
        }
        break;
      case 2: // Assignment Selection
        if (selectedAssignee && selectedAssignee !== 'keep-current') {
          const assignee = availableAssignees.find(ae => ae.id === selectedAssignee);
          if (!assignee || !assignee.active) {
            errors.assignee = 'Selected assignee is not available';
          }
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleReactivate = async () => {
    try {
      if (!validateCurrentStep()) {
        return;
      }

      setLoading(true);
      setError(null);

      // Prepare reactivation request
      const reactivationRequest: ReactivationRequest = {
        requestId,
        reasonForReactivation: reactivationReason,
        newAssignee: selectedAssignee && selectedAssignee !== 'keep-current' ? selectedAssignee : undefined,
        userId: 'current-user', // Would get from auth context
        resetExpirationTimer: resetTimer
      };

      // Execute reactivation
      const result = await leadLifecycleService.reactivateLead(reactivationRequest);

      if (result.success) {
        logger.info('Lead reactivated successfully', { requestId, result });
        if (onSuccess) {
          onSuccess(result);
        }
        onClose();
      } else {
        setError(result.error || 'Failed to reactivate lead');
      }

    } catch (err) {
      logger.error('Error reactivating lead', { requestId, error: err });
      setError('An unexpected error occurred during reactivation');
    } finally {
      setLoading(false);
    }
  };

  const renderAssessmentStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Lead Reactivation Assessment
      </Typography>

      {/* Reactivation Eligibility */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Reactivation Eligibility
          </Typography>
          {requestData?.reactivationCount >= 3 ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This lead has reached the maximum number of reactivations (3). 
                Additional reactivations require manager approval.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This lead is eligible for reactivation. 
                Reactivations used: {requestData?.reactivationCount || 0}/3
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Chip 
              label={`Status: ${requestData?.status || 'Unknown'}`}
              color={['Expired', 'Archived'].includes(requestData?.status) ? 'default' : 'primary'}
              size="small"
            />
            <Chip 
              label={`Source: ${requestData?.leadSource || 'Unknown'}`}
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`Product: ${requestData?.product || 'Unknown'}`}
              variant="outlined"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Lead Score Assessment */}
      {leadScore && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Lead Quality Assessment
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h4" color="primary">
                {leadScore.grade}
              </Typography>
              <Box>
                <Typography variant="body1">
                  Score: {leadScore.overallScore.toFixed(1)}/100
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conversion Probability: {(leadScore.conversionProbability * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Box>

            {leadScore.recommendations && leadScore.recommendations.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations:
                </Typography>
                <List dense>
                  {leadScore.recommendations.slice(0, 3).map((rec: string, index: number) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <InfoIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={rec}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reactivation History */}
      {reactivationHistory.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Previous Reactivations
            </Typography>
            <List dense>
              {reactivationHistory.map((entry) => (
                <ListItem key={entry.id} sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <RestoreIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={entry.reason}
                    secondary={entry.timestamp}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderReactivationDetailsStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Reactivation Details
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={4}
        label="Reason for Reactivation"
        value={reactivationReason}
        onChange={(e) => setReactivationReason(e.target.value)}
        error={!!validationErrors.reason}
        helperText={validationErrors.reason || 'Explain why this lead should be reactivated'}
        sx={{ mb: 3 }}
        placeholder="e.g., Client reached out with renewed interest, budget now available, timeline changed..."
      />

      <FormControlLabel
        control={
          <Switch
            checked={resetTimer}
            onChange={(e) => setResetTimer(e.target.checked)}
          />
        }
        label="Reset expiration timer"
        sx={{ mb: 2 }}
      />
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        When enabled, the lead's creation date will be reset to today for expiration calculations.
        This gives the reactivated lead a fresh 14-day lifecycle period.
      </Typography>

      {!resetTimer && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            The lead will maintain its original creation date and may expire soon 
            based on the existing timeline.
          </Typography>
        </Alert>
      )}
    </Box>
  );

  const renderAssignmentStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Assignment Selection
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose who should handle this reactivated lead. You can keep the current assignment
        or reassign to a different Account Executive.
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Account Executive</InputLabel>
        <Select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          error={!!validationErrors.assignee}
        >
          <MenuItem value="keep-current">
            Keep Current Assignment ({requestData?.assignedTo || 'Unassigned'})
          </MenuItem>
          <Divider />
          {availableAssignees
            .filter(ae => ae.active && ae.name !== 'Unassigned')
            .map((ae) => (
              <MenuItem key={ae.id} value={ae.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>{ae.name}</Typography>
                  {ae.currentWorkload && (
                    <Chip 
                      label={`${ae.currentWorkload} active`}
                      size="small"
                      variant="outlined"
                      color={ae.currentWorkload > 10 ? 'warning' : 'default'}
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
        </Select>
        {validationErrors.assignee && (
          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
            {validationErrors.assignee}
          </Typography>
        )}
      </FormControl>

      {selectedAssignee && selectedAssignee !== 'keep-current' && (
        <Alert severity="info">
          <Typography variant="body2">
            The selected Account Executive will be notified about the reactivated lead
            and it will appear in their active assignments.
          </Typography>
        </Alert>
      )}
    </Box>
  );

  const renderReviewStep = () => {
    const selectedAE = selectedAssignee === 'keep-current' 
      ? { name: requestData?.assignedTo || 'Unassigned' }
      : availableAssignees.find(ae => ae.id === selectedAssignee);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Review & Confirm Reactivation
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Reactivation Summary
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon><RestoreIcon /></ListItemIcon>
                <ListItemText 
                  primary="Reason"
                  secondary={reactivationReason}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><AssignmentIcon /></ListItemIcon>
                <ListItemText 
                  primary="Assigned To"
                  secondary={selectedAE?.name || 'Unknown'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><ScheduleIcon /></ListItemIcon>
                <ListItemText 
                  primary="Expiration Timer"
                  secondary={resetTimer ? 'Reset to 14 days from today' : 'Keep original timeline'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon><NotificationIcon /></ListItemIcon>
                <ListItemText 
                  primary="Notifications"
                  secondary="Assigned AE will be notified via email"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Important:</strong> Reactivating this lead will change its status to "Pending walk-thru" 
            and make it active in the system again. This action cannot be undone automatically.
          </Typography>
        </Alert>
      </Box>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderAssessmentStep();
      case 1:
        return renderReactivationDetailsStep();
      case 2:
        return renderAssignmentStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestoreIcon color="primary" />
          <Typography variant="h6">
            Reactivate Lead
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Request ID: {requestId}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  step.optional && (
                    <Typography variant="caption">Optional</Typography>
                  )
                }
              >
                <Typography variant="subtitle1">{step.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                {index === activeStep && (
                  <Box sx={{ mt: 2 }}>
                    {renderStepContent()}
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button 
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={loading}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleReactivate}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={<RestoreIcon />}
          >
            {loading ? 'Reactivating...' : 'Reactivate Lead'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LeadReactivationWorkflow;