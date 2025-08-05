import React from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import type { ReactElement } from 'react';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement;
};
import AdminLayout from '../../components/admin/AdminLayout';
import UserManagementPage from '../../components/admin/users/UserManagementPage';

const UsersPage: NextPageWithLayout = () => {
  return (
    <AdminLayout title="User Management" description="Manage user accounts and permissions">
      <UserManagementPage />
    </AdminLayout>
  );
};

// Custom layout to bypass the main site header
UsersPage.getLayout = (page: React.ReactElement) => page;

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Add any server-side authentication checks here if needed
  return {
    props: {}
  };
};

export default UsersPage;