/**
 * Connection Quality Hooks
 * React hooks for connection quality monitoring and adaptive sync strategies
 */

import { useState, useEffect, useCallback } from 'react';
import { connectionQualityService, ConnectionQuality, AdaptiveSyncStrategy } from '../services/connectionQualityService';
import { batchOperationsService } from '../services/batchOperationsService';
import { useOfflineStatus } from './useOfflineStatus';

// ==================== MAIN CONNECTION QUALITY HOOK ====================

/**
 * Main hook for connection quality monitoring
 * Provides real-time connection quality data and adaptive sync strategies
 */
export const useConnectionQuality = () => {
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null);
  const [adaptiveStrategy, setAdaptiveStrategy] = useState<AdaptiveSyncStrategy | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [qualityHistory, setQualityHistory] = useState<ConnectionQuality[]>([]);

  // Initialize and subscribe to quality changes
  useEffect(() => {
    // Get initial quality
    const initialQuality = connectionQualityService.getConnectionQuality();
    setConnectionQuality(initialQuality);
    
    if (initialQuality) {
      setAdaptiveStrategy(connectionQualityService.getAdaptiveSyncStrategy());
    }

    // Subscribe to quality changes
    const unsubscribe = connectionQualityService.subscribe({
      onQualityChange: (quality) => {
        setConnectionQuality(quality);
        setAdaptiveStrategy(connectionQualityService.getAdaptiveSyncStrategy());
        setQualityHistory(connectionQualityService.getQualityHistory());
      },
      onSpeedChange: (speed) => {
        console.log('Connection speed changed:', speed);
      },
      onLatencyChange: (latency) => {
        console.log('Connection latency changed:', latency);
      },
    });

    return unsubscribe;
  }, []);

  // Control monitoring
  const startMonitoring = useCallback(() => {
    connectionQualityService.startMonitoring();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    connectionQualityService.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  // Force quality test
  const testQuality = useCallback(async () => {
    try {
      const quality = await connectionQualityService.testQuality();
      return quality;
    } catch (error) {
      console.error('useConnectionQuality: Error testing quality:', error);
      throw error;
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback((config: Parameters<typeof connectionQualityService.updateConfig>[0]) => {
    connectionQualityService.updateConfig(config);
  }, []);

  return {
    // Current state
    connectionQuality,
    adaptiveStrategy,
    isMonitoring,
    qualityHistory,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    testQuality,
    updateConfig,
    
    // Computed properties
    isOnline: connectionQuality?.level !== 'offline',
    qualityLevel: connectionQuality?.level || 'offline',
    qualityScore: connectionQuality?.qualityScore || 0,
    speed: connectionQuality?.downloadSpeed || 0,
    latency: connectionQuality?.latency || 0,
    isStable: connectionQuality?.isStable || false,
  };
};

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook for monitoring connection quality statistics
 * Provides aggregated quality metrics and trends
 */
export const useConnectionQualityStats = () => {
  const [stats, setStats] = useState({
    averageQuality: 0,
    averageSpeed: 0,
    averageLatency: 0,
    stabilityPercentage: 0,
    qualityTrend: 'stable' as 'improving' | 'degrading' | 'stable',
    recentTests: 0,
  });

  useEffect(() => {
    const calculateStats = () => {
      const history = connectionQualityService.getQualityHistory();
      
      if (history.length === 0) {
        return;
      }

      // Calculate averages
      const averageQuality = history.reduce((sum, q) => sum + q.qualityScore, 0) / history.length;
      const averageSpeed = history.reduce((sum, q) => sum + q.downloadSpeed, 0) / history.length;
      const averageLatency = history.reduce((sum, q) => sum + q.latency, 0) / history.length;
      const stabilityPercentage = (history.filter(q => q.isStable).length / history.length) * 100;

      // Calculate trend
      let qualityTrend: 'improving' | 'degrading' | 'stable' = 'stable';
      if (history.length >= 3) {
        const recent = history.slice(-3);
        const earlier = history.slice(-6, -3);
        
        if (earlier.length > 0) {
          const recentAvg = recent.reduce((sum, q) => sum + q.qualityScore, 0) / recent.length;
          const earlierAvg = earlier.reduce((sum, q) => sum + q.qualityScore, 0) / earlier.length;
          
          if (recentAvg > earlierAvg + 5) {
            qualityTrend = 'improving';
          } else if (recentAvg < earlierAvg - 5) {
            qualityTrend = 'degrading';
          }
        }
      }

      setStats({
        averageQuality,
        averageSpeed,
        averageLatency,
        stabilityPercentage,
        qualityTrend,
        recentTests: history.length,
      });
    };

    // Calculate initial stats
    calculateStats();

    // Subscribe to quality changes
    const unsubscribe = connectionQualityService.subscribe({
      onQualityChange: calculateStats,
      onSpeedChange: () => {},
      onLatencyChange: () => {},
    });

    return unsubscribe;
  }, []);

  return stats;
};

/**
 * Hook for adaptive sync strategy
 * Provides sync strategy recommendations based on connection quality
 */
export const useAdaptiveSyncStrategy = () => {
  const [strategy, setStrategy] = useState<AdaptiveSyncStrategy | null>(null);
  const [isOptimal, setIsOptimal] = useState(false);

  useEffect(() => {
    const updateStrategy = () => {
      const currentStrategy = connectionQualityService.getAdaptiveSyncStrategy();
      setStrategy(currentStrategy);
      
      // Determine if strategy is optimal
      const quality = connectionQualityService.getConnectionQuality();
      if (quality) {
        const isOptimal = quality.level === 'excellent' || quality.level === 'good';
        setIsOptimal(isOptimal);
      }
    };

    updateStrategy();

    const unsubscribe = connectionQualityService.subscribe({
      onQualityChange: updateStrategy,
      onSpeedChange: () => {},
      onLatencyChange: () => {},
    });

    return unsubscribe;
  }, []);

  return {
    strategy,
    isOptimal,
    batchSize: strategy?.batchSize || 0,
    processingDelay: strategy?.processingDelay || 0,
    retryAttempts: strategy?.retryAttempts || 0,
    shouldUseCompression: strategy?.shouldUseCompression || false,
    shouldBatchAggressive: strategy?.shouldBatchAggressive || false,
  };
};

/**
 * Hook for connection quality indicators
 * Provides UI-friendly quality indicators and colors
 */
export const useConnectionQualityIndicators = () => {
  const { connectionQuality, qualityLevel, qualityScore, isStable } = useConnectionQuality();

  const getQualityColor = useCallback((level: ConnectionQuality['level']) => {
    switch (level) {
      case 'excellent':
        return '#10B981'; // Green
      case 'good':
        return '#F59E0B'; // Yellow
      case 'poor':
        return '#EF4444'; // Red
      case 'offline':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  }, []);

  const getQualityIcon = useCallback((level: ConnectionQuality['level']) => {
    switch (level) {
      case 'excellent':
        return 'wifi'; // Full WiFi signal
      case 'good':
        return 'wifi'; // Good WiFi signal
      case 'poor':
        return 'wifi'; // Poor WiFi signal
      case 'offline':
        return 'wifi-off'; // No WiFi
      default:
        return 'wifi-off';
    }
  }, []);

  const getQualityText = useCallback((level: ConnectionQuality['level']) => {
    switch (level) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'poor':
        return 'Poor';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  }, []);

  const getSpeedText = useCallback((speed: number) => {
    if (speed >= 10) return 'Fast';
    if (speed >= 2) return 'Medium';
    if (speed >= 0.5) return 'Slow';
    return 'Very Slow';
  }, []);

  return {
    qualityColor: getQualityColor(qualityLevel),
    qualityIcon: getQualityIcon(qualityLevel),
    qualityText: getQualityText(qualityLevel),
    speedText: connectionQuality ? getSpeedText(connectionQuality.downloadSpeed) : 'Unknown',
    latencyText: connectionQuality ? `${connectionQuality.latency}ms` : 'Unknown',
    stabilityText: isStable ? 'Stable' : 'Unstable',
    qualityPercent: Math.round(qualityScore),
  };
};

/**
 * Hook for manual quality testing
 * Provides manual quality testing capabilities with loading states
 */
export const useManualQualityTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<ConnectionQuality | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    if (isTesting) return;

    setIsTesting(true);
    setTestError(null);

    try {
      const result = await connectionQualityService.testQuality();
      setLastTestResult(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestError(errorMessage);
      throw error;
    } finally {
      setIsTesting(false);
    }
  }, [isTesting]);

  return {
    isTesting,
    lastTestResult,
    testError,
    runTest,
    canTest: !isTesting,
  };
};

/**
 * Hook for sync optimization
 * Provides sync optimization recommendations based on connection quality
 */
export const useSyncOptimization = () => {
  const { connectionQuality, adaptiveStrategy } = useConnectionQuality();
  const { isOnline } = useOfflineStatus();

  const getSyncRecommendations = useCallback(() => {
    if (!connectionQuality || !adaptiveStrategy) {
      return {
        shouldSync: false,
        syncMode: 'none' as const,
        recommendations: ['Connection quality not available'],
      };
    }

    const recommendations: string[] = [];
    let shouldSync = isOnline;
    let syncMode: 'aggressive' | 'normal' | 'conservative' | 'none' = 'none';

    if (!isOnline) {
      recommendations.push('Device is offline - sync disabled');
      return { shouldSync: false, syncMode, recommendations };
    }

    switch (connectionQuality.level) {
      case 'excellent':
        syncMode = 'aggressive';
        recommendations.push('Excellent connection - sync all operations');
        recommendations.push(`Use large batches (${adaptiveStrategy.batchSize} operations)`);
        break;
      
      case 'good':
        syncMode = 'normal';
        recommendations.push('Good connection - sync normally');
        recommendations.push(`Use medium batches (${adaptiveStrategy.batchSize} operations)`);
        break;
      
      case 'poor':
        syncMode = 'conservative';
        recommendations.push('Poor connection - sync only critical operations');
        recommendations.push(`Use small batches (${adaptiveStrategy.batchSize} operations)`);
        recommendations.push(`Longer delays between batches (${adaptiveStrategy.processingDelay}ms)`);
        break;
      
      default:
        shouldSync = false;
        recommendations.push('Connection quality unknown - sync disabled');
        break;
    }

    if (adaptiveStrategy.shouldUseCompression) {
      recommendations.push('Enable compression for better performance');
    }

    return { shouldSync, syncMode, recommendations };
  }, [connectionQuality, adaptiveStrategy, isOnline]);

  const optimizeBatchOperations = useCallback(() => {
    if (!adaptiveStrategy) return;

    // Get current batch operations stats
    const batchStats = batchOperationsService.getStatistics();
    
    // Apply optimization based on connection quality
    if (connectionQuality?.level === 'poor' && batchStats.pending.total > 10) {
      // For poor connections with many pending operations, force process critical operations first
      batchOperationsService.forceProcessCriticalOperations();
    } else if (connectionQuality?.level === 'excellent' && batchStats.pending.total > 0) {
      // For excellent connections, process all operations aggressively
      batchOperationsService.forceProcessOperations();
    }
  }, [connectionQuality, adaptiveStrategy]);

  return {
    ...getSyncRecommendations(),
    optimizeBatchOperations,
  };
};

// ==================== DEFAULT EXPORT ====================

export default useConnectionQuality; 