import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Box, IconButton, Tooltip } from '@mui/material';
import Image from 'next/image';
import { P2 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';
import { projectsService, type EnhancedProject } from '../../../services/projectsService';
import { memoryMonitor } from '../../../utils/memoryMonitor';

interface ProjectsTableProps {
  onRefresh?: () => void;
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({ onRefresh }) => {
  const router = useRouter();
  const [projects, setProjects] = useState<EnhancedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Seed project ID for safe testing as per plan
  const SEED_PROJECT_ID = '490209a8-d20a-bae1-9e01-1da356be8a93';

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
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError('');

    try {
      memoryMonitor.track('ProjectsTable: Before loading');
      
      const result = await projectsService.getEnhancedProjects({
        includeArchived: false // Already filtered in service
      });

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
  };

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

  const columns = useMemo<MRT_ColumnDef<EnhancedProject>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        size: 150,
        enableSorting: true,
        enableResizing: true,
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
        size: 250,
        enableSorting: true,
        enableResizing: true,
        Cell: ({ cell }) => (
          <P2>{cell.getValue<string>()}</P2>
        ),
      },
      {
        accessorFn: (row) => row.createdDate || row.createdAt,
        id: 'created',
        header: 'Created',
        size: 150,
        Cell: ({ cell }) => (
          <P2>{formatDateShort(cell.getValue<string>())}</P2>
        ),
      },
      {
        accessorKey: 'clientName',
        header: 'Owner',
        size: 150,
        Cell: ({ cell }) => (
          <P2>{cell.getValue<string>() || 'N/A'}</P2>
        ),
      },
      {
        accessorKey: 'agentName',
        header: 'Agent',
        size: 150,
        Cell: ({ cell }) => (
          <P2>{cell.getValue<string>() || 'N/A'}</P2>
        ),
      },
      {
        accessorKey: 'estimatedValue',
        header: 'Price',
        size: 120,
        Cell: ({ cell }) => (
          <P2>{formatCurrencyFull(cell.getValue<number>())}</P2>
        ),
      },
      {
        accessorKey: 'projectType',
        header: 'Type',
        size: 100,
        Cell: ({ cell }) => (
          <P2>{cell.getValue<string>()}</P2>
        ),
      },
      {
        accessorFn: (row) => row.brokerage || row.agentBrokerage || 'N/A',
        id: 'brokerage',
        header: 'Brokerage',
        size: 150,
        Cell: ({ cell }) => (
          <P2>
            {cell.getValue<string>()}
          </P2>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 120,
        minSize: 120,
        maxSize: 120,
        enableSorting: false,
        enableColumnFilter: false,
        enableResizing: false,
        enableHiding: false,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Tooltip title="Open Project">
              <IconButton
                onClick={() => handleOpenProject(row.original.id)}
                sx={{ padding: '4px', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
              >
                <Image
                  src="/assets/icons/ic-newpage.svg"
                  alt="Open"
                  width={18}
                  height={18}
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
                  width={18}
                  height={18}
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
                  width={18}
                  height={18}
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
    enableRowSelection: true,
    enableColumnOrdering: true,
    enableColumnActions: true,
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
    enableFullScreenToggle: true,
    enableDensityToggle: true,
    enableGlobalFilterModes: true,
    columnFilterModeOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
    globalFilterModeOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
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
        overflow: 'visible',
        width: '100%',
        '& .MuiTable-root': {
          borderCollapse: 'separate',
          width: '100%',
          tableLayout: 'fixed',
          minWidth: '100%',
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
    state: {
      isLoading: loading,
      showAlertBanner: !!error,
    },
    renderToolbarAlertBannerContent: error ? () => (
      <div style={{ color: '#d32f2f' }}>{error}</div>
    ) : undefined,
  });

  return (
    <div style={{
      width: '100%',
      maxWidth: 'none',
      marginLeft: '0',
      marginRight: '0',
      paddingLeft: '0',
      paddingRight: '0',
      boxSizing: 'border-box'
    }}>
      <MaterialReactTable table={table} />
    </div>
  );
};

export default ProjectsTable;