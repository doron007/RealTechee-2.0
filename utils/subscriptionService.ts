import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';
import { queryClient, queryKeys } from '../lib/queryClient';
import { createLogger } from './logger';

// Create subscription client
const subscriptionClient = generateClient<Schema>({
  authMode: 'userPool' // Subscriptions typically require authentication
});

const subscriptionLogger = createLogger('Subscriptions');

// Subscription management for real-time updates
export class SubscriptionService {
  private static instance: SubscriptionService;
  private activeSubscriptions = new Map<string, any>();
  private subscriptionCallbacks = new Map<string, Set<Function>>();

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Subscribe to real-time updates for a specific model
   */
  subscribeToModel(
    modelName: keyof Schema['models'],
    operation: 'onCreate' | 'onUpdate' | 'onDelete',
    callback: (data: any) => void,
    filter?: any
  ): () => void {
    const subscriptionKey = `${modelName}_${operation}`;
    
    subscriptionLogger.info('Setting up subscription', { 
      modelName, 
      operation, 
      subscriptionKey 
    });

    // Add callback to callback set
    if (!this.subscriptionCallbacks.has(subscriptionKey)) {
      this.subscriptionCallbacks.set(subscriptionKey, new Set());
    }
    this.subscriptionCallbacks.get(subscriptionKey)!.add(callback);

    // Create subscription if not already active
    if (!this.activeSubscriptions.has(subscriptionKey)) {
      this.createSubscription(modelName, operation, subscriptionKey, filter);
    }

    // Return cleanup function
    return () => {
      this.unsubscribeCallback(subscriptionKey, callback);
    };
  }

