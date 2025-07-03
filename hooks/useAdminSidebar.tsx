import { useState, useEffect } from 'react';

export const useAdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return {
    isCollapsed,
    toggle
  };
};