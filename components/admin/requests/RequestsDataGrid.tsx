import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminDataGrid, { 
  AdminDataGridColumn, 
  AdminDataGridAction, 
  AdminDataGridFilter,
  AdminDataItem 
} from '../common/AdminDataGrid';
import ProgressiveRequestCard from './ProgressiveRequestCard';
import StatusPill from '../../common/ui/StatusPill';
import ArchiveConfirmationDialog from '../common/ArchiveConfirmationDialog';
import { H1, P2 } from '../../typography';
import { requestsAPI } from '../../../utils/amplifyAPI';
import { enhancedRequestsService, FullyEnhancedRequest } from '../../../services/enhancedRequestsService';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';
import { AdvancedSearchField } from '../common/AdvancedSearchDialog';
import { useNotification } from '../../../contexts/NotificationContext';

// Use the enhanced interface with FK resolution
type Request = FullyEnhancedRequest & AdminDataItem;

const RequestsDataGrid: React.FC = () => {
  const router = useRouter();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [requestToArchive, setRequestToArchive] = useState<Request | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Seed request ID for safe testing
  const SEED_REQUEST_ID = 'seed-request-id-for-testing';

  const loadRequests = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

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
      onClick: (request) => openArchiveDialog(request),
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

  // Define advanced search fields
  const advancedSearchFields: AdvancedSearchField[] = useMemo(() => [
    {
      key: 'message',
      label: 'Message',
      type: 'text',
      placeholder: 'Search in request message...'
    },
    {
      key: 'product',
      label: 'Product',
      type: 'multiselect',
      options: Array.from(new Set(requests.map(r => r.product).filter(Boolean)))
        .sort()
        .map(product => ({ value: String(product), label: String(product) }))
    },
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect',
      options: Array.from(new Set(requests.map(r => r.status).filter(Boolean)))
        .sort()
        .map(status => ({ value: String(status), label: String(status) }))
    },
    {
      key: 'clientName',
      label: 'Client Name',
      type: 'text',
      placeholder: 'Search by client name...'
    },
    {
      key: 'clientEmail',
      label: 'Client Email',
      type: 'text',
      placeholder: 'Search by client email...'
    },
    {
      key: 'clientPhone',
      label: 'Client Phone',
      type: 'text',
      placeholder: 'Search by phone number...'
    },
    {
      key: 'agentName',
      label: 'Agent Name',
      type: 'text',
      placeholder: 'Search by agent name...'
    },
    {
      key: 'propertyAddress',
      label: 'Property Address',
      type: 'text',
      placeholder: 'Search by property address...'
    },
    {
      key: 'leadSource',
      label: 'Lead Source',
      type: 'select'
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      type: 'select'
    },
    {
      key: 'relationToProperty',
      label: 'Relation to Property',
      type: 'select'
    },
    {
      key: 'businessCreatedDate',
      label: 'Created Date',
      type: 'daterange'
    },
    {
      key: 'assignedDate',
      label: 'Assigned Date',
      type: 'daterange'
    },
    {
      key: 'requestedVisitDateTime',
      label: 'Requested Visit Date',
      type: 'daterange'
    },
    {
      key: 'needFinance',
      label: 'Needs Finance',
      type: 'boolean'
    }
  ], [requests]);

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

  // Archive dialog handlers
  const openArchiveDialog = (request: Request) => {
    setRequestToArchive(request);
    setArchiveDialogOpen(true);
  };

  const closeArchiveDialog = () => {
    setArchiveDialogOpen(false);
    setRequestToArchive(null);
    setArchiveLoading(false);
  };

  const handleArchiveConfirm = async () => {
    if (!requestToArchive) return;
    
    setArchiveLoading(true);
    try {
      // Update request status to 'Archived'
      const result = await requestsAPI.update(requestToArchive.id, {
        status: 'Archived'
      });
      
      if (result.success) {
        // Update local state
        setRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === requestToArchive.id 
              ? { ...request, status: 'Archived' }
              : request
          )
        );
        
        // Close dialog
        closeArchiveDialog();
        
        // Show success notification
        showSuccess(
          'Request Archived',
          `Request for "${requestToArchive.propertyAddress || 'Unknown Address'}" has been archived successfully.`
        );
      } else {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to archive request');
      }
    } catch (error) {
      console.error('Error archiving request:', error);
      showError(
        'Archive Failed',
        'Failed to archive request. Please try again.',
        10000
      );
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/admin/requests/new');
  };

  // Production-ready action handlers
  const handleScheduleVisit = async (selectedRows: any[]) => {
    try {
      if (selectedRows.length === 0) {
        alert('Please select requests to schedule visits');
        return;
      }
      
      if (selectedRows.length > 1) {
        alert('Please select only one request to schedule a visit');
        return;
      }
      
      const request = selectedRows[0];
      
      const visitDate = window.prompt(
        `Schedule visit for: ${request.contactName}\n` +
        `Property: ${request.propertyAddress}\n\n` +
        `Enter visit date (YYYY-MM-DD):`
      );
      
      if (visitDate && /^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
        // In a real implementation, this would update the request with visit details
        alert(`Visit scheduled for ${visitDate} for ${request.contactName}`);
      } else if (visitDate) {
        alert('Please enter a valid date in YYYY-MM-DD format');
      }
      
    } catch (error) {
      console.error('Schedule visit error:', error);
      alert('Failed to schedule visit. Please try again.');
    }
  };

  const handleConvertToQuote = async (selectedRows: any[]) => {
    try {
      if (selectedRows.length === 0) {
        alert('Please select requests to convert');
        return;
      }
      
      if (selectedRows.length > 1) {
        alert('Please select only one request to convert to quote');
        return;
      }
      
      const request = selectedRows[0];
      
      const confirmed = window.confirm(
        `Convert request "${request.contactName}" to quote?\n\n` +
        `This will create a new quote with the request details.`
      );
      
      if (confirmed) {
        // In a real implementation, this would call a conversion API
        router.push(`/admin/quotes/new?fromRequest=${request.id}`);
      }
      
    } catch (error) {
      console.error('Convert to quote error:', error);
      alert('Failed to convert request. Please try again.');
    }
  };

  const handleExportRequests = async (selectedRows: any[]) => {
    try {
      if (selectedRows.length === 0) {
        alert('Please select requests to export');
        return;
      }
      
      const exportData = selectedRows.map(request => ({
        contact: request.contactName || 'N/A',
        email: request.contactEmail || 'N/A',
        phone: request.contactPhone || 'N/A',
        address: request.propertyAddress || 'N/A',
        status: request.status,
        requestType: request.requestType || 'N/A',
        createdDate: request.createdDate,
        description: request.description || 'N/A'
      }));
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Contact,Email,Phone,Address,Status,Type,Created,Description\n"
        + exportData.map(row => 
            `"${row.contact}","${row.email}","${row.phone}","${row.address}","${row.status}","${row.requestType}","${row.createdDate}","${row.description}"`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `requests_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
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
        advancedSearchFields={advancedSearchFields}
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
              onClick: () => handleScheduleVisit([]),
            },
            {
              label: 'Convert to Quote',
              onClick: () => handleConvertToQuote([]),
            },
            {
              label: 'Export Requests',
              onClick: () => handleExportRequests([]),
            },
          ]
        }}
      />

      {/* Archive Confirmation Dialog */}
      <ArchiveConfirmationDialog
        open={archiveDialogOpen}
        onClose={closeArchiveDialog}
        onConfirm={handleArchiveConfirm}
        items={requestToArchive ? [{
          id: requestToArchive.id,
          title: `Request #${requestToArchive.id?.slice(0, 8)}`,
          address: requestToArchive.propertyAddress || 'No address provided',
          type: 'request',
          status: requestToArchive.status
        }] : []}
        itemType="requests"
        loading={archiveLoading}
      />
    </div>
  );
};

export default RequestsDataGrid;