  /**
   * Create the actual GraphQL subscription
   */
  private createSubscription(
    modelName: keyof Schema['models'],
    operation: 'onCreate' | 'onUpdate' | 'onDelete',
    subscriptionKey: string,
    filter?: any
  ) {
    try {
      subscriptionLogger.info('Creating GraphQL subscription', { 
        modelName, 
        operation, 
        subscriptionKey 
      });

      let subscription;

      // Map to Amplify subscription methods
      switch (operation) {
        case 'onCreate':
          subscription = (subscriptionClient.models as any)[modelName].onCreate(filter);
          break;
        case 'onUpdate':
          subscription = (subscriptionClient.models as any)[modelName].onUpdate(filter);
          break;
        case 'onDelete':
          subscription = (subscriptionClient.models as any)[modelName].onDelete(filter);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      // Subscribe and handle data
      const subscriptionObserver = subscription.subscribe({
        next: (data: any) => {
          subscriptionLogger.debug('Subscription data received', { 
            subscriptionKey, 
            operation,
            dataId: data?.id 
          });

          // Notify all callbacks for this subscription
          const callbacks = this.subscriptionCallbacks.get(subscriptionKey);
          if (callbacks) {
            callbacks.forEach(callback => {
              try {
                callback(data);
              } catch (error) {
                subscriptionLogger.error('Error in subscription callback', error);
              }
            });
          }

          // Update React Query cache automatically
          this.updateQueryCache(modelName, operation, data);
        },
        error: (error: any) => {
          subscriptionLogger.error('Subscription error', { 
            subscriptionKey, 
            error 
          });
        }
      });

      this.activeSubscriptions.set(subscriptionKey, subscriptionObserver);
      
      subscriptionLogger.info('Subscription created successfully', { subscriptionKey });
    } catch (error) {
      subscriptionLogger.error('Failed to create subscription', { 
        subscriptionKey, 
        error 
      });
    }
  }

  /**
   * Update React Query cache based on subscription data
   */
  private updateQueryCache(
    modelName: keyof Schema['models'],
    operation: 'onCreate' | 'onUpdate' | 'onDelete',
    data: any
  ) {
    try {
      subscriptionLogger.debug('Updating query cache', { 
        modelName, 
        operation, 
        dataId: data?.id 
      });

      // Update cache based on model type
      switch (modelName) {
        case 'Projects':
          this.updateProjectsCache(operation, data);
          break;
        case 'Quotes':
          this.updateQuotesCache(operation, data);
          break;
        case 'Requests':
          this.updateRequestsCache(operation, data);
          break;
        case 'Contacts':
          this.updateContactsCache(operation, data);
          break;
        case 'Properties':
          this.updatePropertiesCache(operation, data);
          break;
        case 'ProjectComments':
          this.updateProjectCommentsCache(operation, data);
          break;
        case 'NotificationQueue':
          this.updateNotificationCache(operation, data);
          break;
        default:
          // Generic cache update for other models
          this.updateGenericCache(modelName, operation, data);
      }
    } catch (error) {
      subscriptionLogger.error('Error updating query cache', { 
        modelName, 
        operation, 
        error 
      });
    }
  }

  /**
   * Update Projects cache
   */
  private updateProjectsCache(operation: string, data: any) {
    switch (operation) {
      case 'onCreate':
        queryClient.setQueryData(queryKeys.projects, (oldData: any) => 
          oldData ? [...oldData, data] : [data]
        );
        break;
      case 'onUpdate':
        queryClient.setQueryData(queryKeys.projects, (oldData: any) => 
          oldData?.map((item: any) => item.id === data.id ? data : item) || [data]
        );
        queryClient.setQueryData(queryKeys.project(data.id), data);
        break;
      case 'onDelete':
        queryClient.setQueryData(queryKeys.projects, (oldData: any) => 
          oldData?.filter((item: any) => item.id !== data.id) || []
        );
        queryClient.removeQueries({ queryKey: queryKeys.project(data.id) });
        break;
    }
    
    // Invalidate analytics that depend on projects
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
  }

  /**
   * Update Quotes cache
   */
  private updateQuotesCache(operation: string, data: any) {
    switch (operation) {
      case 'onCreate':
        queryClient.setQueryData(queryKeys.quotes, (oldData: any) => 
          oldData ? [...oldData, data] : [data]
        );
        break;
      case 'onUpdate':
        queryClient.setQueryData(queryKeys.quotes, (oldData: any) => 
          oldData?.map((item: any) => item.id === data.id ? data : item) || [data]
        );
        queryClient.setQueryData(queryKeys.quote(data.id), data);
        break;
      case 'onDelete':
        queryClient.setQueryData(queryKeys.quotes, (oldData: any) => 
          oldData?.filter((item: any) => item.id !== data.id) || []
        );
        queryClient.removeQueries({ queryKey: queryKeys.quote(data.id) });
        break;
    }
    
    // Invalidate analytics
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
  }

  /**
   * Update Requests cache
   */
  private updateRequestsCache(operation: string, data: any) {
    switch (operation) {
      case 'onCreate':
        queryClient.setQueryData(queryKeys.requests, (oldData: any) => 
          oldData ? [...oldData, data] : [data]
        );
        break;
      case 'onUpdate':
        queryClient.setQueryData(queryKeys.requests, (oldData: any) => 
          oldData?.map((item: any) => item.id === data.id ? data : item) || [data]
        );
        queryClient.setQueryData(queryKeys.request(data.id), data);
        break;
      case 'onDelete':
        queryClient.setQueryData(queryKeys.requests, (oldData: any) => 
          oldData?.filter((item: any) => item.id !== data.id) || []
        );
        queryClient.removeQueries({ queryKey: queryKeys.request(data.id) });
        break;
    }
    
    // Invalidate analytics
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
  }

  /**
   * Update Contacts cache
   */
  private updateContactsCache(operation: string, data: any) {
    // Update contacts list cache
    const contactsKey = ['contacts'];
    switch (operation) {
      case 'onCreate':
        queryClient.setQueryData(contactsKey, (oldData: any) => 
          oldData ? [...oldData, data] : [data]
        );
        break;
      case 'onUpdate':
        queryClient.setQueryData(contactsKey, (oldData: any) => 
          oldData?.map((item: any) => item.id === data.id ? data : item) || [data]
        );
        break;
      case 'onDelete':
        queryClient.setQueryData(contactsKey, (oldData: any) => 
          oldData?.filter((item: any) => item.id !== data.id) || []
        );
        break;
    }
  }

  /**
   * Update Properties cache
   */
  private updatePropertiesCache(operation: string, data: any) {
    const propertiesKey = ['properties'];
    switch (operation) {
      case 'onCreate':
        queryClient.setQueryData(propertiesKey, (oldData: any) => 
          oldData ? [...oldData, data] : [data]
        );
        break;
      case 'onUpdate':
        queryClient.setQueryData(propertiesKey, (oldData: any) => 
          oldData?.map((item: any) => item.id === data.id ? data : item) || [data]
        );
        break;
      case 'onDelete':
        queryClient.setQueryData(propertiesKey, (oldData: any) => 
          oldData?.filter((item: any) => item.id !== data.id) || []
        );
        break;
    }
  }

  /**
   * Update Project Comments cache
   */
  private updateProjectCommentsCache(operation: string, data: any) {
    const projectId = data.projectId;
    if (!projectId) return;

    const commentsKey = ['projects', projectId, 'comments'];
    switch (operation) {
      case 'onCreate':
        queryClient.setQueryData(commentsKey, (oldData: any) => 
          oldData ? [...oldData, data] : [data]
        );
        break;
      case 'onUpdate':
        queryClient.setQueryData(commentsKey, (oldData: any) => 
          oldData?.map((item: any) => item.id === data.id ? data : item) || [data]
        );
        break;
      case 'onDelete':
        queryClient.setQueryData(commentsKey, (oldData: any) => 
          oldData?.filter((item: any) => item.id !== data.id) || []
        );
        break;
    }
  }

  /**
   * Update Notification cache
   */
  private updateNotificationCache(operation: string, data: any) {
    const notificationsKey = ['notifications'];
    switch (operation) {
      case 'onCreate':
        queryClient.setQueryData(notificationsKey, (oldData: any) => 
          oldData ? [data, ...oldData] : [data] // New notifications at top
        );
        break;
      case 'onUpdate':
        queryClient.setQueryData(notificationsKey, (oldData: any) => 
          oldData?.map((item: any) => item.id === data.id ? data : item) || [data]
        );
        break;
      case 'onDelete':
        queryClient.setQueryData(notificationsKey, (oldData: any) => 
          oldData?.filter((item: any) => item.id !== data.id) || []
        );
        break;
    }
  }

  /**
   * Generic cache update for any model
   */
  private updateGenericCache(modelName: string, operation: string, data: any) {
    const cacheKey = [modelName.toLowerCase()];
    switch (operation) {
      case 'onCreate':
        queryClient.setQueryData(cacheKey, (oldData: any) => 
          oldData ? [...oldData, data] : [data]
        );
        break;
      case 'onUpdate':
        queryClient.setQueryData(cacheKey, (oldData: any) => 
          oldData?.map((item: any) => item.id === data.id ? data : item) || [data]
        );
        break;
      case 'onDelete':
        queryClient.setQueryData(cacheKey, (oldData: any) => 
          oldData?.filter((item: any) => item.id !== data.id) || []
        );
        break;
    }
  }

  /**
   * Remove a callback from a subscription
   */
  private unsubscribeCallback(subscriptionKey: string, callback: Function) {
    const callbacks = this.subscriptionCallbacks.get(subscriptionKey);
    if (callbacks) {
      callbacks.delete(callback);
      
      // If no more callbacks, close the subscription
      if (callbacks.size === 0) {
        this.closeSubscription(subscriptionKey);
      }
    }
  }

  /**
   * Close a subscription
   */
  private closeSubscription(subscriptionKey: string) {
    const subscription = this.activeSubscriptions.get(subscriptionKey);
    if (subscription) {
      try {
        subscription.unsubscribe();
        subscriptionLogger.info('Subscription closed', { subscriptionKey });
      } catch (error) {
        subscriptionLogger.error('Error closing subscription', { subscriptionKey, error });
      }
      
      this.activeSubscriptions.delete(subscriptionKey);
      this.subscriptionCallbacks.delete(subscriptionKey);
    }
  }

  /**
   * Close all subscriptions (cleanup)
   */
  closeAllSubscriptions() {
    subscriptionLogger.info('Closing all subscriptions', { 
      count: this.activeSubscriptions.size 
    });

    for (const subscriptionKey of Array.from(this.activeSubscriptions.keys())) {
      this.closeSubscription(subscriptionKey);
    }
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus() {
    return {
      activeSubscriptions: this.activeSubscriptions.size,
      subscriptionKeys: Array.from(this.activeSubscriptions.keys()),
      callbackCounts: Object.fromEntries(
        Array.from(this.subscriptionCallbacks.entries()).map(([key, callbacks]) => [
          key,
          callbacks.size
        ])
      )
    };
  }
}

// Export singleton instance
export const subscriptionService = SubscriptionService.getInstance();

// Real-time data hooks for React components
export const useRealTimeData = {
  /**
   * Subscribe to real-time projects updates
   */
  useProjects: (callback?: (data: any) => void) => {
    const defaultCallback = (data: any) => {
      subscriptionLogger.debug('Projects update received', { projectId: data?.id });
    };
    
    React.useEffect(() => {
      const unsubscribeCreate = subscriptionService.subscribeToModel('Projects', 'onCreate', callback || defaultCallback);
      const unsubscribeUpdate = subscriptionService.subscribeToModel('Projects', 'onUpdate', callback || defaultCallback);
      const unsubscribeDelete = subscriptionService.subscribeToModel('Projects', 'onDelete', callback || defaultCallback);
      
      return () => {
        unsubscribeCreate();
        unsubscribeUpdate();
        unsubscribeDelete();
      };
    }, [callback]);
  },

  /**
   * Subscribe to real-time quotes updates
   */
  useQuotes: (callback?: (data: any) => void) => {
    const defaultCallback = (data: any) => {
      subscriptionLogger.debug('Quotes update received', { quoteId: data?.id });
    };
    
    React.useEffect(() => {
      const unsubscribeCreate = subscriptionService.subscribeToModel('Quotes', 'onCreate', callback || defaultCallback);
      const unsubscribeUpdate = subscriptionService.subscribeToModel('Quotes', 'onUpdate', callback || defaultCallback);
      const unsubscribeDelete = subscriptionService.subscribeToModel('Quotes', 'onDelete', callback || defaultCallback);
      
      return () => {
        unsubscribeCreate();
        unsubscribeUpdate();
        unsubscribeDelete();
      };
    }, [callback]);
  },

  /**
   * Subscribe to real-time requests updates
   */
  useRequests: (callback?: (data: any) => void) => {
    const defaultCallback = (data: any) => {
      subscriptionLogger.debug('Requests update received', { requestId: data?.id });
    };
    
    React.useEffect(() => {
      const unsubscribeCreate = subscriptionService.subscribeToModel('Requests', 'onCreate', callback || defaultCallback);
      const unsubscribeUpdate = subscriptionService.subscribeToModel('Requests', 'onUpdate', callback || defaultCallback);
      const unsubscribeDelete = subscriptionService.subscribeToModel('Requests', 'onDelete', callback || defaultCallback);
      
      return () => {
        unsubscribeCreate();
        unsubscribeUpdate();
        unsubscribeDelete();
      };
    }, [callback]);
  },

  /**
   * Subscribe to project comments for a specific project
   */
  useProjectComments: (projectId: string, callback?: (data: any) => void) => {
    const defaultCallback = (data: any) => {
      subscriptionLogger.debug('Project comments update received', { commentId: data?.id, projectId });
    };
    
    React.useEffect(() => {
      if (!projectId) return;

      const filter = { projectId: { eq: projectId } };
      const unsubscribeCreate = subscriptionService.subscribeToModel('ProjectComments', 'onCreate', callback || defaultCallback, filter);
      const unsubscribeUpdate = subscriptionService.subscribeToModel('ProjectComments', 'onUpdate', callback || defaultCallback, filter);
      const unsubscribeDelete = subscriptionService.subscribeToModel('ProjectComments', 'onDelete', callback || defaultCallback, filter);
      
      return () => {
        unsubscribeCreate();
        unsubscribeUpdate();
        unsubscribeDelete();
      };
    }, [projectId, callback]);
  },

  /**
   * Subscribe to notifications
   */
  useNotifications: (callback?: (data: any) => void) => {
    const defaultCallback = (data: any) => {
      subscriptionLogger.debug('Notification update received', { notificationId: data?.id });
    };
    
    React.useEffect(() => {
      const unsubscribeCreate = subscriptionService.subscribeToModel('NotificationQueue', 'onCreate', callback || defaultCallback);
      const unsubscribeUpdate = subscriptionService.subscribeToModel('NotificationQueue', 'onUpdate', callback || defaultCallback);
      
      return () => {
        unsubscribeCreate();
        unsubscribeUpdate();
      };
    }, [callback]);
  }
};

// Add React import at the top if not already present
import React from 'react';