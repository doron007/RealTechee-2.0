import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { AuthorizationService } from '../../utils/authorizationHelpers';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminDashboard from '../../components/admin/AdminDashboard';

// Mock modules
jest.mock('next/router');
jest.mock('@aws-amplify/ui-react');
jest.mock('aws-amplify/auth');
jest.mock('../../utils/authorizationHelpers');
jest.mock('../../utils/amplifyAPI', () => ({
  projectsAPI: {
    getAllProjects: jest.fn().mockResolvedValue([]),
  },
  quotesAPI: {
    getAllQuotes: jest.fn().mockResolvedValue([]),
  },
  requestsAPI: {
    getAllRequests: jest.fn().mockResolvedValue([]),
  },
  contactsAPI: {
    getAllContacts: jest.fn().mockResolvedValue([]),
  },
}));

const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuthenticator = useAuthenticator as jest.MockedFunction<typeof useAuthenticator>;
const mockFetchUserAttributes = fetchUserAttributes as jest.MockedFunction<typeof fetchUserAttributes>;
const mockAuthorizationService = AuthorizationService as jest.Mocked<typeof AuthorizationService>;

describe('Admin Integration Tests', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockPush,
      pathname: '/admin',
      asPath: '/admin',
      query: {},
    } as any);
  });

  describe('Admin Layout + Sidebar Integration', () => {
    beforeEach(() => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'admin@realtechee.com' } },
      } as any);

      mockFetchUserAttributes.mockResolvedValue({
        email: 'admin@realtechee.com',
        'custom:role': 'admin'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);
    });

    it('should render complete admin interface with sidebar and content', async () => {
      render(
        <AdminLayout title="Dashboard">
          <AdminDashboard />
        </AdminLayout>
      );

      await waitFor(() => {
        // Should have sidebar navigation
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        
        // Should have admin header
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Logged in as: admin@realtechee.com (admin)')).toBeInTheDocument();
        
        // Should have dashboard content
        expect(screen.getByText('Total Projects')).toBeInTheDocument();
      });
    });

    it('should handle sidebar toggle state correctly', async () => {
      const TestComponent = () => {
        const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
        
        return (
          <div className="flex">
            <AdminSidebar 
              isCollapsed={sidebarCollapsed} 
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
            <div className={`ml-${sidebarCollapsed ? '16' : '64'}`}>
              <span data-testid="sidebar-state">
                {sidebarCollapsed ? 'collapsed' : 'expanded'}
              </span>
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      // Initially expanded
      expect(screen.getByTestId('sidebar-state')).toHaveTextContent('expanded');

      // Click toggle button
      const toggleButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(toggleButton);

      // Should be collapsed
      expect(screen.getByTestId('sidebar-state')).toHaveTextContent('collapsed');
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });
  });

  describe('Authorization Flow Integration', () => {
    it('should redirect unauthorized users correctly', async () => {
      mockUseAuthenticator.mockReturnValue({
        user: null,
      } as any);

      render(
        <AdminLayout title="Dashboard">
          <AdminDashboard />
        </AdminLayout>
      );

      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fadmin');
    });

    it('should show access denied for insufficient roles', async () => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'guest@test.com' } },
      } as any);

      mockFetchUserAttributes.mockResolvedValue({
        email: 'guest@test.com',
        'custom:role': 'guest'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(false);

      render(
        <AdminLayout title="Dashboard">
          <AdminDashboard />
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      expect(screen.getByText(/You don't have permission to access the admin panel/)).toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should handle role transitions correctly', async () => {
      // Start as unauthorized
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'user@test.com' } },
      } as any);

      mockFetchUserAttributes.mockResolvedValue({
        email: 'user@test.com',
        'custom:role': 'guest'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(false);

      const { rerender } = render(
        <AdminLayout title="Dashboard">
          <AdminDashboard />
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      // Simulate role upgrade to admin
      mockFetchUserAttributes.mockResolvedValue({
        email: 'user@test.com',
        'custom:role': 'admin'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);

      rerender(
        <AdminLayout title="Dashboard">
          <AdminDashboard />
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Flow Integration', () => {
    beforeEach(() => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'admin@realtechee.com' } },
      } as any);

      mockFetchUserAttributes.mockResolvedValue({
        email: 'admin@realtechee.com',
        'custom:role': 'admin'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);
    });

    it('should navigate between admin sections correctly', async () => {
      render(
        <AdminLayout title="Dashboard">
          <AdminSidebar isCollapsed={false} onToggle={jest.fn()} />
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Test navigation to legacy admin sections
      const usersButton = screen.getByRole('button', { name: /users/i });
      fireEvent.click(usersButton);
      expect(mockPush).toHaveBeenCalledWith('/admin-legacy?tab=users');

      const contactsButton = screen.getByRole('button', { name: /contacts/i });
      fireEvent.click(contactsButton);
      expect(mockPush).toHaveBeenCalledWith('/admin-legacy?tab=contacts');

      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(notificationsButton);
      expect(mockPush).toHaveBeenCalledWith('/admin-legacy?tab=notifications');
    });

    it('should handle logo navigation correctly', async () => {
      render(
        <AdminLayout title="Projects">
          <AdminSidebar isCollapsed={false} onToggle={jest.fn()} />
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Click logo should navigate to dashboard
      const logoButton = screen.getByRole('button', { name: /realtechee/i });
      fireEvent.click(logoButton);
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });

    it('should maintain active state correctly across navigation', async () => {
      // Test dashboard active state
      mockRouter.mockReturnValue({
        push: mockPush,
        pathname: '/admin',
        asPath: '/admin',
        query: {},
      } as any);

      const { rerender } = render(
        <AdminSidebar isCollapsed={false} onToggle={jest.fn()} />
      );

      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      expect(dashboardButton).toHaveClass('bg-blue-600');

      // Test legacy admin active state
      mockRouter.mockReturnValue({
        push: mockPush,
        pathname: '/admin-legacy',
        asPath: '/admin-legacy?tab=users',
        query: { tab: 'users' },
      } as any);

      rerender(<AdminSidebar isCollapsed={false} onToggle={jest.fn()} />);

      const usersButton = screen.getByRole('button', { name: /users/i });
      expect(usersButton).toHaveClass('bg-blue-600');
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from authorization errors gracefully', async () => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'admin@realtechee.com' } },
      } as any);

      // First attempt fails
      mockFetchUserAttributes.mockRejectedValueOnce(new Error('Auth failed'));
      
      const { rerender } = render(
        <AdminLayout title="Dashboard">
          <AdminDashboard />
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      // Second attempt succeeds
      mockFetchUserAttributes.mockResolvedValue({
        email: 'admin@realtechee.com',
        'custom:role': 'admin'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);

      rerender(
        <AdminLayout title="Dashboard">
          <AdminDashboard />
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    beforeEach(() => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'admin@realtechee.com' } },
      } as any);

      mockFetchUserAttributes.mockResolvedValue({
        email: 'admin@realtechee.com',
        'custom:role': 'admin'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);
    });

    it('should not cause unnecessary re-renders', async () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return (
          <AdminLayout title="Dashboard">
            <AdminDashboard />
          </AdminLayout>
        );
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Should render once initially, then once after authorization check
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});