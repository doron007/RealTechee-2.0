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
import { quotesAPI } from '../../../utils/amplifyAPI';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';

interface Quote extends AdminDataItem {
  id: string;
  title?: string;
  description?: string;
  status: string;
  quoteNumber?: number;
  clientName?: string;
  clientEmail?: string;
  agentName?: string;
  brokerage?: string;
  product?: string;
  totalPrice?: number;
  totalCost?: number;
  budget?: number;
  projectedListingPrice?: number;
  requestDate?: string;
  sentDate?: string;
  openedDate?: string;
  signedDate?: string;
  expiredDate?: string;
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
  requestId?: string;
  projectId?: string;
  propertyAddress?: string;
  bedrooms?: string;
  bathrooms?: string;
  sizeSqft?: string;
  yearBuilt?: string;
  officeNotes?: string;
  assignedTo?: string;
  operationManagerApproved?: boolean;
  underwritingApproved?: boolean;
  signed?: boolean;
  creditScore?: number;
  estimatedWeeksDuration?: string;
}

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
      const result = await quotesAPI.list();
      
      if (result.success) {
        setQuotes(result.data || []);
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

  // Define table columns
  const columns: AdminDataGridColumn<Quote>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
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
      accessorFn: (row) => row.title || `Quote #${row.quoteNumber || row.id.slice(0, 8)}`,
      id: 'title',
      header: 'Quote',
      size: 200,
      enableHiding: false,
    },
    {
      accessorKey: 'clientName',
      header: 'Client',
      size: 150,
      enableHiding: true,
    },
    {
      accessorKey: 'agentName',
      header: 'Agent',
      size: 150,
      enableHiding: true,
    },
    {
      accessorKey: 'product',
      header: 'Product',
      size: 120,
      enableHiding: true,
    },
    {
      accessorKey: 'totalPrice',
      header: 'Amount',
      size: 120,
      enableHiding: true,
      Cell: ({ cell }) => {
        const value = cell.getValue() as number;
        return value ? formatCurrencyFull(value) : 'N/A';
      },
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
  const actions: AdminDataGridAction<Quote>[] = [
    {
      label: 'View',
      icon: '/assets/icons/ic-newpage.svg',
      onClick: (quote) => window.open(`/quote?quoteId=${quote.id}`, '_blank'),
      tooltip: 'Open Quote',
    },
    {
      label: 'Edit',
      icon: '/assets/icons/ic-edit.svg',
      onClick: (quote) => router.push(`/admin/quotes/${quote.id}`),
      tooltip: 'Edit Quote',
    },
    {
      label: 'Archive',
      icon: '/assets/icons/ic-delete.svg',
      onClick: (quote) => handleArchiveQuote(quote.id),
      tooltip: 'Archive Quote',
      variant: 'tertiary',
    },
    {
      label: 'Convert to Project',
      onClick: (quote) => handleConvertToProject(quote.id),
      tooltip: 'Convert Quote to Project',
      variant: 'primary',
    },
    {
      label: 'Send to Client',
      onClick: (quote) => handleSendQuote(quote.id),
      tooltip: 'Send Quote to Client',
      variant: 'secondary',
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

  // Action handlers
  const handleArchiveQuote = async (quoteId: string) => {
    if (quoteId !== SEED_QUOTE_ID) {
      alert('For safety, operations are only allowed on the seed quote during testing');
      return;
    }

    const confirmed = confirm('Archive this quote?');
    if (!confirmed) return;

    alert('Quote archived successfully! (Simulated action)');
  };

  const handleConvertToProject = async (quoteId: string) => {
    if (quoteId !== SEED_QUOTE_ID) {
      alert('For safety, operations are only allowed on the seed quote during testing');
      return;
    }

    const confirmed = confirm('Convert this quote to a project?');
    if (!confirmed) return;

    alert('Quote converted to project successfully! (Simulated action)');
  };

  const handleSendQuote = async (quoteId: string) => {
    if (quoteId !== SEED_QUOTE_ID) {
      alert('For safety, operations are only allowed on the seed quote during testing');
      return;
    }

    alert('Quote sent to client successfully! (Simulated action)');
  };

  const handleCreateNew = () => {
    alert('Create new quote will be implemented in Phase 6');
  };

  // Define card groups for detailed view with actual quote data
  const getCardGroups = (quote: Quote): AdminCardGroup[] => [
    {
      title: 'Quote Information',
      icon: '📋',
      color: 'bg-blue-50 hover:bg-blue-100',
      fields: [
        { key: 'quoteNumber', label: 'Quote Number', value: quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`, type: 'text', priority: 'high' },
        { key: 'title', label: 'Title', value: quote.title || 'Untitled Quote', type: 'text', priority: 'high' },
        { key: 'description', label: 'Description', value: quote.description || 'No description provided', type: 'text', priority: 'medium' },
        { key: 'product', label: 'Product', value: quote.product || 'N/A', type: 'text', priority: 'high' },
        { key: 'assignedTo', label: 'Assigned To', value: quote.assignedTo || 'Unassigned', type: 'text', priority: 'medium' },
        { key: 'estimatedWeeksDuration', label: 'Duration', value: quote.estimatedWeeksDuration || 'TBD', type: 'text', priority: 'medium' },
      ],
    },
    {
      title: 'Client Information',
      icon: '👤',
      color: 'bg-green-50 hover:bg-green-100',
      fields: [
        { key: 'clientName', label: 'Client Name', value: quote.clientName || 'N/A', type: 'text', priority: 'high' },
        { key: 'clientEmail', label: 'Client Email', value: quote.clientEmail || 'N/A', type: 'text', priority: 'high' },
        { key: 'agentName', label: 'Agent', value: quote.agentName || 'N/A', type: 'text', priority: 'high' },
        { key: 'brokerage', label: 'Brokerage', value: quote.brokerage || 'N/A', type: 'text', priority: 'medium' },
        { key: 'creditScore', label: 'Credit Score', value: quote.creditScore ? quote.creditScore.toString() : 'N/A', type: 'text', priority: 'low' },
      ],
    },
    {
      title: 'Financial Details',
      icon: '💰',
      color: 'bg-yellow-50 hover:bg-yellow-100',
      fields: [
        { key: 'totalPrice', label: 'Total Price', value: quote.totalPrice || 0, type: 'currency', priority: 'high' },
        { key: 'totalCost', label: 'Total Cost', value: quote.totalCost || 0, type: 'currency', priority: 'medium' },
        { key: 'budget', label: 'Client Budget', value: quote.budget || 0, type: 'currency', priority: 'high' },
        { key: 'projectedListingPrice', label: 'Projected Listing', value: quote.projectedListingPrice || 0, type: 'currency', priority: 'medium' },
      ],
    },
    {
      title: 'Property Details',
      icon: '🏠',
      color: 'bg-emerald-50 hover:bg-emerald-100',
      fields: [
        { key: 'propertyAddress', label: 'Address', value: quote.propertyAddress || 'N/A', type: 'text', priority: 'high' },
        { key: 'bedrooms', label: 'Bedrooms', value: quote.bedrooms || 'N/A', type: 'text', priority: 'medium' },
        { key: 'bathrooms', label: 'Bathrooms', value: quote.bathrooms || 'N/A', type: 'text', priority: 'medium' },
        { key: 'sizeSqft', label: 'Square Feet', value: quote.sizeSqft || 'N/A', type: 'text', priority: 'medium' },
        { key: 'yearBuilt', label: 'Year Built', value: quote.yearBuilt || 'N/A', type: 'text', priority: 'low' },
      ],
    },
    {
      title: 'Timeline',
      icon: '📅',
      color: 'bg-purple-50 hover:bg-purple-100',
      fields: [
        { key: 'requestDate', label: 'Request Date', value: quote.requestDate || quote.businessCreatedDate || quote.createdAt, type: 'date', priority: 'medium' },
        { key: 'sentDate', label: 'Sent Date', value: quote.sentDate || 'Not sent', type: 'date', priority: 'high' },
        { key: 'openedDate', label: 'Opened Date', value: quote.openedDate || 'Not opened', type: 'date', priority: 'medium' },
        { key: 'signedDate', label: 'Signed Date', value: quote.signedDate || 'Not signed', type: 'date', priority: 'high' },
        { key: 'expiredDate', label: 'Expiry Date', value: quote.expiredDate || 'No expiry', type: 'date', priority: 'medium' },
      ],
    },
    {
      title: 'Approval Status',
      icon: '✅',
      color: 'bg-indigo-50 hover:bg-indigo-100',
      fields: [
        { 
          key: 'operationManagerApproved', 
          label: 'Operations Approved', 
          value: quote.operationManagerApproved,
          type: 'custom',
          render: (value) => value ? '✅ Yes' : '❌ No',
          priority: 'medium'
        },
        { 
          key: 'underwritingApproved', 
          label: 'Underwriting Approved', 
          value: quote.underwritingApproved,
          type: 'custom',
          render: (value) => value ? '✅ Yes' : '❌ No',
          priority: 'medium'
        },
        { 
          key: 'signed', 
          label: 'Client Signed', 
          value: quote.signed,
          type: 'custom',
          render: (value) => value ? '✅ Yes' : '❌ No',
          priority: 'high'
        },
      ],
    },
  ];

  // Custom card component
  const QuoteCard: React.FC<{
    item: Quote;
    actions: AdminCardAction[];
    density: 'comfortable' | 'compact';
    allStatuses?: string[];
  }> = ({ item, actions, density, allStatuses }) => (
    <AdminCard
      item={item}
      primaryField="title"
      secondaryField="description"
      statusField="status"
      groups={getCardGroups(item)}
      actions={actions}
      density={density}
      allStatuses={allStatuses}
      formatCurrency={formatCurrencyFull}
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
                {showArchived ? 'Show Archived Quotes' : 'Show Active Quotes'}
              </span>
            </label>
            <div className="text-sm text-gray-500">
              {showArchived 
                ? `${filteredQuotes.length} archived quotes`
                : `${filteredQuotes.length} active quotes`
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
          title={showArchived ? "Archived Quotes" : "Quotes"}
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
          cardComponent={QuoteCard}
        />
      </div>
    </div>
  );
};

export default QuotesDataGrid;