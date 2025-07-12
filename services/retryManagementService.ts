/**
 * Retry Management Service
 * Provides unified manual retry controls and failed operation tracking
 * Builds on existing retry logic in TanStack Query, BatchOperationsService, etc.
 */

import { queryClient } from './queryClient';
import { batchOperationsService } from './batchOperationsService';
import { offlineStatusService } from './offlineStatusService';
import { supabase } from './supabase';

// ==================== TYPES ====================

export interface FailedOperation {
  id: string;
  type: 'query' | 'mutation' | 'batch_operation' | 'daily_plan';
  entity: string; // 'job', 'inventory', 'client', 'route', 'daily_plan'
  operation: string; // 'create', 'update', 'delete', 'fetch'
  error: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  isRetryable: boolean;
  data?: any; // Original data for retry
  metadata?: {
    queryKey?: readonly unknown[];
    mutationKey?: readonly unknown[];
    priority?: 'critical' | 'normal' | 'low';
    originalBatchId?: string;
  };
}

export interface RetryResult {
  success: boolean;
  operationId: string;
  error?: any;
  data?: any;
}

export interface RetryAttempt {
  operationId: string;
  attempt: number;
  timestamp: Date;
  result: 'success' | 'failure' | 'pending';
  error?: any;
}

export interface RetryStats {
  totalFailed: number;
  totalRetryable: number;
  byType: {
    query: number;
    mutation: number;
    batch_operation: number;
    daily_plan: number;
  };
  byEntity: {
    job: number;
    inventory: number;
    client: number;
    route: number;
    daily_plan: number;
  };
  byPriority: {
    critical: number;
    normal: number;
    low: number;
  };
}

export interface RetryManagementListener {
  onFailedOperationAdded: (operation: FailedOperation) => void;
  onFailedOperationRetried: (operation: FailedOperation, result: RetryResult) => void;
  onFailedOperationResolved: (operationId: string) => void;
  onRetryStatsChanged: (stats: RetryStats) => void;
}

// ==================== RETRY MANAGEMENT SERVICE ====================

