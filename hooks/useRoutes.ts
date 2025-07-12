/**
 * Route Data Hooks - TanStack Query integration
 * Provides data access for route management and optimization
 * MVP Feature: Route planning and navigation for job locations
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { supabase } from '@/services/supabase';
import { queryKeys, invalidateQueries } from '@/services/queryClient';

// ==================== TYPES ====================

export interface Route {
  id: string;
  user_id: string;
  name: string;
  planned_date: string;
  start_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  end_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  waypoints: {
    latitude: number;
    longitude: number;
    address?: string;
    job_id?: string;
    sequence_order: number;
  }[];
  total_distance?: number; // in kilometers
  total_duration?: number; // in minutes
  optimization_data?: any; // VROOM API response data
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  address?: string;
  job_id?: string;
  sequence_order: number;
}

export interface CreateRouteData {
  name: string;
  planned_date: string;
  start_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  end_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  waypoints: RouteWaypoint[];
  notes?: string;
}

export interface UpdateRouteData {
  name?: string;
  planned_date?: string;
  start_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  end_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  waypoints?: RouteWaypoint[];
  total_distance?: number;
  total_duration?: number;
  optimization_data?: any;
  status?: Route['status'];
  notes?: string;
}

export interface OptimizedRoute {
  waypoints: RouteWaypoint[];
  total_distance: number;
  total_duration: number;
  optimization_data: any;
}

// ==================== QUERY HOOKS ====================

/**
 * Get all routes for the current user
 * MVP Feature: Route management and history
 */
export const useRoutes = (filters?: {
  status?: Route['status'];
  planned_date?: string;
  date_range?: {
    start: string;
    end: string;
  };
}) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: filters ? 
      ['routes', 'filtered', filters] : 
      queryKeys.routes(),
    queryFn: async (): Promise<Route[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      let query = supabase
        .from('routes')
        .select('*')
        .eq('user_id', user.id)
        .order('planned_date', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.planned_date) {
        query = query.eq('planned_date', filters.planned_date);
      }
      if (filters?.date_range) {
        query = query
          .gte('planned_date', filters.date_range.start)
          .lte('planned_date', filters.date_range.end);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get a specific route by ID
 * MVP Feature: Route details and editing
 */
export const useRoute = (routeId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: queryKeys.route(routeId),
    queryFn: async (): Promise<Route | null> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Route not found
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!routeId,
    staleTime: 1000 * 60 * 10, // 10 minutes for individual routes
  });
};

/**
 * Get active route (currently being followed)
 * MVP Feature: Navigation and real-time route tracking
 */
export const useActiveRoute = () => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: queryKeys.activeRoute(),
    queryFn: async (): Promise<Route | null> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds for active route (more frequent updates)
  });
};

/**
 * Get routes by status
 * Useful for filtering and dashboard views
 */
export const useRoutesByStatus = (status: Route['status']) => {
  return useRoutes({ status });
};

/**
 * Get routes for a specific date
 * MVP Feature: Daily route planning
 */
export const useRoutesByDate = (date: string) => {
  return useRoutes({ planned_date: date });
};

/**
 * Get routes for today
 * MVP Feature: Today's route dashboard
 */
export const useTodaysRoutes = () => {
  const today = new Date().toISOString().split('T')[0];
  return useRoutesByDate(today);
};

/**
 * Get routes for date range
 * MVP Feature: Route history and planning
 */
export const useRoutesForDateRange = (startDate: string, endDate: string) => {
  return useRoutes({ 
    date_range: { 
      start: startDate, 
      end: endDate 
    } 
  });
};

// ==================== MUTATION HOOKS ====================

/**
 * Create a new route
 * MVP Feature: Route planning and creation
 */
export const useCreateRoute = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRouteData): Promise<Route> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('routes')
        .insert([{
          user_id: user.id,
          status: 'planned',
          ...data,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate routes queries
      invalidateQueries.allRoutes();
    },
  });
};

/**
 * Update an existing route
 * MVP Feature: Route modification and optimization
 */
export const useUpdateRoute = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRouteData }): Promise<Route> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('routes')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate specific route and related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.route(result.id) });
      invalidateQueries.allRoutes();
    },
  });
};

/**
 * Delete a route
 * MVP Feature: Route management
 */
export const useDeleteRoute = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string): Promise<void> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate routes queries
      invalidateQueries.allRoutes();
    },
  });
};

/**
 * Start a route (set status to active)
 * MVP Feature: Begin route navigation
 */
export const useStartRoute = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string): Promise<Route> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      // First, set any other active routes to planned
      await supabase
        .from('routes')
        .update({ status: 'planned' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Then set this route to active
      const { data: result, error } = await supabase
        .from('routes')
        .update({ status: 'active' })
        .eq('id', routeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate routes queries
      queryClient.invalidateQueries({ queryKey: queryKeys.route(result.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute() });
      invalidateQueries.allRoutes();
    },
  });
};

