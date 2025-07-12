/**
 * Enhanced Optimistic Updates Hook
 * Provides React integration for optimistic updates with rollback and status tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  enhancedOptimisticUpdates, 
  OptimisticOperation 
} from '@/services/queryClient';

export interface UseOptimisticUpdatesReturn {
  // Status tracking
  operations: OptimisticOperation[];
  pendingCount: number;
  hasErrors: boolean;
  isOperating: boolean;
  
  // Operation methods
  createJob: (jobData: any) => Promise<string>;
  updateJob: (jobId: string, updates: any) => Promise<string>;
  updateClient: (clientId: string, updates: any) => Promise<string>;
  updateRoute: (routeId: string, updates: any) => Promise<string>;
  updateInventory: (itemId: string, updates: any) => Promise<string>;
  
  // Status utilities
  getOperationStatus: (operationId: string) => OptimisticOperation | undefined;
  getErrorMessage: (operationId: string) => string | undefined;
}

/**
 * Hook for enhanced optimistic updates with status tracking
 * 
 * @example
 * ```tsx
 * const {
 *   createJob,
 *   updateJob,
 *   pendingCount,
 *   hasErrors,
 *   operations
 * } = useOptimisticUpdates();
 * 
 * const handleCreateJob = async () => {
 *   try {
 *     const operationId = await createJob(jobData);
 *     // Job appears immediately in UI
 *     // operationId can be used to track this specific operation
 *   } catch (error) {
 *     // Automatic rollback happened
 *   }
 * };
 * ```
 */
export const useOptimisticUpdates = (): UseOptimisticUpdatesReturn => {
  const [operations, setOperations] = useState<OptimisticOperation[]>([]);

  // Subscribe to optimistic operations changes
  useEffect(() => {
    const unsubscribe = enhancedOptimisticUpdates.subscribe((newOperations) => {
      setOperations(newOperations);
    });

    // Initialize with current operations
    setOperations(enhancedOptimisticUpdates.getOperations());

    return unsubscribe;
  }, []);

  // Derived state
  const pendingCount = operations.filter(op => op.status === 'pending').length;
  const hasErrors = operations.some(op => op.status === 'error');
  const isOperating = pendingCount > 0;

  // Operation methods with promise-based interface
  const createJob = useCallback(async (jobData: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const operationId = enhancedOptimisticUpdates.createJob(jobData);
      
      // Set up listener for this specific operation
      const checkOperation = () => {
        const operation = enhancedOptimisticUpdates.getOperations()
          .find(op => op.id === operationId);
        
        if (operation?.status === 'success') {
          resolve(operationId);
        } else if (operation?.status === 'error') {
          reject(operation.error);
        } else {
          // Still pending, check again later
          setTimeout(checkOperation, 100);
        }
      };
      
      // Start checking operation status
      setTimeout(checkOperation, 100);
    });
  }, []);

  const updateJob = useCallback(async (jobId: string, updates: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const operationId = enhancedOptimisticUpdates.updateJob(jobId, updates);
      
      if (!operationId) {
        reject(new Error('Failed to create optimistic operation'));
        return;
      }
      
      // Set up listener for this specific operation
      const checkOperation = () => {
        const operation = enhancedOptimisticUpdates.getOperations()
          .find(op => op.id === operationId);
        
        if (operation?.status === 'success') {
          resolve(operationId);
        } else if (operation?.status === 'error') {
          reject(operation.error);
        } else {
          // Still pending, check again later
          setTimeout(checkOperation, 100);
        }
      };
      
      // Start checking operation status
      setTimeout(checkOperation, 100);
    });
  }, []);

  const updateClient = useCallback(async (clientId: string, updates: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const operationId = enhancedOptimisticUpdates.updateClient(clientId, updates);
      
      if (!operationId) {
        reject(new Error('Failed to create optimistic operation'));
        return;
      }
      
      // Set up listener for this specific operation
      const checkOperation = () => {
        const operation = enhancedOptimisticUpdates.getOperations()
          .find(op => op.id === operationId);
        
        if (operation?.status === 'success') {
          resolve(operationId);
        } else if (operation?.status === 'error') {
          reject(operation.error);
        } else {
          // Still pending, check again later
          setTimeout(checkOperation, 100);
        }
      };
      
      // Start checking operation status
      setTimeout(checkOperation, 100);
    });
  }, []);

  const updateRoute = useCallback(async (routeId: string, updates: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const operationId = enhancedOptimisticUpdates.updateRoute(routeId, updates);
      
      if (!operationId) {
        reject(new Error('Failed to create optimistic operation'));
        return;
      }
      
      // Set up listener for this specific operation
      const checkOperation = () => {
        const operation = enhancedOptimisticUpdates.getOperations()
          .find(op => op.id === operationId);
        
        if (operation?.status === 'success') {
          resolve(operationId);
        } else if (operation?.status === 'error') {
          reject(operation.error);
        } else {
          // Still pending, check again later
          setTimeout(checkOperation, 100);
        }
      };
      
      // Start checking operation status
      setTimeout(checkOperation, 100);
    });
  }, []);

  const updateInventory = useCallback(async (itemId: string, updates: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const operationId = enhancedOptimisticUpdates.updateInventory(itemId, updates);
      
      if (!operationId) {
        reject(new Error('Failed to create optimistic operation'));
        return;
      }
      
      // Set up listener for this specific operation
      const checkOperation = () => {
        const operation = enhancedOptimisticUpdates.getOperations()
          .find(op => op.id === operationId);
        
        if (operation?.status === 'success') {
          resolve(operationId);
        } else if (operation?.status === 'error') {
          reject(operation.error);
        } else {
          // Still pending, check again later
          setTimeout(checkOperation, 100);
        }
      };
      
      // Start checking operation status
      setTimeout(checkOperation, 100);
    });
  }, []);

  // Utility methods
  const getOperationStatus = useCallback((operationId: string): OptimisticOperation | undefined => {
    return operations.find(op => op.id === operationId);
  }, [operations]);

  const getErrorMessage = useCallback((operationId: string): string | undefined => {
    const operation = operations.find(op => op.id === operationId);
    return operation?.error?.message || operation?.error;
  }, [operations]);

  return {
    // Status tracking
    operations,
    pendingCount,
    hasErrors,
    isOperating,
    
    // Operation methods
    createJob,
    updateJob,
    updateClient,
    updateRoute,
    updateInventory,
    
    // Status utilities
    getOperationStatus,
    getErrorMessage,
  };
};

export default useOptimisticUpdates; 