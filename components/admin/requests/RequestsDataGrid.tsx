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
      const result = await requestsAPI.list();
      
      if (result.success) {
        setRequests(result.data || []);
      } else {
        setError('Failed to load requests');
      }
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
      // Mock data for testing
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
        // Add more mock data as needed
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

  // Define table columns
  const columns: AdminDataGridColumn<Request>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      enableHiding: false,
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
      accessorFn: (row) => row.message || `Request #${row.id.slice(0, 8)}`,
      id: 'request',
      header: 'Request',
      size: 200,
      enableHiding: false,
      Cell: ({ cell, row }) => (
        <div>
          <div className="font-medium">{cell.getValue() as string}</div>
          <div className="text-sm text-gray-500">{row.original.product}</div>
        </div>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'Client',
      size: 150,
      enableHiding: true,
      Cell: ({ cell, row }) => (
        <div>
          <div className="font-medium">{(cell.getValue() as string) || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.original.relationToProperty}</div>
        </div>
      ),
    },
    {
      accessorKey: 'agentName',
      header: 'Agent',
      size: 150,
      enableHiding: true,
    },
    {
      accessorKey: 'leadSource',
      header: 'Source',
      size: 100,
      enableHiding: true,
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      size: 120,
      enableHiding: true,
    },
    {
      accessorFn: (row) => row.businessCreatedDate || row.createdAt,
      id: 'created',
      header: 'Created',
      size: 120,
      enableHiding: true,
      Cell: ({ cell }) => formatDateShort(cell.getValue() as string),
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
    <div className="space-y-4">
      {/* Archive Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {showArchived ? 'Show Archived Requests' : 'Show Active Requests'}
              </span>
            </label>
            <div className="text-sm text-gray-500">
              {showArchived 
                ? `${filteredRequests.length} archived requests`
                : `${filteredRequests.length} active requests`
              }
            </div>
          </div>
          {showArchived && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>🗑️</span>
              <span>Archived Items</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-full overflow-hidden">
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
        />
      </div>
    </div>
  );
};

export default RequestsDataGrid;