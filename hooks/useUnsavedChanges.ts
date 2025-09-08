import { useEffect, useRef, useCallback, useState } from 'react';
import { sessionStorageService, UnsavedChangesData } from '../services/core/sessionStorageService';
import { useNotification } from '../contexts/NotificationContext';

export interface UseUnsavedChangesOptions {
  entityType: 'project' | 'quote' | 'request';
  entityId: string;
  originalData: Record<string, any>;
  currentData: Record<string, any>;
  enabled?: boolean;
  autoSaveDelay?: number; // Delay in ms before auto-saving
  onRestore?: (restoredData: Record<string, any>) => void;
}

export interface UseUnsavedChangesResult {
  hasUnsavedChanges: boolean;
  hasStoredChanges: boolean;
  saveChanges: () => void;
  clearStoredChanges: () => void;
  restoreChanges: () => void;
  discardChanges: () => void;
  lastSavedAt: Date | null;
}

export const useUnsavedChanges = ({
  entityType,
  entityId,
  originalData,
  currentData,
  enabled = true,
  autoSaveDelay = 2000,
  onRestore
}: UseUnsavedChangesOptions): UseUnsavedChangesResult => {
  const { showInfo, showWarning } = useNotification();
  const [hasStoredChanges, setHasStoredChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');

  // Check if current form data differs from original
  const hasUnsavedChanges = enabled && 
    sessionStorageService.hasFormDataChanged(originalData, currentData);

  // Check for stored changes on mount and when entity changes
  useEffect(() => {
    if (!enabled || !entityId) return;

    const stored = sessionStorageService.hasUnsavedChanges(entityType, entityId);
    setHasStoredChanges(stored);

    if (stored) {
      const data = sessionStorageService.loadUnsavedChanges(entityType, entityId);
      if (data) {
        console.debug(`Found stored changes for ${entityType}:${entityId} from ${new Date(data.timestamp).toLocaleString()}`);
      }
    }
  }, [entityType, entityId, enabled]);

  // Auto-save changes with debouncing
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges || !entityId) return;

    const currentDataString = JSON.stringify(currentData);
    
    // Only save if data actually changed
    if (currentDataString === lastDataRef.current) {
      return;
    }

    lastDataRef.current = currentDataString;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, autoSaveDelay);

    // Cleanup on unmount or dependency change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentData, hasUnsavedChanges, enabled, entityId, autoSaveDelay]);

  // Manual save function
  const saveChanges = useCallback(() => {
    if (!enabled || !entityId) return;

    try {
      const unsavedData: UnsavedChangesData = {
        entityType,
        entityId,
        formData: currentData,
        timestamp: Date.now()
      };

      sessionStorageService.saveUnsavedChanges(unsavedData);
      setHasStoredChanges(true);
      setLastSavedAt(new Date());

      console.debug(`Saved unsaved changes for ${entityType}:${entityId}`);
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  }, [entityType, entityId, currentData, enabled]);

  // Clear stored changes
  const clearStoredChanges = useCallback(() => {
    if (!enabled || !entityId) return;

    sessionStorageService.clearUnsavedChanges(entityType, entityId);
    setHasStoredChanges(false);
    setLastSavedAt(null);
    
    showInfo('Changes Cleared', 'Stored draft changes have been cleared.', 3000);
  }, [entityType, entityId, enabled, showInfo]);

  // Restore changes from storage
  const restoreChanges = useCallback(() => {
    if (!enabled || !entityId) return;

    const stored = sessionStorageService.loadUnsavedChanges(entityType, entityId);
    if (stored && onRestore) {
      onRestore(stored.formData);
      showInfo(
        'Changes Restored', 
        `Draft changes from ${new Date(stored.timestamp).toLocaleString()} have been restored.`,
        4000
      );
    }
  }, [entityType, entityId, enabled, onRestore, showInfo]);

  // Discard current changes and clear storage
  const discardChanges = useCallback(() => {
    if (!enabled || !entityId) return;

    sessionStorageService.clearUnsavedChanges(entityType, entityId);
    setHasStoredChanges(false);
    setLastSavedAt(null);

    // Reset form to original data if onRestore is provided
    if (onRestore) {
      onRestore(originalData);
    }

    showWarning('Changes Discarded', 'All unsaved changes have been discarded.', 4000);
  }, [entityType, entityId, enabled, onRestore, originalData, showWarning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    hasUnsavedChanges,
    hasStoredChanges,
    saveChanges,
    clearStoredChanges,
    restoreChanges,
    discardChanges,
    lastSavedAt
  };
};

export default useUnsavedChanges;