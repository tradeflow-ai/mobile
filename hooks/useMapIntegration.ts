/**
 * Map Integration Data Hooks - TanStack Query integration
 * Provides data access for map app preferences and external app launching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { 
  MapIntegrationService, 
  MapApp, 
  UserMapPreference, 
  MapIntegrationOptions,
  AvailableMapApp,
  openExternalMap,
  openExternalDirections,
  getUserPreferredMapApp
} from '@/services/mapIntegrationService';
import { queryKeys as baseQueryKeys, invalidateQueries as baseInvalidateQueries, handleQueryError, queryClient } from '@/services/queryClient';
import { JobLocation } from '@/hooks/useJobs';

const mapIntegrationService = MapIntegrationService.getInstance();

// ==================== EXTENDED QUERY KEYS ====================

export const mapQueryKeys = {
  // Map preferences queries
  mapPreferences: (userId: string) => ['map-preferences', userId] as const,
  
  // Map app queries
  availableMapApps: () => ['map-apps', 'available'] as const,
  supportedMapApps: () => ['map-apps', 'supported'] as const,
  
  // User's preferred map app
  preferredMapApp: (userId: string) => ['map-preferred', userId] as const,
} as const;

// ==================== EXTENDED INVALIDATION HELPERS ====================

export const mapInvalidateQueries = {
  // Invalidate all map-related data for a user
  allMapData: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: mapQueryKeys.mapPreferences(userId) });
    queryClient.invalidateQueries({ queryKey: mapQueryKeys.preferredMapApp(userId) });
  },
  
  // Invalidate map preferences
  mapPreferences: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: mapQueryKeys.mapPreferences(userId) });
    queryClient.invalidateQueries({ queryKey: mapQueryKeys.preferredMapApp(userId) });
  },
  
  // Invalidate available apps (when apps are installed/uninstalled)
  availableMapApps: () => {
    queryClient.invalidateQueries({ queryKey: mapQueryKeys.availableMapApps() });
  },
};

// Query client is imported from services/queryClient

// ==================== QUERY HOOKS ====================

/**
 * Get user's map preferences
 * Returns user's preferred map apps in priority order
 */
export const useMapPreferences = (userId?: string) => {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: mapQueryKeys.mapPreferences(targetUserId || ''),
    queryFn: async (): Promise<UserMapPreference[]> => {
      if (!targetUserId) {
        throw new Error('No user ID available');
      }
      
      const { data: preferences, error } = await mapIntegrationService.getUserMapPreferences(targetUserId);
      
      if (error) {
        throw error;
      }
      
      return preferences;
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes for preferences
  });
};

/**
 * Get current user's map preferences with automatic updates
 */
export const useCurrentUserMapPreferences = () => {
  const [user] = useAtom(userAtom);
  
  const query = useMapPreferences(user?.id);
  
  return {
    ...query,
    preferences: query.data || [],
    isAuthenticated: !!user,
    user,
  };
};

/**
 * Get user's preferred (primary) map app
 */
export const usePreferredMapApp = (userId?: string) => {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: mapQueryKeys.preferredMapApp(targetUserId || ''),
    queryFn: async (): Promise<MapApp | null> => {
      if (!targetUserId) {
        throw new Error('No user ID available');
      }
      
      return await getUserPreferredMapApp(targetUserId);
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes for preferred app
  });
};

/**
 * Get all available map apps (installed and supported)
 * Includes installation status and deep link availability
 */
export const useAvailableMapApps = () => {
  return useQuery({
    queryKey: mapQueryKeys.availableMapApps(),
    queryFn: async (): Promise<AvailableMapApp[]> => {
      return await mapIntegrationService.getAvailableMapApps();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (apps don't change frequently)
    refetchOnMount: true, // Always check app availability on mount
  });
};

/**
 * Get supported map apps from database
 */
export const useSupportedMapApps = () => {
  return useQuery({
    queryKey: mapQueryKeys.supportedMapApps(),
    queryFn: async (): Promise<MapApp[]> => {
      await mapIntegrationService.initialize();
      return mapIntegrationService.getSupportedApps();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (rarely changes)
  });
};

// ==================== MUTATION HOOKS ====================

/**
 * Update user's map app preference
 */
export const useUpdateMapPreference = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (params: {
      mapAppId: string;
      preferenceType: 'primary' | 'secondary' | 'fallback';
    }) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: updatedPreference, error } = await mapIntegrationService.updateMapPreference(
        user.id,
        params.mapAppId,
        params.preferenceType
      );

      if (error) {
        throw error;
      }

      return updatedPreference;
    },
    onSuccess: (updatedPreference) => {
      if (updatedPreference && user?.id) {
        // Invalidate related queries
        mapInvalidateQueries.mapPreferences(user.id);
        
        console.log(`Updated ${updatedPreference.preference_type} map preference for user ${user.id}`);
      }
    },
    onError: (error) => {
      console.error('Map preference update failed:', error);
      handleQueryError(error, ['map-preferences', 'update']);
    },
  });
};

/**
 * Open external map app hook
 * Returns a mutation for opening external map apps
 */
