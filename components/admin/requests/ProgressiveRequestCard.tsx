import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Image from 'next/image';
import { H4, H5, H6, P2, P3 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import { formatDateShort } from '../../../utils/formatUtils';
import { type FullyEnhancedRequest } from '../../../services/business/enhancedRequestsService';

// Progressive disclosure card component with three states: collapsed, basic, full
type CardState = 'collapsed' | 'basic' | 'full';

interface ProgressiveRequestCardProps {
  item: FullyEnhancedRequest;
  actions: Array<{
    label: string;
    icon?: string;
    onClick: (item: FullyEnhancedRequest) => void;
    variant?: 'primary' | 'secondary' | 'tertiary';
    tooltip?: string;
  }>;
  density: 'comfortable' | 'compact';
  allStatuses?: string[];
}

const ProgressiveRequestCard: React.FC<ProgressiveRequestCardProps> = ({ 
  item: request, 
  actions, 
  density = 'comfortable',
  allStatuses = [] 
}) => {
  const [cardState, setCardState] = useState<CardState>('collapsed');

  // Helper function to get intelligent status abbreviation
  const getStatusAbbreviation = (status: string, allStatuses: string[] = []): string => {
    const firstLetter = status.charAt(0).toUpperCase();
    
    // Check if any other status starts with the same letter
    const conflictingStatuses = allStatuses.filter(s => 
      s !== status && s.charAt(0).toUpperCase() === firstLetter
    );
    
    // If no conflicts, use single letter
    if (conflictingStatuses.length === 0) {
      return firstLetter;
    }
    
    // If conflicts, use smart two-letter combinations
    const statusMap: Record<string, string> = {
      'New': 'Ne',
      'In Review': 'IR',
      'Contacted': 'Co',
      'Scheduled': 'Sc',
      'Visited': 'Vi',
      'Quoted': 'Qu',
      'Approved': 'Ap',
      'Declined': 'De',
      'Archived': 'Ar'
    };
    
    return statusMap[status] || status.substring(0, 2);
  };

  // Toggle between collapsed and basic states on title row click
  const handleTitleRowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCardState(prev => prev === 'collapsed' ? 'basic' : 'collapsed');
  };

  // Handle card container click (only for full state collapse)
  const handleCardClick = (e: React.MouseEvent) => {
    // Only allow collapsing when in full state, and only if not clicking on interactive elements
    if (cardState === 'full' && 
        !(e.target as HTMLElement).closest('.action-buttons') && 
        !(e.target as HTMLElement).closest('.show-more-button') &&
        !(e.target as HTMLElement).closest('img') &&
        !(e.target as HTMLElement).closest('a') &&
        !(e.target as HTMLElement).closest('summary')) {
      setCardState('collapsed');
    }
  };

  // Show full details via separate button
  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCardState('full');
  };

  // Helper to split address for mobile
  const splitAddress = (address: string) => {
    const parts = address.split(',');
    if (parts.length >= 3) {
      const streetAddress = parts.slice(0, -2).join(',').trim();
      const cityStateZip = parts.slice(-2).join(',').trim();
      return { streetAddress, cityStateZip };
    }
    return { streetAddress: address, cityStateZip: '' };
  };

  const address = request.propertyAddress || 'No address provided';
  const { streetAddress, cityStateZip } = splitAddress(address);

  // Dynamic styling based on density
  const getDensityClasses = () => {
    if (cardState === 'collapsed') {
      return density === 'compact' 
        ? 'py-1 px-3' 
        : 'py-3 px-4';
    }
    return density === 'compact' ? 'p-4' : 'p-6';
  };

  const getMinHeight = () => {
    if (cardState === 'collapsed') {
      return density === 'compact' ? 'min-h-[36px]' : 'min-h-[48px]';
    }
    return '';
  };

  return (
    <div 
      className={`bg-white border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${getDensityClasses()}`}
      onClick={handleCardClick}
    >
      {/* COLLAPSED STATE - Compact table-row style */}
      {cardState === 'collapsed' && (
        <div className={`flex items-center justify-between ${getMinHeight()}`}>
          {/* Left: Status + Address - Clickable title row */}
          <div 
            className={`flex items-center flex-1 min-w-0 cursor-pointer ${density === 'compact' ? 'space-x-2' : 'space-x-3'}`}
            onClick={handleTitleRowClick}
          >
            {/* Status Badge */}
            <Tooltip title={`Status: ${request.status}`} arrow>
              <div className={`bg-orange-100 text-orange-800 rounded font-medium flex-shrink-0 ${
                density === 'compact' 
                  ? 'px-1.5 py-0.5 text-xs' 
                  : 'px-2 py-1 text-xs'
              }`}>
                {getStatusAbbreviation(request.status, allStatuses)}
              </div>
            </Tooltip>
            
            {/* Property Address - Mobile responsive */}
            <div className="flex-1 min-w-0">
              <div className="hidden sm:block">
                <P2 className={`font-medium truncate ${density === 'compact' ? 'text-sm' : ''}`}>
                  {address}
                </P2>
              </div>
              <div className="block sm:hidden">
                <P2 className={`font-medium ${density === 'compact' ? 'text-sm leading-tight' : 'leading-tight'}`}>
                  {streetAddress}
                </P2>
                {cityStateZip && (
                  <P3 className={`text-gray-500 ${density === 'compact' ? 'text-xs mt-0.5' : 'text-xs mt-1'}`}>
                    {cityStateZip}
                  </P3>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: CTA Buttons + Expand Icon */}
          <div className={`flex items-center flex-shrink-0 ${density === 'compact' ? 'space-x-1' : 'space-x-2'}`}>
            {/* CTA Buttons - Hidden on mobile, visible on tablet+ */}
            <div className={`hidden md:flex action-buttons ${density === 'compact' ? 'space-x-0.5' : 'space-x-1'}`}>
              {actions.map((action, index) => (
                <IconButton
                  key={index}
                  onClick={() => action.onClick(request)}
                  size="small"
                  title={action.tooltip || action.label}
                  sx={{ padding: density === 'compact' ? '4px' : '6px' }}
                >
                  {action.icon ? (
                    <Image 
                      src={action.icon} 
                      alt={action.label} 
                      width={density === 'compact' ? 12 : 14} 
                      height={density === 'compact' ? 12 : 14} 
                    />
                  ) : (
                    <span className="text-xs">{action.label.slice(0, 2)}</span>
                  )}
                </IconButton>
              ))}
            </div>
            
            {/* Expand Icon */}
            <div className={`flex items-center justify-center ${density === 'compact' ? 'px-1' : 'px-2'}`}>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Expand" 
                width={density === 'compact' ? 12 : 14} 
                height={density === 'compact' ? 12 : 14}
                className="text-gray-400 transition-transform duration-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* BASIC EXPANDED STATE - Table Column Parity */}
      {cardState === 'basic' && (
        <div className="space-y-4">
          {/* Header with Status and collapse indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800`}>
                {request.status}
              </span>
            </div>
            <button
              onClick={handleTitleRowClick}
              className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors"
              title="Collapse"
            >
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Collapse" 
                width={16} 
                height={16}
                className="transform rotate-180 transition-transform duration-200"
              />
            </button>
          </div>

          {/* Main Content Grid - Matches Table Columns Exactly */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
            
            {/* Property Address - Prominent placement */}
            <div className="lg:col-span-2 xl:col-span-3">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Property Address</P3>
                <H4 className="text-gray-900 break-words leading-relaxed">{address}</H4>
              </div>
            </div>

            {/* Created Date */}
            <div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 h-full">
                <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Created</P3>
                <P2 className="text-gray-900 font-semibold">{formatDateShort(request.businessCreatedDate || request.createdAt)}</P2>
              </div>
            </div>

            {/* Owner */}
            <div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 h-full">
                <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Owner</P3>
                <P2 className="text-gray-900 font-semibold break-words">{request.clientName || 'N/A'}</P2>
              </div>
            </div>

            {/* Agent */}
            <div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 h-full">
                <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Agent</P3>
                <P2 className="text-gray-900 font-semibold break-words">{request.agentName || 'N/A'}</P2>
              </div>
            </div>

            {/* Brokerage */}
            <div className="lg:col-span-2 xl:col-span-1">
              <div className="bg-white rounded-lg p-4 border border-gray-100 h-full">
                <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Brokerage</P3>
                <P2 className="text-gray-900 font-semibold break-words">{request.brokerage || 'N/A'}</P2>
              </div>
            </div>

            {/* Budget/Opportunity Value */}
            <div className="lg:col-span-1 xl:col-span-2">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-100 h-full">
                <P3 className="text-orange-600 text-xs font-medium uppercase tracking-wider mb-2">Budget</P3>
                <H4 className="text-orange-900 font-bold">
                  {request.budget || 'Not specified'}
                </H4>
              </div>
            </div>
          </div>

          {/* Action Buttons and Show More */}
          <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => action.onClick(request)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 shadow-sm hover:shadow-md ${
                    action.variant === 'primary' 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : action.variant === 'secondary'
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {action.icon && (
                    <Image 
                      src={action.icon} 
                      alt={action.label} 
                      width={16} 
                      height={16} 
                      className="invert" 
                    />
                  )}
                  {action.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleShowMore}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium text-sm transition-colors duration-200 show-more-button"
            >
              Show All Details
              <span className="text-xs">📝</span>
            </button>
          </div>
        </div>
      )}

      {/* FULL EXPANDED STATE - Complete Request Details */}
      {cardState === 'full' && (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white py-2 border-b border-gray-200">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <StatusPill status={request.status} />
                <H5 className="text-gray-900 break-words leading-relaxed">{request.message || 'Service Request'}</H5>
              </div>
              <P2 className="text-gray-600 break-words leading-relaxed ml-0">{address}</P2>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setCardState('collapsed'); }}
              className="flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors"
              title="Collapse"
            >
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Collapse" 
                width={16} 
                height={16}
                className="transform rotate-180 transition-transform duration-200"
              />
            </button>
          </div>

          {/* Request Information Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">📝</span>
              <H6 className="font-semibold text-orange-900">Request Information</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-orange-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Message</P3><P2 className="font-medium break-words">{request.message || 'No message provided'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Product</P3><P2 className="font-medium">{request.product || 'N/A'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Relation to Property</P3><P2 className="font-medium">{request.relationToProperty || 'N/A'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Budget</P3><P2 className="font-medium">{request.budget || 'Not specified'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Needs Financing</P3><P2 className="font-medium">{request.needFinance ? 'Yes' : 'No'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Lead Source</P3><P2 className="font-medium">{request.leadSource || 'N/A'}</P2></div>
              </div>
            </div>
          </details>

          {/* Client Information Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">👤</span>
              <H6 className="font-semibold text-blue-900">Client Information</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-blue-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Client Name</P3><P2 className="font-medium break-words">{request.clientName || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Client Email</P3><P2 className="font-medium break-words">{request.clientEmail || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Client Phone</P3><P2 className="font-medium">{request.clientPhone || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Agent</P3><P2 className="font-medium break-words">{request.agentName || 'N/A'}</P2></div>
            </div>
          </details>

          {/* Timeline Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">📅</span>
              <H6 className="font-semibold text-purple-900">Timeline</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-purple-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Created</P3><P2 className="font-medium">{formatDateShort(request.businessCreatedDate || request.createdAt)}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Assigned Date</P3><P2 className="font-medium">{request.assignedDate ? formatDateShort(request.assignedDate) : 'Not assigned'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Requested Visit</P3><P2 className="font-medium">{request.requestedVisitDateTime ? formatDateShort(request.requestedVisitDateTime) : 'Not requested'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Visit Date</P3><P2 className="font-medium">{request.visitDate ? formatDateShort(request.visitDate) : 'Not visited'}</P2></div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-300 sticky bottom-0 bg-white">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => action.onClick(request)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl ${
                  action.variant === 'primary' 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : action.variant === 'secondary'
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {action.icon && (
                  <Image 
                    src={action.icon} 
                    alt={action.label} 
                    width={18} 
                    height={18} 
                    className="invert" 
                  />
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveRequestCard;