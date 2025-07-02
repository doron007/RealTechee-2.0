import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import AdminSidebar from '../../components/admin/AdminSidebar';

// Mock modules
jest.mock('next/router');
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('AdminSidebar Component', () => {
  const mockPush = jest.fn();
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockPush,
      pathname: '/admin',
      asPath: '/admin',
      query: {},
    } as any);
  });

  describe('Rendering Tests', () => {
    it('should render expanded sidebar by default', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Quotes')).toBeInTheDocument();
      expect(screen.getByText('Requests')).toBeInTheDocument();
    });

    it('should render collapsed sidebar when isCollapsed is true', () => {
      render(<AdminSidebar isCollapsed={true} onToggle={mockOnToggle} />);

      // Admin text should not be visible when collapsed
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      // But navigation items should still be present (just visually hidden)
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });

    it('should render logo with white background', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const logoContainer = screen.getByRole('button', { name: /realtechee/i });
      expect(logoContainer).toBeInTheDocument();
      
      const logoImg = screen.getByAltText('RealTechee');
      expect(logoImg).toBeInTheDocument();
    });
  });

  describe('Navigation Tests', () => {
    it('should navigate to dashboard when logo is clicked', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const logoButton = screen.getByRole('button', { name: /realtechee/i });
      fireEvent.click(logoButton);

      expect(mockPush).toHaveBeenCalledWith('/admin');
    });

    it('should navigate to implemented sections', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      // Dashboard should be clickable
      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      fireEvent.click(dashboardButton);
      expect(mockPush).toHaveBeenCalledWith('/admin');

      // Users should be clickable (legacy admin)
      const usersButton = screen.getByRole('button', { name: /users/i });
      fireEvent.click(usersButton);
      expect(mockPush).toHaveBeenCalledWith('/admin-legacy?tab=users');
    });

    it('should show alert for unimplemented sections', () => {
      // Mock window.alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      // Projects should show alert (not implemented yet)
      const projectsButton = screen.getByRole('button', { name: /projects/i });
      fireEvent.click(projectsButton);

      expect(mockAlert).toHaveBeenCalledWith('Projects management will be implemented in upcoming phases');
      expect(mockPush).not.toHaveBeenCalledWith('/admin/projects');

      mockAlert.mockRestore();
    });

    it('should handle active route highlighting correctly', () => {
      // Test dashboard active state
      mockRouter.mockReturnValue({
        push: mockPush,
        pathname: '/admin',
        asPath: '/admin',
        query: {},
      } as any);

      const { rerender } = render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      expect(dashboardButton).toHaveClass('bg-blue-600');

      // Test legacy admin active state
      mockRouter.mockReturnValue({
        push: mockPush,
        pathname: '/admin-legacy',
        asPath: '/admin-legacy?tab=users',
        query: { tab: 'users' },
      } as any);

      rerender(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const usersButton = screen.getByRole('button', { name: /users/i });
      expect(usersButton).toHaveClass('bg-blue-600');
    });
  });

  describe('Sidebar Toggle Tests', () => {
    it('should call onToggle when toggle button is clicked', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(toggleButton);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should show correct toggle button aria-label based on collapsed state', () => {
      const { rerender } = render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);
      
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();

      rerender(<AdminSidebar isCollapsed={true} onToggle={mockOnToggle} />);
      
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });
  });

  describe('Implementation Status Tests', () => {
    it('should show "Soon" badge for unimplemented features', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      // Projects, Quotes, Requests should show "Soon" badge
      expect(screen.getAllByText('Soon')).toHaveLength(3);
    });

    it('should disable buttons for unimplemented features', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const projectsButton = screen.getByRole('button', { name: /projects/i });
      const quotesButton = screen.getByRole('button', { name: /quotes/i });
      const requestsButton = screen.getByRole('button', { name: /requests/i });

      expect(projectsButton).toBeDisabled();
      expect(quotesButton).toBeDisabled();
      expect(requestsButton).toBeDisabled();
    });

    it('should enable buttons for implemented features', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      const usersButton = screen.getByRole('button', { name: /users/i });
      const contactsButton = screen.getByRole('button', { name: /contacts/i });

      expect(dashboardButton).not.toBeDisabled();
      expect(usersButton).not.toBeDisabled();
      expect(contactsButton).not.toBeDisabled();
    });
  });

  describe('Divider Tests', () => {
    it('should render divider between main sections and legacy sections', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      // Check for horizontal rule (divider)
      const dividers = screen.getAllByRole('separator');
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  describe('Footer Tests', () => {
    it('should render admin panel version in footer when expanded', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      expect(screen.getByText('Admin Panel v2.0')).toBeInTheDocument();
    });

    it('should not render footer text when collapsed', () => {
      render(<AdminSidebar isCollapsed={true} onToggle={mockOnToggle} />);

      expect(screen.queryByText('Admin Panel v2.0')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      // Navigation should have proper role
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Toggle button should have proper aria-label
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
      
      // Logo button should be accessible
      expect(screen.getByRole('button', { name: /realtechee/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<AdminSidebar isCollapsed={false} onToggle={mockOnToggle} />);

      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      
      // Focus should work
      dashboardButton.focus();
      expect(dashboardButton).toHaveFocus();

      // Enter key should trigger click
      fireEvent.keyDown(dashboardButton, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });
});