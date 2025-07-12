/**
 * Critical Operations Service
 * Handles offline-first critical operations with optimistic updates and local persistence
 * Focuses on inventory, job status, and route progress updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from './queryClient';
import { batchOperationsService } from './batchOperationsService';
import { offlineStatusService } from './offlineStatusService';
import { supabase } from './supabase';

// ==================== TYPES ====================

export interface CriticalOperation {
  id: string;
  type: 'inventory_update' | 'job_status_change' | 'route_progress';
  entity: 'inventory' | 'job' | 'route';
  entityId: string;
  data: any;
  optimisticData: any;
  timestamp: Date;
  userId: string;
  metadata: {
    originalValue?: any;
    operationType: 'increment' | 'decrement' | 'set' | 'status_change' | 'location_update';
  };
}

export interface InventoryUpdateData {
  itemId: string;
  quantityChange: number;
  newQuantity: number;
  operation: 'increment' | 'decrement' | 'set';
  jobId?: string;
  reason?: string;
}

export interface JobStatusUpdateData {
  jobId: string;
  newStatus: 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  previousStatus: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface RouteProgressData {
  routeId: string;
  locationId: string;
  status: 'visited' | 'in_progress' | 'skipped';
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
}

// ==================== SERVICE ====================

class CriticalOperationsService {
  private static instance: CriticalOperationsService;
  private isInitialized = false;
  private pendingOperations: CriticalOperation[] = [];
  private currentUserId: string | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): CriticalOperationsService {
    if (!CriticalOperationsService.instance) {
      CriticalOperationsService.instance = new CriticalOperationsService();
    }
    return CriticalOperationsService.instance;
  }

  private async initialize() {
    if (this.isInitialized) return;

    console.log('CriticalOperationsService: Initializing...');
    
    // Get current user
    await this.updateCurrentUserId();
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      await this.updateCurrentUserId();
    });

    // Load pending operations from storage
    await this.loadPendingOperations();

    // Subscribe to network status changes
    offlineStatusService.subscribe(async (status) => {
      if (status.connection.isOnline && this.pendingOperations.length > 0) {
        await this.syncPendingOperations();
      }
    });

    this.isInitialized = true;
    console.log('CriticalOperationsService: Initialized successfully');
  }

  private async updateCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUserId = user?.id || null;
  }

  private async loadPendingOperations() {
    try {
      const stored = await AsyncStorage.getItem('criticalOperations');
      if (stored) {
        this.pendingOperations = JSON.parse(stored).map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
        console.log(`CriticalOperationsService: Loaded ${this.pendingOperations.length} pending operations`);
      }
    } catch (error) {
      console.error('CriticalOperationsService: Error loading pending operations:', error);
    }
  }

  private async savePendingOperations() {
    try {
      await AsyncStorage.setItem('criticalOperations', JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('CriticalOperationsService: Error saving pending operations:', error);
    }
  }

  // ==================== INVENTORY OPERATIONS ====================

  /**
   * Update inventory quantity with offline-first approach
   */
  async updateInventoryQuantity(data: InventoryUpdateData): Promise<void> {
    const operationId = `inventory_${data.itemId}_${Date.now()}`;
    
    // Create optimistic update
    const optimisticUpdate: CriticalOperation = {
      id: operationId,
      type: 'inventory_update',
      entity: 'inventory',
      entityId: data.itemId,
      data: {
        id: data.itemId,
        quantity: data.newQuantity,
        updated_at: new Date().toISOString(),
      },
      optimisticData: {
        quantity: data.newQuantity,
        lastOperation: data.operation,
        operationId,
      },
      timestamp: new Date(),
      userId: this.currentUserId!,
      metadata: {
        originalValue: data.newQuantity - data.quantityChange,
        operationType: data.operation,
      },
    };

    // Apply optimistic update to cache
    this.applyOptimisticInventoryUpdate(data.itemId, optimisticUpdate);

    // Store operation for offline sync
    this.pendingOperations.push(optimisticUpdate);
    await this.savePendingOperations();

    // Try to sync immediately if online
    if (offlineStatusService.getStatus().connection.isOnline) {
      await this.syncOperation(optimisticUpdate);
    } else {
      // Queue for batch processing when back online
      batchOperationsService.queueOperation(
        'update',
        'inventory',
        optimisticUpdate.data,
        optimisticUpdate.optimisticData,
        'critical'
      );
    }
  }

  private applyOptimisticInventoryUpdate(itemId: string, operation: CriticalOperation) {
    // Update inventory list cache
    queryClient.setQueryData(['inventory'], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((item: any) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: operation.optimisticData.quantity,
            updated_at: new Date().toISOString(),
            _optimistic: true,
            _operationId: operation.id,
          };
        }
        return item;
      });
    });

    // Update individual item cache
    queryClient.setQueryData(['inventory', itemId], (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        quantity: operation.optimisticData.quantity,
        updated_at: new Date().toISOString(),
        _optimistic: true,
        _operationId: operation.id,
      };
    });
  }

  // ==================== JOB STATUS OPERATIONS ====================

  /**
   * Update job status with offline-first approach
   */
  async updateJobStatus(data: JobStatusUpdateData): Promise<void> {
    const operationId = `job_status_${data.jobId}_${Date.now()}`;
    
    // Create optimistic update
    const optimisticUpdate: CriticalOperation = {
      id: operationId,
      type: 'job_status_change',
      entity: 'job',
      entityId: data.jobId,
      data: {
        id: data.jobId,
        status: data.newStatus,
        updated_at: new Date().toISOString(),
        ...(data.location && { 
          current_latitude: data.location.latitude,
          current_longitude: data.location.longitude 
        }),
      },
      optimisticData: {
        status: data.newStatus,
        previousStatus: data.previousStatus,
        timestamp: data.timestamp,
        operationId,
      },
      timestamp: new Date(),
      userId: this.currentUserId!,
      metadata: {
        originalValue: data.previousStatus,
        operationType: 'status_change',
      },
    };

    // Apply optimistic update to cache
    this.applyOptimisticJobUpdate(data.jobId, optimisticUpdate);

    // Store operation for offline sync
    this.pendingOperations.push(optimisticUpdate);
    await this.savePendingOperations();

    // Try to sync immediately if online
    if (offlineStatusService.getStatus().connection.isOnline) {
      await this.syncOperation(optimisticUpdate);
    } else {
      // Queue for batch processing when back online
      batchOperationsService.queueOperation(
        'update',
        'job',
        optimisticUpdate.data,
        optimisticUpdate.optimisticData,
        'critical'
      );
    }
  }

  private applyOptimisticJobUpdate(jobId: string, operation: CriticalOperation) {
    // Update jobs list cache
    queryClient.setQueryData(['jobs'], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((job: any) => {
        if (job.id === jobId) {
          return {
            ...job,
            status: operation.optimisticData.status,
            updated_at: new Date().toISOString(),
            _optimistic: true,
            _operationId: operation.id,
          };
        }
        return job;
      });
    });

    // Update individual job cache
    queryClient.setQueryData(['job', jobId], (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        status: operation.optimisticData.status,
        updated_at: new Date().toISOString(),
        _optimistic: true,
        _operationId: operation.id,
      };
    });

    // Update today's jobs if this job is scheduled for today
    queryClient.setQueryData(['jobs', 'today'], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((job: any) => {
        if (job.id === jobId) {
          return {
            ...job,
            status: operation.optimisticData.status,
            updated_at: new Date().toISOString(),
            _optimistic: true,
            _operationId: operation.id,
          };
        }
        return job;
      });
    });
  }

  // ==================== ROUTE PROGRESS OPERATIONS ====================

  /**
   * Update route progress with offline-first approach
   */
  async updateRouteProgress(data: RouteProgressData): Promise<void> {
    const operationId = `route_progress_${data.routeId}_${data.locationId}_${Date.now()}`;
    
    // Create optimistic update
    const optimisticUpdate: CriticalOperation = {
      id: operationId,
      type: 'route_progress',
      entity: 'route',
      entityId: data.routeId,
      data: {
        route_id: data.routeId,
        location_id: data.locationId,
        status: data.status,
        visited_at: data.timestamp.toISOString(),
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        updated_at: new Date().toISOString(),
      },
      optimisticData: {
        locationId: data.locationId,
        status: data.status,
        timestamp: data.timestamp,
        operationId,
      },
      timestamp: new Date(),
      userId: this.currentUserId!,
      metadata: {
        operationType: 'location_update',
      },
    };

    // Apply optimistic update to cache
    this.applyOptimisticRouteUpdate(data.routeId, optimisticUpdate);

    // Store operation for offline sync
    this.pendingOperations.push(optimisticUpdate);
    await this.savePendingOperations();

    // Try to sync immediately if online
    if (offlineStatusService.getStatus().connection.isOnline) {
      await this.syncOperation(optimisticUpdate);
    } else {
      // Queue for batch processing when back online
      batchOperationsService.queueOperation(
        'update',
        'route',
        optimisticUpdate.data,
        optimisticUpdate.optimisticData,
        'critical'
      );
    }
  }

  private applyOptimisticRouteUpdate(routeId: string, operation: CriticalOperation) {
    // Update routes list cache
    queryClient.setQueryData(['routes'], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((route: any) => {
        if (route.id === routeId) {
          // Update the specific location within the route
          const updatedLocations = route.locations?.map((loc: any) => {
            if (loc.id === operation.optimisticData.locationId) {
              return {
                ...loc,
                status: operation.optimisticData.status,
                visited_at: operation.optimisticData.timestamp.toISOString(),
                _optimistic: true,
                _operationId: operation.id,
              };
            }
            return loc;
          });

          return {
            ...route,
            locations: updatedLocations,
            updated_at: new Date().toISOString(),
            _optimistic: true,
            _operationId: operation.id,
          };
        }
        return route;
      });
    });

    // Update individual route cache
    queryClient.setQueryData(['route', routeId], (oldData: any) => {
      if (!oldData) return oldData;
      
      const updatedLocations = oldData.locations?.map((loc: any) => {
        if (loc.id === operation.optimisticData.locationId) {
          return {
            ...loc,
            status: operation.optimisticData.status,
            visited_at: operation.optimisticData.timestamp.toISOString(),
            _optimistic: true,
            _operationId: operation.id,
          };
        }
        return loc;
      });

      return {
        ...oldData,
        locations: updatedLocations,
        updated_at: new Date().toISOString(),
        _optimistic: true,
        _operationId: operation.id,
      };
    });
  }

  // ==================== SYNC OPERATIONS ====================

  private async syncOperation(operation: CriticalOperation): Promise<void> {
    try {
      let result;
      
      switch (operation.type) {
        case 'inventory_update':
          result = await this.syncInventoryOperation(operation);
          break;
        case 'job_status_change':
          result = await this.syncJobStatusOperation(operation);
          break;
        case 'route_progress':
          result = await this.syncRouteProgressOperation(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      // Remove from pending operations
      this.pendingOperations = this.pendingOperations.filter(op => op.id !== operation.id);
      await this.savePendingOperations();

      // Update cache with server response
      this.updateCacheWithServerResponse(operation, result);
      
      console.log(`CriticalOperationsService: Synced operation ${operation.id}`);
    } catch (error) {
      console.error(`CriticalOperationsService: Error syncing operation ${operation.id}:`, error);
      throw error;
    }
  }

  private async syncInventoryOperation(operation: CriticalOperation): Promise<any> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update({
        quantity: operation.data.quantity,
        updated_at: operation.data.updated_at,
      })
      .eq('id', operation.entityId)
      .eq('user_id', this.currentUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async syncJobStatusOperation(operation: CriticalOperation): Promise<any> {
    const updateData: any = {
      status: operation.data.status,
      updated_at: operation.data.updated_at,
    };

    if (operation.data.current_latitude) {
      updateData.current_latitude = operation.data.current_latitude;
      updateData.current_longitude = operation.data.current_longitude;
    }

    const { data, error } = await supabase
      .from('job_locations')
      .update(updateData)
      .eq('id', operation.entityId)
      .eq('user_id', this.currentUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async syncRouteProgressOperation(operation: CriticalOperation): Promise<any> {
    // This might require a specific route_progress table or updating the routes table
    // For now, we'll assume there's a route_progress table
    const { data, error } = await supabase
      .from('route_progress')
      .upsert({
        route_id: operation.data.route_id,
        location_id: operation.data.location_id,
        status: operation.data.status,
        visited_at: operation.data.visited_at,
        latitude: operation.data.latitude,
        longitude: operation.data.longitude,
        user_id: this.currentUserId,
        updated_at: operation.data.updated_at,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private updateCacheWithServerResponse(operation: CriticalOperation, serverData: any) {
    // Remove optimistic flags and update with server data
    switch (operation.type) {
      case 'inventory_update':
        // Update inventory caches
        queryClient.setQueryData(['inventory'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((item: any) => {
            if (item.id === operation.entityId && item._operationId === operation.id) {
              const { _optimistic, _operationId, ...cleanItem } = item;
              return { ...cleanItem, ...serverData };
            }
            return item;
          });
        });
        
        queryClient.setQueryData(['inventory', operation.entityId], (oldData: any) => {
          if (!oldData || oldData._operationId !== operation.id) return oldData;
          const { _optimistic, _operationId, ...cleanData } = oldData;
          return { ...cleanData, ...serverData };
        });
        break;

      case 'job_status_change':
        // Update job caches
        ['jobs', 'jobs/today'].forEach(queryKey => {
          queryClient.setQueryData([queryKey], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((job: any) => {
              if (job.id === operation.entityId && job._operationId === operation.id) {
                const { _optimistic, _operationId, ...cleanJob } = job;
                return { ...cleanJob, ...serverData };
              }
              return job;
            });
          });
        });
        
        queryClient.setQueryData(['job', operation.entityId], (oldData: any) => {
          if (!oldData || oldData._operationId !== operation.id) return oldData;
          const { _optimistic, _operationId, ...cleanData } = oldData;
          return { ...cleanData, ...serverData };
        });
        break;

      case 'route_progress':
        // Update route caches
        queryClient.setQueryData(['routes'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((route: any) => {
            if (route.id === operation.entityId && route._operationId === operation.id) {
              const { _optimistic, _operationId, ...cleanRoute } = route;
              return { ...cleanRoute, ...serverData };
            }
            return route;
          });
        });
        
        queryClient.setQueryData(['route', operation.entityId], (oldData: any) => {
          if (!oldData || oldData._operationId !== operation.id) return oldData;
          const { _optimistic, _operationId, ...cleanData } = oldData;
          return { ...cleanData, ...serverData };
        });
        break;
    }
  }

  private async syncPendingOperations(): Promise<void> {
    console.log(`CriticalOperationsService: Syncing ${this.pendingOperations.length} pending operations`);
    
    const operationsToSync = [...this.pendingOperations];
    
    for (const operation of operationsToSync) {
      try {
        await this.syncOperation(operation);
      } catch (error) {
        console.error(`CriticalOperationsService: Failed to sync operation ${operation.id}:`, error);
        // Continue with other operations
      }
    }
  }

  // ==================== PUBLIC API ====================

  /**
   * Get pending operations count
   */
  getPendingOperationsCount(): number {
    return this.pendingOperations.length;
  }

  /**
   * Get pending operations by type
   */
  getPendingOperationsByType(type: CriticalOperation['type']): CriticalOperation[] {
    return this.pendingOperations.filter(op => op.type === type);
  }

  /**
   * Force sync all pending operations
   */
  async forceSyncPendingOperations(): Promise<void> {
    if (this.pendingOperations.length === 0) return;
    
    console.log('CriticalOperationsService: Force syncing pending operations');
    await this.syncPendingOperations();
  }

  /**
   * Clear all pending operations (for testing/debugging)
   */
  async clearPendingOperations(): Promise<void> {
    this.pendingOperations = [];
    await this.savePendingOperations();
    console.log('CriticalOperationsService: Cleared all pending operations');
  }
}

export const criticalOperationsService = CriticalOperationsService.getInstance(); 