/**
 * Complete a route (set status to completed)
 * MVP Feature: Finish route navigation
 */
export const useCompleteRoute = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string): Promise<Route> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('routes')
        .update({ status: 'completed' })
        .eq('id', routeId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate routes queries
      queryClient.invalidateQueries({ queryKey: queryKeys.route(result.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute() });
      invalidateQueries.allRoutes();
    },
  });
};

/**
 * Optimize route using VROOM API
 * MVP Feature: Route optimization for efficiency
 */
export const useOptimizeRoute = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string): Promise<OptimizedRoute> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      // Get the current route
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .eq('user_id', user.id)
        .single();

      if (routeError) {
        throw routeError;
      }

      // Use the routing service to optimize
      const { RoutingService } = await import('@/services/routing');
      const routingService = RoutingService.getInstance();

      // Convert route data to job locations format
      const jobLocations = route.waypoints.map((waypoint: any, index: number) => ({
        id: waypoint.job_id || `waypoint_${index}`,
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        address: waypoint.address || `Waypoint ${index + 1}`,
        job_type: 'service',
        estimated_duration: 30, // Default 30 minutes
        time_window: undefined, // Default empty time windows
      }));

      // Default user preferences for optimization
      const userPreferences = {
        work_schedule: {
          start_time: '09:00',
          end_time: '17:00',
          break_duration: 30,
        },
        technician_breaks: [],
        travel_time_buffers: {
          default_buffer_minutes: 5,
          traffic_multiplier: 1.2,
          weather_multiplier: 1.0,
        },
        home_location: {
          latitude: jobLocations[0]?.latitude || 0,
          longitude: jobLocations[0]?.longitude || 0,
        },
      };

      // Optimize the route
      const optimizedData = await routingService.optimizeRoute(jobLocations, userPreferences);

      // Extract optimized waypoints from stops
      const optimizedWaypoints = optimizedData.stops
        .filter((stop: any) => stop.type === 'job')
        .map((stop: any, index: number) => ({
          latitude: stop.location.latitude,
          longitude: stop.location.longitude,
          address: stop.location.address || `Stop ${index + 1}`,
          job_id: stop.job_id || null,
          sequence_order: index,
        }));

      const result: OptimizedRoute = {
        waypoints: optimizedWaypoints,
        total_distance: optimizedData.total_distance / 1000, // Convert to km
        total_duration: optimizedData.total_duration, // Already in minutes
        optimization_data: optimizedData,
      };

      return result;
    },
    onSuccess: (optimizedRoute, routeId) => {
      // Invalidate route queries
      queryClient.invalidateQueries({ queryKey: queryKeys.route(routeId) });
      invalidateQueries.allRoutes();
    },
  });
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get route display name with fallback
 */
export const getRouteDisplayName = (route: Route | null | undefined): string => {
  if (!route) return 'Unknown Route';
  return route.name || `Route ${route.id.slice(-6)}`;
};

/**
 * Format route distance for display
 */
export const formatRouteDistance = (distance: number | null | undefined): string => {
  if (!distance) return 'Unknown distance';
  return `${distance.toFixed(1)} km`;
};

/**
 * Format route duration for display
 */
export const formatRouteDuration = (duration: number | null | undefined): string => {
  if (!duration) return 'Unknown duration';
  
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Get route status color for UI
 */
export const getRouteStatusColor = (status: Route['status']): string => {
  switch (status) {
    case 'planned':
      return '#007AFF'; // Blue
    case 'active':
      return '#34C759'; // Green
    case 'completed':
      return '#8E8E93'; // Gray
    case 'cancelled':
      return '#FF3B30'; // Red
    default:
      return '#8E8E93'; // Gray fallback
  }
};

/**
 * Check if route is editable
 */
export const isRouteEditable = (route: Route | null | undefined): boolean => {
  if (!route) return false;
  return route.status === 'planned';
};

/**
 * Get route statistics
 */
export const useRouteStats = () => {
  const { data: routes } = useRoutes();
  
  const stats = {
    total: routes?.length || 0,
    planned: routes?.filter(r => r.status === 'planned').length || 0,
    active: routes?.filter(r => r.status === 'active').length || 0,
    completed: routes?.filter(r => r.status === 'completed').length || 0,
    cancelled: routes?.filter(r => r.status === 'cancelled').length || 0,
    totalDistance: routes?.reduce((sum, r) => sum + (r.total_distance || 0), 0) || 0,
    totalDuration: routes?.reduce((sum, r) => sum + (r.total_duration || 0), 0) || 0,
  };

  return stats;
};

// ==================== ROUTE PROGRESS HOOKS ====================

/**
 * Hook for updating route progress with offline-first approach
 * Uses critical operations service for immediate UI updates and offline support
 */
export const useUpdateRouteProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      routeId, 
      locationId, 
      status, 
      location 
    }: { 
      routeId: string; 
      locationId: string; 
      status: 'visited' | 'in_progress' | 'skipped'; 
      location: { latitude: number; longitude: number };
    }) => {
      // Use critical operations service for offline-first update
      const { criticalOperationsService } = await import('@/services/criticalOperationsService');
      
      await criticalOperationsService.updateRouteProgress({
        routeId,
        locationId,
        status,
        timestamp: new Date(),
        location,
      });

      return { routeId, locationId, status, location };
    },
    onSuccess: ({ routeId }) => {
      // Invalidate route queries
      queryClient.invalidateQueries({ queryKey: queryKeys.route(routeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRoute() });
      invalidateQueries.allRoutes();
    },
  });
};

