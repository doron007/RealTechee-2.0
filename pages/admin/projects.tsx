import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ProjectsDataGrid from '../../components/admin/projects/ProjectsDataGrid';

const ProjectsPage = () => {
  return (
    <AdminLayout 
      title="Projects" 
      description="Project management and CRUD operations"
    >
      <ProjectsDataGrid />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
ProjectsPage.getLayout = (page: ReactElement) => page;

export default ProjectsPage;