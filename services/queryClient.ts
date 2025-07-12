/**
 * TanStack Query Client Configuration
 * Centralized configuration for all data fetching and caching
 * ENHANCED: Includes persistence for critical data
 */

import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== PERSISTENCE CONFIGURATION ====================

/**
 * Critical data that should be persisted for offline access
 * These are high-priority queries that users need access to offline
 */
const CRITICAL_QUERY_PATTERNS = [
  'jobs',          // All job data
  'inventory',     // Inventory items and quantities
  'routes',        // Route information
  'daily-plan',    // Daily plans
  'profile',       // User profile data
];

/**
 * Check if a query should be persisted based on its key
 */
const shouldPersistQuery = (queryKey: readonly unknown[]): boolean => {
  const keyString = queryKey.join('.');
  return CRITICAL_QUERY_PATTERNS.some(pattern => keyString.includes(pattern));
};

/**
 * Custom persister for critical TanStack Query data
 * Stores only essential data offline using AsyncStorage
 */
const queryPersister = {
  persistClient: async (client: any) => {
    try {
      const criticalData = {
        clientState: {
          queries: Array.from(client.queries.entries())
            .filter((entry: any) => shouldPersistQuery(entry[0]))
            .map((entry: any) => {
              const [queryKey, query] = entry;
              return {
                queryKey,
                queryHash: query.queryHash,
                data: query.state.data,
                dataUpdatedAt: query.state.dataUpdatedAt,
                isStale: query.isStale(),
              };
            })
            .slice(0, 50), // Limit to 50 most important queries
          timestamp: Date.now(),
        },
      };

      await AsyncStorage.setItem(
        'tanstack-query-offline-cache', 
        JSON.stringify(criticalData)
      );
      
      console.log(`QueryClient: Persisted ${criticalData.clientState.queries.length} critical queries`);
    } catch (error) {
      console.error('QueryClient: Error persisting critical data:', error);
    }
  },

  restoreClient: async () => {
    try {
      const storedData = await AsyncStorage.getItem('tanstack-query-offline-cache');
      
      if (!storedData) {
        console.log('QueryClient: No persisted data found');
        return undefined;
      }

      const parsedData = JSON.parse(storedData);
      const age = Date.now() - parsedData.clientState.timestamp;
      
      // Only restore data that's less than 24 hours old
      if (age > 24 * 60 * 60 * 1000) {
        console.log('QueryClient: Persisted data too old, ignoring');
        await AsyncStorage.removeItem('tanstack-query-offline-cache');
        return undefined;
      }

      console.log(`QueryClient: Restored ${parsedData.clientState.queries.length} critical queries`);
      return parsedData.clientState;
    } catch (error) {
      console.error('QueryClient: Error restoring critical data:', error);
      return undefined;
    }
  },

  removeClient: async () => {
    try {
      await AsyncStorage.removeItem('tanstack-query-offline-cache');
      console.log('QueryClient: Cleared persisted cache');
    } catch (error) {
      console.error('QueryClient: Error clearing persisted cache:', error);
    }
  },
};

// ==================== QUERY CLIENT CONFIGURATION ====================

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 1000 * 60 * 5,
      // Keep inactive data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests up to 3 times
      retry: (failureCount, error: any) => {
        // Don't retry for authentication errors (401) or forbidden (403)
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Retry delay increases exponentially (1s, 2s, 4s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus by default (mobile app)
      refetchOnWindowFocus: false,
      // Refetch on network reconnect
      refetchOnReconnect: true,
      // Show stale data while refetching
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // 30 second timeout for mutations
      gcTime: 1000 * 30,
    },
  },
});

