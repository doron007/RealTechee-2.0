import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Image from 'next/image';
import { H4, H5, H6, P2, P3 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import ImageModal from '../../common/ui/ImageModal';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';
import { type FullyEnhancedProject } from '../../../services/enhancedProjectsService';

// Progressive disclosure card component with three states: collapsed, basic, full
type CardState = 'collapsed' | 'basic' | 'full';

interface ProgressiveProjectCardProps {
  item: FullyEnhancedProject;
  actions: Array<{
    label: string;
    icon?: string;
    onClick: (item: FullyEnhancedProject) => void;
    variant?: 'primary' | 'secondary' | 'tertiary';
    tooltip?: string;
  }>;
  density: 'comfortable' | 'compact';
  allStatuses?: string[];
}

const ProgressiveProjectCard: React.FC<ProgressiveProjectCardProps> = ({ 
  item: project, 
  actions, 
  density = 'comfortable',
  allStatuses = [] 
}) => {
  const [cardState, setCardState] = useState<CardState>('collapsed');
  const [gallerySize, setGallerySize] = useState<'small' | 'medium' | 'large'>('large');
  const [imageModal, setImageModal] = useState<{
    open: boolean;
    src: string;
    alt: string;
    description?: string;
  }>({
    open: false,
    src: '',
    alt: '',
    description: ''
  });

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
      'Active': 'Ac',
      'Approved': 'Ap', 
      'Pending': 'Pe',
      'Processing': 'Pr',
      'Completed': 'Co',
      'Cancelled': 'Ca',
      'On Hold': 'OH',
      'In Progress': 'IP',
      'Review': 'Re',
      'Rejected': 'Rj'
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

  // Handle image click to show modal
  const handleImageClick = (src: string, alt: string, description?: string) => {
    setImageModal({
      open: true,
      src,
      alt,
      description
    });
  };

  // Close image modal
  const handleImageModalClose = () => {
    setImageModal({
      open: false,
      src: '',
      alt: '',
      description: ''
    });
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

  const address = project.propertyAddress || project.title || 'No address provided';
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
            <Tooltip title={`Status: ${project.status}`} arrow>
              <div className={`bg-blue-100 text-blue-800 rounded font-medium flex-shrink-0 ${
                density === 'compact' 
                  ? 'px-1.5 py-0.5 text-xs' 
                  : 'px-2 py-1 text-xs'
              }`}>
                {getStatusAbbreviation(project.status, allStatuses)}
              </div>
            </Tooltip>
            
            {/* Address - Mobile responsive */}
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
                  onClick={() => action.onClick(project)}
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
            
            {/* Expand Icon - Make it clickable */}
            <button 
              className={`flex items-center justify-center hover:bg-gray-100 rounded transition-colors ${density === 'compact' ? 'px-1 py-1' : 'px-2 py-1'}`}
              onClick={handleTitleRowClick}
              title="Expand/Collapse card"
              type="button"
            >
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Expand" 
                width={density === 'compact' ? 12 : 14} 
                height={density === 'compact' ? 12 : 14}
                className="text-gray-400 transition-transform duration-200"
              />
            </button>
          </div>
        </div>
      )}

      {/* BASIC EXPANDED STATE - Table Column Parity */}
      {cardState === 'basic' && (
        <div className="space-y-4">
          {/* Header with Status and collapse indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                {project.status}
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
            
            {/* Address - Prominent placement */}
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
                <P2 className="text-gray-900 font-semibold">{formatDateShort(project.createdDate || project.createdAt)}</P2>
              </div>
            </div>

            {/* Owner */}
            <div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 h-full">
                <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Owner</P3>
                <P2 className="text-gray-900 font-semibold break-words">{project.clientName || 'N/A'}</P2>
              </div>
            </div>

            {/* Agent */}
            <div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 h-full">
                <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Agent</P3>
                <P2 className="text-gray-900 font-semibold break-words">{project.agentName || 'N/A'}</P2>
              </div>
            </div>

            {/* Brokerage */}
            <div className="lg:col-span-2 xl:col-span-1">
              <div className="bg-white rounded-lg p-4 border border-gray-100 h-full">
                <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Brokerage</P3>
                <P2 className="text-gray-900 font-semibold break-words">{project.brokerage || 'N/A'}</P2>
              </div>
            </div>

            {/* Opportunity Value */}
            <div className="lg:col-span-1 xl:col-span-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 h-full">
                <P3 className="text-blue-600 text-xs font-medium uppercase tracking-wider mb-2">Opportunity Value</P3>
                <H4 className="text-blue-900 font-bold">
                  {(project.addedValue || project.boostPrice) ? formatCurrencyFull(project.addedValue || project.boostPrice) : 'N/A'}
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
                  onClick={() => action.onClick(project)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 shadow-sm hover:shadow-md ${
                    action.variant === 'primary' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
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
              <span className="text-xs">📋</span>
            </button>
          </div>
        </div>
      )}

      {/* FULL EXPANDED STATE - Complete Project Details */}
      {cardState === 'full' && (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white py-2 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <StatusPill status={project.status} />
              <H5 className="text-gray-900 break-words leading-relaxed">{address}</H5>
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

          {/* Property Information Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">🏠</span>
              <H6 className="font-semibold text-blue-900">Property Information</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-blue-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Description - moved from Project Details */}
              {project.description && (
                <div>
                  <P3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Description</P3>
                  <P2 className="whitespace-pre-wrap break-words">{project.description}</P2>
                </div>
              )}
              
              {/* Property Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Address</P3><P2 className="font-medium break-words">{project.title || 'N/A'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Property Type</P3><P2 className="font-medium">{project.propertyType || 'N/A'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Bedrooms</P3><P2 className="font-medium">{project.bedrooms || 'N/A'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Bathrooms</P3><P2 className="font-medium">{project.bathrooms || 'N/A'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Square Feet</P3><P2 className="font-medium">{project.sizeSqft ? `${project.sizeSqft} sqft` : 'N/A'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Year Built</P3><P2 className="font-medium">{project.yearBuilt || 'N/A'}</P2></div>
                <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Floors</P3><P2 className="font-medium">{project.floors || 'N/A'}</P2></div>
                {project.zillowLink && <div className="md:col-span-2" onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Zillow Link</P3><a href={project.zillowLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all text-sm">View on Zillow</a></div>}
              </div>
            </div>
          </details>

          {/* Homeowners Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">🏠</span>
              <H6 className="font-semibold text-emerald-900">Homeowners</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-emerald-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Primary Homeowner</P3><P2 className="font-medium break-words">{project.clientName || project.homeownerName || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email</P3><P2 className="font-medium break-words">{project.clientEmail || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phone</P3><P2 className="font-medium">{project.clientPhone || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Homeowner 2</P3><P2 className="font-medium break-words">{project.homeowner2Name || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Homeowner 3</P3><P2 className="font-medium break-words">{project.homeowner3Name || 'N/A'}</P2></div>
            </div>
          </details>

          {/* Agent & Brokerage Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">👥</span>
              <H6 className="font-semibold text-green-900">Agent & Brokerage</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-green-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Owner/Client</P3><P2 className="font-medium break-words">{project.clientName || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Agent Name</P3><P2 className="font-medium break-words">{project.agentName || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Brokerage</P3><P2 className="font-medium break-words">{project.brokerage || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Selected Products</P3><P2 className="font-medium">{project.selectedProducts || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Project Manager</P3><P2 className="font-medium break-words">{project.projectManagerEmailList || 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">PM Phone</P3><P2 className="font-medium">{project.projectManagerPhone || 'N/A'}</P2></div>
            </div>
          </details>

          {/* Financial Information Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">💰</span>
              <H6 className="font-semibold text-yellow-900">Financial Information</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-yellow-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Listing Price</P3><P2 className="font-medium text-green-700">{project.listingPrice ? formatCurrencyFull(project.listingPrice) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Original Value</P3><P2 className="font-medium">{project.originalValue ? formatCurrencyFull(project.originalValue) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Boost Price</P3><P2 className="font-medium text-blue-700">{project.boostPrice ? formatCurrencyFull(project.boostPrice) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Added Value</P3><P2 className="font-medium text-blue-700">{project.addedValue ? formatCurrencyFull(project.addedValue) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Gross Profit</P3><P2 className="font-medium text-green-700">{typeof project.grossProfit === 'string' ? project.grossProfit : project.grossProfit ? formatCurrencyFull(project.grossProfit) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Est. Gross Profit</P3><P2 className="font-medium">{typeof project.estimatedGrossProfit === 'string' ? project.estimatedGrossProfit : project.estimatedGrossProfit ? formatCurrencyFull(project.estimatedGrossProfit) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Rev Share Amount</P3><P2 className="font-medium">{project.revShareAmount ? formatCurrencyFull(project.revShareAmount) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Sale Price</P3><P2 className="font-medium">{project.salePrice ? formatCurrencyFull(project.salePrice) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Loan Balance</P3><P2 className="font-medium">{typeof project.loanBalance === 'string' ? project.loanBalance : project.loanBalance ? formatCurrencyFull(project.loanBalance) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Booster Est. Cost</P3><P2 className="font-medium">{project.boosterEstimatedCost ? formatCurrencyFull(project.boosterEstimatedCost) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Booster Actual Cost</P3><P2 className="font-medium">{project.boosterActualCost ? formatCurrencyFull(project.boosterActualCost) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Paid Cost</P3><P2 className="font-medium">{typeof project.paidCost === 'string' ? project.paidCost : project.paidCost ? formatCurrencyFull(project.paidCost) : 'N/A'}</P2></div>
            </div>
          </details>

          {/* Important Dates Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">📅</span>
              <H6 className="font-semibold text-purple-900">Important Dates</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-purple-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Created Date</P3><P2 className="font-medium">{(project.createdDate || project.createdAt) ? formatDateShort(project.createdDate || project.createdAt) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Request Date</P3><P2 className="font-medium">{project.requestDate ? formatDateShort(project.requestDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Proposal Date</P3><P2 className="font-medium">{project.proposalDate ? formatDateShort(project.proposalDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Visit Review Date</P3><P2 className="font-medium">{project.visitReviewDate ? formatDateShort(project.visitReviewDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quote Sent Date</P3><P2 className="font-medium">{project.quoteSentDate ? formatDateShort(project.quoteSentDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quote Opened Date</P3><P2 className="font-medium">{project.quoteOpenedDate ? formatDateShort(project.quoteOpenedDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quote Signed Date</P3><P2 className="font-medium">{project.quoteSignedDate ? formatDateShort(project.quoteSignedDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contract Date</P3><P2 className="font-medium">{project.contractDate ? formatDateShort(project.contractDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contract Sent Date</P3><P2 className="font-medium">{project.contractSentDate ? formatDateShort(project.contractSentDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contracting Start Date</P3><P2 className="font-medium">{project.contractingStartDate ? formatDateShort(project.contractingStartDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Underwriting Date</P3><P2 className="font-medium">{project.underwritingDate ? formatDateShort(project.underwritingDate) : 'N/A'}</P2></div>
              <div onClick={(e) => e.stopPropagation()}><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Updated Date</P3><P2 className="font-medium">{project.updatedDate ? formatDateShort(project.updatedDate) : 'N/A'}</P2></div>
            </div>
          </details>

          {/* Gallery Group */}
          {project.gallery && (
            <details open className="group">
              <summary 
                className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg cursor-pointer hover:bg-pink-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-lg">🖼️</span>
                <H6 className="font-semibold text-pink-900">Gallery</H6>
                
                {/* Thumbnail Size Selector */}
                <div className="flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
                  <P3 className="text-pink-700 text-xs">Size:</P3>
                  <select 
                    value={gallerySize} 
                    onChange={(e) => setGallerySize(e.target.value as 'small' | 'medium' | 'large')}
                    className="text-xs border border-pink-200 rounded px-1 py-0.5 bg-white text-pink-800"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                
                <Image 
                  src="/assets/icons/ic-arrow-down.svg" 
                  alt="Toggle" 
                  width={14} 
                  height={14}
                  className="ml-auto text-pink-600 group-open:rotate-180 transition-transform duration-200"
                />
              </summary>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <div className={`grid gap-3 ${
                  gallerySize === 'small' 
                    ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8' 
                    : gallerySize === 'medium'
                    ? 'grid-cols-3 md:grid-cols-5 lg:grid-cols-7'
                    : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
                }`}>
                  {(() => {
                    try {
                      const galleryData = JSON.parse(project.gallery);
                      return galleryData.slice(0, 12).map((item: any, index: number) => (
                        <div key={index} className="relative group">
                          <div 
                            className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(
                                item.src || item.url || item, 
                                item.alt || item.title || `Gallery ${index + 1}`,
                                item.description
                              );
                            }}
                          >
                            <Image 
                              src={item.src || item.url || item} 
                              alt={item.alt || item.title || `Gallery ${index + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {/* Hover overlay with expand hint */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                                <Image 
                                  src="/assets/icons/ic-newpage.svg" 
                                  alt="View larger" 
                                  width={16} 
                                  height={16}
                                />
                              </div>
                            </div>
                          </div>
                          {item.description && (
                            <P3 className="text-gray-600 text-xs mt-1 truncate">{item.description}</P3>
                          )}
                        </div>
                      ));
                    } catch (e) {
                      return <P3 className="text-gray-500 text-sm">Gallery data format error</P3>;
                    }
                  })()}
                </div>
                {(() => {
                  try {
                    const galleryData = JSON.parse(project.gallery);
                    if (galleryData.length > 12) {
                      return <P3 className="text-gray-500 text-sm mt-3">... and {galleryData.length - 12} more images</P3>;
                    }
                  } catch (e) {
                    // Ignore error
                  }
                  return null;
                })()}
              </div>
            </details>
          )}

          {/* Project Details section removed - description moved to Property Information */}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-300 sticky bottom-0 bg-white">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => action.onClick(project)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl ${
                  action.variant === 'primary' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
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

      {/* Image Modal */}
      <ImageModal
        open={imageModal.open}
        imageSrc={imageModal.src}
        imageAlt={imageModal.alt}
        imageDescription={imageModal.description}
        onClose={handleImageModalClose}
      />
    </div>
  );
};

export default ProgressiveProjectCard;