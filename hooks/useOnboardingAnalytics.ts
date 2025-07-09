/**
 * Onboarding Analytics Hooks
 * 
 * React hooks for comprehensive onboarding analytics including funnel analysis,
 * completion tracking, drop-off identification, and performance monitoring.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  OnboardingAnalyticsService,
  OnboardingFunnelAnalytics,
  CompletionRateMetrics,
  DropOffAnalysis,
  OnboardingPerformanceMetrics,
  OnboardingExportData,
  UserJourneyAnalytics,
} from '@/services/onboardingAnalyticsService';

// =====================================================
// ANALYTICS QUERY KEYS
// =====================================================

export const onboardingAnalyticsQueryKeys = {
  all: ['onboarding-analytics'] as const,
  funnel: (startDate?: string, endDate?: string) => 
    [...onboardingAnalyticsQueryKeys.all, 'funnel', startDate, endDate] as const,
  completionTrends: (period: string, startDate?: string, endDate?: string) => 
    [...onboardingAnalyticsQueryKeys.all, 'completion-trends', period, startDate, endDate] as const,
  dropOffAnalysis: (startDate?: string, endDate?: string) => 
    [...onboardingAnalyticsQueryKeys.all, 'drop-off', startDate, endDate] as const,
  performanceMetrics: (startDate?: string, endDate?: string) => 
    [...onboardingAnalyticsQueryKeys.all, 'performance', startDate, endDate] as const,
  userJourney: (userId: string) => 
    [...onboardingAnalyticsQueryKeys.all, 'user-journey', userId] as const,
  exportData: (format: string, startDate?: string, endDate?: string) => 
    [...onboardingAnalyticsQueryKeys.all, 'export', format, startDate, endDate] as const,
};

// =====================================================
// FUNNEL ANALYTICS HOOKS
// =====================================================

/**
 * Hook for comprehensive funnel analytics
 */
