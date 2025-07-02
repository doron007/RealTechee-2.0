import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { H2, P2 } from '../../components/typography';

const QuotesPage = () => {
  return (
    <AdminLayout 
      title="Quotes" 
      description="Quote management and CRUD operations"
    >
      <div className="text-center py-12">
        <H2 className="mb-4">Quotes Management</H2>
        <P2 className="text-gray-600 mb-4">
          This section will be implemented in Phase 5 of the admin pages rollout.
        </P2>
        <P2 className="text-gray-500">
          Coming soon: Quote CRUD operations, list view, detail/edit pages, and more.
        </P2>
        
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6 max-w-2xl mx-auto">
          <H2 className="text-purple-900 mb-2 text-lg">Phase 5 Preview</H2>
          <div className="text-left space-y-2">
            <P2 className="text-purple-800">• Quote list view with filtering and search</P2>
            <P2 className="text-purple-800">• Quote detail/edit pages with item management</P2>
            <P2 className="text-purple-800">• Quote approval workflow and e-signatures</P2>
            <P2 className="text-purple-800">• Change order creation and management</P2>
            <P2 className="text-purple-800">• Integration with Projects and Requests</P2>
            <P2 className="text-purple-800">• PDF generation and document management</P2>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
QuotesPage.getLayout = (page: ReactElement) => page;

export default QuotesPage;