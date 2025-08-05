import React from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import type { ReactElement } from 'react';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement;
};
import AdminLayout from '../../components/admin/AdminLayout';
import ContactManagementPage from '../../components/admin/contacts/ContactManagementPage';

const ContactsPage: NextPageWithLayout = () => {
  return (
    <AdminLayout title="Contact Management" description="Manage contacts, agents, and project managers">
      <ContactManagementPage />
    </AdminLayout>
  );
};

// Custom layout to bypass the main site header
ContactsPage.getLayout = (page: React.ReactElement) => page;

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Add any server-side authentication checks here if needed
  return {
    props: {}
  };
};

export default ContactsPage;