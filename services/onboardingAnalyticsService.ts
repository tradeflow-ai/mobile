/**
 * Onboarding Analytics Service - Advanced Analytics and Monitoring
 * 
 * This service provides comprehensive analytics for onboarding flow performance,
 * funnel analysis, completion tracking, and drop-off identification.
 */

import { supabase } from './supabase';
import { OnboardingAnalyticsEvent } from './onboardingService';

// =====================================================
// ANALYTICS INTERFACES
// =====================================================

export interface FunnelStepData {
  step_name: string;
  step_order: number;
  started_count: number;
  completed_count: number;
  skipped_count: number;
  abandoned_count: number;
  conversion_rate: number;
  average_time_seconds: number;
  drop_off_rate: number;
}

export interface OnboardingFunnelAnalytics {
  total_users_started: number;
  total_users_completed: number;
  overall_completion_rate: number;
  overall_drop_off_rate: number;
  average_completion_time_minutes: number;
  steps: FunnelStepData[];
  time_period: {
    start_date: string;
    end_date: string;
  };
}

export interface CompletionRateMetrics {
  period: 'daily' | 'weekly' | 'monthly';
  data_points: Array<{
    date: string;
    started_count: number;
    completed_count: number;
    completion_rate: number;
    average_completion_time_minutes: number;
  }>;
}

export interface DropOffAnalysis {
  step_name: string;
  drop_off_count: number;
  drop_off_rate: number;
  common_exit_points: Array<{
    step_name: string;
    count: number;
    percentage: number;
  }>;
  session_duration_before_drop_off: number;
  common_validation_errors: Record<string, number>;
}

export interface UserJourneyAnalytics {
  user_id: string;
  journey_events: OnboardingAnalyticsEvent[];
  total_time_spent_minutes: number;
  steps_completed: string[];
  steps_skipped: string[];
  completion_status: 'completed' | 'abandoned' | 'in_progress';
  last_active_step: string;
  drop_off_point?: string;
  platform: string;
  onboarding_version: string;
}

export interface OnboardingPerformanceMetrics {
  overview: {
    total_users_started: number;
    total_users_completed: number;
    active_users_in_progress: number;
    overall_completion_rate: number;
    average_completion_time_minutes: number;
  };
  step_performance: FunnelStepData[];
  time_trends: CompletionRateMetrics;
  drop_off_analysis: DropOffAnalysis[];
  platform_breakdown: Record<string, {
    users: number;
    completion_rate: number;
    average_time_minutes: number;
  }>;
  version_performance: Record<string, {
    users: number;
    completion_rate: number;
    avg_time_minutes: number;
  }>;
}

export interface OnboardingExportData {
  users: Array<{
    user_id: string;
    started_at: string;
    completed_at?: string;
    completion_status: string;
    completion_score: number;
    steps_completed: string[];
    steps_skipped: string[];
    total_time_minutes: number;
    platform: string;
    onboarding_version: string;
  }>;
  events: OnboardingAnalyticsEvent[];
  summary: OnboardingPerformanceMetrics;
  export_metadata: {
    generated_at: string;
    period_start: string;
    period_end: string;
    total_records: number;
  };
}

// =====================================================
// ONBOARDING ANALYTICS SERVICE CLASS
// =====================================================

export class OnboardingAnalyticsService {

  /**
   * Get comprehensive funnel analytics for onboarding flow
   */
  static async getFunnelAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<{ data: OnboardingFunnelAnalytics | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const end = endDate || new Date().toISOString();

      // Get all analytics events in the time period
      const { data: events, error: eventsError } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .gte('event_timestamp', start)
        .lte('event_timestamp', end)
        .order('event_timestamp', { ascending: true });

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        return {
          data: {
            total_users_started: 0,
            total_users_completed: 0,
            overall_completion_rate: 0,
            overall_drop_off_rate: 0,
            average_completion_time_minutes: 0,
            steps: [],
            time_period: { start_date: start, end_date: end },
          },
          error: null,
        };
      }

      // Process events to calculate funnel metrics
      const userJourneys = this.processUserJourneys(events);
      
