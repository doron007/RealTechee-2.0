import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H3, H4, P2 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import Button from '../../common/buttons/Button';
import { notificationRetryService } from '../../../services/notificationRetryService';
import {
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Typography
} from '@mui/material';

const client = generateClient();

interface NotificationRecord {
  id: string;
  eventType: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'PROCESSING';
  templateId: string;
  signalEventId: string;
  createdAt: string;
  sentAt?: string;
  recipientIds: string;
  deliveryChannel: 'EMAIL' | 'SMS';
  priority: 'low' | 'medium' | 'high';
  payload?: any;
  errorMessage?: string;
  retryCount?: number;
  lastRetryAt?: string;
}

interface DeliveryStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  processing: number;
  deliveryRate: number;
  avgProcessingTime: number;
  recentFailures: number;
}

interface RealTimeNotificationMonitorProps {
  refreshInterval?: number; // in seconds
  showAdvancedMetrics?: boolean;
}

const RealTimeNotificationMonitor: React.FC<RealTimeNotificationMonitorProps> = ({
  refreshInterval = 10,
  showAdvancedMetrics = true
}) => {
  // State management
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    processing: 0,
    deliveryRate: 0,
    avgProcessingTime: 0,
    recentFailures: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Filtering and display
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationRecord | null>(null);
  
  // Real-time polling
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications with enhanced data
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const query = `
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
              payload
              errorMessage
              retryCount
              lastRetryAt
            }
          }
        }
      `;

      const result = await client.graphql({
        query,
        variables: { limit: 100 },
        authMode: 'apiKey'
      }) as any;

      const notificationData = result.data?.listNotificationQueues?.items || [];
      
      // Sort by creation date (newest first)
      const sortedNotifications = notificationData.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sortedNotifications);
      setLastUpdate(new Date());
      
      // Calculate real-time stats
      calculateStats(sortedNotifications);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notification data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate delivery statistics
  const calculateStats = (notificationList: NotificationRecord[]) => {
    const total = notificationList.length;
    const sent = notificationList.filter(n => n.status === 'SENT').length;
    const failed = notificationList.filter(n => n.status === 'FAILED').length;
    const pending = notificationList.filter(n => n.status === 'PENDING').length;
    const processing = notificationList.filter(n => n.status === 'PROCESSING').length;
    
    const deliveryRate = total > 0 ? (sent / total) * 100 : 0;
    
    // Calculate average processing time for sent notifications
    const sentNotifications = notificationList.filter(n => n.status === 'SENT' && n.sentAt);
    const avgProcessingTime = sentNotifications.length > 0 
      ? sentNotifications.reduce((acc, n) => {
          const created = new Date(n.createdAt).getTime();
          const sent = new Date(n.sentAt!).getTime();
          return acc + (sent - created);
        }, 0) / sentNotifications.length / 1000 // Convert to seconds
      : 0;
    
    // Recent failures (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFailures = notificationList.filter(n => 
      n.status === 'FAILED' && new Date(n.createdAt) > oneHourAgo
    ).length;

    setStats({
      total,
      sent,
      failed,
      pending,
      processing,
      deliveryRate,
      avgProcessingTime,
      recentFailures
    });
  };

  // Setup real-time polling
  useEffect(() => {
    if (isRealTimeEnabled && refreshInterval > 0) {
      // Initial fetch
      fetchNotifications();
      
      // Setup interval
      intervalRef.current = setInterval(fetchNotifications, refreshInterval * 1000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRealTimeEnabled, refreshInterval, fetchNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    if (statusFilter !== 'all' && notification.status !== statusFilter) return false;
    if (channelFilter !== 'all' && notification.deliveryChannel !== channelFilter) return false;
    if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;
    return true;
  });

  // Handle notification retry
  const handleRetryNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      
      const result = await notificationRetryService.retryNotification(notificationId);
      
      if (result.success) {
        console.log(`✅ Notification retry successful: ${result.retryCount} attempts`);
        await fetchNotifications(); // Refresh data
      } else {
        setError(result.errorMessage || 'Failed to retry notification');
      }
      
      setShowRetryDialog(false);
      setSelectedNotification(null);
    } catch (err) {
      console.error('Error retrying notification:', err);
      setError('Failed to retry notification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'success';
      case 'FAILED': return 'error';
      case 'PROCESSING': return 'warning';
      case 'PENDING': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Controls */}
      <div className="flex justify-between items-center">
        <div>
          <H3>Real-Time Notification Monitor</H3>
          <P2 className="text-gray-600 mt-1">
            Live monitoring of notification delivery status
            {lastUpdate && (
              <span className="ml-2 text-sm">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </P2>
        </div>
        
        <div className="flex space-x-3 items-center">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="realtime-toggle"
              checked={isRealTimeEnabled}
              onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="realtime-toggle" className="text-sm">
              Real-time ({refreshInterval}s)
            </label>
          </div>
          
          <Button
            onClick={fetchNotifications}
            disabled={loading}
            variant="secondary"
            size="sm"
          >
            {loading ? <CircularProgress size={16} /> : '🔄'} Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Real-time Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <P2 className="text-gray-600">Total Notifications</P2>
                <H4>{stats.total}</H4>
              </div>
              <span className="text-2xl">📊</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <P2 className="text-gray-600">Delivery Rate</P2>
                <H4>{stats.deliveryRate.toFixed(1)}%</H4>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.deliveryRate} 
                  color="success"
                  sx={{ mt: 1 }}
                />
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <P2 className="text-gray-600">Avg Processing</P2>
                <H4>{stats.avgProcessingTime.toFixed(1)}s</H4>
              </div>
              <span className="text-2xl">⏱️</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <P2 className="text-gray-600">Recent Failures</P2>
                <H4 className={stats.recentFailures > 0 ? 'text-red-600' : 'text-gray-700'}>
                  {stats.recentFailures}
                </H4>
              </div>
              <span className="text-2xl">❌</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardContent className="p-4">
          <H4 className="mb-3">Status Distribution</H4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <StatusPill status="sent" />
              <span>{stats.sent} Sent</span>
            </div>
            <div className="flex items-center space-x-2">
              <StatusPill status="pending" />
              <span>{stats.pending} Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <StatusPill status="processing" />
              <span>{stats.processing} Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <StatusPill status="failed" />
              <span>{stats.failed} Failed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <H4 className="mb-3">Filters</H4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="SENT">Sent</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="PROCESSING">Processing</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
              >
                <MenuItem value="all">All Channels</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Notification Table */}
      <Card>
        <CardContent className="p-0">
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Processing Time</TableCell>
                  <TableCell>Retries</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={20} />
                      <P2 className="ml-2">Loading notifications...</P2>
                    </TableCell>
                  </TableRow>
                ) : filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <P2>No notifications found</P2>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.slice(0, 50).map((notification) => {
                    const processingTime = notification.sentAt 
                      ? ((new Date(notification.sentAt).getTime() - new Date(notification.createdAt).getTime()) / 1000).toFixed(1)
                      : '-';
                    
                    return (
                      <TableRow key={notification.id} hover>
                        <TableCell>
                          <StatusPill status={notification.status.toLowerCase()} />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={notification.deliveryChannel}
                            size="small"
                            color={notification.deliveryChannel === 'EMAIL' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={notification.priority.toUpperCase()}
                            size="small"
                            sx={{ 
                              backgroundColor: getPriorityColor(notification.priority),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {notification.eventType}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(notification.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {processingTime !== '-' ? `${processingTime}s` : 'Pending'}
                        </TableCell>
                        <TableCell>
                          {notification.retryCount || 0}
                          {notification.lastRetryAt && (
                            <div className="text-xs text-gray-500">
                              Last: {new Date(notification.lastRetryAt).toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {notification.status === 'FAILED' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedNotification(notification);
                                setShowRetryDialog(true);
                              }}
                              className="text-orange-600 hover:bg-orange-50"
                            >
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Retry Confirmation Dialog */}
      <Dialog open={showRetryDialog} onClose={() => setShowRetryDialog(false)}>
        <DialogTitle>Retry Notification</DialogTitle>
        <DialogContent>
          <P2>
            Are you sure you want to retry this notification?
          </P2>
          {selectedNotification && (
            <div className="mt-4 space-y-2">
              <P2><strong>ID:</strong> {selectedNotification.id}</P2>
              <P2><strong>Event Type:</strong> {selectedNotification.eventType}</P2>
              <P2><strong>Channel:</strong> {selectedNotification.deliveryChannel}</P2>
              <P2><strong>Retry Count:</strong> {selectedNotification.retryCount || 0}</P2>
              {selectedNotification.errorMessage && (
                <P2><strong>Last Error:</strong> {selectedNotification.errorMessage}</P2>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRetryDialog(false)} variant="secondary">
            Cancel
          </Button>
          <Button 
            onClick={() => selectedNotification && handleRetryNotification(selectedNotification.id)}
            variant="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={16} /> : 'Retry'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RealTimeNotificationMonitor;