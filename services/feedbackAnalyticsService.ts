/**
 * Feedback Analytics Service - Advanced Analytics and Reporting
 * 
 * This service provides comprehensive analytics for feedback collection performance,
 * agent effectiveness tracking, user behavior analysis, and learning insights.
 */

import { supabase } from './supabase';
import { 
  UserFeedbackEvent, 
  AgentDecisionContext, 
  FeedbackPattern, 
  FeedbackLearningExample,
  AgentType,
  FeedbackValue,
  FeedbackEventType
} from './feedbackService';

// =====================================================
// ANALYTICS INTERFACES
// =====================================================

export interface FeedbackTrendData {
  date: string;
  total_events: number;
  positive_events: number;
  negative_events: number;
  neutral_events: number;
  positive_rate: number;
  negative_rate: number;
  agent_feedback_count: number;
  ui_feedback_count: number;
  average_confidence: number;
}

export interface FeedbackTrends {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  data_points: FeedbackTrendData[];
  summary: {
    total_events: number;
    overall_positive_rate: number;
    overall_negative_rate: number;
    trend_direction: 'improving' | 'declining' | 'stable';
    significant_changes: Array<{
      date: string;
      change_type: 'spike' | 'drop' | 'improvement';
      description: string;
      impact_score: number;
    }>;
  };
}

export interface UserFeedbackProfile {
  user_id: string;
  profile_period: { start_date: string; end_date: string };
  engagement_metrics: {
    total_feedback_events: number;
    feedback_frequency: number; // events per day
    session_count: number;
    average_session_duration: number;
    most_active_times: string[];
  };
  feedback_patterns: {
    positive_rate: number;
    negative_rate: number;
    preferred_feedback_types: Array<{ type: string; count: number }>;
    common_categories: Array<{ category: string; count: number }>;
  };
  agent_interaction_profile: {
    most_interacted_agents: Array<{ agent_type: AgentType; interaction_count: number }>;
    agent_satisfaction_scores: Record<AgentType, number>;
    modification_patterns: Array<{ agent_type: AgentType; modification_rate: number }>;
  };
  learning_contribution: {
    learning_examples_generated: number;
    high_value_examples: number;
    training_impact_score: number;
  };
  user_expertise_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  behavioral_insights: string[];
}

export interface AgentPerformanceMetrics {
  agent_type: AgentType;
  time_period: { start_date: string; end_date: string };
  performance_overview: {
    total_decisions: number;
    user_satisfaction_rate: number;
    modification_rate: number;
    average_confidence_score: number;
    error_rate: number;
  };
  efficiency_metrics: {
    average_processing_time_ms: number;
    average_token_usage: number;
    average_cost_per_decision: number;
    cache_hit_rate: number;
  };
  quality_metrics: {
    high_confidence_decisions: number;
    low_confidence_decisions: number;
    user_positive_feedback_rate: number;
    learning_examples_generated: number;
  };
  improvement_trends: {
    satisfaction_trend: 'improving' | 'declining' | 'stable';
    efficiency_trend: 'improving' | 'declining' | 'stable';
    confidence_trend: 'improving' | 'declining' | 'stable';
  };
  comparison_metrics: {
    vs_previous_period: {
      satisfaction_change: number;
      efficiency_change: number;
      confidence_change: number;
    };
    vs_other_agents: {
      satisfaction_ranking: number;
      efficiency_ranking: number;
      confidence_ranking: number;
    };
  };
}

export interface LearningExampleAnalytics {
  total_examples: number;
  examples_by_type: Record<string, number>;
  examples_by_agent: Record<AgentType, number>;
  quality_distribution: {
    high_value: number;
    medium_value: number;
    low_value: number;
  };
  validation_status: {
    validated: number;
    pending_validation: number;
    rejected: number;
  };
  usage_analytics: {
    most_used_examples: Array<{ id: string; usage_count: number; effectiveness_score: number }>;
    underutilized_examples: Array<{ id: string; potential_value: number; usage_count: number }>;
  };
}

