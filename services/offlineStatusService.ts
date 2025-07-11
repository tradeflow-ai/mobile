/**
 * Offline Status Management Service
 * Integrates with TanStack Query to provide comprehensive offline status monitoring
 */

import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { queryClient } from './queryClient';
import { QueryClient } from '@tanstack/react-query';

// ==================== TYPES ====================

export interface ConnectionStatus {
  isConnected: boolean;
  isOnline: boolean;
  connectionType: string;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  isExpensive: boolean;
  details: {
    speed?: number; // Mbps estimate
    latency?: number; // ms
  };
}

export interface OfflineStatus {
  connection: ConnectionStatus;
  queuedOperations: {
    count: number;
    mutations: number;
    queries: number;
    priority: {
      critical: number;
      normal: number;
      low: number;
    };
  };
  lastSync: Date | null;
  syncInProgress: boolean;
  retryAttempts: number;
  estimatedSyncTime?: number; // seconds
  manualOfflineMode: boolean;
}

export interface OfflineStatusListener {
  (status: OfflineStatus): void;
}

// ==================== OFFLINE STATUS SERVICE ====================

export class OfflineStatusService {
  private static instance: OfflineStatusService;
  private listeners: OfflineStatusListener[] = [];
  private currentStatus: OfflineStatus;
  private netInfoUnsubscribe: (() => void) | null = null;
  private speedTestHistory: number[] = [];
  private lastSpeedTest: Date | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private manualOfflineMode: boolean = false;

  private constructor() {
    this.currentStatus = {
      connection: {
        isConnected: false,
        isOnline: false,
        connectionType: 'unknown',
        connectionQuality: 'offline',
        isExpensive: false,
        details: {},
      },
      queuedOperations: {
        count: 0,
        mutations: 0,
        queries: 0,
        priority: {
          critical: 0,
          normal: 0,
          low: 0,
        },
      },
      lastSync: null,
      syncInProgress: false,
      retryAttempts: 0,
      manualOfflineMode: false,
    };

    this.initialize();
  }

  static getInstance(): OfflineStatusService {
    if (!OfflineStatusService.instance) {
      OfflineStatusService.instance = new OfflineStatusService();
    }
    return OfflineStatusService.instance;
  }

  // ==================== INITIALIZATION ====================

