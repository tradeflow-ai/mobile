/**
 * Critical Operations Hook
 * Provides offline-first functionality for inventory updates, job status changes, and route progress
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criticalOperationsService, InventoryUpdateData, JobStatusUpdateData, RouteProgressData } from '@/services/criticalOperationsService';
import { offlineStatusService } from '@/services/offlineStatusService';

// ==================== MAIN HOOK ====================

export function useCriticalOperations() {
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  // Subscribe to offline status changes
  useEffect(() => {
    const unsubscribe = offlineStatusService.subscribe((status) => {
      setIsOnline(status.connection.isOnline);
    });

    return unsubscribe;
  }, []);

  // Update pending operations count
  const updatePendingCount = useCallback(() => {
    setPendingOperationsCount(criticalOperationsService.getPendingOperationsCount());
  }, []);

  // Force sync pending operations
  const forceSyncPendingOperations = useCallback(async () => {
    try {
      await criticalOperationsService.forceSyncPendingOperations();
      updatePendingCount();
    } catch (error) {
      console.error('Error force syncing pending operations:', error);
    }
  }, [updatePendingCount]);

  // Clear pending operations (for testing)
  const clearPendingOperations = useCallback(async () => {
    await criticalOperationsService.clearPendingOperations();
    updatePendingCount();
  }, [updatePendingCount]);

  // Update pending count on mount and periodically
  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return {
    pendingOperationsCount,
    isOnline,
    forceSyncPendingOperations,
    clearPendingOperations,
    updatePendingCount,
  };
}

// ==================== INVENTORY OPERATIONS ====================

export function useInventoryUpdate() {
  const { updatePendingCount } = useCriticalOperations();

  return useMutation({
    mutationFn: async (data: InventoryUpdateData) => {
      await criticalOperationsService.updateInventoryQuantity(data);
      updatePendingCount();
    },
    onSuccess: () => {
      console.log('Inventory update operation queued successfully');
    },
    onError: (error: any) => {
      console.error('Error updating inventory:', error);
    },
  });
}

/**
 * Hook for updating inventory quantities with offline-first approach
 */
export function useUpdateInventoryQuantity() {
  const inventoryUpdate = useInventoryUpdate();

  const updateQuantity = useCallback(async (
    itemId: string,
    quantityChange: number,
    operation: 'increment' | 'decrement' | 'set',
    jobId?: string,
    reason?: string
  ) => {
    // Calculate new quantity based on operation
    // Note: In a real implementation, you'd want to get the current quantity from cache
    const currentQuantity = 0; // This should be fetched from cache
    const newQuantity = operation === 'set' ? quantityChange : currentQuantity + quantityChange;

    const data: InventoryUpdateData = {
      itemId,
      quantityChange,
      newQuantity,
      operation,
      jobId,
      reason,
    };

    await inventoryUpdate.mutateAsync(data);
  }, [inventoryUpdate]);

  return {
    updateQuantity,
    isLoading: inventoryUpdate.isPending,
    error: inventoryUpdate.error,
  };
}

// ==================== JOB STATUS OPERATIONS ====================

export function useJobStatusUpdate() {
  const { updatePendingCount } = useCriticalOperations();

  return useMutation({
    mutationFn: async (data: JobStatusUpdateData) => {
      await criticalOperationsService.updateJobStatus(data);
      updatePendingCount();
    },
    onSuccess: () => {
      console.log('Job status update operation queued successfully');
    },
    onError: (error: any) => {
      console.error('Error updating job status:', error);
    },
  });
}

/**
 * Hook for updating job status with offline-first approach
 */
export function useUpdateJobStatus() {
  const jobStatusUpdate = useJobStatusUpdate();

  const updateStatus = useCallback(async (
    jobId: string,
    newStatus: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled',
    previousStatus: string,
    location?: { latitude: number; longitude: number }
  ) => {
    const data: JobStatusUpdateData = {
      jobId,
      newStatus,
      previousStatus,
      timestamp: new Date(),
      location,
    };

    await jobStatusUpdate.mutateAsync(data);
  }, [jobStatusUpdate]);

  return {
    updateStatus,
    isLoading: jobStatusUpdate.isPending,
    error: jobStatusUpdate.error,
  };
}

