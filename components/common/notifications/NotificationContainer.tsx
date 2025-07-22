import React from 'react';
import { Box } from '@mui/material';
import { useNotification } from '../../../contexts/NotificationContext';
import NotificationSnackbar from './NotificationSnackbar';

const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'hidden',
        pointerEvents: 'none',
        '& > *': {
          pointerEvents: 'auto',
        }
      }}
    >
      {notifications.map((notification) => (
        <NotificationSnackbar key={notification.id} notification={notification} />
      ))}
    </Box>
  );
};

export default NotificationContainer;