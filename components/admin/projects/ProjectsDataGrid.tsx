import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminDataGrid, { 
  AdminDataGridColumn, 
  AdminDataGridAction, 
  AdminDataGridFilter,
  AdminDataItem 
} from '../common/AdminDataGrid';
import ProgressiveProjectCard from './ProgressiveProjectCard';
import StatusPill from '../../common/ui/StatusPill';
import { H1, P2 } from '../../typography';
import { enhancedProjectsService, type FullyEnhancedProject } from '../../../services/enhancedProjectsService';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';

// Use the FullyEnhancedProject type directly
type Project = FullyEnhancedProject;

export default function ProjectsDataGrid() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);

  // Load projects data
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const result = await enhancedProjectsService.getFullyEnhancedProjects();
        if (result.success && result.data) {
          setProjects(result.data);
        } else {
          setError(result.error || 'Failed to load projects');
        }
      } catch (err) {
        setError('Failed to load projects');
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);


  // Define columns for table view - exactly matching working ProjectsTable.tsx structure  
  const columns: AdminDataGridColumn<Project>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      enableSorting: true,
      enableHiding: false, // Always show status
      Cell: ({ cell }) => {
        const status = cell.getValue() as string;
        return (
          <div className="mb-2">
            <StatusPill status={status} />
          </div>
        );
      },
    },
    {
      accessorFn: (row) => row.propertyAddress || 'No address provided',
      id: 'address',
      header: 'Address',
      size: 200,
      enableSorting: true,
      enableHiding: false, // Always show address (primary info)
      Cell: ({ cell }) => (
        <div title={cell.getValue() as string}>
          <P2 className="max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg break-words">
            {cell.getValue() as string}
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
        <P2>{formatDateShort(cell.getValue() as string)}</P2>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'Owner',
      size: 130,
      enableHiding: true, // Can hide on mobile
      Cell: ({ cell }) => (
        <div title={cell.getValue() as string || 'N/A'}>
          <P2 className="max-w-xs truncate">
            {cell.getValue() as string || 'N/A'}
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
        <div title={cell.getValue() as string || 'N/A'}>
          <P2 className="max-w-xs truncate">
            {cell.getValue() as string || 'N/A'}
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
        <div title={cell.getValue() as string}>
          <P2 className="max-w-xs truncate">
            {cell.getValue() as string}
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
        <P2>{formatCurrencyFull(cell.getValue() as number)}</P2>
      ),
    },
  ];

  // Define actions - workflow-based actions
  const actions: AdminDataGridAction<Project>[] = [
    {
      label: 'Open',
      icon: '/assets/icons/ic-newpage.svg',
      onClick: (project) => window.open(`/project?projectId=${project.id}`, '_blank'),
      tooltip: 'Open Project',
    },
    {
      label: 'Edit',
      icon: '/assets/icons/ic-edit.svg',
      onClick: (project) => router.push(`/admin/projects/${project.id}`),
      tooltip: 'Edit Project',
    },
    {
      label: 'View Request',
      onClick: (project) => handleViewRequest(project.id),
      tooltip: 'View Related Request',
      variant: 'secondary',
    },
    {
      label: 'View Quotes',
      onClick: (project) => handleViewQuotes(project.id),
      tooltip: 'View Related Quotes',
      variant: 'secondary',
    },
    {
      label: 'Archive',
      icon: '/assets/icons/ic-delete.svg',
      onClick: (project) => handleArchiveProject(project.id),
      tooltip: 'Archive Project',
      variant: 'tertiary',
    },
  ];

  // Filter data based on archive status
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const isArchived = project.status === 'archived';
      return showArchived ? isArchived : !isArchived;
    });
  }, [projects, showArchived]);

  // Define filters - dynamic based on actual data
  const filters: AdminDataGridFilter[] = useMemo(() => {
    // Get unique statuses from filtered data
    const uniqueStatuses = Array.from(new Set(filteredProjects.map(p => p.status).filter(Boolean))).sort();
    
    return [
      {
        field: 'status',
        label: 'Status',
        options: [
          { value: '', label: 'All Statuses' },
          ...uniqueStatuses.map(status => ({ value: status, label: status }))
        ],
      },
      {
        field: 'selectedProducts',
        label: 'Product',
        options: [
          { value: '', label: 'All Products' },
          { value: 'sellers', label: 'Sellers' },
          { value: 'buyers', label: 'Buyers' },
          { value: 'kitchen-and-bath', label: 'Kitchen & Bath' },
          { value: 'commercial', label: 'Commercial' },
        ],
      },
    ];
  }, [filteredProjects]);


  // Action handlers - workflow-based
  const handleViewRequest = async (projectId: string) => {
    try {
      // Find the project first to get the requestId
      const project = projects.find(p => p.id === projectId);
      const requestId = (project as any)?.requestId; // Use type assertion for now until type is updated
      
      if (project && requestId) {
        router.push(`/admin/requests/${requestId}`);
      } else {
        alert('No related request found for this project');
      }
    } catch (error) {
      console.error('Error viewing request:', error);
      alert('Failed to view request');
    }
  };

  const handleViewQuotes = async (projectId: string) => {
    try {
      // Navigate to quotes page filtered by this project
      router.push(`/admin/quotes?projectId=${projectId}`);
    } catch (error) {
      console.error('Error viewing quotes:', error);
      alert('Failed to view quotes');
    }
  };

  // Handle archive project
  const handleArchiveProject = async (projectId: string): Promise<boolean> => {
    try {
      const confirmed = confirm('Archive this project?');
      if (!confirmed) return false;
      
      // Implementation would depend on your API
      console.log('Archiving project:', projectId);
      alert('Project archived successfully! (Feature in development)');
      return true;
    } catch (error) {
      console.error('Error archiving project:', error);
      alert('Failed to archive project');
      return false;
    }
  };

  // Handle refresh data
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await enhancedProjectsService.getFullyEnhancedProjects();
      if (result.success && result.data) {
        setProjects(result.data);
        setError(undefined);
      } else {
        setError(result.error || 'Failed to refresh projects');
      }
    } catch (err) {
      setError('Failed to refresh projects');
      console.error('Error refreshing projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle create new project
  const handleCreateNew = () => {
    router.push('/admin/projects/new');
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">

      {/* Aggregation Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>📋 Total: {projects.length}</span>
          <span>🏃 Active: {projects.filter(p => p.status !== 'archived').length}</span>
          <span>📁 Archived: {projects.filter(p => p.status === 'archived').length}</span>
        </div>
      </div>

      <AdminDataGrid<Project>
        title="Projects"
        subtitle={showArchived ? "View and manage archived project records" : "Manage and track all project records"}
        data={filteredProjects}
        columns={columns}
        actions={actions}
        filters={filters}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
        onCreateNew={handleCreateNew}
        createButtonLabel="New Project"
        itemDisplayName="projects"
        searchFields={['title', 'propertyAddress', 'clientName', 'agentName', 'status']}
        defaultSortField="created"
        cardComponent={ProgressiveProjectCard}
        showArchiveToggle={true}
        showArchived={showArchived}
        onArchiveToggle={setShowArchived}
        allData={projects}
        customActions={{
          label: 'Project Actions',
          items: [
            {
              label: 'Export to PDF',
              onClick: () => alert('Export to PDF functionality will be implemented'),
            },
            {
              label: 'Generate Report',
              onClick: () => alert('Generate Report functionality will be implemented'),
            },
            {
              label: 'Bulk Operations',
              onClick: () => alert('Bulk Operations functionality will be implemented'),
            },
          ]
        }}
      />
    </div>
  );
}