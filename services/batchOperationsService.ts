/**
 * Batch Operations Service
 * Combines multiple operations for efficient bulk synchronization
 * Provides progress tracking and operation prioritization
 */

import { queryClient, enhancedOptimisticUpdates, OptimisticOperation } from './queryClient';
import { offlineStatusService } from './offlineStatusService';
import { supabase } from './supabase';

// ==================== TYPES ====================

export interface BatchOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'job' | 'client' | 'route' | 'inventory';
  data: any;
  originalData?: any;
  priority: 'critical' | 'normal' | 'low';
  timestamp: Date;
  retryCount: number;
  error?: any;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export interface BatchRequest {
  id: string;
  operations: BatchOperation[];
  status: 'processing' | 'completed' | 'failed' | 'partial';
  progress: BatchProgress;
  startTime: Date;
  endTime?: Date;
  estimatedDuration: number;
}

export interface BatchOperationsListener {
  onStatusChange: (requestId: string, request: BatchRequest) => void;
  onProgress: (requestId: string, progress: BatchProgress) => void;
}

// ==================== BATCH OPERATIONS SERVICE ====================

export class BatchOperationsService {
  private static instance: BatchOperationsService;
  private pendingOperations: Map<string, BatchOperation> = new Map();
  private activeRequests: Map<string, BatchRequest> = new Map();
  private listeners: BatchOperationsListener[] = [];
  private processingTimer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing: boolean = false;
  private currentUserId: string | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): BatchOperationsService {
    if (!BatchOperationsService.instance) {
      BatchOperationsService.instance = new BatchOperationsService();
    }
    return BatchOperationsService.instance;
  }

  private async initialize() {
    console.log('BatchOperationsService: Initializing...');
    
    // Get the current user ID and track auth changes
    await this.updateCurrentUserId();
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      await this.updateCurrentUserId();
    });

    // Subscribe to network status changes
    offlineStatusService.subscribe((status) => {
      this.handleNetworkStatusChange(status);
    });

    console.log('BatchOperationsService: Initialized successfully');
  }

  private handleNetworkStatusChange(status: any) {
    // When coming back online, process queued operations
    if (status.connection.isOnline && this.pendingOperations.size > 0) {
      this.scheduleProcessing();
    }
  }

  private async updateCurrentUserId(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUserId = user?.id || null;
    } catch (error) {
      console.error('BatchOperationsService: Error getting current user:', error);
      this.currentUserId = null;
    }
  }

  // ==================== OPERATION MANAGEMENT ====================

  /**
   * Add operation to batch queue
   */
  queueOperation(
    type: BatchOperation['type'],
    entity: BatchOperation['entity'],
    data: any,
    originalData?: any,
    priority: BatchOperation['priority'] = 'normal'
  ): string {
    const operation: BatchOperation = {
      id: `${type}_${entity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      originalData,
      priority,
      timestamp: new Date(),
      retryCount: 0,
    };

    this.pendingOperations.set(operation.id, operation);
    console.log(`BatchOperationsService: Queued ${priority} ${type} operation for ${entity}:`, operation.id);

    // Schedule processing if online
    if (offlineStatusService.isOnline()) {
      this.scheduleProcessing();
    }

    return operation.id;
  }

  /**
   * Get pending operations count by priority
   */
  getPendingOperationsCount(): { critical: number; normal: number; low: number; total: number } {
    const operations = Array.from(this.pendingOperations.values());
    
    return {
      critical: operations.filter(op => op.priority === 'critical').length,
      normal: operations.filter(op => op.priority === 'normal').length,
      low: operations.filter(op => op.priority === 'low').length,
      total: operations.length,
    };
  }

  /**
   * Clear completed operations
   */
  clearCompletedOperations() {
    // Remove completed requests older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    for (const [requestId, request] of this.activeRequests.entries()) {
      if (
        (request.status === 'completed' || request.status === 'failed') &&
        request.endTime &&
        request.endTime < fiveMinutesAgo
      ) {
        this.activeRequests.delete(requestId);
      }
    }
  }

  // ==================== BATCH PROCESSING ====================

  /**
   * Schedule processing of pending operations
   */
  private scheduleProcessing() {
    if (this.isProcessing || this.pendingOperations.size === 0) {
      return;
    }

    // Clear existing timer
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }

    // Schedule processing based on connection quality
    const connectionQuality = offlineStatusService.getConnectionQuality();
    let delay = 1000; // Default 1 second

    switch (connectionQuality) {
      case 'excellent':
        delay = 500; // 0.5 seconds
        break;
      case 'good':
        delay = 1000; // 1 second
        break;
      case 'fair':
        delay = 2000; // 2 seconds
        break;
      case 'poor':
        delay = 5000; // 5 seconds
        break;
      default:
        delay = 1000;
    }

    this.processingTimer = setTimeout(() => {
      this.processQueuedOperations();
    }, delay);
  }

  /**
   * Start the background processing loop
   */
  private startProcessingLoop() {
    // Process operations every 30 seconds if there are pending operations
    const processLoop = () => {
      if (this.pendingOperations.size > 0 && offlineStatusService.isOnline() && !this.isProcessing) {
        this.scheduleProcessing();
      }
      
      // Clear old completed operations
      this.clearCompletedOperations();
      
      // Schedule next loop
      setTimeout(processLoop, 30000); // 30 seconds
    };

    // Start the loop
    setTimeout(processLoop, 5000); // Initial delay of 5 seconds
  }

  /**
   * Process all queued operations in optimized batches
   */
  async processQueuedOperations(): Promise<void> {
    if (this.isProcessing || !offlineStatusService.isOnline()) {
      return;
    }

    if (this.pendingOperations.size === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`BatchOperationsService: Processing ${this.pendingOperations.size} queued operations`);

    try {
      // Group operations by priority and entity type for optimal batching
      const batches = this.createOptimalBatches();
      
      // Process each batch
      for (const batch of batches) {
        await this.processBatch(batch);
      }

    } catch (error) {
      console.error('BatchOperationsService: Error processing operations:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Create optimal batches based on priority and entity type
   * ENHANCED: Better prioritization for critical operations
   */
  private createOptimalBatches(): BatchOperation[][] {
    const operations = Array.from(this.pendingOperations.values());
    
    // Enhanced sorting with critical operation sub-prioritization
    operations.sort((a, b) => {
      const priorityOrder = { critical: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Within same priority, prioritize critical operations by entity importance
      if (a.priority === 'critical' && b.priority === 'critical') {
        const entityOrder = { 
          job: 0,       // Job status changes are most critical
          inventory: 1, // Inventory updates are second priority
          route: 2,     // Route progress is third
          client: 3     // Client updates are lowest critical priority
        };
        
        const entityDiff = (entityOrder[a.entity] || 99) - (entityOrder[b.entity] || 99);
        if (entityDiff !== 0) {
          return entityDiff;
        }
        
        // For same entity type, prioritize newer operations (more likely to be user-initiated)
        return b.timestamp.getTime() - a.timestamp.getTime();
      }
      
      // For non-critical operations, maintain chronological order
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    // Group into batches
    const batches: BatchOperation[][] = [];
    const connectionQuality = offlineStatusService.getConnectionQuality();
    
    // Determine batch size based on connection quality
    let maxBatchSize = 10;
    switch (connectionQuality) {
      case 'excellent':
        maxBatchSize = 20;
        break;
      case 'good':
        maxBatchSize = 10;
        break;
      case 'fair':
        maxBatchSize = 5;
        break;
      case 'poor':
        maxBatchSize = 2;
        break;
    }

    // Create batches with enhanced critical operation grouping
    const criticalOperations = operations.filter(op => op.priority === 'critical');
    const normalOperations = operations.filter(op => op.priority === 'normal');
    const lowOperations = operations.filter(op => op.priority === 'low');

    // Process critical operations in smaller, focused batches for faster processing
    const criticalBatchSize = Math.min(maxBatchSize, 5); // Smaller batches for critical ops
    
    // Add critical operation batches first
    for (let i = 0; i < criticalOperations.length; i += criticalBatchSize) {
      batches.push(criticalOperations.slice(i, i + criticalBatchSize));
    }
    
    // Add normal and low priority operations in regular batches
    const remainingOperations = [...normalOperations, ...lowOperations];
    for (let i = 0; i < remainingOperations.length; i += maxBatchSize) {
      batches.push(remainingOperations.slice(i, i + maxBatchSize));
    }

    console.log(`BatchOperationsService: Created ${batches.length} batches (${criticalOperations.length} critical, ${normalOperations.length} normal, ${lowOperations.length} low priority)`);
    return batches;
  }

  /**
   * Process a single batch of operations
   */
  private async processBatch(operations: BatchOperation[]): Promise<void> {
    const requestId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const batchRequest: BatchRequest = {
      id: requestId,
      operations,
      status: 'processing',
      progress: {
        total: operations.length,
        completed: 0,
        failed: 0,
      },
      startTime: new Date(),
      estimatedDuration: this.estimateBatchDuration(operations),
    };

    this.activeRequests.set(requestId, batchRequest);
    this.notifyProgress(requestId);
    this.notifyStatusChange(requestId);

    console.log(`BatchOperationsService: Processing batch ${requestId} with ${operations.length} operations`);

    let completedCount = 0;
    let failedCount = 0;

    // Process operations sequentially to avoid overwhelming the server
    for (const operation of operations) {
      try {
        batchRequest.progress.current = `${operation.type} ${operation.entity}`;
        this.notifyProgress(requestId);

        await this.executeOperation(operation);
        
        // Remove from pending operations
        this.pendingOperations.delete(operation.id);
        completedCount++;
        
        console.log(`BatchOperationsService: Completed operation ${operation.id}`);

      } catch (error) {
        console.error(`BatchOperationsService: Failed operation ${operation.id}:`, error);
        
        operation.error = error;
        operation.retryCount++;
        failedCount++;

        // Retry logic
        if (operation.retryCount < 3 && operation.priority === 'critical') {
          // Keep critical operations in queue for retry
          console.log(`BatchOperationsService: Retrying critical operation ${operation.id} (attempt ${operation.retryCount})`);
        } else {
          // Remove failed operations that have exceeded retry limit
          this.pendingOperations.delete(operation.id);
          console.log(`BatchOperationsService: Removed failed operation ${operation.id} after ${operation.retryCount} attempts`);
        }
      }

      batchRequest.progress.completed = completedCount;
      batchRequest.progress.failed = failedCount;
      this.notifyProgress(requestId);
      this.notifyStatusChange(requestId);

      // Small delay between operations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update batch status
    batchRequest.status = failedCount === 0 ? 'completed' : 
                        completedCount === 0 ? 'failed' : 'partial';
    batchRequest.endTime = new Date();
    batchRequest.progress.current = undefined;
    
    this.notifyProgress(requestId);
    this.notifyStatusChange(requestId);
    
    console.log(`BatchOperationsService: Batch ${requestId} completed - ${completedCount} successful, ${failedCount} failed`);
  }

  /**
   * Execute a single operation
   */
  private async executeOperation(operation: BatchOperation): Promise<void> {
    const { type, entity, data } = operation;

    switch (entity) {
      case 'job':
        await this.executeJobOperation(type, data);
        break;
      case 'client':
        await this.executeClientOperation(type, data);
        break;
      case 'route':
        await this.executeRouteOperation(type, data);
        break;
      case 'inventory':
        await this.executeInventoryOperation(type, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  /**
   * Execute job operations
   */
  private async executeJobOperation(type: BatchOperation['type'], data: any): Promise<void> {
    switch (type) {
      case 'create':
        // Ensure user_id is included in job data
        const jobData = {
          ...data,
          user_id: this.currentUserId,
        };

        // Validate required fields
        if (!jobData.user_id) {
          throw new Error('User not authenticated');
        }

        const { data: jobResult, error: jobError } = await supabase
          .from('job_locations')
          .insert(jobData)
          .select()
          .single();
        
        if (jobError) throw jobError;
        
        // Update cache with real data
        queryClient.setQueryData(['jobs', jobResult.id], jobResult);
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        break;

      case 'update':
        const { data: updatedJob, error: updateError } = await supabase
          .from('job_locations')
          .update(data.updates)
          .eq('id', data.jobId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        // Update cache
        queryClient.setQueryData(['jobs', data.jobId], updatedJob);
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('job_locations')
          .delete()
          .eq('id', data.jobId);
        
        if (deleteError) throw deleteError;
        
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['jobs', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        break;

      default:
        throw new Error(`Unknown job operation type: ${type}`);
    }
  }

  /**
   * Execute client operations
   */
  private async executeClientOperation(type: BatchOperation['type'], data: any): Promise<void> {
    // Implementation for client operations
    switch (type) {
      case 'create':
        // Client creation logic
        break;
      case 'update':
        // Client update logic
        break;
      case 'delete':
        // Client deletion logic
        break;
      default:
        throw new Error(`Unknown client operation type: ${type}`);
    }
  }

  /**
   * Execute route operations
   */
  private async executeRouteOperation(type: BatchOperation['type'], data: any): Promise<void> {
    // Implementation for route operations
    switch (type) {
      case 'create':
        // Route creation logic
        break;
      case 'update':
        // Route update logic
        break;
      case 'delete':
        // Route deletion logic
        break;
      default:
        throw new Error(`Unknown route operation type: ${type}`);
    }
  }

  /**
   * Execute inventory operations
   */
  private async executeInventoryOperation(type: BatchOperation['type'], data: any): Promise<void> {
    switch (type) {
      case 'create':
        // Ensure user_id is included in inventory data
        const inventoryData = {
          ...data,
          user_id: this.currentUserId,
        };

        // Validate required fields
        if (!inventoryData.user_id) {
          throw new Error('User not authenticated');
        }

        const { data: itemData, error: itemError } = await supabase
          .from('inventory_items')
          .insert(inventoryData)
          .select()
          .single();
        
        if (itemError) throw itemError;
        
        // Update cache
        queryClient.setQueryData(['inventory', itemData.id], itemData);
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        break;

      case 'update':
        const { data: updatedItem, error: updateError } = await supabase
          .from('inventory_items')
          .update(data.updates)
          .eq('id', data.itemId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        // Update cache
        queryClient.setQueryData(['inventory', data.itemId], updatedItem);
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('inventory_items')
          .delete()
          .eq('id', data.itemId);
        
        if (deleteError) throw deleteError;
        
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['inventory', data.itemId] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        break;

      default:
        throw new Error(`Unknown inventory operation type: ${type}`);
    }
  }

  // ==================== PROGRESS TRACKING ====================

  /**
   * Estimate batch processing duration
   */
  private estimateBatchDuration(operations: BatchOperation[]): number {
    const connectionQuality = offlineStatusService.getConnectionQuality();
    
    // Base time per operation (seconds)
    let baseTimePerOperation = 1;
    
    switch (connectionQuality) {
      case 'excellent':
        baseTimePerOperation = 0.5;
        break;
      case 'good':
        baseTimePerOperation = 1;
        break;
      case 'fair':
        baseTimePerOperation = 2;
        break;
      case 'poor':
        baseTimePerOperation = 4;
        break;
    }

    // Add complexity factor based on operation types
    let complexityFactor = 1;
    const hasCreates = operations.some(op => op.type === 'create');
    const hasUpdates = operations.some(op => op.type === 'update');
    const hasDeletes = operations.some(op => op.type === 'delete');
    
    if (hasCreates) complexityFactor += 0.5;
    if (hasUpdates) complexityFactor += 0.3;
    if (hasDeletes) complexityFactor += 0.2;

    return Math.ceil(operations.length * baseTimePerOperation * complexityFactor);
  }

  /**
   * Notify progress listeners
   */
  private notifyProgress(requestId: string) {
    const request = this.activeRequests.get(requestId);
    if (!request) return;

    const progressPercentage = Math.round(
      (request.progress.completed / request.progress.total) * 100
    );

    const timeElapsed = Date.now() - request.startTime.getTime();
    const estimatedTimeRemaining = request.estimatedDuration ? 
      Math.max(0, (request.estimatedDuration * 1000) - timeElapsed) / 1000 : undefined;

    const progress: BatchProgress = {
      total: request.progress.total,
      completed: request.progress.completed,
      failed: request.progress.failed,
      current: request.progress.current,
    };

    this.listeners.forEach(listener => {
      try {
        listener.onProgress(requestId, progress);
      } catch (error) {
        console.error('BatchOperationsService: Error notifying progress listener:', error);
      }
    });
  }

  /**
   * Notify status change listeners
   */
  private notifyStatusChange(requestId: string) {
    const request = this.activeRequests.get(requestId);
    if (!request) return;

    this.listeners.forEach(listener => {
      try {
        listener.onStatusChange(requestId, request);
      } catch (error) {
        console.error('BatchOperationsService: Error notifying status listener:', error);
      }
    });
  }

  // ==================== PUBLIC API ====================

  /**
   * Subscribe to batch operations progress updates
   */
  subscribe(listener: BatchOperationsListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Add a simplified progress listener (for compatibility with hooks)
   */
  addProgressListener(callback: (progress: BatchProgress) => void): () => void {
    const listener: BatchOperationsListener = {
      onProgress: (requestId: string, progress: BatchProgress) => {
        callback(progress);
      },
      onStatusChange: (requestId: string, request: BatchRequest) => {
        // Optional - can be used for more detailed status tracking
      }
    };
    
    return this.subscribe(listener);
  }

  /**
   * Get pending operations
   */
  getPendingOperations(): BatchOperation[] {
    return Array.from(this.pendingOperations.values());
  }

  /**
   * Get active batch requests
   */
  getActiveRequests(): BatchRequest[] {
    return Array.from(this.activeRequests.values());
  }

  /**
   * Get processing status
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Force process operations immediately
   */
  async forceProcessOperations(): Promise<void> {
    if (!offlineStatusService.isOnline()) {
      throw new Error('Cannot process operations while offline');
    }

    console.log('BatchOperationsService: Force processing requested');
    await this.processQueuedOperations();
  }

  /**
   * Clear all pending operations (use with caution)
   */
  clearPendingOperations(): void {
    console.warn('BatchOperationsService: Clearing all pending operations');
    this.pendingOperations.clear();
  }

  /**
   * Promote operation to critical priority
   * Used by critical operations service to elevate important operations
   */
  promoteToCritical(operationId: string): boolean {
    const operation = this.pendingOperations.get(operationId);
    if (!operation) {
      console.warn(`BatchOperationsService: Cannot promote operation ${operationId} - not found`);
      return false;
    }

    if (operation.priority === 'critical') {
      return true; // Already critical
    }

    operation.priority = 'critical';
    console.log(`BatchOperationsService: Promoted operation ${operationId} to critical priority`);
    
    // Trigger immediate processing if we're not already processing and we're online
    if (!this.isProcessing && offlineStatusService.isOnline()) {
      this.scheduleProcessing();
    }
    
    return true;
  }

  /**
   * Get operations by priority level
   * Useful for monitoring and debugging
   */
  getOperationsByPriority(priority: 'critical' | 'normal' | 'low'): BatchOperation[] {
    return Array.from(this.pendingOperations.values())
      .filter(op => op.priority === priority);
  }

  /**
   * Force immediate processing of critical operations only
   * Used for urgent operations that need immediate sync
   */
  async forceProcessCriticalOperations(): Promise<void> {
    if (this.isProcessing) {
      console.log('BatchOperationsService: Already processing, cannot force critical operations');
      return;
    }

    const criticalOperations = this.getOperationsByPriority('critical');
    
    if (criticalOperations.length === 0) {
      console.log('BatchOperationsService: No critical operations to process');
      return;
    }

    console.log(`BatchOperationsService: Force processing ${criticalOperations.length} critical operations`);
    
    this.isProcessing = true;
    try {
      // Create a single batch with only critical operations
      await this.processBatch(criticalOperations);
    } catch (error) {
      console.error('BatchOperationsService: Error force processing critical operations:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get batch statistics
   */
  getStatistics() {
    const pending = this.getPendingOperationsCount();
    const active = this.getActiveRequests();
    
    return {
      pending,
      active: active.length,
      isProcessing: this.isProcessing,
      lastProcessed: active.length > 0 ? 
        Math.max(...active.map(r => r.startTime.getTime())) : null,
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = null;
    }

    this.pendingOperations.clear();
    this.activeRequests.clear();
    this.listeners = [];
    this.isProcessing = false;

    console.log('BatchOperationsService: Destroyed');
  }
}

// ==================== SINGLETON INSTANCE ====================

export const batchOperationsService = BatchOperationsService.getInstance();
export default batchOperationsService; 