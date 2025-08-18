import { ReactElement } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import NotificationManagementDashboard from '../../components/admin/notifications/NotificationManagementDashboard';

const NotificationMonitorPage = () => {
  return (
    <AdminLayout 
      title="Notification Monitor" 
      description="Real-time notification monitoring and management"
    >
      <NotificationManagementDashboard />
    </AdminLayout>
  );
};

// Use custom layout to bypass public Layout wrapper
NotificationMonitorPage.getLayout = (page: ReactElement) => page;

export default NotificationMonitorPage;