export class RetryManagementService {
  private static instance: RetryManagementService;
  private failedOperations: Map<string, FailedOperation> = new Map();
  private retryAttempts: Map<string, RetryAttempt[]> = new Map();
  private listeners: RetryManagementListener[] = [];
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private currentUserId: string | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): RetryManagementService {
    if (!RetryManagementService.instance) {
      RetryManagementService.instance = new RetryManagementService();
    }
    return RetryManagementService.instance;
  }

  // ==================== INITIALIZATION ====================

  private async initialize() {
    console.log('RetryManagementService: Initializing...');

    // Get current user ID
    await this.updateCurrentUserId();

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      await this.updateCurrentUserId();
    });

    // Start monitoring failed operations
    this.startMonitoring();

    // Subscribe to offline status changes
    offlineStatusService.subscribe((status) => {
      if (status.connection.isOnline) {
        this.handleReconnection();
      }
    });

    console.log('RetryManagementService: Initialized successfully');
  }

  private async updateCurrentUserId(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUserId = user?.id || null;
    } catch (error) {
      console.error('RetryManagementService: Error getting current user:', error);
      this.currentUserId = null;
    }
  }

  // ==================== MONITORING ====================

  private startMonitoring() {
    // Monitor failed operations every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.scanForFailedOperations();
    }, 5000);

    // Initial scan
    this.scanForFailedOperations();
  }

  private scanForFailedOperations() {
    try {
      // Scan TanStack Query mutations
      this.scanFailedMutations();
      
      // Scan TanStack Query queries
      this.scanFailedQueries();
      
      // Scan batch operations
      this.scanFailedBatchOperations();
      
      // Scan daily plans
      this.scanFailedDailyPlans();
      
      // Update retry stats
      this.notifyStatsChanged();
    } catch (error) {
      console.error('RetryManagementService: Error scanning for failed operations:', error);
    }
  }

  private scanFailedMutations() {
    const mutationCache = queryClient.getMutationCache();
    const mutations = mutationCache.getAll();
    
    mutations.forEach((mutation) => {
      if (mutation.state.status === 'error' && mutation.state.error) {
        const operationId = `mutation_${mutation.mutationId}`;
        
        if (!this.failedOperations.has(operationId)) {
          const failedOperation: FailedOperation = {
            id: operationId,
            type: 'mutation',
            entity: this.extractEntityFromMutation(mutation),
            operation: this.extractOperationFromMutation(mutation),
            error: mutation.state.error,
            timestamp: new Date(),
                         retryCount: (mutation.state as any).failureCount || 0,
            maxRetries: 3,
            isRetryable: this.isMutationRetryable(mutation),
            data: mutation.state.variables,
                         metadata: {
               mutationKey: mutation.options.mutationKey ? [...mutation.options.mutationKey] : undefined,
               priority: this.extractPriorityFromMutation(mutation),
             },
          };
          
          this.addFailedOperation(failedOperation);
        }
      }
    });
  }

  private scanFailedQueries() {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    queries.forEach((query) => {
      if (query.state.status === 'error' && query.state.error) {
        const operationId = `query_${query.queryHash}`;
        
        if (!this.failedOperations.has(operationId)) {
          const failedOperation: FailedOperation = {
            id: operationId,
            type: 'query',
            entity: this.extractEntityFromQuery(query),
            operation: 'fetch',
            error: query.state.error,
            timestamp: new Date(),
                         retryCount: (query.state as any).failureCount || 0,
            maxRetries: 3,
            isRetryable: this.isQueryRetryable(query),
            metadata: {
              queryKey: query.queryKey,
              priority: this.extractPriorityFromQuery(query),
            },
          };
          
          this.addFailedOperation(failedOperation);
        }
      }
    });
  }

  private scanFailedBatchOperations() {
    // Get failed operations from batch operations service
    const batchOperations = batchOperationsService.getPendingOperations();
    
    batchOperations.forEach((operation) => {
      if (operation.error && operation.retryCount > 0) {
        const operationId = `batch_${operation.id}`;
        
        if (!this.failedOperations.has(operationId)) {
          const failedOperation: FailedOperation = {
            id: operationId,
            type: 'batch_operation',
            entity: operation.entity,
            operation: operation.type,
            error: operation.error,
            timestamp: operation.timestamp,
            retryCount: operation.retryCount,
            maxRetries: operation.priority === 'critical' ? 3 : 1,
            isRetryable: operation.retryCount < (operation.priority === 'critical' ? 3 : 1),
            data: operation.data,
            metadata: {
              priority: operation.priority,
              originalBatchId: operation.id,
            },
          };
          
          this.addFailedOperation(failedOperation);
        }
      }
    });
  }

  private async scanFailedDailyPlans() {
    if (!this.currentUserId) return;

    try {
      const { data: failedPlans, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', this.currentUserId)
        .eq('status', 'error')
        .not('error_state', 'is', null);

      if (error) throw error;

      failedPlans?.forEach((plan) => {
        const operationId = `daily_plan_${plan.id}`;
        
        if (!this.failedOperations.has(operationId)) {
          const failedOperation: FailedOperation = {
            id: operationId,
            type: 'daily_plan',
            entity: 'daily_plan',
            operation: 'generate',
            error: plan.error_state,
            timestamp: new Date(plan.updated_at),
            retryCount: plan.retry_count || 0,
            maxRetries: 3,
            isRetryable: (plan.retry_count || 0) < 3 && plan.error_state?.retry_suggested,
            data: plan,
            metadata: {
              priority: 'normal',
            },
          };
          
          this.addFailedOperation(failedOperation);
        }
      });
    } catch (error) {
      console.error('RetryManagementService: Error scanning failed daily plans:', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  private extractEntityFromMutation(mutation: any): string {
    const mutationKey = mutation.options.mutationKey;
    if (mutationKey && mutationKey.length > 0) {
      const key = mutationKey[0];
      if (key.includes('job')) return 'job';
      if (key.includes('inventory')) return 'inventory';
      if (key.includes('client')) return 'client';
      if (key.includes('route')) return 'route';
      if (key.includes('daily_plan')) return 'daily_plan';
    }
    return 'unknown';
  }

  private extractOperationFromMutation(mutation: any): string {
    const mutationKey = mutation.options.mutationKey;
    if (mutationKey && mutationKey.length > 0) {
      const key = mutationKey[0];
      if (key.includes('create')) return 'create';
      if (key.includes('update')) return 'update';
      if (key.includes('delete')) return 'delete';
    }
    return 'unknown';
  }

  private extractEntityFromQuery(query: any): string {
    const queryKey = query.queryKey;
    if (queryKey && queryKey.length > 0) {
      const key = queryKey[0];
      if (key.includes('job')) return 'job';
      if (key.includes('inventory')) return 'inventory';
      if (key.includes('client')) return 'client';
      if (key.includes('route')) return 'route';
      if (key.includes('daily_plan')) return 'daily_plan';
    }
    return 'unknown';
  }

  private extractPriorityFromMutation(mutation: any): 'critical' | 'normal' | 'low' {
    const entity = this.extractEntityFromMutation(mutation);
    // Jobs and critical inventory operations are high priority
    if (entity === 'job' || entity === 'inventory') return 'critical';
    // Routes and clients are normal priority
    if (entity === 'route' || entity === 'client') return 'normal';
    // Everything else is low priority
    return 'low';
  }

  private extractPriorityFromQuery(query: any): 'critical' | 'normal' | 'low' {
    const entity = this.extractEntityFromQuery(query);
    // Jobs and daily plans are high priority
    if (entity === 'job' || entity === 'daily_plan') return 'critical';
    // Inventory and routes are normal priority
    if (entity === 'inventory' || entity === 'route') return 'normal';
    // Everything else is low priority
    return 'low';
  }

  private isMutationRetryable(mutation: any): boolean {
    const error = mutation.state.error;
    // Don't retry authentication errors
    if (error?.status === 401 || error?.status === 403) return false;
    // Don't retry if already exceeded max retries
    if ((mutation.state.failureCount || 0) >= 3) return false;
    return true;
  }

  private isQueryRetryable(query: any): boolean {
    const error = query.state.error;
    // Don't retry authentication errors
    if (error?.status === 401 || error?.status === 403) return false;
    // Don't retry if already exceeded max retries
    if ((query.state.failureCount || 0) >= 3) return false;
    return true;
  }

  // ==================== FAILED OPERATION MANAGEMENT ====================

  private addFailedOperation(operation: FailedOperation) {
    this.failedOperations.set(operation.id, operation);
    this.notifyFailedOperationAdded(operation);
    console.log(`RetryManagementService: Added failed operation ${operation.id}:`, operation);
  }

  private removeFailedOperation(operationId: string) {
    if (this.failedOperations.has(operationId)) {
      this.failedOperations.delete(operationId);
      this.retryAttempts.delete(operationId);
      this.notifyFailedOperationResolved(operationId);
      console.log(`RetryManagementService: Removed failed operation ${operationId}`);
    }
  }

  private handleReconnection() {
    console.log('RetryManagementService: Handling reconnection - scanning for auto-retries');
    
    // Trigger TanStack Query to retry failed operations
    queryClient.resumePausedMutations();
    queryClient.refetchQueries({
      type: 'all',
      stale: true,
    });
    
    // Force process batch operations
    batchOperationsService.forceProcessOperations().catch(error => {
      console.error('RetryManagementService: Error forcing batch operations:', error);
    });
  }

  // ==================== MANUAL RETRY METHODS ====================

  /**
   * Get all failed operations
   */
  getFailedOperations(): FailedOperation[] {
    return Array.from(this.failedOperations.values());
  }

  /**
   * Get failed operations by type
   */
  getFailedOperationsByType(type: FailedOperation['type']): FailedOperation[] {
    return this.getFailedOperations().filter(op => op.type === type);
  }

  /**
   * Get failed operations by entity
   */
  getFailedOperationsByEntity(entity: string): FailedOperation[] {
    return this.getFailedOperations().filter(op => op.entity === entity);
  }

  /**
   * Get retryable operations
   */
  getRetryableOperations(): FailedOperation[] {
    return this.getFailedOperations().filter(op => op.isRetryable);
  }

  /**
   * Get retry stats
   */
  getRetryStats(): RetryStats {
    const operations = this.getFailedOperations();
    const retryable = operations.filter(op => op.isRetryable);
    
    const stats: RetryStats = {
      totalFailed: operations.length,
      totalRetryable: retryable.length,
      byType: {
        query: 0,
        mutation: 0,
        batch_operation: 0,
        daily_plan: 0,
      },
      byEntity: {
        job: 0,
        inventory: 0,
        client: 0,
        route: 0,
        daily_plan: 0,
      },
      byPriority: {
        critical: 0,
        normal: 0,
        low: 0,
      },
    };

    operations.forEach(op => {
      // Count by type
      if (op.type in stats.byType) {
        stats.byType[op.type]++;
      }
      
             // Count by entity
       if (op.entity in stats.byEntity) {
         (stats.byEntity as any)[op.entity]++;
       }
      
      // Count by priority
      const priority = op.metadata?.priority || 'normal';
      if (priority in stats.byPriority) {
        stats.byPriority[priority]++;
      }
    });

    return stats;
  }

  /**
   * Retry a specific failed operation
   */
  async retryFailedOperation(operationId: string): Promise<RetryResult> {
    const operation = this.failedOperations.get(operationId);
    if (!operation) {
      throw new Error(`Failed operation ${operationId} not found`);
    }

    if (!operation.isRetryable) {
      throw new Error(`Operation ${operationId} is not retryable`);
    }

    const attempt: RetryAttempt = {
      operationId,
      attempt: operation.retryCount + 1,
      timestamp: new Date(),
      result: 'pending',
    };

    // Add to retry attempts
    if (!this.retryAttempts.has(operationId)) {
      this.retryAttempts.set(operationId, []);
    }
    this.retryAttempts.get(operationId)!.push(attempt);

    try {
      let result: RetryResult;

      switch (operation.type) {
        case 'mutation':
          result = await this.retryMutation(operation);
          break;
        case 'query':
          result = await this.retryQuery(operation);
          break;
        case 'batch_operation':
          result = await this.retryBatchOperation(operation);
          break;
        case 'daily_plan':
          result = await this.retryDailyPlan(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      // Update retry attempt
      attempt.result = result.success ? 'success' : 'failure';
      attempt.error = result.error;

      // Update operation retry count
      operation.retryCount++;
      operation.isRetryable = operation.retryCount < operation.maxRetries;

      // If successful, remove from failed operations
      if (result.success) {
        this.removeFailedOperation(operationId);
      }

      // Notify listeners
      this.notifyFailedOperationRetried(operation, result);

      console.log(`RetryManagementService: Retry ${result.success ? 'successful' : 'failed'} for operation ${operationId}`);
      return result;

    } catch (error) {
      // Update retry attempt
      attempt.result = 'failure';
      attempt.error = error;

      // Update operation
      operation.retryCount++;
      operation.isRetryable = operation.retryCount < operation.maxRetries;

      const result: RetryResult = {
        success: false,
        operationId,
        error,
      };

      // Notify listeners
      this.notifyFailedOperationRetried(operation, result);

      console.error(`RetryManagementService: Retry failed for operation ${operationId}:`, error);
      return result;
    }
  }

  /**
   * Retry all retryable operations
   */
  async retryAllOperations(): Promise<RetryResult[]> {
    const retryableOperations = this.getRetryableOperations();
    const results: RetryResult[] = [];

    console.log(`RetryManagementService: Retrying ${retryableOperations.length} operations`);

    for (const operation of retryableOperations) {
      try {
        const result = await this.retryFailedOperation(operation.id);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          operationId: operation.id,
          error,
        });
      }
    }

    return results;
  }

  /**
   * Clear all failed operations
   */
  clearAllFailedOperations(): void {
    console.log('RetryManagementService: Clearing all failed operations');
    this.failedOperations.clear();
    this.retryAttempts.clear();
    this.notifyStatsChanged();
  }

  /**
   * Clear resolved operations (successful retries)
   */
  clearResolvedOperations(): void {
    const resolvedOperations = Array.from(this.failedOperations.entries())
      .filter(([_, operation]) => !operation.isRetryable)
      .map(([id, _]) => id);

    resolvedOperations.forEach(operationId => {
      this.removeFailedOperation(operationId);
    });

    console.log(`RetryManagementService: Cleared ${resolvedOperations.length} resolved operations`);
  }

  // ==================== RETRY IMPLEMENTATIONS ====================

  private async retryMutation(operation: FailedOperation): Promise<RetryResult> {
    const mutationCache = queryClient.getMutationCache();
         const mutation = mutationCache.find({ mutationKey: operation.metadata?.mutationKey }) || 
                       mutationCache.getAll().find((m: any) => m.mutationId.toString() === operation.id.replace('mutation_', ''));

    if (!mutation) {
      throw new Error('Original mutation not found');
    }

    try {
      // Retry the mutation with original data
      const result = await mutation.execute(operation.data);
      
      return {
        success: true,
        operationId: operation.id,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        operationId: operation.id,
        error,
      };
    }
  }

  private async retryQuery(operation: FailedOperation): Promise<RetryResult> {
    if (!operation.metadata?.queryKey) {
      throw new Error('Query key not found in operation metadata');
    }

    try {
      // Retry the query
      const result = await queryClient.refetchQueries({
        queryKey: operation.metadata.queryKey,
        type: 'all',
      });
      
      return {
        success: true,
        operationId: operation.id,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        operationId: operation.id,
        error,
      };
    }
  }

  private async retryBatchOperation(operation: FailedOperation): Promise<RetryResult> {
    if (!operation.metadata?.originalBatchId) {
      throw new Error('Original batch ID not found in operation metadata');
    }

    try {
      // Re-queue the operation in batch operations service
      const newOperationId = batchOperationsService.queueOperation(
        operation.operation as any,
        operation.entity as any,
        operation.data,
        undefined,
        operation.metadata.priority as any
      );

      return {
        success: true,
        operationId: operation.id,
        data: { newOperationId },
      };
    } catch (error) {
      return {
        success: false,
        operationId: operation.id,
        error,
      };
    }
  }

  private async retryDailyPlan(operation: FailedOperation): Promise<RetryResult> {
    if (!operation.data?.id) {
      throw new Error('Daily plan ID not found in operation data');
    }

    try {
      // Retry the daily plan generation
      const { data, error } = await supabase.functions.invoke('plan-day', {
        body: { planId: operation.data.id, retry: true },
      });

      if (error) throw error;

      return {
        success: true,
        operationId: operation.id,
        data,
      };
    } catch (error) {
      return {
        success: false,
        operationId: operation.id,
        error,
      };
    }
  }

  // ==================== LISTENER MANAGEMENT ====================

  /**
   * Subscribe to retry management events
   */
  subscribe(listener: RetryManagementListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyFailedOperationAdded(operation: FailedOperation) {
    this.listeners.forEach(listener => {
      try {
        listener.onFailedOperationAdded(operation);
      } catch (error) {
        console.error('RetryManagementService: Error notifying listener:', error);
      }
    });
  }

  private notifyFailedOperationRetried(operation: FailedOperation, result: RetryResult) {
    this.listeners.forEach(listener => {
      try {
        listener.onFailedOperationRetried(operation, result);
      } catch (error) {
        console.error('RetryManagementService: Error notifying listener:', error);
      }
    });
  }

  private notifyFailedOperationResolved(operationId: string) {
    this.listeners.forEach(listener => {
      try {
        listener.onFailedOperationResolved(operationId);
      } catch (error) {
        console.error('RetryManagementService: Error notifying listener:', error);
      }
    });
  }

  private notifyStatsChanged() {
    const stats = this.getRetryStats();
    this.listeners.forEach(listener => {
      try {
        listener.onRetryStatsChanged(stats);
      } catch (error) {
        console.error('RetryManagementService: Error notifying listener:', error);
      }
    });
  }

  // ==================== CLEANUP ====================

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.failedOperations.clear();
    this.retryAttempts.clear();
    this.listeners = [];

    console.log('RetryManagementService: Destroyed');
  }
}

// ==================== SINGLETON INSTANCE ====================

export const retryManagementService = RetryManagementService.getInstance();
export default retryManagementService; 