// Query key factory for consistent key management
export const queryKeys = {
  // Profile queries
  profile: (userId: string) => ['profile', userId] as const,
  
  // Job queries
  jobs: () => ['jobs'] as const,
  job: (jobId: string) => ['jobs', jobId] as const,
  jobsByType: (jobType: string) => ['jobs', 'type', jobType] as const,
  jobsByStatus: (status: string) => ['jobs', 'status', status] as const,
  
  // Inventory queries
  inventory: () => ['inventory'] as const,
  inventoryItem: (itemId: string) => ['inventory', itemId] as const,
  inventoryByCategory: (category: string) => ['inventory', 'category', category] as const,
  inventoryLowStock: () => ['inventory', 'low-stock'] as const,
  
  // Route queries
  routes: () => ['routes'] as const,
  route: (routeId: string) => ['routes', routeId] as const,
  activeRoute: () => ['routes', 'active'] as const,
  

  
  // Job Types & BoM queries
  jobTypes: () => ['job-types'] as const,
  jobType: (jobTypeId: string) => ['job-types', jobTypeId] as const,
  partTemplates: () => ['part-templates'] as const,
  partTemplate: (partTemplateId: string) => ['part-templates', partTemplateId] as const,
  jobTypeParts: (jobTypeId: string) => ['job-types', jobTypeId, 'parts'] as const,
  
  // Daily Plans
  dailyPlans: () => ['daily-plans'] as const,
  dailyPlan: (planId: string) => ['daily-plan', planId] as const,
  
  // Onboarding queries
  onboarding: () => ['onboarding'] as const,
  onboardingConfig: () => ['onboarding', 'configuration'] as const,
  onboardingPreferences: (userId: string) => ['onboarding', 'preferences', userId] as const,
  onboardingStatus: (userId: string) => ['onboarding', 'status', userId] as const,
  
  // Map Integration
  mapApps: () => ['map-apps'] as const,
  mapPreferences: (userId: string) => ['map-preferences', userId] as const,
} as const;

// Helper function to invalidate related queries after mutations
export const invalidateQueries = {
  // Invalidate all profile data
  profile: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
  },
  
  // Invalidate all job-related data
  allJobs: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
  },
  
  // Invalidate specific job and related queries
  job: (jobId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
    queryClient.invalidateQueries({ queryKey: queryKeys.routes() });
  },
  
  // Invalidate all inventory data
  allInventory: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory() });
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLowStock() });
  },
  
  // Invalidate specific inventory item and related queries
  inventoryItem: (itemId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItem(itemId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory() });
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLowStock() });
  },
  
  // Invalidate all route data
  allRoutes: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.routes() });
    queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute() });
  },
  

  
  // Invalidate BoM-related data
  allJobTypes: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.jobTypes() });
    queryClient.invalidateQueries({ queryKey: queryKeys.partTemplates() });
  },
  
  jobType: (jobTypeId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.jobType(jobTypeId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.jobTypeParts(jobTypeId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.jobTypes() });
  },
  
  allPartTemplates: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.partTemplates() });
  },
  
  partTemplate: (partTemplateId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.partTemplate(partTemplateId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.partTemplates() });
  },
  
  // Invalidate daily plans
  allDailyPlans: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dailyPlans() });
  },
  
  dailyPlan: (planId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dailyPlan(planId) });
  },
  
  // Invalidate all onboarding data
  allOnboarding: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.onboarding() });
  },
  
  // Invalidate specific user's onboarding data
  userOnboarding: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.onboardingPreferences(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus(userId) });
  },
  
  // Invalidate onboarding configuration
  onboardingConfig: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.onboardingConfig() });
  },
  
  // Map integration invalidation
  allMapApps: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.mapApps() });
  },
  
  mapPreferences: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.mapPreferences(userId) });
  },
} as const;

// Error handler for global query errors
export const handleQueryError = (error: any, queryKey: readonly unknown[]) => {
  console.error(`Query error for ${queryKey.join('.')}:`, error);
  
  // Handle specific error types
  if (error?.status === 401) {
    console.log('Authentication error - user may need to re-login');
    // Don't throw here - let individual components handle auth errors
  } else if (error?.status === 403) {
    console.log('Permission error - user may not have access');
  } else if (error?.status >= 500) {
    console.log('Server error - retrying may help');
  } else if (error?.code === 'NETWORK_ERROR') {
    console.log('Network error - check connection');
  }
};

