import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Button,
  Slide,
  SlideProps
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Notification, useNotification } from '../../../contexts/NotificationContext';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface NotificationSnackbarProps {
  notification: Notification;
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({ notification }) => {
  const { dismissNotification } = useNotification();

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    dismissNotification(notification.id);
  };

  const getSeverity = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <Snackbar
      open={true}
      autoHideDuration={notification.duration || null}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        '& .MuiSnackbar-root': {
          position: 'fixed',
        }
      }}
    >
      <Alert
        severity={getSeverity(notification.type)}
        variant="filled"
        onClose={handleClose}
        sx={{
          minWidth: '300px',
          maxWidth: '500px',
          '& .MuiAlert-message': {
            width: '100%',
          },
          '& .MuiAlert-action': {
            alignItems: 'flex-start',
            paddingTop: '4px',
          }
        }}
        action={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            {notification.action && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  notification.action!.onClick();
                  dismissNotification(notification.id);
                }}
                sx={{
                  color: 'inherit',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  minWidth: 'unset',
                }}
              >
                {notification.action.label}
              </Button>
            )}
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
              sx={{
                padding: '2px',
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </div>
        }
      >
        <AlertTitle sx={{ marginBottom: notification.message ? '4px' : '0' }}>
          {notification.title}
        </AlertTitle>
        {notification.message && (
          <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
            {notification.message}
          </div>
        )}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;