import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { AuthorizationService } from '../../utils/authorizationHelpers';
import Header from '../../components/common/layout/Header';

// Mock modules
jest.mock('next/router');
jest.mock('../../utils/authorizationHelpers');
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockAuthorizationService = AuthorizationService as jest.Mocked<typeof AuthorizationService>;

describe('Header Component - Admin Integration', () => {
  const mockPush = jest.fn();
  const mockOnSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockPush,
      pathname: '/',
      asPath: '/',
      query: {},
    } as any);
  });

  describe('Admin Panel Access Tests', () => {
    const mockAdminUser = {
      signInDetails: { loginId: 'admin@realtechee.com' },
      username: 'admin@realtechee.com',
      attributes: { 'custom:role': 'admin' }
    };

    const mockRegularUser = {
      signInDetails: { loginId: 'user@test.com' },
      username: 'user@test.com',
      attributes: { 'custom:role': 'guest' }
    };

    it('should show admin panel link for admin users in desktop menu', async () => {
      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);

      render(
        <Header 
          userLoggedIn={true} 
          user={mockAdminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      // Click profile dropdown to open it
      const profileButton = screen.getByRole('button', { name: /admin/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('🛡️ Admin Panel')).toBeInTheDocument();
      });

      const adminLink = screen.getByText('🛡️ Admin Panel');
      expect(adminLink).toHaveClass('text-blue-700');
      expect(adminLink.closest('a')).toHaveAttribute('href', '/admin');
    });

    it('should show admin panel link for admin users in mobile menu', async () => {
      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);

      render(
        <Header 
          userLoggedIn={true} 
          user={mockAdminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      // Open mobile menu
      const mobileMenuButton = screen.getByLabelText('Open menu');
      fireEvent.click(mobileMenuButton);

      await waitFor(() => {
        expect(screen.getByText('🛡️ Admin Panel')).toBeInTheDocument();
      });

      const adminLink = screen.getByText('🛡️ Admin Panel');
      expect(adminLink).toHaveClass('text-blue-600');
      expect(adminLink.closest('a')).toHaveAttribute('href', '/admin');
    });

    it('should not show admin panel link for regular users', async () => {
      mockAuthorizationService.hasMinimumRole.mockResolvedValue(false);

      render(
        <Header 
          userLoggedIn={true} 
          user={mockRegularUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      // Click profile dropdown
      const profileButton = screen.getByRole('button', { name: /user/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      expect(screen.queryByText('🛡️ Admin Panel')).not.toBeInTheDocument();
    });

    it('should not show admin panel link when user is not logged in', async () => {
      render(
        <Header 
          userLoggedIn={false} 
          user={null} 
          onSignOut={mockOnSignOut} 
        />
      );

      expect(screen.queryByText('🛡️ Admin Panel')).not.toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('should handle authorization check failures gracefully', async () => {
      mockAuthorizationService.hasMinimumRole.mockRejectedValue(new Error('Auth failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Header 
          userLoggedIn={true} 
          user={mockAdminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      // Click profile dropdown
      const profileButton = screen.getByRole('button', { name: /admin/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      // Should not show admin panel link when auth check fails
      expect(screen.queryByText('🛡️ Admin Panel')).not.toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should navigate to admin panel when admin link is clicked', async () => {
      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);

      render(
        <Header 
          userLoggedIn={true} 
          user={mockAdminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      // Open desktop profile dropdown
      const profileButton = screen.getByRole('button', { name: /admin/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('🛡️ Admin Panel')).toBeInTheDocument();
      });

      // Click admin panel link
      const adminLink = screen.getByText('🛡️ Admin Panel');
      fireEvent.click(adminLink);

      // Should close dropdown and navigate
      expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    });

    it('should close mobile menu when admin link is clicked', async () => {
      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);

      render(
        <Header 
          userLoggedIn={true} 
          user={mockAdminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      // Open mobile menu
      const mobileMenuButton = screen.getByLabelText('Open menu');
      fireEvent.click(mobileMenuButton);

      await waitFor(() => {
        expect(screen.getByText('🛡️ Admin Panel')).toBeInTheDocument();
      });

      // Click admin panel link
      const adminLink = screen.getByText('🛡️ Admin Panel');
      fireEvent.click(adminLink);

      // Mobile menu should close
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });
  });

  describe('Role-based Access Tests', () => {
    it('should show admin panel for super_admin users', async () => {
      const superAdminUser = {
        signInDetails: { loginId: 'superadmin@realtechee.com' },
        username: 'superadmin@realtechee.com',
        attributes: { 'custom:role': 'super_admin' }
      };

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);

      render(
        <Header 
          userLoggedIn={true} 
          user={superAdminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      const profileButton = screen.getByRole('button', { name: /superadmin/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('🛡️ Admin Panel')).toBeInTheDocument();
      });
    });

    it('should not show admin panel for guest users', async () => {
      const guestUser = {
        signInDetails: { loginId: 'guest@test.com' },
        username: 'guest@test.com',
        attributes: { 'custom:role': 'guest' }
      };

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(false);

      render(
        <Header 
          userLoggedIn={true} 
          user={guestUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      const profileButton = screen.getByRole('button', { name: /guest/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      expect(screen.queryByText('🛡️ Admin Panel')).not.toBeInTheDocument();
    });

    it('should not show admin panel for agent users', async () => {
      const agentUser = {
        signInDetails: { loginId: 'agent@realty.com' },
        username: 'agent@realty.com',
        attributes: { 'custom:role': 'agent' }
      };

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(false);

      render(
        <Header 
          userLoggedIn={true} 
          user={agentUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      const profileButton = screen.getByRole('button', { name: /agent/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });

      expect(screen.queryByText('🛡️ Admin Panel')).not.toBeInTheDocument();
    });
  });

  describe('Admin Panel Link Styling Tests', () => {
    beforeEach(() => {
      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);
    });

    it('should have distinctive styling in desktop menu', async () => {
      const adminUser = {
        signInDetails: { loginId: 'admin@realtechee.com' },
        username: 'admin@realtechee.com',
        attributes: { 'custom:role': 'admin' }
      };

      render(
        <Header 
          userLoggedIn={true} 
          user={adminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      const profileButton = screen.getByRole('button', { name: /admin/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        expect(screen.getByText('🛡️ Admin Panel')).toBeInTheDocument();
      });

      const adminLink = screen.getByText('🛡️ Admin Panel');
      expect(adminLink).toHaveClass('text-blue-700', 'bg-blue-50', 'border-blue-500');
    });

    it('should have distinctive styling in mobile menu', async () => {
      const adminUser = {
        signInDetails: { loginId: 'admin@realtechee.com' },
        username: 'admin@realtechee.com',
        attributes: { 'custom:role': 'admin' }
      };

      render(
        <Header 
          userLoggedIn={true} 
          user={adminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      const mobileMenuButton = screen.getByLabelText('Open menu');
      fireEvent.click(mobileMenuButton);

      await waitFor(() => {
        expect(screen.getByText('🛡️ Admin Panel')).toBeInTheDocument();
      });

      const adminLink = screen.getByText('🛡️ Admin Panel');
      expect(adminLink).toHaveClass('text-blue-600', 'bg-blue-50', 'border-blue-500');
    });

    it('should include shield emoji for visual identification', async () => {
      const adminUser = {
        signInDetails: { loginId: 'admin@realtechee.com' },
        username: 'admin@realtechee.com',
        attributes: { 'custom:role': 'admin' }
      };

      render(
        <Header 
          userLoggedIn={true} 
          user={adminUser} 
          onSignOut={mockOnSignOut} 
        />
      );

      const profileButton = screen.getByRole('button', { name: /admin/i });
      fireEvent.click(profileButton);

      await waitFor(() => {
        const adminLink = screen.getByText('🛡️ Admin Panel');
        expect(adminLink.textContent).toContain('🛡️');
      });
    });
  });
});