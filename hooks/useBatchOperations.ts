/**
 * Batch Operations Hook
 * Provides React integration for batch operations service
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  batchOperationsService, 
  BatchOperation, 
  BatchRequest,
  BatchProgress 
} from '@/services/batchOperationsService';

export interface UseBatchOperationsReturn {
  // Status tracking
  pendingOperations: BatchOperation[];
  activeRequests: BatchRequest[];
  isProcessing: boolean;
  
  // Statistics
  pendingCount: {
    critical: number;
    normal: number;
    low: number;
    total: number;
  };
  
  // Current progress
  currentProgress?: BatchProgress;
  
  // Operations
  queueOperation: (
    type: 'create' | 'update' | 'delete',
    entity: 'job' | 'client' | 'route' | 'inventory',
    data: any,
    originalData?: any,
    priority?: 'critical' | 'normal' | 'low'
  ) => string;
  
  forceProcess: () => Promise<void>;
  clearPending: () => void;
  
  // Utilities
  getStatistics: () => any;
}

/**
 * Hook for batch operations management
 * 
 * @example
 * ```tsx
 * const {
 *   queueOperation,
 *   pendingCount,
 *   isProcessing,
 *   currentProgress,
 *   forceProcess
 * } = useBatchOperations();
 * 
 * const handleCreateJob = () => {
 *   queueOperation('create', 'job', jobData, null, 'critical');
 * };
 * 
 * return (
 *   <View>
 *     <Text>Pending: {pendingCount.total}</Text>
 *     {isProcessing && <Text>Processing...</Text>}
 *     {currentProgress && (
 *       <Text>Progress: {currentProgress.progress}%</Text>
 *     )}
 *     <Button onPress={forceProcess}>Sync Now</Button>
 *   </View>
 * );
 * ```
 */
export const useBatchOperations = (): UseBatchOperationsReturn => {
  const [pendingOperations, setPendingOperations] = useState<BatchOperation[]>([]);
  const [activeRequests, setActiveRequests] = useState<BatchRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<BatchProgress | undefined>();

  // Subscribe to batch progress updates
  useEffect(() => {
    const unsubscribe = batchOperationsService.addProgressListener((progress) => {
      setCurrentProgress(progress);
    });

    return unsubscribe;
  }, []);

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      setPendingOperations(batchOperationsService.getPendingOperations());
      setActiveRequests(batchOperationsService.getActiveRequests());
      setIsProcessing(batchOperationsService.isCurrentlyProcessing());
    };

    // Initial update
    updateStatus();

    // Update every 2 seconds
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  // Queue operation callback
  const queueOperation = useCallback((
    type: 'create' | 'update' | 'delete',
    entity: 'job' | 'client' | 'route' | 'inventory',
    data: any,
    originalData?: any,
    priority: 'critical' | 'normal' | 'low' = 'normal'
  ): string => {
    return batchOperationsService.queueOperation(type, entity, data, originalData, priority);
  }, []);

  // Force process callback
  const forceProcess = useCallback(async (): Promise<void> => {
    try {
      await batchOperationsService.forceProcessOperations();
    } catch (error) {
      console.error('Force process failed:', error);
      throw error;
    }
  }, []);

  // Clear pending operations callback
  const clearPending = useCallback((): void => {
    batchOperationsService.clearPendingOperations();
  }, []);

  // Get statistics callback
  const getStatistics = useCallback(() => {
    return batchOperationsService.getStatistics();
  }, []);

  // Calculate pending count
  const pendingCount = batchOperationsService.getPendingOperationsCount();

  return {
    // Status tracking
    pendingOperations,
    activeRequests,
    isProcessing,
    
    // Statistics
    pendingCount,
    
    // Current progress
    currentProgress,
    
    // Operations
    queueOperation,
    forceProcess,
    clearPending,
    
    // Utilities
    getStatistics,
  };
};

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook that only tracks batch progress
 * Useful for progress indicators
 */
export const useBatchProgress = () => {
  const { currentProgress, isProcessing, pendingCount } = useBatchOperations();
  
  return {
    progress: currentProgress,
    isProcessing,
    totalPending: pendingCount.total,
    hasCriticalOperations: pendingCount.critical > 0,
  };
};

/**
 * Hook for queuing specific entity operations
 * Provides type-safe operation queueing
 */
export const useBatchQueue = () => {
  const { queueOperation } = useBatchOperations();
  
  const queueJobOperation = useCallback((
    type: 'create' | 'update' | 'delete',
    data: any,
    originalData?: any,
    priority: 'critical' | 'normal' | 'low' = 'critical'
  ) => {
    return queueOperation(type, 'job', data, originalData, priority);
  }, [queueOperation]);

  const queueInventoryOperation = useCallback((
    type: 'create' | 'update' | 'delete',
    data: any,
    originalData?: any,
    priority: 'critical' | 'normal' | 'low' = 'critical'
  ) => {
    return queueOperation(type, 'inventory', data, originalData, priority);
  }, [queueOperation]);

  const queueClientOperation = useCallback((
    type: 'create' | 'update' | 'delete',
    data: any,
    originalData?: any,
    priority: 'critical' | 'normal' | 'low' = 'normal'
  ) => {
    return queueOperation(type, 'client', data, originalData, priority);
  }, [queueOperation]);

  const queueRouteOperation = useCallback((
    type: 'create' | 'update' | 'delete',
    data: any,
    originalData?: any,
    priority: 'critical' | 'normal' | 'low' = 'normal'
  ) => {
    return queueOperation(type, 'route', data, originalData, priority);
  }, [queueOperation]);

  return {
    queueJobOperation,
    queueInventoryOperation,
    queueClientOperation,
    queueRouteOperation,
  };
};

export default useBatchOperations; 