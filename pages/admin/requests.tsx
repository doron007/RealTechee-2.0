import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { H2, P2 } from '../../components/typography';

const RequestsPage = () => {
  return (
    <AdminLayout 
      title="Requests" 
      description="Request management and CRUD operations"
    >
      <div className="text-center py-12">
        <H2 className="mb-4">Requests Management</H2>
        <P2 className="text-gray-600 mb-4">
          This section will be implemented in Phase 7 of the admin pages rollout.
        </P2>
        <P2 className="text-gray-500">
          Coming soon: Request CRUD operations, list view, detail/edit pages, and more.
        </P2>
        
        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6 max-w-2xl mx-auto">
          <H2 className="text-orange-900 mb-2 text-lg">Phase 7 Preview</H2>
          <div className="text-left space-y-2">
            <P2 className="text-orange-800">• Request list view with filtering and search</P2>
            <P2 className="text-orange-800">• Request detail/edit pages with media management</P2>
            <P2 className="text-orange-800">• Request review and approval workflow</P2>
            <P2 className="text-orange-800">• Integration with Quotes and Projects</P2>
            <P2 className="text-orange-800">• Communication and comment management</P2>
            <P2 className="text-orange-800">• Request status tracking and notifications</P2>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
RequestsPage.getLayout = (page: ReactElement) => page;

export default RequestsPage;