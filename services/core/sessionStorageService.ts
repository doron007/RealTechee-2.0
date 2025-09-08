/**
 * Session Storage Service for managing unsaved changes
 * Provides namespace-based storage for different entity types (projects, quotes, requests)
 */

export interface UnsavedChangesData {
  entityType: 'project' | 'quote' | 'request';
  entityId: string;
  formData: Record<string, any>;
  timestamp: number;
  userId?: string;
}

class SessionStorageService {
  private storageKeyPrefix = 'realtechee-unsaved-changes';

  /**
   * Generate a unique storage key for an entity
   */
  private getStorageKey(entityType: string, entityId: string): string {
    return `${this.storageKeyPrefix}-${entityType}-${entityId}`;
  }

  /**
   * Save unsaved changes to session storage
   */
  saveUnsavedChanges(data: UnsavedChangesData): void {
    try {
      const key = this.getStorageKey(data.entityType, data.entityId);
      const payload = {
        ...data,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(key, JSON.stringify(payload));
      console.debug(`Saved unsaved changes for ${data.entityType}:${data.entityId}`);
    } catch (error) {
      console.error('Failed to save unsaved changes:', error);
    }
  }

  /**
   * Load unsaved changes from session storage
   */
  loadUnsavedChanges(entityType: string, entityId: string): UnsavedChangesData | null {
    try {
      const key = this.getStorageKey(entityType, entityId);
      const stored = sessionStorage.getItem(key);
      
      if (!stored) {
        return null;
      }

      const data = JSON.parse(stored) as UnsavedChangesData;
      
      // Check if data is too old (older than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - data.timestamp > maxAge) {
        this.clearUnsavedChanges(entityType, entityId);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load unsaved changes:', error);
      return null;
    }
  }

  /**
   * Clear unsaved changes for a specific entity
   */
  clearUnsavedChanges(entityType: string, entityId: string): void {
    try {
      const key = this.getStorageKey(entityType, entityId);
      sessionStorage.removeItem(key);
      console.debug(`Cleared unsaved changes for ${entityType}:${entityId}`);
    } catch (error) {
      console.error('Failed to clear unsaved changes:', error);
    }
  }

  /**
   * Check if there are unsaved changes for a specific entity
   */
  hasUnsavedChanges(entityType: string, entityId: string): boolean {
    const data = this.loadUnsavedChanges(entityType, entityId);
    return data !== null;
  }

  /**
   * Get all entities with unsaved changes
   */
  getAllUnsavedChanges(): UnsavedChangesData[] {
    const unsavedChanges: UnsavedChangesData[] = [];
    
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.storageKeyPrefix)) {
          const stored = sessionStorage.getItem(key);
          if (stored) {
            try {
              const data = JSON.parse(stored) as UnsavedChangesData;
              unsavedChanges.push(data);
            } catch (parseError) {
              console.warn(`Failed to parse stored data for key ${key}:`, parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get all unsaved changes:', error);
    }

    return unsavedChanges;
  }

  /**
   * Clear all unsaved changes (useful for logout or cleanup)
   */
  clearAllUnsavedChanges(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.storageKeyPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.debug(`Cleared ${keysToRemove.length} unsaved changes entries`);
    } catch (error) {
      console.error('Failed to clear all unsaved changes:', error);
    }
  }

  /**
   * Compare form data to detect changes
   */
  hasFormDataChanged(originalData: Record<string, any>, currentData: Record<string, any>): boolean {
    try {
      // Deep comparison of form data
      return JSON.stringify(this.normalizeFormData(originalData)) !== 
             JSON.stringify(this.normalizeFormData(currentData));
    } catch (error) {
      console.error('Failed to compare form data:', error);
      return true; // Assume changed if comparison fails
    }
  }

  /**
   * Normalize form data for comparison (remove empty values, sort keys)
   */
  private normalizeFormData(data: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    Object.keys(data)
      .sort()
      .forEach(key => {
        const value = data[key];
        // Skip undefined, null, and empty string values
        if (value !== undefined && value !== null && value !== '') {
          normalized[key] = value;
        }
      });

    return normalized;
  }

  /**
   * Get storage usage summary for debugging
   */
  getStorageInfo(): { 
    totalEntries: number; 
    unsavedChangesEntries: number; 
    storageUsed: string 
  } {
    let totalEntries = 0;
    let unsavedChangesEntries = 0;
    let totalSize = 0;

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          totalEntries++;
          const value = sessionStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
          
          if (key.startsWith(this.storageKeyPrefix)) {
            unsavedChangesEntries++;
          }
        }
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }

    return {
      totalEntries,
      unsavedChangesEntries,
      storageUsed: `${(totalSize / 1024).toFixed(2)} KB`
    };
  }
}

// Create and export singleton instance
export const sessionStorageService = new SessionStorageService();
export default sessionStorageService;