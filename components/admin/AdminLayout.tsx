import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Head from 'next/head';
import { H2, P2 } from '../typography';
import { AuthorizationService } from '../../utils/authorizationHelpers';
import AdminSidebar from './AdminSidebar';
import { useAdminSidebar } from '../../hooks/useAdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title = 'Admin Panel',
  description = 'RealTechee admin panel'
}) => {
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { isCollapsed } = useAdminSidebar();

  // Check authorization on mount
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    const checkAuthorization = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const email = attributes.email || '';
        const currentRole = attributes['custom:role'] || 'guest';
        setUserEmail(email);
        setUserRole(currentRole);

        // STRICT ACCESS: Only admin and super_admin roles can access admin pages
        const hasAdminAccess = await AuthorizationService.hasMinimumRole('admin');
        
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

  // AdminSidebar handles its own toggle internally

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <>
        <Head>
          <title>Access Denied | RealTechee</title>
          <meta name="description" content="Access denied to admin panel" />
        </Head>
        
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
              <div className="mt-4">
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Authorized admin layout
  return (
    <>
      <Head>
        <title>{title} | RealTechee</title>
        <meta name="description" content={description} />
      </Head>

      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div 
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          {/* Top Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                  <P2 className="text-gray-600">
                    Logged in as: {userEmail} ({userRole})
                  </P2>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Quick actions */}
                  <button
                    onClick={() => router.push('/')}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    View Site
                  </button>
                  
                  {/* User menu could go here */}
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {userEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-6 pt-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <P2 className="text-gray-500 text-center">
              RealTechee Admin Panel - Phase 2 Implementation
            </P2>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;