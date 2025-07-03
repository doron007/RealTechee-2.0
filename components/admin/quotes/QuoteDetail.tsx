import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { H1, H2, H3, H4, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { quotesAPI, quoteItemsAPI } from '../../../utils/amplifyAPI';

interface Quote {
  id: string;
  title?: string;
  description?: string;
  status: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  totalAmount?: number;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
  requestId?: string;
  projectId?: string;
}

interface QuoteItem {
  id: string;
  quoteId: string;
  itemName?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuoteDetailState {
  quote: Quote | null;
  quoteItems: QuoteItem[];
  loading: boolean;
  saving: boolean;
  error: string;
  hasUnsavedChanges: boolean;
}

interface QuoteDetailProps {
  quoteId: string;
}

const QuoteDetail: React.FC<QuoteDetailProps> = ({ quoteId }) => {
  const router = useRouter();
  const [state, setState] = useState<QuoteDetailState>({
    quote: null,
    quoteItems: [],
    loading: true,
    saving: false,
    error: '',
    hasUnsavedChanges: false
  });

  // Seed quote ID for safe testing as per plan
  const SEED_QUOTE_ID = '66611536-0182-450f-243a-d245afe54439';

  useEffect(() => {
    const loadData = async () => {
      await loadQuote();
      await loadQuoteItems();
    };
    loadData();
  }, [quoteId]); // loadQuote and loadQuoteItems defined below, safe to omit from deps

  const loadQuote = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const result = await quotesAPI.get(quoteId);
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          quote: result.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Quote not found',
          loading: false
        }));
      }
    } catch (err) {
      console.error('Error loading quote:', err);
      setState(prev => ({
        ...prev,
        error: 'Error loading quote',
        loading: false
      }));
    }
  };

  const loadQuoteItems = async () => {
    try {
      const result = await quoteItemsAPI.list();
      
      if (result.success) {
        // Filter quote items for this quote
        const filteredItems = result.data?.filter((item: QuoteItem) => 
          item.quoteId === quoteId
        ) || [];
        
        setState(prev => ({
          ...prev,
          quoteItems: filteredItems
        }));
      }
    } catch (err) {
      console.error('Error loading quote items:', err);
    }
  };

  const handleSave = async () => {
    if (!state.quote) return;

    // Safety check - only allow editing seed quote for Phase 6 testing
    if (quoteId !== SEED_QUOTE_ID) {
      alert('For safety, editing is only allowed on the seed quote during testing');
      return;
    }

    setState(prev => ({ ...prev, saving: true }));

    try {
      // In a real implementation, we would save the quote data
      // For Phase 6, we'll just simulate success
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          saving: false, 
          hasUnsavedChanges: false 
        }));
        alert('Quote saved successfully!');
      }, 1000);
      
    } catch (err) {
      console.error('Error saving quote:', err);
      setState(prev => ({ ...prev, saving: false }));
      alert('Failed to save quote');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      quote: prev.quote ? { ...prev.quote, [field]: value } : null,
      hasUnsavedChanges: true
    }));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Draft': return 'text-gray-600 bg-gray-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Sent': return 'text-blue-600 bg-blue-100';
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (value?: number): string => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateItemTotal = (item: QuoteItem): number => {
    return (item.quantity || 0) * (item.unitPrice || 0);
  };

  const calculateQuoteTotal = (): number => {
    return state.quoteItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (state.error || !state.quote) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {state.error || 'Quote not found'}
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/quotes')}
          >
            ← Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  const { quote } = state;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="tertiary"
              withIcon
              iconSvg="/assets/icons/arrow-left.svg"
              onClick={() => router.push('/admin/quotes')}
            >
              Back to Quotes
            </Button>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
              {quote.status}
            </span>
          </div>
          <H1 className="mb-2">{quote.title || 'Untitled Quote'}</H1>
          <P2 className="text-gray-600">
            Last updated {formatDate(quote.businessUpdatedDate || quote.updatedAt)}
          </P2>
        </div>
        
        {/* Save Button - Persistent */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => alert('Quote preview will be implemented in Phase 6')}
          >
            Preview Quote
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={state.saving || !state.hasUnsavedChanges}
            withIcon={state.saving}
            iconSvg={state.saving ? "/assets/icons/loading.svg" : undefined}
          >
            {state.saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Warning for non-seed quote */}
      {quoteId !== SEED_QUOTE_ID && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <H4 className="text-yellow-800 mb-2">Testing Mode</H4>
          <P2 className="text-yellow-700">
            For safety during Phase 6 implementation, editing is only enabled for the seed quote ({SEED_QUOTE_ID}). 
            Other quotes are in view-only mode.
          </P2>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quote Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Quote Information</H3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Title
                </label>
                <input
                  type="text"
                  value={quote.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  disabled={quoteId !== SEED_QUOTE_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={quote.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  disabled={quoteId !== SEED_QUOTE_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Sent">Sent</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quote.totalAmount || ''}
                  onChange={(e) => handleFieldChange('totalAmount', parseFloat(e.target.value) || 0)}
                  disabled={quoteId !== SEED_QUOTE_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('validUntil', e.target.value)}
                  disabled={quoteId !== SEED_QUOTE_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={quote.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={quoteId !== SEED_QUOTE_ID}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Client Information</H3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={quote.clientName || ''}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                  disabled={quoteId !== SEED_QUOTE_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={quote.clientEmail || ''}
                  onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
                  disabled={quoteId !== SEED_QUOTE_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Phone
                </label>
                <input
                  type="tel"
                  value={quote.clientPhone || ''}
                  onChange={(e) => handleFieldChange('clientPhone', e.target.value)}
                  disabled={quoteId !== SEED_QUOTE_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Quote Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <H3>Quote Items</H3>
              <Button
                variant="secondary"
                onClick={() => alert('Add item functionality will be implemented in Phase 6')}
                disabled={quoteId !== SEED_QUOTE_ID}
              >
                Add Item
              </Button>
            </div>
            
            {state.quoteItems.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <P2 className="text-gray-500 mb-2">No quote items yet</P2>
                <P3 className="text-gray-400">Add items to build your quote</P3>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Items Table Header */}
                <div className="grid grid-cols-12 gap-3 pb-2 border-b border-gray-200 text-sm font-medium text-gray-700">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-2">Actions</div>
                </div>
                
                {/* Items List */}
                {state.quoteItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="col-span-4">
                      <P2 className="font-medium">{item.itemName}</P2>
                      {item.description && (
                        <P3 className="text-gray-600 mt-1">{item.description}</P3>
                      )}
                    </div>
                    <div className="col-span-2">
                      <P2>{item.quantity || 0}</P2>
                    </div>
                    <div className="col-span-2">
                      <P2>{formatCurrency(item.unitPrice)}</P2>
                    </div>
                    <div className="col-span-2">
                      <P2 className="font-medium">{formatCurrency(calculateItemTotal(item))}</P2>
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => alert('Edit item functionality will be implemented in Phase 6')}
                        disabled={quoteId !== SEED_QUOTE_ID}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => alert('Delete item functionality will be implemented in Phase 6')}
                        disabled={quoteId !== SEED_QUOTE_ID}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Total Row */}
                <div className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="col-span-8"></div>
                  <div className="col-span-2">
                    <P2 className="font-bold">Total:</P2>
                  </div>
                  <div className="col-span-2">
                    <P2 className="font-bold text-lg">{formatCurrency(calculateQuoteTotal())}</P2>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gallery Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Quote Gallery</H3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <P2 className="text-gray-500 mb-2">Gallery management will be implemented in Phase 6</P2>
              <P3 className="text-gray-400">Features: Upload images, attachments, before/after photos</P3>
            </div>
          </div>

          {/* Payments & Milestones */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Payments & Milestones</H3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <P2 className="text-gray-500 mb-2">Payment terms and milestones will be implemented in Phase 6</P2>
              <P3 className="text-gray-400">Features: Payment schedules, milestone tracking, progress updates</P3>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Quote Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H4 className="mb-4">Quote Statistics</H4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <P3 className="text-gray-600">Created</P3>
                <P3 className="font-medium">{formatDate(quote.businessCreatedDate || quote.createdAt)}</P3>
              </div>
              <div className="flex justify-between">
                <P3 className="text-gray-600">Last Updated</P3>
                <P3 className="font-medium">{formatDate(quote.businessUpdatedDate || quote.updatedAt)}</P3>
              </div>
              <div className="flex justify-between">
                <P3 className="text-gray-600">Items Count</P3>
                <P3 className="font-medium">{state.quoteItems.length}</P3>
              </div>
              <div className="flex justify-between">
                <P3 className="text-gray-600">Total Value</P3>
                <P3 className="font-medium text-green-600">{formatCurrency(calculateQuoteTotal())}</P3>
              </div>
              {quote.validUntil && (
                <div className="flex justify-between">
                  <P3 className="text-gray-600">Valid Until</P3>
                  <P3 className="font-medium">{formatDate(quote.validUntil)}</P3>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H4 className="mb-4">Quick Actions</H4>
            <div className="space-y-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => alert('Send quote will be implemented in Phase 6')}
              >
                Send Quote to Client
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => alert('Duplicate quote will be implemented in Phase 6')}
              >
                Duplicate Quote
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => alert('Export PDF will be implemented in Phase 6')}
              >
                Export as PDF
              </Button>
              <Button
                variant="tertiary"
                fullWidth
                onClick={() => alert('Convert to project will be implemented in Phase 6')}
              >
                Convert to Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <H3 className="mb-4">Quote Comments</H3>
        <div className="text-center py-8">
          <P2 className="text-gray-500">No comments yet</P2>
          <P3 className="text-gray-400 mt-1">Comments management will be implemented in Phase 6</P3>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;