export function useOnboardingFunnelAnalytics(
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: onboardingAnalyticsQueryKeys.funnel(startDate, endDate),
    queryFn: async (): Promise<OnboardingFunnelAnalytics> => {
      const { data, error } = await OnboardingAnalyticsService.getFunnelAnalytics(startDate, endDate);
      if (error) throw error;
      if (!data) throw new Error('No funnel data available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
}

/**
 * Hook for completion rate trends over time
 */
export function useOnboardingCompletionTrends(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: onboardingAnalyticsQueryKeys.completionTrends(period, startDate, endDate),
    queryFn: async (): Promise<CompletionRateMetrics> => {
      const { data, error } = await OnboardingAnalyticsService.getCompletionRateTrends(period, startDate, endDate);
      if (error) throw error;
      if (!data) throw new Error('No completion trends data available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

/**
 * Hook for drop-off analysis
 */
export function useOnboardingDropOffAnalysis(
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: onboardingAnalyticsQueryKeys.dropOffAnalysis(startDate, endDate),
    queryFn: async (): Promise<DropOffAnalysis[]> => {
      const { data, error } = await OnboardingAnalyticsService.getDropOffAnalysis(startDate, endDate);
      if (error) throw error;
      if (!data) throw new Error('No drop-off analysis data available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

/**
 * Hook for comprehensive performance metrics
 */
export function useOnboardingPerformanceMetrics(
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: onboardingAnalyticsQueryKeys.performanceMetrics(startDate, endDate),
    queryFn: async (): Promise<OnboardingPerformanceMetrics> => {
      const { data, error } = await OnboardingAnalyticsService.getPerformanceMetrics(startDate, endDate);
      if (error) throw error;
      if (!data) throw new Error('No performance metrics data available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
}

/**
 * Hook for individual user journey analytics
 */
export function useUserJourneyAnalytics(
  userId: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: onboardingAnalyticsQueryKeys.userJourney(userId),
    queryFn: async (): Promise<UserJourneyAnalytics> => {
      const { data, error } = await OnboardingAnalyticsService.getUserJourney(userId);
      if (error) throw error;
      if (!data) throw new Error('No user journey data available');
      return data;
    },
    enabled: (options?.enabled ?? true) && !!userId,
    refetchInterval: options?.refetchInterval ?? 30 * 1000, // 30 seconds for individual user
    staleTime: 15 * 1000, // 15 seconds
    retry: 3,
  });
}

// =====================================================
// DATA EXPORT HOOKS
// =====================================================

/**
 * Hook for exporting onboarding data
 */
export function useExportOnboardingData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      format: 'json' | 'csv';
      startDate?: string;
      endDate?: string;
    }): Promise<OnboardingExportData | string> => {
      const { data, error } = await OnboardingAnalyticsService.exportOnboardingData(
        params.format,
        params.startDate,
        params.endDate
      );
      if (error) throw error;
      if (!data) throw new Error('No export data available');
      return data;
    },
    onSuccess: (data, variables) => {
      // Cache the export data temporarily
      queryClient.setQueryData(
        onboardingAnalyticsQueryKeys.exportData(variables.format, variables.startDate, variables.endDate),
        data
      );
    },
    retry: 2,
  });
}

// =====================================================
// REAL-TIME MONITORING HOOKS
// =====================================================

/**
 * Hook for real-time monitoring dashboard
 */
export function useOnboardingMonitoringDashboard(
  options?: {
    autoRefresh?: boolean;
    refetchInterval?: number;
  }
) {
  const autoRefresh = options?.autoRefresh ?? true;
  const refetchInterval = options?.refetchInterval ?? 30 * 1000; // 30 seconds

  // Get current metrics (last 24 hours)
  const currentMetrics = useOnboardingPerformanceMetrics(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    new Date().toISOString(),
    { 
      enabled: autoRefresh,
      refetchInterval: refetchInterval 
    }
  );

  // Get weekly trends
  const weeklyTrends = useOnboardingCompletionTrends(
    'daily',
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    new Date().toISOString(),
    { 
      enabled: autoRefresh,
      refetchInterval: refetchInterval 
    }
  );

  // Get current funnel data
  const funnelData = useOnboardingFunnelAnalytics(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    new Date().toISOString(),
    { 
      enabled: autoRefresh,
      refetchInterval: refetchInterval 
    }
  );

  // Get drop-off analysis
  const dropOffData = useOnboardingDropOffAnalysis(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    new Date().toISOString(),
    { 
      enabled: autoRefresh,
      refetchInterval: refetchInterval 
    }
  );

  return {
    currentMetrics,
    weeklyTrends,
    funnelData,
    dropOffData,
    isLoading: currentMetrics.isLoading || weeklyTrends.isLoading || funnelData.isLoading || dropOffData.isLoading,
    error: currentMetrics.error || weeklyTrends.error || funnelData.error || dropOffData.error,
    refetch: () => {
      currentMetrics.refetch();
      weeklyTrends.refetch();
      funnelData.refetch();
      dropOffData.refetch();
    }
  };
}

// =====================================================
// ANALYTICS UTILITIES HOOKS
// =====================================================

/**
 * Hook for analytics query invalidation
 */
export function useOnboardingAnalyticsInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: onboardingAnalyticsQueryKeys.all });
    },
    invalidateFunnel: (startDate?: string, endDate?: string) => {
      queryClient.invalidateQueries({ queryKey: onboardingAnalyticsQueryKeys.funnel(startDate, endDate) });
    },
    invalidateCompletionTrends: (period: string, startDate?: string, endDate?: string) => {
      queryClient.invalidateQueries({ queryKey: onboardingAnalyticsQueryKeys.completionTrends(period, startDate, endDate) });
    },
    invalidateDropOffAnalysis: (startDate?: string, endDate?: string) => {
      queryClient.invalidateQueries({ queryKey: onboardingAnalyticsQueryKeys.dropOffAnalysis(startDate, endDate) });
    },
    invalidatePerformanceMetrics: (startDate?: string, endDate?: string) => {
      queryClient.invalidateQueries({ queryKey: onboardingAnalyticsQueryKeys.performanceMetrics(startDate, endDate) });
    },
    invalidateUserJourney: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: onboardingAnalyticsQueryKeys.userJourney(userId) });
    },
  };
}

/**
 * Hook for prefetching analytics data
 */
