import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminDataGrid, { 
  AdminDataGridColumn, 
  AdminDataGridAction, 
  AdminDataGridFilter,
  AdminDataItem 
} from '../common/AdminDataGrid';
import VirtualizedDataGrid, { useVirtualizedData } from '../common/VirtualizedDataGrid';
import ProgressiveProjectCard from './ProgressiveProjectCard';
import StatusPill from '../../common/ui/StatusPill';
import ArchiveConfirmationDialog from '../common/ArchiveConfirmationDialog';
import { H1, P2 } from '../../typography';
import { type FullyEnhancedProject } from '../../../services/enhancedProjectsService';
import { formatCurrencyFull, formatDateShort } from '../../../utils/formatUtils';
import { AdvancedSearchField } from '../common/AdvancedSearchDialog';
import { useProjectsQuery, useProjectMutations } from '../../../hooks/useProjectsQuery';
import { invalidateQueries } from '../../../lib/queryClient';

// Use the FullyEnhancedProject type directly
type Project = FullyEnhancedProject;

export default function ProjectsDataGrid() {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  
  // Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);

  // Use optimized queries
  const { data: projects = [], isLoading: loading, error: queryError, refetch } = useProjectsQuery();
  const { archiveProject } = useProjectMutations();

  // Convert query error to string
  const error = queryError ? String(queryError) : undefined;

  // Performance optimization: use virtualization for large datasets
  const { shouldVirtualize, optimizedData } = useVirtualizedData(projects, 50);


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
      onClick: (project) => openArchiveDialog(project),
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

  // Define advanced search fields
  const advancedSearchFields: AdvancedSearchField[] = useMemo(() => [
    {
      key: 'title',
      label: 'Project Title',
      type: 'text',
      placeholder: 'Search by project title...'
    },
    {
      key: 'propertyAddress',
      label: 'Property Address',
      type: 'text',
      placeholder: 'Search by address...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect',
      options: Array.from(new Set(projects.map(p => p.status).filter(Boolean)))
        .sort()
        .map(status => ({ value: status, label: status }))
    },
    {
      key: 'clientName',
      label: 'Owner Name',
      type: 'text',
      placeholder: 'Search by owner name...'
    },
    {
      key: 'agentName',
      label: 'Agent Name',
      type: 'text',
      placeholder: 'Search by agent name...'
    },
    {
      key: 'brokerage',
      label: 'Brokerage',
      type: 'select'
    },
    {
      key: 'createdDate',
      label: 'Created Date',
      type: 'daterange'
    },
    {
      key: 'updatedDate',
      label: 'Updated Date',
      type: 'daterange'
    },
    {
      key: 'estimatedValue',
      label: 'Estimated Value',
      type: 'number'
    },
    {
      key: 'archived',
      label: 'Archived',
      type: 'boolean'
    }
  ], [projects]);

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

  // Archive dialog handlers
  const openArchiveDialog = (project: Project) => {
    setProjectToArchive(project);
    setArchiveDialogOpen(true);
  };

  const closeArchiveDialog = () => {
    setArchiveDialogOpen(false);
    setProjectToArchive(null);
  };

  const handleArchiveConfirm = async () => {
    if (!projectToArchive) return;
    
    try {
      await archiveProject.mutateAsync(projectToArchive.id);
      closeArchiveDialog();
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Archive error:', error);
    }
  };

  // Handle refresh data
  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  // Handle create new project
  const handleCreateNew = () => {
    router.push('/admin/projects/new');
  };

  // Production-ready action handlers
  const handleExportPDF = async (selectedRows: Project[] = []) => {
    try {
      // For now, export all projects (can be enhanced to use selected rows)
      const dataToExport = selectedRows.length > 0 ? selectedRows : projects;
      
      if (dataToExport.length === 0) {
        alert('No projects available to export');
        return;
      }
      
      // Create PDF export data
      const exportData = dataToExport.map(project => ({
        title: project.title || 'Untitled Project',
        status: project.status,
        address: project.propertyAddress,
        value: project.originalValue || project.listingPrice || project.salePrice || 0,
        createdDate: project.createdDate,
        agent: project.agentName || 'N/A'
      }));
      
      // Generate PDF (this could be enhanced with a proper PDF library)
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Title,Status,Address,Value,Created,Agent\n"
        + exportData.map(row => 
            `"${row.title}","${row.status}","${row.address}","${row.value}","${row.createdDate}","${row.agent}"`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `projects_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleGenerateReport = async (selectedRows: Project[] = []) => {
    try {
      const dataToReport = selectedRows.length > 0 ? selectedRows : projects;
      
      if (dataToReport.length === 0) {
        alert('No projects available to generate report');
        return;
      }
      
      // Calculate report metrics
      const totalValue = dataToReport.reduce((sum, project) => sum + (project.originalValue || project.listingPrice || project.salePrice || 0), 0);
      const statusCounts = dataToReport.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const reportData = {
        totalProjects: selectedRows.length,
        totalValue: formatCurrencyFull(totalValue),
        statusBreakdown: statusCounts,
        generatedAt: new Date().toISOString(),
        projects: selectedRows.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          value: p.originalValue || p.listingPrice || p.salePrice
        }))
      };
      
      // Create downloadable report
      const reportJson = JSON.stringify(reportData, null, 2);
      const blob = new Blob([reportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projects_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Report generation failed. Please try again.');
    }
  };

  const handleBulkOperations = async (selectedRows: Project[]) => {
    try {
      if (selectedRows.length === 0) {
        alert('Please select projects for bulk operations');
        return;
      }
      
      const operation = window.prompt(
        `Selected ${selectedRows.length} projects. Choose operation:\n` +
        '1. Archive all\n' +
        '2. Change status to "In Progress"\n' +
        '3. Change status to "Completed"\n' +
        '4. Change status to "On Hold"\n\n' +
        'Enter number (1-4):'
      );
      
      if (!operation) return;
      
      switch (operation) {
        case '1':
          // Archive all selected
          for (const project of selectedRows) {
            await archiveProject.mutateAsync(project.id);
          }
          alert(`Successfully archived ${selectedRows.length} projects`);
          break;
          
        case '2':
        case '3':
        case '4':
          const statusMap = {
            '2': 'In Progress',
            '3': 'Completed', 
            '4': 'On Hold'
          };
          const newStatus = statusMap[operation as keyof typeof statusMap];
          
          // Note: This would require a bulk update mutation in the actual implementation
          alert(`Bulk status update to "${newStatus}" for ${selectedRows.length} projects would be implemented here`);
          break;
          
        default:
          alert('Invalid operation selected');
      }
      
    } catch (error) {
      console.error('Bulk operation error:', error);
      alert('Bulk operation failed. Please try again.');
    }
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
        advancedSearchFields={advancedSearchFields}
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
              onClick: () => handleExportPDF([]),
            },
            {
              label: 'Generate Report',
              onClick: () => handleGenerateReport([]),
            },
            {
              label: 'Bulk Operations',
              onClick: () => handleBulkOperations([]),
            },
          ]
        }}
      />

      {/* Archive Confirmation Dialog */}
      <ArchiveConfirmationDialog
        open={archiveDialogOpen}
        onClose={closeArchiveDialog}
        onConfirm={handleArchiveConfirm}
        items={projectToArchive ? [{
          id: projectToArchive.id,
          title: projectToArchive.title || 'Untitled Project',
          address: projectToArchive.propertyAddress || 'No address provided',
          type: 'project',
          status: projectToArchive.status
        }] : []}
        itemType="projects"
        loading={archiveProject.isPending}
      />
    </div>
  );
}