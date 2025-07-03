import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ProjectsList from '../../components/admin/projects/ProjectsList';

const ProjectsPage = () => {
  return (
    <AdminLayout 
      title="Projects" 
      description="Project management and CRUD operations"
    >
      <ProjectsList />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
ProjectsPage.getLayout = (page: ReactElement) => page;

export default ProjectsPage;