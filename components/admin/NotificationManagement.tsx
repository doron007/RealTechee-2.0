import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, H3, P2 } from '../typography';
import { listNotificationQueues, listNotificationTemplates } from '../../queries';

const client = generateClient();

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      // Load notification queue
      const queueResult = await client.graphql({
        query: listNotificationQueues,
        variables: {
          limit: 50
        }
      });

      // Load notification templates
      const templateResult = await client.graphql({
        query: listNotificationTemplates,
        variables: {
          limit: 20
        }
      });

      if (queueResult.errors || templateResult.errors) {
        console.error('GraphQL errors:', queueResult.errors || templateResult.errors);
        setError('Failed to load notifications');
        return;
      }

      setNotifications(queueResult.data.listNotificationQueues?.items || []);
      setTemplates(templateResult.data.listNotificationTemplates?.items || []);
      console.log('✅ Loaded notifications and templates');
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <H2>Notification System</H2>
        <button
          onClick={loadNotifications}
          disabled={loadingNotifications}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingNotifications ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loadingNotifications ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <P2 className="mt-2 text-gray-600">Loading notification data...</P2>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Notification Queue Status */}
          <div className="bg-white border rounded-lg p-6">
            <H3 className="mb-4">Recent Notifications ({notifications.length})</H3>
            {notifications.length === 0 ? (
              <P2 className="text-gray-500">No notifications found</P2>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Channels
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retries
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notifications.slice(0, 10).map((notification: any) => (
                      <tr key={notification.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.eventType}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {notification.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.status === 'SENT' 
                              ? 'bg-green-100 text-green-800'
                              : notification.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : notification.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {notification.status}
                          </span>
                          {notification.errorMessage && (
                            <div className="text-xs text-red-600 mt-1" title={notification.errorMessage}>
                              Error: {notification.errorMessage.substring(0, 30)}...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {Array.isArray(notification.recipientIds) 
                              ? `${notification.recipientIds.length} recipients`
                              : typeof notification.recipientIds === 'string'
                              ? `${JSON.parse(notification.recipientIds || '[]').length} recipients`
                              : '0 recipients'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(notification.channels) 
                              ? notification.channels 
                              : JSON.parse(notification.channels || '[]')
                            ).map((channel: string) => (
                              <span key={channel} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {channel}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {notification.retryCount || 0}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notification Templates */}
          <div className="bg-white border rounded-lg p-6">
            <H3 className="mb-4">Notification Templates ({templates.length})</H3>
            {templates.length === 0 ? (
              <P2 className="text-gray-500">No templates found</P2>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template Name
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {templates.map((template: any) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {template.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {template.channel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {template.subject || 'No subject'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            template.isActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="bg-white border rounded-lg p-6">
            <H3 className="mb-4">System Status</H3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800">Notification Queue</div>
                <div className="text-2xl font-bold text-green-900">
                  {notifications.filter(n => n.status === 'SENT').length}
                </div>
                <div className="text-sm text-green-600">Successfully sent</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm font-medium text-yellow-800">Pending</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {notifications.filter(n => n.status === 'PENDING' || n.status === 'RETRYING').length}
                </div>
                <div className="text-sm text-yellow-600">Awaiting delivery</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-medium text-red-800">Failed</div>
                <div className="text-2xl font-bold text-red-900">
                  {notifications.filter(n => n.status === 'FAILED').length}
                </div>
                <div className="text-sm text-red-600">Delivery failed</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;