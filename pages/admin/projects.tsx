import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { H2, P2 } from '../../components/typography';

const ProjectsPage = () => {
  return (
    <AdminLayout 
      title="Projects" 
      description="Project management and CRUD operations"
    >
      <div className="text-center py-12">
        <H2 className="mb-4">Projects Management</H2>
        <P2 className="text-gray-600 mb-4">
          This section will be implemented in Phase 3 of the admin pages rollout.
        </P2>
        <P2 className="text-gray-500">
          Coming soon: Project CRUD operations, list view, detail/edit pages, and more.
        </P2>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
          <H2 className="text-blue-900 mb-2 text-lg">Phase 3 Preview</H2>
          <div className="text-left space-y-2">
            <P2 className="text-blue-800">• Project list view with filtering and search</P2>
            <P2 className="text-blue-800">• Project detail/edit pages with gallery management</P2>
            <P2 className="text-blue-800">• Milestone and payment terms management</P2>
            <P2 className="text-blue-800">• Project comments and audit log</P2>
            <P2 className="text-blue-800">• Status workflow management</P2>
            <P2 className="text-blue-800">• Integration with Quotes and Requests</P2>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
ProjectsPage.getLayout = (page: ReactElement) => page;

export default ProjectsPage;