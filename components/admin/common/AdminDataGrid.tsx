import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button,
  Pagination,
  Menu,
  MenuList,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { ViewAgenda, ViewComfy, TableChart, ViewModule, MoreVert } from '@mui/icons-material';
import Image from 'next/image';
import { H1, P2, P3 } from '../../typography';

export interface AdminDataItem {
  id: string;
  [key: string]: any;
}

export interface AdminDataGridColumn<T extends AdminDataItem> {
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  id?: string;
  header: string;
  size?: number;
  enableHiding?: boolean;
  enableSorting?: boolean;
  Cell?: ({ cell, row }: { cell: any; row: { original: T } }) => React.ReactNode;
}

export interface AdminDataGridAction<T extends AdminDataItem> {
  label: string;
  icon?: string;
  onClick: (item: T) => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  tooltip?: string;
}

export interface AdminDataGridFilter {
  field: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface AdminDataGridProps<T extends AdminDataItem> {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: AdminDataGridColumn<T>[];
  actions: AdminDataGridAction<T>[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  createButtonLabel?: string;
  onCreateNew?: () => void;
  searchFields?: string[];
  filters?: AdminDataGridFilter[];
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
  itemDisplayName?: string; // e.g., "projects", "quotes"
  getStatusColor?: (status: string) => string;
  formatCurrency?: (value: number) => string;
  formatDate?: (date: string) => string;
  cardComponent?: React.ComponentType<{
    item: T;
    actions: AdminDataGridAction<T>[];
    density: 'comfortable' | 'compact';
    allStatuses?: string[];
  }>;
  // Archive toggle props
  showArchiveToggle?: boolean;
  showArchived?: boolean;
  onArchiveToggle?: (showArchived: boolean) => void;
  allData?: T[]; // For showing total counts
  // Custom business logic dropdown
  customActions?: {
    label: string;
    items: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }[];
  };
}

const AdminDataGrid = <T extends AdminDataItem>({
  title,
  subtitle,
  data,
  columns,
  actions,
  loading = false,
  error,
  onRefresh,
  createButtonLabel = 'Create New',
  onCreateNew,
  searchFields = [],
  filters = [],
  defaultSortField = 'createdAt',
  defaultSortDirection = 'desc',
  itemDisplayName = 'items',
  getStatusColor,
  formatCurrency,
  formatDate,
  cardComponent: CardComponent,
  showArchiveToggle = false,
  showArchived = false,
  onArchiveToggle,
  allData,
  customActions
}: AdminDataGridProps<T>) => {
  const router = useRouter();
  
  // View state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`admin-${itemDisplayName}-view-mode`);
      return (saved as 'cards' | 'table') || 'table';
    }
    return 'table';
  });
  
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`admin-${itemDisplayName}-density`);
      return (saved as 'comfortable' | 'compact') || 'compact';
    }
    return 'compact';
  });

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  
  // Pagination for cards
  const [cardsPage, setCardsPage] = useState(0);
  const [cardsPageSize, setCardsPageSize] = useState(10);
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
  
  // Custom actions dropdown state
  const [customActionsAnchor, setCustomActionsAnchor] = useState<null | HTMLElement>(null);

  // Persist preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`admin-${itemDisplayName}-view-mode`, viewMode);
      localStorage.setItem(`admin-${itemDisplayName}-density`, density);
    }
  }, [viewMode, density, itemDisplayName]);

  // Handle responsive layout
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const forceMobile = width < 768; // Only force mobile on actual mobile devices
      setIsMobile(forceMobile || viewMode === 'cards');
      
      // Dynamic column visibility based on screen size
      const newVisibility = columns.reduce((acc, col, index) => {
        const colKey = col.id || col.accessorKey as string;
        
        if (width < 1024) {
          // On smaller screens: always show Status, Address, and Actions, plus a few more
          const alwaysShow = col.enableHiding === false || 
                           colKey === 'status' || 
                           colKey === 'address' || 
                           colKey === 'actions';
          const showMoreColumns = index < 4; // Show first 4 columns
          acc[colKey] = alwaysShow || showMoreColumns;
        } else {
          // On larger screens: show all columns (desktop should show everything)
          acc[colKey] = true;
        }
        
        return acc;
      }, {} as Record<string, boolean>);
      
      setColumnVisibility(newVisibility);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [columns, viewMode]);

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm && searchFields.length > 0) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(term);
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([field, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(item => item[field] === value);
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      // Find the column definition to get the proper accessor
      const column = columns.find(col => 
        (col.id === sortField) || 
        (col.accessorKey === sortField) || 
        (String(col.accessorKey) === sortField)
      );
      
      let aValue, bValue;
      
      if (column?.accessorFn) {
        // Use accessorFn for FK-resolved fields
        aValue = column.accessorFn(a);
        bValue = column.accessorFn(b);
      } else {
        // Use direct field access for simple fields
        aValue = a[sortField];
        bValue = b[sortField];
      }
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;
      
      // Convert to string for consistent comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, searchFields, activeFilters, sortField, sortDirection, columns]);

  // Paginated data for cards view
  const paginatedData = useMemo(() => {
    const start = cardsPage * cardsPageSize;
    return filteredData.slice(start, start + cardsPageSize);
  }, [filteredData, cardsPage, cardsPageSize]);

  // Get unique values for filter options
  const getFilterOptions = useCallback((field: string) => {
    const values = Array.from(new Set(data.map(item => item[field]).filter(Boolean)));
    return values.map(value => ({ value: String(value), label: String(value) }));
  }, [data]);

  // Selection handlers
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredData.map(item => item.id));
    const isAllSelected = filteredData.every(item => selectedItems.has(item.id));
    setSelectedItems(isAllSelected ? new Set() : allIds);
  };

  // Create MRT columns with actions
  const tableColumns = useMemo(() => {
    const cols = [...columns];
    
    // Add actions column
    cols.push({
      id: 'actions',
      header: 'Actions',
      size: 120,
      enableHiding: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {actions.map((action, index) => (
            <Tooltip key={index} title={action.tooltip || action.label}>
              <IconButton
                onClick={() => action.onClick(row.original)}
                sx={{ padding: '4px', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
              >
                {action.icon ? (
                  <Image
                    src={action.icon}
                    alt={action.label}
                    width={16}
                    height={16}
                  />
                ) : (
                  <span className="text-xs">{action.label.slice(0, 2)}</span>
                )}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      ),
    });

    return cols as MRT_ColumnDef<T>[];
  }, [columns, actions]);

  const table = useMaterialReactTable({
    columns: tableColumns,
    data: filteredData,
    enableRowSelection: false,
    enableColumnOrdering: true,
    enableColumnActions: false,
    enableRowActions: false,
    enableColumnFilterModes: true,
    enableColumnResizing: true,
    enableHiding: true,
    enableGlobalFilter: true,
    enableFilters: true,
    enablePagination: true,
    enableSorting: true,
    layoutMode: 'semantic',
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [{ id: sortField, desc: sortDirection === 'desc' }],
      showGlobalFilter: true,
    },
    state: {
      columnVisibility,
      isLoading: loading,
      showAlertBanner: !!error,
    },
    onColumnVisibilityChange: setColumnVisibility,
    // Custom table styling
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: '#2A2B2E',
        color: '#FFFFFF',
        borderRight: '1px solid #555555',
        fontFamily: 'roboto',
        fontWeight: 400,
        fontSize: '16px',
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
    muiTableContainerProps: {
      sx: {
        maxWidth: '100%',
        overflowX: 'auto', // Allow horizontal scrolling when needed
        overflowY: 'visible',
        '& .MuiTable-root': {
          minWidth: '800px', // Ensure minimum readable width
          width: '100%',
          tableLayout: 'auto' // Allow flexible column sizing
        }
      }
    },
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <P2 className="text-red-700">{error}</P2>
        {onRefresh && (
          <Button variant="outlined" onClick={onRefresh} className="mt-2">
            Retry
          </Button>
        )}
      </div>
    );
  }

  const shouldShowCards = isMobile || viewMode === 'cards';

  return (
    <div className="space-y-6">
      {/* Header - only render if title is provided */}
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <H1>{title}</H1>
            {subtitle && <P2 className="text-gray-600 mt-1">{subtitle}</P2>}
          </div>
          {/* New Project button removed per business requirements */}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Top Row: View Toggle + Search */}
        <div className="flex items-center gap-4">
          {/* View Mode Toggle - Show on tablet and up */}
          <div className="hidden md:flex items-center">
            <Tooltip title={`Switch to ${viewMode === 'cards' ? 'table' : 'cards'} view`}>
              <IconButton
                onClick={() => setViewMode(prev => prev === 'cards' ? 'table' : 'cards')}
                size="small"
                sx={{ 
                  backgroundColor: viewMode === 'cards' ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                }}
              >
                {viewMode === 'cards' ? <ViewModule /> : <TableChart />}
              </IconButton>
            </Tooltip>
          </div>
          
          {/* Search */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder={`Search ${itemDisplayName}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
          />
          
          {/* Custom Actions Dropdown */}
          {customActions && (
            <div>
              <Tooltip title={customActions.label}>
                <IconButton
                  onClick={(e) => setCustomActionsAnchor(e.currentTarget)}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' }
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
              
              <Menu
                anchorEl={customActionsAnchor}
                open={Boolean(customActionsAnchor)}
                onClose={() => setCustomActionsAnchor(null)}
                PaperProps={{
                  sx: { minWidth: '200px' }
                }}
              >
                <MenuList>
                  {customActions.items.map((item, index) => (
                    <MenuItem 
                      key={index}
                      onClick={() => {
                        item.onClick();
                        setCustomActionsAnchor(null);
                      }}
                      disabled={item.disabled}
                    >
                      <ListItemText primary={item.label} />
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </div>
          )}
        </div>
        
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {filters.map((filter) => (
            <FormControl key={filter.field} size="small" className="flex-1">
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={activeFilters[filter.field] || 'all'}
                onChange={(e) => setActiveFilters(prev => ({
                  ...prev,
                  [filter.field]: e.target.value
                }))}
                label={filter.label}
              >
                <MenuItem value="all">All {filter.label}s</MenuItem>
                {getFilterOptions(filter.field).map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </div>

        {/* Archive Toggle - positioned between filters and results */}
        {showArchiveToggle && (
          <div className="flex justify-end">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`show-archived-${itemDisplayName}`}
                  checked={showArchived}
                  onChange={(e) => onArchiveToggle?.(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`show-archived-${itemDisplayName}`} className="ml-2 text-sm font-medium text-gray-700">
                  Show Archived {itemDisplayName.charAt(0).toUpperCase() + itemDisplayName.slice(1)}
                </label>
              </div>
              
              {/* Archive count display */}
              <div className="text-sm text-gray-500">
                {showArchived ? (
                  <>📁 {data.length} archived {data.length === 1 ? itemDisplayName.slice(0, -1) : itemDisplayName}</>
                ) : (
                  <>📊 {data.length} active {data.length === 1 ? itemDisplayName.slice(0, -1) : itemDisplayName}</>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Density Toggle */}
            <Tooltip title={`Switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} density`}>
              <IconButton
                onClick={() => setDensity(prev => prev === 'comfortable' ? 'compact' : 'comfortable')}
                size="small"
              >
                {density === 'comfortable' ? <ViewAgenda /> : <ViewComfy />}
              </IconButton>
            </Tooltip>
            
            <P3 className="text-gray-500">
              {shouldShowCards ? (
                `Showing ${Math.min(cardsPage * cardsPageSize + 1, filteredData.length)}-${Math.min((cardsPage + 1) * cardsPageSize, filteredData.length)} of ${filteredData.length} ${itemDisplayName}`
              ) : (
                `Showing ${filteredData.length} ${itemDisplayName}`
              )}
            </P3>
          </div>
          
          {/* Sort Controls and Bulk Actions */}
          <div className="flex items-center gap-4">
            {/* Sort Controls - Only show in cards view */}
            {shouldShowCards && (
              <div className="flex items-center gap-2">
                <P3 className="text-gray-600">Sort by:</P3>
                <FormControl size="small" className="min-w-[120px]">
                  <Select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    displayEmpty
                    sx={{ height: '32px' }}
                  >
                    {columns.filter(col => col.enableSorting !== false).map((col) => {
                      const key = String(col.id || col.accessorKey || col.header);
                      return (
                        <MenuItem key={key} value={key}>
                          {col.header}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                
                <Tooltip title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}>
                  <IconButton
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(0,0,0,0.04)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' }
                    }}
                  >
                    {sortDirection === 'asc' ? (
                      <span className="text-sm font-bold">↑</span>
                    ) : (
                      <span className="text-sm font-bold">↓</span>
                    )}
                  </IconButton>
                </Tooltip>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <P3 className="text-gray-600">{selectedItems.size} selected</P3>
                {/* Add bulk action buttons here */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {shouldShowCards ? (
        // Cards View
        <div className="space-y-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <P2 className="text-gray-500">No {itemDisplayName} found</P2>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {CardComponent ? (
                  paginatedData.map((item) => (
                    <CardComponent
                      key={item.id}
                      item={item}
                      actions={actions}
                      density={density}
                      allStatuses={getFilterOptions('status').map(opt => opt.value)}
                    />
                  ))
                ) : (
                  <div className="p-4">
                    <P2 className="text-gray-500">Card component not provided</P2>
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {Math.ceil(filteredData.length / cardsPageSize) > 1 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <P3 className="text-gray-500">
                      Page {cardsPage + 1} of {Math.ceil(filteredData.length / cardsPageSize)}
                    </P3>
                    
                    <Pagination
                      count={Math.ceil(filteredData.length / cardsPageSize)}
                      page={cardsPage + 1}
                      onChange={(_, page) => setCardsPage(page - 1)}
                      color="primary"
                      showFirstButton
                      showLastButton
                      size="small"
                    />
                    
                    <FormControl size="small" className="min-w-[120px]">
                      <InputLabel>Per page</InputLabel>
                      <Select
                        value={cardsPageSize}
                        onChange={(e) => {
                          setCardsPageSize(Number(e.target.value));
                          setCardsPage(0);
                        }}
                        label="Per page"
                      >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="w-full overflow-x-auto overflow-y-visible">
            <div className="min-w-full">
              <MaterialReactTable table={table} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDataGrid;