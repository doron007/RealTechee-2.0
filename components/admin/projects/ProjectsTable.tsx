import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import Image from 'next/image';
import { P3 } from '../../typography';
import { projectsAPI } from '../../../utils/amplifyAPI';

interface Project {
  id: string;
  title?: string;
  status: string;
  propertyAddress?: string;
  clientName?: string;
  agentName?: string;
  estimatedValue?: number;
  projectType?: string;
  brokerage?: string;
  businessCreatedDate?: string;
  createdAt?: string;
}

interface ProjectsTableProps {
  onRefresh?: () => void;
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({ onRefresh }) => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Seed project ID for safe testing as per plan
  const SEED_PROJECT_ID = '490209a8-d20a-bae1-9e01-1da356be8a93';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await projectsAPI.list();
      
      if (result.success) {
        // Filter out archived projects by default as per plan
        const activeProjects = result.data.filter((project: Project) => 
          project.status !== 'Archived'
        );
        
        setProjects(activeProjects);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  // Status chip styling based on Figma design
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Pre-listing':
        return { bg: '#F2EFFA', text: '#5632BA' };
      case 'New':
        return { bg: '#E8F5E8', text: '#2E7D2E' };
      case 'Active':
      case 'Boosting':
      case 'Listed':
        return { bg: '#E3F2FD', text: '#1976D2' };
      case 'In-escrow':
        return { bg: '#FFF3E0', text: '#F57C00' };
      case 'Sold':
      case 'Completed':
        return { bg: '#F3E5F5', text: '#7B1FA2' };
      default:
        return { bg: '#F5F5F5', text: '#666666' };
    }
  };

  // Format currency according to Figma
  const formatCurrency = (value?: number): string => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format date according to Figma (MM/DD/YYYY)
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
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

  const columns = useMemo<MRT_ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        size: 112,
        enableSorting: false,
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          const statusStyles = getStatusStyles(status);
          
          return (
            <Chip
              label={
                <P3 
                  style={{ 
                    fontFamily: 'Roboto',
                    fontWeight: 400,
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: statusStyles.text
                  }}
                >
                  {status}
                </P3>
              }
              sx={{
                backgroundColor: statusStyles.bg,
                color: statusStyles.text,
                width: '112px',
                minWidth: '112px',
                height: '28px',
                borderRadius: '14px',
                '& .MuiChip-label': {
                  padding: '6px 16px',
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: 'propertyAddress',
        header: 'Address',
        size: 168,
        enableSorting: false,
        Cell: ({ cell, row }) => (
          <P3 
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#2A2B2E',
              width: '168px'
            }}
          >
            {cell.getValue<string>() || row.original.title || 'No address provided'}
          </P3>
        ),
      },
      {
        accessorFn: (row) => row.businessCreatedDate || row.createdAt,
        id: 'created',
        header: 'Created',
        size: 100,
        Cell: ({ cell }) => (
          <P3 
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#2A2B2E'
            }}
          >
            {formatDate(cell.getValue<string>())}
          </P3>
        ),
      },
      {
        accessorKey: 'clientName',
        header: 'Owner',
        size: 120,
        Cell: ({ cell }) => (
          <P3 
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#2A2B2E'
            }}
          >
            {cell.getValue<string>() || 'N/A'}
          </P3>
        ),
      },
      {
        accessorKey: 'agentName',
        header: 'Agent',
        size: 120,
        Cell: ({ cell }) => (
          <P3 
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#2A2B2E'
            }}
          >
            {cell.getValue<string>() || 'N/A'}
          </P3>
        ),
      },
      {
        accessorKey: 'estimatedValue',
        header: 'Price',
        size: 120,
        Cell: ({ cell }) => (
          <P3 
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#2A2B2E'
            }}
          >
            {formatCurrency(cell.getValue<number>())}
          </P3>
        ),
      },
      {
        accessorKey: 'projectType',
        header: 'Type',
        size: 100,
        Cell: ({ cell }) => (
          <P3 
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#2A2B2E'
            }}
          >
            {cell.getValue<string>() || 'Buyer'}
          </P3>
        ),
      },
      {
        accessorKey: 'brokerage',
        header: 'Brokerage',
        size: 120,
        Cell: ({ cell }) => (
          <P3 
            style={{ 
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#2A2B2E'
            }}
          >
            {cell.getValue<string>() || 'Brokerage'}
          </P3>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        enableSorting: false,
        enableColumnFilter: false,
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
    enableGlobalFilter: true,
    enableFilters: true,
    enablePagination: true,
    enableSorting: true,
    enableBottomToolbar: true,
    enableTopToolbar: true,
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [{ id: 'created', desc: true }],
    },
    // Custom styling to match Figma design
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
        '& .MuiTable-root': {
          borderCollapse: 'separate',
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
    <div style={{ width: '100%' }}>
      <MaterialReactTable table={table} />
    </div>
  );
};

export default ProjectsTable;