import React from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import AnalyticsDashboard from '../../components/admin/analytics/AnalyticsDashboard';
import type { ReactElement } from 'react';

export default function AnalyticsPage() {
  return (
    <>
      <Head>
        <title>Analytics Dashboard - RealTechee Admin</title>
        <meta name="description" content="Comprehensive business analytics and performance insights" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <AnalyticsDashboard />
    </>
  );
}

// Use admin layout (includes auth check)
AnalyticsPage.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};