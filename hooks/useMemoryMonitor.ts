import { useEffect } from 'react';
import { memoryMonitor } from '../utils/memoryMonitor';

/**
 * Hook to monitor memory usage in development
 */
export function useMemoryMonitor(componentName: string, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === 'production') {
      return;
    }

    memoryMonitor.track(`${componentName}: Component mounted`);

    // Start periodic monitoring for this component
    const stopMonitoring = memoryMonitor.startPeriodicMonitoring(30000);

    return () => {
      memoryMonitor.track(`${componentName}: Component unmounting`);
      stopMonitoring();
      
      // Check for memory leaks on unmount
      const leakCheck = memoryMonitor.checkForLeaks();
      if (leakCheck.isLeaking) {
        console.warn(`[${componentName}] Memory leak detected:`, leakCheck);
      }
    };
  }, [componentName, enabled]);

  // Return utility functions for manual tracking
  return {
    track: (label: string) => {
      if (enabled && process.env.NODE_ENV === 'development') {
        memoryMonitor.track(`${componentName}: ${label}`);
      }
    },
    getCurrentUsage: () => memoryMonitor.getCurrentUsage(),
    getTrend: () => memoryMonitor.getTrend(),
    forceGC: () => memoryMonitor.forceGC()
  };
}