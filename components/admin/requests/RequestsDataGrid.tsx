import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminDataGrid, { 
  AdminDataGridColumn, 
  AdminDataGridAction, 
  AdminDataGridFilter,
  AdminDataItem 
} from '../common/AdminDataGrid';
import VirtualizedDataGrid, { useVirtualizedData } from '../common/VirtualizedDataGrid';
import ProgressiveRequestCard from './ProgressiveRequestCard';
import StatusPill from '../../common/ui/StatusPill';
import ArchiveConfirmationDialog from '../common/ArchiveConfirmationDialog';
import { H1, P2 } from '../../typography';
import { type FullyEnhancedRequest } from '../../../services/business/enhancedRequestsService';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';
import { AdvancedSearchField } from '../common/AdvancedSearchDialog';
import { useRequestsQuery, useRequestMutations } from '../../../hooks/useRequestsQuery';
import { invalidateQueries } from '../../../lib/queryClient';

// Use the FullyEnhancedRequest type directly
type Request = FullyEnhancedRequest;

export default function RequestsDataGrid() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  
  // Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [requestToArchive, setRequestToArchive] = useState<Request | null>(null);

  // Use optimized queries - MATCHING ProjectsDataGrid pattern exactly
  const { data: requests = [], isLoading: loading, error: queryError, refetch } = useRequestsQuery();
  const { archiveRequest } = useRequestMutations();

  // Convert query error to string
  const error = queryError ? String(queryError) : undefined;

  // Performance optimization: use virtualization for large datasets
  const { shouldVirtualize, optimizedData } = useVirtualizedData(requests, 50);

  // Action handlers - Define before usage in actions array
  const handleCreateQuote = (request: Request) => {
    // Navigate to quote creation with request context
    router.push(`/admin/quotes/new?fromRequest=${request.id}`);
  };

  const handleScheduleVisit = (request: Request) => {
    // Navigate to visit scheduling
    router.push(`/admin/requests/${request.id}?tab=visit`);
  };

  const openArchiveDialog = (request: Request) => {
    setRequestToArchive(request);
    setArchiveDialogOpen(true);
  };

  const closeArchiveDialog = () => {
    setArchiveDialogOpen(false);
    setRequestToArchive(null);
  };

  const handleArchiveConfirm = async () => {
    if (!requestToArchive) return;

    try {
      await archiveRequest.mutateAsync(requestToArchive.id);
      closeArchiveDialog();
      await refetch(); // Refresh the data
    } catch (error) {
      console.error('Failed to archive request:', error);
    }
  };

  const handleCreateNew = () => {
    router.push('/admin/requests/new');
  };

  const handleRefresh = async () => {
    await refetch();
  };

  // Define columns for table view - exactly matching working ProjectsDataGrid structure  
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
      accessorFn: (row) => row.createdAt || row.businessCreatedDate,
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
      accessorFn: (row) => row.budget || 'N/A',
      id: 'opportunity',
      header: 'Opportunity',
      size: 110,
      enableHiding: true, // Can hide on mobile
      Cell: ({ cell }) => (
        <P2>{cell.getValue() as string}</P2>
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
      icon: '/assets/icons/ic-quote.svg',
      onClick: handleCreateQuote,
      tooltip: 'Create Quote from Request',
    },
    {
      label: 'Schedule Visit',
      icon: '/assets/icons/ic-date.svg',
      onClick: handleScheduleVisit,
      tooltip: 'Schedule Property Visit',
    },
    {
      label: 'Archive',
      icon: '/assets/icons/folder.svg',
      onClick: openArchiveDialog,
      tooltip: 'Archive Request',
      variant: 'secondary',
    },
  ];

  // Filter requests based on archived status
  const filteredRequests = requests.filter(request => {
    if (showArchived) {
      return request.status === 'Archived';
    } else {
      return request.status !== 'Archived';
    }
  });

  // Advanced search fields
  const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'message', label: 'Message', type: 'text' },
    { key: 'clientName', label: 'Client Name', type: 'text' },
    { key: 'clientEmail', label: 'Client Email', type: 'text' },
    { key: 'agentName', label: 'Agent Name', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'product', label: 'Product', type: 'text' },
  ];

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

      <AdminDataGrid<Request>
        title="Requests"
        subtitle={showArchived ? "View and manage archived request records" : "Manage and track all request records"}
        data={filteredRequests}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        createButtonLabel="New Request"
        itemDisplayName="requests"
        searchFields={['message', 'clientName', 'clientEmail', 'agentName', 'status']}
        advancedSearchFields={advancedSearchFields}
        defaultSortField="created"
        cardComponent={ProgressiveRequestCard}
        showArchiveToggle={true}
        showArchived={showArchived}
        onArchiveToggle={setShowArchived}
        allData={requests}
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
        loading={archiveRequest.isPending}
      />
    </div>
  );
}