export function usePrefetchOnboardingAnalytics() {
  const queryClient = useQueryClient();

  return {
    prefetchFunnel: (startDate?: string, endDate?: string) => {
      queryClient.prefetchQuery({
        queryKey: onboardingAnalyticsQueryKeys.funnel(startDate, endDate),
        queryFn: async () => {
          const { data, error } = await OnboardingAnalyticsService.getFunnelAnalytics(startDate, endDate);
          if (error) throw error;
          return data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    },
    prefetchCompletionTrends: (period: 'daily' | 'weekly' | 'monthly', startDate?: string, endDate?: string) => {
      queryClient.prefetchQuery({
        queryKey: onboardingAnalyticsQueryKeys.completionTrends(period, startDate, endDate),
        queryFn: async () => {
          const { data, error } = await OnboardingAnalyticsService.getCompletionRateTrends(period, startDate, endDate);
          if (error) throw error;
          return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    prefetchPerformanceMetrics: (startDate?: string, endDate?: string) => {
      queryClient.prefetchQuery({
        queryKey: onboardingAnalyticsQueryKeys.performanceMetrics(startDate, endDate),
        queryFn: async () => {
          const { data, error } = await OnboardingAnalyticsService.getPerformanceMetrics(startDate, endDate);
          if (error) throw error;
          return data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    },
  };
}

// =====================================================
// ANALYTICS COMPUTED HOOKS
// =====================================================

/**
 * Hook for computed analytics insights
 */
export function useOnboardingAnalyticsInsights(
  startDate?: string,
  endDate?: string
) {
  const performanceMetrics = useOnboardingPerformanceMetrics(startDate, endDate);
  const funnelData = useOnboardingFunnelAnalytics(startDate, endDate);
  const dropOffData = useOnboardingDropOffAnalysis(startDate, endDate);

  // Compute insights from the data
  const insights = {
    // Overall health score based on completion rate and drop-off
    healthScore: (() => {
      if (!performanceMetrics.data) return 0;
      const completionRate = performanceMetrics.data.overview.overall_completion_rate;
      const avgDropOff = dropOffData.data && dropOffData.data.length > 0 
        ? dropOffData.data.reduce((sum, item) => sum + item.drop_off_rate, 0) / dropOffData.data.length
        : 0;
      return Math.round(completionRate - (avgDropOff * 0.5));
    })(),

    // Biggest bottleneck step
    biggestBottleneck: (() => {
      if (!funnelData.data || funnelData.data.steps.length === 0) return null;
      return funnelData.data.steps.reduce((worst, step) => 
        step.drop_off_rate > worst.drop_off_rate ? step : worst
      );
    })(),

    // Most common drop-off reasons
    topDropOffReasons: (() => {
      if (!dropOffData.data) return [];
      return dropOffData.data
        .map(step => ({
          step: step.step_name,
          rate: step.drop_off_rate,
          count: step.drop_off_count,
          validationErrors: Object.entries(step.common_validation_errors || {})
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 3)
        }))
        .sort((a, b) => b.rate - a.rate);
    })(),

    // Performance trend (improving/declining)
    performanceTrend: (() => {
      // This would need historical data comparison
      // For now, return neutral
      return 'neutral' as 'improving' | 'declining' | 'neutral';
    })(),

    // Recommendations
    recommendations: (() => {
      const recs: string[] = [];
      if (!performanceMetrics.data) return recs;

      const completionRate = performanceMetrics.data.overview.overall_completion_rate;
      if (completionRate < 50) {
        recs.push('Consider simplifying the onboarding process - completion rate is below 50%');
      }

      const avgTime = performanceMetrics.data.overview.average_completion_time_minutes;
      if (avgTime > 15) {
        recs.push('Onboarding takes too long - consider reducing complexity or number of steps');
      }

      if (dropOffData.data && dropOffData.data.length > 0) {
        const highestDropOff = dropOffData.data.reduce((max, item) => 
          item.drop_off_rate > max.drop_off_rate ? item : max
        );
        if (highestDropOff.drop_off_rate > 25) {
          recs.push(`Focus on improving the ${highestDropOff.step_name} step - highest drop-off rate`);
        }
      }

      return recs;
    })(),
  };

  return {
    ...insights,
    isLoading: performanceMetrics.isLoading || funnelData.isLoading || dropOffData.isLoading,
    error: performanceMetrics.error || funnelData.error || dropOffData.error,
  };
}

// =====================================================
// MASTER ANALYTICS HOOK
// =====================================================

/**
 * Master hook for onboarding analytics - provides comprehensive analytics data
 */
export function useOnboardingAnalytics(
  options?: {
    startDate?: string;
    endDate?: string;
    autoRefresh?: boolean;
    refetchInterval?: number;
  }
) {
  const startDate = options?.startDate;
  const endDate = options?.endDate;
  const autoRefresh = options?.autoRefresh ?? true;
  const refetchInterval = options?.refetchInterval ?? 5 * 60 * 1000; // 5 minutes

  const funnel = useOnboardingFunnelAnalytics(startDate, endDate, { 
    enabled: autoRefresh,
    refetchInterval 
  });

  const completionTrends = useOnboardingCompletionTrends('daily', startDate, endDate, { 
    enabled: autoRefresh,
    refetchInterval 
  });

  const dropOff = useOnboardingDropOffAnalysis(startDate, endDate, { 
    enabled: autoRefresh,
    refetchInterval 
  });

  const performance = useOnboardingPerformanceMetrics(startDate, endDate, { 
    enabled: autoRefresh,
    refetchInterval 
  });

  const insights = useOnboardingAnalyticsInsights(startDate, endDate);

  const exportData = useExportOnboardingData();

  const invalidation = useOnboardingAnalyticsInvalidation();

  return {
    // Data
    funnel,
    completionTrends,
    dropOff,
    performance,
    insights,

    // Actions
    exportData,
    invalidation,

    // Computed states
    isLoading: funnel.isLoading || completionTrends.isLoading || dropOff.isLoading || performance.isLoading,
    error: funnel.error || completionTrends.error || dropOff.error || performance.error,
    
    // Utility functions
    refetchAll: () => {
      funnel.refetch();
      completionTrends.refetch();
      dropOff.refetch();
      performance.refetch();
    },
  };
} 