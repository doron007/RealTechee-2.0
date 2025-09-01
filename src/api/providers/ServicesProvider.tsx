/**
 * Services Provider for React Application
 * 
 * Provides service instances and configuration to the React component tree.
 * Integrates with React Query for optimal data fetching and caching.
 */

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { 
  ServiceRegistry, 
  initializeServices, 
  configureServices,
  getServiceStatus 
} from '../services/serviceFactory';
import type { RequestService } from '../../services/domain/request/RequestService';
import type { RequestRepository } from '../../repositories/RequestRepository';

// ============================================================================
// Context Definition
// ============================================================================

interface ServicesContextType {
  requestService: RequestService;
  requestRepository: RequestRepository;
  serviceRegistry: ServiceRegistry;
  isInitialized: boolean;
  status: ReturnType<typeof getServiceStatus>;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

// ============================================================================
// Provider Configuration
// ============================================================================

interface ServicesProviderProps {
  children: ReactNode;
  config?: {
    /** Custom QueryClient for React Query */
    queryClient?: QueryClient;
    /** Enable React Query devtools */
    enableDevtools?: boolean;
    /** Service configuration */
    services?: Parameters<typeof configureServices>[0];
    /** Environment override */
    environment?: 'development' | 'staging' | 'production';
  };
}

/**
 * Default QueryClient configuration optimized for the RealTechee application
 */
const createDefaultQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes after component unmounts
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500) {
          return error?.status === 408 || error?.status === 429;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once on failure for network errors
      retry: (failureCount, error: any) => {
        return failureCount < 1 && (!error?.status || error?.status >= 500);
      },
    },
  },
});

// ============================================================================
// Provider Component
// ============================================================================

export function ServicesProvider({ children, config = {} }: ServicesProviderProps) {
  const {
    queryClient = createDefaultQueryClient(),
    enableDevtools = process.env.NODE_ENV === 'development',
    services: serviceConfig,
    environment,
  } = config;

  // Initialize services on mount
  useEffect(() => {
    try {
      // Configure environment if specified
      // Note: NODE_ENV is read-only, but we can pass it to service configuration
      if (environment) {
        // Can't modify process.env.NODE_ENV directly as it's read-only
        console.log(`Services configured for ${environment} environment`);
      }
      
      // Apply service configuration
      if (serviceConfig) {
        configureServices(serviceConfig);
      }
      
      // Initialize services
      initializeServices();
      
      console.log('Services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  }, [serviceConfig, environment]);

  // Create context value
  const contextValue = useMemo(() => {
    const serviceRegistry = ServiceRegistry.getInstance();
    
    return {
      requestService: serviceRegistry.requests,
      requestRepository: serviceRegistry.requestRepository,
      serviceRegistry,
      isInitialized: true,
      status: getServiceStatus(),
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ServicesContext.Provider value={contextValue}>
        {children}
        {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </ServicesContext.Provider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook to access the services context
 */
export function useServices(): ServicesContextType {
  const context = useContext(ServicesContext);
  
  if (!context) {
    throw new Error(
      'useServices must be used within a ServicesProvider. ' +
      'Make sure to wrap your app with <ServicesProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to access the RequestService
 */
export function useRequestService(): RequestService {
  const { requestService } = useServices();
  return requestService;
}

/**
 * Hook to access the RequestRepository
 */
export function useRequestRepository(): RequestRepository {
  const { requestRepository } = useServices();
  return requestRepository;
}

/**
 * Hook to access the ServiceRegistry
 */
export function useServiceRegistry(): ServiceRegistry {
  const { serviceRegistry } = useServices();
  return serviceRegistry;
}

/**
 * Hook to get service initialization status
 */
export function useServicesStatus() {
  const { isInitialized, status } = useServices();
  return { isInitialized, status };
}

// ============================================================================
// Higher-Order Component
// ============================================================================

/**
 * HOC to provide services to a component tree
 */
export function withServices<P extends object>(
  Component: React.ComponentType<P>,
  providerConfig?: ServicesProviderProps['config']
) {
  const WithServicesComponent = (props: P) => (
    <ServicesProvider config={providerConfig}>
      <Component {...props} />
    </ServicesProvider>
  );
  
  WithServicesComponent.displayName = `withServices(${Component.displayName || Component.name})`;
  
  return WithServicesComponent;
}

// ============================================================================
// Development Utilities
// ============================================================================

/**
 * Component for debugging service status
 */
export function ServicesDebugInfo() {
  const { status, isInitialized } = useServices();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace',
    }}>
      <div>Services Status:</div>
      <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
      <div>GraphQL Client: {status.graphqlClient ? '✅' : '❌'}</div>
      <div>Request Repository: {status.requestRepository ? '✅' : '❌'}</div>
      <div>Request Service: {status.requestService ? '✅' : '❌'}</div>
      <div>Environment: {status.config.environment}</div>
    </div>
  );
}

/**
 * Error boundary for service-related errors
 */
interface ServicesErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ServicesErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ServicesErrorBoundary extends React.Component<
  ServicesErrorBoundaryProps,
  ServicesErrorBoundaryState
> {
  constructor(props: ServicesErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ServicesErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Services error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Service Error</h2>
          <p>Something went wrong with the services.</p>
          <details style={{ marginTop: '10px', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ marginTop: '10px', fontSize: '12px' }}>
              {this.state.error?.message}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Complete Services Setup
// ============================================================================

/**
 * Complete services setup with error boundary and debug info
 */
export function CompleteServicesProvider({ 
  children, 
  config,
  showDebugInfo = process.env.NODE_ENV === 'development' 
}: ServicesProviderProps & { showDebugInfo?: boolean }) {
  return (
    <ServicesErrorBoundary>
      <ServicesProvider config={config}>
        {children}
        {showDebugInfo && <ServicesDebugInfo />}
      </ServicesProvider>
    </ServicesErrorBoundary>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default ServicesProvider;