      // Calculate overall metrics
      const totalStarted = userJourneys.filter(j => j.journey_events.some(e => e.event_type === 'onboarding_started')).length;
      const totalCompleted = userJourneys.filter(j => j.completion_status === 'completed').length;
      const overallCompletionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;
      
      // Calculate average completion time
      const completedJourneys = userJourneys.filter(j => j.completion_status === 'completed');
      const avgCompletionTime = completedJourneys.length > 0 
        ? completedJourneys.reduce((sum, j) => sum + j.total_time_spent_minutes, 0) / completedJourneys.length 
        : 0;

      // Calculate step-by-step funnel data
      const steps = await this.calculateStepFunnelData(events);

      return {
        data: {
          total_users_started: totalStarted,
          total_users_completed: totalCompleted,
          overall_completion_rate: overallCompletionRate,
          overall_drop_off_rate: 100 - overallCompletionRate,
          average_completion_time_minutes: avgCompletionTime,
          steps,
          time_period: { start_date: start, end_date: end },
        },
        error: null,
      };
    } catch (error) {
      console.error('Error getting funnel analytics:', error);
      return { data: null, error };
    }
  }

  /**
   * Get completion rate trends over time
   */
  static async getCompletionRateTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: string,
    endDate?: string
  ): Promise<{ data: CompletionRateMetrics | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      let dateFormat: string;
      let intervalQuery: string;

      switch (period) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          intervalQuery = '1 day';
          break;
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          intervalQuery = '1 week';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          intervalQuery = '1 month';
          break;
      }

      // Query completion trends using SQL aggregation
      const { data, error } = await supabase.rpc('get_onboarding_completion_trends', {
        start_date: start,
        end_date: end,
        date_format: dateFormat,
        interval_duration: intervalQuery,
      });

      if (error) throw error;

      return {
        data: {
          period,
          data_points: data || [],
        },
        error: null,
      };
    } catch (error) {
      console.error('Error getting completion rate trends:', error);
      return { data: null, error };
    }
  }

  /**
   * Identify drop-off points and analyze user abandonment
   */
  static async getDropOffAnalysis(
    startDate?: string,
    endDate?: string
  ): Promise<{ data: DropOffAnalysis[] | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Get all analytics events in the time period
      const { data: events, error: eventsError } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .gte('event_timestamp', start)
        .lte('event_timestamp', end)
        .order('event_timestamp', { ascending: true });

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        return { data: [], error: null };
      }

      // Process user journeys to identify drop-off points
      const userJourneys = this.processUserJourneys(events);
      const abandonedJourneys = userJourneys.filter(j => j.completion_status === 'abandoned');

      // Analyze drop-off by step
      const stepAnalysis: Record<string, DropOffAnalysis> = {};
      const steps = ['work-schedule', 'time-buffers', 'suppliers'];

      for (const step of steps) {
        const stepAbandonments = abandonedJourneys.filter(j => j.drop_off_point === step);
        const totalUsersReachedStep = userJourneys.filter(j => 
          j.journey_events.some(e => e.step_name === step && e.event_type === 'step_started')
        ).length;

        // Calculate common exit points
        const exitPoints: Record<string, number> = {};
        stepAbandonments.forEach(journey => {
          const lastEvent = journey.journey_events[journey.journey_events.length - 1];
          const exitPoint = lastEvent.step_name || 'unknown';
          exitPoints[exitPoint] = (exitPoints[exitPoint] || 0) + 1;
        });

        const commonExitPoints = Object.entries(exitPoints)
          .map(([step_name, count]) => ({
            step_name,
            count,
            percentage: totalUsersReachedStep > 0 ? (count / totalUsersReachedStep) * 100 : 0,
          }))
          .sort((a, b) => b.count - a.count);

        // Calculate average session duration before drop-off
        const avgSessionDuration = stepAbandonments.length > 0 
          ? stepAbandonments.reduce((sum, j) => sum + j.total_time_spent_minutes, 0) / stepAbandonments.length * 60
          : 0;

        // Collect common validation errors
        const validationErrors: Record<string, number> = {};
        stepAbandonments.forEach(journey => {
          journey.journey_events.forEach(event => {
            if (event.validation_errors) {
              Object.keys(event.validation_errors).forEach(error => {
                validationErrors[error] = (validationErrors[error] || 0) + 1;
              });
            }
          });
        });

        stepAnalysis[step] = {
          step_name: step,
          drop_off_count: stepAbandonments.length,
          drop_off_rate: totalUsersReachedStep > 0 ? (stepAbandonments.length / totalUsersReachedStep) * 100 : 0,
          common_exit_points: commonExitPoints,
          session_duration_before_drop_off: avgSessionDuration,
          common_validation_errors: validationErrors,
        };
      }

      return {
        data: Object.values(stepAnalysis),
        error: null,
      };
    } catch (error) {
      console.error('Error getting drop-off analysis:', error);
      return { data: null, error };
    }
  }

  /**
   * Get comprehensive onboarding performance metrics
   */
  static async getPerformanceMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<{ data: OnboardingPerformanceMetrics | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Get funnel analytics
      const { data: funnelData, error: funnelError } = await this.getFunnelAnalytics(start, end);
      if (funnelError) throw funnelError;

      // Get completion rate trends
      const { data: trendsData, error: trendsError } = await this.getCompletionRateTrends('daily', start, end);
      if (trendsError) throw trendsError;

      // Get drop-off analysis
      const { data: dropOffData, error: dropOffError } = await this.getDropOffAnalysis(start, end);
      if (dropOffError) throw dropOffError;

      // Get all events for platform and version analysis
      const { data: events, error: eventsError } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .gte('event_timestamp', start)
        .lte('event_timestamp', end);

      if (eventsError) throw eventsError;

      // Calculate platform breakdown
      const platformBreakdown = this.calculatePlatformBreakdown(events || []);

      // Calculate version performance
      const versionPerformance = this.calculateVersionPerformance(events || []);

      // Count active users in progress
      const { data: activeUsers, error: activeError } = await supabase
        .from('onboarding_preferences')
        .select('user_id')
        .eq('is_completed', false)
        .gte('last_accessed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (activeError) throw activeError;

      return {
        data: {
          overview: {
            total_users_started: funnelData?.total_users_started || 0,
            total_users_completed: funnelData?.total_users_completed || 0,
            active_users_in_progress: activeUsers?.length || 0,
            overall_completion_rate: funnelData?.overall_completion_rate || 0,
            average_completion_time_minutes: funnelData?.average_completion_time_minutes || 0,
          },
          step_performance: funnelData?.steps || [],
          time_trends: trendsData || { period: 'daily', data_points: [] },
          drop_off_analysis: dropOffData || [],
          platform_breakdown: platformBreakdown,
          version_performance: versionPerformance,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return { data: null, error };
    }
  }

  /**
   * Export onboarding data for analysis
   */
  static async exportOnboardingData(
    format: 'json' | 'csv' = 'json',
    startDate?: string,
    endDate?: string
  ): Promise<{ data: OnboardingExportData | string | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Get all onboarding preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('onboarding_preferences')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

      if (preferencesError) throw preferencesError;

      // Get all analytics events
      const { data: events, error: eventsError } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .gte('event_timestamp', start)
        .lte('event_timestamp', end);

      if (eventsError) throw eventsError;

      // Get performance metrics
      const { data: metrics, error: metricsError } = await this.getPerformanceMetrics(start, end);
      if (metricsError) throw metricsError;

      // Process user data
      const users = (preferences || []).map(pref => {
        const userEvents = (events || []).filter(e => e.user_id === pref.user_id);
        const startEvent = userEvents.find(e => e.event_type === 'onboarding_started');
        const completionEvent = userEvents.find(e => e.event_type === 'onboarding_completed');
        
        const totalTime = userEvents.length > 0
          ? userEvents.reduce((sum, e) => sum + (e.time_spent_seconds || 0), 0) / 60
          : 0;

        return {
          user_id: pref.user_id,
          started_at: pref.started_at,
          completed_at: pref.completed_at,
          completion_status: pref.is_completed ? 'completed' : 'abandoned',
          completion_score: pref.completion_score,
          steps_completed: pref.steps_completed,
          steps_skipped: Object.keys(pref.skip_reasons || {}),
          total_time_minutes: totalTime,
          platform: userEvents[0]?.platform || 'unknown',
          onboarding_version: pref.onboarding_version,
        };
      });

      const exportData: OnboardingExportData = {
        users,
        events: events || [],
        summary: metrics || {} as OnboardingPerformanceMetrics,
        export_metadata: {
          generated_at: new Date().toISOString(),
          period_start: start,
          period_end: end,
          total_records: users.length,
        },
      };

      if (format === 'csv') {
        const csvData = this.convertToCSV(exportData);
        return { data: csvData, error: null };
      }

      return { data: exportData, error: null };
    } catch (error) {
      console.error('Error exporting onboarding data:', error);
      return { data: null, error };
    }
  }

  /**
   * Get individual user journey analytics
   */
  static async getUserJourney(userId: string): Promise<{ data: UserJourneyAnalytics | null; error: any }> {
    try {
      // Get user's analytics events
      const { data: events, error: eventsError } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('event_timestamp', { ascending: true });

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        return { data: null, error: null };
      }

      // Process user journey
      const journey = this.processUserJourneys(events)[0];
      
      return { data: journey, error: null };
    } catch (error) {
      console.error('Error getting user journey:', error);
      return { data: null, error };
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Process analytics events into user journeys
   */
  private static processUserJourneys(events: OnboardingAnalyticsEvent[]): UserJourneyAnalytics[] {
    const userGroups = events.reduce((groups, event) => {
      if (!groups[event.user_id]) {
        groups[event.user_id] = [];
      }
      groups[event.user_id].push(event);
      return groups;
    }, {} as Record<string, OnboardingAnalyticsEvent[]>);

    return Object.entries(userGroups).map(([userId, userEvents]) => {
      const sortedEvents = userEvents.sort((a, b) => 
        new Date(a.event_timestamp || '').getTime() - new Date(b.event_timestamp || '').getTime()
      );

      const totalTime = sortedEvents.reduce((sum, e) => sum + (e.time_spent_seconds || 0), 0) / 60;
      const stepsCompleted = [...new Set(
        sortedEvents.filter(e => e.event_type === 'step_completed').map(e => e.step_name).filter(Boolean)
      )];
      const stepsSkipped = [...new Set(
        sortedEvents.filter(e => e.event_type === 'step_skipped').map(e => e.step_name).filter(Boolean)
      )];

      const hasCompleted = sortedEvents.some(e => e.event_type === 'onboarding_completed');
      const hasAbandoned = sortedEvents.some(e => e.event_type === 'onboarding_abandoned');
      
      let completionStatus: 'completed' | 'abandoned' | 'in_progress';
      if (hasCompleted) {
        completionStatus = 'completed';
      } else if (hasAbandoned) {
        completionStatus = 'abandoned';
      } else {
        completionStatus = 'in_progress';
      }

      const lastEvent = sortedEvents[sortedEvents.length - 1];
      const lastActiveStep = lastEvent.step_name || 'unknown';
      
      const dropOffPoint = completionStatus === 'abandoned' ? lastActiveStep : undefined;

      return {
        user_id: userId,
        journey_events: sortedEvents,
        total_time_spent_minutes: totalTime,
        steps_completed: stepsCompleted,
        steps_skipped: stepsSkipped,
        completion_status: completionStatus,
        last_active_step: lastActiveStep,
        drop_off_point: dropOffPoint,
        platform: lastEvent.platform || 'unknown',
        onboarding_version: lastEvent.onboarding_version || '1.0',
      };
    });
  }

  /**
   * Calculate step-by-step funnel data
   */
  private static async calculateStepFunnelData(events: OnboardingAnalyticsEvent[]): Promise<FunnelStepData[]> {
    const steps = ['work-schedule', 'time-buffers', 'suppliers'];
    const stepData: FunnelStepData[] = [];

    for (let i = 0; i < steps.length; i++) {
      const stepName = steps[i];
      
      const startedEvents = events.filter(e => e.step_name === stepName && e.event_type === 'step_started');
      const completedEvents = events.filter(e => e.step_name === stepName && e.event_type === 'step_completed');
      const skippedEvents = events.filter(e => e.step_name === stepName && e.event_type === 'step_skipped');
      
      const startedCount = startedEvents.length;
      const completedCount = completedEvents.length;
      const skippedCount = skippedEvents.length;
      
      // Calculate average time spent on step
      const stepTimes = events.filter(e => e.step_name === stepName && e.time_spent_seconds)
        .map(e => e.time_spent_seconds || 0);
      const avgTime = stepTimes.length > 0 
        ? stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length 
        : 0;

      const conversionRate = startedCount > 0 ? ((completedCount + skippedCount) / startedCount) * 100 : 0;
      const abandonedCount = Math.max(0, startedCount - completedCount - skippedCount);
      const dropOffRate = startedCount > 0 ? (abandonedCount / startedCount) * 100 : 0;

      stepData.push({
        step_name: stepName,
        step_order: i + 1,
        started_count: startedCount,
        completed_count: completedCount,
        skipped_count: skippedCount,
        abandoned_count: abandonedCount,
        conversion_rate: conversionRate,
        average_time_seconds: avgTime,
        drop_off_rate: dropOffRate,
      });
    }

    return stepData;
  }

  /**
   * Calculate platform breakdown
   */
  private static calculatePlatformBreakdown(
    events: OnboardingAnalyticsEvent[]
  ): Record<string, { users: number; completion_rate: number; average_time_minutes: number }> {
    const userJourneys = this.processUserJourneys(events);
    const platformGroups = userJourneys.reduce((groups, journey) => {
      const platform = journey.platform || 'unknown';
      if (!groups[platform]) {
        groups[platform] = [];
      }
      groups[platform].push(journey);
      return groups;
    }, {} as Record<string, UserJourneyAnalytics[]>);

    const breakdown: Record<string, { users: number; completion_rate: number; average_time_minutes: number }> = {};

    Object.entries(platformGroups).forEach(([platform, journeys]) => {
      const totalUsers = journeys.length;
      const completedUsers = journeys.filter(j => j.completion_status === 'completed').length;
      const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;
      const avgTime = totalUsers > 0 
        ? journeys.reduce((sum, j) => sum + j.total_time_spent_minutes, 0) / totalUsers 
        : 0;

      breakdown[platform] = {
        users: totalUsers,
        completion_rate: completionRate,
        average_time_minutes: avgTime,
      };
    });

    return breakdown;
  }

  /**
   * Calculate version performance
   */
  private static calculateVersionPerformance(
    events: OnboardingAnalyticsEvent[]
  ): Record<string, { users: number; completion_rate: number; avg_time_minutes: number }> {
    const userJourneys = this.processUserJourneys(events);
    const versionGroups = userJourneys.reduce((groups, journey) => {
      const version = journey.onboarding_version || '1.0';
      if (!groups[version]) {
        groups[version] = [];
      }
      groups[version].push(journey);
      return groups;
    }, {} as Record<string, UserJourneyAnalytics[]>);

    const performance: Record<string, { users: number; completion_rate: number; avg_time_minutes: number }> = {};

    Object.entries(versionGroups).forEach(([version, journeys]) => {
      const totalUsers = journeys.length;
      const completedUsers = journeys.filter(j => j.completion_status === 'completed').length;
      const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;
      const avgTime = totalUsers > 0 
        ? journeys.reduce((sum, j) => sum + j.total_time_spent_minutes, 0) / totalUsers 
        : 0;

      performance[version] = {
        users: totalUsers,
        completion_rate: completionRate,
        avg_time_minutes: avgTime,
      };
    });

    return performance;
  }

  /**
   * Convert export data to CSV format
   */
  private static convertToCSV(data: OnboardingExportData): string {
    const headers = [
      'user_id', 'started_at', 'completed_at', 'completion_status', 'completion_score',
      'steps_completed', 'steps_skipped', 'total_time_minutes', 'platform', 'onboarding_version'
    ];

    const csvRows = [
      headers.join(','),
      ...data.users.map(user => [
        user.user_id,
        user.started_at,
        user.completed_at || '',
        user.completion_status,
        user.completion_score,
        user.steps_completed.join(';'),
        user.steps_skipped.join(';'),
        user.total_time_minutes,
        user.platform,
        user.onboarding_version,
      ].map(field => `"${field}"`).join(','))
    ];

    return csvRows.join('\n');
  }
} 