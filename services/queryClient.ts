/**
 * TanStack Query Client Configuration
 * Centralized configuration for all data fetching and caching
 */

import { QueryClient } from '@tanstack/react-query';

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
  
  // Client queries
  clients: () => ['clients'] as const,
  client: (clientId: string) => ['clients', clientId] as const,
  
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
  
  // Invalidate all client data
  allClients: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.clients() });
  },
  
  // Invalidate client and related job data
  client: (clientId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.client(clientId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.clients() });
    queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
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
        queryKey: queryKeys.clients(),
        staleTime: 1000 * 60 * 5, // 5 minutes
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
        queryKey: queryKeys.clients(),
        staleTime: 1000 * 60 * 5, // 5 minutes
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

/**
 * Optimistic updates helpers
 * Provide instant feedback for better UX
 */
export const optimisticUpdates = {
  // Optimistically update job status
  updateJobStatus: (jobId: string, newStatus: string) => {
    queryClient.setQueryData(queryKeys.job(jobId), (old: any) => {
      if (!old) return old;
      return { ...old, status: newStatus, updated_at: new Date().toISOString() };
    });
    
    // Update in jobs list too
    queryClient.setQueryData(queryKeys.jobs(), (old: any[]) => {
      if (!old) return old;
      return old.map(job => 
        job.id === jobId 
          ? { ...job, status: newStatus, updated_at: new Date().toISOString() }
          : job
      );
    });
  },
  
  // Optimistically update inventory quantity
  updateInventoryQuantity: (itemId: string, newQuantity: number) => {
    queryClient.setQueryData(queryKeys.inventoryItem(itemId), (old: any) => {
      if (!old) return old;
      return { ...old, quantity: newQuantity, updated_at: new Date().toISOString() };
    });
    
    // Update in inventory list too
    queryClient.setQueryData(queryKeys.inventory(), (old: any[]) => {
      if (!old) return old;
      return old.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, updated_at: new Date().toISOString() }
          : item
      );
    });
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

export default queryClient; 