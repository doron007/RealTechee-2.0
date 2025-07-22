import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Convenience methods for common notification types
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showNotification = useCallback((notificationData: Omit<Notification, 'id'>) => {
    const notification: Notification = {
      id: generateId(),
      duration: 6000, // Default 6 seconds
      ...notificationData,
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, notification.duration);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message?: string, duration: number = 4000) => {
    showNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string, duration: number = 8000) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string, duration: number = 6000) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string, duration: number = 5000) => {
    showNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }, [showNotification]);

  const contextValue: NotificationContextType = {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;