import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { AuthorizationService } from '../../utils/authorizationHelpers';
import AdminLayout from '../../components/admin/AdminLayout';

// Mock modules
jest.mock('next/router');
jest.mock('@aws-amplify/ui-react');
jest.mock('aws-amplify/auth');
jest.mock('../../utils/authorizationHelpers');

const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuthenticator = useAuthenticator as jest.MockedFunction<typeof useAuthenticator>;
const mockFetchUserAttributes = fetchUserAttributes as jest.MockedFunction<typeof fetchUserAttributes>;
const mockAuthorizationService = AuthorizationService as jest.Mocked<typeof AuthorizationService>;

describe('AdminLayout Component', () => {
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

  describe('Authorization Tests', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockUseAuthenticator.mockReturnValue({
        user: null,
      } as any);

      render(
        <AdminLayout title="Test Admin">
          <div>Test Content</div>
        </AdminLayout>
      );

      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fadmin');
    });

    it('should show loading state during authorization check', () => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'test@realtechee.com' } },
      } as any);

      mockFetchUserAttributes.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <AdminLayout title="Test Admin">
          <div>Test Content</div>
        </AdminLayout>
      );

      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });

    it('should show access denied for unauthorized users', async () => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'test@realtechee.com' } },
      } as any);

      mockFetchUserAttributes.mockResolvedValue({
        email: 'test@realtechee.com',
        'custom:role': 'guest'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(false);

      render(
        <AdminLayout title="Test Admin">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      expect(screen.getByText(/You don't have permission to access the admin panel/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Return to Home' })).toBeInTheDocument();
    });

    it('should render admin layout for authorized users', async () => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'admin@realtechee.com' } },
      } as any);

      mockFetchUserAttributes.mockResolvedValue({
        email: 'admin@realtechee.com',
        'custom:role': 'admin'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);

      render(
        <AdminLayout title="Test Admin" description="Test Description">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
      });

      expect(screen.getByText('Logged in as: admin@realtechee.com (admin)')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Site' })).toBeInTheDocument();
    });
  });

  describe('Layout Structure Tests', () => {
    beforeEach(async () => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'admin@realtechee.com' } },
      } as any);

      mockFetchUserAttributes.mockResolvedValue({
        email: 'admin@realtechee.com',
        'custom:role': 'admin'
      });

      mockAuthorizationService.hasMinimumRole.mockResolvedValue(true);
    });

    it('should render sidebar component', async () => {
      render(
        <AdminLayout title="Test Admin">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });

    it('should render header with correct user information', async () => {
      render(
        <AdminLayout title="Dashboard" description="Admin Dashboard">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Logged in as: admin@realtechee.com (admin)')).toBeInTheDocument();
    });

    it('should render footer with admin panel info', async () => {
      render(
        <AdminLayout title="Test Admin">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('RealTechee Admin Panel - Phase 2 Implementation')).toBeInTheDocument();
      });
    });

    it('should set correct page title in document head', async () => {
      render(
        <AdminLayout title="Dashboard" description="Admin Dashboard">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(document.title).toBe('Dashboard | RealTechee');
      });
    });
  });

  describe('Error Handling Tests', () => {
    beforeEach(() => {
      mockUseAuthenticator.mockReturnValue({
        user: { signInDetails: { loginId: 'admin@realtechee.com' } },
      } as any);
    });

    it('should handle authorization check failure gracefully', async () => {
      mockFetchUserAttributes.mockRejectedValue(new Error('Auth failed'));

      render(
        <AdminLayout title="Test Admin">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should handle missing user attributes gracefully', async () => {
      mockFetchUserAttributes.mockResolvedValue({});
      mockAuthorizationService.hasMinimumRole.mockResolvedValue(false);

      render(
        <AdminLayout title="Test Admin">
          <div>Test Content</div>
        </AdminLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });
});