export const useOpenInExternalMap = () => {
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (options: MapIntegrationOptions): Promise<boolean> => {
      const success = await mapIntegrationService.openInExternalMap(options, user?.id);
      return success;
    },
    onSuccess: (success, variables) => {
      if (success) {
        console.log('Successfully opened external map app');
        
        // Invalidate analytics to get fresh data
        if (user?.id) {
          // mapInvalidateQueries.mapAnalytics(user.id); // Removed
        }
      }
    },
    onError: (error) => {
      console.error('Failed to open external map:', error);
      handleQueryError(error, ['map-integration', 'open']);
    },
  });
};

/**
 * Quick open external map with coordinates
 */
export const useOpenExternalMap = () => {
  const mutation = useOpenInExternalMap();

  return {
    ...mutation,
    openMap: (
      coordinates: { latitude: number; longitude: number },
      label?: string
    ) => {
      return mutation.mutate({
        coordinates,
        label,
      });
    },
  };
};

/**
 * Quick open external directions to job location
 */
export const useOpenExternalDirections = () => {
  const mutation = useOpenInExternalMap();

  return {
    ...mutation,
    openDirections: (jobLocation: JobLocation) => {
      return mutation.mutate({
        coordinates: { latitude: jobLocation.latitude, longitude: jobLocation.longitude },
        label: jobLocation.title,
        jobLocation,
      });
    },
  };
};

/**
 * Refresh supported map apps data
 */
export const useRefreshSupportedMapApps = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await mapIntegrationService.refreshSupportedApps();
      return true;
    },
    onSuccess: () => {
      // Invalidate all map-related queries
      queryClient.invalidateQueries({ queryKey: mapQueryKeys.supportedMapApps() });
      queryClient.invalidateQueries({ queryKey: mapQueryKeys.availableMapApps() });
      
      console.log('Refreshed supported map apps');
    },
    onError: (error) => {
      console.error('Failed to refresh supported map apps:', error);
      handleQueryError(error, ['map-apps', 'refresh']);
    },
  });
};

// ==================== UTILITY HOOKS ====================

/**
 * Check if user has configured map preferences
 */
export const useHasMapPreferences = (userId?: string) => {
  const { preferences, isLoading } = useCurrentUserMapPreferences();

  const hasPreferences = preferences && preferences.length > 0;
  const hasPrimaryPreference = preferences?.some(pref => pref.preference_type === 'primary');

  return {
    hasPreferences,
    hasPrimaryPreference,
    isLoading,
    preferencesCount: preferences?.length || 0,
  };
};

/**
 * Get map app installation status
 */
export const useMapAppInstallationStatus = () => {
  const { data: availableApps, isLoading } = useAvailableMapApps();

  const installedApps = availableApps?.filter(app => app.isInstalled) || [];
  const availableAppsCount = availableApps?.length || 0;
  const installedAppsCount = installedApps.length;

  return {
    installedApps,
    availableAppsCount,
    installedAppsCount,
    isLoading,
    hasInstalledApps: installedAppsCount > 0,
  };
};

/**
 * Prefetch map data for better performance
 */
export const usePrefetchMapData = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return {
    prefetchMapPreferences: (userId?: string) => {
      const targetUserId = userId || user?.id;
      if (targetUserId) {
        queryClient.prefetchQuery({
          queryKey: mapQueryKeys.mapPreferences(targetUserId),
          queryFn: async () => {
            const { data } = await mapIntegrationService.getUserMapPreferences(targetUserId);
            return data;
          },
          staleTime: 1000 * 60 * 5,
        });
      }
    },
    
    prefetchAvailableApps: () => {
      queryClient.prefetchQuery({
        queryKey: mapQueryKeys.availableMapApps(),
        queryFn: () => mapIntegrationService.getAvailableMapApps(),
        staleTime: 1000 * 60 * 2,
      });
    },
  };
};

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Quick function to open external map with user preferences
 * Can be used directly without hooks in utility functions
 */
export const useQuickOpenExternalMap = () => {
  const [user] = useAtom(userAtom);

  return {
    openMap: async (
      coordinates: { latitude: number; longitude: number },
      label?: string
    ): Promise<boolean> => {
      return await openExternalMap(coordinates, label, user?.id);
    },
    
    openDirections: async (jobLocation: JobLocation): Promise<boolean> => {
      return await openExternalDirections(jobLocation, user?.id);
    },
  };
};

/**
 * Integration with existing map functionality
 * Provides enhanced versions of existing mapUtils functions
 */
export const useEnhancedMapUtils = () => {
  const { openMap, openDirections } = useQuickOpenExternalMap();
  
  return {
    // Enhanced versions that use user preferences
    openNativeMapsEnhanced: openMap,
    openDirectionsToJobEnhanced: openDirections,
    
    // Direct access to original functions for fallback
    openNativeMapsOriginal: openExternalMap,
    openDirectionsToJobOriginal: openExternalDirections,
  };
};

// Export all hooks and utilities
export * from '@/services/mapIntegrationService'; 