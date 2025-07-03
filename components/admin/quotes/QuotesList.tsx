import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { H1, H2, H3, H4, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { quotesAPI } from '../../../utils/amplifyAPI';

interface Quote {
  id: string;
  title?: string;
  description?: string;
  status: string;
  clientName?: string;
  clientEmail?: string;
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
  requestId?: string;
  projectId?: string;
}

interface QuotesListState {
  quotes: Quote[];
  loading: boolean;
  error: string;
  searchTerm: string;
  statusFilter: string;
  selectedQuotes: Set<string>;
}

const QuotesList: React.FC = () => {
  const router = useRouter();
  const [state, setState] = useState<QuotesListState>({
    quotes: [],
    loading: true,
    error: '',
    searchTerm: '',
    statusFilter: 'all',
    selectedQuotes: new Set()
  });

  // Seed quote ID for safe testing as per implementation plan
  const SEED_QUOTE_ID = '66611536-0182-450f-243a-d245afe54439';

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const result = await quotesAPI.list();
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          quotes: result.data || [],
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to load quotes',
          loading: false
        }));
      }
    } catch (err) {
      console.error('Error loading quotes:', err);
      setState(prev => ({
        ...prev,
        error: 'Error loading quotes',
        loading: false
      }));
    }
  };

  // Filter and search logic
  const filteredQuotes = useMemo(() => {
    let filtered = state.quotes;

    // Filter out archived quotes by default
    filtered = filtered.filter(quote => quote.status !== 'Archived');

    // Apply status filter
    if (state.statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === state.statusFilter);
    }

    // Apply search filter
    if (state.searchTerm) {
      const searchTerm = state.searchTerm.toLowerCase();
      filtered = filtered.filter(quote =>
        (quote.title && quote.title.toLowerCase().includes(searchTerm)) ||
        (quote.description && quote.description.toLowerCase().includes(searchTerm)) ||
        (quote.clientName && quote.clientName.toLowerCase().includes(searchTerm)) ||
        (quote.clientEmail && quote.clientEmail.toLowerCase().includes(searchTerm)) ||
        (quote.status && quote.status.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  }, [state.quotes, state.statusFilter, state.searchTerm]);

  const handleSearchChange = (value: string) => {
    setState(prev => ({ ...prev, searchTerm: value }));
  };

  const handleStatusFilterChange = (status: string) => {
    setState(prev => ({ ...prev, statusFilter: status }));
  };

  const handleSelectQuote = (quoteId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedQuotes);
      if (newSelected.has(quoteId)) {
        newSelected.delete(quoteId);
      } else {
        newSelected.add(quoteId);
      }
      return { ...prev, selectedQuotes: newSelected };
    });
  };

  const handleSelectAll = () => {
    setState(prev => {
      const allFiltered = new Set(filteredQuotes.map(q => q.id));
      const isAllSelected = filteredQuotes.every(q => prev.selectedQuotes.has(q.id));
      return {
        ...prev,
        selectedQuotes: isAllSelected ? new Set() : allFiltered
      };
    });
  };

  const handleEditQuote = (quoteId: string) => {
    // Navigate to quote detail/edit page (Phase 6)
    router.push(`/admin/quotes/${quoteId}`);
  };

  const handleBulkArchive = async () => {
    if (state.selectedQuotes.size === 0) return;
    
    // Safety check - only allow operations on seed quote
    const nonSeedQuotes = Array.from(state.selectedQuotes).filter(id => id !== SEED_QUOTE_ID);
    if (nonSeedQuotes.length > 0) {
      alert('For safety, bulk operations are only allowed on the seed quote during testing');
      return;
    }

    const confirmed = confirm(`Archive ${state.selectedQuotes.size} selected quote(s)?`);
    if (!confirmed) return;

    // In Phase 5, we'll just show success message - actual implementation would update status
    alert('Quotes archived successfully! (Phase 5 - simulated action)');
    setState(prev => ({ ...prev, selectedQuotes: new Set() }));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Draft': return 'text-gray-600 bg-gray-100';
      case 'Review': return 'text-yellow-600 bg-yellow-100';
      case 'Sent': return 'text-blue-600 bg-blue-100';
      case 'Signed': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Expired': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (value?: number): string => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(state.quotes.map(q => q.status).filter(Boolean));
    return Array.from(statuses).filter(status => status !== 'Archived');
  }, [state.quotes]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <H1 className="mb-2">Quotes</H1>
          <P2 className="text-gray-600">
            Manage quotes, proposals, and estimates
          </P2>
        </div>
        <Button
          variant="primary"
          onClick={() => alert('Create new quote will be implemented in Phase 6')}
        >
          + New Quote
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search quotes..."
              value={state.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <P3 className="text-gray-600">Status:</P3>
            <select
              value={state.statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between">
          <P3 className="text-gray-500">
            Showing {filteredQuotes.length} of {state.quotes.filter(q => q.status !== 'Archived').length} quotes
          </P3>
          
          {/* Bulk Actions */}
          {state.selectedQuotes.size > 0 && (
            <div className="flex items-center gap-2">
              <P3 className="text-gray-600">{state.selectedQuotes.size} selected</P3>
              <Button
                variant="secondary"
                size="small"
                onClick={handleBulkArchive}
              >
                Archive Selected
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      {/* Quotes List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-12">
            <P2 className="text-gray-500 mb-2">No quotes found</P2>
            <P3 className="text-gray-400">
              {state.searchTerm || state.statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'Create your first quote to get started'
              }
            </P3>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filteredQuotes.length > 0 && filteredQuotes.every(q => state.selectedQuotes.has(q.id))}
                  onChange={handleSelectAll}
                  className="mr-4"
                />
                <div className="grid grid-cols-6 gap-4 flex-1 text-sm font-medium text-gray-700">
                  <div>Quote</div>
                  <div>Client</div>
                  <div>Status</div>
                  <div>Amount</div>
                  <div>Created</div>
                  <div>Actions</div>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={state.selectedQuotes.has(quote.id)}
                      onChange={() => handleSelectQuote(quote.id)}
                      className="mr-4"
                    />
                    <div className="grid grid-cols-6 gap-4 flex-1 items-center">
                      {/* Quote Title/ID */}
                      <div>
                        <P2 className="font-medium">{quote.title || `Quote #${quote.id.slice(0, 8)}`}</P2>
                        {quote.description && (
                          <P3 className="text-gray-500 truncate">{quote.description}</P3>
                        )}
                      </div>

                      {/* Client */}
                      <div>
                        <P2>{quote.clientName || 'N/A'}</P2>
                        {quote.clientEmail && (
                          <P3 className="text-gray-500">{quote.clientEmail}</P3>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {quote.status}
                        </span>
                      </div>

                      {/* Amount */}
                      <div>
                        <P2 className="font-medium">{formatCurrency(quote.totalAmount)}</P2>
                      </div>

                      {/* Created Date */}
                      <div>
                        <P2>{formatDate(quote.businessCreatedDate || quote.createdAt)}</P2>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => handleEditQuote(quote.id)}
                        >
                          Edit
                        </Button>
                        {quote.projectId && (
                          <Button
                            variant="tertiary"
                            size="small"
                            onClick={() => router.push(`/admin/projects/${quote.projectId}`)}
                          >
                            Project
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Safety Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <H4 className="text-blue-800 mb-2">Phase 5 Implementation</H4>
        <P2 className="text-blue-700">
          This is the Quotes CRUD list view implementation. For safety during testing, operations are restricted to the seed quote ({SEED_QUOTE_ID}). 
          Quote detail/edit functionality will be implemented in Phase 6.
        </P2>
      </div>
    </div>
  );
};

export default QuotesList;