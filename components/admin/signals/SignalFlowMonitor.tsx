import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H3, H4, P1, P2 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import Button from '../../common/buttons/Button';
import { DateTimeUtils } from '../../../utils/dateTimeUtils';
import { 
  Box, 
  Card, 
  CardContent, 
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Typography,
  Chip,
  Alert,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Sms as SmsIcon
} from '@mui/icons-material';

const client = generateClient();

interface SignalFlowData {
  signal: {
    id: string;
    signalType: string;
    payload: any;
    emittedAt: string;
    processed: boolean;
    source: string;
  };
  hooks: Array<{
    id: string;
    signalType: string;
    channel: string;
    templateId: string;
    recipientEmail: string;
  }>;
  notifications: Array<{
    id: string;
    eventType: string;
    status: string;
    templateId: string;
    createdAt: string;
    sentAt?: string;
    deliveryChannel?: string;
    recipientIds: string;
    payload?: any;
  }>;
  template?: {
    id: string;
    formType: string;
    emailSubject: string;
    emailContentHtml: string;
    smsContent: string;
  };
}

interface SignalFlowMonitorProps {
  signalId?: string;
  showLatest?: boolean;
}

const SignalFlowMonitor: React.FC<SignalFlowMonitorProps> = ({ 
  signalId, 
  showLatest = false 
}) => {
  const [flowData, setFlowData] = useState<SignalFlowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedSignalId, setSelectedSignalId] = useState<string>(signalId || '');
  const [showPayloadDialog, setShowPayloadDialog] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState<any>(null);

  // Fetch signal flow data
  const fetchSignalFlow = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');

      // 1. Fetch signal details
      const getSignalQuery = `
        query GetSignalEvents($id: ID!) {
          getSignalEvents(id: $id) {
            id
            signalType
            payload
            emittedAt
            processed
            source
          }
        }
      `;

      const signalResult = await client.graphql({
        query: getSignalQuery,
        variables: { id }
      }) as any;

      const signal = signalResult.data?.getSignalEvents;
      if (!signal) {
        setError('Signal not found');
        return;
      }

      // 2. Fetch notification hooks for this signal type
      const listHooksQuery = `
        query ListSignalNotificationHooks {
          listSignalNotificationHooks {
            items {
              id
              signalType
              channel
              templateId
              recipientEmail
            }
          }
        }
      `;

      const hooksResult = await client.graphql({
        query: listHooksQuery
      }) as any;

      const allHooks = hooksResult.data?.listSignalNotificationHooks?.items || [];
      const matchingHooks = allHooks.filter((hook: any) => hook.signalType === signal.signalType);

      // 3. Fetch notifications created from this signal
      const listNotificationsQuery = `
        query ListNotificationQueues {
          listNotificationQueues {
            items {
              id
              eventType
              status
              templateId
              signalEventId
              createdAt
              sentAt
              deliveryChannel
              recipientIds
              payload
            }
          }
        }
      `;

      const notificationsResult = await client.graphql({
        query: listNotificationsQuery
      }) as any;

      const allNotifications = notificationsResult.data?.listNotificationQueues?.items || [];
      const signalNotifications = allNotifications.filter((n: any) => n.signalEventId === id);

      // 4. Fetch template details if notifications exist
      let template = null;
      if (signalNotifications.length > 0 && signalNotifications[0].templateId) {
        const getTemplateQuery = `
          query GetNotificationTemplate($id: ID!) {
            getNotificationTemplate(id: $id) {
              id
              formType
              emailSubject
              emailContentHtml
              smsContent
            }
          }
        `;

        try {
          const templateResult = await client.graphql({
            query: getTemplateQuery,
            variables: { id: signalNotifications[0].templateId }
          }) as any;
          template = templateResult.data?.getNotificationTemplate;
        } catch (templateError) {
          console.warn('Could not fetch template:', templateError);
        }
      }

      setFlowData({
        signal: {
          ...signal,
          payload: JSON.parse(signal.payload || '{}')
        },
        hooks: matchingHooks,
        notifications: signalNotifications.map((n: any) => ({
          ...n,
          payload: n.payload ? JSON.parse(n.payload) : null
        })),
        template
      });

    } catch (err) {
      console.error('Error fetching signal flow:', err);
      setError('Failed to fetch signal flow data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch latest signal if showLatest is true
  const fetchLatestSignal = useCallback(async () => {
    try {
      const listSignalsQuery = `
        query ListSignalEvents($limit: Int) {
          listSignalEvents(limit: $limit) {
            items {
              id
              signalType
              emittedAt
            }
          }
        }
      `;

      const result = await client.graphql({
        query: listSignalsQuery,
        variables: { limit: 1 }
      }) as any;

      const signals = result.data?.listSignalEvents?.items || [];
      if (signals.length > 0) {
        const latestSignal = signals[0];
        setSelectedSignalId(latestSignal.id);
        await fetchSignalFlow(latestSignal.id);
      }
    } catch (err) {
      console.error('Error fetching latest signal:', err);
      setError('Failed to fetch latest signal');
    }
  }, [fetchSignalFlow]);

  // Initial load
  useEffect(() => {
    if (selectedSignalId) {
      fetchSignalFlow(selectedSignalId);
    } else if (showLatest) {
      fetchLatestSignal();
    }
  }, [selectedSignalId, showLatest, fetchSignalFlow, fetchLatestSignal]);

  const getStepStatus = (stepIndex: number) => {
    if (!flowData) return 'pending';

    switch (stepIndex) {
      case 0: // Signal emitted
        return 'completed';
      case 1: // Hooks matched
        return flowData.hooks.length > 0 ? 'completed' : 'error';
      case 2: // Signal processed
        return flowData.signal.processed ? 'completed' : 'pending';
      case 3: // Notifications created
        return flowData.notifications.length > 0 ? 'completed' : 'pending';
      case 4: // Notifications sent
        const sentNotifications = flowData.notifications.filter(n => n.status === 'SENT');
        return sentNotifications.length > 0 ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <ScheduleIcon color="action" />;
      default:
        return <ScheduleIcon color="action" />;
    }
  };

  const showPayload = (payload: any, title: string) => {
    setSelectedPayload({ data: payload, title });
    setShowPayloadDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <P1>Loading signal flow...</P1>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!flowData) {
    return (
      <Card>
        <CardContent>
          <P1>No signal data available</P1>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <H3>Signal Processing Flow</H3>
            <Button
              variant="outlined"
              onClick={() => fetchSignalFlow(selectedSignalId)}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {/* Signal Overview */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <H4>Signal: {flowData.signal.signalType}</H4>
                <P2>ID: {flowData.signal.id}</P2>
                <P2>Emitted: {new Date(flowData.signal.emittedAt).toLocaleString()}</P2>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <StatusPill 
                  status={flowData.signal.processed ? 'processed' : 'pending'}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => showPayload(flowData.signal.payload, 'Signal Payload')}
                >
                  View Payload
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Processing Steps */}
          <Stepper orientation="vertical">
            {/* Step 1: Signal Emitted */}
            <Step expanded active>
              <StepLabel icon={getStepIcon('completed')}>
                Signal Emitted
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <P2>Signal successfully emitted from {flowData.signal.source}</P2>
                  <P2>Type: {flowData.signal.signalType}</P2>
                  <P2>Time: {new Date(flowData.signal.emittedAt).toLocaleString()}</P2>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Hooks Matched */}
            <Step expanded active>
              <StepLabel icon={getStepIcon(getStepStatus(1))}>
                Notification Hooks Matched ({flowData.hooks.length})
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {flowData.hooks.length > 0 ? (
                    flowData.hooks.map((hook, index) => (
                      <Box key={hook.id} sx={{ mb: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          {hook.channel === 'email' ? <EmailIcon /> : <SmsIcon />}
                          <Box>
                            <P2><strong>Channel:</strong> {hook.channel}</P2>
                            <P2><strong>Template:</strong> {hook.templateId}</P2>
                            <P2><strong>Recipient:</strong> {hook.recipientEmail}</P2>
                          </Box>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Alert severity="warning">No notification hooks found for this signal type</Alert>
                  )}
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Signal Processed */}
            <Step expanded active>
              <StepLabel icon={getStepIcon(getStepStatus(2))}>
                Signal Processed by Lambda
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {flowData.signal.processed ? (
                    <Alert severity="success">Signal processed successfully</Alert>
                  ) : (
                    <Alert severity="warning">Signal processing pending</Alert>
                  )}
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Notifications Created */}
            <Step expanded active>
              <StepLabel icon={getStepIcon(getStepStatus(3))}>
                Notifications Created ({flowData.notifications.length})
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {flowData.notifications.length > 0 ? (
                    flowData.notifications.map((notification, index) => (
                      <Box key={notification.id} sx={{ mb: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <P2><strong>ID:</strong> {notification.id}</P2>
                            <P2><strong>Status:</strong> {notification.status}</P2>
                            <P2><strong>Created:</strong> {new Date(notification.createdAt).toLocaleString()}</P2>
                            {notification.sentAt && (
                              <P2><strong>Sent:</strong> {new Date(notification.sentAt).toLocaleString()}</P2>
                            )}
                          </Box>
                          {notification.payload && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => showPayload(notification.payload, `Notification ${notification.id}`)}
                            >
                              View Payload
                            </Button>
                          )}
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Alert severity="warning">No notifications created yet</Alert>
                  )}
                </Box>
              </StepContent>
            </Step>

            {/* Step 5: Template Processing */}
            {flowData.template && (
              <Step expanded active>
                <StepLabel icon={getStepIcon('completed')}>
                  Template Processing
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Template: {flowData.template.id}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                          <P2><strong>Form Type:</strong> {flowData.template.formType}</P2>
                          <P2><strong>Email Subject:</strong> {flowData.template.emailSubject}</P2>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <H4>Email Template (HTML)</H4>
                          <Paper sx={{ p: 1, maxHeight: 200, overflow: 'auto', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {flowData.template.emailContentHtml}
                          </Paper>
                        </Box>
                        <Box>
                          <H4>SMS Template</H4>
                          <Paper sx={{ p: 1, fontSize: '0.875rem' }}>
                            {flowData.template.smsContent}
                          </Paper>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                </StepContent>
              </Step>
            )}
          </Stepper>
        </CardContent>
      </Card>

      {/* Payload Dialog */}
      <Dialog 
        open={showPayloadDialog} 
        onClose={() => setShowPayloadDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedPayload?.title}</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <pre style={{ fontSize: '0.875rem', overflow: 'auto', maxHeight: '400px' }}>
              {JSON.stringify(selectedPayload?.data, null, 2)}
            </pre>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPayloadDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SignalFlowMonitor;