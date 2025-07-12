/**
 * Offline Operation Status Hook
 * Determines the sync status of individual items (jobs, inventory items, etc.)
 */

import { useMemo } from 'react';
import { useBatchOperations } from './useBatchOperations';
import { useRetryManagement } from './useRetryManagement';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import { useOfflineStatus } from './useOfflineStatus';

type OperationStatus = 'pending' | 'syncing' | 'failed' | 'synced' | 'offline';

interface OfflineOperationStatus {
  status: OperationStatus;
  operationId?: string;
  canRetry: boolean;
  lastError?: string;
}

/**
 * Hook to determine the offline operation status of a specific item
 * @param itemId - The ID of the item (job, inventory item, etc.)
 * @param entityType - The type of entity ('job' | 'inventory' | 'client' | 'route')
 * @returns The current offline operation status
 */
export const useOfflineOperationStatus = (
  itemId: string,
  entityType: 'job' | 'inventory' | 'client' | 'route'
): OfflineOperationStatus => {
  const { pendingOperations, activeRequests, isProcessing } = useBatchOperations();
  const { failedOperations } = useRetryManagement();
  const { operations: optimisticOperations } = useOptimisticUpdates();
  const { isOnline } = useOfflineStatus();

  return useMemo(() => {
    // Check if item has failed operations
    const failedOperation = failedOperations.find(
      op => op.entity === entityType && (
        op.data?.id === itemId || 
        op.metadata?.originalBatchId?.includes(itemId) ||
        op.id.includes(itemId)
      )
    );

    if (failedOperation) {
      return {
        status: 'failed',
        operationId: failedOperation.id,
        canRetry: failedOperation.isRetryable,
        lastError: failedOperation.error?.message || 'Unknown error',
      };
    }

    // Check if item is in active batch operations (syncing)
    const activeOperation = activeRequests.find(request =>
      request.operations.some(op => 
        op.entity === entityType && (
          op.data?.id === itemId ||
          op.originalData?.id === itemId ||
          op.id.includes(itemId)
        )
      )
    );

    if (activeOperation) {
      return {
        status: 'syncing',
        operationId: activeOperation.id,
        canRetry: false,
      };
    }

    // Check if item is in pending batch operations
    const pendingOperation = pendingOperations.find(op => 
      op.entity === entityType && (
        op.data?.id === itemId ||
        op.originalData?.id === itemId ||
        op.id.includes(itemId)
      )
    );

    if (pendingOperation) {
      return {
        status: 'pending',
        operationId: pendingOperation.id,
        canRetry: false,
      };
    }

    // Check if item is in optimistic operations
    const optimisticOperation = optimisticOperations.find(op => 
      op.id.includes(itemId) || op.entity?.id === itemId
    );

    if (optimisticOperation) {
      if (optimisticOperation.status === 'pending') {
        return {
          status: 'pending',
          operationId: optimisticOperation.id,
          canRetry: false,
        };
      }
      if (optimisticOperation.status === 'error') {
        return {
          status: 'failed',
          operationId: optimisticOperation.id,
          canRetry: true,
          lastError: optimisticOperation.error || 'Optimistic update failed',
        };
      }
    }

    // Check if the item was created while offline
    // This is a heuristic - if we're offline or recently became online,
    // and the item ID looks like a temporary ID (contains timestamp or random chars)
    const isTemporaryId = itemId.includes('_') || itemId.length > 20;
    if (!isOnline && isTemporaryId) {
      return {
        status: 'offline',
        operationId: undefined,
        canRetry: false,
      };
    }

    // Default to synced if no offline operations found
    return {
      status: 'synced',
      operationId: undefined,
      canRetry: false,
    };
  }, [
    itemId,
    entityType,
    pendingOperations,
    activeRequests,
    failedOperations,
    optimisticOperations,
    isOnline,
  ]);
};

/**
 * Hook to get operation status for multiple items at once
 * @param items - Array of items with id and entityType
 * @returns Map of item ID to operation status
 */
export const useMultipleOfflineOperationStatus = (
  items: Array<{ id: string; entityType: 'job' | 'inventory' | 'client' | 'route' }>
): Map<string, OfflineOperationStatus> => {
  const { pendingOperations, activeRequests } = useBatchOperations();
  const { failedOperations } = useRetryManagement();
  const { operations: optimisticOperations } = useOptimisticUpdates();
  const { isOnline } = useOfflineStatus();

  return useMemo(() => {
    const statusMap = new Map<string, OfflineOperationStatus>();

    items.forEach(item => {
      // Check failed operations
      const failedOperation = failedOperations.find(
        op => op.entity === item.entityType && (
          op.data?.id === item.id || 
          op.metadata?.originalBatchId?.includes(item.id) ||
          op.id.includes(item.id)
        )
      );

      if (failedOperation) {
        statusMap.set(item.id, {
          status: 'failed',
          operationId: failedOperation.id,
          canRetry: failedOperation.isRetryable,
          lastError: failedOperation.error?.message || 'Unknown error',
        });
        return;
      }

      // Check active operations
      const activeOperation = activeRequests.find(request =>
        request.operations.some(op => 
          op.entity === item.entityType && (
            op.data?.id === item.id ||
            op.originalData?.id === item.id ||
            op.id.includes(item.id)
          )
        )
      );

      if (activeOperation) {
        statusMap.set(item.id, {
          status: 'syncing',
          operationId: activeOperation.id,
          canRetry: false,
        });
        return;
      }

      // Check pending operations
      const pendingOperation = pendingOperations.find(op => 
        op.entity === item.entityType && (
          op.data?.id === item.id ||
          op.originalData?.id === item.id ||
          op.id.includes(item.id)
        )
      );

      if (pendingOperation) {
        statusMap.set(item.id, {
          status: 'pending',
          operationId: pendingOperation.id,
          canRetry: false,
        });
        return;
      }

      // Check optimistic operations
      const optimisticOperation = optimisticOperations.find(op => 
        op.id.includes(item.id) || op.entity?.id === item.id
      );

      if (optimisticOperation) {
        if (optimisticOperation.status === 'pending') {
          statusMap.set(item.id, {
            status: 'pending',
            operationId: optimisticOperation.id,
            canRetry: false,
          });
          return;
        }
        if (optimisticOperation.status === 'error') {
          statusMap.set(item.id, {
            status: 'failed',
            operationId: optimisticOperation.id,
            canRetry: true,
            lastError: optimisticOperation.error || 'Optimistic update failed',
          });
          return;
        }
      }

      // Check if created offline
      const isTemporaryId = item.id.includes('_') || item.id.length > 20;
      if (!isOnline && isTemporaryId) {
        statusMap.set(item.id, {
          status: 'offline',
          operationId: undefined,
          canRetry: false,
        });
        return;
      }

      // Default to synced
      statusMap.set(item.id, {
        status: 'synced',
        operationId: undefined,
        canRetry: false,
      });
    });

    return statusMap;
  }, [items, pendingOperations, activeRequests, failedOperations, optimisticOperations, isOnline]);
}; 