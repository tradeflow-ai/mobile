/**
 * Connection Quality Service
 * Monitors network speed and provides adaptive sync strategies
 * Integrates with existing offline status service for comprehensive network management
 */

import { offlineStatusService } from './offlineStatusService';
import { batchOperationsService } from './batchOperationsService';

// ==================== TYPES ====================

export interface ConnectionQuality {
  level: 'excellent' | 'good' | 'poor' | 'offline';
  speed: 'fast' | 'medium' | 'slow' | 'unknown';
  latency: number; // ms
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  packetLoss: number; // percentage
  timestamp: Date;
  isStable: boolean;
  qualityScore: number; // 0-100
}

export interface ConnectionQualityConfig {
  speedTestInterval: number; // ms
  latencyTestInterval: number; // ms
  stabilityThreshold: number; // seconds
  speedTestDuration: number; // ms
  speedTestSize: number; // bytes
  maxRetries: number;
}

export interface AdaptiveSyncStrategy {
  batchSize: number;
  processingDelay: number; // ms
  retryAttempts: number;
  timeoutDuration: number; // ms
  priorityThreshold: 'critical' | 'normal' | 'low';
  shouldUseCompression: boolean;
  shouldBatchAggressive: boolean;
}

export interface ConnectionQualityListener {
  onQualityChange: (quality: ConnectionQuality) => void;
  onSpeedChange: (speed: number) => void;
  onLatencyChange: (latency: number) => void;
}

// ==================== CONSTANTS ====================

const DEFAULT_CONFIG: ConnectionQualityConfig = {
  speedTestInterval: 30000, // 30 seconds
  latencyTestInterval: 5000, // 5 seconds
  stabilityThreshold: 10, // 10 seconds
  speedTestDuration: 5000, // 5 seconds
  speedTestSize: 1024 * 100, // 100KB
  maxRetries: 3,
};

const QUALITY_THRESHOLDS = {
  excellent: {
    minSpeed: 10, // Mbps
    maxLatency: 50, // ms
    minScore: 80,
  },
  good: {
    minSpeed: 2, // Mbps
    maxLatency: 200, // ms
    minScore: 60,
  },
  poor: {
    minSpeed: 0.5, // Mbps
    maxLatency: 1000, // ms
    minScore: 30,
  },
};

// ==================== SERVICE ====================

