import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import RequestsDataGrid from '../../components/admin/requests/RequestsDataGrid';

const RequestsPage = () => {
  return (
    <AdminLayout 
      title="Requests" 
      description="Request management and CRUD operations"
    >
      <RequestsDataGrid />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
RequestsPage.getLayout = (page: ReactElement) => page;

export default RequestsPage;