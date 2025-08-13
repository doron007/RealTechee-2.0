import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { H1, H2, H3, P1, P2, P3 } from '../typography';
import { projectsAPI, quotesAPI, requestsAPI, contactsAPI, backOfficeProjectStatusesAPI, backOfficeQuoteStatusesAPI, backOfficeRequestStatusesAPI } from '../../utils/amplifyAPI';
import { AdminService } from '../../utils/adminService';

interface DashboardStats {
  projects: {
    total: number;
    new: number;
    active: number;
    completed: number;
  };
  quotes: {
    total: number;
    pending: number;
    signed: number;
    expired: number;
  };
  requests: {
    total: number;
    submitted: number;
    inReview: number;
    quoted: number;
  };
  users: {
    total: number;
    active: number;
    pending: number;
  };
  contacts: {
    total: number;
    withEmail: number;
    withSms: number;
  };
  notifications: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
  };
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    projects: { total: 0, new: 0, active: 0, completed: 0 },
    quotes: { total: 0, pending: 0, signed: 0, expired: 0 },
    requests: { total: 0, submitted: 0, inReview: 0, quoted: 0 },
    users: { total: 0, active: 0, pending: 0 },
    contacts: { total: 0, withEmail: 0, withSms: 0 },
    notifications: { total: 0, sent: 0, pending: 0, failed: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Load all data in parallel for better performance
      const [
        projectsResult,     // Fixed: Now correctly gets projects
        quotesResult, 
        requestsResult,     // Fixed: Now correctly gets requests
        contactsResult, 
        usersResult,
        projectStatusesResult,
        quoteStatusesResult,
        requestStatusesResult
      ] = await Promise.all([
        projectsAPI.list(),        // Returns projects → projectsResult
        quotesAPI.list(),          // Returns quotes → quotesResult
        requestsAPI.list(),        // Returns requests → requestsResult
        contactsAPI.list(),
        AdminService.listUsers(100),
        backOfficeProjectStatusesAPI.list(),
        backOfficeQuoteStatusesAPI.list(),
        backOfficeRequestStatusesAPI.list()
      ]);

      // Get actual status definitions from backoffice tables
      const projectStatuses = projectStatusesResult.success ? projectStatusesResult.data : [];
      const quoteStatuses = quoteStatusesResult.success ? quoteStatusesResult.data : [];
      const requestStatuses = requestStatusesResult.success ? requestStatusesResult.data : [];

      // Calculate project stats using actual status data (filter out archived)
      const allProjects = projectsResult.success ? projectsResult.data : [];
      const projects = allProjects.filter((p: any) => p.status !== 'Archived' && p.archived !== 'true');
      console.log(`📊 Projects: ${allProjects.length} total, ${projects.length} non-archived`);
      
      const projectStats = {
        total: projects.length,
        new: projects.filter((p: any) => p.status === 'New').length,
        active: projects.filter((p: any) => 
          ['Boosting', 'Buyer Servicing', 'Pre-listing', 'Listed', 'In-escrow'].includes(p.status)
        ).length,
        completed: projects.filter((p: any) => ['Sold', 'Completed'].includes(p.status)).length
      };

      // Calculate quote stats using actual status data (filter out archived)
      const allQuotes = quotesResult.success ? quotesResult.data : [];
      const quotes = allQuotes.filter((q: any) => q.status !== 'Archived' && q.archived !== 'true');
      console.log(`📊 Quotes: ${allQuotes.length} total, ${quotes.length} non-archived`);
      
      const quoteStats = {
        total: quotes.length,
        pending: quotes.filter((q: any) => 
          ['Draft', 'Sent', 'Opened', 'Under Review'].includes(q.status)
        ).length,
        signed: quotes.filter((q: any) => q.status === 'Signed' || q.signed === true).length,
        expired: quotes.filter((q: any) => q.status === 'Expired').length
      };

      // Calculate request stats using actual status data (filter out archived)
      const allRequests = requestsResult.success ? requestsResult.data : [];
      const requests = allRequests.filter((r: any) => r.status !== 'Archived' && r.archived !== 'true');
      console.log(`📊 Requests: ${allRequests.length} total, ${requests.length} non-archived`);
      
      const requestStats = {
        total: requests.length,
        submitted: requests.filter((r: any) => r.status === 'Submitted').length,
        inReview: requests.filter((r: any) => 
          ['In Review', 'Under Review', 'Being Reviewed'].includes(r.status)
        ).length,
        quoted: requests.filter((r: any) => r.status === 'Quoted' || r.status === 'Quote Sent').length
      };

      // Calculate contact stats
      const contacts = contactsResult.success ? contactsResult.data : [];
      const contactStats = {
        total: contacts.length,
        withEmail: contacts.filter((c: any) => c.emailNotifications).length,
        withSms: contacts.filter((c: any) => c.smsNotifications).length
      };

      // Calculate user stats
      const users = usersResult.users || [];
      const userStats = {
        total: users.length,
        active: users.filter((u: any) => u.status === 'CONFIRMED').length,
        pending: users.filter((u: any) => u.status === 'UNCONFIRMED').length
      };

      // Mock notification stats (would come from notification API)
      const notificationStats = {
        total: 150,
        sent: 120,
        pending: 20,
        failed: 10
      };

      setStats({
        projects: projectStats,
        quotes: quoteStats,
        requests: requestStats,
        users: userStats,
        contacts: contactStats,
        notifications: notificationStats
      });

    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSection = (section: string) => {
    // Navigate to appropriate admin section
    switch (section) {
      case 'projects':
        router.push('/admin/projects');
        break;
      case 'quotes':
        router.push('/admin/quotes');
        break;
      case 'requests':
        router.push('/admin/requests');
        break;
      case 'users':
      case 'contacts':
      case 'notifications':
        // Navigate to current admin page with specific tab
        router.push('/admin-legacy');
        break;
      default:
        // Show placeholder for not yet implemented sections
        alert(`${section} management will be implemented in upcoming phases`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Requests Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToSection('requests')}>
          <div className="flex items-center justify-between mb-4">
            <H3 className="text-orange-600">Requests</H3>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <P2 className="text-gray-600">Total Requests</P2>
              <P2 className="font-semibold">{stats.requests.total}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-blue-600">Submitted</P2>
              <P2 className="font-semibold">{stats.requests.submitted}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-yellow-600">In Review</P2>
              <P2 className="font-semibold">{stats.requests.inReview}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-green-600">Quoted</P2>
              <P2 className="font-semibold">{stats.requests.quoted}</P2>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <P2 className="text-orange-600 font-medium">View All Requests →</P2>
          </div>
        </div>

        {/* Quotes Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToSection('quotes')}>
          <div className="flex items-center justify-between mb-4">
            <H3 className="text-purple-600">Quotes</H3>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <P2 className="text-gray-600">Total Quotes</P2>
              <P2 className="font-semibold">{stats.quotes.total}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-yellow-600">Pending</P2>
              <P2 className="font-semibold">{stats.quotes.pending}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-green-600">Signed</P2>
              <P2 className="font-semibold">{stats.quotes.signed}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-red-600">Expired</P2>
              <P2 className="font-semibold">{stats.quotes.expired}</P2>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <P2 className="text-purple-600 font-medium">View All Quotes →</P2>
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToSection('projects')}>
          <div className="flex items-center justify-between mb-4">
            <H3 className="text-blue-600">Projects</H3>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <P2 className="text-gray-600">Total Projects</P2>
              <P2 className="font-semibold">{stats.projects.total}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-green-600">New</P2>
              <P2 className="font-semibold">{stats.projects.new}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-blue-600">Active</P2>
              <P2 className="font-semibold">{stats.projects.active}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-gray-600">Completed</P2>
              <P2 className="font-semibold">{stats.projects.completed}</P2>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <P2 className="text-blue-600 font-medium">View All Projects →</P2>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToSection('users')}>
          <div className="flex items-center justify-between mb-4">
            <H3 className="text-indigo-600">Users</H3>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <P2 className="text-gray-600">Total Users</P2>
              <P2 className="font-semibold">{stats.users.total}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-green-600">Active</P2>
              <P2 className="font-semibold">{stats.users.active}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-yellow-600">Pending</P2>
              <P2 className="font-semibold">{stats.users.pending}</P2>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <P2 className="text-indigo-600 font-medium">Manage Users →</P2>
          </div>
        </div>

        {/* Contacts Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToSection('contacts')}>
          <div className="flex items-center justify-between mb-4">
            <H3 className="text-green-600">Contacts</H3>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <P2 className="text-gray-600">Total Contacts</P2>
              <P2 className="font-semibold">{stats.contacts.total}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-blue-600">Email Enabled</P2>
              <P2 className="font-semibold">{stats.contacts.withEmail}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-purple-600">SMS Enabled</P2>
              <P2 className="font-semibold">{stats.contacts.withSms}</P2>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <P2 className="text-green-600 font-medium">Manage Contacts →</P2>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigateToSection('notifications')}>
          <div className="flex items-center justify-between mb-4">
            <H3 className="text-red-600">Notifications</H3>
            <div className="bg-red-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <P2 className="text-gray-600">Total Sent</P2>
              <P2 className="font-semibold">{stats.notifications.total}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-green-600">Delivered</P2>
              <P2 className="font-semibold">{stats.notifications.sent}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-yellow-600">Pending</P2>
              <P2 className="font-semibold">{stats.notifications.pending}</P2>
            </div>
            <div className="flex justify-between">
              <P2 className="text-red-600">Failed</P2>
              <P2 className="font-semibold">{stats.notifications.failed}</P2>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <P2 className="text-red-600 font-medium">View Notifications →</P2>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8">
        <H2 className="mb-4">Quick Actions</H2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigateToSection('projects')}
            className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <P2 className="font-semibold">Add New Project</P2>
            <P2 className="text-blue-600 text-sm">Create a new project record</P2>
          </button>
          <button
            onClick={() => navigateToSection('quotes')}
            className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <P2 className="font-semibold">Generate Quote</P2>
            <P2 className="text-purple-600 text-sm">Create quote from request</P2>
          </button>
          <button
            onClick={() => navigateToSection('users')}
            className="p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-left"
          >
            <P2 className="font-semibold">Manage Users</P2>
            <P2 className="text-indigo-600 text-sm">User roles and permissions</P2>
          </button>
          <button
            onClick={() => loadDashboardStats()}
            className="p-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <P2 className="font-semibold">Refresh Data</P2>
            <P2 className="text-gray-600 text-sm">Update dashboard statistics</P2>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;