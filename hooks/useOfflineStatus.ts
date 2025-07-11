/**
 * Offline Status Hook
 * Provides React components with real-time offline status updates
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  offlineStatusService, 
  OfflineStatus, 
  ConnectionStatus 
} from '@/services/offlineStatusService';

// ==================== HOOK RETURN TYPE ====================

export interface UseOfflineStatusReturn {
  // Current status
  status: OfflineStatus;
  connection: ConnectionStatus;
  
  // Connection state
  isOnline: boolean;
  isConnected: boolean;
  connectionQuality: ConnectionStatus['connectionQuality'];
  
  // Queued operations
  queuedOperationsCount: number;
  hasCriticalOperations: boolean;
  hasFailedOperations: boolean;
  
  // Sync state
  syncInProgress: boolean;
  lastSync: Date | null;
  estimatedSyncTime?: number;
  
  // Actions
  forceSync: () => Promise<void>;
  enableManualOfflineMode: () => void;
  disableManualOfflineMode: () => void;
  
  // Manual mode state
  isManualOfflineMode: boolean;
  
  // Utilities
  getStatusColor: () => string;
  getStatusIcon: () => string;
  getStatusText: () => string;
}

// ==================== MAIN HOOK ====================

/**
 * Hook to monitor offline status and provide real-time updates
 * 
 * @example
 * ```tsx
 * const { isOnline, queuedOperationsCount, forceSync } = useOfflineStatus();
 * 
 * return (
 *   <View>
 *     <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
 *     {queuedOperationsCount > 0 && (
 *       <Text>Queued: {queuedOperationsCount}</Text>
 *     )}
 *     <Button onPress={forceSync}>Sync Now</Button>
 *   </View>
 * );
 * ```
 */
export const useOfflineStatus = (): UseOfflineStatusReturn => {
  const [status, setStatus] = useState<OfflineStatus>(() => 
    offlineStatusService.getStatus()
  );

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = offlineStatusService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  // Force sync callback
  const forceSync = useCallback(async () => {
    try {
      await offlineStatusService.forcSync();
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }, []);

  // Manual offline mode callbacks
  const enableManualOfflineMode = useCallback(() => {
    offlineStatusService.enableManualOfflineMode();
  }, []);

  const disableManualOfflineMode = useCallback(() => {
    offlineStatusService.disableManualOfflineMode();
  }, []);

  const isManualOfflineMode = offlineStatusService.isManualOfflineMode();

  // Status utilities
  const getStatusColor = useCallback((): string => {
    if (!status.connection.isOnline) return '#FF6B6B'; // Red
    if (status.queuedOperations.count > 0) return '#FFA500'; // Orange
    if (status.syncInProgress) return '#4ECDC4'; // Teal
    return '#4CAF50'; // Green
  }, [status]);

  const getStatusIcon = useCallback((): string => {
    if (!status.connection.isOnline) return 'wifi';
    if (status.syncInProgress) return 'refresh';
    if (status.queuedOperations.count > 0) return 'clock-o';
    return 'wifi';
  }, [status]);

  const getStatusText = useCallback((): string => {
    if (!status.connection.isOnline) return 'Offline';
    if (status.syncInProgress) return 'Syncing...';
    if (status.queuedOperations.count > 0) {
      return `${status.queuedOperations.count} pending`;
    }
    return 'Online';
  }, [status]);

  return {
    // Current status
    status,
    connection: status.connection,
    
    // Connection state
    isOnline: status.connection.isOnline,
    isConnected: status.connection.isConnected,
    connectionQuality: status.connection.connectionQuality,
    
    // Queued operations
    queuedOperationsCount: status.queuedOperations.count,
    hasCriticalOperations: status.queuedOperations.priority.critical > 0,
    hasFailedOperations: status.queuedOperations.count > 0 && !status.syncInProgress,
    
    // Sync state
    syncInProgress: status.syncInProgress,
    lastSync: status.lastSync,
    estimatedSyncTime: status.estimatedSyncTime,
    
    // Actions
    forceSync,
    enableManualOfflineMode,
    disableManualOfflineMode,
    
    // Manual mode state
    isManualOfflineMode,
    
    // Utilities
    getStatusColor,
    getStatusIcon,
    getStatusText,
  };
};

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook that only tracks connection status
 * Lighter version for components that only need basic connectivity info
 */
export const useConnectionStatus = () => {
  const { isOnline, isConnected, connectionQuality, connection } = useOfflineStatus();
  
  return {
    isOnline,
    isConnected,
    connectionQuality,
    connectionType: connection.connectionType,
    isExpensive: connection.isExpensive,
  };
};

/**
 * Hook that only tracks queued operations
 * Useful for components that show sync status
 */
export const useQueuedOperations = () => {
  const { 
    queuedOperationsCount, 
    hasCriticalOperations, 
    hasFailedOperations,
    syncInProgress,
    forceSync,
    status 
  } = useOfflineStatus();
  
  return {
    count: queuedOperationsCount,
    critical: status.queuedOperations.priority.critical,
    normal: status.queuedOperations.priority.normal,
    low: status.queuedOperations.priority.low,
    hasCriticalOperations,
    hasFailedOperations,
    syncInProgress,
    forceSync,
  };
};

/**
 * Hook that provides sync status and actions
 * Useful for sync controls and status displays
 */
export const useSyncStatus = () => {
  const { 
    syncInProgress, 
    lastSync, 
    estimatedSyncTime,
    queuedOperationsCount,
    forceSync,
    status 
  } = useOfflineStatus();
  
  return {
    syncInProgress,
    lastSync,
    estimatedSyncTime,
    queuedOperationsCount,
    retryAttempts: status.retryAttempts,
    forceSync,
    canSync: status.connection.isOnline && !syncInProgress,
  };
};

export default useOfflineStatus; 