export interface FeedbackCorrelationAnalysis {
  correlation_type: 'user_behavior' | 'agent_performance' | 'system_patterns' | 'temporal_patterns';
  correlations: Array<{
    factor_a: string;
    factor_b: string;
    correlation_strength: number; // -1 to 1
    correlation_type: 'positive' | 'negative' | 'neutral';
    significance_level: number;
    sample_size: number;
    insights: string[];
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action_type: 'improvement' | 'investigation' | 'monitoring';
    description: string;
    expected_impact: string;
  }>;
}

export interface FeedbackReportData {
  report_type: 'executive_summary' | 'detailed_analysis' | 'agent_performance' | 'user_insights';
  generated_at: string;
  time_period: { start_date: string; end_date: string };
  key_metrics: {
    total_feedback_events: number;
    unique_users: number;
    overall_satisfaction_rate: number;
    agent_performance_summary: Record<AgentType, { satisfaction: number; efficiency: number }>;
  };
  trends: FeedbackTrends;
  top_insights: Array<{
    category: string;
    insight: string;
    impact_level: 'high' | 'medium' | 'low';
    recommended_action: string;
  }>;
  detailed_data?: {
    user_profiles?: UserFeedbackProfile[];
    agent_metrics?: AgentPerformanceMetrics[];
    learning_analytics?: LearningExampleAnalytics;
    correlation_analysis?: FeedbackCorrelationAnalysis;
  };
}

// =====================================================
// FEEDBACK ANALYTICS SERVICE CLASS
// =====================================================

export class FeedbackAnalyticsService {

