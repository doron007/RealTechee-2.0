import React from 'react';
import { GetServerSideProps } from 'next';
import AdminLayout from '../../components/admin/AdminLayout';
import LifecycleDashboard from '../../components/admin/lifecycle/LifecycleDashboard';
import { Box, Typography } from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';

interface LifecyclePageProps {
  // Add any server-side props if needed
}

const LifecyclePage: React.FC<LifecyclePageProps> = () => {
  return (
    <AdminLayout>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Page Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 3,
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <TimelineIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h1">
              Lead Lifecycle Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor lead expiration, manage archival, and track lifecycle analytics
            </Typography>
          </Box>
        </Box>

        {/* Main Dashboard Content */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          px: 0 // Let LifecycleDashboard handle its own padding
        }}>
          <LifecycleDashboard />
        </Box>
      </Box>
    </AdminLayout>
  );
};

export default LifecyclePage;

// Add server-side rendering if needed for authentication
export const getServerSideProps: GetServerSideProps = async (context) => {
  // Add authentication checks here if needed
  // For now, return empty props
  return {
    props: {}
  };
};