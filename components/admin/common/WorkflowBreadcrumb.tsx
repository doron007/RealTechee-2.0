import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { P3 } from '../../typography';

interface WorkflowBreadcrumbProps {
  // Current item details
  currentType: 'request' | 'quote' | 'project';
  currentId: string;
  currentTitle?: string;
  
  // Related items for navigation
  requestId?: string;
  requestTitle?: string;
  quoteId?: string;
  quoteTitle?: string;
  projectId?: string;
  projectTitle?: string;
  
  // Additional quotes for requests (1:n relationship)
  relatedQuotes?: Array<{
    id: string;
    title?: string;
    status?: string;
  }>;
}

const WorkflowBreadcrumb: React.FC<WorkflowBreadcrumbProps> = ({
  currentType,
  currentId,
  currentTitle,
  requestId,
  requestTitle,
  quoteId,
  quoteTitle,
  projectId,
  projectTitle,
  relatedQuotes = []
}) => {
  const router = useRouter();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request': return '📝';
      case 'quote': return '💰';
      case 'project': return '🏗️';
      default: return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'request': return 'Request';
      case 'quote': return 'Quote';
      case 'project': return 'Project';
      default: return 'Item';
    }
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 text-sm">
        <P3 className="text-blue-600 font-medium">Workflow:</P3>
        
        {/* Request */}
        {requestId && (
          <>
            {currentType === 'request' ? (
              <div className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full">
                <span>{getTypeIcon('request')}</span>
                <P3 className="font-medium text-white">
                  {truncateText(requestTitle || currentTitle || `Request ${requestId.slice(0, 8)}`)}
                </P3>
              </div>
            ) : (
              <Link 
                href={`/admin/requests/${requestId}`}
                className="flex items-center space-x-1 bg-white hover:bg-blue-100 border border-blue-300 px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                <span>{getTypeIcon('request')}</span>
                <P3 className="text-blue-700 hover:text-blue-900">
                  {truncateText(requestTitle || `Request ${requestId.slice(0, 8)}`)}
                </P3>
              </Link>
            )}
            <span className="text-blue-400">→</span>
          </>
        )}

        {/* Quote(s) */}
        {quoteId ? (
          // Single quote
          <>
            {currentType === 'quote' ? (
              <div className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full">
                <span>{getTypeIcon('quote')}</span>
                <P3 className="font-medium text-white">
                  {truncateText(quoteTitle || currentTitle || `Quote ${quoteId.slice(0, 8)}`)}
                </P3>
              </div>
            ) : (
              <Link 
                href={`/admin/quotes/${quoteId}`}
                className="flex items-center space-x-1 bg-white hover:bg-blue-100 border border-blue-300 px-3 py-1 rounded-full transition-colors cursor-pointer"
              >
                <span>{getTypeIcon('quote')}</span>
                <P3 className="text-blue-700 hover:text-blue-900">
                  {truncateText(quoteTitle || `Quote ${quoteId.slice(0, 8)}`)}
                </P3>
              </Link>
            )}
            {projectId && <span className="text-blue-400">→</span>}
          </>
        ) : relatedQuotes.length > 0 ? (
          // Multiple quotes from request
          <>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-white border border-blue-300 px-3 py-1 rounded-full">
                <span>{getTypeIcon('quote')}</span>
                <P3 className="text-blue-700">
                  {relatedQuotes.length} Quote{relatedQuotes.length !== 1 ? 's' : ''}
                </P3>
              </div>
              
              {/* Show quote preview on hover */}
              <div className="relative group">
                <button className="text-blue-600 hover:text-blue-800">
                  <P3>ⓘ</P3>
                </button>
                <div className="absolute z-10 invisible group-hover:visible bg-white border border-gray-300 rounded-lg shadow-lg p-3 mt-1 min-w-64">
                  <P3 className="font-medium mb-2">Related Quotes:</P3>
                  {relatedQuotes.slice(0, 3).map((quote) => (
                    <div key={quote.id} className="mb-1">
                      <Link 
                        href={`/admin/quotes/${quote.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {truncateText(quote.title || `Quote ${quote.id.slice(0, 8)}`, 25)}
                        {quote.status && <span className="ml-2 text-gray-500">({quote.status})</span>}
                      </Link>
                    </div>
                  ))}
                  {relatedQuotes.length > 3 && (
                    <P3 className="text-gray-500 text-xs">
                      ...and {relatedQuotes.length - 3} more
                    </P3>
                  )}
                </div>
              </div>
            </div>
            {projectId && <span className="text-blue-400">→</span>}
          </>
        ) : currentType === 'quote' ? (
          // Current quote without navigation
          <>
            <div className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full">
              <span>{getTypeIcon('quote')}</span>
              <P3 className="font-medium text-white">
                {truncateText(currentTitle || `Quote ${currentId.slice(0, 8)}`)}
              </P3>
            </div>
            {projectId && <span className="text-blue-400">→</span>}
          </>
        ) : null}

        {/* Project */}
        {projectId && (
          currentType === 'project' ? (
            <div className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full">
              <span>{getTypeIcon('project')}</span>
              <P3 className="font-medium text-white">
                {truncateText(projectTitle || currentTitle || `Project ${projectId.slice(0, 8)}`)}
              </P3>
            </div>
          ) : (
            <Link 
              href={`/admin/projects/${projectId}`}
              className="flex items-center space-x-1 bg-white hover:bg-blue-100 border border-blue-300 px-3 py-1 rounded-full transition-colors cursor-pointer"
            >
              <span>{getTypeIcon('project')}</span>
              <P3 className="text-blue-700 hover:text-blue-900">
                {truncateText(projectTitle || `Project ${projectId.slice(0, 8)}`)}
              </P3>
            </Link>
          )
        )}

        {/* Current standalone item */}
        {!requestId && !quoteId && !projectId && (
          <div className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full">
            <span>{getTypeIcon(currentType)}</span>
            <P3 className="font-medium text-white">
              {truncateText(currentTitle || `${getTypeLabel(currentType)} ${currentId.slice(0, 8)}`)}
            </P3>
          </div>
        )}
      </div>

      {/* Additional workflow actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {currentType === 'request' && (
          <button
            onClick={() => router.push(`/admin/quotes/new?requestId=${currentId}`)}
            className="flex items-center space-x-1 bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm transition-colors"
          >
            <span>➕</span>
            <P3>Create Quote</P3>
          </button>
        )}
        
        {currentType === 'quote' && (
          <button
            onClick={() => router.push(`/admin/projects/new?quoteId=${currentId}`)}
            className="flex items-center space-x-1 bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm transition-colors"
          >
            <span>➕</span>
            <P3>Create Project</P3>
          </button>
        )}

        {relatedQuotes.length > 0 && (
          <button
            onClick={() => router.push(`/admin/quotes?requestId=${requestId}`)}
            className="flex items-center space-x-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm transition-colors"
          >
            <span>📋</span>
            <P3>View All Quotes</P3>
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkflowBreadcrumb;