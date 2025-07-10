/**
 * Feedback Hooks - TanStack Query Integration
 * 
 * React hooks for comprehensive feedback collection and analytics including
 * user feedback logging, agent decision tracking, performance analytics, and learning insights.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { 
  FeedbackService,
  UserFeedbackEvent,
  AgentDecisionContext,
  FeedbackPattern,
  FeedbackLearningExample,
  AgentType,
  FeedbackValue,
  FeedbackEventType
} from '@/services/feedbackService';
import {
  FeedbackAnalyticsService,
  FeedbackTrends,
  UserFeedbackProfile,
  AgentPerformanceMetrics,
  LearningExampleAnalytics,
  FeedbackCorrelationAnalysis,
  FeedbackReportData
} from '@/services/feedbackAnalyticsService';
import { queryKeys, invalidateQueries, handleQueryError } from '@/services/queryClient';

// =====================================================
// FEEDBACK QUERY KEYS
// =====================================================

export const feedbackQueryKeys = {
  all: ['feedback'] as const,
  // Analytics keys
  trends: (period: string, startDate?: string, endDate?: string) => 
    [...feedbackQueryKeys.all, 'trends', period, startDate, endDate] as const,
  userProfile: (userId: string, startDate?: string, endDate?: string) => 
    [...feedbackQueryKeys.all, 'user-profile', userId, startDate, endDate] as const,
  agentMetrics: (agentType: AgentType, startDate?: string, endDate?: string) => 
    [...feedbackQueryKeys.all, 'agent-metrics', agentType, startDate, endDate] as const,
  learningAnalytics: () => 
    [...feedbackQueryKeys.all, 'learning-analytics'] as const,
  learningExamples: (agentType: AgentType, limit?: number) => 
    [...feedbackQueryKeys.all, 'learning-examples', agentType, limit] as const,
  correlationAnalysis: (correlationType: string, startDate?: string, endDate?: string) => 
    [...feedbackQueryKeys.all, 'correlation', correlationType, startDate, endDate] as const,
  feedbackAnalytics: (query: any) => 
    [...feedbackQueryKeys.all, 'analytics', query] as const,
  patterns: (timeWindow?: number, minEventCount?: number) => 
    [...feedbackQueryKeys.all, 'patterns', timeWindow, minEventCount] as const,
};

// =====================================================
// FEEDBACK COLLECTION HOOKS (MUTATIONS)
// =====================================================

/**
 * Hook for logging user feedback events
 */
export function useLogFeedback() {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (feedbackData: Partial<UserFeedbackEvent>) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      // Ensure user_id is set
      const completeData = {
        ...feedbackData,
        user_id: feedbackData.user_id || user.id,
        session_id: feedbackData.session_id || `session_${Date.now()}_${user.id}`,
      };

      const { data, error } = await FeedbackService.logUserFeedback(completeData);
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data && user?.id) {
        // Invalidate relevant analytics queries
        queryClient.invalidateQueries({ 
          queryKey: [...feedbackQueryKeys.all, 'trends'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: feedbackQueryKeys.userProfile(user.id) 
        });
        
        if (data.agent_type) {
          queryClient.invalidateQueries({ 
            queryKey: feedbackQueryKeys.agentMetrics(data.agent_type) 
          });
        }
      }
    },
    onError: (error) => {
      console.error('Error logging feedback:', error);
    },
  });
}

/**
 * Hook for logging agent decisions with context
 */
export function useLogAgentDecision() {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (params: {
      feedbackEventId: string;
      decisionContext: Partial<AgentDecisionContext>;
    }) => {
      const { data, error } = await FeedbackService.logAgentDecision(
        params.feedbackEventId,
        params.decisionContext
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data && user?.id) {
        // Invalidate agent performance metrics
        queryClient.invalidateQueries({ 
          queryKey: feedbackQueryKeys.agentMetrics(data.agent_type) 
        });
        queryClient.invalidateQueries({ 
          queryKey: feedbackQueryKeys.learningAnalytics() 
        });
        queryClient.invalidateQueries({ 
          queryKey: feedbackQueryKeys.learningExamples(data.agent_type) 
        });
      }
    },
    onError: (error) => {
      console.error('Error logging agent decision:', error);
    },
  });
}

/**
 * Hook for logging user modifications of agent output
 */
export function useLogUserModification() {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (params: {
      originalEventId: string;
      modification: {
        modified_fields: Record<string, any>;
        modification_reason?: string;
        user_satisfaction?: number;
        time_to_modify_seconds?: number;
      };
    }) => {
      const { data, error } = await FeedbackService.logUserModification(
        params.originalEventId,
        params.modification
      );
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data && user?.id) {
        // Invalidate analytics queries since this affects performance metrics
        queryClient.invalidateQueries({ 
          queryKey: [...feedbackQueryKeys.all, 'trends'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: feedbackQueryKeys.userProfile(user.id) 
        });
        
        if (data.agent_type) {
          queryClient.invalidateQueries({ 
            queryKey: feedbackQueryKeys.agentMetrics(data.agent_type) 
          });
        }
      }
    },
    onError: (error) => {
      console.error('Error logging user modification:', error);
    },
  });
}

/**
 * Hook for batching feedback events for performance
 */
export function useBatchFeedbackEvents() {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (params: {
      sessionId: string;
      feedbackData: Partial<UserFeedbackEvent>;
    }) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const completeData = {
        ...params.feedbackData,
        user_id: params.feedbackData.user_id || user.id,
        session_id: params.sessionId,
      };

      const { queued, error } = await FeedbackService.batchFeedbackEvent(
        params.sessionId,
        completeData
      );
      
      if (error) {
        throw error;
      }
      
      return { queued };
    },
    onSuccess: () => {
      // Don't immediately invalidate queries for batched events
      // They will be invalidated when the batch is processed
    },
    onError: (error) => {
      console.error('Error batching feedback event:', error);
    },
  });
}

// =====================================================
// FEEDBACK ANALYTICS HOOKS (QUERIES)
// =====================================================

/**
 * Hook for getting feedback trends analysis
 */
export function useFeedbackTrends(
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: feedbackQueryKeys.trends(period, startDate, endDate),
    queryFn: async (): Promise<FeedbackTrends> => {
      const { data, error } = await FeedbackAnalyticsService.getFeedbackTrends(period, startDate, endDate);
      if (error) throw error;
      if (!data) throw new Error('No feedback trends data available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
}

/**
 * Hook for getting user feedback profile
 */
export function useUserFeedbackProfile(
  userId?: string,
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: feedbackQueryKeys.userProfile(targetUserId || '', startDate, endDate),
    queryFn: async (): Promise<UserFeedbackProfile> => {
      if (!targetUserId) {
        throw new Error('No user ID available');
      }
      
      const { data, error } = await FeedbackAnalyticsService.getUserFeedbackProfile(
        targetUserId,
        startDate,
        endDate
      );
      
      if (error) throw error;
      if (!data) throw new Error('No user feedback profile available');
      return data;
    },
    enabled: (options?.enabled ?? true) && !!targetUserId,
    refetchInterval: options?.refetchInterval ?? 10 * 60 * 1000, // 10 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

/**
 * Hook for getting agent performance metrics
 */
export function useAgentPerformanceMetrics(
  agentType: AgentType,
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: feedbackQueryKeys.agentMetrics(agentType, startDate, endDate),
    queryFn: async (): Promise<AgentPerformanceMetrics> => {
      const { data, error } = await FeedbackAnalyticsService.getAgentPerformanceMetrics(
        agentType,
        startDate,
        endDate
      );
      
      if (error) throw error;
      if (!data) throw new Error('No agent performance metrics available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
}

/**
 * Hook for getting learning example analytics
 */
export function useLearningExampleAnalytics(
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: feedbackQueryKeys.learningAnalytics(),
    queryFn: async (): Promise<LearningExampleAnalytics> => {
      const { data, error } = await FeedbackAnalyticsService.getLearningExampleAnalytics();
      if (error) throw error;
      if (!data) throw new Error('No learning example analytics available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 15 * 60 * 1000, // 15 minutes
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}

/**
 * Hook for getting learning examples for specific agent
 */
export function useLearningExamples(
  agentType: AgentType,
  limit: number = 100,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: feedbackQueryKeys.learningExamples(agentType, limit),
    queryFn: async (): Promise<FeedbackLearningExample[]> => {
      const { data, error } = await FeedbackService.getLearningExamples(agentType, limit);
      if (error) throw error;
      if (!data) throw new Error('No learning examples available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 30 * 60 * 1000, // 30 minutes
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
  });
}

/**
 * Hook for correlation analysis
 */
export function useFeedbackCorrelationAnalysis(
  correlationType: 'user_behavior' | 'agent_performance' | 'system_patterns' | 'temporal_patterns',
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: feedbackQueryKeys.correlationAnalysis(correlationType, startDate, endDate),
    queryFn: async (): Promise<FeedbackCorrelationAnalysis> => {
      const { data, error } = await FeedbackAnalyticsService.getFeedbackCorrelationAnalysis(
        correlationType,
        startDate,
        endDate
      );
      
      if (error) throw error;
      if (!data) throw new Error('No correlation analysis data available');
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 60 * 60 * 1000, // 1 hour
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
  });
}

/**
 * Hook for comprehensive feedback analytics
 */
export function useFeedbackAnalytics(
  query?: {
    user_id?: string;
    event_types?: FeedbackEventType[];
    agent_types?: AgentType[];
    start_date?: string;
    end_date?: string;
    feedback_values?: FeedbackValue[];
    limit?: number;
  },
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: feedbackQueryKeys.feedbackAnalytics(query),
    queryFn: async () => {
      const { data, error } = await FeedbackService.getFeedbackAnalytics(query || {});
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
}

// =====================================================
// PATTERN ANALYSIS HOOKS
// =====================================================

/**
 * Hook for analyzing feedback patterns
 */
export function useAnalyzeFeedbackPatterns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      time_window_hours?: number;
      min_event_count?: number;
      confidence_threshold?: number;
      pattern_types?: string[];
    } = {}) => {
      const { data, error } = await FeedbackService.analyzeFeedbackPatterns(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate pattern-related queries
      queryClient.invalidateQueries({ 
        queryKey: [...feedbackQueryKeys.all, 'patterns'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...feedbackQueryKeys.all, 'correlation'] 
      });
    },
    onError: (error) => {
      console.error('Error analyzing feedback patterns:', error);
    },
  });
}

// =====================================================
// REPORTING HOOKS
// =====================================================

/**
 * Hook for generating feedback reports
 */
export function useGenerateFeedbackReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      reportType: 'executive_summary' | 'detailed_analysis' | 'agent_performance' | 'user_insights';
      format?: 'json' | 'csv';
      startDate?: string;
      endDate?: string;
    }) => {
      const { data, error } = await FeedbackAnalyticsService.generateFeedbackReport(
        params.reportType,
        params.format,
        params.startDate,
        params.endDate
      );
      
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Error generating feedback report:', error);
    },
  });
}

/**
 * Hook for exporting feedback data
 */
export function useExportFeedbackData() {
  return useMutation({
    mutationFn: async (params: {
      format?: 'json' | 'csv';
      filters?: {
        user_ids?: string[];
        agent_types?: AgentType[];
        event_types?: FeedbackEventType[];
        feedback_values?: FeedbackValue[];
        start_date?: string;
        end_date?: string;
      };
    }) => {
      const { data, error } = await FeedbackAnalyticsService.exportFeedbackData(
        params.format,
        params.filters
      );
      
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Error exporting feedback data:', error);
    },
  });
}

// =====================================================
// CONVENIENCE HOOKS
// =====================================================

/**
 * Hook for current user's feedback overview
 */
export function useCurrentUserFeedbackOverview(
  startDate?: string,
  endDate?: string
) {
  const [user] = useAtom(userAtom);
  
  const profileQuery = useUserFeedbackProfile(user?.id, startDate, endDate);
  const trendsQuery = useFeedbackTrends('daily', startDate, endDate);
  
  return {
    profile: profileQuery.data,
    trends: trendsQuery.data,
    isLoading: profileQuery.isLoading || trendsQuery.isLoading,
    error: profileQuery.error || trendsQuery.error,
    refetch: () => {
      profileQuery.refetch();
      trendsQuery.refetch();
    },
  };
}

/**
 * Hook for all agent performance metrics
 */
