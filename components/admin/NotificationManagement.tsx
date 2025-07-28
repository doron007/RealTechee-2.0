import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, H3, P2 } from '../typography';
import { listNotificationQueues, listNotificationTemplates } from '../../queries';
import { updateNotificationQueue, createNotificationTemplate, updateNotificationTemplate, createNotificationQueue } from '../../mutations';
import { NotificationQueueStatus, NotificationTemplateChannel } from '../../API';

const client = generateClient();

type ViewMode = 'queue' | 'history' | 'templates' | 'monitoring';

interface NotificationItem {
  id: string;
  eventType: string;
  status: NotificationQueueStatus;
  recipientIds: string | string[];
  channels: string | string[];
  templateId: string;
  payload: string | any;
  createdAt: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  retryCount?: number | null;
  errorMessage?: string | null;
  __typename?: string;
}

interface TemplateItem {
  id: string;
  name: string;
  channel: string;
  subject?: string | null;
  contentHtml?: string | null;
  contentText?: string | null;
  isActive?: boolean | null;
  createdAt: string;
  variables?: string | null;
  __typename?: string;
}

const NotificationManagement: React.FC = () => {
  // State management
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('queue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAwsMonitoring, setShowAwsMonitoring] = useState(false);

  // Auto-refresh interval
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    
    // Set up auto-refresh for real-time updates
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    // Apply filters and sorting when notifications or filters change
    applyFilters();
  }, [notifications, statusFilter, channelFilter, searchQuery, dateRange, sortField, sortDirection]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading notification data...');
      
      // Load notification queue
      const queueResult = await client.graphql({
        query: listNotificationQueues,
        variables: { limit: 100 }
      });

      console.log('📥 Queue result:', queueResult);

      // Load notification templates
      const templateResult = await client.graphql({
        query: listNotificationTemplates,
        variables: { limit: 50 }
      });

      console.log('📝 Template result:', templateResult);

      // Check for GraphQL errors but don't fail if data exists
      if (queueResult.errors) {
        console.error('⚠️ Queue GraphQL errors:', queueResult.errors);
        queueResult.errors.forEach((error, index) => {
          console.error(`Queue Error ${index + 1}:`, error.message, error);
        });
      }
      if (templateResult.errors) {
        console.error('⚠️ Template GraphQL errors:', templateResult.errors);
        templateResult.errors.forEach((error, index) => {
          console.error(`Template Error ${index + 1}:`, error.message, error);
        });
      }

      // Handle data even if there are some errors
      const notificationsData = (queueResult.data?.listNotificationQueues?.items || []).map((item: any): NotificationItem => ({
        ...item,
        status: item.status as NotificationQueueStatus || NotificationQueueStatus.PENDING,
        channels: item.channels || '[]',
        recipientIds: item.recipientIds || '[]'
      }));
      
      const templatesData = (templateResult.data?.listNotificationTemplates?.items || []).map((item: any): TemplateItem => ({
        ...item,
        channel: item.channel || 'EMAIL',
        name: item.name || 'Unnamed Template'
      }));

      console.log('✅ Processed notifications:', notificationsData);
      console.log('✅ Processed templates:', templatesData);

      setNotifications(notificationsData);
      setTemplates(templatesData);
      
      // Only show error if both queries failed completely
      if ((!queueResult.data || !templateResult.data) && (queueResult.errors || templateResult.errors)) {
        setError(`GraphQL errors: ${[...(queueResult.errors || []), ...(templateResult.errors || [])].map(e => e.message).join(', ')}`);
      } else {
        setError('');
      }
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      setError(`Failed to load notification data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    // Channel filter
    if (channelFilter !== 'all') {
      filtered = filtered.filter(n => {
        const channels = typeof n.channels === 'string' ? JSON.parse(n.channels) : n.channels;
        return Array.isArray(channels) && channels.includes(channelFilter);
      });
    }

    // Search query
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.errorMessage && n.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Date range
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.createdAt);
        const start = dateRange.start ? new Date(dateRange.start) : new Date('1970-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date('2100-01-01');
        return notifDate >= start && notifDate <= end;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof NotificationItem];
      let bValue: any = b[sortField as keyof NotificationItem];

      // Handle special cases
      if (sortField === 'channels') {
        aValue = parseChannels(a.channels).length;
        bValue = parseChannels(b.channels).length;
      } else if (sortField === 'recipientIds') {
        aValue = parseRecipients(a.recipientIds).length;
        bValue = parseRecipients(b.recipientIds).length;
      } else if (sortField === 'createdAt' || sortField === 'sentAt' || sortField === 'scheduledAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue ? bValue.toLowerCase() : '';
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredNotifications(filtered);
  }, [notifications, statusFilter, channelFilter, searchQuery, dateRange, sortField, sortDirection]);

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1 opacity-50">↕️</span>;
    }
    return sortDirection === 'asc' ? 
      <span className="text-blue-600 ml-1 font-bold">↑</span> : 
      <span className="text-blue-600 ml-1 font-bold">↓</span>;
  };

  // Queue management functions
  const updateNotificationStatus = async (id: string, status: NotificationQueueStatus) => {
    try {
      await client.graphql({
        query: updateNotificationQueue,
        variables: {
          input: { id, status }
        }
      });
      await loadData();
    } catch (err) {
      console.error(`Failed to update notification ${id}:`, err);
      setError(`Failed to update notification status`);
    }
  };

  const bulkUpdateStatus = async (status: NotificationQueueStatus) => {
    try {
      // Convert Set to Array for iteration
      const notificationIds = Array.from(selectedNotifications);
      for (const id of notificationIds) {
        await updateNotificationStatus(id, status);
      }
      setSelectedNotifications(new Set());
    } catch (err) {
      console.error('Failed to bulk update notifications:', err);
    }
  };

  const retryNotification = async (id: string) => {
    await updateNotificationStatus(id, NotificationQueueStatus.PENDING);
  };

  const resetNotification = async (id: string) => {
    await updateNotificationStatus(id, NotificationQueueStatus.PENDING);
  };

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      console.log('📧 Sending test notification...');
      
      // Create a test notification directly in the queue
      const testNotification = {
        eventType: 'admin_test',
        payload: JSON.stringify({
          customer: {
            name: 'Test Admin User',
            email: 'info@realtechee.com'
          },
          message: 'This is a test notification from the admin panel',
          timestamp: new Date().toISOString()
        }),
        recipientIds: JSON.stringify(['admin-team']),
        channels: JSON.stringify(['EMAIL']),
        templateId: 'admin-test-template',
        status: NotificationQueueStatus.PENDING,
        retryCount: 0,
        owner: 'admin'
      };

      const result = await client.graphql({
        query: createNotificationQueue,
        variables: {
          input: testNotification
        }
      });

      console.log('✅ Test notification created:', result);
      
      // Refresh data to show the new notification
      await loadData();
    } catch (err) {
      console.error('❌ Failed to send test notification:', err);
      setError(`Failed to send test notification: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestTemplate = async () => {
    try {
      setLoading(true);
      console.log('📝 Creating test template...');
      
      const testTemplate = {
        name: 'Admin Test Template',
        channel: NotificationTemplateChannel.EMAIL,
        subject: 'Test Notification - {{customer.name}}',
        contentHtml: '<html><body><h2>Test Notification</h2><p>Hello {{customer.name}},</p><p>{{message}}</p><p>Sent at: {{timestamp}}</p></body></html>',
        contentText: 'Test Notification: Hello {{customer.name}}, {{message}} - Sent at: {{timestamp}}',
        isActive: true,
        variables: JSON.stringify(['customer.name', 'message', 'timestamp']),
        owner: 'admin'
      };

      const result = await client.graphql({
        query: createNotificationTemplate,
        variables: {
          input: testTemplate
        }
      });

      console.log('✅ Test template created:', result);
      
      // Refresh data to show the new template
      await loadData();
    } catch (err) {
      console.error('❌ Failed to create test template:', err);
      setError(`Failed to create test template: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: NotificationQueueStatus) => {
    const classes = {
      [NotificationQueueStatus.SENT]: 'bg-green-100 text-green-800',
      [NotificationQueueStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [NotificationQueueStatus.FAILED]: 'bg-red-100 text-red-800',
      [NotificationQueueStatus.RETRYING]: 'bg-orange-100 text-orange-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const parseChannels = (channels: string | string[]) => {
    try {
      if (typeof channels !== 'string') {
        return Array.isArray(channels) ? channels : [];
      }
      
      // Handle double-escaped JSON strings
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
      
      // Handle double-escaped JSON strings
      let parsed = JSON.parse(recipients);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div>
      {/* Header with controls */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <H2>Notification System</H2>
          <P2 className="text-gray-600 mt-1">
            Manage notification queue, templates, and AWS infrastructure monitoring
          </P2>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={sendTestNotification}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Send Test
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <div className="font-medium">⚠️ GraphQL Error</div>
          <div className="text-sm mt-1">{error}</div>
          <div className="text-xs mt-2 text-red-600">
            Note: Using mock data for testing purposes. Check console for detailed error information.
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { key: 'queue', label: 'Queue Management', icon: '📥' },
              { key: 'history', label: 'History & Analytics', icon: '📊' },
              { key: 'templates', label: 'Template Management', icon: '📝' },
              { key: 'monitoring', label: 'AWS Monitoring', icon: '☁️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key as ViewMode)}
                className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  viewMode === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Queue Management View */}
          {viewMode === 'queue' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Statuses</option>
                      <option value={NotificationQueueStatus.PENDING}>Pending</option>
                      <option value={NotificationQueueStatus.SENT}>Sent</option>
                      <option value={NotificationQueueStatus.FAILED}>Failed</option>
                      <option value={NotificationQueueStatus.RETRYING}>Retrying</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                    <select
                      value={channelFilter}
                      onChange={(e) => setChannelFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Channels</option>
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="TELEGRAM">Telegram</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                {/* Sort Status */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Sorted by: <span className="font-medium">{sortField === 'eventType' ? 'Notification' : sortField === 'recipientIds' ? 'Recipients' : sortField === 'createdAt' ? 'Created Date' : sortField}</span> 
                    <span className="ml-1">({sortDirection === 'asc' ? 'A→Z' : 'Z→A'})</span>
                  </span>
                  <button
                    onClick={() => {setSortField('createdAt'); setSortDirection('desc');}}
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                  >
                    Reset to default
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedNotifications.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedNotifications.size} notification(s) selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => bulkUpdateStatus(NotificationQueueStatus.PENDING)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                      >
                        Retry All
                      </button>
                      <button
                        onClick={() => bulkUpdateStatus(NotificationQueueStatus.FAILED)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Mark as Failed
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={filteredNotifications.length > 0 && selectedNotifications.size === filteredNotifications.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
                              } else {
                                setSelectedNotifications(new Set());
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort('eventType')}
                        >
                          <div className="flex items-center">
                            Notification
                            {getSortIcon('eventType')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center">
                            Status
                            {getSortIcon('status')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort('recipientIds')}
                        >
                          <div className="flex items-center">
                            Recipients
                            {getSortIcon('recipientIds')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort('channels')}
                        >
                          <div className="flex items-center">
                            Channels
                            {getSortIcon('channels')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center">
                            Created
                            {getSortIcon('createdAt')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredNotifications.map((notification) => (
                        <tr key={notification.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.has(notification.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedNotifications);
                                if (e.target.checked) {
                                  newSelected.add(notification.id);
                                } else {
                                  newSelected.delete(notification.id);
                                }
                                setSelectedNotifications(newSelected);
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {notification.eventType}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {notification.id.slice(0, 8)}...
                            </div>
                            {notification.errorMessage && (
                              <div className="text-xs text-red-600 mt-1" title={notification.errorMessage}>
                                Error: {notification.errorMessage.substring(0, 40)}...
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(notification.status)}`}>
                              {notification.status}
                            </span>
                            {notification.retryCount && notification.retryCount > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Retries: {notification.retryCount}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {parseRecipients(notification.recipientIds).length} recipients
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {parseChannels(notification.channels).map((channel: string) => (
                                <span key={channel} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {channel}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(notification.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {notification.status === NotificationQueueStatus.FAILED && (
                                <button
                                  onClick={() => retryNotification(notification.id)}
                                  className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                                  title="Retry"
                                >
                                  🔄
                                </button>
                              )}
                              {notification.status === NotificationQueueStatus.PENDING && (
                                <button
                                  onClick={() => updateNotificationStatus(notification.id, NotificationQueueStatus.FAILED)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                  title="Mark as Failed"
                                >
                                  ❌
                                </button>
                              )}
                              <button
                                onClick={() => setEditingNotification(notification)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                title="Edit"
                              >
                                ✏️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800">Successfully Sent</div>
                  <div className="text-2xl font-bold text-green-900">
                    {notifications.filter(n => n.status === NotificationQueueStatus.SENT).length}
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-800">Pending & Retrying</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {notifications.filter(n => [NotificationQueueStatus.PENDING, NotificationQueueStatus.RETRYING].includes(n.status)).length}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-800">Failed</div>
                  <div className="text-2xl font-bold text-red-900">
                    {notifications.filter(n => n.status === NotificationQueueStatus.FAILED).length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Templates View */}
          {viewMode === 'templates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <H3>Notification Templates</H3>
                <button
                  onClick={createTestTemplate}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Test Template'}
                </button>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Template
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Channel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {templates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{template.name}</div>
                            <div className="text-sm text-gray-500">ID: {template.id.slice(0, 8)}...</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {template.channel}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {template.subject || 'No subject'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {new Date(template.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setEditingTemplate(template)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* History & Analytics View */}
          {viewMode === 'history' && (
            <div className="space-y-6">
              <H3>Notification History & Analytics</H3>
              <div className="bg-white border rounded-lg p-6">
                <P2 className="text-gray-600">
                  📊 Analytics dashboard coming soon - will include delivery rates, open rates, click-through rates, and performance metrics.
                </P2>
              </div>
            </div>
          )}

          {/* AWS Monitoring View */}
          {viewMode === 'monitoring' && (
            <div className="space-y-6">
              <H3>AWS Infrastructure Monitoring</H3>
              <div className="bg-white border rounded-lg p-6">
                <P2 className="text-gray-600">
                  ☁️ AWS monitoring dashboard coming soon - will include Lambda function status, SQS queue metrics, SNS topic health, and CloudWatch integration.
                </P2>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;