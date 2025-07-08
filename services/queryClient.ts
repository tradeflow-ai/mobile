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
  jobTypeParts: (jobTypeId: string) => ['job-types', jobTypeId, 'parts'] as const,
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

export default queryClient; 