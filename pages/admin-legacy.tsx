import { ReactElement } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import LegacyAdminTabs from '../components/admin/LegacyAdminTabs';

const AdminLegacyPage = () => {
  return (
    <AdminLayout 
      title="Legacy Admin" 
      description="Legacy admin panel with user, contact, and notification management"
    >
      <LegacyAdminTabs />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
AdminLegacyPage.getLayout = (page: ReactElement) => page;

export default AdminLegacyPage;