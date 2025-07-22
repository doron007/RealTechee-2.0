import React, { useState } from 'react';
import Image from 'next/image';
import { IconButton, Tooltip } from '@mui/material';
import { H3, H4, H5, H6, P1, P2, P3 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';

export interface AdminCardField {
  key: string;
  label: string;
  value: any;
  type?: 'text' | 'currency' | 'date' | 'status' | 'link' | 'custom';
  format?: (value: any) => string;
  render?: (value: any, item: any) => React.ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low'; // Determines visibility in collapsed state
}

export interface AdminCardAction {
  label: string;
  icon?: string;
  onClick: (item: any) => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  tooltip?: string;
  showInCollapsed?: boolean;
}

export interface AdminCardGroup {
  title: string;
  icon?: string;
  color?: string;
  fields: AdminCardField[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface AdminCardProps {
  item: any;
  primaryField: string; // Field to use as main title
  secondaryField?: string; // Field to use as subtitle
  statusField?: string; // Field to use for status
  groups?: AdminCardGroup[];
  actions: AdminCardAction[];
  density?: 'comfortable' | 'compact';
  allStatuses?: string[];
  getStatusColor?: (status: string) => string;
  formatCurrency?: (value: number) => string;
  formatDate?: (date: string) => string;
  onImageClick?: (src: string, alt: string, description?: string) => void;
}

type CardState = 'collapsed' | 'basic' | 'full';

const AdminCard: React.FC<AdminCardProps> = ({
  item,
  primaryField,
  secondaryField,
  statusField = 'status',
  groups = [],
  actions,
  density = 'comfortable',
  allStatuses = [],
  getStatusColor,
  formatCurrency,
  formatDate,
  onImageClick
}) => {
  const [cardState, setCardState] = useState<CardState>('collapsed');

  // Helper function to get intelligent status abbreviation
  const getStatusAbbreviation = (status: string, allStatuses: string[] = []): string => {
    const firstLetter = status.charAt(0).toUpperCase();
    
    const conflictingStatuses = allStatuses.filter(s => 
      s !== status && s.charAt(0).toUpperCase() === firstLetter
    );
    
    if (conflictingStatuses.length === 0) {
      return firstLetter;
    }
    
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
      'Rejected': 'Rj',
      'Draft': 'Dr',
      'Sent': 'Se',
      'Signed': 'Si',
      'Expired': 'Ex'
    };
    
    return statusMap[status] || status.substring(0, 2);
  };

  // Format field value based on type
  const formatFieldValue = (field: AdminCardField, value: any) => {
    if (field.render) {
      return field.render(value, item);
    }
    
    if (field.format) {
      return field.format(value);
    }

    switch (field.type) {
      case 'currency':
        return formatCurrency ? formatCurrency(value) : `$${value?.toLocaleString() || 'N/A'}`;
      case 'date':
        return formatDate ? formatDate(value) : new Date(value).toLocaleDateString();
      case 'status':
        return <StatusPill status={value} />;
      case 'link':
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            View Link
          </a>
        ) : 'N/A';
      default:
        return value || 'N/A';
    }
  };

  // Get primary display value
  const primaryValue = item[primaryField] || 'Untitled';
  const secondaryValue = secondaryField ? item[secondaryField] : null;
  const statusValue = item[statusField];

  // Split address for mobile display
  const splitAddress = (address: string) => {
    const parts = address.split(',');
    if (parts.length >= 3) {
      const streetAddress = parts.slice(0, -2).join(',').trim();
      const cityStateZip = parts.slice(-2).join(',').trim();
      return { streetAddress, cityStateZip };
    }
    return { streetAddress: address, cityStateZip: '' };
  };

  // Use secondary field (address) if available, otherwise use primary field
  const addressToSplit = secondaryValue || primaryValue;
  const { streetAddress, cityStateZip } = splitAddress(addressToSplit);

  // Dynamic styling based on density
  const getDensityClasses = () => {
    if (cardState === 'collapsed') {
      return density === 'compact' ? 'py-1 px-3' : 'py-3 px-4';
    }
    return density === 'compact' ? 'p-4' : 'p-6';
  };

  const getMinHeight = () => {
    if (cardState === 'collapsed') {
      return density === 'compact' ? 'min-h-[36px]' : 'min-h-[48px]';
    }
    return '';
  };

  // Toggle handlers
  const handleTitleRowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCardState(prev => prev === 'collapsed' ? 'basic' : 'collapsed');
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (cardState === 'full' && 
        !(e.target as HTMLElement).closest('.action-buttons') && 
        !(e.target as HTMLElement).closest('.show-more-button') &&
        !(e.target as HTMLElement).closest('img') &&
        !(e.target as HTMLElement).closest('a') &&
        !(e.target as HTMLElement).closest('summary')) {
      setCardState('collapsed');
    }
  };

  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCardState('full');
  };

  // Get collapsed actions (only those marked for collapsed view)
  const collapsedActions = actions.filter(action => action.showInCollapsed !== false);

  return (
    <div 
      className={`bg-white border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ${getDensityClasses()}`}
      onClick={handleCardClick}
    >
      {/* COLLAPSED STATE */}
      {cardState === 'collapsed' && (
        <div className={`flex items-center justify-between ${getMinHeight()}`}>
          {/* Left: Status + Primary Field */}
          <div 
            className={`flex items-center flex-1 min-w-0 cursor-pointer ${density === 'compact' ? 'space-x-2' : 'space-x-3'}`}
            onClick={handleTitleRowClick}
          >
            {/* Status Badge */}
            {statusValue && (
              <Tooltip title={`Status: ${statusValue}`} arrow>
                <div className={`bg-blue-100 text-blue-800 rounded font-medium flex-shrink-0 ${
                  density === 'compact' 
                    ? 'px-1.5 py-0.5 text-xs' 
                    : 'px-2 py-1 text-xs'
                }`}>
                  {getStatusAbbreviation(statusValue, allStatuses)}
                </div>
              </Tooltip>
            )}
            
            {/* Content - Show address if available, otherwise primary value */}
            <div className="flex-1 min-w-0">
              {secondaryValue ? (
                // Show address when available
                <>
                  <div className="hidden sm:block">
                    <P2 className={`font-medium truncate ${density === 'compact' ? 'text-sm' : ''}`}>
                      {secondaryValue}
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
                </>
              ) : (
                // Fallback to primary value
                <div className="hidden sm:block">
                  <P2 className={`font-medium truncate ${density === 'compact' ? 'text-sm' : ''}`}>
                    {primaryValue}
                  </P2>
                </div>
              )}
            </div>
          </div>
          
          {/* Right: Actions + Expand Icon */}
          <div className={`flex items-center flex-shrink-0 ${density === 'compact' ? 'space-x-1' : 'space-x-2'}`}>
            {/* Action Buttons - Hidden on mobile, visible on tablet+ */}
            <div className={`hidden md:flex action-buttons ${density === 'compact' ? 'space-x-0.5' : 'space-x-1'}`}>
              {collapsedActions.slice(0, 3).map((action, index) => (
                <Tooltip key={index} title={action.tooltip || action.label}>
                  <IconButton
                    onClick={() => action.onClick(item)}
                    size="small"
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
                </Tooltip>
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

      {/* BASIC EXPANDED STATE */}
      {cardState === 'basic' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {statusValue && <StatusPill status={statusValue} />}
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

          {/* Primary Content */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100 mb-4">
              <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                {primaryField.charAt(0).toUpperCase() + primaryField.slice(1)}
              </P3>
              <H4 className="text-gray-900 break-words leading-relaxed">{primaryValue}</H4>
              
              {/* Show secondary field (address) if available */}
              {secondaryValue && secondaryField && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                    {secondaryField.charAt(0).toUpperCase() + secondaryField.slice(1)}
                  </P3>
                  <P2 className="text-gray-700 break-words">{secondaryValue}</P2>
                </div>
              )}
            </div>

            {/* High priority fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {groups.flatMap(group => group.fields)
                .filter(field => field.priority === 'high')
                .slice(0, 6)
                .map((field) => (
                  <div key={field.key} className="bg-white rounded-lg p-4 border border-gray-100">
                    <P3 className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                      {field.label}
                    </P3>
                    <P2 className="text-gray-900 font-semibold break-words">
                      {formatFieldValue(field, item[field.key])}
                    </P2>
                  </div>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {actions.slice(0, 3).map((action, index) => (
                <button
                  key={index}
                  onClick={() => action.onClick(item)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 shadow-sm hover:shadow-md ${
                    action.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    action.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {action.icon && (
                    <Image src={action.icon} alt={action.label} width={16} height={16} className="invert" />
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

      {/* FULL EXPANDED STATE */}
      {cardState === 'full' && (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white py-2 border-b border-gray-200">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {statusValue && <StatusPill status={statusValue} />}
                <H5 className="text-gray-900 break-words leading-relaxed">{primaryValue}</H5>
              </div>
              {/* Show secondary field (address) if available */}
              {secondaryValue && (
                <P2 className="text-gray-600 break-words leading-relaxed ml-0">{secondaryValue}</P2>
              )}
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

          {/* Field Groups */}
          {groups.map((group, groupIndex) => (
            <details key={groupIndex} open={group.defaultOpen !== false} className="group">
              <summary 
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  group.color || 'bg-blue-50 hover:bg-blue-100'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {group.icon && <span className="text-lg">{group.icon}</span>}
                <H6 className={`font-semibold ${
                  group.color?.includes('blue') ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {group.title}
                </H6>
                <Image 
                  src="/assets/icons/ic-arrow-down.svg" 
                  alt="Toggle" 
                  width={14} 
                  height={14}
                  className="ml-auto group-open:rotate-180 transition-transform duration-200"
                />
              </summary>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                {group.fields.map((field) => (
                  <div key={field.key} className={field.className || ''}>
                    <P3 className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                      {field.label}
                    </P3>
                    <div className="font-medium break-words">
                      {formatFieldValue(field, item[field.key])}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-300 sticky bottom-0 bg-white">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => action.onClick(item)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl ${
                  action.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  action.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {action.icon && (
                  <Image src={action.icon} alt={action.label} width={18} height={18} className="invert" />
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

export default AdminCard;