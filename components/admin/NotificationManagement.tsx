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
      // Load notification queue
      const queueResult = await client.graphql({
        query: listNotificationQueues,
        variables: { limit: 100 }
      });

      // Load notification templates
      let templateResult;
      try {
        templateResult = await client.graphql({
          query: listNotificationTemplates,
          variables: { limit: 50 }
        });
      } catch (templateError: any) {
        // AWS Amplify GraphQL client throws exceptions for GraphQL errors
        // even when data is present. Check if the exception contains usable data.
        if (templateError && typeof templateError === 'object' && templateError.data) {
          console.warn('⚠️ GraphQL client threw exception but data is available - treating as success with warnings');
          if (templateError.errors) {
            console.warn('⚠️ GraphQL validation errors:', templateError.errors.length, 'errors found');
          }
          
          // Use the exception as the result since it contains valid data
          templateResult = templateError;
        } else {
          console.error('❌ Template query failed completely - no data available');
          throw templateError;
        }
      }

      // Check for GraphQL errors but don't fail if data exists
      let hasGraphQLErrors = false;
      
      try {
        if (queueResult && queueResult.errors && Array.isArray(queueResult.errors)) {
          hasGraphQLErrors = true;
          console.error('⚠️ Queue GraphQL errors:', queueResult.errors.length);
          queueResult.errors.forEach((error: any, index: number) => {
            console.error(`Queue Error ${index + 1}:`, error?.message || 'Unknown error');
          });
        }
        
        if (templateResult && templateResult.errors && Array.isArray(templateResult.errors)) {
          hasGraphQLErrors = true;
          console.error('⚠️ Template GraphQL errors:', templateResult.errors.length);
          templateResult.errors.forEach((error: any, index: number) => {
            console.error(`Template Error ${index + 1}:`, error?.message || 'Unknown error');
          });
        }

        if (hasGraphQLErrors) {
          console.warn('🔍 GraphQL errors detected, but continuing with available data...');
        }
      } catch (errorProcessingError) {
        console.error('❌ Error while processing GraphQL errors:', errorProcessingError);
        // Continue processing even if error logging fails
      }

      // Handle notification data processing
      let notificationsData: NotificationItem[] = [];
      try {
        const rawItems = queueResult?.data?.listNotificationQueues?.items || [];
        
        notificationsData = rawItems
          .filter((item: any) => {
            // Basic validation - skip records missing critical fields
            if (!item || !item.id) {
              console.warn('⚠️ Skipping notification record without ID:', item);
              return false;
            }
            return true;
          })
          .map((item: any): NotificationItem => {
            try {
              // Safely normalize channels and recipientIds to JSON string format
              const normalizeArrayField = (field: any): string => {
                if (!field) return '[]';
                if (typeof field === 'string') return field;
                if (Array.isArray(field)) return JSON.stringify(field);
                return '[]';
              };

              return {
                ...item,
                status: item.status as NotificationQueueStatus || NotificationQueueStatus.PENDING,
                channels: normalizeArrayField(item.channels),
                recipientIds: normalizeArrayField(item.recipientIds),
                eventType: item.eventType || 'unknown',
                templateId: item.templateId || '',
                payload: item.payload || '{}',
                createdAt: item.createdAt || new Date().toISOString()
              };
            } catch (processingError) {
              console.warn('⚠️ Error processing notification record, using defaults:', item.id, processingError);
              // Return a minimal valid record if processing fails
              return {
                id: item.id,
                eventType: 'unknown',
                status: NotificationQueueStatus.PENDING,
                recipientIds: '[]',
                channels: '[]',
                templateId: '',
                payload: '{}',
                createdAt: new Date().toISOString()
              };
            }
          });
      } catch (notificationProcessingError) {
        console.error('❌ Error processing notification data:', notificationProcessingError);
        notificationsData = []; // Use empty array as fallback
      }
      
      // Handle template data processing
      let templatesData: TemplateItem[] = [];
      try {
        const rawTemplates = templateResult?.data?.listNotificationTemplates?.items || [];
        
        templatesData = rawTemplates
          .filter((item: any) => {
            if (!item || !item.id) {
              console.warn('⚠️ Skipping template record without ID:', item);
              return false;
            }
            return true;
          })
          .map((item: any): TemplateItem => ({
            ...item,
            channel: item.channel || 'EMAIL',
            name: item.name || 'Unnamed Template',
            createdAt: item.createdAt || new Date().toISOString()
          }));
      } catch (templateProcessingError) {
        console.error('❌ Error processing template data:', templateProcessingError);
        templatesData = []; // Use empty array as fallback
      }

      // Set state with processed data
      try {
        setNotifications(notificationsData);
        setTemplates(templatesData);
      } catch (stateError) {
        console.error('❌ Error setting state:', stateError);
        throw stateError;
      }
      
      // Handle error display logic
      try {
        if (!queueResult?.data?.listNotificationQueues && !templateResult?.data?.listNotificationTemplates) {
          // Both queries failed completely - this is a real error
          const errorMessages = [
            ...(queueResult?.errors || []).map((e: any) => e?.message || 'Unknown queue error'),
            ...(templateResult?.errors || []).map((e: any) => e?.message || 'Unknown template error')
          ];
          setError(`Failed to load data: ${errorMessages.join(', ')}`);
        } else if (hasGraphQLErrors) {
          // We have data but some GraphQL errors - show warning but don't fail
          console.warn('⚠️ Some records had GraphQL validation errors but data was loaded successfully');
          setError(''); // Clear any previous errors
        } else {
          setError('');
        }
      } catch (errorStateError) {
        console.error('❌ Error setting error state:', errorStateError);
        setError('An unexpected error occurred while processing notification data');
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
        const channels = parseChannels(n.channels);
        return channels.includes(channelFilter);
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
      console.log('📧 Sending test "Get an Estimate" notification...');
      
      // Create a realistic Get Estimate notification payload
      const getEstimatePayload = {
        customer: {
          name: 'John Smith (Test)',
          email: 'info@realtechee.com',
          phone: '(555) 123-4567',
          company: 'Test Real Estate Group'
        },
        property: {
          address: '123 Test Property Street, Beverly Hills, CA 90210'
        },
        project: {
          product: 'Kitchen & Bathroom Renovation',
          message: 'Looking for a complete renovation estimate for a luxury property. This is a test submission to validate the notification system end-to-end.',
          relationToProperty: 'Real Estate Agent',
          needFinance: true,
          consultationType: 'in-person'
        },
        submission: {
          id: `TEST-EST-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          leadSource: 'ADMIN_TEST'
        },
        admin: {
          dashboardUrl: typeof window !== 'undefined' 
            ? `${window.location.origin}/admin/requests`
            : 'https://localhost:3000/admin/requests'
        }
      };

      // Create test notification with proper Get Estimate structure
      const testNotification = {
        eventType: 'get_estimate_request',
        payload: JSON.stringify(getEstimatePayload),
        recipientIds: JSON.stringify(['admin-team']),
        channels: JSON.stringify(['EMAIL', 'SMS']),
        templateId: 'get-estimate-template-001',
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

      console.log('✅ Test Get Estimate notification created:', result);
      
      // Refresh data to show the new notification
      await loadData();
    } catch (err) {
      console.error('❌ Failed to send test notification:', err);
      setError(`Failed to send test notification: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      console.log('🔍 Running notification system diagnostics...');
      
      let diagnosticResults = [];
      
      // 1. Check if templates exist
      console.log('🔍 Checking notification templates...');
      try {
        const templateResult = await client.graphql({
          query: listNotificationTemplates,
          variables: { limit: 10 }
        });
        
        const templateCount = templateResult.data?.listNotificationTemplates?.items?.length || 0;
        diagnosticResults.push(`✅ Templates found: ${templateCount}`);
        
        const hasGetEstimateTemplate = templateResult.data?.listNotificationTemplates?.items?.some(
          (t: any) => t.id === 'get-estimate-template-001'
        );
        
        if (hasGetEstimateTemplate) {
          diagnosticResults.push(`✅ Get Estimate template exists`);
        } else {
          diagnosticResults.push(`❌ Get Estimate template missing (ID: get-estimate-template-001)`);
        }
      } catch (err) {
        diagnosticResults.push(`❌ Template check failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      // 2. Check current failed notifications
      const failedNotifications = notifications.filter(n => n.status === NotificationQueueStatus.FAILED);
      diagnosticResults.push(`⚠️ Currently failed notifications: ${failedNotifications.length}`);
      
      if (failedNotifications.length > 0) {
        const latestFailed = failedNotifications[0];
        if (latestFailed.errorMessage) {
          diagnosticResults.push(`❌ Latest error: ${latestFailed.errorMessage.substring(0, 100)}...`);
        }
      }
      
      // 3. Display diagnostic results
      const diagnosticSummary = diagnosticResults.join('\n');
      console.log('🔍 Diagnostic Results:\n', diagnosticSummary);
      
      // Show diagnostic results in error state for user visibility
      setError(`🔍 Diagnostic Results:\n${diagnosticSummary}\n\n💡 Common Issues:\n- AWS Parameter Store missing SendGrid/Twilio API keys\n- Templates not created in database\n- Lambda function permissions\n- CloudWatch logs: check /aws/lambda/notification-processor`);
      
    } catch (err) {
      console.error('❌ Diagnostics failed:', err);
      setError(`Diagnostics failed: ${err instanceof Error ? err.message : String(err)}`);
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

  const createGetEstimateTemplate = async () => {
    try {
      setLoading(true);
      console.log('📝 Creating Get Estimate email template...');
      
      // Create the main Get Estimate email template
      const getEstimateTemplate = {
        id: 'get-estimate-template-001',
        name: 'Get Estimate Request - Email',
        channel: NotificationTemplateChannel.EMAIL,
        subject: 'New Estimate Request - {{customer.name}} ({{property.address}})',
        contentHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Estimate Request Received</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #1e40af;">Customer Information</h3>
              <p><strong>Name:</strong> {{customer.name}}</p>
              <p><strong>Email:</strong> {{customer.email}}</p>
              <p><strong>Phone:</strong> {{customer.phone}}</p>
              {{#if customer.company}}<p><strong>Company:</strong> {{customer.company}}</p>{{/if}}
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #0c4a6e;">Property Details</h3>
              <p><strong>Address:</strong> {{property.address}}</p>
            </div>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #166534;">Project Information</h3>
              <p><strong>Service:</strong> {{project.product}}</p>
              {{#if project.relationToProperty}}<p><strong>Relation to Property:</strong> {{project.relationToProperty}}</p>{{/if}}
              {{#if project.needFinance}}<p><strong>Financing Needed:</strong> Yes</p>{{/if}}
              {{#if project.consultationType}}<p><strong>Consultation Type:</strong> {{project.consultationType}}</p>{{/if}}
              {{#if project.message}}<p><strong>Message:</strong> {{project.message}}</p>{{/if}}
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #92400e;">Submission Details</h3>
              <p><strong>Submission ID:</strong> {{submission.id}}</p>
              <p><strong>Submitted:</strong> {{submission.timestamp}}</p>
              <p><strong>Lead Source:</strong> {{submission.leadSource}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{admin.dashboardUrl}}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View in Admin Dashboard
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              This notification was sent automatically by RealTechee. Please respond to the customer within 24 hours.
            </p>
          </div>
        `,
        contentText: `
New Estimate Request Received

CUSTOMER INFORMATION:
Name: {{customer.name}}
Email: {{customer.email}}
Phone: {{customer.phone}}
{{#if customer.company}}Company: {{customer.company}}{{/if}}

PROPERTY DETAILS:
Address: {{property.address}}

PROJECT INFORMATION:
Service: {{project.product}}
{{#if project.relationToProperty}}Relation to Property: {{project.relationToProperty}}{{/if}}
{{#if project.needFinance}}Financing Needed: Yes{{/if}}
{{#if project.consultationType}}Consultation Type: {{project.consultationType}}{{/if}}
{{#if project.message}}Message: {{project.message}}{{/if}}

SUBMISSION DETAILS:
Submission ID: {{submission.id}}
Submitted: {{submission.timestamp}}
Lead Source: {{submission.leadSource}}

Admin Dashboard: {{admin.dashboardUrl}}

Please respond to the customer within 24 hours.
        `,
        isActive: true,
        variables: JSON.stringify([
          'customer.name', 'customer.email', 'customer.phone', 'customer.company',
          'property.address',
          'project.product', 'project.relationToProperty', 'project.needFinance', 'project.consultationType', 'project.message',
          'submission.id', 'submission.timestamp', 'submission.leadSource',
          'admin.dashboardUrl'
        ]),
        owner: 'system'
      };

      const result = await client.graphql({
        query: createNotificationTemplate,
        variables: {
          input: getEstimateTemplate
        }
      });

      console.log('✅ Get Estimate template created:', result);
      
      // Also create SMS template
      await createGetEstimateSmsTemplate();
      
      // Refresh data to show the new templates
      await loadData();
    } catch (err) {
      console.error('❌ Failed to create Get Estimate template:', err);
      setError(`Failed to create Get Estimate template: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const createGetEstimateSmsTemplate = async () => {
    try {
      console.log('📱 Creating Get Estimate SMS template...');
      
      const smsTemplate = {
        id: 'get-estimate-sms-template-001',
        name: 'Get Estimate Request - SMS',
        channel: NotificationTemplateChannel.SMS,
        subject: 'New Estimate Request',
        contentText: `🏠 NEW ESTIMATE REQUEST

Customer: {{customer.name}}
Phone: {{customer.phone}}
Property: {{property.address}}
Service: {{project.product}}

{{#if project.message}}Message: {{project.message}}{{/if}}

Submission ID: {{submission.id}}
Time: {{submission.timestamp}}

Dashboard: {{admin.dashboardUrl}}

⏰ Respond within 24 hours`,
        isActive: true,
        variables: JSON.stringify([
          'customer.name', 'customer.phone',
          'property.address',
          'project.product', 'project.message',
          'submission.id', 'submission.timestamp',
          'admin.dashboardUrl'
        ]),
        owner: 'system'
      };

      const result = await client.graphql({
        query: createNotificationTemplate,
        variables: {
          input: smsTemplate
        }
      });

      console.log('✅ Get Estimate SMS template created:', result);
      
    } catch (err) {
      console.error('❌ Failed to create Get Estimate SMS template:', err);
      throw err;
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
            {loading ? 'Sending...' : 'Test Get Estimate'}
          </button>
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Run Diagnostics'}
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
                <div className="flex gap-2">
                  <button
                    onClick={createGetEstimateTemplate}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Get Estimate Templates'}
                  </button>
                  <button
                    onClick={createTestTemplate}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Test Template'}
                  </button>
                </div>
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