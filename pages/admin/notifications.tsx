import React from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import type { ReactElement } from 'react';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement;
};
import AdminLayout from '../../components/admin/AdminLayout';
import NotificationManagementPage from '../../components/admin/notifications/NotificationManagementPage';

const NotificationsPage: NextPageWithLayout = () => {
  return (
    <AdminLayout title="Notification Management" description="Manage notification queue, templates, and monitoring">
      <NotificationManagementPage />
    </AdminLayout>
  );
};

// Custom layout to bypass the main site header
NotificationsPage.getLayout = (page: React.ReactElement) => page;

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Add any server-side authentication checks here if needed
  return {
    props: {}
  };
};

export default NotificationsPage;