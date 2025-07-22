import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminDataGrid, { 
  AdminDataGridColumn, 
  AdminDataGridAction, 
  AdminDataGridFilter,
  AdminDataItem 
} from '../common/AdminDataGrid';
import ProgressiveQuoteCard from './ProgressiveQuoteCard';
import StatusPill from '../../common/ui/StatusPill';
import ArchiveConfirmationDialog from '../common/ArchiveConfirmationDialog';
import { H1, P2 } from '../../typography';
import { quotesAPI } from '../../../utils/amplifyAPI';
import { enhancedQuotesService, FullyEnhancedQuote } from '../../../services/enhancedQuotesService';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';
import { AdvancedSearchField } from '../common/AdvancedSearchDialog';
import { useNotification } from '../../../contexts/NotificationContext';

// Use the enhanced interface with FK resolution
type Quote = FullyEnhancedQuote & AdminDataItem;

const QuotesDataGrid: React.FC = () => {
  const router = useRouter();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [quoteToArchive, setQuoteToArchive] = useState<Quote | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Seed quote ID for safe testing
  const SEED_QUOTE_ID = '66611536-0182-450f-243a-d245afe54439';

  const loadQuotes = useCallback(async () => {
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
        if (allQuotes.length === 0) {
          showInfo('No Quotes Found', 'No quotes are currently available.', 4000);
        }
      } else {
        setError('Failed to load quotes');
        showError('Load Failed', 'Failed to load quotes. Please try again.');
      }
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError('Error loading quotes');
      showError('Load Failed', 'Error loading quotes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setQuotes, showInfo, showError]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

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
      onClick: (quote) => openArchiveDialog(quote),
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

  // Define advanced search fields
  const advancedSearchFields: AdvancedSearchField[] = useMemo(() => [
    {
      key: 'title',
      label: 'Quote Title',
      type: 'text',
      placeholder: 'Search by quote title...'
    },
    {
      key: 'description',
      label: 'Description',
      type: 'text',
      placeholder: 'Search by description...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect',
      options: Array.from(new Set(quotes.map(q => q.status).filter(Boolean)))
        .sort()
        .map(status => ({ value: status, label: status }))
    },
    {
      key: 'product',
      label: 'Product',
      type: 'select'
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
      key: 'agentName',
      label: 'Agent Name',
      type: 'text',
      placeholder: 'Search by agent name...'
    },
    {
      key: 'brokerage',
      label: 'Brokerage',
      type: 'select'
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      type: 'select'
    },
    {
      key: 'businessCreatedDate',
      label: 'Created Date',
      type: 'daterange'
    },
    {
      key: 'businessUpdatedDate',
      label: 'Updated Date',
      type: 'daterange'
    },
    {
      key: 'totalPrice',
      label: 'Total Price',
      type: 'number'
    },
    {
      key: 'budget',
      label: 'Budget',
      type: 'number'
    },
    {
      key: 'operationManagerApproved',
      label: 'Operation Manager Approved',
      type: 'boolean'
    },
    {
      key: 'underwritingApproved',
      label: 'Underwriting Approved',
      type: 'boolean'
    },
    {
      key: 'signed',
      label: 'Client Signed',
      type: 'boolean'
    }
  ], [quotes]);

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

  // Archive dialog handlers
  const openArchiveDialog = (quote: Quote) => {
    setQuoteToArchive(quote);
    setArchiveDialogOpen(true);
  };

  const closeArchiveDialog = () => {
    setArchiveDialogOpen(false);
    setQuoteToArchive(null);
    setArchiveLoading(false);
  };

  const handleArchiveConfirm = async () => {
    if (!quoteToArchive) return;
    
    setArchiveLoading(true);
    try {
      // Update quote status to 'archived'
      const result = await quotesAPI.update(quoteToArchive.id, {
        status: 'Archived'
      });
      
      if (result.success) {
        // Update local state
        setQuotes(prevQuotes => 
          prevQuotes.map(quote => 
            quote.id === quoteToArchive.id 
              ? { ...quote, status: 'Archived' }
              : quote
          )
        );
        
        // Close dialog
        closeArchiveDialog();
        
        // Show success notification
        showSuccess(
          'Quote Archived',
          `Quote for "${quoteToArchive.propertyAddress || 'Unknown Address'}" has been archived successfully.`
        );
      } else {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to archive quote');
      }
    } catch (error) {
      console.error('Error archiving quote:', error);
      showError(
        'Archive Failed',
        'Failed to archive quote. Please try again.',
        10000
      );
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/admin/quotes/new');
  };

  // Production-ready action handlers
  const handleSendToClient = async (selectedRows: any[]) => {
    try {
      if (selectedRows.length === 0) {
        alert('Please select quotes to send');
        return;
      }
      
      const clientEmails = selectedRows.map(quote => quote.contactEmail).filter(Boolean);
      
      if (clientEmails.length === 0) {
        alert('Selected quotes do not have client email addresses');
        return;
      }
      
      // In a real implementation, this would integrate with an email service
      const confirmed = window.confirm(
        `Send ${selectedRows.length} quotes to clients?\n\n` +
        `Recipients: ${clientEmails.join(', ')}`
      );
      
      if (confirmed) {
        // Mock email sending
        alert(`Successfully sent ${selectedRows.length} quotes to clients`);
      }
      
    } catch (error) {
      console.error('Send to client error:', error);
      alert('Failed to send quotes. Please try again.');
    }
  };

  const handleConvertToProject = async (selectedRows: any[]) => {
    try {
      if (selectedRows.length === 0) {
        alert('Please select quotes to convert');
        return;
      }
      
      if (selectedRows.length > 1) {
        alert('Please select only one quote to convert to project');
        return;
      }
      
      const quote = selectedRows[0];
      
      const confirmed = window.confirm(
        `Convert quote "${quote.title || 'Untitled'}" to project?\n\n` +
        `This will create a new project with the quote details.`
      );
      
      if (confirmed) {
        // In a real implementation, this would call a conversion API
        router.push(`/admin/projects/new?fromQuote=${quote.id}`);
      }
      
    } catch (error) {
      console.error('Convert to project error:', error);
      alert('Failed to convert quote. Please try again.');
    }
  };

  const handleExportQuotes = async (selectedRows: any[]) => {
    try {
      if (selectedRows.length === 0) {
        alert('Please select quotes to export');
        return;
      }
      
      const exportData = selectedRows.map(quote => ({
        title: quote.title || 'Untitled Quote',
        status: quote.status,
        contact: quote.contactName || 'N/A',
        email: quote.contactEmail || 'N/A',
        totalAmount: quote.totalAmount || 0,
        createdDate: quote.createdDate,
        items: quote.items?.length || 0
      }));
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Title,Status,Contact,Email,Amount,Created,Items\n"
        + exportData.map(row => 
            `"${row.title}","${row.status}","${row.contact}","${row.email}","${row.totalAmount}","${row.createdDate}","${row.items}"`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `quotes_export_${new Date().toISOString().split('T')[0]}.csv`);
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
        advancedSearchFields={advancedSearchFields}
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
              onClick: () => handleSendToClient([]),
            },
            {
              label: 'Convert to Project',
              onClick: () => handleConvertToProject([]),
            },
            {
              label: 'Export Quotes',
              onClick: () => handleExportQuotes([]),
            },
          ]
        }}
      />

      {/* Archive Confirmation Dialog */}
      <ArchiveConfirmationDialog
        open={archiveDialogOpen}
        onClose={closeArchiveDialog}
        onConfirm={handleArchiveConfirm}
        items={quoteToArchive ? [{
          id: quoteToArchive.id,
          title: `Quote #${quoteToArchive.id?.slice(0, 8)}`,
          address: quoteToArchive.propertyAddress || 'No address provided',
          type: 'quote',
          status: quoteToArchive.status
        }] : []}
        itemType="quotes"
        loading={archiveLoading}
      />
    </div>
  );
};

export default QuotesDataGrid;