import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminDataGrid, { 
  AdminDataGridColumn, 
  AdminDataGridAction, 
  AdminDataGridFilter,
  AdminDataItem 
} from '../common/AdminDataGrid';
import AdminCard, { AdminCardGroup, AdminCardField, AdminCardAction } from '../common/AdminCard';
import StatusPill from '../../common/ui/StatusPill';
import { H1, P2 } from '../../typography';
import { requestsAPI } from '../../../utils/amplifyAPI';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';

interface Request extends AdminDataItem {
  id: string;
  status: string;
  product?: string;
  message?: string;
  relationToProperty?: string;
  needFinance?: boolean;
  budget?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  agentName?: string;
  propertyAddress?: string;
  leadSource?: string;
  assignedTo?: string;
  assignedDate?: string;
  requestedVisitDateTime?: string;
  visitDate?: string;
  moveToQuotingDate?: string;
  expiredDate?: string;
  archivedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
  officeNotes?: string;
  archived?: string;
  visitorId?: string;
  bookingId?: string;
  requestedSlot?: string;
  uploadedMedia?: string;
  uplodedDocuments?: string; // Note: typo in schema
  uploadedVideos?: string;
  virtualWalkthrough?: string;
  rtDigitalSelection?: string;
  leadFromSync?: string;
  leadFromVenturaStone?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
}

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
      // Try API first, fallback to mock data
      try {
        const result = await requestsAPI.list();
        
        if (result.success && result.data && result.data.length > 0) {
          console.log('Loaded requests:', result.data.length, 'Total');
          console.log('Archived requests:', result.data.filter((r: any) => r.status === 'Archived').length);
          setRequests(result.data);
          return;
        }
      } catch (apiErr) {
        console.log('API call failed, using mock data:', apiErr);
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

  // Define actions
  const actions: AdminDataGridAction<Request>[] = [
    {
      label: 'View',
      icon: '/assets/icons/ic-newpage.svg',
      onClick: (request) => router.push(`/admin/requests/${request.id}`),
      tooltip: 'View Request Details',
    },
    {
      label: 'Edit',
      icon: '/assets/icons/ic-edit.svg',
      onClick: (request) => router.push(`/admin/requests/${request.id}/edit`),
      tooltip: 'Edit Request',
    },
    {
      label: 'Convert to Quote',
      onClick: (request) => handleConvertToQuote(request.id),
      tooltip: 'Convert Request to Quote',
      variant: 'primary',
    },
    {
      label: 'Schedule Visit',
      onClick: (request) => handleScheduleVisit(request.id),
      tooltip: 'Schedule Site Visit',
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

  // Action handlers
  const handleConvertToQuote = async (requestId: string) => {
    if (requestId !== SEED_REQUEST_ID) {
      alert('For safety, operations are only allowed on the seed request during testing');
      return;
    }

    const confirmed = confirm('Convert this request to a quote?');
    if (!confirmed) return;

    alert('Request converted to quote successfully! (Simulated action)');
  };

  const handleScheduleVisit = async (requestId: string) => {
    if (requestId !== SEED_REQUEST_ID) {
      alert('For safety, operations are only allowed on the seed request during testing');
      return;
    }

    alert('Visit scheduling interface will be implemented in future phase');
  };

  const handleArchiveRequest = async (requestId: string) => {
    if (requestId !== SEED_REQUEST_ID) {
      alert('For safety, operations are only allowed on the seed request during testing');
      return;
    }

    const confirmed = confirm('Archive this request?');
    if (!confirmed) return;

    alert('Request archived successfully! (Simulated action)');
  };

  const handleCreateNew = () => {
    alert('Create new request will be implemented in future phase');
  };

  // Define card groups for detailed view with actual request data
  const getCardGroups = (request: Request): AdminCardGroup[] => [
    {
      title: 'Request Information',
      icon: '📋',
      color: 'bg-blue-50 hover:bg-blue-100',
      fields: [
        { key: 'message', label: 'Message', type: 'text', priority: 'high', value: request.message || 'No message provided' },
        { key: 'product', label: 'Product', type: 'text', priority: 'high', value: request.product || 'N/A' },
        { key: 'relationToProperty', label: 'Relation to Property', type: 'text', priority: 'high', value: request.relationToProperty || 'N/A' },
        { key: 'budget', label: 'Budget', type: 'text', priority: 'high', value: request.budget || 'N/A' },
        { 
          key: 'needFinance', 
          label: 'Needs Financing', 
          type: 'custom',
          render: (value) => value ? 'Yes' : 'No',
          priority: 'medium',
          value: request.needFinance
        },
      ],
    },
    {
      title: 'Client Information',
      icon: '👤',
      color: 'bg-green-50 hover:bg-green-100',
      fields: [
        { key: 'clientName', label: 'Client Name', type: 'text', priority: 'high', value: request.clientName || 'N/A' },
        { key: 'clientEmail', label: 'Client Email', type: 'text', priority: 'high', value: request.clientEmail || 'N/A' },
        { key: 'clientPhone', label: 'Client Phone', type: 'text', priority: 'high', value: request.clientPhone || 'N/A' },
        { key: 'agentName', label: 'Agent', type: 'text', priority: 'high', value: request.agentName || 'N/A' },
        { key: 'propertyAddress', label: 'Property Address', type: 'text', priority: 'high', value: request.propertyAddress || 'N/A' },
      ],
    },
    {
      title: 'Lead Tracking',
      icon: '📈',
      color: 'bg-yellow-50 hover:bg-yellow-100',
      fields: [
        { key: 'leadSource', label: 'Lead Source', type: 'text', priority: 'high', value: request.leadSource || 'N/A' },
        { key: 'leadFromSync', label: 'Sync Reference', type: 'text', priority: 'low', value: request.leadFromSync || 'N/A' },
        { key: 'leadFromVenturaStone', label: 'Partner Reference', type: 'text', priority: 'low', value: request.leadFromVenturaStone || 'N/A' },
        { key: 'visitorId', label: 'Visitor ID', type: 'text', priority: 'low', value: request.visitorId || 'N/A' },
      ],
    },
    {
      title: 'Assignment & Timeline',
      icon: '📅',
      color: 'bg-purple-50 hover:bg-purple-100',
      fields: [
        { key: 'assignedTo', label: 'Assigned To', type: 'text', priority: 'high', value: request.assignedTo || 'Unassigned' },
        { key: 'assignedDate', label: 'Assigned Date', type: 'date', priority: 'medium', value: request.assignedDate || 'Not assigned' },
        { key: 'requestedVisitDateTime', label: 'Requested Visit', type: 'date', priority: 'high', value: request.requestedVisitDateTime || 'Not requested' },
        { key: 'visitDate', label: 'Actual Visit Date', type: 'date', priority: 'high', value: request.visitDate || 'Not visited' },
        { key: 'moveToQuotingDate', label: 'Moved to Quoting', type: 'date', priority: 'medium', value: request.moveToQuotingDate || 'Not moved' },
      ],
    },
    {
      title: 'Media & Documents',
      icon: '📎',
      color: 'bg-emerald-50 hover:bg-emerald-100',
      fields: [
        { 
          key: 'uploadedMedia', 
          label: 'Uploaded Media', 
          type: 'custom',
          render: (value) => value ? 'Available' : 'None',
          priority: 'medium',
          value: request.uploadedMedia
        },
        { 
          key: 'uplodedDocuments', 
          label: 'Documents', 
          type: 'custom',
          render: (value) => value ? 'Available' : 'None',
          priority: 'medium',
          value: request.uplodedDocuments
        },
        { 
          key: 'uploadedVideos', 
          label: 'Videos', 
          type: 'custom',
          render: (value) => value ? 'Available' : 'None',
          priority: 'medium',
          value: request.uploadedVideos
        },
        { 
          key: 'virtualWalkthrough', 
          label: 'Virtual Tour', 
          type: 'custom',
          render: (value) => value ? 'Available' : 'None',
          priority: 'low',
          value: request.virtualWalkthrough
        },
      ],
    },
    {
      title: 'Internal Notes',
      icon: '📝',
      color: 'bg-indigo-50 hover:bg-indigo-100',
      fields: [
        { key: 'officeNotes', label: 'Office Notes', type: 'text', priority: 'medium', value: request.officeNotes || 'No notes' },
        { key: 'archived', label: 'Archive Reason', type: 'text', priority: 'low', value: request.archived || 'Not archived' },
      ],
    },
  ];

  // Custom card component
  const RequestCard: React.FC<{
    item: Request;
    actions: AdminCardAction[];
    density: 'comfortable' | 'compact';
    allStatuses?: string[];
  }> = ({ item, actions, density, allStatuses }) => (
    <AdminCard
      item={item}
      primaryField="message"
      secondaryField="product"
      statusField="status"
      groups={getCardGroups(item)}
      actions={actions}
      density={density}
      allStatuses={allStatuses}
      formatDate={formatDateShort}
    />
  );

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <H1>Requests</H1>
          <P2 className="text-gray-600 mt-1">
            {showArchived ? "View archived requests" : "Manage service requests and inquiries"}
          </P2>
        </div>
      </div>

      {/* Aggregation Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>📋 Total: {requests.length}</span>
          <span>🏃 Active: {requests.filter(r => r.status !== 'Archived').length}</span>
          <span>📁 Archived: {requests.filter(r => r.status === 'Archived').length}</span>
        </div>
      </div>

      <AdminDataGrid
        title={showArchived ? "Archived Requests" : "Requests"}
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
        cardComponent={RequestCard}
        showArchiveToggle={true}
        showArchived={showArchived}
        onArchiveToggle={setShowArchived}
        allData={requests}
      />
    </div>
  );
};

export default RequestsDataGrid;