/**
 * Hook for marking a waypoint as visited
 * Common action during route navigation
 */
export const useVisitWaypoint = () => {
  const updateRouteProgress = useUpdateRouteProgress();

  return useMutation({
    mutationFn: async ({ 
      routeId, 
      waypointIndex,
      location 
    }: { 
      routeId: string; 
      waypointIndex: number;
      location: { latitude: number; longitude: number };
    }) => {
      return updateRouteProgress.mutateAsync({
        routeId,
        locationId: `waypoint_${waypointIndex}`,
        status: 'visited',
        location,
      });
    },
  });
};

/**
 * Hook for marking a waypoint as in progress
 * Indicates arrival at a location but work not yet completed
 */
export const useStartWaypoint = () => {
  const updateRouteProgress = useUpdateRouteProgress();

  return useMutation({
    mutationFn: async ({ 
      routeId, 
      waypointIndex,
      location 
    }: { 
      routeId: string; 
      waypointIndex: number;
      location: { latitude: number; longitude: number };
    }) => {
      return updateRouteProgress.mutateAsync({
        routeId,
        locationId: `waypoint_${waypointIndex}`,
        status: 'in_progress',
        location,
      });
    },
  });
};

/**
 * Hook for skipping a waypoint
 * Used when a location cannot be visited or is no longer needed
 */
export const useSkipWaypoint = () => {
  const updateRouteProgress = useUpdateRouteProgress();

  return useMutation({
    mutationFn: async ({ 
      routeId, 
      waypointIndex,
      location 
    }: { 
      routeId: string; 
      waypointIndex: number;
      location: { latitude: number; longitude: number };
    }) => {
      return updateRouteProgress.mutateAsync({
        routeId,
        locationId: `waypoint_${waypointIndex}`,
        status: 'skipped',
        location,
      });
    },
  });
};

/**
 * Hook for getting route progress statistics
 * Useful for progress indicators and completion tracking
 */
export const useRouteProgress = (routeId?: string) => {
  const { data: route } = useRoute(routeId || '');
  const { criticalOperationsService } = require('@/services/criticalOperationsService');
  
  const [progressStats, setProgressStats] = useState({
    totalWaypoints: 0,
    visitedWaypoints: 0,
    inProgressWaypoints: 0,
    skippedWaypoints: 0,
    pendingWaypoints: 0,
    completionPercentage: 0,
  });

  useEffect(() => {
    if (!route || !routeId) return;

    const updateStats = () => {
      const routeProgressOps = criticalOperationsService
        .getPendingOperationsByType('route_progress')
        .filter((op: any) => op.entityId === routeId);

      const totalWaypoints = route.waypoints.length;
      let visitedWaypoints = 0;
      let inProgressWaypoints = 0;
      let skippedWaypoints = 0;

      // Count progress from pending operations (for offline scenarios)
      routeProgressOps.forEach((op: any) => {
        switch (op.optimisticData.status) {
          case 'visited':
            visitedWaypoints++;
            break;
          case 'in_progress':
            inProgressWaypoints++;
            break;
          case 'skipped':
            skippedWaypoints++;
            break;
        }
      });

      const completedWaypoints = visitedWaypoints + skippedWaypoints;
      const pendingWaypoints = totalWaypoints - completedWaypoints - inProgressWaypoints;
      const completionPercentage = totalWaypoints > 0 ? (completedWaypoints / totalWaypoints) * 100 : 0;

      setProgressStats({
        totalWaypoints,
        visitedWaypoints,
        inProgressWaypoints,
        skippedWaypoints,
        pendingWaypoints,
        completionPercentage,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [route, routeId, criticalOperationsService]);

  return progressStats;
};

/**
 * Prefetch route data for performance
 */
export const usePrefetchRoute = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return (routeId: string) => {
    if (!user?.id) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.route(routeId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('routes')
          .select('*')
          .eq('id', routeId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };
}; 