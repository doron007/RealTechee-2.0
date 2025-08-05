import React from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import type { ReactElement } from 'react';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement;
};
import AdminLayout from '../../components/admin/AdminLayout';
import SystemConfigPage from '../../components/admin/system/SystemConfigPage';

const SystemPage: NextPageWithLayout = () => {
  return (
    <AdminLayout title="System Configuration" description="Manage system settings and environment configuration">
      <SystemConfigPage />
    </AdminLayout>
  );
};

// Custom layout to bypass the main site header
SystemPage.getLayout = (page: React.ReactElement) => page;

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Add any server-side authentication checks here if needed
  return {
    props: {}
  };
};

export default SystemPage;