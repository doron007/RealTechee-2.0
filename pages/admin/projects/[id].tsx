import { ReactElement } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import ProjectDetail from '../../../components/admin/projects/ProjectDetail';

const ProjectDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return (
      <AdminLayout 
        title="Project Not Found" 
        description="The requested project could not be found"
      >
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">Project not found</h2>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Project Details" 
      description="View and edit project information"
    >
      <ProjectDetail projectId={id} />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
ProjectDetailPage.getLayout = (page: ReactElement) => page;

export default ProjectDetailPage;