// ==================== ADVANCED CACHING STRATEGIES ====================

/**
 * Prefetch related data for better UX
 * Call this when user navigates to screens that might need this data
 */
export const prefetchStrategies = {
  // Prefetch job-related data when entering jobs screen
  jobsScreen: async (userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.jobs(),
        staleTime: 1000 * 60 * 2, // 2 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.routes(),
        staleTime: 1000 * 60 * 3, // 3 minutes
      }),
    ]);
  },
  
  // Prefetch inventory-related data when entering inventory screen
  inventoryScreen: async (userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventory(),
        staleTime: 1000 * 60 * 3, // 3 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventoryLowStock(),
        staleTime: 1000 * 60 * 1, // 1 minute for critical data
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.partTemplates(),
        staleTime: 1000 * 60 * 10, // 10 minutes
      }),
    ]);
  },
  
  // Prefetch BOM data when entering job creation
  jobCreationScreen: async (userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.jobTypes(),
        staleTime: 1000 * 60 * 10, // 10 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.partTemplates(),
        staleTime: 1000 * 60 * 10, // 10 minutes
      }),
    ]);
  },
};

/**
 * Background sync strategies
 * Keep important data fresh without user interaction
 */
export const backgroundSync = {
  // Sync critical data every minute
  startCriticalSync: () => {
    const interval = setInterval(() => {
      // Invalidate critical data to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLowStock() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute() });
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  },
  
  // Sync regular data every 5 minutes
  startRegularSync: () => {
    const interval = setInterval(() => {
      // Invalidate regular data to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: queryKeys.routes() });
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  },
};

// ==================== ENHANCED OPTIMISTIC UPDATES ====================

/**
 * Types for optimistic update tracking
 */
export interface OptimisticOperation {
  id: string;
  type: string;
  status: 'pending' | 'success' | 'error';
  entity: any;
  originalData: any;
  timestamp: Date;
  error?: any;
}

/**
 * Enhanced optimistic updates with rollback capabilities and status tracking
 * Provides instant feedback with proper error recovery
 */
export class EnhancedOptimisticUpdates {
  private operations: Map<string, OptimisticOperation> = new Map();
  private listeners: ((operations: OptimisticOperation[]) => void)[] = [];

  /**
   * Create a new optimistic operation
   */
  private createOperation(
    type: string, 
    entity: any, 
    originalData: any
  ): OptimisticOperation {
    return {
      id: `${type}_${entity.id}_${Date.now()}`,
      type,
      status: 'pending',
      entity,
      originalData,
      timestamp: new Date(),
    };
  }

  /**
   * Notify listeners of operation changes
   */
  private notifyListeners() {
    const operations = Array.from(this.operations.values());
    this.listeners.forEach(listener => {
      try {
        listener(operations);
      } catch (error) {
        console.error('Error notifying optimistic update listener:', error);
      }
    });
  }

  /**
   * Subscribe to optimistic operation changes
   */
  subscribe(listener: (operations: OptimisticOperation[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current operations
   */
  getOperations(): OptimisticOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return Array.from(this.operations.values()).filter(op => op.status === 'pending').length;
  }

  /**
   * Mark operation as successful
   */
  markSuccess(operationId: string) {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'success';
      this.notifyListeners();
      
      // Remove successful operations after a delay
      setTimeout(() => {
        this.operations.delete(operationId);
        this.notifyListeners();
      }, 3000);
    }
  }

  /**
   * Mark operation as failed and trigger rollback
   */
  markError(operationId: string, error: any) {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'error';
      operation.error = error;
      
      // Trigger rollback
      this.rollbackOperation(operation);
      this.notifyListeners();
      
      // Remove failed operations after a delay
      setTimeout(() => {
        this.operations.delete(operationId);
        this.notifyListeners();
      }, 5000);
    }
  }

  /**
   * Rollback an operation to its original state
   */
  private rollbackOperation(operation: OptimisticOperation) {
    const { type, entity, originalData } = operation;
    
    try {
      switch (type) {
        case 'createJob':
          this.rollbackJobCreation(entity.id);
          break;
        case 'updateJob':
          this.rollbackJobUpdate(entity.id, originalData);
          break;
        case 'updateClient':
          this.rollbackClientUpdate(entity.id, originalData);
          break;
        case 'updateRoute':
          this.rollbackRouteUpdate(entity.id, originalData);
          break;
        case 'updateInventory':
          this.rollbackInventoryUpdate(entity.id, originalData);
          break;
        default:
          console.warn(`No rollback handler for operation type: ${type}`);
      }
      
      console.log(`Rolled back optimistic operation: ${type}`);
    } catch (error) {
      console.error(`Error rolling back operation ${type}:`, error);
    }
  }

  /**
   * Rollback job creation
   */
  private rollbackJobCreation(jobId: string) {
    // Remove job from cache
    queryClient.removeQueries({ queryKey: queryKeys.job(jobId) });
    
    // Remove from jobs list
    queryClient.setQueryData(queryKeys.jobs(), (old: any[]) => {
      if (!old) return old;
      return old.filter(job => job.id !== jobId);
    });
  }

  /**
   * Rollback job update
   */
  private rollbackJobUpdate(jobId: string, originalData: any) {
    // Restore original job data
    queryClient.setQueryData(queryKeys.job(jobId), originalData);
    
    // Restore in jobs list
    queryClient.setQueryData(queryKeys.jobs(), (old: any[]) => {
      if (!old) return old;
      return old.map(job => job.id === jobId ? originalData : job);
    });
  }

  /**
   * Rollback client update
   */
  private rollbackClientUpdate(clientId: string, originalData: any) {
    // Restore original client data
    queryClient.setQueryData(queryKeys.client(clientId), originalData);
    
    // Restore in clients list
    queryClient.setQueryData(queryKeys.clients(), (old: any[]) => {
      if (!old) return old;
      return old.map(client => client.id === clientId ? originalData : client);
    });
  }

  /**
   * Rollback route update
   */
  private rollbackRouteUpdate(routeId: string, originalData: any) {
    // Restore original route data
    queryClient.setQueryData(queryKeys.route(routeId), originalData);
    
    // Restore in routes list
    queryClient.setQueryData(queryKeys.routes(), (old: any[]) => {
      if (!old) return old;
      return old.map(route => route.id === routeId ? originalData : route);
    });
  }

  /**
   * Rollback inventory update
   */
  private rollbackInventoryUpdate(itemId: string, originalData: any) {
    // Restore original inventory data
    queryClient.setQueryData(queryKeys.inventoryItem(itemId), originalData);
    
    // Restore in inventory list
    queryClient.setQueryData(queryKeys.inventory(), (old: any[]) => {
      if (!old) return old;
      return old.map(item => item.id === itemId ? originalData : item);
    });
  }

  // ==================== OPTIMISTIC UPDATE METHODS ====================

  /**
   * Optimistically create a job
   */
  createJob(jobData: any): string {
    const tempId = `temp_${Date.now()}`;
    const newJob = {
      ...jobData,
      id: tempId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const operation = this.createOperation('createJob', newJob, null);
    this.operations.set(operation.id, operation);

    // Add to jobs list optimistically
    queryClient.setQueryData(queryKeys.jobs(), (old: any[]) => {
      return old ? [newJob, ...old] : [newJob];
    });

    // Add to individual job cache
    queryClient.setQueryData(queryKeys.job(tempId), newJob);

    this.notifyListeners();
    return operation.id;
  }

  /**
   * Optimistically update a job
   */
  updateJob(jobId: string, updates: any): string {
    // Get original data for rollback
    const originalData = queryClient.getQueryData(queryKeys.job(jobId));
    
    if (!originalData) {
      console.warn(`No data found for job ${jobId}, skipping optimistic update`);
      return '';
    }
    
    const updatedJob = {
      ...originalData,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const operation = this.createOperation('updateJob', updatedJob, originalData);
    this.operations.set(operation.id, operation);

    // Update job optimistically
    queryClient.setQueryData(queryKeys.job(jobId), updatedJob);
    
    // Update in jobs list
    queryClient.setQueryData(queryKeys.jobs(), (old: any[]) => {
      if (!old) return old;
      return old.map(job => job.id === jobId ? updatedJob : job);
    });

    this.notifyListeners();
    return operation.id;
  }

  /**
   * Optimistically update a client
   */
  updateClient(clientId: string, updates: any): string {
    // Get original data for rollback
    const originalData = queryClient.getQueryData(queryKeys.client(clientId));
    
    if (!originalData) {
      console.warn(`No data found for client ${clientId}, skipping optimistic update`);
      return '';
    }
    
    const updatedClient = {
      ...originalData,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const operation = this.createOperation('updateClient', updatedClient, originalData);
    this.operations.set(operation.id, operation);

    // Update client optimistically
    queryClient.setQueryData(queryKeys.client(clientId), updatedClient);
    
    // Update in clients list
    queryClient.setQueryData(queryKeys.clients(), (old: any[]) => {
      if (!old) return old;
      return old.map(client => client.id === clientId ? updatedClient : client);
    });

    this.notifyListeners();
    return operation.id;
  }

  /**
   * Optimistically update a route
   */
  updateRoute(routeId: string, updates: any): string {
    // Get original data for rollback
    const originalData = queryClient.getQueryData(queryKeys.route(routeId));
    
    if (!originalData) {
      console.warn(`No data found for route ${routeId}, skipping optimistic update`);
      return '';
    }
    
    const updatedRoute = {
      ...originalData,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const operation = this.createOperation('updateRoute', updatedRoute, originalData);
    this.operations.set(operation.id, operation);

    // Update route optimistically
    queryClient.setQueryData(queryKeys.route(routeId), updatedRoute);
    
    // Update in routes list
    queryClient.setQueryData(queryKeys.routes(), (old: any[]) => {
      if (!old) return old;
      return old.map(route => route.id === routeId ? updatedRoute : route);
    });

    this.notifyListeners();
    return operation.id;
  }

  /**
   * Optimistically update inventory
   */
  updateInventory(itemId: string, updates: any): string {
    // Get original data for rollback
    const originalData = queryClient.getQueryData(queryKeys.inventoryItem(itemId));
    
    if (!originalData) {
      console.warn(`No data found for inventory item ${itemId}, skipping optimistic update`);
      return '';
    }
    
    const updatedItem = {
      ...originalData,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const operation = this.createOperation('updateInventory', updatedItem, originalData);
    this.operations.set(operation.id, operation);

    // Update inventory item optimistically
    queryClient.setQueryData(queryKeys.inventoryItem(itemId), updatedItem);
    
    // Update in inventory list
    queryClient.setQueryData(queryKeys.inventory(), (old: any[]) => {
      if (!old) return old;
      return old.map(item => item.id === itemId ? updatedItem : item);
    });

    this.notifyListeners();
    return operation.id;
  }
}

// Create singleton instance
export const enhancedOptimisticUpdates = new EnhancedOptimisticUpdates();

/**
 * Legacy optimistic updates helpers (maintained for backward compatibility)
 * @deprecated Use enhancedOptimisticUpdates instead
 */
export const optimisticUpdates = {
  // Optimistically update job status (legacy)
  updateJobStatus: (jobId: string, newStatus: string) => {
    return enhancedOptimisticUpdates.updateJob(jobId, { status: newStatus });
  },
  
  // Optimistically update inventory quantity (legacy)
  updateInventoryQuantity: (itemId: string, newQuantity: number) => {
    return enhancedOptimisticUpdates.updateInventory(itemId, { quantity: newQuantity });
  },
};

/**
 * Cache warming strategies
 * Preload data based on user behavior patterns
 */
export const cacheWarming = {
  // Warm cache based on user's frequent patterns
  warmFrequentData: async (userId: string) => {
    const promises = [];
    
    // Always warm profile data
    promises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.profile(userId),
        staleTime: 1000 * 60 * 15, // 15 minutes
      })
    );
    
    // Warm today's jobs
    promises.push(
      queryClient.prefetchQuery({
        queryKey: ['jobs', 'today'],
        staleTime: 1000 * 60 * 5, // 5 minutes
      })
    );
    
    // Warm low stock items (important for planning)
    promises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventoryLowStock(),
        staleTime: 1000 * 60 * 2, // 2 minutes
      })
    );
    
    await Promise.all(promises);
  },
};

// ==================== ENHANCED PERSISTENCE UTILITIES ====================

/**
 * Initialize query persistence on app startup
 * Call this when the app starts to restore persisted critical data
 */
export const initializeQueryPersistence = async () => {
  try {
    const restoredState = await queryPersister.restoreClient();
    
    if (restoredState?.queries) {
      // Restore critical queries to the cache
      restoredState.queries.forEach((queryData: any) => {
        if (queryData.data) {
          queryClient.setQueryData(queryData.queryKey, queryData.data);
        }
      });
      
      console.log(`QueryClient: Initialized with ${restoredState.queries.length} persisted queries`);
    }
  } catch (error) {
    console.error('QueryClient: Error initializing persistence:', error);
  }
};

/**
 * Manually persist current critical data
 * Useful for explicit save points or before app backgrounding
 */
export const persistCriticalData = async () => {
  try {
    await queryPersister.persistClient(queryClient);
  } catch (error) {
    console.error('QueryClient: Error persisting critical data:', error);
  }
};

/**
 * Clear all persisted query data
 * Useful for logout or data reset scenarios
 */
export const clearPersistedData = async () => {
  try {
    await queryPersister.removeClient();
  } catch (error) {
    console.error('QueryClient: Error clearing persisted data:', error);
  }
};

/**
 * Enhanced cache utilities for critical operations
 */
export const criticalCacheUtils = {
  /**
   * Ensure critical data is available offline
   * Prefetches and pins critical queries to cache
   */
  prefetchCriticalData: async (userId: string) => {
    const criticalQueries = [
      // User's jobs
      { queryKey: queryKeys.jobs(), enabled: true },
      // Today's jobs specifically
      { queryKey: ['jobs', 'today'], enabled: true },
      // User inventory
      { queryKey: queryKeys.inventory(), enabled: true },
      // Active route
      { queryKey: queryKeys.activeRoute(), enabled: true },
      // User profile
      { queryKey: queryKeys.profile(userId), enabled: true },
    ];

    const prefetchPromises = criticalQueries.map(({ queryKey }) =>
      queryClient.prefetchQuery({
        queryKey,
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      }).catch(error => {
        console.warn(`Failed to prefetch ${queryKey.join('.')}:`, error);
      })
    );

    await Promise.allSettled(prefetchPromises);
    console.log('QueryClient: Critical data prefetch completed');
  },

  /**
   * Get offline-available data for critical operations
   * Returns cached data even if stale for offline scenarios
   */
  getOfflineData: <T>(queryKey: readonly unknown[]): T | undefined => {
    const query = queryClient.getQueryCache().find({ queryKey });
    return query?.state.data as T;
  },

  /**
   * Mark data as critical and persist immediately
   */
  setCriticalData: async <T>(queryKey: readonly unknown[], data: T) => {
    queryClient.setQueryData(queryKey, data);
    
    // If this is critical data, persist immediately
    if (shouldPersistQuery(queryKey)) {
      await persistCriticalData();
    }
  },

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats: () => {
    const queries = queryClient.getQueryCache().getAll();
    const criticalQueries = queries.filter(q => shouldPersistQuery(q.queryKey));
    
    return {
      totalQueries: queries.length,
      criticalQueries: criticalQueries.length,
      cachedData: queries.filter(q => q.state.data !== undefined).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.error !== null).length,
    };
  },
};

export default queryClient; 