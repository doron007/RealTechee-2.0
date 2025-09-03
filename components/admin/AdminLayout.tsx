import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import Head from 'next/head';
import { H2, P2 } from '../typography';
import { AuthorizationService } from '../../utils/authorizationHelpers';
import { TokenManager } from '../../utils/tokenManager';
import { AuthStateManager } from '../../utils/authStateManager';
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
  const [tokenError, setTokenError] = useState<boolean>(false);
  const { isCollapsed, isMobile, isHamburgerMode, isMenuOpen, toggle, closeMenu } = useAdminSidebar();
  
  // Debug information for troubleshooting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).adminLayoutDebugInfo = {
        isCollapsed,
        isMobile,
        windowWidth: window.innerWidth,
        sidebarWidth: isCollapsed ? 64 : 256
      };
    }
  }, [isCollapsed, isMobile]);

  // Start token monitoring when component mounts
  useEffect(() => {
    if (user && isAuthorized) {
      console.log('🔄 Starting token monitoring for admin session');
      const stopMonitoring = TokenManager.startTokenMonitoring();
      
      return () => {
        stopMonitoring();
      };
    }
  }, [user, isAuthorized]);

  // Check authorization on mount
  useEffect(() => {
    if (!user) {
      // Wait for router to be ready before redirecting to avoid using [id] literal
      if (router.isReady) {
        router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      }
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
        
        // Check if this is a token-related error
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('Invalid login token') || 
            errorMessage.includes('NotAuthorizedException') ||
            errorMessage.includes('Couldn\'t verify signed token')) {
          console.log('🔧 Detected token authentication error - checking auth state corruption');
          
          // Check if auth state is corrupted
          const authReport = AuthStateManager.getAuthStateReport();
          console.log('📊 Auth state report:', authReport);
          
          if (authReport.isCorrupted || authReport.possibleIssues.length > 0) {
            console.log('💥 Corrupted authentication state detected - performing complete reset');
            await AuthStateManager.performCompleteReset(router.asPath);
            return; // This will trigger a page reload
          }
          
          setTokenError(true);
          setError('Authentication token has expired or is invalid. Please reset your session.');
        } else {
          setError('Failed to verify admin access');
        }
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
            <div className={`border rounded-lg p-6 text-center ${tokenError ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
              <H2 className={`mb-2 ${tokenError ? 'text-orange-900' : 'text-red-900'}`}>
                {tokenError ? '🔧 Authentication Issue' : 'Access Denied'}
              </H2>
              <P2 className={`mb-4 ${tokenError ? 'text-orange-700' : 'text-red-700'}`}>
                {tokenError 
                  ? 'Your authentication token has expired or is invalid.' 
                  : "You don't have permission to access the admin panel."
                }
              </P2>
              
              {tokenError ? (
                <div className="space-y-4">
                  <P2 className="text-orange-600">
                    This usually happens when your session has expired. Here are your options:
                  </P2>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={async () => {
                        console.log('🔄 User clicked complete authentication reset');
                        await AuthStateManager.performCompleteReset(router.asPath);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                      🔄 Complete Authentication Reset
                    </button>
                    
                    <button
                      onClick={async () => {
                        try {
                          await signOut();
                          router.push('/login?redirect=' + encodeURIComponent(router.isReady ? router.asPath : '/admin'));
                        } catch (error) {
                          console.error('Sign out error:', error);
                          // Force navigation even if signOut fails
                          router.push('/login?redirect=' + encodeURIComponent(router.isReady ? router.asPath : '/admin'));
                        }
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
                    >
                      🚪 Sign Out & Login
                    </button>
                    
                    <button
                      onClick={() => {
                        window.open('/tmp/clear-auth-state.html', '_blank', 'width=800,height=600');
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      🔧 Manual State Cleaner
                    </button>
                  </div>
                  
                  <P2 className="text-orange-600 text-sm">
                    If problems persist, try the "Clear Authentication State" tool to reset your session completely.
                  </P2>
                </div>
              ) : (
                <div>
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
              )}
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
        {/* Sidebar - Always render, internal state controls visibility */}
        <AdminSidebar 
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          isHamburgerMode={isHamburgerMode}
          isMenuOpen={isMenuOpen}
          toggle={toggle}
          closeMenu={closeMenu}
        />

        {/* Main Content Container - Takes remaining viewport width after sidebar */}
        <div 
          className={`flex-1 flex flex-col min-h-screen overflow-hidden ${
            // In hamburger mode, content uses full width when menu is closed
            isHamburgerMode ? 'w-full' : ''
          }`}
        >
          {/* Top Div: Title Bar + CTA Buttons - 100% width of parent container */}
          <div className="w-full bg-white shadow-sm border-b border-gray-200 flex-shrink-0 relative z-40">
            <div className="w-full px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between w-full min-w-0">
                {/* Left side - Hamburger menu + Title and user info */}
                <div className="flex items-center flex-1 min-w-0 pr-2 lg:pr-4">
                  {/* Hamburger Menu Button - Only visible on iPhone */}
                  {isHamburgerMode && (
                    <button
                      onClick={toggle}
                      className="mr-3 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                      <div className="w-6 h-6 flex flex-col justify-center items-center">
                        <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`} />
                        <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
                        <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`} />
                      </div>
                    </button>
                  )}
                  
                  {/* Title and user info */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 truncate">
                      {title}
                    </h1>
                    <P2 className="text-gray-600 text-xs sm:text-sm truncate">
                      Logged in as: {userEmail} ({userRole})
                    </P2>
                  </div>
                </div>
                
                {/* Right side - CTA Actions */}
                <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
                  <button
                    onClick={() => router.push('/')}
                    className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm px-2 sm:px-3 py-2 rounded hover:bg-gray-100 whitespace-nowrap relative z-50"
                    title="View Site"
                  >
                    <span className="hidden sm:inline">View Site</span>
                    <span className="sm:hidden">Site</span>
                  </button>
                  
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
            <div className="w-full px-6 pt-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          {/* Bottom Div: DataGrid/Cards - 100% width, no min-width constraints */}
          <main className="flex-1 w-full overflow-hidden">
            <div className="w-full h-full p-4 sm:p-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <div className="w-full bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
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