export function useAllAgentPerformanceMetrics(
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const dispatchMetrics = useAgentPerformanceMetrics('dispatch_strategist', startDate, endDate, options);
  const routeMetrics = useAgentPerformanceMetrics('route_optimizer', startDate, endDate, options);
  const inventoryMetrics = useAgentPerformanceMetrics('inventory_specialist', startDate, endDate, options);
  
  return {
    dispatch_strategist: dispatchMetrics.data,
    route_optimizer: routeMetrics.data,
    inventory_specialist: inventoryMetrics.data,
    isLoading: dispatchMetrics.isLoading || routeMetrics.isLoading || inventoryMetrics.isLoading,
    error: dispatchMetrics.error || routeMetrics.error || inventoryMetrics.error,
    refetch: () => {
      dispatchMetrics.refetch();
      routeMetrics.refetch();
      inventoryMetrics.refetch();
    },
  };
}

/**
 * Hook for feedback system monitoring dashboard
 */
export function useFeedbackMonitoringDashboard(
  options?: {
    autoRefresh?: boolean;
    refetchInterval?: number;
  }
) {
  const trendsQuery = useFeedbackTrends('daily', undefined, undefined, {
    refetchInterval: options?.autoRefresh ? (options.refetchInterval || 5 * 60 * 1000) : undefined,
  });
  
  const agentMetricsQuery = useAllAgentPerformanceMetrics(undefined, undefined, {
    refetchInterval: options?.autoRefresh ? (options.refetchInterval || 5 * 60 * 1000) : undefined,
  });
  
  const learningAnalyticsQuery = useLearningExampleAnalytics({
    refetchInterval: options?.autoRefresh ? (options.refetchInterval || 15 * 60 * 1000) : undefined,
  });
  
  return {
    trends: trendsQuery.data,
    agentMetrics: agentMetricsQuery,
    learningAnalytics: learningAnalyticsQuery.data,
    isLoading: trendsQuery.isLoading || agentMetricsQuery.isLoading || learningAnalyticsQuery.isLoading,
    error: trendsQuery.error || agentMetricsQuery.error || learningAnalyticsQuery.error,
    refetch: () => {
      trendsQuery.refetch();
      agentMetricsQuery.refetch();
      learningAnalyticsQuery.refetch();
    },
  };
}

/**
 * Hook for invalidating all feedback-related queries
 */
export function useFeedbackInvalidation() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: feedbackQueryKeys.all });
    },
    invalidateTrends: () => {
      queryClient.invalidateQueries({ queryKey: [...feedbackQueryKeys.all, 'trends'] });
    },
    invalidateUserProfile: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: feedbackQueryKeys.userProfile(userId) });
    },
    invalidateAgentMetrics: (agentType: AgentType) => {
      queryClient.invalidateQueries({ queryKey: feedbackQueryKeys.agentMetrics(agentType) });
    },
    invalidateLearningAnalytics: () => {
      queryClient.invalidateQueries({ queryKey: feedbackQueryKeys.learningAnalytics() });
    },
  };
}

/**
 * Hook for prefetching feedback data
 */
export function usePrefetchFeedback() {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);
  
  return {
    prefetchTrends: (period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily') => {
      queryClient.prefetchQuery({
        queryKey: feedbackQueryKeys.trends(period),
        queryFn: async () => {
          const { data } = await FeedbackAnalyticsService.getFeedbackTrends(period);
          return data;
        },
        staleTime: 2 * 60 * 1000,
      });
    },
    prefetchUserProfile: (userId?: string) => {
      const targetUserId = userId || user?.id;
      if (targetUserId) {
        queryClient.prefetchQuery({
          queryKey: feedbackQueryKeys.userProfile(targetUserId),
          queryFn: async () => {
            const { data } = await FeedbackAnalyticsService.getUserFeedbackProfile(targetUserId);
            return data;
          },
          staleTime: 5 * 60 * 1000,
        });
      }
    },
    prefetchAgentMetrics: (agentType: AgentType) => {
      queryClient.prefetchQuery({
        queryKey: feedbackQueryKeys.agentMetrics(agentType),
        queryFn: async () => {
          const { data } = await FeedbackAnalyticsService.getAgentPerformanceMetrics(agentType);
          return data;
        },
        staleTime: 2 * 60 * 1000,
      });
    },
  };
} 