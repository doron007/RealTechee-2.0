import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box, Paper, Typography } from '@mui/material';
import { AdminDataItem, AdminDataGridColumn, AdminDataGridAction } from './AdminDataGrid';

interface VirtualizedDataGridProps<T extends AdminDataItem> {
  data: T[];
  columns: AdminDataGridColumn<T>[];
  actions: AdminDataGridAction<T>[];
  height?: number;
  itemHeight?: number;
  onItemClick?: (item: T) => void;
  loading?: boolean;
}

interface RowProps<T extends AdminDataItem> {
  index: number;
  style: React.CSSProperties;
  data: {
    items: T[];
    columns: AdminDataGridColumn<T>[];
    actions: AdminDataGridAction<T>[];
    onItemClick?: (item: T) => void;
  };
}

function VirtualizedRow<T extends AdminDataItem>({ index, style, data }: RowProps<T>) {
  const { items, columns, actions, onItemClick } = data;
  const item = items[index];

  const handleClick = useCallback(() => {
    if (onItemClick) {
      onItemClick(item);
    }
  }, [item, onItemClick]);

  const handleActionClick = useCallback((action: AdminDataGridAction<T>, event: React.MouseEvent) => {
    event.stopPropagation();
    action.onClick(item);
  }, [item]);

  return (
    <div style={style}>
      <Paper
        elevation={1}
        sx={{
          margin: 0.5,
          padding: 2,
          cursor: onItemClick ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          height: 'calc(100% - 4px)', // Account for margins
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
        onClick={handleClick}
      >
        {/* Main content area */}
        <Box sx={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
          {columns.slice(0, 3).map((column, colIndex) => {
            const value = column.accessorFn 
              ? column.accessorFn(item)
              : column.accessorKey 
                ? item[column.accessorKey]
                : '';

            return (
              <Box
                key={String(column.id || column.accessorKey || colIndex)}
                sx={{
                  minWidth: column.size || 120,
                  maxWidth: column.size || 200,
                  overflow: 'hidden',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  {column.header}
                </Typography>
                {column.Cell ? (
                  <column.Cell cell={{ getValue: () => value }} row={{ original: item }} />
                ) : (
                  <Typography variant="body2" noWrap title={String(value)}>
                    {String(value)}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Actions area */}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {actions.slice(0, 3).map((action, actionIndex) => (
            <button
              key={actionIndex}
              onClick={(e) => handleActionClick(action, e)}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: action.variant === 'primary' ? '#1976d2' : '#f5f5f5',
                color: action.variant === 'primary' ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
              title={action.tooltip}
            >
              {action.label}
            </button>
          ))}
        </Box>
      </Paper>
    </div>
  );
}

export default function VirtualizedDataGrid<T extends AdminDataItem>({
  data,
  columns,
  actions,
  height = 600,
  itemHeight = 80,
  onItemClick,
  loading = false,
}: VirtualizedDataGridProps<T>) {
  const itemData = useMemo(() => ({
    items: data as AdminDataItem[],
    columns: columns as AdminDataGridColumn<AdminDataItem>[],
    actions: actions as AdminDataGridAction<AdminDataItem>[],
    onItemClick: onItemClick as ((item: AdminDataItem) => void) | undefined,
  }), [data, columns, actions, onItemClick]);

  if (loading) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: '100%', border: '1px solid #e0e0e0', borderRadius: 1 }}>
      {/* Header */}
      <Paper
        sx={{
          padding: 2,
          borderRadius: '4px 4px 0 0',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: '#fafafa',
        }}
      >
        {columns.slice(0, 3).map((column, colIndex) => (
          <Box
            key={String(column.id || column.accessorKey || colIndex)}
            sx={{
              minWidth: column.size || 120,
              maxWidth: column.size || 200,
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              {column.header}
            </Typography>
          </Box>
        ))}
        <Box sx={{ flex: 1 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          Actions
        </Typography>
      </Paper>

      {/* Virtualized list */}
      <List
        height={height - 60} // Account for header
        width="100%"
        itemCount={data.length}
        itemSize={itemHeight}
        itemData={itemData}
      >
        {VirtualizedRow}
      </List>

      {/* Footer with count */}
      <Paper
        sx={{
          padding: 1,
          borderRadius: '0 0 4px 4px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {data.length} items
        </Typography>
      </Paper>
    </Box>
  );
}

// Performance optimization hook for large datasets
export function useVirtualizedData<T extends AdminDataItem>(
  data: T[],
  threshold: number = 100
): { shouldVirtualize: boolean; optimizedData: T[] } {
  return useMemo(() => {
    const shouldVirtualize = data.length > threshold;
    
    // For very large datasets, we might want to implement pagination or windowing
    const optimizedData = shouldVirtualize 
      ? data.slice(0, Math.min(data.length, 1000)) // Limit to 1000 items for performance
      : data;

    return {
      shouldVirtualize,
      optimizedData,
    };
  }, [data, threshold]);
}