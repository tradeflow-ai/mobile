/**
 * Retry Management Hook
 * Provides React integration for retry management service
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  retryManagementService, 
  FailedOperation, 
  RetryResult,
  RetryStats 
} from '@/services/retryManagementService';

export interface UseRetryManagementReturn {
  // Failed operations
  failedOperations: FailedOperation[];
  retryableOperations: FailedOperation[];
  
  // Stats
  retryStats: RetryStats;
  
  // Actions
  retryOperation: (operationId: string) => Promise<RetryResult>;
  retryAllOperations: () => Promise<RetryResult[]>;
  clearAllFailed: () => void;
  clearResolved: () => void;
  
  // Filtering
  getOperationsByType: (type: FailedOperation['type']) => FailedOperation[];
  getOperationsByEntity: (entity: string) => FailedOperation[];
  
  // Status
  isRetrying: boolean;
  lastRetryResult?: RetryResult;
}

/**
 * Hook for retry management functionality
 * 
 * @example
 * ```tsx
 * const {
 *   failedOperations,
 *   retryableOperations,
 *   retryStats,
 *   retryOperation,
 *   retryAllOperations,
 *   clearAllFailed,
 *   isRetrying
 * } = useRetryManagement();
 * 
 * const handleRetry = async (operationId: string) => {
 *   try {
 *     const result = await retryOperation(operationId);
 *     if (result.success) {
 *       console.log('Retry successful');
 *     }
 *   } catch (error) {
 *     console.error('Retry failed:', error);
 *   }
 * };
 * 
 * return (
 *   <View>
 *     <Text>Failed Operations: {retryStats.totalFailed}</Text>
 *     <Text>Retryable: {retryStats.totalRetryable}</Text>
 *     {failedOperations.map(op => (
 *       <Button key={op.id} onPress={() => handleRetry(op.id)}>
 *         Retry {op.entity} {op.operation}
 *       </Button>
 *     ))}
 *   </View>
 * );
 * ```
 */
