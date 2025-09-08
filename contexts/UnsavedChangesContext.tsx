import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { sessionStorageService } from '../services/core/sessionStorageService';

export interface UnsavedChangesState {
  [key: string]: {
    entityType: 'project' | 'quote' | 'request';
    entityId: string;
    hasChanges: boolean;
    lastSaved: Date | null;
  };
}

interface UnsavedChangesContextType {
  unsavedChanges: UnsavedChangesState;
  registerEntity: (key: string, entityType: 'project' | 'quote' | 'request', entityId: string) => void;
  updateEntityState: (key: string, hasChanges: boolean, lastSaved?: Date | null) => void;
  removeEntity: (key: string) => void;
  hasAnyUnsavedChanges: () => boolean;
  getUnsavedEntitiesCount: () => number;
  clearAllUnsavedChanges: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export const UnsavedChangesProvider: React.FC<UnsavedChangesProviderProps> = ({ children }) => {
  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChangesState>({});

  // Register a new entity for tracking
  const registerEntity = useCallback((key: string, entityType: 'project' | 'quote' | 'request', entityId: string) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [key]: {
        entityType,
        entityId,
        hasChanges: false,
        lastSaved: null
      }
    }));
  }, []);

  // Update entity state
  const updateEntityState = useCallback((key: string, hasChanges: boolean, lastSaved?: Date | null) => {
    setUnsavedChanges(prev => {
      if (!prev[key]) return prev;
      
      return {
        ...prev,
        [key]: {
          ...prev[key],
          hasChanges,
          lastSaved: lastSaved !== undefined ? lastSaved : prev[key].lastSaved
        }
      };
    });
  }, []);

  // Remove entity from tracking
  const removeEntity = useCallback((key: string) => {
    setUnsavedChanges(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  // Check if any entity has unsaved changes
  const hasAnyUnsavedChanges = useCallback(() => {
    return Object.values(unsavedChanges).some(entity => entity.hasChanges);
  }, [unsavedChanges]);

  // Get count of entities with unsaved changes
  const getUnsavedEntitiesCount = useCallback(() => {
    return Object.values(unsavedChanges).filter(entity => entity.hasChanges).length;
  }, [unsavedChanges]);

  // Clear all unsaved changes
  const clearAllUnsavedChanges = useCallback(() => {
    sessionStorageService.clearAllUnsavedChanges();
    setUnsavedChanges({});
  }, []);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasAnyUnsavedChanges()) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasAnyUnsavedChanges]);

  // Debug logging
  useEffect(() => {
    const count = getUnsavedEntitiesCount();
    if (count > 0) {
      console.debug(`UnsavedChanges: ${count} entities with unsaved changes`);
    }
  }, [getUnsavedEntitiesCount]);

  const contextValue: UnsavedChangesContextType = {
    unsavedChanges,
    registerEntity,
    updateEntityState,
    removeEntity,
    hasAnyUnsavedChanges,
    getUnsavedEntitiesCount,
    clearAllUnsavedChanges
  };

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChangesContext = (): UnsavedChangesContextType => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChangesContext must be used within an UnsavedChangesProvider');
  }
  return context;
};

export default UnsavedChangesContext;