import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Head from 'next/head';
import { H1, H2, P2 } from '../components/typography';
import { AuthorizationService } from '../utils/authorizationHelpers';
import AdminDashboard from '../components/admin/AdminDashboard';

const AdminPage = () => {
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Check authorization on mount
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }

    const checkAuthorization = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const email = attributes.email || '';
        const currentRole = attributes['custom:role'] || 'guest';
        setUserEmail(email);
        setUserRole(currentRole);

        // STRICT ACCESS: Only admin and super_admin roles can access this page
        const hasAdminAccess = await AuthorizationService.hasMinimumRole('admin');
        
        // Only allow admin or super_admin roles (not just email check)
        if (hasAdminAccess) {
          setIsAuthorized(true);
        } else {
          setError('Access denied: Admin privileges required');
        }
      } catch (err) {
        console.error('Authorization check failed:', err);
        setError('Failed to verify admin access');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <H2 className="text-red-900 mb-2">Access Denied</H2>
            <P2 className="text-red-700 mb-4">
              You don't have permission to access the admin panel.
            </P2>
            <P2 className="text-red-600">
              If you need admin access, please contact{' '}
              <a 
                href="mailto:info@realtechee.com?subject=Admin Access Request" 
                className="font-medium underline hover:no-underline"
              >
                info@realtechee.com
              </a>{' '}
              requesting admin privileges.
            </P2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | RealTechee</title>
        <meta name="description" content="Admin dashboard for RealTechee backoffice management" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <H1>RealTechee Admin</H1>
                <P2 className="text-gray-600">
                  Logged in as: {userEmail} ({userRole})
                </P2>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin-legacy')}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Legacy Admin (Users/Contacts/Notifications)
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Back to Site
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminDashboard />
        </div>

        {/* Footer */}
        <div className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <P2 className="text-gray-500 text-center">
              Admin Dashboard - Phase 1 Implementation | More features coming in upcoming phases
            </P2>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;