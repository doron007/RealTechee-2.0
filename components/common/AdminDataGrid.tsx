import { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_TableOptions,
  type MRT_RowData,
} from 'material-react-table';

interface AdminDataGridProps<T extends MRT_RowData> {
  data: T[];
  columns: MRT_ColumnDef<T>[];
  loading?: boolean;
  error?: string;
  enableColumnDragging?: boolean;
  enableRowSelection?: boolean;
  onRefresh?: () => void;
  fullWidth?: boolean;
}

function AdminDataGrid<T extends MRT_RowData>({
  data,
  columns,
  loading = false,
  error = '',
  enableColumnDragging = false,
  enableRowSelection = true,
  onRefresh,
  fullWidth = true,
}: AdminDataGridProps<T>) {
  const table = useMaterialReactTable({
    columns,
    data,
    enableRowSelection,
    enableColumnOrdering: true,
    enableColumnActions: true,
    enableColumnFilterModes: true,
    enableColumnResizing: true,
    enableColumnDragging,
    enableHiding: true,
    enableGlobalFilter: true,
    enableFilters: true,
    enablePagination: true,
    enableSorting: true,
    enableBottomToolbar: true,
    enableTopToolbar: true,
    enableFullScreenToggle: true,
    enableDensityToggle: true,
    enableGlobalFilterModes: true,
    columnFilterModeOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
    globalFilterModeOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, { label: 'All', value: -1 }] as any,
    },
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      showGlobalFilter: true,
    },
    // Custom styling to match admin design
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: '#2A2B2E',
        color: '#FFFFFF',
        fontFamily: 'Roboto',
        fontWeight: 400,
        fontSize: '13px',
        lineHeight: '1.6',
        borderBottom: 'none',
        // Fix filter input styling for dark background
        '& .MuiTextField-root': {
          '& .MuiInputBase-root': {
            color: '#FFFFFF',
            fontSize: '13px',
            fontFamily: 'Roboto',
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
        // Fix header icons for dark background
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
        overflow: 'hidden',
        width: '100%',
        '& .MuiTable-root': {
          borderCollapse: 'separate',
          width: '100%',
          tableLayout: 'fixed',
        },
      },
    },
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
    state: {
      isLoading: loading,
      showAlertBanner: !!error,
    },
    renderToolbarAlertBannerContent: error ? () => (
      <div style={{ color: '#d32f2f' }}>{error}</div>
    ) : undefined,
  });

  const wrapperStyle = fullWidth ? {
    width: '100vw',
    marginLeft: 'calc(-50vw + 50%)',
    position: 'relative' as const
  } : {
    width: '100%'
  };

  return (
    <div style={wrapperStyle}>
      <MaterialReactTable table={table} />
    </div>
  );
}

export default AdminDataGrid;