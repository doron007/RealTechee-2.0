import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import QuotesList from '../../components/admin/quotes/QuotesList';

const QuotesPage = () => {
  return (
    <AdminLayout 
      title="Quotes" 
      description="Quote management and CRUD operations"
    >
      <QuotesList />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
QuotesPage.getLayout = (page: ReactElement) => page;

export default QuotesPage;