import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminDataGrid, { 
  AdminDataGridColumn, 
  AdminDataGridAction, 
  AdminDataGridFilter,
  AdminDataItem 
} from '../common/AdminDataGrid';
import ProgressiveRequestCard from './ProgressiveRequestCard';
import StatusPill from '../../common/ui/StatusPill';
import { H1, P2 } from '../../typography';
import { requestsAPI } from '../../../utils/amplifyAPI';
import { enhancedRequestsService, FullyEnhancedRequest } from '../../../services/enhancedRequestsService';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';

// Use the enhanced interface with FK resolution
type Request = FullyEnhancedRequest & AdminDataItem;

const RequestsDataGrid: React.FC = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Seed request ID for safe testing
  const SEED_REQUEST_ID = 'seed-request-id-for-testing';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Try enhanced service first, fallback to mock data
      try {
        const result = await enhancedRequestsService.getFullyEnhancedRequests();
        
        if (result.success && result.data && result.data.length > 0) {
          console.log('Loaded enhanced requests:', result.data.length, 'Total');
          console.log('Archived requests:', result.data.filter((r: any) => r.status === 'Archived').length);
          console.log('Sample enhanced request:', result.data[0] ? {
            id: result.data[0].id,
            propertyAddress: result.data[0].propertyAddress,
            clientName: result.data[0].clientName,
            agentName: result.data[0].agentName,
            brokerage: result.data[0].brokerage
          } : 'No requests');
          setRequests(result.data);
          return;
        }
      } catch (apiErr) {
        console.log('Enhanced API call failed, using mock data:', apiErr);
      }
      
      // Use mock data with archived items for testing
      await loadRequests_old();
      
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on archived status
  const filteredRequests = requests.filter(request => {
    if (showArchived) {
      return request.status === 'Archived';
    } else {
      return request.status !== 'Archived';
    }
  });

  const loadRequests_old = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Mock data for testing - includes active and archived items
      const mockRequests: Request[] = [
        {
          id: SEED_REQUEST_ID,
          status: 'New',
          product: 'Booster',
          message: 'Looking to boost property value before listing',
          relationToProperty: 'Owner',
          needFinance: true,
          budget: '$50,000-$100,000',
          clientName: 'John Smith',
          clientEmail: 'john.smith@example.com',
          clientPhone: '(555) 123-4567',
          agentName: 'Sarah Wilson',
          propertyAddress: '123 Main Street, Los Angeles, CA 90210',
          leadSource: 'Website',
          assignedTo: 'Team Lead',
          assignedDate: '2024-01-15T10:00:00Z',
          requestedVisitDateTime: '2024-01-20T14:00:00Z',
          createdAt: '2024-01-15T09:30:00Z',
          businessCreatedDate: '2024-01-15T09:30:00Z',
          officeNotes: 'High priority lead - referred by top agent',
        },
        {
          id: 'req-archived-001',
          status: 'Archived',
          product: 'Kitchen Remodel',
          message: 'Complete kitchen renovation project',
          relationToProperty: 'Owner',
          needFinance: false,
          budget: '$30,000-$50,000',
          clientName: 'Jane Doe',
          clientEmail: 'jane.doe@example.com',
          clientPhone: '(555) 987-6543',
          agentName: 'Mike Johnson',
          propertyAddress: '456 Oak Avenue, San Francisco, CA 94102',
          leadSource: 'Referral',
          assignedTo: 'Design Team',
          assignedDate: '2024-01-10T14:00:00Z',
          createdAt: '2024-01-10T09:00:00Z',
          businessCreatedDate: '2024-01-10T09:00:00Z',
          officeNotes: 'Project completed and archived',
        },
        {
          id: 'req-active-002',
          status: 'In Review',
          product: 'Bathroom Remodel',
          message: 'Master bathroom renovation needed',
          relationToProperty: 'Owner',
          needFinance: true,
          budget: '$20,000-$35,000',
          clientName: 'Robert Wilson',
          clientEmail: 'robert.wilson@example.com',
          clientPhone: '(555) 456-7890',
          agentName: 'Lisa Chen',
          propertyAddress: '789 Pine Street, Seattle, WA 98101',
          leadSource: 'Website',
          assignedTo: 'Project Manager',
          assignedDate: '2024-01-20T11:30:00Z',
          createdAt: '2024-01-20T10:15:00Z',
          businessCreatedDate: '2024-01-20T10:15:00Z',
          officeNotes: 'Urgent project - client relocating soon',
        }
      ];
      
      setRequests(mockRequests);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  // Removed getStatusColor - now using StatusPill component

  // Define table columns - following required order: Status, Address, Created, Owner, Agent, Brokerage, Opportunity
  const columns: AdminDataGridColumn<Request>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      enableSorting: true,
      enableHiding: false, // Always show status
      Cell: ({ cell }) => {
        const status = cell.getValue() as string;
        return (
          <div className="mb-2">
            <StatusPill status={status} />
          </div>
        );
      },
    },
    {
      accessorFn: (row) => row.propertyAddress || 'No address provided',
      id: 'address',
      header: 'Address',
      size: 200,
      enableSorting: true,
      enableHiding: false, // Always show address (primary info)
      Cell: ({ cell }) => (
        <div title={cell.getValue() as string}>
          <P2 className="max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg break-words">
            {cell.getValue() as string}
          </P2>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.businessCreatedDate || row.createdAt,
      id: 'created',
      header: 'Created',
      size: 120,
      enableHiding: true, // Can hide on mobile
      Cell: ({ cell }) => (
        <P2>{formatDateShort(cell.getValue() as string)}</P2>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'Owner',
      size: 130,
      enableHiding: true, // Can hide on mobile
      Cell: ({ cell }) => (
        <div title={cell.getValue() as string || 'N/A'}>
          <P2 className="max-w-xs truncate">
            {cell.getValue() as string || 'N/A'}
          </P2>
        </div>
      ),
    },
    {
      accessorKey: 'agentName',
      header: 'Agent',
      size: 130,
      enableHiding: true, // Can hide on mobile
      Cell: ({ cell }) => (
        <div title={cell.getValue() as string || 'N/A'}>
          <P2 className="max-w-xs truncate">
            {cell.getValue() as string || 'N/A'}
          </P2>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.brokerage || 'N/A',
      id: 'brokerage',
      header: 'Brokerage',
      size: 140,
      enableHiding: true, // Can hide on mobile
      Cell: ({ cell }) => (
        <div title={cell.getValue() as string}>
          <P2 className="max-w-xs truncate">
            {cell.getValue() as string}
          </P2>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.budget,
      id: 'opportunity',
      header: 'Opportunity',
      size: 110,
      enableHiding: true, // Can hide on mobile
      Cell: ({ cell }) => (
        <P2>{cell.getValue() as string || 'N/A'}</P2>
      ),
    },
  ];

  // Define actions - workflow-based actions
  const actions: AdminDataGridAction<Request>[] = [
    {
      label: 'Edit',
      icon: '/assets/icons/ic-edit.svg',
      onClick: (request) => router.push(`/admin/requests/${request.id}`),
      tooltip: 'Edit Request',
    },
    {
      label: 'Create Quote',
      icon: '/assets/icons/ic-newpage.svg',
      onClick: (request) => handleCreateQuote(request.id),
      tooltip: 'Create Quote from Request',
      variant: 'primary',
    },
    {
      label: 'View Quotes',
      onClick: (request) => handleViewQuotes(request.id),
      tooltip: 'View Related Quotes',
      variant: 'secondary',
    },
    {
      label: 'Archive',
      icon: '/assets/icons/ic-delete.svg',
      onClick: (request) => handleArchiveRequest(request.id),
      tooltip: 'Archive Request',
      variant: 'tertiary',
    },
  ];

  // Define filters - dynamic based on actual data
  const filters: AdminDataGridFilter[] = useMemo(() => {
    // Get unique values from filtered data
    const uniqueStatuses = Array.from(new Set(filteredRequests.map(r => r.status).filter(Boolean))).sort() as string[];
    const uniqueProducts = Array.from(new Set(filteredRequests.map(r => r.product).filter(Boolean))).sort() as string[];
    const uniqueLeadSources = Array.from(new Set(filteredRequests.map(r => r.leadSource).filter(Boolean))).sort() as string[];
    const uniqueAssignees = Array.from(new Set(filteredRequests.map(r => r.assignedTo).filter(Boolean))).sort() as string[];
    
    return [
      {
        field: 'status',
        label: 'Status',
        options: [
          { value: '', label: 'All Statuses' },
          ...uniqueStatuses.map(status => ({ value: status, label: status }))
        ],
      },
      {
        field: 'product',
        label: 'Product',
        options: [
          { value: '', label: 'All Products' },
          ...uniqueProducts.map(product => ({ value: product, label: product }))
        ],
      },
      {
        field: 'leadSource',
        label: 'Lead Source',
        options: [
          { value: '', label: 'All Sources' },
          ...uniqueLeadSources.map(source => ({ value: source, label: source }))
        ],
      },
      {
        field: 'assignedTo',
        label: 'Assigned To',
        options: [
          { value: '', label: 'All Assignees' },
          ...uniqueAssignees.map(assignee => ({ value: assignee, label: assignee }))
        ],
      },
    ];
  }, [filteredRequests]);

  // Action handlers - workflow-based
  const handleCreateQuote = async (requestId: string) => {
    try {
      const confirmed = confirm('Create a new quote from this request?');
      if (!confirmed) return;
      
      // Navigate to create quote page with request ID
      router.push(`/admin/quotes/new?requestId=${requestId}`);
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Failed to create quote');
    }
  };

  const handleViewQuotes = async (requestId: string) => {
    try {
      // Navigate to quotes page filtered by this request
      router.push(`/admin/quotes?requestId=${requestId}`);
    } catch (error) {
      console.error('Error viewing quotes:', error);
      alert('Failed to view quotes');
    }
  };

  const handleArchiveRequest = async (requestId: string) => {
    try {
      const confirmed = confirm('Archive this request?');
      if (!confirmed) return;
      
      // Implementation would depend on your API
      console.log('Archiving request:', requestId);
      alert('Request archived successfully! (Feature in development)');
    } catch (error) {
      console.error('Error archiving request:', error);
      alert('Failed to archive request');
    }
  };

  const handleCreateNew = () => {
    alert('Create new request will be implemented in future phase');
  };


  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">

      {/* Aggregation Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>📋 Total: {requests.length}</span>
          <span>🏃 Active: {requests.filter(r => r.status !== 'Archived').length}</span>
          <span>📁 Archived: {requests.filter(r => r.status === 'Archived').length}</span>
        </div>
      </div>

      <AdminDataGrid
        title="Requests"
        subtitle={showArchived ? "View archived requests" : "Manage service requests and inquiries"}
        data={filteredRequests}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        onRefresh={loadRequests}
        createButtonLabel="New Request"
        onCreateNew={handleCreateNew}
        searchFields={['message', 'clientName', 'clientEmail', 'agentName', 'status', 'product']}
        filters={filters}
        defaultSortField="created"
        defaultSortDirection="desc"
        itemDisplayName="requests"
        formatDate={formatDateShort}
        cardComponent={ProgressiveRequestCard}
        showArchiveToggle={true}
        showArchived={showArchived}
        onArchiveToggle={setShowArchived}
        allData={requests}
        customActions={{
          label: 'Request Actions',
          items: [
            {
              label: 'Schedule Visit',
              onClick: () => alert('Schedule Visit functionality will be implemented'),
            },
            {
              label: 'Convert to Quote',
              onClick: () => alert('Convert to Quote functionality will be implemented'),
            },
            {
              label: 'Export Requests',
              onClick: () => alert('Export Requests functionality will be implemented'),
            },
          ]
        }}
      />
    </div>
  );
};

export default RequestsDataGrid;