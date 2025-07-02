import { ReactElement } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';

const AdminPage = () => {
  return (
    <AdminLayout 
      title="Dashboard" 
      description="Admin dashboard for RealTechee backoffice management"
    >
      <AdminDashboard />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
AdminPage.getLayout = (page: ReactElement) => page;

export default AdminPage;