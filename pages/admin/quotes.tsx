import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import QuotesDataGrid from '../../components/admin/quotes/QuotesDataGrid';

const QuotesPage = () => {
  return (
    <AdminLayout 
      title="Quotes" 
      description="Quote management and CRUD operations"
    >
      <QuotesDataGrid />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
QuotesPage.getLayout = (page: ReactElement) => page;

export default QuotesPage;