import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, H3, H4, P1, P2 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import Button from '../../common/buttons/Button';
import { DateTimeUtils } from '../../../utils/dateTimeUtils';
import { 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper
} from '@mui/material';
// Using simple text icons to avoid potential import issues
const RefreshIcon = () => <span>🔄</span>;
const TrendingUpIcon = () => <span>📈</span>;
const NotificationsIcon = () => <span>🔔</span>;
const ErrorIcon = () => <span>❌</span>;
const CheckCircleIcon = () => <span>✅</span>;
const ScheduleIcon = () => <span>⏰</span>;

const client = generateClient();

interface SignalEvent {
  id: string;
  signalType: string;
  payload: string;
  emittedAt: string;
  emittedBy: string;
  source: string;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationRecord {
  id: string;
  eventType: string;
  status: string;
  templateId: string;
  signalEventId: string;
  createdAt: string;
  sentAt?: string;
  recipientIds: string;
  deliveryChannel?: string;
  priority: string;
}

interface SignalMetrics {
  totalSignals: number;
  processedSignals: number;
  pendingSignals: number;
  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  processingRate: number;
  deliveryRate: number;
}

const SIGNAL_TYPES = {
  'CONTACT_US_FORM_SUBMITTED': 'Contact Us',
  'GET_ESTIMATE_FORM_SUBMITTED': 'Get Estimate', 
  'GET_QUALIFIED_FORM_SUBMITTED': 'Get Qualified',
  'AFFILIATE_FORM_SUBMITTED': 'Affiliate'
};

const SignalDashboard: React.FC = () => {
  // State management
  const [signals, setSignals] = useState<SignalEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [metrics, setMetrics] = useState<SignalMetrics>({
    totalSignals: 0,
    processedSignals: 0,
    pendingSignals: 0,
    totalNotifications: 0,
    sentNotifications: 0,
    failedNotifications: 0,
    processingRate: 0,
    deliveryRate: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Filter state
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  // Fetch signal events
  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const listSignalsQuery = `
        query ListSignalEvents($limit: Int) {
          listSignalEvents(limit: $limit) {
            items {
              id
              signalType
              payload
              emittedAt
              emittedBy
              source
              processed
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log('🔍 Fetching signals from GraphQL...');
      const result = await client.graphql({
        query: listSignalsQuery,
        variables: { limit: 100 }
      }) as any;

      const signalData = result.data?.listSignalEvents?.items || [];
      console.log(`📊 Fetched ${signalData.length} signals`);
      
      // Filter out signals with invalid data
      const validSignals = signalData.filter((signal: any) => {
        return signal.id && signal.signalType && signal.createdAt;
      });
      
      console.log(`✅ ${validSignals.length} valid signals (filtered ${signalData.length - validSignals.length} invalid)`);
      setSignals(validSignals);
      
    } catch (err) {
      console.error('Error fetching signals:', err);
      setError('Failed to fetch signal data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notification records
  const fetchNotifications = useCallback(async () => {
    try {
      const listNotificationsQuery = `
        query ListNotificationQueues($limit: Int) {
          listNotificationQueues(limit: $limit) {
            items {
              id
              eventType
              status
              templateId
              signalEventId
              createdAt
              sentAt
              recipientIds
              deliveryChannel
              priority
            }
          }
        }
      `;

      const result = await client.graphql({
        query: listNotificationsQuery,
        variables: { limit: 200 }
      }) as any;

      const notificationData = result.data?.listNotificationQueues?.items || [];
      setNotifications(notificationData);
      
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      
      // More detailed error handling
      let errorMessage = 'Failed to fetch notification data';
      if (err?.errors && Array.isArray(err.errors)) {
        errorMessage = `GraphQL Error: ${err.errors.map((e: any) => e.message).join(', ')}`;
      } else if (err?.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Provide empty array as fallback instead of complete failure
      setNotifications([]);
    }
  }, []);

  // Calculate metrics
  const calculateMetrics = useCallback(() => {
    const totalSignals = signals.length;
    const processedSignals = signals.filter(s => s.processed).length;
    const pendingSignals = totalSignals - processedSignals;
    
    const totalNotifications = notifications.length;
    const sentNotifications = notifications.filter(n => n.status === 'SENT').length;
    const failedNotifications = notifications.filter(n => n.status === 'FAILED' || n.status === 'ERROR').length;
    
    const processingRate = totalSignals > 0 ? (processedSignals / totalSignals) * 100 : 0;
    const deliveryRate = totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0;

    setMetrics({
      totalSignals,
      processedSignals,
      pendingSignals,
      totalNotifications,
      sentNotifications,
      failedNotifications,
      processingRate,
      deliveryRate
    });
  }, [signals, notifications]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchSignals(), fetchNotifications()]);
  }, [fetchSignals, fetchNotifications]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000); // 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, refreshData, refreshInterval]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Calculate metrics when data changes
  useEffect(() => {
    calculateMetrics();
  }, [signals, notifications, calculateMetrics]);

  // Filter signals based on current filters
  const filteredSignals = signals.filter(signal => {
    if (signalTypeFilter !== 'all' && signal.signalType !== signalTypeFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'processed' && !signal.processed) return false;
      if (statusFilter === 'pending' && signal.processed) return false;
    }
    return true;
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated signals
  const paginatedSignals = filteredSignals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <H2>Signal & Notification Dashboard</H2>
        <div className="flex space-x-4 items-center">
          <Button
            onClick={refreshData}
            disabled={loading}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </Button>
          <FormControl size="small">
            <InputLabel>Auto-refresh</InputLabel>
            <Select
              value={autoRefresh ? 'on' : 'off'}
              onChange={(e) => setAutoRefresh(e.target.value === 'on')}
              sx={{ 
                minWidth: 120,
                '& .MuiSelect-select': {
                  position: 'relative',
                  zIndex: 50
                },
                '& .MuiMenu-paper': {
                  zIndex: 1400
                }
              }}
            >
              <MenuItem value="on">On (30s)</MenuItem>
              <MenuItem value="off">Off</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent>
            <div className="flex items-center space-x-3">
              <TrendingUpIcon />
              <div>
                <H4>{metrics.totalSignals}</H4>
                <P2>Total Signals</P2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center space-x-3">
              <CheckCircleIcon />
              <div>
                <H4>{metrics.processedSignals}</H4>
                <P2>Processed</P2>
                <P2 className="text-green-600">
                  {metrics.processingRate.toFixed(1)}% rate
                </P2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center space-x-3">
              <NotificationsIcon />
              <div>
                <H4>{metrics.sentNotifications}</H4>
                <P2>Notifications Sent</P2>
                <P2 className="text-blue-600">
                  {metrics.deliveryRate.toFixed(1)}% delivery rate
                </P2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center space-x-3">
              <ScheduleIcon />
              <div>
                <H4>{metrics.pendingSignals}</H4>
                <P2>Pending Signals</P2>
                {metrics.failedNotifications > 0 && (
                  <P2 className="text-red-600">
                    {metrics.failedNotifications} failed
                  </P2>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <H4 className="mb-4">Filters</H4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FormControl fullWidth size="small">
                <InputLabel>Signal Type</InputLabel>
                <Select
                  value={signalTypeFilter}
                  onChange={(e) => setSignalTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {Object.entries(SIGNAL_TYPES).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            
            <div>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="processed">Processed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div>
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signals Data Grid */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <H4>Recent Signals</H4>
            {loading && <CircularProgress size={20} />}
          </div>
          
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Signal Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Emitted By</TableCell>
                  <TableCell>Emitted At</TableCell>
                  <TableCell>Notifications</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={20} />
                      <P2 className="ml-2">Loading signals...</P2>
                    </TableCell>
                  </TableRow>
                ) : paginatedSignals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <P2>No signals found</P2>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSignals.map((signal) => {
                    const signalNotifications = notifications.filter(n => n.signalEventId === signal.id);
                    return (
                      <TableRow key={signal.id} hover>
                        <TableCell>
                          <Chip 
                            label={SIGNAL_TYPES[signal.signalType as keyof typeof SIGNAL_TYPES] || signal.signalType}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <StatusPill 
                            status={signal.processed ? 'processed' : 'pending'}
                          />
                        </TableCell>
                        <TableCell>{signal.source}</TableCell>
                        <TableCell>{signal.emittedBy}</TableCell>
                        <TableCell>
                          {signal.emittedAt ? new Date(signal.emittedAt).toLocaleString() : 'No date'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`${signalNotifications.length} notification(s) created`}>
                            <Chip 
                              label={`🔔 ${signalNotifications.length}`}
                              size="small"
                              color={signalNotifications.length > 0 ? 'success' : 'default'}
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={filteredSignals.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignalDashboard;