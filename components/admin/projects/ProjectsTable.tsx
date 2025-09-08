import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Box, IconButton, Tooltip, TextField, Select, MenuItem, FormControl, InputLabel, Button, Pagination, TablePagination } from '@mui/material';
import { ViewAgenda, ViewComfy, TableChart, ViewModule } from '@mui/icons-material';
import Image from 'next/image';
import { H3, H4, H5, H6, P1, P2, P3 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import ImageModal from '../../common/ui/ImageModal';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';
import { projectsService, type EnhancedProject } from '../../../services/business/projectsService';
import { enhancedProjectsService, type FullyEnhancedProject } from '../../../services/business/enhancedProjectsService';
import { memoryMonitor } from '../../../utils/memoryMonitor';

interface ProjectsTableProps {
  onRefresh?: () => void;
}

// Progressive disclosure card component with three states: collapsed, basic, full
type CardState = 'collapsed' | 'basic' | 'full';

const ProjectCard: React.FC<{
  project: FullyEnhancedProject;
  onOpenProject: (id: string) => void;
  onEditProject: (id: string) => void;
  onArchiveProject: (id: string) => void;
  allStatuses?: string[];
  density?: 'comfortable' | 'compact';
}> = ({ project, onOpenProject, onEditProject, onArchiveProject, allStatuses = [], density = 'comfortable' }) => {
  const [cardState, setCardState] = useState<CardState>('collapsed');
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
              <IconButton
                onClick={() => onOpenProject(project.id)}
                size="small"
                title="Open Project"
                sx={{ padding: density === 'compact' ? '4px' : '6px' }}
              >
                <Image src="/assets/icons/ic-newpage.svg" alt="Open" width={density === 'compact' ? 12 : 14} height={density === 'compact' ? 12 : 14} />
              </IconButton>
              <IconButton
                onClick={() => onEditProject(project.id)}
                size="small"
                title="Edit Project"
                sx={{ padding: density === 'compact' ? '4px' : '6px' }}
              >
                <Image src="/assets/icons/ic-edit.svg" alt="Edit" width={density === 'compact' ? 12 : 14} height={density === 'compact' ? 12 : 14} />
              </IconButton>
              <IconButton
                onClick={() => onArchiveProject(project.id)}
                size="small"
                title="Delete Project"
                sx={{ padding: density === 'compact' ? '4px' : '6px' }}
              >
                <Image src="/assets/icons/ic-delete.svg" alt="Delete" width={density === 'compact' ? 12 : 14} height={density === 'compact' ? 12 : 14} />
              </IconButton>
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
              <StatusPill status={project.status} />
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
              <button
                onClick={() => onOpenProject(project.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Image src="/assets/icons/ic-newpage.svg" alt="Open" width={16} height={16} className="invert" />
                Open Project
              </button>
              
              <button
                onClick={() => onEditProject(project.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Image src="/assets/icons/ic-edit.svg" alt="Edit" width={16} height={16} className="invert" />
                Edit
              </button>
              
              <button
                onClick={() => onArchiveProject(project.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Image src="/assets/icons/ic-delete.svg" alt="Delete" width={16} height={16} className="invert" />
                Delete
              </button>
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

      {/* FULL EXPANDED STATE - Complete Project Details with Collapsible Groups */}
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
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Address</P3><P2 className="font-medium break-words">{project.title || 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Property Type</P3><P2 className="font-medium">{project.propertyType || 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Bedrooms</P3><P2 className="font-medium">{project.bedrooms || 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Bathrooms</P3><P2 className="font-medium">{project.bathrooms || 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Square Feet</P3><P2 className="font-medium">{project.sizeSqft ? `${project.sizeSqft} sqft` : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Year Built</P3><P2 className="font-medium">{project.yearBuilt || 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Floors</P3><P2 className="font-medium">{project.floors || 'N/A'}</P2></div>
              {project.zillowLink && <div className="md:col-span-2"><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Zillow Link</P3><a href={project.zillowLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all text-sm">View on Zillow</a></div>}
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
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Primary Homeowner</P3><P2 className="font-medium break-words">{project.clientName || project.homeownerName || 'N/A'}</P2></div>
              {project.clientEmail && <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email</P3><P2 className="font-medium break-words">{project.clientEmail}</P2></div>}
              {project.clientPhone && <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phone</P3><P2 className="font-medium">{project.clientPhone}</P2></div>}
              {project.homeowner2Name && <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Homeowner 2</P3><P2 className="font-medium break-words">{project.homeowner2Name}</P2></div>}
              {project.homeowner3Name && <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Homeowner 3</P3><P2 className="font-medium break-words">{project.homeowner3Name}</P2></div>}
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
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Owner/Client</P3><P2 className="font-medium break-words">{project.clientName || 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Agent Name</P3><P2 className="font-medium break-words">{project.agentName || 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Brokerage</P3><P2 className="font-medium break-words">{project.brokerage || 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Selected Products</P3><P2 className="font-medium">{project.selectedProducts || 'N/A'}</P2></div>
              {project.projectManagerEmailList && <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Project Manager</P3><P2 className="font-medium break-words">{project.projectManagerEmailList}</P2></div>}
              {project.projectManagerPhone && <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">PM Phone</P3><P2 className="font-medium">{project.projectManagerPhone}</P2></div>}
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
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Listing Price</P3><P2 className="font-medium text-green-700">{project.listingPrice ? formatCurrencyFull(project.listingPrice) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Original Value</P3><P2 className="font-medium">{project.originalValue ? formatCurrencyFull(project.originalValue) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Boost Price</P3><P2 className="font-medium text-blue-700">{project.boostPrice ? formatCurrencyFull(project.boostPrice) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Added Value</P3><P2 className="font-medium text-blue-700">{project.addedValue ? formatCurrencyFull(project.addedValue) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Gross Profit</P3><P2 className="font-medium text-green-700">{typeof project.grossProfit === 'string' ? project.grossProfit : project.grossProfit ? formatCurrencyFull(project.grossProfit) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Est. Gross Profit</P3><P2 className="font-medium">{typeof project.estimatedGrossProfit === 'string' ? project.estimatedGrossProfit : project.estimatedGrossProfit ? formatCurrencyFull(project.estimatedGrossProfit) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Rev Share Amount</P3><P2 className="font-medium">{project.revShareAmount ? formatCurrencyFull(project.revShareAmount) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Sale Price</P3><P2 className="font-medium">{project.salePrice ? formatCurrencyFull(project.salePrice) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Loan Balance</P3><P2 className="font-medium">{typeof project.loanBalance === 'string' ? project.loanBalance : project.loanBalance ? formatCurrencyFull(project.loanBalance) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Booster Est. Cost</P3><P2 className="font-medium">{project.boosterEstimatedCost ? formatCurrencyFull(project.boosterEstimatedCost) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Booster Actual Cost</P3><P2 className="font-medium">{project.boosterActualCost ? formatCurrencyFull(project.boosterActualCost) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Paid Cost</P3><P2 className="font-medium">{typeof project.paidCost === 'string' ? project.paidCost : project.paidCost ? formatCurrencyFull(project.paidCost) : 'N/A'}</P2></div>
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
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Created Date</P3><P2 className="font-medium">{formatDateShort(project.createdDate || project.createdAt)}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Request Date</P3><P2 className="font-medium">{project.requestDate ? formatDateShort(project.requestDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Proposal Date</P3><P2 className="font-medium">{project.proposalDate ? formatDateShort(project.proposalDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Visit Review Date</P3><P2 className="font-medium">{project.visitReviewDate ? formatDateShort(project.visitReviewDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quote Sent Date</P3><P2 className="font-medium">{project.quoteSentDate ? formatDateShort(project.quoteSentDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quote Opened Date</P3><P2 className="font-medium">{project.quoteOpenedDate ? formatDateShort(project.quoteOpenedDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quote Signed Date</P3><P2 className="font-medium">{project.quoteSignedDate ? formatDateShort(project.quoteSignedDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contract Date</P3><P2 className="font-medium">{project.contractDate ? formatDateShort(project.contractDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contract Sent Date</P3><P2 className="font-medium">{project.contractSentDate ? formatDateShort(project.contractSentDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contracting Start</P3><P2 className="font-medium">{project.contractingStartDate ? formatDateShort(project.contractingStartDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Underwriting Date</P3><P2 className="font-medium">{project.underwritingDate ? formatDateShort(project.underwritingDate) : 'N/A'}</P2></div>
              <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Updated Date</P3><P2 className="font-medium">{project.updatedDate ? formatDateShort(project.updatedDate) : 'N/A'}</P2></div>
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
                <Image 
                  src="/assets/icons/ic-arrow-down.svg" 
                  alt="Toggle" 
                  width={14} 
                  height={14}
                  className="ml-auto text-pink-600 group-open:rotate-180 transition-transform duration-200"
                />
              </summary>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
                                item.src || item.url, 
                                item.alt || item.title || `Gallery ${index + 1}`,
                                item.description
                              );
                            }}
                          >
                            <Image 
                              src={item.src || item.url} 
                              alt={item.alt || item.title || `Gallery ${index + 1}`}
                              fill
                              sizes="80px"
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              unoptimized={true}
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

          {/* Project Details Group */}
          <details open className="group">
            <summary 
              className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-lg">📋</span>
              <H6 className="font-semibold text-gray-900">Project Details</H6>
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Toggle" 
                width={14} 
                height={14}
                className="ml-auto text-gray-600 group-open:rotate-180 transition-transform duration-200"
              />
            </summary>
            <div className="mt-3 space-y-4 p-4 bg-gray-50 rounded-lg">
              {project.description && (
                <div>
                  <P3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Description</P3>
                  <P2 className="leading-relaxed break-words">{project.description}</P2>
                </div>
              )}
              {project.officeNotes && (
                <div>
                  <P3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Office Notes</P3>
                  <P2 className="leading-relaxed break-words whitespace-pre-wrap">{project.officeNotes}</P2>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Project Admin ID</P3><P2 className="font-medium break-all text-sm">{project.projectAdminProjectId || 'N/A'}</P2></div>
                <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Status Order</P3><P2 className="font-medium">{project.statusOrder || 'N/A'}</P2></div>
                <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Visitor ID</P3><P2 className="font-medium break-all text-sm">{project.visitorId || 'N/A'}</P2></div>
                <div><P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">Exclude from Dashboard</P3><P2 className="font-medium">{project.excludeFromDashboard ? 'Yes' : 'No'}</P2></div>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-300 sticky bottom-0 bg-white">
            <button
              onClick={() => onOpenProject(project.id)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <Image src="/assets/icons/ic-newpage.svg" alt="Open" width={18} height={18} className="invert" />
              Open Project
            </button>
            
            <button
              onClick={() => onEditProject(project.id)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <Image src="/assets/icons/ic-edit.svg" alt="Edit" width={18} height={18} className="invert" />
              Edit Project
            </button>
            
            <button
              onClick={() => onArchiveProject(project.id)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <Image src="/assets/icons/ic-delete.svg" alt="Delete" width={18} height={18} className="invert" />
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        open={imageModal.open}
        onClose={handleImageModalClose}
        imageSrc={imageModal.src}
        imageAlt={imageModal.alt}
        imageDescription={imageModal.description}
      />
    </div>
  );
};

const ProjectsTable: React.FC<ProjectsTableProps> = ({ onRefresh }) => {
  const router = useRouter();
  const [projects, setProjects] = useState<FullyEnhancedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  
  // Cards view state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'address' | 'created' | 'opportunity' | 'status'>('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination state for cards view
  const [cardsPage, setCardsPage] = useState(0);
  const [cardsPageSize, setCardsPageSize] = useState(10);
  
  // Helper functions for cookie storage
  const getCookie = (name: string): string | null => {
    if (typeof document !== 'undefined') {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document !== 'undefined') {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
  };

  // Density state for cards view - default to compact for better mobile experience
  const [cardsDensity, setCardsDensity] = useState<'comfortable' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      // Check cookie first, then localStorage, then default to compact
      const cookieValue = getCookie('admin-projects-density');
      const localValue = localStorage.getItem('admin-projects-density');
      return (cookieValue || localValue) as 'comfortable' | 'compact' || 'compact';
    }
    return 'compact';
  });
  
  // View mode state for hybrid approach (cards vs table)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      // Check cookie first, then localStorage, then default to cards
      const cookieValue = getCookie('admin-projects-view-mode');
      const localValue = localStorage.getItem('admin-projects-view-mode');
      return (cookieValue || localValue) as 'cards' | 'table' || 'cards';
    }
    return 'cards';
  });

  // Seed project ID for safe testing as per plan
  const SEED_PROJECT_ID = '490209a8-d20a-bae1-9e01-1da356be8a93';

  // Handle responsive layout and column visibility
  useEffect(() => {
    const updateResponsiveLayout = () => {
      const width = window.innerWidth;
      
      // Force cards view for xs, sm, md breakpoints (< 1280px), table view only for lg+ screens
      const forceMobile = width < 1280;
      setIsMobile(forceMobile || viewMode === 'cards');
      
      // Debug information for troubleshooting
      if (typeof window !== 'undefined') {
        (window as any).projectsDebugInfo = {
          isMobile: forceMobile || viewMode === 'cards',
          windowWidth: width,
          projectsLength: projects.length,
          loading,
          error,
          switchReason: width < 1280 ? 'cards-view-breakpoint' : 'table-view-allowed'
        };
      }
      
      if (forceMobile || viewMode === 'cards') {
        // Mobile/Compressed: Use card layout instead of table
        setColumnVisibility({});
      } else if (width < 1024) {
        // Tablet: Show essential columns only
        setColumnVisibility({
          status: true,
          address: true,
          created: false,
          clientName: true,
          agentName: false,
          opportunity: true,
          brokerage: false,
        });
      } else if (width < 1440) {
        // Small desktop: Hide less important columns
        setColumnVisibility({
          status: true,
          address: true,
          created: true,
          clientName: true,
          agentName: false,
          opportunity: true,
          brokerage: false,
        });
      } else {
        // Large desktop: Show all columns
        setColumnVisibility({
          status: true,
          address: true,
          created: true,
          clientName: true,
          agentName: true,
          opportunity: true,
          brokerage: true,
        });
      }
    };

    // Initial call
    updateResponsiveLayout();
    
    // Add multiple event listeners for better compatibility
    window.addEventListener('resize', updateResponsiveLayout);
    window.addEventListener('orientationchange', updateResponsiveLayout);
    
    // Also trigger on viewport size changes (important for Puppeteer)
    const mediaQuery = window.matchMedia('(max-width: 1279px)');
    const handleMediaQuery = (e: MediaQueryListEvent) => {
      updateResponsiveLayout(); // Let updateResponsiveLayout handle isMobile logic
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaQuery);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaQuery);
    }
    
    // Force update after a short delay (helps with Puppeteer)
    const timeout = setTimeout(updateResponsiveLayout, 100);
    
    // Additional trigger for Puppeteer viewport changes
    let lastWidth = window.innerWidth;
    const intervalId = setInterval(() => {
      const currentWidth = window.innerWidth;
      if (Math.abs(currentWidth - lastWidth) > 10) {
        // Significant width change detected
        lastWidth = currentWidth;
        updateResponsiveLayout();
      }
    }, 500);
    
    return () => {
      window.removeEventListener('resize', updateResponsiveLayout);
      window.removeEventListener('orientationchange', updateResponsiveLayout);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaQuery);
      } else {
        mediaQuery.removeListener(handleMediaQuery);
      }
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, [projects.length, viewMode, loading, error]); // Re-run when projects data, view mode, loading, or error state changes

  // Load projects function
  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      memoryMonitor.track('ProjectsTable: Before loading');
      
      const result = await enhancedProjectsService.getFullyEnhancedProjects();

      if (result.success && result.data) {
        setProjects(result.data);
        memoryMonitor.track(`ProjectsTable: Loaded ${result.data.length} projects`);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Error loading projects');
      memoryMonitor.track('ProjectsTable: Error occurred');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function only uses state setters

  useEffect(() => {
    loadProjects();

    // Cleanup function to clear cache when component unmounts
    return () => {
      if (process.env.NODE_ENV === 'development') {
        memoryMonitor.track('ProjectsTable: Component unmounting');
        // Clear cache to free memory (only in development)
        projectsService.clearCache();
      }
    };
  }, [loadProjects]);


  const handleOpenProject = useCallback((projectId: string) => {
    window.open(`/project?projectId=${projectId}`, '_blank');
  }, []);

  const handleEditProject = useCallback((projectId: string) => {
    router.push(`/admin/projects/${projectId}`);
  }, [router]);

  const handleArchiveProject = useCallback(async (projectId: string) => {
    // Safety check - only allow operations on seed project
    if (projectId !== SEED_PROJECT_ID) {
      alert('For safety, operations are only allowed on the seed project during testing');
      return;
    }

    const confirmed = confirm('Archive this project?');
    if (!confirmed) return;

    // In Phase 3, we'll just show success message - actual implementation would update status
    alert('Project archived successfully! (Phase 3 - simulated action)');
  }, [SEED_PROJECT_ID]);

  // Filter, search, sort, and paginate projects for cards view
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        (project.propertyAddress || project.title || '').toLowerCase().includes(term) ||
        (project.clientName || '').toLowerCase().includes(term) ||
        (project.agentName || '').toLowerCase().includes(term) ||
        (project.status || '').toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'address':
          aValue = (a.propertyAddress || a.title || '').toLowerCase();
          bValue = (b.propertyAddress || b.title || '').toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdDate || a.createdAt || new Date()).getTime();
          bValue = new Date(b.createdDate || b.createdAt || new Date()).getTime();
          break;
        case 'opportunity':
          aValue = a.addedValue || a.boostPrice || 0;
          bValue = b.addedValue || b.boostPrice || 0;
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, searchTerm, statusFilter, sortField, sortDirection]);

  // Paginated projects for cards view
  const paginatedProjects = useMemo(() => {
    const startIndex = cardsPage * cardsPageSize;
    const endIndex = startIndex + cardsPageSize;
    return filteredAndSortedProjects.slice(startIndex, endIndex);
  }, [filteredAndSortedProjects, cardsPage, cardsPageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredAndSortedProjects.length / cardsPageSize);
  const hasNextPage = cardsPage < totalPages - 1;
  const hasPrevPage = cardsPage > 0;

  // Reset page when filters change
  useEffect(() => {
    setCardsPage(0);
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  // Persist view mode preference in both localStorage and cookies
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-projects-view-mode', viewMode);
      setCookie('admin-projects-view-mode', viewMode);
    }
  }, [viewMode]);

  // Persist density preference in both localStorage and cookies
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-projects-density', cardsDensity);
      setCookie('admin-projects-density', cardsDensity);
    }
  }, [cardsDensity]);

  // Handle view mode toggle
  const handleViewModeToggle = () => {
    const newMode = viewMode === 'cards' ? 'table' : 'cards';
    setViewMode(newMode);
    
    // Analytics tracking (placeholder for future implementation)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'view_mode_toggle', {
        event_category: 'admin_interface',
        event_label: newMode,
        value: 1
      });
    }
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean)));
    return statuses.sort();
  }, [projects]);

  const columns = useMemo<MRT_ColumnDef<FullyEnhancedProject>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        enableSorting: true,
        enableResizing: true,
        enableHiding: false, // Always show status
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          return (
            <div className="mb-2">
              <StatusPill status={status} />
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.propertyAddress || row.title || 'No address provided',
        id: 'address',
        header: 'Address',
        size: 200,
        enableSorting: true,
        enableResizing: true,
        enableHiding: false, // Always show address (primary info)
        Cell: ({ cell }) => (
          <div title={cell.getValue<string>()}>
            <P2 className="max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg break-words">
              {cell.getValue<string>()}
            </P2>
          </div>
        ),
      },
      {
        accessorFn: (row) => row.createdDate || row.createdAt,
        id: 'created',
        header: 'Created',
        size: 120,
        enableHiding: true, // Can hide on mobile
        Cell: ({ cell }) => (
          <P2>{formatDateShort(cell.getValue<string>())}</P2>
        ),
      },
      {
        accessorKey: 'clientName',
        header: 'Owner',
        size: 130,
        enableHiding: true, // Can hide on mobile
        Cell: ({ cell }) => (
          <div title={cell.getValue<string>() || 'N/A'}>
            <P2 className="max-w-xs truncate">
              {cell.getValue<string>() || 'N/A'}
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
          <div title={cell.getValue<string>() || 'N/A'}>
            <P2 className="max-w-xs truncate">
              {cell.getValue<string>() || 'N/A'}
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
          <div title={cell.getValue<string>()}>
            <P2 className="max-w-xs truncate">
              {cell.getValue<string>()}
            </P2>
          </div>
        ),
      },
      {
        accessorFn: (row) => row.addedValue || row.boostPrice,
        id: 'opportunity',
        header: 'Opportunity',
        size: 110,
        enableHiding: true, // Can hide on mobile
        Cell: ({ cell }) => (
          <P2>{formatCurrencyFull(cell.getValue<number>())}</P2>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        size: 120,
        enableHiding: false, // Always show actions
        enableSorting: false, // Actions column should not be sortable
        enableColumnFilter: false, // Actions column should not be filterable
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Tooltip title="Open Project">
              <IconButton
                onClick={() => handleOpenProject(row.original.id)}
                sx={{ padding: '4px', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
              >
                <Image
                  src="/assets/icons/ic-newpage.svg"
                  alt="Open"
                  width={16}
                  height={16}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Edit Project">
              <IconButton
                onClick={() => handleEditProject(row.original.id)}
                sx={{ padding: '4px', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
              >
                <Image
                  src="/assets/icons/ic-edit.svg"
                  alt="Edit"
                  width={16}
                  height={16}
                />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Project">
              <IconButton
                onClick={() => handleArchiveProject(row.original.id)}
                sx={{ padding: '4px', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
              >
                <Image
                  src="/assets/icons/ic-delete.svg"
                  alt="Delete"
                  width={16}
                  height={16}
                />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [handleOpenProject, handleEditProject, handleArchiveProject]
  );

  const table = useMaterialReactTable({
    columns,
    data: projects,
    enableRowSelection: false, // Disable to prevent selection column
    enableColumnOrdering: true,
    enableColumnActions: false, // Disable built-in column actions 
    enableRowActions: false, // Disable to prevent actions column
    enableColumnFilterModes: true,
    enableColumnResizing: true,
    enableColumnDragging: false, // Disabled by default as requested
    enableHiding: true,
    enableGlobalFilter: true,
    enableFilters: true,
    enablePagination: true,
    enableSorting: true,
    enableSortingRemoval: false,
    enableBottomToolbar: true,
    enableTopToolbar: true,
    enableFullScreenToggle: false, // DISABLE to prevent extra columns
    enableDensityToggle: false, // DISABLE to prevent extra columns
    enableGlobalFilterModes: true,
    columnFilterModeOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
    globalFilterModeOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
    // Table layout constraints to prevent overflow
    layoutMode: 'semantic',
    columnResizeMode: 'onChange',
    // Page size options: 10, 25, 50, All
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, 100] as any,
      showFirstButton: true,
      showLastButton: true,
    },
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [{ id: 'created', desc: true }],
      showGlobalFilter: true,
      // Hide less important columns on smaller screens
      columnVisibility: {
        created: true,
        clientName: true,
        agentName: true,
        brokerage: true,
        opportunity: true,
      },
    },
    // Use dynamic column visibility state
    state: {
      columnVisibility,
      isLoading: loading,
      showAlertBanner: !!error,
    },
    onColumnVisibilityChange: setColumnVisibility,
    // Table container constraints to prevent overflow
    muiTableContainerProps: {
      sx: {
        maxWidth: '100%',
        overflowX: 'hidden', // Changed from 'auto' to prevent unnecessary scrollbars
        overflowY: 'visible',
        '& .MuiTable-root': {
          minWidth: 'auto',
          width: '100%',
          tableLayout: 'auto'
        }
      }
    },
    // Custom styling to match Figma design
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: '#2A2B2E',
        color: '#FFFFFF', 
        borderRight: '1px solid #555555', // Add light border for column separators
        '&:last-child': {
          borderRight: 'none', // Remove border from last column
        },
        fontFamily: 'roboto',
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: '1.6',
        borderBottom: 'none',
        // Fix filter input styling for dark background
        '& .MuiTextField-root': {
          '& .MuiInputBase-root': {
            color: '#FFFFFF',
            fontSize: '16px',
            fontFamily: 'roboto',
            '& input': {
              color: '#FFFFFF',
              '&::placeholder': {
                color: '#CCCCCC',
                opacity: 1,
              },
            },
            '& .MuiInputBase-input': {
              color: '#FFFFFF',
              '&::placeholder': {
                color: '#CCCCCC',
                opacity: 1,
              },
            },
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#555555',
            },
            '&:hover fieldset': {
              borderColor: '#777777',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FFFFFF',
            },
          },
        },
        // Fix header icons (filter, sort, column menu) for dark background
        '& .MuiButtonBase-root': {
          color: '#FFFFFF !important',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
        '& .MuiIconButton-root': {
          color: '#FFFFFF !important',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '& .MuiSvgIcon-root': {
            color: '#FFFFFF !important',
          },
        },
        '& .MuiSvgIcon-root': {
          color: '#FFFFFF !important',
        },
        // Fix sorting hover effects
        '& .MuiTableSortLabel-root': {
          color: '#FFFFFF !important',
          '&:hover': {
            color: '#FFFFFF !important',
            backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
          },
          '&.Mui-active': {
            color: '#FFFFFF !important',
            '& .MuiTableSortLabel-icon': {
              color: '#FFFFFF !important',
            },
          },
        },
        '& .MuiTableSortLabel-icon': {
          color: '#FFFFFF !important',
        },
        // Fix column menu and filter icons specifically
        '& [data-testid="ExpandMoreIcon"]': {
          color: '#FFFFFF !important',
        },
        '& [data-testid="FilterListIcon"]': {
          color: '#FFFFFF !important',
        },
        '& [data-testid="DragIndicatorIcon"]': {
          color: '#FFFFFF !important',
        },
        '& [data-testid="MoreVertIcon"]': {
          color: '#FFFFFF !important',
        },
      },
    },
    muiTableBodyCellProps: {
      sx: {
        borderBottom: '1px solid #F6F6F6',
        padding: '12px 16px',
      },
    },
    muiTableBodyRowProps: {
      sx: {
        '&:hover': {
          backgroundColor: '#FAFAFA',
        },
      },
    },
    muiTableProps: {
      sx: {
        borderRadius: '8px',
        overflow: 'auto',
        width: '100%',
        '& .MuiTable-root': {
          borderCollapse: 'separate',
          width: '100%',
          tableLayout: 'auto',
          // Removed minWidth constraint to prevent horizontal chopping
        },
      },
    },
    // Fix dropdown menu and popup styling
    muiFilterTextFieldProps: {
      sx: {
        '& .MuiInputBase-root': {
          color: '#FFFFFF',
          '& input': {
            color: '#FFFFFF',
            '&::placeholder': {
              color: '#CCCCCC',
              opacity: 1,
            },
          },
        },
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: '#555555',
          },
          '&:hover fieldset': {
            borderColor: '#777777',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#FFFFFF',
          },
        },
      },
    },
    muiTableHeadRowProps: {
      sx: {
        backgroundColor: '#2A2B2E',
        '& .MuiTableCell-root': {
          backgroundColor: '#2A2B2E',
        },
      },
    },
    muiSelectCheckboxProps: {
      sx: {
        color: '#2A2B2E',
        '&.Mui-checked': {
          color: '#2A2B2E',
        },
      },
    },
    renderToolbarAlertBannerContent: error ? () => (
      <div style={{ color: '#d32f2f' }}>{error}</div>
    ) : undefined,
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <P2 className="text-red-700">{error}</P2>
      </div>
    );
  }

  // Determine if we should show cards view
  const shouldShowCards = isMobile;

  // Cards View: When user chooses cards or on small screens
  if (shouldShowCards) {
    return (
      <div className="w-full space-y-4">
        {/* Control Bar */}
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          {/* Top Row: View Toggle + Search */}
          <div className="flex items-center gap-4">
            {/* View Mode Toggle - Only show when table view is an option (≥1280px) */}
            <div className="hidden xl:flex items-center">
              <Tooltip title={`Switch to ${viewMode === 'cards' ? 'table' : 'cards'} view`} arrow>
                <IconButton
                  onClick={handleViewModeToggle}
                  size="small"
                  sx={{ 
                    backgroundColor: viewMode === 'cards' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  {viewMode === 'cards' ? (
                    <ViewModule sx={{ fontSize: 20 }} />
                  ) : (
                    <TableChart sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Tooltip>
            </div>
            
            {/* Search */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                }
              }}
            />
          </div>
          
          {/* Filters and Sort - Horizontal layout on mobile */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <FormControl size="small" className="flex-1">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {uniqueStatuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Sort Field */}
            <FormControl size="small" className="flex-1">
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                label="Sort by"
              >
                <MenuItem value="created">Created Date</MenuItem>
                <MenuItem value="address">Address</MenuItem>
                <MenuItem value="opportunity">Opportunity</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
            
            {/* Sort Direction */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="flex-shrink-0"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
          
          {/* Results count, density toggle, and pagination info */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Density Toggle */}
              <Tooltip title={`Switch to ${cardsDensity === 'comfortable' ? 'compact' : 'comfortable'} density`} arrow>
                <IconButton
                  onClick={() => setCardsDensity(prev => prev === 'comfortable' ? 'compact' : 'comfortable')}
                  size="small"
                  sx={{ 
                    backgroundColor: 'transparent',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  {cardsDensity === 'comfortable' ? (
                    <ViewAgenda sx={{ fontSize: 20 }} />
                  ) : (
                    <ViewComfy sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Tooltip>
              
              {/* Results count */}
              <P3 className="text-gray-500">
                Showing {Math.min((cardsPage * cardsPageSize) + 1, filteredAndSortedProjects.length)}-{Math.min((cardsPage + 1) * cardsPageSize, filteredAndSortedProjects.length)} of {filteredAndSortedProjects.length} projects
              </P3>
            </div>
            
            <FormControl size="small" className="min-w-[120px]">
              <InputLabel>Per page</InputLabel>
              <Select
                value={cardsPageSize}
                onChange={(e) => {
                  setCardsPageSize(Number(e.target.value));
                  setCardsPage(0); // Reset to first page when changing page size
                }}
                label="Per page"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Cards Content */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-8">
            <P2 className="text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'No projects match your filters' : 'No projects found'}
            </P2>
          </div>
        ) : (
          <>
            {/* Cards List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {paginatedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenProject={handleOpenProject}
                  onEditProject={handleEditProject}
                  onArchiveProject={handleArchiveProject}
                  allStatuses={uniqueStatuses}
                  density={cardsDensity}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow mt-4 p-4">
                <div className="flex items-center justify-between">
                  {/* Page info */}
                  <P3 className="text-gray-500">
                    Page {cardsPage + 1} of {totalPages}
                  </P3>
                  
                  {/* Pagination component */}
                  <Pagination
                    count={totalPages}
                    page={cardsPage + 1}
                    onChange={(_, page) => setCardsPage(page - 1)}
                    color="primary"
                    showFirstButton
                    showLastButton
                    size="small"
                  />
                  
                  {/* Items per page info */}
                  <P3 className="text-gray-500">
                    {cardsPageSize} per page
                  </P3>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Table View: When user chooses table view and not on small screens
  return (
    <div className="w-full max-w-full space-y-4">
      {/* Table Control Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <Tooltip title={`Switch to ${viewMode === 'table' ? 'cards' : 'table'} view`} arrow>
              <IconButton
                onClick={handleViewModeToggle}
                size="small"
                sx={{ 
                  backgroundColor: viewMode === 'table' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              >
                {viewMode === 'table' ? (
                  <ViewModule sx={{ fontSize: 20 }} />
                ) : (
                  <TableChart sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>
            
            <P3 className="text-gray-500">
              Table View • {projects.length} projects
            </P3>
          </div>
          
          <P3 className="text-gray-500 text-xs">
            Use advanced table features: sort, filter, resize columns
          </P3>
        </div>
      </div>
      
      {/* Responsive table container with proper overflow handling */}
      <div className="overflow-x-auto overflow-y-visible max-w-full">
        <div className="min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg max-w-full">
            <div className="max-w-full overflow-hidden">
              <MaterialReactTable table={table} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsTable;