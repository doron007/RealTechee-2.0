import React, { useState, useEffect, useCallback } from 'react';
import { H2, H3, H4, P1, P2 } from '../../typography';
import Button from '../../common/buttons/Button';
import { signalNotificationHooksAPI } from '../../../utils/amplifyAPI';
import { 
  Box, 
  Card, 
  CardContent, 
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button as MuiButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface NotificationHook {
  id: string;
  signalType: string;
  notificationTemplateId: string;
  channel?: string; // 'email' or 'sms'
  enabled: boolean;
  priority?: string; // 'low', 'medium', 'high'
  
  // Recipient Configuration
  recipientEmails?: any;
  recipientRoles?: any;
  recipientDynamic?: any;
  
  // Advanced Configuration
  conditions?: any;
  deliveryDelay?: number;
  maxRetries?: number;
  
  // Audit fields
  createdBy?: string;
  lastModifiedBy?: string;
  
  // Legacy support
  channels?: any;
  
  createdAt: string;
  updatedAt: string;
  
  // UI helper fields
  name?: string; // Computed from signalType
  recipients?: string[]; // Computed from recipientEmails
}

interface RecipientConfig {
  toEmails: string[];
  ccEmails: string[];
  toRoles: string[];
  ccRoles: string[];
}

type UserRole = 'super_admin' | 'admin' | 'accounting' | 'srm' | 'agent' | 'homeowner' | 'provider' | 'guest';

const USER_ROLES: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
  { value: 'admin', label: 'Admin', description: 'Administrative access' },
  { value: 'accounting', label: 'Accounting', description: 'Financial management' },
  { value: 'srm', label: 'SRM (Sales)', description: 'Sales relationship management' },
  { value: 'agent', label: 'Agent', description: 'Real estate agents' },
  { value: 'homeowner', label: 'Homeowner', description: 'Property owners' },
  { value: 'provider', label: 'Provider', description: 'Service providers' },
  { value: 'guest', label: 'Guest', description: 'Guest access' }
];

interface SignalMapping {
  signalType: string;
  displayName: string;
  description: string;
  defaultTemplate: string;
  defaultChannels: Array<'email' | 'sms'>;
  isSystemManaged: boolean;
}

interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  recipients: string[];
  isDefault: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const SIGNAL_TYPES: Record<string, SignalMapping> = {
  'CONTACT_US_FORM_SUBMITTED': {
    signalType: 'CONTACT_US_FORM_SUBMITTED',
    displayName: 'Contact Us Form',
    description: 'Submitted through the main contact form',
    defaultTemplate: 'contact_us_notification',
    defaultChannels: ['email', 'sms'],
    isSystemManaged: false
  },
  'GET_ESTIMATE_FORM_SUBMITTED': {
    signalType: 'GET_ESTIMATE_FORM_SUBMITTED',
    displayName: 'Get Estimate Form',
    description: 'Request for project estimate submission',
    defaultTemplate: 'estimate_request_notification',
    defaultChannels: ['email', 'sms'],
    isSystemManaged: false
  },
  'GET_QUALIFIED_FORM_SUBMITTED': {
    signalType: 'GET_QUALIFIED_FORM_SUBMITTED',
    displayName: 'Get Qualified Form',
    description: 'Agent qualification application',
    defaultTemplate: 'agent_qualification_notification',
    defaultChannels: ['email'],
    isSystemManaged: false
  },
  'AFFILIATE_FORM_SUBMITTED': {
    signalType: 'AFFILIATE_FORM_SUBMITTED',
    displayName: 'Affiliate Form',
    description: 'Affiliate partnership application',
    defaultTemplate: 'affiliate_application_notification',
    defaultChannels: ['email'],
    isSystemManaged: false
  }
};

const DEFAULT_RECIPIENT_GROUPS: RecipientGroup[] = [
  {
    id: 'admins',
    name: 'Administrators',
    description: 'System administrators and managers',
    recipients: ['admin@realtechee.com', 'manager@realtechee.com'],
    isDefault: true
  },
  {
    id: 'sales_team',
    name: 'Sales Team',
    description: 'Sales representatives and lead processors',
    recipients: ['sales@realtechee.com', 'leads@realtechee.com'],
    isDefault: false
  },
  {
    id: 'support_team',
    name: 'Support Team',
    description: 'Customer support and technical team',
    recipients: ['support@realtechee.com', 'tech@realtechee.com'],
    isDefault: false
  }
];