  /**
   * Get comprehensive feedback trends analysis
   */
  static async getFeedbackTrends(
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: string,
    endDate?: string
  ): Promise<{ data: FeedbackTrends | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Use database function for trend analysis
      const { data: trendData, error: trendError } = await supabase.rpc('get_feedback_trends', {
        p_period: period,
        p_start_date: start,
        p_end_date: end
      });

      if (trendError) throw trendError;

      // Process trend data and calculate summary
      const summary = this.calculateTrendSummary(trendData);
      
      return {
        data: {
          period,
          data_points: trendData || [],
          summary
        },
        error: null
      };
    } catch (error) {
      console.error('Error getting feedback trends:', error);
      return { data: null, error };
    }
  }

  /**
   * Get comprehensive user feedback profile
   */
  static async getUserFeedbackProfile(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: UserFeedbackProfile | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Get user feedback events
      const { data: events, error: eventsError } = await supabase
        .from('user_feedback_events')
        .select(`
          *,
          agent_decision_contexts(*)
        `)
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      if (!events || events.length === 0) {
        return { data: null, error: null };
      }

      // Process events to build comprehensive profile
      const profile = await this.buildUserProfile(userId, events, start, end);
      
      return { data: profile, error: null };
    } catch (error) {
      console.error('Error getting user feedback profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Get agent performance metrics
   */
  static async getAgentPerformanceMetrics(
    agentType: AgentType,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: AgentPerformanceMetrics | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Get agent-specific feedback and decision data
      const { data: agentData, error: agentError } = await supabase
        .from('user_feedback_events')
        .select(`
          *,
          agent_decision_contexts(*)
        `)
        .eq('agent_type', agentType)
        .gte('created_at', start)
        .lte('created_at', end);

      if (agentError) throw agentError;

      // Calculate comprehensive metrics
      const metrics = await this.calculateAgentMetrics(agentType, agentData || [], start, end);
      
      return { data: metrics, error: null };
    } catch (error) {
      console.error('Error getting agent performance metrics:', error);
      return { data: null, error };
    }
  }

  /**
   * Get learning examples analytics
   */
  static async getLearningExampleAnalytics(): Promise<{ data: LearningExampleAnalytics | null; error: any }> {
    try {
      const { data: examples, error: examplesError } = await supabase
        .from('feedback_learning_examples')
        .select('*');

      if (examplesError) throw examplesError;

      const analytics = this.analyzeLearningExamples(examples || []);
      
      return { data: analytics, error: null };
    } catch (error) {
      console.error('Error getting learning example analytics:', error);
      return { data: null, error };
    }
  }

  /**
   * Perform correlation analysis on feedback data
   */
  static async getFeedbackCorrelationAnalysis(
    correlationType: 'user_behavior' | 'agent_performance' | 'system_patterns' | 'temporal_patterns',
    startDate?: string,
    endDate?: string
  ): Promise<{ data: FeedbackCorrelationAnalysis | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Get relevant data for correlation analysis
      const { data: feedbackData, error: dataError } = await supabase
        .from('user_feedback_events')
        .select(`
          *,
          agent_decision_contexts(*),
          feedback_session_analytics(*)
        `)
        .gte('created_at', start)
        .lte('created_at', end);

      if (dataError) throw dataError;

      // Perform correlation analysis
      const analysis = await this.performCorrelationAnalysis(correlationType, feedbackData || []);
      
      return { data: analysis, error: null };
    } catch (error) {
      console.error('Error performing correlation analysis:', error);
      return { data: null, error };
    }
  }

  /**
   * Generate comprehensive feedback report
   */
  static async generateFeedbackReport(
    reportType: 'executive_summary' | 'detailed_analysis' | 'agent_performance' | 'user_insights',
    format: 'json' | 'csv' = 'json',
    startDate?: string,
    endDate?: string
  ): Promise<{ data: FeedbackReportData | string | null; error: any }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      // Gather comprehensive data
      const [trendsResult, agentMetricsResults, learningAnalytics] = await Promise.all([
        this.getFeedbackTrends('daily', start, end),
        Promise.all([
          this.getAgentPerformanceMetrics('dispatch_strategist', start, end),
          this.getAgentPerformanceMetrics('route_optimizer', start, end),
          this.getAgentPerformanceMetrics('inventory_specialist', start, end)
        ]),
        this.getLearningExampleAnalytics()
      ]);

      // Build report data
      const reportData = await this.buildFeedbackReport(
        reportType,
        {
          trends: trendsResult.data,
          agentMetrics: agentMetricsResults.map(r => r.data).filter(Boolean),
          learningAnalytics: learningAnalytics.data,
          timePeriod: { start_date: start, end_date: end }
        }
      );

      if (format === 'csv') {
        const csvData = this.convertReportToCSV(reportData);
        return { data: csvData, error: null };
      }

      return { data: reportData, error: null };
    } catch (error) {
      console.error('Error generating feedback report:', error);
      return { data: null, error };
    }
  }

  /**
   * Export feedback data for external analysis
   */
  static async exportFeedbackData(
    format: 'json' | 'csv' = 'json',
    filters?: {
      user_ids?: string[];
      agent_types?: AgentType[];
      event_types?: FeedbackEventType[];
      feedback_values?: FeedbackValue[];
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{ data: any; error: any }> {
    try {
      let query = supabase
        .from('user_feedback_events')
        .select(`
          *,
          agent_decision_contexts(*),
          feedback_session_analytics(*)
        `);

      // Apply filters
      if (filters?.user_ids?.length) {
        query = query.in('user_id', filters.user_ids);
      }
      if (filters?.agent_types?.length) {
        query = query.in('agent_type', filters.agent_types);
      }
      if (filters?.event_types?.length) {
        query = query.in('event_type', filters.event_types);
      }
      if (filters?.feedback_values?.length) {
        query = query.in('feedback_value', filters.feedback_values);
      }
      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(10000); // Reasonable limit for exports

      if (error) throw error;

      if (format === 'csv') {
        const csvData = this.convertFeedbackDataToCSV(data || []);
        return { data: csvData, error: null };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error exporting feedback data:', error);
      return { data: null, error };
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private static calculateTrendSummary(trendData: FeedbackTrendData[]): FeedbackTrends['summary'] {
    if (!trendData || trendData.length === 0) {
      return {
        total_events: 0,
        overall_positive_rate: 0,
        overall_negative_rate: 0,
        trend_direction: 'stable',
        significant_changes: []
      };
    }

    const totalEvents = trendData.reduce((sum, d) => sum + d.total_events, 0);
    const totalPositive = trendData.reduce((sum, d) => sum + d.positive_events, 0);
    const totalNegative = trendData.reduce((sum, d) => sum + d.negative_events, 0);

    const overallPositiveRate = totalEvents > 0 ? (totalPositive / totalEvents) * 100 : 0;
    const overallNegativeRate = totalEvents > 0 ? (totalNegative / totalEvents) * 100 : 0;

    // Calculate trend direction
    const recentData = trendData.slice(-7); // Last 7 data points
    const earlyData = trendData.slice(0, 7); // First 7 data points
    
    const recentAvg = recentData.reduce((sum, d) => sum + d.positive_rate, 0) / recentData.length;
    const earlyAvg = earlyData.reduce((sum, d) => sum + d.positive_rate, 0) / earlyData.length;
    
    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > earlyAvg + 5) trendDirection = 'improving';
    else if (recentAvg < earlyAvg - 5) trendDirection = 'declining';

    return {
      total_events: totalEvents,
      overall_positive_rate: overallPositiveRate,
      overall_negative_rate: overallNegativeRate,
      trend_direction: trendDirection,
      significant_changes: [] // Would implement anomaly detection here
    };
  }

  private static async buildUserProfile(
    userId: string,
    events: any[],
    startDate: string,
    endDate: string
  ): Promise<UserFeedbackProfile> {
    // Calculate engagement metrics
    const sessions = new Set(events.map(e => e.session_id));
    const totalEvents = events.length;
    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const feedbackFrequency = totalEvents / Math.max(daysDiff, 1);

    // Calculate feedback patterns
    const positiveCount = events.filter(e => e.feedback_value === 'positive').length;
    const negativeCount = events.filter(e => e.feedback_value === 'negative').length;
    const positiveRate = totalEvents > 0 ? (positiveCount / totalEvents) * 100 : 0;
    const negativeRate = totalEvents > 0 ? (negativeCount / totalEvents) * 100 : 0;

    // Calculate agent interactions
    const agentInteractions = events.reduce((acc, e) => {
      if (e.agent_type) {
        acc[e.agent_type] = (acc[e.agent_type] || 0) + 1;
      }
      return acc;
    }, {} as Record<AgentType, number>);

    // Determine expertise level
    let expertiseLevel: UserFeedbackProfile['user_expertise_level'] = 'beginner';
    if (totalEvents > 100) expertiseLevel = 'expert';
    else if (totalEvents > 50) expertiseLevel = 'advanced';
    else if (totalEvents > 20) expertiseLevel = 'intermediate';

    return {
      user_id: userId,
      profile_period: { start_date: startDate, end_date: endDate },
      engagement_metrics: {
        total_feedback_events: totalEvents,
        feedback_frequency: feedbackFrequency,
        session_count: sessions.size,
        average_session_duration: 0, // Would calculate from session analytics
        most_active_times: []
      },
      feedback_patterns: {
        positive_rate: positiveRate,
        negative_rate: negativeRate,
        preferred_feedback_types: [],
        common_categories: []
      },
      agent_interaction_profile: {
        most_interacted_agents: Object.entries(agentInteractions).map(([agent, count]) => ({
          agent_type: agent as AgentType,
          interaction_count: count
        })),
        agent_satisfaction_scores: {} as Record<AgentType, number>,
        modification_patterns: []
      },
      learning_contribution: {
        learning_examples_generated: 0,
        high_value_examples: 0,
        training_impact_score: 0
      },
      user_expertise_level: expertiseLevel,
      behavioral_insights: []
    };
  }

  private static async calculateAgentMetrics(
    agentType: AgentType,
    events: any[],
    startDate: string,
    endDate: string
  ): Promise<AgentPerformanceMetrics> {
    const totalDecisions = events.length;
    const positiveEvents = events.filter(e => e.feedback_value === 'positive').length;
    const modificationsCount = events.filter(e => e.user_modification).length;
    
    const satisfactionRate = totalDecisions > 0 ? (positiveEvents / totalDecisions) * 100 : 0;
    const modificationRate = totalDecisions > 0 ? (modificationsCount / totalDecisions) * 100 : 0;

    return {
      agent_type: agentType,
      time_period: { start_date: startDate, end_date: endDate },
      performance_overview: {
        total_decisions: totalDecisions,
        user_satisfaction_rate: satisfactionRate,
        modification_rate: modificationRate,
        average_confidence_score: 0,
        error_rate: 0
      },
      efficiency_metrics: {
        average_processing_time_ms: 0,
        average_token_usage: 0,
        average_cost_per_decision: 0,
        cache_hit_rate: 0
      },
      quality_metrics: {
        high_confidence_decisions: 0,
        low_confidence_decisions: 0,
        user_positive_feedback_rate: satisfactionRate,
        learning_examples_generated: 0
      },
      improvement_trends: {
        satisfaction_trend: 'stable',
        efficiency_trend: 'stable',
        confidence_trend: 'stable'
      },
      comparison_metrics: {
        vs_previous_period: {
          satisfaction_change: 0,
          efficiency_change: 0,
          confidence_change: 0
        },
        vs_other_agents: {
          satisfaction_ranking: 1,
          efficiency_ranking: 1,
          confidence_ranking: 1
        }
      }
    };
  }

  private static analyzeLearningExamples(examples: any[]): LearningExampleAnalytics {
    const totalExamples = examples.length;
    const examplesByType = examples.reduce((acc, e) => {
      acc[e.example_type] = (acc[e.example_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_examples: totalExamples,
      examples_by_type: examplesByType,
      examples_by_agent: {} as Record<AgentType, number>,
      quality_distribution: {
        high_value: examples.filter(e => e.learning_value_score > 0.8).length,
        medium_value: examples.filter(e => e.learning_value_score > 0.5 && e.learning_value_score <= 0.8).length,
        low_value: examples.filter(e => e.learning_value_score <= 0.5).length
      },
      validation_status: {
        validated: examples.filter(e => e.validated).length,
        pending_validation: examples.filter(e => !e.validated).length,
        rejected: 0
      },
      usage_analytics: {
        most_used_examples: [],
        underutilized_examples: []
      }
    };
  }

  private static async performCorrelationAnalysis(
    correlationType: string,
    feedbackData: any[]
  ): Promise<FeedbackCorrelationAnalysis> {
    // Placeholder for sophisticated correlation analysis
    // In a real implementation, this would use statistical methods
    return {
      correlation_type: correlationType as any,
      correlations: [],
      recommendations: []
    };
  }

  private static async buildFeedbackReport(
    reportType: string,
    data: any
  ): Promise<FeedbackReportData> {
    return {
      report_type: reportType as any,
      generated_at: new Date().toISOString(),
      time_period: data.timePeriod,
      key_metrics: {
        total_feedback_events: 0,
        unique_users: 0,
        overall_satisfaction_rate: 0,
        agent_performance_summary: {} as Record<AgentType, { satisfaction: number; efficiency: number }>
      },
      trends: data.trends,
      top_insights: [],
      detailed_data: {
        agent_metrics: data.agentMetrics,
        learning_analytics: data.learningAnalytics
      }
    };
  }

  private static convertReportToCSV(reportData: FeedbackReportData): string {
    // Implement CSV conversion logic
    return 'CSV conversion not implemented';
  }

  private static convertFeedbackDataToCSV(data: any[]): string {
    // Implement CSV conversion logic
    return 'CSV conversion not implemented';
  }
} 