export const useRetryManagement = (): UseRetryManagementReturn => {
  const [failedOperations, setFailedOperations] = useState<FailedOperation[]>([]);
  const [retryStats, setRetryStats] = useState<RetryStats>({
    totalFailed: 0,
    totalRetryable: 0,
    byType: { query: 0, mutation: 0, batch_operation: 0, daily_plan: 0 },
    byEntity: { job: 0, inventory: 0, client: 0, route: 0, daily_plan: 0 },
    byPriority: { critical: 0, normal: 0, low: 0 },
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastRetryResult, setLastRetryResult] = useState<RetryResult>();

  // Subscribe to retry management events
  useEffect(() => {
    const unsubscribe = retryManagementService.subscribe({
      onFailedOperationAdded: (operation) => {
        setFailedOperations(prev => [...prev, operation]);
      },
      onFailedOperationRetried: (operation, result) => {
        setLastRetryResult(result);
        if (result.success) {
          setFailedOperations(prev => prev.filter(op => op.id !== operation.id));
        }
      },
      onFailedOperationResolved: (operationId) => {
        setFailedOperations(prev => prev.filter(op => op.id !== operationId));
      },
      onRetryStatsChanged: (stats) => {
        setRetryStats(stats);
      },
    });

    return unsubscribe;
  }, []);

  // Update state periodically
  useEffect(() => {
    const updateState = () => {
      setFailedOperations(retryManagementService.getFailedOperations());
      setRetryStats(retryManagementService.getRetryStats());
    };

    // Initial update
    updateState();

    // Update every 5 seconds
    const interval = setInterval(updateState, 5000);

    return () => clearInterval(interval);
  }, []);

  // Retry operation callback
  const retryOperation = useCallback(async (operationId: string): Promise<RetryResult> => {
    setIsRetrying(true);
    try {
      const result = await retryManagementService.retryFailedOperation(operationId);
      setLastRetryResult(result);
      return result;
    } catch (error) {
      const result: RetryResult = {
        success: false,
        operationId,
        error,
      };
      setLastRetryResult(result);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  // Retry all operations callback
  const retryAllOperations = useCallback(async (): Promise<RetryResult[]> => {
    setIsRetrying(true);
    try {
      const results = await retryManagementService.retryAllOperations();
      if (results.length > 0) {
        setLastRetryResult(results[results.length - 1]);
      }
      return results;
    } catch (error) {
      console.error('Retry all operations failed:', error);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  // Clear all failed operations callback
  const clearAllFailed = useCallback((): void => {
    retryManagementService.clearAllFailedOperations();
  }, []);

  // Clear resolved operations callback
  const clearResolved = useCallback((): void => {
    retryManagementService.clearResolvedOperations();
  }, []);

  // Get operations by type callback
  const getOperationsByType = useCallback((type: FailedOperation['type']): FailedOperation[] => {
    return retryManagementService.getFailedOperationsByType(type);
  }, []);

  // Get operations by entity callback
  const getOperationsByEntity = useCallback((entity: string): FailedOperation[] => {
    return retryManagementService.getFailedOperationsByEntity(entity);
  }, []);

  // Calculate retryable operations
  const retryableOperations = failedOperations.filter(op => op.isRetryable);

  return {
    // Failed operations
    failedOperations,
    retryableOperations,
    
    // Stats
    retryStats,
    
    // Actions
    retryOperation,
    retryAllOperations,
    clearAllFailed,
    clearResolved,
    
    // Filtering
    getOperationsByType,
    getOperationsByEntity,
    
    // Status
    isRetrying,
    lastRetryResult,
  };
};

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook that only tracks retry stats
 * Useful for status indicators
 */
export const useRetryStats = () => {
  const { retryStats, isRetrying } = useRetryManagement();
  
  return {
    stats: retryStats,
    isRetrying,
    hasFailedOperations: retryStats.totalFailed > 0,
    hasRetryableOperations: retryStats.totalRetryable > 0,
    hasCriticalFailures: retryStats.byPriority.critical > 0,
  };
};

/**
 * Hook for specific entity retry management
 * Provides entity-specific retry operations
 */
export const useEntityRetryManagement = (entity: string) => {
  const { 
    failedOperations, 
    retryOperation, 
    retryStats, 
    isRetrying,
    getOperationsByEntity 
  } = useRetryManagement();
  
  const entityOperations = getOperationsByEntity(entity);
  const retryableEntityOperations = entityOperations.filter(op => op.isRetryable);
  
  const retryEntityOperation = useCallback(async (operationId: string) => {
    const operation = entityOperations.find(op => op.id === operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found for entity ${entity}`);
    }
    return retryOperation(operationId);
  }, [entityOperations, retryOperation]);

  const retryAllEntityOperations = useCallback(async () => {
    const results: RetryResult[] = [];
    for (const operation of retryableEntityOperations) {
      try {
        const result = await retryOperation(operation.id);
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
  }, [retryableEntityOperations, retryOperation]);

  return {
    entityOperations,
    retryableEntityOperations,
    retryEntityOperation,
    retryAllEntityOperations,
    entityFailedCount: entityOperations.length,
    entityRetryableCount: retryableEntityOperations.length,
    isRetrying,
  };
};

/**
 * Hook for critical operation retry management
 * Focuses on high-priority failed operations
 */
export const useCriticalRetryManagement = () => {
  const { 
    failedOperations, 
    retryOperation, 
    retryStats, 
    isRetrying 
  } = useRetryManagement();
  
  const criticalOperations = failedOperations.filter(op => 
    op.metadata?.priority === 'critical'
  );
  
  const retryCriticalOperations = useCallback(async () => {
    const results: RetryResult[] = [];
    for (const operation of criticalOperations) {
      if (operation.isRetryable) {
        try {
          const result = await retryOperation(operation.id);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            operationId: operation.id,
            error,
          });
        }
      }
    }
    return results;
  }, [criticalOperations, retryOperation]);

  return {
    criticalOperations,
    retryCriticalOperations,
    criticalCount: criticalOperations.length,
    hasCriticalFailures: criticalOperations.length > 0,
    isRetrying,
  };
};

export default useRetryManagement; 