const HooksConfiguration: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [hooks, setHooks] = useState<NotificationHook[]>([]);
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>(DEFAULT_RECIPIENT_GROUPS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Dialog states
  const [hookDialogOpen, setHookDialogOpen] = useState(false);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [editingHook, setEditingHook] = useState<NotificationHook | null>(null);
  const [editingRecipientGroup, setEditingRecipientGroup] = useState<RecipientGroup | null>(null);

  // Form states  
  const [hookForm, setHookForm] = useState<any>({
    name: '',
    signalType: '',
    enabled: true,
    channel: 'email',
    recipientConfig: {
      toEmails: [],
      ccEmails: [],
      toRoles: [],
      ccRoles: []
    },
    conditions: {},
    maxRetries: 3,
    deliveryDelay: 0
  });

  const [recipientForm, setRecipientForm] = useState<Partial<RecipientGroup>>({
    name: '',
    description: '',
    recipients: [],
    isDefault: false
  });

  // Load existing hooks from backend using the same pattern as SignalEvents
  const loadHooks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the same data access pattern as SignalEvents dashboard
      // This bypasses the client model issue by using the working GraphQL approach
      const result = await signalNotificationHooksAPI.list({ limit: 100 });
      
      if (result?.data) {
        const hooksData = Array.isArray(result.data) ? result.data : result.data.items || [];
        
        // Transform backend data to UI format
        const transformedHooks: NotificationHook[] = hooksData.map((hook: any) => {

          // Parse recipients from JSON string or array
          let cleanedRecipients: string[] = [];
          if (hook.recipientEmails) {
            try {
              if (typeof hook.recipientEmails === 'string') {
                // Try parsing as JSON first
                const parsed = JSON.parse(hook.recipientEmails);
                cleanedRecipients = Array.isArray(parsed) ? parsed : [parsed];
              } else if (Array.isArray(hook.recipientEmails)) {
                cleanedRecipients = hook.recipientEmails;
              } else {
                cleanedRecipients = Object.values(hook.recipientEmails);
              }
            } catch (error) {
              // If JSON parsing fails, treat as single email
              cleanedRecipients = [hook.recipientEmails];
            }
          }

          // Determine channel from hook ID if not explicitly set
          let inferredChannel = hook.channel;
          if (!inferredChannel && hook.id) {
            if (hook.id.includes('_email')) {
              inferredChannel = 'email';
            } else if (hook.id.includes('_sms')) {
              inferredChannel = 'sms';
            }
          }
          
          // Fallback to channels field if still undefined
          if (!inferredChannel && hook.channels) {
            inferredChannel = Object.keys(hook.channels)[0];
          }


          return {
            ...hook,
            name: SIGNAL_TYPES[hook.signalType]?.displayName || hook.signalType,
            recipients: cleanedRecipients,
            channel: inferredChannel
          };
        });
        
        setHooks(transformedHooks);
      } else {
        setHooks([]);
      }
    } catch (err: any) {
      console.error('Error loading hooks:', err);
      
      // Check if this is the client model error and provide better handling
      if (err?.message?.includes('Model SignalNotificationHooks not available on client')) {
        setError('Hooks data temporarily unavailable - please try refreshing the page');
      } else {
        setError('Failed to load notification hooks');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHooks();
  }, [loadHooks]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openHookDialog = (hook?: NotificationHook) => {
    if (hook) {
      setEditingHook(hook);
      
      // Parse recipients from the original data to ensure clean format
      let cleanedRecipients: string[] = [];
      
      // Always parse from the original recipientEmails field for form initialization
      if (hook.recipientEmails) {
        
        if (typeof hook.recipientEmails === 'string') {
          try {
            let parsed = JSON.parse(hook.recipientEmails);
            
            // Handle double-encoded JSON strings (common with AWS DynamoDB)
            if (typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('{'))) {
              parsed = JSON.parse(parsed);
            }
            
            // Now check if it's an array and use it directly
            if (Array.isArray(parsed) && parsed.length > 0) {
              cleanedRecipients = [...parsed]; // Spread to ensure we get a clean copy
            } else if (parsed && typeof parsed === 'string') {
              cleanedRecipients = [parsed]; // Single email string
            } else {
              cleanedRecipients = []; // Empty or invalid
            }
          } catch (error) {
            cleanedRecipients = [hook.recipientEmails];
          }
        } else if (Array.isArray(hook.recipientEmails)) {
          cleanedRecipients = hook.recipientEmails;
        } else {
          cleanedRecipients = [hook.recipientEmails];
        }
      }
      
      // Parse roles if they exist
      let existingRoles: string[] = [];
      if (hook.recipientRoles) {
        try {
          if (typeof hook.recipientRoles === 'string') {
            existingRoles = JSON.parse(hook.recipientRoles);
          } else if (Array.isArray(hook.recipientRoles)) {
            existingRoles = hook.recipientRoles;
          }
        } catch (error) {
        }
      }

      // Ensure we have a flat array of strings (handle nested arrays)
      cleanedRecipients = cleanedRecipients.flat().filter(email => 
        typeof email === 'string' && email.trim() !== ''
      );


      setHookForm({
        ...hook,
        recipientConfig: {
          // For legacy data, put all existing recipients in TO by default
          toEmails: cleanedRecipients,
          ccEmails: [],
          toRoles: Array.isArray(existingRoles) ? existingRoles : [],
          ccRoles: []
        }
      });
    } else {
      setEditingHook(null);
      setHookForm({
        name: '',
        signalType: '',
        enabled: true,
        channel: 'email',
        recipientConfig: {
          toEmails: [],
          ccEmails: [],
          toRoles: [],
          ccRoles: []
        },
        conditions: {},
        maxRetries: 3,
        deliveryDelay: 0
      });
    }
    setHookDialogOpen(true);
  };

  const closeHookDialog = () => {
    setHookDialogOpen(false);
    setEditingHook(null);
    setHookForm({});
  };

  const saveHook = async () => {
    try {
      // Combine TO and CC emails into a single array for backward compatibility
      const allEmails = [
        ...(hookForm.recipientConfig?.toEmails || []),
        ...(hookForm.recipientConfig?.ccEmails || [])
      ];
      
      // Combine TO and CC roles into a single array for backward compatibility
      const allRoles = [
        ...(hookForm.recipientConfig?.toRoles || []),
        ...(hookForm.recipientConfig?.ccRoles || [])
      ];

      const hookData = {
        signalType: hookForm.signalType || '',
        notificationTemplateId: 'default-template',
        channel: hookForm.channel || 'email',
        enabled: hookForm.enabled ?? true,
        priority: 'medium',
        recipientEmails: JSON.stringify(allEmails), // Store as JSON string to match existing data structure
        recipientRoles: JSON.stringify(allRoles), // Store as JSON string to match existing data structure
        maxRetries: hookForm.maxRetries || 3,
        deliveryDelay: hookForm.deliveryDelay || 0,
        conditions: JSON.stringify(hookForm.conditions || {}),
        createdBy: 'admin',
        lastModifiedBy: 'admin'
      };

      if (editingHook) {
        const result = await signalNotificationHooksAPI.update(editingHook.id, hookData);
      } else {
        const result = await signalNotificationHooksAPI.create(hookData);
      }
      
      closeHookDialog();
      await loadHooks(); // Refresh the list
    } catch (err: any) {
      console.error('Error saving hook:', err);
      
      if (err?.message?.includes('Model SignalNotificationHooks not available on client')) {
        setError('Unable to save hook - client model sync issue. Please refresh the page and try again.');
      } else {
        setError('Failed to save notification hook');
      }
    }
  };

  const deleteHook = async (hookId: string) => {
    if (confirm('Are you sure you want to delete this notification hook?')) {
      try {
        await signalNotificationHooksAPI.delete(hookId);
        await loadHooks(); // Refresh the list
      } catch (err) {
        console.error('Error deleting hook:', err);
        setError('Failed to delete notification hook');
      }
    }
  };

  const toggleHookActive = async (hookId: string) => {
    try {
      const hook = hooks.find(h => h.id === hookId);
      if (hook) {
        await signalNotificationHooksAPI.update(hookId, {
          enabled: !hook.enabled
        });
        await loadHooks(); // Refresh the list
      }
    } catch (err) {
      console.error('Error toggling hook status:', err);
      setError('Failed to update notification hook');
    }
  };

  // Render hook management tab
  const renderHookManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <H3>Notification Hooks</H3>
        <MuiButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openHookDialog()}
          sx={{ 
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
        >
          Create Hook
        </MuiButton>
      </Box>

      {hooks.length === 0 && !loading ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <H4>No Notification Hooks</H4>
            <P2 className="text-gray-600 mb-4">
              {error.includes('client model sync') || error.includes('temporarily unavailable') ? (
                <>
                  The notification hooks system is currently initializing. This typically resolves after backend deployment completes.
                  <br /><br />
                  <strong>Try refreshing the page in a few minutes.</strong>
                </>
              ) : (
                'Create your first notification hook to start receiving automated alerts when signals are emitted.'
              )}
            </P2>
            {!error.includes('client model sync') && !error.includes('temporarily unavailable') && (
              <MuiButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => openHookDialog()}
                sx={{ 
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                Create First Hook
              </MuiButton>
            )}
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    Signal Type
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    Channel
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    Recipients (To)
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    CC Recipients
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    Status
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    Last Updated
                  </Box>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <CircularProgress size={20} />
                      <P2>Loading notification hooks...</P2>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                hooks.map((hook) => (
                  <TableRow key={hook.id} hover>
                    <TableCell>
                      <Box>
                        <P2 className="font-semibold">
                          {SIGNAL_TYPES[hook.signalType]?.displayName || hook.signalType}
                        </P2>
                        <P2 className="text-gray-500 text-sm">
                          {hook.signalType}
                        </P2>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {hook.channel ? (
                        <Chip
                          icon={hook.channel === 'email' ? <EmailIcon /> : <SmsIcon />}
                          label={hook.channel.toUpperCase()}
                          size="small"
                          variant="outlined"
                          color={hook.channel === 'email' ? 'primary' : 'secondary'}
                        />
                      ) : (
                        <P2 className="text-gray-500 italic">Not set</P2>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ maxWidth: 300 }}>
                        {hook.recipients && hook.recipients.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {hook.recipients.slice(0, 2).map(recipient => (
                              <Chip
                                key={recipient}
                                label={recipient}
                                size="small"
                                sx={{ 
                                  maxWidth: '140px',
                                  '& .MuiChip-label': {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }
                                }}
                              />
                            ))}
                            {hook.recipients.length > 2 && (
                              <Chip
                                label={`+${hook.recipients.length - 2}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        ) : (
                          <P2 className="text-gray-500 italic">No recipients</P2>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <P2 className="text-gray-500 italic">-</P2>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={hook.enabled}
                              onChange={() => toggleHookActive(hook.id)}
                              size="small"
                            />
                          }
                          label={hook.enabled ? 'Active' : 'Inactive'}
                          sx={{ 
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                              fontSize: '0.875rem',
                              color: hook.enabled ? 'success.main' : 'warning.main'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <P2 className="text-gray-500">
                        {new Date(hook.updatedAt).toLocaleDateString()}
                      </P2>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit hook">
                          <IconButton size="small" onClick={() => openHookDialog(hook)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete hook">
                          <IconButton 
                            size="small" 
                            onClick={() => deleteHook(hook.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  // Render signal mappings tab
  const renderSignalMappings = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <H3>Signal Type Mappings</H3>
        <P2 className="text-gray-600">
          Configure how different signal types are processed and mapped to notification templates.
        </P2>
      </Box>

      <Grid container spacing={3}>
        {Object.values(SIGNAL_TYPES).map((mapping) => (
          <Grid size={12} key={mapping.signalType}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <H4>{mapping.displayName}</H4>
                    <P2 className="text-gray-600 mb-2">{mapping.description}</P2>
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                      <P2><strong>Signal Type:</strong> <code>{mapping.signalType}</code></P2>
                      <Chip 
                        label={mapping.isSystemManaged ? 'System Managed' : 'User Configurable'}
                        color={mapping.isSystemManaged ? 'secondary' : 'primary'}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <P2><strong>Default Channels:</strong></P2>
                      {mapping.defaultChannels.map(channel => (
                        <Chip
                          key={channel}
                          icon={channel === 'email' ? <EmailIcon /> : <SmsIcon />}
                          label={channel.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Tooltip title="Configure mapping">
                      <IconButton>
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // Render recipient management tab
  const renderRecipientManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <H3>Recipient Groups</H3>
        <Button
          variant="primary"
          startIcon={<AddIcon />}
          onClick={() => setRecipientDialogOpen(true)}
        >
          Create Group
        </Button>
      </Box>

      <Grid container spacing={3}>
        {recipientGroups.map((group) => (
          <Grid size={{ xs: 12, md: 6 }} key={group.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <H4>{group.name}</H4>
                    <P2 className="text-gray-600">{group.description}</P2>
                  </Box>
                  <Box>
                    {group.isDefault && (
                      <Chip label="Default" color="primary" size="small" sx={{ mr: 1 }} />
                    )}
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box>
                  <P2><strong>Recipients ({group.recipients.length}):</strong></P2>
                  <Box sx={{ mt: 1, maxHeight: 120, overflow: 'auto' }}>
                    {group.recipients.map(recipient => (
                      <Chip
                        key={recipient}
                        label={recipient}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                        onDelete={group.isDefault ? undefined : () => {
                          // Remove recipient logic
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            icon={<NotificationsIcon />} 
            label="Hooks" 
            iconPosition="start"
          />
          <Tab 
            icon={<AssignmentIcon />} 
            label="Signal Mappings" 
            iconPosition="start"
          />
          <Tab 
            icon={<AccountCircleIcon />} 
            label="Recipients" 
            iconPosition="start"
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="Configuration" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        {renderHookManagement()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderSignalMappings()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {renderRecipientManagement()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <H3>System Configuration</H3>
            <P1>Global notification system settings and advanced configuration options.</P1>
            <Alert severity="info" sx={{ mt: 2 }}>
              Advanced configuration features coming soon.
            </Alert>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Hook Creation/Edit Dialog */}
      <Dialog 
        open={hookDialogOpen} 
        onClose={closeHookDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingHook ? 'Edit Notification Hook' : 'Create Notification Hook'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Configuration */}
              <Grid size={12}>
                <H4>Basic Configuration</H4>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="signal-type-select-label">Signal Type</InputLabel>
                  <Select
                    labelId="signal-type-select-label"
                    label="Signal Type"
                    value={hookForm.signalType || ''}
                    onChange={(e) => setHookForm({ ...hookForm, signalType: e.target.value })}
                  >
                    {Object.values(SIGNAL_TYPES).map(type => (
                      <MenuItem key={type.signalType} value={type.signalType}>
                        <Box>
                          <P2 className="font-semibold">{type.displayName}</P2>
                          <P2 className="text-xs text-gray-500">
                            {type.description}
                          </P2>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="channel-select-label">Notification Channel</InputLabel>
                  <Select
                    labelId="channel-select-label"
                    label="Notification Channel"
                    value={hookForm.channel || 'email'}
                    onChange={(e) => setHookForm({ ...hookForm, channel: e.target.value })}
                  >
                    <MenuItem value="email">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon />
                        <span>Email</span>
                      </Box>
                    </MenuItem>
                    <MenuItem value="sms">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SmsIcon />
                        <span>SMS</span>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Recipients Configuration Section */}
              <Grid size={12}>
                <Box sx={{ 
                  mt: 4, 
                  mb: 3, 
                  p: 2, 
                  backgroundColor: 'grey.50', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <H4 className="mb-0 text-blue-600 flex items-center gap-1">
                    📧 Recipients Configuration
                  </H4>
                  <P2 className="text-gray-500 mt-1">
                    Configure who receives notifications for this signal type
                  </P2>
                </Box>
              </Grid>

              {/* TO Recipients */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ 
                  border: 2, 
                  borderColor: 'primary.light', 
                  borderRadius: 2, 
                  p: 3,
                  backgroundColor: 'primary.50',
                  height: 'fit-content'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      backgroundColor: 'error.main' 
                    }} />
                    <P2 className="font-semibold text-blue-600 text-sm">
                      TO Recipients (Required)
                    </P2>
                  </Box>
                  
                  <TextField
                    label="Email Addresses"
                    fullWidth
                    multiline
                    rows={3}
                    value={(() => {
                      const emails = hookForm.recipientConfig?.toEmails;
                      
                      // Force ensure we always return a string
                      if (Array.isArray(emails)) {
                        const result = emails.filter(email => typeof email === 'string').join('\n');
                        return result;
                      } else if (typeof emails === 'string') {
                        // Handle case where emails might be a JSON string
                        try {
                          const parsed = JSON.parse(emails);
                          if (Array.isArray(parsed)) {
                            const result = parsed.filter(email => typeof email === 'string').join('\n');
                            return result;
                          } else {
                            return typeof parsed === 'string' ? parsed : '';
                          }
                        } catch (error) {
                          return typeof emails === 'string' ? emails : '';
                        }
                      }
                      return '';
                    })()}
                    onChange={(e) => setHookForm({ 
                      ...hookForm, 
                      recipientConfig: {
                        ...hookForm.recipientConfig,
                        toEmails: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    placeholder="admin@realtechee.com&#10;sales@realtechee.com"
                    helperText="💡 Enter one email address per line"
                    sx={{ 
                      mb: 2.5,
                      '& .MuiFormHelperText-root': {
                        color: 'primary.main',
                        fontWeight: 500
                      }
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel id="to-roles-label">User Roles</InputLabel>
                    <Select
                      labelId="to-roles-label"
                      label="User Roles"
                      multiple
                      value={Array.isArray(hookForm.recipientConfig?.toRoles) ? hookForm.recipientConfig.toRoles : []}
                      onChange={(e) => setHookForm({ 
                        ...hookForm, 
                        recipientConfig: {
                          ...hookForm.recipientConfig,
                          toRoles: e.target.value
                        }
                      })}
                      renderValue={(selected) => {
                        const safeSelected = Array.isArray(selected) ? selected : [];
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {safeSelected.length === 0 ? (
                              <P2 className="text-gray-500">Select roles...</P2>
                            ) : (
                              safeSelected.map((value) => {
                                const role = USER_ROLES.find(r => r.value === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={role?.label || value}
                                    size="small"
                                  />
                                );
                              })
                            )}
                          </Box>
                        );
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            width: 350
                          }
                        }
                      }}
                    >
                      {USER_ROLES.map((role) => (
                        <MenuItem 
                          key={role.value} 
                          value={role.value}
                          sx={{ 
                            whiteSpace: 'normal',
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={(Array.isArray(hookForm.recipientConfig?.toRoles) ? hookForm.recipientConfig.toRoles : []).includes(role.value)}
                                size="small"
                              />
                            }
                            label=""
                            sx={{ mr: 2, m: 0 }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <P2 className="font-semibold mb-1">{role.label}</P2>
                            <P2 className="text-xs text-gray-500">
                              {role.description}
                            </P2>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* CC Recipients */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ 
                  border: 2, 
                  borderColor: 'grey.300', 
                  borderRadius: 2, 
                  p: 3,
                  backgroundColor: 'grey.50',
                  height: 'fit-content'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      backgroundColor: 'grey.400' 
                    }} />
                    <P2 className="font-semibold text-gray-500 text-sm">
                      CC Recipients (Optional)
                    </P2>
                  </Box>
                  
                  <TextField
                    label="Email Addresses"
                    fullWidth
                    multiline
                    rows={3}
                    value={(() => {
                      const emails = hookForm.recipientConfig?.ccEmails;
                      if (Array.isArray(emails)) {
                        return emails.join('\n');
                      } else if (typeof emails === 'string') {
                        // Handle case where emails might be a JSON string
                        try {
                          const parsed = JSON.parse(emails);
                          return Array.isArray(parsed) ? parsed.join('\n') : emails;
                        } catch {
                          return emails;
                        }
                      }
                      return '';
                    })()}
                    onChange={(e) => setHookForm({ 
                      ...hookForm, 
                      recipientConfig: {
                        ...hookForm.recipientConfig,
                        ccEmails: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                    placeholder="manager@realtechee.com&#10;audit@realtechee.com"
                    helperText="📋 Optional: Enter one email address per line"
                    sx={{ 
                      mb: 2.5,
                      '& .MuiFormHelperText-root': {
                        color: 'text.secondary',
                        fontWeight: 500
                      }
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel id="cc-roles-label">User Roles</InputLabel>
                    <Select
                      labelId="cc-roles-label"
                      label="User Roles"
                      multiple
                      value={Array.isArray(hookForm.recipientConfig?.ccRoles) ? hookForm.recipientConfig.ccRoles : []}
                      onChange={(e) => setHookForm({ 
                        ...hookForm, 
                        recipientConfig: {
                          ...hookForm.recipientConfig,
                          ccRoles: e.target.value
                        }
                      })}
                      renderValue={(selected) => {
                        const safeSelected = Array.isArray(selected) ? selected : [];
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {safeSelected.length === 0 ? (
                              <P2 className="text-gray-500">Select roles...</P2>
                            ) : (
                              safeSelected.map((value) => {
                                const role = USER_ROLES.find(r => r.value === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={role?.label || value}
                                    size="small"
                                    variant="outlined"
                                  />
                                );
                              })
                            )}
                          </Box>
                        );
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            width: 350
                          }
                        }
                      }}
                    >
                      {USER_ROLES.map((role) => (
                        <MenuItem 
                          key={role.value} 
                          value={role.value}
                          sx={{ 
                            whiteSpace: 'normal',
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={(Array.isArray(hookForm.recipientConfig?.ccRoles) ? hookForm.recipientConfig.ccRoles : []).includes(role.value)}
                                size="small"
                              />
                            }
                            label=""
                            sx={{ mr: 2, m: 0 }}
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <P2 className="font-semibold mb-1">{role.label}</P2>
                            <P2 className="text-xs text-gray-500">
                              {role.description}
                            </P2>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Settings Section */}
              <Grid size={12}>
                <Box sx={{ 
                  mt: 4, 
                  mb: 3, 
                  p: 3, 
                  backgroundColor: 'success.50', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'success.200'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <H4 className="text-green-600 mb-0">⚙️ Hook Settings</H4>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      backgroundColor: 'white',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'success.300'
                    }}>
                      <P2 className="font-semibold text-gray-500">Status:</P2>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={hookForm.enabled ?? true}
                            onChange={(e) => setHookForm({ ...hookForm, enabled: e.target.checked })}
                          />
                        }
                        label={hookForm.enabled ? 'Active' : 'Inactive'}
                        sx={{
                          m: 0,
                          '& .MuiFormControlLabel-label': {
                            fontWeight: 600,
                            color: hookForm.enabled ? 'success.main' : 'warning.main'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid size={12}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 2,
                    '& .MuiAlert-message': {
                      width: '100%'
                    }
                  }}
                >
                  <Box>
                    <P2 className="font-semibold mb-3 text-blue-600">
                      📋 Recipients Guide
                    </P2>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          backgroundColor: 'error.main',
                          mt: 0.75,
                          flexShrink: 0
                        }} />
                        <P2><strong>TO Recipients:</strong> Primary notification recipients who need to take action</P2>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          backgroundColor: 'grey.400',
                          mt: 0.75,
                          flexShrink: 0
                        }} />
                        <P2><strong>CC Recipients:</strong> Secondary recipients who should be informed</P2>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          backgroundColor: 'info.main',
                          mt: 0.75,
                          flexShrink: 0
                        }} />
                        <P2><strong>Role Selection:</strong> Users with selected roles will automatically receive notifications</P2>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          backgroundColor: 'success.main',
                          mt: 0.75,
                          flexShrink: 0
                        }} />
                        <P2>The system will use the appropriate template for the selected signal type</P2>
                      </Box>
                    </Box>
                  </Box>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          backgroundColor: 'grey.50', 
          borderTop: '1px solid', 
          borderColor: 'grey.200',
          gap: 2 
        }}>
          <Button 
            onClick={closeHookDialog}
            variant="outlined"
            sx={{ 
              minWidth: 120,
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={saveHook}
            sx={{ 
              minWidth: 150,
              fontWeight: 600,
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            {editingHook ? '✅ Update Hook' : '➕ Create Hook'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HooksConfiguration;