// ==================== ROUTE PROGRESS OPERATIONS ====================

export function useRouteProgressUpdate() {
  const { updatePendingCount } = useCriticalOperations();

  return useMutation({
    mutationFn: async (data: RouteProgressData) => {
      await criticalOperationsService.updateRouteProgress(data);
      updatePendingCount();
    },
    onSuccess: () => {
      console.log('Route progress update operation queued successfully');
    },
    onError: (error: any) => {
      console.error('Error updating route progress:', error);
    },
  });
}

/**
 * Hook for updating route progress with offline-first approach
 */
export function useUpdateRouteProgress() {
  const routeProgressUpdate = useRouteProgressUpdate();

  const updateProgress = useCallback(async (
    routeId: string,
    locationId: string,
    status: 'visited' | 'in_progress' | 'skipped',
    location: { latitude: number; longitude: number }
  ) => {
    const data: RouteProgressData = {
      routeId,
      locationId,
      status,
      timestamp: new Date(),
      location,
    };

    await routeProgressUpdate.mutateAsync(data);
  }, [routeProgressUpdate]);

  return {
    updateProgress,
    isLoading: routeProgressUpdate.isPending,
    error: routeProgressUpdate.error,
  };
}

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook for using materials on a job (inventory decrement)
 */
export function useUseMaterials() {
  const { updateQuantity } = useUpdateInventoryQuantity();

  const useMaterials = useCallback(async (
    itemId: string,
    quantityUsed: number,
    jobId: string,
    reason?: string
  ) => {
    await updateQuantity(itemId, -quantityUsed, 'decrement', jobId, reason || 'Used on job');
  }, [updateQuantity]);

  return {
    useMaterials,
    isLoading: false, // This will be handled by the underlying mutation
  };
}

/**
 * Hook for starting a job (status change + location update)
 */
export function useStartJob() {
  const { updateStatus } = useUpdateJobStatus();

  const startJob = useCallback(async (
    jobId: string,
    location?: { latitude: number; longitude: number }
  ) => {
    await updateStatus(jobId, 'in_progress', 'pending', location);
  }, [updateStatus]);

  return {
    startJob,
    isLoading: false,
  };
}

/**
 * Hook for completing a job (status change + location update)
 */
export function useCompleteJob() {
  const { updateStatus } = useUpdateJobStatus();

  const completeJob = useCallback(async (
    jobId: string,
    location?: { latitude: number; longitude: number }
  ) => {
    await updateStatus(jobId, 'completed', 'in_progress', location);
  }, [updateStatus]);

  return {
    completeJob,
    isLoading: false,
  };
}

/**
 * Hook for marking a location as visited on a route
 */
export function useVisitLocation() {
  const { updateProgress } = useUpdateRouteProgress();

  const visitLocation = useCallback(async (
    routeId: string,
    locationId: string,
    location: { latitude: number; longitude: number }
  ) => {
    await updateProgress(routeId, locationId, 'visited', location);
  }, [updateProgress]);

  return {
    visitLocation,
    isLoading: false,
  };
}

// ==================== STATS HOOKS ====================

/**
 * Hook for getting critical operations statistics
 */
export function useCriticalOperationsStats() {
  const [stats, setStats] = useState({
    totalPending: 0,
    inventoryUpdates: 0,
    jobStatusChanges: 0,
    routeProgress: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      const totalPending = criticalOperationsService.getPendingOperationsCount();
      const inventoryUpdates = criticalOperationsService.getPendingOperationsByType('inventory_update').length;
      const jobStatusChanges = criticalOperationsService.getPendingOperationsByType('job_status_change').length;
      const routeProgress = criticalOperationsService.getPendingOperationsByType('route_progress').length;

      setStats({
        totalPending,
        inventoryUpdates,
        jobStatusChanges,
        routeProgress,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return stats;
} 