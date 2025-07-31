import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminConfigurationPage from '../../components/admin/AdminConfigurationPage';

const ConfigurationPage = () => {
  return (
    <AdminLayout 
      title="System Configuration" 
      description="System configuration and environment validation for super administrators"
    >
      <AdminConfigurationPage />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
ConfigurationPage.getLayout = (page: ReactElement) => page;

export default ConfigurationPage;