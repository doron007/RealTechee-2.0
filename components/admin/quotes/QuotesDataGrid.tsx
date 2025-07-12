import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminDataGrid, { 
  AdminDataGridColumn, 
  AdminDataGridAction, 
  AdminDataGridFilter,
  AdminDataItem 
} from '../common/AdminDataGrid';
import ProgressiveQuoteCard from './ProgressiveQuoteCard';
import StatusPill from '../../common/ui/StatusPill';
import { H1, P2 } from '../../typography';
import { quotesAPI } from '../../../utils/amplifyAPI';
import { enhancedQuotesService, FullyEnhancedQuote } from '../../../services/enhancedQuotesService';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';

// Use the enhanced interface with FK resolution
type Quote = FullyEnhancedQuote & AdminDataItem;

const QuotesDataGrid: React.FC = () => {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Seed quote ID for safe testing
  const SEED_QUOTE_ID = '66611536-0182-450f-243a-d245afe54439';

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use enhanced service to get quotes with FK resolution
      const result = await enhancedQuotesService.getFullyEnhancedQuotes();
      
      if (result.success) {
        const allQuotes = result.data || [];
        console.log('Loaded enhanced quotes:', allQuotes.length, 'Total');
        console.log('Archived quotes:', allQuotes.filter((q: any) => q.status === 'Archived').length);
        console.log('Sample enhanced quote:', allQuotes[0] ? {
          id: allQuotes[0].id,
          propertyAddress: allQuotes[0].propertyAddress,
          clientName: allQuotes[0].clientName,
          agentName: allQuotes[0].agentName,
          brokerage: allQuotes[0].brokerage
        } : 'No quotes');
        setQuotes(allQuotes);
      } else {
        setError('Failed to load quotes');
      }
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError('Error loading quotes');
    } finally {
      setLoading(false);
    }
  };

  // Filter quotes based on archived status
  const filteredQuotes = quotes.filter(quote => {
    if (showArchived) {
      return quote.status === 'Archived';
    } else {
      return quote.status !== 'Archived';
    }
  });

  // Removed getStatusColor - now using StatusPill component

  // Define table columns - following required order: Status, Address, Created, Owner, Agent, Brokerage, Opportunity
  const columns: AdminDataGridColumn<Quote>[] = [
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
      accessorFn: (row) => row.totalPrice || row.budget,
      id: 'opportunity',
      header: 'Opportunity',
      size: 110,
      enableHiding: true, // Can hide on mobile
      Cell: ({ cell }) => (
        <P2>{formatCurrencyFull(cell.getValue() as number)}</P2>
      ),
    },
  ];

  // Define actions - workflow-based actions
  const actions: AdminDataGridAction<Quote>[] = [
    {
      label: 'Edit',
      icon: '/assets/icons/ic-edit.svg',
      onClick: (quote) => router.push(`/admin/quotes/${quote.id}`),
      tooltip: 'Edit Quote',
    },
    {
      label: 'View Request',
      onClick: (quote) => handleViewRequest(quote.id),
      tooltip: 'View Related Request',
      variant: 'secondary',
    },
    {
      label: 'Create Project',
      icon: '/assets/icons/ic-newpage.svg',
      onClick: (quote) => handleCreateProject(quote.id),
      tooltip: 'Create Project from Quote',
      variant: 'primary',
    },
    {
      label: 'View Project',
      onClick: (quote) => handleViewProject(quote.id),
      tooltip: 'View Related Project',
      variant: 'secondary',
    },
    {
      label: 'Archive',
      icon: '/assets/icons/ic-delete.svg',
      onClick: (quote) => handleArchiveQuote(quote.id),
      tooltip: 'Archive Quote',
      variant: 'tertiary',
    },
  ];

  // Define filters - dynamic based on actual data
  const filters: AdminDataGridFilter[] = useMemo(() => {
    // Get unique statuses from filtered data
    const uniqueStatuses = Array.from(new Set(filteredQuotes.map(q => q.status).filter(Boolean))).sort() as string[];
    const uniqueProducts = Array.from(new Set(filteredQuotes.map(q => q.product).filter(Boolean))).sort() as string[];
    const uniqueAssignees = Array.from(new Set(filteredQuotes.map(q => q.assignedTo).filter(Boolean))).sort() as string[];
    
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
        field: 'assignedTo',
        label: 'Assigned To',
        options: [
          { value: '', label: 'All Assignees' },
          ...uniqueAssignees.map(assignee => ({ value: assignee, label: assignee }))
        ],
      },
    ];
  }, [filteredQuotes]);

  // Action handlers - workflow-based
  const handleViewRequest = async (quoteId: string) => {
    try {
      // Find the quote first to get the requestId
      const quote = quotes.find(q => q.id === quoteId);
      const requestId = (quote as any)?.requestId; // Use type assertion for now until type is updated
      
      if (quote && requestId) {
        router.push(`/admin/requests/${requestId}`);
      } else {
        alert('No related request found for this quote');
      }
    } catch (error) {
      console.error('Error viewing request:', error);
      alert('Failed to view request');
    }
  };

  const handleCreateProject = async (quoteId: string) => {
    try {
      const confirmed = confirm('Create a new project from this quote?');
      if (!confirmed) return;
      
      // Navigate to create project page with quote ID
      router.push(`/admin/projects/new?quoteId=${quoteId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  const handleViewProject = async (quoteId: string) => {
    try {
      // Find related project by quoteId
      router.push(`/admin/projects?quoteId=${quoteId}`);
    } catch (error) {
      console.error('Error viewing project:', error);
      alert('Failed to view project');
    }
  };

  const handleArchiveQuote = async (quoteId: string) => {
    try {
      const confirmed = confirm('Archive this quote?');
      if (!confirmed) return;
      
      // Implementation would depend on your API
      console.log('Archiving quote:', quoteId);
      alert('Quote archived successfully! (Feature in development)');
    } catch (error) {
      console.error('Error archiving quote:', error);
      alert('Failed to archive quote');
    }
  };

  const handleCreateNew = () => {
    alert('Create new quote will be implemented in Phase 6');
  };


  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">

      {/* Aggregation Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>📋 Total: {quotes.length}</span>
          <span>🏃 Active: {quotes.filter(q => q.status !== 'Archived').length}</span>
          <span>📁 Archived: {quotes.filter(q => q.status === 'Archived').length}</span>
        </div>
      </div>

      <AdminDataGrid
        title="Quotes"
        subtitle={showArchived ? "View archived quotes" : "Manage quotes, proposals, and estimates"}
        data={filteredQuotes}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        onRefresh={loadQuotes}
        createButtonLabel="New Quote"
        onCreateNew={handleCreateNew}
        searchFields={['title', 'description', 'clientName', 'clientEmail', 'agentName', 'status']}
        filters={filters}
        defaultSortField="created"
        defaultSortDirection="desc"
        itemDisplayName="quotes"
        formatCurrency={formatCurrencyFull}
        formatDate={formatDateShort}
        cardComponent={ProgressiveQuoteCard}
        showArchiveToggle={true}
        showArchived={showArchived}
        onArchiveToggle={setShowArchived}
        allData={quotes}
        customActions={{
          label: 'Quote Actions',
          items: [
            {
              label: 'Send to Client',
              onClick: () => alert('Send to Client functionality will be implemented'),
            },
            {
              label: 'Convert to Project',
              onClick: () => alert('Convert to Project functionality will be implemented'),
            },
            {
              label: 'Export Quotes',
              onClick: () => alert('Export Quotes functionality will be implemented'),
            },
          ]
        }}
      />
    </div>
  );
};

export default QuotesDataGrid;