class ConnectionQualityService {
  private static instance: ConnectionQualityService;
  private config: ConnectionQualityConfig = DEFAULT_CONFIG;
  private currentQuality: ConnectionQuality | null = null;
  private listeners: ConnectionQualityListener[] = [];
  private speedTestTimer: any = null;
  private latencyTestTimer: any = null;
  private isInitialized = false;
  private isRunning = false;
  private qualityHistory: ConnectionQuality[] = [];
  private maxHistorySize = 20;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): ConnectionQualityService {
    if (!ConnectionQualityService.instance) {
      ConnectionQualityService.instance = new ConnectionQualityService();
    }
    return ConnectionQualityService.instance;
  }

  // ==================== INITIALIZATION ====================

  private async initialize() {
    if (this.isInitialized) return;

    console.log('ConnectionQualityService: Initializing...');
    
    try {
      // Initialize with basic offline status
      await this.updateInitialQuality();

      // Subscribe to offline status changes
      offlineStatusService.subscribe((status) => {
        this.handleOfflineStatusChange(status);
      });

      this.isInitialized = true;
      console.log('ConnectionQualityService: Initialized successfully');
    } catch (error) {
      console.error('ConnectionQualityService: Failed to initialize:', error);
      this.isInitialized = false;
    }
  }

  // ==================== PUBLIC API ====================

  /**
   * Get current connection quality
   */
  public getConnectionQuality(): ConnectionQuality | null {
    return this.currentQuality;
  }

  /**
   * Get adaptive sync strategy based on current quality
   */
  public getAdaptiveSyncStrategy(): AdaptiveSyncStrategy {
    const quality = this.currentQuality;
    
    if (!quality || quality.level === 'offline') {
      return {
        batchSize: 0,
        processingDelay: 0,
        retryAttempts: 0,
        timeoutDuration: 0,
        priorityThreshold: 'critical',
        shouldUseCompression: false,
        shouldBatchAggressive: false,
      };
    }

    switch (quality.level) {
      case 'excellent':
        return {
          batchSize: 20,
          processingDelay: 500,
          retryAttempts: 1,
          timeoutDuration: 5000,
          priorityThreshold: 'low',
          shouldUseCompression: false,
          shouldBatchAggressive: true,
        };
      
      case 'good':
        return {
          batchSize: 10,
          processingDelay: 1000,
          retryAttempts: 2,
          timeoutDuration: 10000,
          priorityThreshold: 'normal',
          shouldUseCompression: true,
          shouldBatchAggressive: true,
        };
      
      case 'poor':
        return {
          batchSize: 3,
          processingDelay: 3000,
          retryAttempts: 3,
          timeoutDuration: 30000,
          priorityThreshold: 'critical',
          shouldUseCompression: true,
          shouldBatchAggressive: false,
        };
      
      default:
        return {
          batchSize: 5,
          processingDelay: 2000,
          retryAttempts: 2,
          timeoutDuration: 15000,
          priorityThreshold: 'normal',
          shouldUseCompression: true,
          shouldBatchAggressive: false,
        };
    }
  }

  /**
   * Start continuous quality monitoring
   */
  public startMonitoring(): void {
    if (this.isRunning) return;

    console.log('ConnectionQualityService: Starting monitoring...');
    this.isRunning = true;

    // Start speed tests
    this.scheduleSpeedTest();
    
    // Start latency tests
    this.scheduleLatencyTest();
  }

  /**
   * Stop quality monitoring
   */
  public stopMonitoring(): void {
    if (!this.isRunning) return;

    console.log('ConnectionQualityService: Stopping monitoring...');
    this.isRunning = false;

    if (this.speedTestTimer) {
      clearTimeout(this.speedTestTimer);
      this.speedTestTimer = null;
    }

    if (this.latencyTestTimer) {
      clearTimeout(this.latencyTestTimer);
      this.latencyTestTimer = null;
    }
  }

  /**
   * Subscribe to quality changes
   */
  public subscribe(listener: ConnectionQualityListener): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Force immediate quality test
   */
  public async testQuality(): Promise<ConnectionQuality> {
    console.log('ConnectionQualityService: Running immediate quality test...');
    
    const latency = await this.measureLatency();
    const downloadSpeed = await this.measureDownloadSpeed();
    const uploadSpeed = await this.measureUploadSpeed();
    
    const quality = this.calculateQuality(latency, downloadSpeed, uploadSpeed);
    this.updateQuality(quality);
    
    return quality;
  }

  /**
   * Get quality history
   */
  public getQualityHistory(): ConnectionQuality[] {
    return [...this.qualityHistory];
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ConnectionQualityConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('ConnectionQualityService: Configuration updated:', this.config);
  }

  // ==================== PRIVATE METHODS ====================

  private async updateInitialQuality(): Promise<void> {
    const offlineStatus = offlineStatusService.getStatus();
    
    if (!offlineStatus.connection.isOnline) {
      this.currentQuality = {
        level: 'offline',
        speed: 'unknown',
        latency: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        packetLoss: 0,
        timestamp: new Date(),
        isStable: false,
        qualityScore: 0,
      };
    } else {
      // Start with good quality assumption
      this.currentQuality = {
        level: 'good',
        speed: 'medium',
        latency: 100,
        downloadSpeed: 5,
        uploadSpeed: 1,
        packetLoss: 0,
        timestamp: new Date(),
        isStable: true,
        qualityScore: 70,
      };
    }
  }

  private handleOfflineStatusChange(status: any): void {
    if (!status.connection.isOnline) {
      // Update to offline quality
      const offlineQuality: ConnectionQuality = {
        level: 'offline',
        speed: 'unknown',
        latency: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        packetLoss: 0,
        timestamp: new Date(),
        isStable: false,
        qualityScore: 0,
      };
      this.updateQuality(offlineQuality);
    } else {
      // When coming online, test quality immediately
      this.testQuality().catch(error => {
        console.error('ConnectionQualityService: Error testing quality on reconnect:', error);
      });
    }
  }

  private scheduleSpeedTest(): void {
    if (!this.isRunning) return;

    this.speedTestTimer = setTimeout(async () => {
      try {
        await this.runSpeedTest();
      } catch (error) {
        console.error('ConnectionQualityService: Speed test failed:', error);
      }
      
      this.scheduleSpeedTest(); // Schedule next test
    }, this.config.speedTestInterval);
  }

  private scheduleLatencyTest(): void {
    if (!this.isRunning) return;

    this.latencyTestTimer = setTimeout(async () => {
      try {
        await this.runLatencyTest();
      } catch (error) {
        console.error('ConnectionQualityService: Latency test failed:', error);
      }
      
      this.scheduleLatencyTest(); // Schedule next test
    }, this.config.latencyTestInterval);
  }

  private async runSpeedTest(): Promise<void> {
    const latency = await this.measureLatency();
    const downloadSpeed = await this.measureDownloadSpeed();
    const uploadSpeed = await this.measureUploadSpeed();
    
    const quality = this.calculateQuality(latency, downloadSpeed, uploadSpeed);
    this.updateQuality(quality);
  }

  private async runLatencyTest(): Promise<void> {
    const latency = await this.measureLatency();
    
    if (this.currentQuality) {
      const updatedQuality = {
        ...this.currentQuality,
        latency,
        timestamp: new Date(),
      };
      this.updateQuality(updatedQuality);
    }
  }

  private async measureLatency(): Promise<number> {
    const startTime = Date.now();
    
    try {
      // Simple ping test using a small HTTP request
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        return Date.now() - startTime;
      }
      
      return 1000; // Default high latency if request fails
    } catch (error) {
      console.error('ConnectionQualityService: Latency measurement failed:', error);
      return 1000; // Default high latency
    }
  }

  private async measureDownloadSpeed(): Promise<number> {
    const startTime = Date.now();
    
    try {
      // Download a small file to measure speed
      const response = await fetch('https://www.google.com/images/branding/googlelogo/2x/googlelogo_light_color_272x92dp.png', {
        cache: 'no-cache',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const duration = Date.now() - startTime;
        const bytes = blob.size;
        const mbps = (bytes * 8) / (duration / 1000) / 1000000;
        return Math.max(mbps, 0.1); // Minimum 0.1 Mbps
      }
      
      return 1; // Default speed if test fails
    } catch (error) {
      console.error('ConnectionQualityService: Download speed measurement failed:', error);
      return 1; // Default speed
    }
  }

  private async measureUploadSpeed(): Promise<number> {
    // For now, estimate upload speed as 1/4 of download speed
    // Real upload testing would require a server endpoint
    const downloadSpeed = this.currentQuality?.downloadSpeed || 1;
    return downloadSpeed * 0.25;
  }

  private calculateQuality(latency: number, downloadSpeed: number, uploadSpeed: number): ConnectionQuality {
    // Calculate quality score based on multiple factors
    let score = 0;
    
    // Speed score (0-40 points)
    if (downloadSpeed >= QUALITY_THRESHOLDS.excellent.minSpeed) {
      score += 40;
    } else if (downloadSpeed >= QUALITY_THRESHOLDS.good.minSpeed) {
      score += 30;
    } else if (downloadSpeed >= QUALITY_THRESHOLDS.poor.minSpeed) {
      score += 15;
    }
    
    // Latency score (0-30 points)
    if (latency <= QUALITY_THRESHOLDS.excellent.maxLatency) {
      score += 30;
    } else if (latency <= QUALITY_THRESHOLDS.good.maxLatency) {
      score += 20;
    } else if (latency <= QUALITY_THRESHOLDS.poor.maxLatency) {
      score += 10;
    }
    
    // Upload speed score (0-20 points)
    if (uploadSpeed >= 2) {
      score += 20;
    } else if (uploadSpeed >= 0.5) {
      score += 15;
    } else if (uploadSpeed >= 0.1) {
      score += 10;
    }
    
    // Stability score (0-10 points)
    const isStable = this.isConnectionStable();
    if (isStable) {
      score += 10;
    }
    
    // Determine quality level
    let level: ConnectionQuality['level'] = 'poor';
    let speed: ConnectionQuality['speed'] = 'slow';
    
    if (score >= QUALITY_THRESHOLDS.excellent.minScore) {
      level = 'excellent';
      speed = 'fast';
    } else if (score >= QUALITY_THRESHOLDS.good.minScore) {
      level = 'good';
      speed = 'medium';
    } else if (score >= QUALITY_THRESHOLDS.poor.minScore) {
      level = 'poor';
      speed = 'slow';
    }
    
    return {
      level,
      speed,
      latency,
      downloadSpeed,
      uploadSpeed,
      packetLoss: 0, // Would need specialized testing
      timestamp: new Date(),
      isStable,
      qualityScore: score,
    };
  }

  private isConnectionStable(): boolean {
    if (this.qualityHistory.length < 3) return false;
    
    const recentQualities = this.qualityHistory.slice(-3);
    const avgLatency = recentQualities.reduce((sum, q) => sum + q.latency, 0) / recentQualities.length;
    const latencyVariation = recentQualities.reduce((sum, q) => sum + Math.abs(q.latency - avgLatency), 0) / recentQualities.length;
    
    return latencyVariation < 50; // Stable if latency variation is < 50ms
  }

  private updateQuality(quality: ConnectionQuality): void {
    const previousQuality = this.currentQuality;
    this.currentQuality = quality;
    
    // Add to history
    this.qualityHistory.push(quality);
    if (this.qualityHistory.length > this.maxHistorySize) {
      this.qualityHistory.shift();
    }
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener.onQualityChange(quality);
        
        if (previousQuality?.downloadSpeed !== quality.downloadSpeed) {
          listener.onSpeedChange(quality.downloadSpeed);
        }
        
        if (previousQuality?.latency !== quality.latency) {
          listener.onLatencyChange(quality.latency);
        }
      } catch (error) {
        console.error('ConnectionQualityService: Error notifying listener:', error);
      }
    });
    
    // Update batch operations service with new strategy
    this.updateBatchOperationsStrategy();
    
    console.log('ConnectionQualityService: Quality updated:', {
      level: quality.level,
      score: quality.qualityScore,
      speed: quality.downloadSpeed,
      latency: quality.latency,
    });
  }

  private updateBatchOperationsStrategy(): void {
    const strategy = this.getAdaptiveSyncStrategy();
    
    try {
      // Update batch operations service with new strategy
      batchOperationsService.updateConfiguration({
        maxBatchSize: strategy.batchSize,
        processingDelay: strategy.processingDelay,
        maxRetries: strategy.retryAttempts,
        timeoutDuration: strategy.timeoutDuration,
      });
    } catch (error) {
      console.error('ConnectionQualityService: Error updating batch operations strategy:', error);
    }
  }

  // ==================== LIFECYCLE ====================

  public async destroy(): Promise<void> {
    console.log('ConnectionQualityService: Destroying...');
    
    this.stopMonitoring();
    this.listeners = [];
    this.qualityHistory = [];
    this.currentQuality = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const connectionQualityService = ConnectionQualityService.getInstance(); 