  private async initialize() {
    console.log('OfflineStatusService: Initializing...');
    
    // Set up NetInfo listener
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      this.handleNetworkStateChange(state);
    });

    // Get initial network state
    const initialState = await NetInfo.fetch();
    this.handleNetworkStateChange(initialState);

    // Set up TanStack Query integration
    this.setupTanStackQueryIntegration();

    // Start periodic status updates
    this.startStatusUpdates();

    console.log('OfflineStatusService: Initialized successfully');
  }

  private handleNetworkStateChange(state: NetInfoState) {
    const wasOnline = this.currentStatus.connection.isOnline;
    const wasConnected = this.currentStatus.connection.isConnected;
    const wasQuality = this.currentStatus.connection.connectionQuality;
    
    // Update connection status - simple approach
    this.currentStatus.connection = {
      isConnected: state.isConnected || false,
      isOnline: (state.isInternetReachable === true && state.isConnected === true),
      connectionType: state.type,
      connectionQuality: this.calculateConnectionQuality(state),
      isExpensive: false, // We'll check this property if available
      details: {
        speed: this.getEstimatedSpeed(state),
      },
    };

    // Only log if there's a meaningful change
    const hasSignificantChange = (
      wasOnline !== this.currentStatus.connection.isOnline ||
      wasConnected !== this.currentStatus.connection.isConnected ||
      wasQuality !== this.currentStatus.connection.connectionQuality
    );

    if (hasSignificantChange) {
      console.log('OfflineStatusService: Network state changed', {
        type: state.type,
        connected: state.isConnected,
        online: state.isInternetReachable,
        actualOnline: this.currentStatus.connection.isOnline,
        quality: this.currentStatus.connection.connectionQuality,
      });
    }

    // If we just came back online, trigger sync
    if (!wasOnline && this.currentStatus.connection.isOnline) {
      this.handleReconnection();
    }

    // Update queued operations count
    this.updateQueuedOperations();

    // Notify listeners
    this.notifyListeners();
  }

  private calculateConnectionQuality(state: NetInfoState): ConnectionStatus['connectionQuality'] {
    // If not connected or explicitly offline, return offline
    if (!state.isConnected || state.isInternetReachable === false) {
      return 'offline';
    }

    // Use connection type and details to determine quality
    switch (state.type) {
      case 'wifi':
        // WiFi is generally good quality
        return 'good';

      case 'cellular':
        // Check cellular generation for quality estimation
        const cellularGeneration = state.details?.cellularGeneration;
        
        if (cellularGeneration === '5g') return 'excellent';
        if (cellularGeneration === '4g') return 'good';
        if (cellularGeneration === '3g') return 'fair';
        return 'poor';

      case 'ethernet':
        return 'excellent';

      default:
        return 'fair';
    }
  }

  private getEstimatedSpeed(state: NetInfoState): number | undefined {
    // Simple speed estimation based on connection type
    switch (state.type) {
      case 'wifi':
        return 25; // Mbps estimate
      case 'cellular':
        const generation = state.details?.cellularGeneration;
        if (generation === '5g') return 50;
        if (generation === '4g') return 15;
        if (generation === '3g') return 3;
        return 1;
      case 'ethernet':
        return 100;
      default:
        return undefined;
    }
  }

  // ==================== TANSTACK QUERY INTEGRATION ====================

  private setupTanStackQueryIntegration() {
    // Hook into TanStack Query's mutation cache to track queued operations
    const mutationCache = queryClient.getMutationCache();
    
    // Listen for mutation updates
    const unsubscribe = mutationCache.subscribe((event) => {
      if (event.type === 'added' || event.type === 'removed' || event.type === 'updated') {
        this.updateQueuedOperations();
      }
    });

    // Store unsubscribe function for cleanup
    this.netInfoUnsubscribe = unsubscribe;
  }

  private updateQueuedOperations() {
    const mutationCache = queryClient.getMutationCache();
    const queryCache = queryClient.getQueryCache();

    // Count mutations by status
    const mutations = mutationCache.getAll();
    const pendingMutations = mutations.filter(m => m.state.status === 'pending');
    const errorMutations = mutations.filter(m => m.state.status === 'error');

    // Count queries that are retrying
    const queries = queryCache.getAll();
    const retryingQueries = queries.filter(q => q.state.fetchStatus === 'fetching' && q.state.error);

    // Update queued operations count
    this.currentStatus.queuedOperations = {
      count: pendingMutations.length + errorMutations.length + retryingQueries.length,
      mutations: pendingMutations.length + errorMutations.length,
      queries: retryingQueries.length,
      priority: {
        critical: this.countCriticalOperations(pendingMutations, errorMutations),
        normal: this.countNormalOperations(pendingMutations, errorMutations),
        low: this.countLowOperations(pendingMutations, errorMutations),
      },
    };

    // Update last sync time if no operations are queued
    if (this.currentStatus.queuedOperations.count === 0) {
      this.currentStatus.lastSync = new Date();
      this.currentStatus.syncInProgress = false;
    }
  }

  private countCriticalOperations(pendingMutations: any[], errorMutations: any[]): number {
    // Critical operations: inventory updates, job status changes, route updates
    const criticalOperations = [...pendingMutations, ...errorMutations].filter(m => {
      const mutationKey = m.options.mutationKey;
      if (!mutationKey) return false;
      
      const operationType = mutationKey[0];
      return ['inventory', 'job', 'route'].includes(operationType);
    });

    return criticalOperations.length;
  }

  private countNormalOperations(pendingMutations: any[], errorMutations: any[]): number {
    // Normal operations: client updates, profile updates
    const normalOperations = [...pendingMutations, ...errorMutations].filter(m => {
      const mutationKey = m.options.mutationKey;
      if (!mutationKey) return false;
      
      const operationType = mutationKey[0];
      return ['client', 'profile'].includes(operationType);
    });

    return normalOperations.length;
  }

  private countLowOperations(pendingMutations: any[], errorMutations: any[]): number {
    // Low priority operations: everything else
    const criticalCount = this.countCriticalOperations(pendingMutations, errorMutations);
    const normalCount = this.countNormalOperations(pendingMutations, errorMutations);
    const totalCount = pendingMutations.length + errorMutations.length;
    
    return Math.max(0, totalCount - criticalCount - normalCount);
  }

  // ==================== RECONNECTION HANDLING ====================

  private handleReconnection() {
    console.log('OfflineStatusService: Handling reconnection...');
    
    this.currentStatus.syncInProgress = true;
    this.currentStatus.retryAttempts = 0;

    // Trigger TanStack Query to retry failed operations
    queryClient.resumePausedMutations();
    queryClient.refetchQueries({
      type: 'all',
      stale: true,
    });

    // Estimate sync time based on queued operations
    this.estimateSyncTime();

    this.notifyListeners();
  }

  private estimateSyncTime() {
    const operationCount = this.currentStatus.queuedOperations.count;
    const connectionQuality = this.currentStatus.connection.connectionQuality;
    
    // Base time per operation (seconds)
    let baseTime = 1;
    
    // Adjust based on connection quality
    switch (connectionQuality) {
      case 'excellent':
        baseTime = 0.5;
        break;
      case 'good':
        baseTime = 1;
        break;
      case 'fair':
        baseTime = 2;
        break;
      case 'poor':
        baseTime = 4;
        break;
      default:
        baseTime = 1;
    }

    this.currentStatus.estimatedSyncTime = Math.ceil(operationCount * baseTime);
  }

  // ==================== STATUS UPDATES ====================

  private startStatusUpdates() {
    // Update status every 30 seconds
    this.syncTimer = setInterval(async () => {
      // Update queued operations and notify listeners
      this.updateQueuedOperations();
      this.notifyListeners();
    }, 30000);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('OfflineStatusService: Error notifying listener:', error);
      }
    });
  }

  // ==================== PUBLIC API ====================

  /**
   * Get current offline status
   */
  getStatus(): OfflineStatus {
    return { ...this.currentStatus };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.currentStatus.connection };
  }

  /**
   * Get count of queued operations
   */
  getQueuedOperationsCount(): number {
    return this.currentStatus.queuedOperations.count;
  }

  /**
   * Check if device is online (considers manual offline mode)
   */
  isOnline(): boolean {
    // If manual offline mode is enabled, always report offline
    if (this.manualOfflineMode) {
      return false;
    }
    return this.currentStatus.connection.isOnline;
  }

  /**
   * Check if device is connected to any network
   */
  isConnected(): boolean {
    return this.currentStatus.connection.isConnected;
  }

  /**
   * Get connection quality
   */
  getConnectionQuality(): ConnectionStatus['connectionQuality'] {
    return this.currentStatus.connection.connectionQuality;
  }

  /**
   * Force a sync attempt
   */
  async forcSync(): Promise<void> {
    if (!this.currentStatus.connection.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    console.log('OfflineStatusService: Force sync requested');
    this.currentStatus.syncInProgress = true;
    this.currentStatus.retryAttempts++;

    try {
      await queryClient.resumePausedMutations();
      await queryClient.refetchQueries({
        type: 'all',
        stale: true,
      });
      
      console.log('OfflineStatusService: Force sync completed successfully');
    } catch (error) {
      console.error('OfflineStatusService: Force sync failed:', error);
      throw error;
    } finally {
      this.currentStatus.syncInProgress = false;
      this.updateQueuedOperations();
      this.notifyListeners();
    }
  }

  /**
   * Enable manual offline mode
   */
  enableManualOfflineMode(): void {
    console.log('OfflineStatusService: Manual offline mode enabled');
    this.manualOfflineMode = true;
    this.currentStatus.manualOfflineMode = true;
    this.updateStatus();
    this.notifyListeners();
  }

  /**
   * Disable manual offline mode
   */
  disableManualOfflineMode(): void {
    console.log('OfflineStatusService: Manual offline mode disabled');
    this.manualOfflineMode = false;
    this.currentStatus.manualOfflineMode = false;
    this.updateStatus();
    this.notifyListeners();
  }

  /**
   * Check if manual offline mode is enabled
   */
  isManualOfflineMode(): boolean {
    return this.manualOfflineMode;
  }

  /**
   * Handle sync failure to detect offline state
   */
  handleSyncFailure(error: any, operationId?: string): void {
    // Mark optimistic operation as failed if provided
    if (operationId) {
      const { enhancedOptimisticUpdates } = require('./queryClient');
      enhancedOptimisticUpdates.markError(operationId, error);
    }

    // Only update offline state if not in manual mode and error indicates network issue
    if (!this.manualOfflineMode && this.isNetworkError(error)) {
      console.log('OfflineStatusService: Detected offline state through sync failure');
      this.currentStatus.connection.isOnline = false;
      this.currentStatus.connection.connectionQuality = 'offline';
      this.notifyListeners();
    }
  }

  /**
   * Handle sync success to detect online state
   */
  handleSyncSuccess(operationId?: string): void {
    // Mark optimistic operation as successful if provided
    if (operationId) {
      const { enhancedOptimisticUpdates } = require('./queryClient');
      enhancedOptimisticUpdates.markSuccess(operationId);
    }

    // Only update online state if not in manual mode and we thought we were offline
    if (!this.manualOfflineMode && !this.currentStatus.connection.isOnline) {
      console.log('OfflineStatusService: Detected online state through sync success');
      this.currentStatus.connection.isOnline = true;
      this.currentStatus.connection.connectionQuality = 'good';
      this.notifyListeners();
    }
  }

  /**
   * Check if error indicates a network issue
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';
    
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorCode === 'NETWORK_ERROR' ||
      errorCode === 'TIMEOUT'
    );
  }

  /**
   * Update current status (used internally)
   */
  private updateStatus(): void {
    // Manual offline mode overrides network detection
    if (this.manualOfflineMode) {
      this.currentStatus.connection.isOnline = false;
      this.currentStatus.connection.connectionQuality = 'offline';
    } else {
      // When disabling manual mode, restore to actual network state
      // Check if we're actually connected to restore proper online status
      if (this.currentStatus.connection.isConnected) {
        this.currentStatus.connection.isOnline = true;
        // Restore a reasonable connection quality based on connection type
        if (this.currentStatus.connection.connectionType === 'wifi') {
          this.currentStatus.connection.connectionQuality = 'good';
        } else if (this.currentStatus.connection.connectionType === 'cellular') {
          this.currentStatus.connection.connectionQuality = 'fair';
        } else {
          this.currentStatus.connection.connectionQuality = 'good';
        }
      }
    }
  }

  /**
   * Subscribe to offline status changes
   */
  subscribe(listener: OfflineStatusListener): () => void {
    this.listeners.push(listener);
    
    // Immediately notify new listener of current status
    try {
      listener(this.currentStatus);
    } catch (error) {
      console.error('OfflineStatusService: Error notifying new listener:', error);
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.listeners = [];
    console.log('OfflineStatusService: Destroyed');
  }
}

// ==================== SINGLETON INSTANCE ====================

export const offlineStatusService = OfflineStatusService.getInstance();
export default offlineStatusService; 