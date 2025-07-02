import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { generateClient } from 'aws-amplify/api';
import AdminDashboard from '../../components/admin/AdminDashboard';

// Mock modules
jest.mock('aws-amplify/api');
jest.mock('../../utils/amplifyAPI', () => ({
  projectsAPI: {
    getAllProjects: jest.fn(),
  },
  quotesAPI: {
    getAllQuotes: jest.fn(),
  },
  requestsAPI: {
    getAllRequests: jest.fn(),
  },
  contactsAPI: {
    getAllContacts: jest.fn(),
  },
}));

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;

// Import mocked APIs
import { projectsAPI, quotesAPI, requestsAPI, contactsAPI } from '../../utils/amplifyAPI';

const mockProjectsAPI = projectsAPI as jest.Mocked<typeof projectsAPI>;
const mockQuotesAPI = quotesAPI as jest.Mocked<typeof quotesAPI>;
const mockRequestsAPI = requestsAPI as jest.Mocked<typeof requestsAPI>;
const mockContactsAPI = contactsAPI as jest.Mocked<typeof contactsAPI>;

describe('AdminDashboard Component', () => {
  const mockGraphql = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateClient.mockReturnValue({
      graphql: mockGraphql,
    } as any);
  });

  describe('Loading State Tests', () => {
    it('should show loading state initially', () => {
      // Mock APIs to never resolve (simulate loading)
      mockProjectsAPI.getAllProjects.mockImplementation(() => new Promise(() => {}));
      mockQuotesAPI.getAllQuotes.mockImplementation(() => new Promise(() => {}));
      mockRequestsAPI.getAllRequests.mockImplementation(() => new Promise(() => {}));
      mockContactsAPI.getAllContacts.mockImplementation(() => new Promise(() => {}));

      render(<AdminDashboard />);

      // Should show loading indicators
      expect(screen.getAllByText('Loading...')).toHaveLength(4);
    });
  });

  describe('Data Loading Tests', () => {
    const mockProjectsData = [
      { id: '1', title: 'Project 1', status: 'active' },
      { id: '2', title: 'Project 2', status: 'completed' },
      { id: '3', title: 'Project 3', status: 'pending' },
    ];

    const mockQuotesData = [
      { id: '1', title: 'Quote 1', status: 'pending' },
      { id: '2', title: 'Quote 2', status: 'approved' },
    ];

    const mockRequestsData = [
      { id: '1', title: 'Request 1', status: 'open' },
      { id: '2', title: 'Request 2', status: 'in_progress' },
      { id: '3', title: 'Request 3', status: 'completed' },
      { id: '4', title: 'Request 4', status: 'open' },
    ];

    const mockContactsData = [
      { id: '1', email: 'contact1@test.com', role: 'agent' },
      { id: '2', email: 'contact2@test.com', role: 'homeowner' },
      { id: '3', email: 'contact3@test.com', role: 'provider' },
    ];

    beforeEach(() => {
      mockProjectsAPI.getAllProjects.mockResolvedValue(mockProjectsData);
      mockQuotesAPI.getAllQuotes.mockResolvedValue(mockQuotesData);
      mockRequestsAPI.getAllRequests.mockResolvedValue(mockRequestsData);
      mockContactsAPI.getAllContacts.mockResolvedValue(mockContactsData);
    });

    it('should display correct project statistics', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total projects
      });

      expect(screen.getByText('Total Projects')).toBeInTheDocument();
    });

    it('should display correct quote statistics', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total quotes
      });

      expect(screen.getByText('Total Quotes')).toBeInTheDocument();
    });

    it('should display correct request statistics', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument(); // Total requests
      });

      expect(screen.getByText('Total Requests')).toBeInTheDocument();
    });

    it('should display correct contact statistics', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total contacts
      });

      expect(screen.getByText('Total Contacts')).toBeInTheDocument();
    });

    it('should display backoffice status integration info', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/BackOffice.*Integration/)).toBeInTheDocument();
      });

      expect(screen.getByText(/BackOfficeProjectStatuses/)).toBeInTheDocument();
      expect(screen.getByText(/BackOfficeQuoteStatuses/)).toBeInTheDocument();
      expect(screen.getByText(/BackOfficeRequestStatuses/)).toBeInTheDocument();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockProjectsAPI.getAllProjects.mockRejectedValue(new Error('Projects API failed'));
      mockQuotesAPI.getAllQuotes.mockRejectedValue(new Error('Quotes API failed'));
      mockRequestsAPI.getAllRequests.mockRejectedValue(new Error('Requests API failed'));
      mockContactsAPI.getAllContacts.mockRejectedValue(new Error('Contacts API failed'));

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 for failed loads
      });

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      consoleSpy.mockRestore();
    });

    it('should handle missing data gracefully', async () => {
      mockProjectsAPI.getAllProjects.mockResolvedValue([]);
      mockQuotesAPI.getAllQuotes.mockResolvedValue([]);
      mockRequestsAPI.getAllRequests.mockResolvedValue([]);
      mockContactsAPI.getAllContacts.mockResolvedValue([]);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText('0')).toHaveLength(4);
      });

      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('Total Quotes')).toBeInTheDocument();
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('Total Contacts')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates Tests', () => {
    it('should refresh data when component mounts', async () => {
      mockProjectsAPI.getAllProjects.mockResolvedValue([]);
      mockQuotesAPI.getAllQuotes.mockResolvedValue([]);
      mockRequestsAPI.getAllRequests.mockResolvedValue([]);
      mockContactsAPI.getAllContacts.mockResolvedValue([]);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(mockProjectsAPI.getAllProjects).toHaveBeenCalledTimes(1);
        expect(mockQuotesAPI.getAllQuotes).toHaveBeenCalledTimes(1);
        expect(mockRequestsAPI.getAllRequests).toHaveBeenCalledTimes(1);
        expect(mockContactsAPI.getAllContacts).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('BackOffice Integration Tests', () => {
    it('should mention BackOffice status tables integration', async () => {
      mockProjectsAPI.getAllProjects.mockResolvedValue([]);
      mockQuotesAPI.getAllQuotes.mockResolvedValue([]);
      mockRequestsAPI.getAllRequests.mockResolvedValue([]);
      mockContactsAPI.getAllContacts.mockResolvedValue([]);

      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/BackOfficeProjectStatuses/)).toBeInTheDocument();
      });

      expect(screen.getByText(/BackOfficeQuoteStatuses/)).toBeInTheDocument();
      expect(screen.getByText(/BackOfficeRequestStatuses/)).toBeInTheDocument();
    });
  });

  describe('Dashboard Cards Tests', () => {
    beforeEach(() => {
      mockProjectsAPI.getAllProjects.mockResolvedValue([
        { id: '1', title: 'Project 1', status: 'active' }
      ]);
      mockQuotesAPI.getAllQuotes.mockResolvedValue([
        { id: '1', title: 'Quote 1', status: 'pending' }
      ]);
      mockRequestsAPI.getAllRequests.mockResolvedValue([
        { id: '1', title: 'Request 1', status: 'open' }
      ]);
      mockContactsAPI.getAllContacts.mockResolvedValue([
        { id: '1', email: 'test@test.com', role: 'agent' }
      ]);
    });

    it('should render all dashboard cards', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        // Should have 4 main cards
        expect(screen.getByText('Total Projects')).toBeInTheDocument();
        expect(screen.getByText('Total Quotes')).toBeInTheDocument();
        expect(screen.getByText('Total Requests')).toBeInTheDocument();
        expect(screen.getByText('Total Contacts')).toBeInTheDocument();
      });
    });

    it('should have proper card styling and layout', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        const projectsCard = screen.getByText('Total Projects').closest('div');
        expect(projectsCard).toHaveClass('bg-white');
      });
    });
  });

  describe('Accessibility Tests', () => {
    beforeEach(() => {
      mockProjectsAPI.getAllProjects.mockResolvedValue([]);
      mockQuotesAPI.getAllQuotes.mockResolvedValue([]);
      mockRequestsAPI.getAllRequests.mockResolvedValue([]);
      mockContactsAPI.getAllContacts.mockResolvedValue([]);
    });

    it('should have proper heading hierarchy', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      });
    });

    it('should have descriptive text for screen readers', async () => {
      render(<AdminDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Projects')).toBeInTheDocument();
        expect(screen.getByText('Total Quotes')).toBeInTheDocument();
        expect(screen.getByText('Total Requests')).toBeInTheDocument();
        expect(screen.getByText('Total Contacts')).toBeInTheDocument();
      });
    });
  });
});