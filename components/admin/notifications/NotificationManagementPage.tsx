import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, H4, P2 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import { DateTimeUtils } from '../../../utils/dateTimeUtils';
import { listNotificationQueues, listNotificationTemplates } from '../../../queries';
import { updateNotificationQueue, createNotificationTemplate, updateNotificationTemplate, createNotificationQueue, deleteNotificationQueue } from '../../../mutations';
import { NotificationQueueStatus, NotificationTemplateChannel } from '../../../API';
import EditNotificationModal from '../modals/EditNotificationModal';
import TemplateEditorModal from '../modals/TemplateEditorModal';
import BulkActionModal from '../modals/BulkActionModal';
import TemplateManagementPage from '../templates/TemplateManagementPage';
import SignalManagementPage from '../signals/SignalManagementPage';
import { NotificationItem, TemplateItem } from '../../../types/notifications';

const client = generateClient();

type ViewMode = 'queue' | 'history' | 'templates' | 'monitoring' | 'signals' | 'realtime';

const NotificationManagementPage: React.FC = () => {
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
  const [templateModalMode, setTemplateModalMode] = useState<'create' | 'edit'>('edit');
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'retry' | 'fail'>('retry');

  // Auto-refresh interval
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Helper functions for safe data parsing
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

  useEffect(() => {
    // Add a delay to ensure authentication has completed
    const initializeData = async () => {
      try {
        console.log('⏳ Waiting for authentication to complete...');
        // Wait a bit for authentication to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadData();
      } catch (error) {
        console.error('Failed to initialize data:', error);
        setError('Failed to initialize data. Authentication might not be complete.');
        setLoading(false);
      }
    };

    initializeData();
    
    // Set up auto-refresh for real-time updates
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData().catch(error => {
          console.error('Auto-refresh failed:', error);
        });
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting to load notification data...');
      
      // Try loading notifications first
      console.log('📬 Loading notifications...');
      const notificationsResponse = await client.graphql({
        query: listNotificationQueues,
        variables: { limit: 100 }
      });
      console.log('📬 Notifications response:', notificationsResponse);

      // Then load templates
      console.log('📝 Loading templates...');
      const templatesResponse = await client.graphql({
        query: listNotificationTemplates,
        variables: { limit: 50 }
      });
      console.log('📝 Templates response:', templatesResponse);

      // Map GraphQL responses to expected interfaces
      const mappedNotifications = notificationsResponse.data.listNotificationQueues.items?.map(item => ({
        id: item.id,
        status: item.status as NotificationQueueStatus, 
        eventType: item.eventType,
        channels: item.channels,
        recipientIds: item.recipientIds || [],
        templateId: item.templateId || '',
        payload: item.payload || '{}',
        createdAt: item.createdAt || '',
        updatedAt: item.updatedAt || '',
        errorMessage: item.errorMessage || undefined
      })) || [];

      const mappedTemplates = templatesResponse.data.listNotificationTemplates.items?.map(item => {
        let parsedVariables = [];
        try {
          if (item.variables) {
            parsedVariables = typeof item.variables === 'string' ? JSON.parse(item.variables) : item.variables;
          }
        } catch (error) {
          console.warn(`Failed to parse variables for template ${item.id}:`, error);
          parsedVariables = [];
        }

        return {
          id: item.id,
          name: item.name || '',
          channel: item.channel as NotificationTemplateChannel,
          subject: item.subject || '',
          contentText: item.contentText || '',
          contentHtml: item.contentHtml || undefined,
          variables: parsedVariables,
          isActive: item.isActive || false,
          createdAt: item.createdAt || '',
          updatedAt: item.updatedAt || ''
        };
      }) || [];

      setNotifications(mappedNotifications);
      setTemplates(mappedTemplates);
    } catch (err: any) {
      console.error('Error loading data:', err);
      
      // Extract specific GraphQL errors
      let errorMessage = 'Failed to load notification data';
      if (err.errors && Array.isArray(err.errors)) {
        const graphqlErrors = err.errors.map((error: any) => error.message).join(', ');
        errorMessage = `GraphQL Error: ${graphqlErrors}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    // Apply view mode filter first
    if (viewMode === 'queue') {
      filtered = filtered.filter(n => n.status === NotificationQueueStatus.PENDING);
    } else if (viewMode === 'history') {
      filtered = filtered.filter(n => n.status !== NotificationQueueStatus.PENDING);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    // Apply channel filter
    if (channelFilter !== 'all') {
      filtered = filtered.filter(n => {
        const channels = parseChannels(n.channels);
        return channels.includes(channelFilter);
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parseRecipients(n.recipientIds).some(r => 
          r.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(n => 
        new Date(n.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(n => 
        new Date(n.createdAt) <= new Date(dateRange.end + 'T23:59:59')
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField as keyof NotificationItem];
      const bVal = b[sortField as keyof NotificationItem];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredNotifications(filtered);
  }, [notifications, viewMode, statusFilter, channelFilter, searchQuery, dateRange, sortField, sortDirection]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getStatusColor = (status: NotificationQueueStatus) => {
    switch (status) {
      case NotificationQueueStatus.SENT: return 'green';
      case NotificationQueueStatus.PENDING: return 'yellow';
      case NotificationQueueStatus.FAILED: return 'red';
      case NotificationQueueStatus.RETRYING: return 'orange';
      default: return 'gray';
    }
  };

  // Modal handlers
  const handleEditNotification = (notification: NotificationItem) => {
    setEditingNotification(notification);
  };

  const handleSaveNotification = async (updatedNotification: Partial<NotificationItem>) => {
    if (!editingNotification) return;
    
    try {
      await client.graphql({
        query: updateNotificationQueue,
        variables: {
          input: {
            id: editingNotification.id,
            eventType: updatedNotification.eventType,
            status: updatedNotification.status,
            templateId: updatedNotification.templateId,
            payload: updatedNotification.payload,
            recipientIds: typeof updatedNotification.recipientIds === 'string' 
              ? updatedNotification.recipientIds 
              : JSON.stringify(updatedNotification.recipientIds || []),
            channels: typeof updatedNotification.channels === 'string' 
              ? updatedNotification.channels 
              : JSON.stringify(updatedNotification.channels || [])
          }
        }
      });
      await loadData();
    } catch (error) {
      console.error('Failed to save notification:', error);
      setError(`Failed to save notification: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleResendNotification = async (notification: NotificationItem) => {
    try {
      const requeuedNotification = {
        eventType: notification.eventType,
        payload: notification.payload,
        recipientIds: typeof notification.recipientIds === 'string' 
          ? notification.recipientIds 
          : JSON.stringify(notification.recipientIds),
        channels: typeof notification.channels === 'string' 
          ? notification.channels 
          : JSON.stringify(notification.channels),
        templateId: notification.templateId,
        status: NotificationQueueStatus.PENDING,
        retryCount: 0,
        owner: 'admin-resend'
      };

      await client.graphql({
        query: createNotificationQueue,
        variables: {
          input: requeuedNotification
        }
      });
      
      await loadData();
    } catch (error) {
      console.error('Failed to resend notification:', error);
      setError(`Failed to resend notification: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateModalMode('create');
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: TemplateItem) => {
    setEditingTemplate(template);
    setTemplateModalMode('edit');
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (templateData: Partial<TemplateItem>) => {
    try {
      if (templateModalMode === 'create') {
        await client.graphql({
          query: createNotificationTemplate,
          variables: {
            input: {
              name: templateData.name || 'Untitled Template',
              channel: templateData.channel as NotificationTemplateChannel,
              subject: templateData.subject,
              contentHtml: templateData.contentHtml,
              contentText: templateData.contentText,
              isActive: templateData.isActive,
              variables: templateData.variables,
              owner: templateData.owner
            }
          }
        });
      } else if (editingTemplate) {
        await client.graphql({
          query: updateNotificationTemplate,
          variables: {
            input: {
              id: editingTemplate.id,
              name: templateData.name,
              channel: templateData.channel as NotificationTemplateChannel,
              subject: templateData.subject,
              contentHtml: templateData.contentHtml,
              contentText: templateData.contentText,
              isActive: templateData.isActive,
              variables: templateData.variables
            }
          }
        });
      }
      await loadData();
    } catch (error) {
      console.error('Failed to save template:', error);
      setError(`Failed to save template: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Bulk operations
  const handleBulkAction = async () => {
    const selectedItems = notifications.filter(n => selectedNotifications.has(n.id));
    
    try {
      for (const notification of selectedItems) {
        if (bulkActionType === 'delete') {
          await client.graphql({
            query: deleteNotificationQueue,
            variables: { input: { id: notification.id } }
          });
        } else if (bulkActionType === 'retry') {
          await client.graphql({
            query: updateNotificationQueue,
            variables: {
              input: {
                id: notification.id,
                status: NotificationQueueStatus.PENDING,
                retryCount: (notification.retryCount || 0) + 1
              }
            }
          });
        } else if (bulkActionType === 'fail') {
          await client.graphql({
            query: updateNotificationQueue,
            variables: {
              input: {
                id: notification.id,
                status: NotificationQueueStatus.FAILED
              }
            }
          });
        }
      }
      
      setSelectedNotifications(new Set());
      await loadData();
    } catch (error) {
      console.error('Bulk action failed:', error);
      setError(`Bulk action failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const viewModes = [
    { id: 'queue', name: 'Queue', count: notifications.filter(n => n.status === NotificationQueueStatus.PENDING).length },
    { id: 'history', name: 'History', count: notifications.filter(n => n.status !== NotificationQueueStatus.PENDING).length },
    { id: 'templates', name: 'Templates', count: templates.length },
    { id: 'signals', name: 'Signals', count: 0 },
    { id: 'monitoring', name: 'Monitor', count: notifications.filter(n => n.status === NotificationQueueStatus.FAILED).length }
  ];

  if (loading && notifications.length === 0) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <H2 className="mb-6">Notification Management</H2>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading notifications...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <H2 className="mb-2">Notification Management</H2>
          <P2 className="text-gray-600">Manage notification queue, templates, and monitoring</P2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Mobile-Responsive View Mode Selector */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <div className="p-4">
            {/* Mobile: Dropdown */}
            <div className="lg:hidden">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {viewModes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name} ({mode.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop: Horizontal tabs */}
            <div className="hidden lg:flex space-x-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {mode.name}
                  {mode.count > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                      {mode.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View-specific Content */}
        {viewMode === 'queue' && (
          <>
            {/* Queue Filters */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
              <div className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Notifications
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by event type, ID, or recipient..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="lg:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value={NotificationQueueStatus.PENDING}>Pending</option>
                      <option value={NotificationQueueStatus.SENT}>Sent</option>
                      <option value={NotificationQueueStatus.FAILED}>Failed</option>
                      <option value={NotificationQueueStatus.RETRYING}>Retrying</option>
                    </select>
                  </div>

                  <div className="lg:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel
                    </label>
                    <select
                      value={channelFilter}
                      onChange={(e) => setChannelFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Channels</option>
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedNotifications.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {selectedNotifications.size} notifications selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBulkActionType('retry');
                            setShowBulkActionModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Retry All
                        </button>
                        <button
                          onClick={() => {
                            setBulkActionType('fail');
                            setShowBulkActionModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                          Mark Failed
                        </button>
                        <button
                          onClick={() => {
                            setBulkActionType('delete');
                            setShowBulkActionModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-8 text-center text-gray-500">
                    No notifications found matching your criteria.
                  </div>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div key={notification.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 lg:p-6">
                      {/* Mobile Layout */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
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
                              className="mt-1"
                            />
                            <div>
                              <P2 className="text-gray-900 font-bold truncate max-w-[200px]" >
                                {notification.eventType.length > 25 ? `${notification.eventType.slice(0, 22)}...` : notification.eventType}
                              </P2>
                              <P2 className="text-gray-600 text-sm">ID: {notification.id.slice(0, 12)}...</P2>
                            </div>
                          </div>
                          <StatusPill status={notification.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <br />
                            <span className="text-gray-900">
                              {DateTimeUtils.forDisplay(notification.createdAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Template:</span>
                            <br />
                            <span className="text-gray-900">{notification.templateId}</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditNotification(notification)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Edit & Resend
                          </button>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden lg:block">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
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
                            />
                            <div>
                              <P2 className="text-gray-900 font-bold truncate max-w-[200px]" >
                                {notification.eventType.length > 25 ? `${notification.eventType.slice(0, 22)}...` : notification.eventType}
                              </P2>
                              <P2 className="text-gray-600">ID: {notification.id.slice(0, 12)}...</P2>
                            </div>
                            <StatusPill status={notification.status} />
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Created:</span> {DateTimeUtils.forDisplay(notification.createdAt)}
                            </div>
                            <div>
                              <span className="text-gray-500">Template:</span> {notification.templateId}
                            </div>
                            <button
                              onClick={() => handleEditNotification(notification)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Edit & Resend
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {viewMode === 'templates' && (
          <TemplateManagementPage />
        )}

        {viewMode === 'signals' && (
          <SignalManagementPage />
        )}

        {viewMode === 'history' && (
          <>
            {/* History Filters */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
              <div className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search History
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by event type, ID, or recipient..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="lg:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value={NotificationQueueStatus.SENT}>Sent</option>
                      <option value={NotificationQueueStatus.FAILED}>Failed</option>
                      <option value={NotificationQueueStatus.RETRYING}>Retrying</option>
                    </select>
                  </div>

                  <div className="lg:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel
                    </label>
                    <select
                      value={channelFilter}
                      onChange={(e) => setChannelFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Channels</option>
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Actions for History */}
                {selectedNotifications.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {selectedNotifications.size} notifications selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const selectedItems = notifications.filter(n => selectedNotifications.has(n.id));
                            selectedItems.forEach(notification => handleResendNotification(notification));
                            setSelectedNotifications(new Set());
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Resend All
                        </button>
                        <button
                          onClick={() => {
                            setBulkActionType('delete');
                            setShowBulkActionModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-8 text-center text-gray-500">
                    No history found matching your criteria.
                  </div>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div key={notification.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 lg:p-6">
                      {/* Mobile Layout */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
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
                              className="mt-1"
                            />
                            <div>
                              <P2 className="text-gray-900 font-bold truncate max-w-[200px]" >
                                {notification.eventType.length > 25 ? `${notification.eventType.slice(0, 22)}...` : notification.eventType}
                              </P2>
                              <P2 className="text-gray-600 text-sm">ID: {notification.id.slice(0, 12)}...</P2>
                            </div>
                          </div>
                          <StatusPill status={notification.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <br />
                            <span className="text-gray-900">
                              {DateTimeUtils.forDisplay(notification.createdAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Updated:</span>
                            <br />
                            <span className="text-gray-900">
                              {DateTimeUtils.forDisplay(notification.updatedAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-500">Template:</span>
                          <br />
                          <span className="text-gray-900">{notification.templateId}</span>
                        </div>

                        {notification.errorMessage && (
                          <div className="text-sm">
                            <span className="text-gray-500">Error:</span>
                            <br />
                            <span className="text-red-600 text-xs">{notification.errorMessage}</span>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResendNotification(notification)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => handleEditNotification(notification)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden lg:block">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
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
                            />
                            <div>
                              <P2 className="text-gray-900 font-bold truncate max-w-[200px]" >
                                {notification.eventType.length > 25 ? `${notification.eventType.slice(0, 22)}...` : notification.eventType}
                              </P2>
                              <P2 className="text-gray-600">ID: {notification.id.slice(0, 12)}...</P2>
                            </div>
                            <StatusPill status={notification.status} />
                            {notification.errorMessage && (
                              <div className="text-red-600 text-xs max-w-xs truncate" title={notification.errorMessage}>
                                Error: {notification.errorMessage}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Created:</span> {DateTimeUtils.forDisplay(notification.createdAt)}
                            </div>
                            <div>
                              <span className="text-gray-500">Updated:</span> {DateTimeUtils.forDisplay(notification.updatedAt)}
                            </div>
                            <div>
                              <span className="text-gray-500">Template:</span> {notification.templateId}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleResendNotification(notification)}
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                Resend
                              </button>
                              <button
                                onClick={() => handleEditNotification(notification)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Other view modes can be implemented similarly */}

        {viewMode === 'monitoring' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-8 text-center text-gray-500">
              Monitoring view implementation in progress...
            </div>
          </div>
        )}

        {/* Modal Components */}
        <EditNotificationModal
          open={!!editingNotification}
          onClose={() => setEditingNotification(null)}
          notification={editingNotification}
          onSave={handleSaveNotification}
          onResend={handleResendNotification}
        />

        <TemplateEditorModal
          open={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          template={editingTemplate}
          onSave={handleSaveTemplate}
          mode={templateModalMode}
        />

        <BulkActionModal
          open={showBulkActionModal}
          onClose={() => setShowBulkActionModal(false)}
          selectedNotifications={notifications.filter(n => selectedNotifications.has(n.id))}
          action={bulkActionType}
          onConfirm={handleBulkAction}
        />
      </div>
    </div>
  );
};

export default NotificationManagementPage;