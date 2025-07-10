/**
 * Feedback Service - Comprehensive Feedback Collection and Analysis
 * 
 * This service manages user feedback collection, agent decision tracking,
 * pattern analysis, and learning example generation for the TradeFlow app.
 */

import { supabase } from './supabase';

// =====================================================
// TYPESCRIPT INTERFACES
// =====================================================

// Core feedback event types
export type FeedbackEventType = 
  | 'agent_feedback'
  | 'ui_feedback' 
  | 'system_feedback'
  | 'data_feedback'
  | 'workflow_feedback';

export type AgentType = 
  | 'dispatch_strategist'
  | 'route_optimizer'
  | 'inventory_specialist';

export type FeedbackValue = 'positive' | 'neutral' | 'negative';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

// User feedback event interface
export interface UserFeedbackEvent {
  id?: string;
  user_id: string;
  session_id: string;
  event_type: FeedbackEventType;
  interaction_type: string;
  feedback_category: string;
  feedback_subcategory: string;
  timestamp?: string;
  event_sequence_number?: number;
  
  // Event data (flexible for different event types)
  event_data: Record<string, any>;
  event_metadata: Record<string, any>;
  
  // Context information
  user_context: Record<string, any>;
  system_context: Record<string, any>;
  environmental_context: Record<string, any>;
  
  // Agent-specific information (optional)
  agent_type?: AgentType;
  agent_version?: string;
  agent_confidence?: number;
  original_decision?: Record<string, any>;
  user_modification?: Record<string, any>;
  
  // Auto-computed fields
  feedback_value?: FeedbackValue;
  confidence_level?: ConfidenceLevel;
  priority_level?: PriorityLevel;
  
  // Processing status
  processed?: boolean;
  processed_at?: string;
  analysis_result?: Record<string, any>;
  
  created_at?: string;
  updated_at?: string;
}

// Agent decision context interface
export interface AgentDecisionContext {
  id?: string;
  feedback_event_id: string;
  agent_type: AgentType;
  agent_version: string;
  decision_id: string;
  decision_timestamp: string;
  input_data: Record<string, any>;
  processing_time_ms?: number;
  
  // Decision details
  decision_output: Record<string, any>;
  confidence_score: number;
  alternative_options?: Record<string, any>[];
  reasoning_explanation?: string;
  
  // User preferences at time of decision
  user_preferences_snapshot: Record<string, any>;
  preference_influence_score?: number;
  
  // External factors
  external_data_used?: Record<string, any>;
  api_calls_made?: Record<string, any>[];
  error_conditions?: Record<string, any>[];
  
  // Performance metrics
  llm_tokens_used?: number;
  llm_cost_cents?: number;
  cache_hit_rate?: number;
  
  created_at?: string;
}

// Feedback pattern interface
export interface FeedbackPattern {
  id?: string;
  pattern_type: 'user_behavior' | 'agent_performance' | 'system_issue' | 'workflow_efficiency' | 'data_quality';
  pattern_name: string;
  pattern_description?: string;
  detection_algorithm: string;
  detection_timestamp?: string;
  confidence_score: number;
  
  // Pattern scope
  event_count: number;
  user_count: number;
  time_period_start: string;
  time_period_end: string;
  
  // Pattern data
  pattern_data: Record<string, any>;
  statistical_metrics: Record<string, any>;
  
  // Related data
  sample_event_ids?: string[];
  related_pattern_ids?: string[];
  
  // Impact assessment
  severity_level?: 'critical' | 'high' | 'medium' | 'low';
  business_impact?: string;
  recommended_actions?: Record<string, any>[];
  
  // Status tracking
  status?: 'detected' | 'investigating' | 'resolved' | 'dismissed';
  assigned_to?: string;
  resolution_notes?: string;
  
  created_at?: string;
  updated_at?: string;
}

// Learning example interface
export interface FeedbackLearningExample {
  id?: string;
  source_feedback_event_id: string;
  source_decision_context_id?: string;
  example_type: 'positive_example' | 'negative_example' | 'edge_case' | 'preference_learning' | 'error_recovery';
  learning_category: string;
  
  // Training data
  input_features: Record<string, any>;
  expected_output: Record<string, any>;
  actual_output?: Record<string, any>;
  correction_provided?: Record<string, any>;
  
  // Context preservation
  context_snapshot: Record<string, any>;
  user_preferences_at_time: Record<string, any>;
  environmental_factors?: Record<string, any>;
  
  // Learning metrics
  learning_value_score: number;
  generalization_potential?: 'high' | 'medium' | 'low';
  complexity_level?: number; // 1-5
  
  // Usage tracking
  times_used_in_training?: number;
  last_used_in_training?: string;
  training_effectiveness_score?: number;
  
  // Quality assurance
  validated?: boolean;
  validated_by?: string;
  validated_at?: string;
  validation_notes?: string;
  
  created_at?: string;
  updated_at?: string;
}

// Session analytics interface
export interface FeedbackSessionAnalytics {
  id?: string;
  user_id: string;
  session_id: string;
  session_start: string;
  session_end?: string;
  session_duration_seconds?: number;
  app_version: string;
  platform: string;
  device_info?: Record<string, any>;
  
  // Event summary
  total_feedback_events: number;
  positive_events: number;
  neutral_events: number;
  negative_events: number;
  
  // Event type breakdown
  agent_feedback_count: number;
  ui_feedback_count: number;
  system_feedback_count: number;
  data_feedback_count: number;
  workflow_feedback_count: number;
  
  // Performance metrics
  avg_response_time_ms?: number;
  error_rate?: number;
  completion_rate?: number;
  
  // User satisfaction
  session_satisfaction_score?: number;
  workflow_completion_success?: boolean;
  major_issues_encountered?: boolean;
  
  // Derived insights
  user_expertise_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  session_efficiency_score?: number;
  feature_adoption_score?: number;
  
  created_at?: string;
  updated_at?: string;
}

// Batch operation interface
export interface FeedbackBatch {
  events: UserFeedbackEvent[];
  batch_id: string;
  session_id: string;
  created_at: string;
}

// Validation result interface
export interface FeedbackValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized_data?: UserFeedbackEvent;
}

// Analytics query interface
export interface FeedbackAnalyticsQuery {
  user_id?: string;
  event_types?: FeedbackEventType[];
  agent_types?: AgentType[];
  start_date?: string;
  end_date?: string;
  feedback_values?: FeedbackValue[];
  priority_levels?: PriorityLevel[];
  limit?: number;
  offset?: number;
}

// Analytics result interface
export interface FeedbackAnalyticsResult {
  total_events: number;
  positive_rate: number;
  negative_rate: number;
  agent_performance: Record<string, any>;
  most_common_issues: Array<{ category: string; count: number }>;
  session_analytics: FeedbackSessionAnalytics[];
  patterns: FeedbackPattern[];
}

// =====================================================
// FEEDBACK SERVICE CLASS
// =====================================================

export class FeedbackService {
  private static readonly BATCH_SIZE = 50;
  private static readonly BATCH_TIMEOUT_MS = 5000;
  private static pendingBatches: Map<string, FeedbackBatch> = new Map();

  // =====================================================
  // CORE FEEDBACK LOGGING METHODS
  // =====================================================

  /**
   * Log user feedback event with rich contextual information
   */
  static async logUserFeedback(feedbackData: Partial<UserFeedbackEvent>): Promise<{ data: UserFeedbackEvent | null; error: any }> {
    try {
      // Validate and sanitize input
      const validationResult = await this.validateFeedbackData(feedbackData);
      if (!validationResult.valid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      const sanitizedData = validationResult.sanitized_data!;

      // Enrich with system context
      const enrichedData = await this.enrichWithSystemContext(sanitizedData);

      // Use database function for atomic insert with analytics
      const { data, error } = await supabase.rpc('log_feedback_event', {
        p_user_id: enrichedData.user_id,
        p_session_id: enrichedData.session_id,
        p_event_type: enrichedData.event_type,
        p_interaction_type: enrichedData.interaction_type,
        p_feedback_category: enrichedData.feedback_category,
        p_feedback_subcategory: enrichedData.feedback_subcategory,
        p_event_data: enrichedData.event_data,
        p_user_context: enrichedData.user_context,
        p_agent_type: enrichedData.agent_type,
        p_agent_confidence: enrichedData.agent_confidence,
        p_original_decision: enrichedData.original_decision
      });

      if (error) throw error;

      // Retrieve the created event
      const { data: eventData, error: fetchError } = await supabase
        .from('user_feedback_events')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      // Queue for pattern analysis (async)
      this.queuePatternAnalysis(eventData);

      return { data: eventData, error: null };
    } catch (error) {
      console.error('Error logging user feedback:', error);
      return { data: null, error };
    }
  }

  /**
   * Log agent decision with comprehensive context
   */
  static async logAgentDecision(
    feedbackEventId: string,
    decisionContext: Partial<AgentDecisionContext>
  ): Promise<{ data: AgentDecisionContext | null; error: any }> {
    try {
      const contextData = {
        feedback_event_id: feedbackEventId,
        decision_timestamp: new Date().toISOString(),
        ...decisionContext
      };

      const { data, error } = await supabase
        .from('agent_decision_contexts')
        .insert([contextData])
        .select()
        .single();

      if (error) throw error;

      // Generate learning example if this is a significant decision
      if (this.shouldGenerateLearningExample(data)) {
        await this.generateLearningExample(data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error logging agent decision:', error);
      return { data: null, error };
    }
  }

  /**
   * Log user modification of agent output
   */
  static async logUserModification(
    originalEventId: string,
    modification: {
      modified_fields: Record<string, any>;
      modification_reason?: string;
      user_satisfaction?: number;
      time_to_modify_seconds?: number;
    }
  ): Promise<{ data: UserFeedbackEvent | null; error: any }> {
    try {
      // Create a new feedback event for the modification
      const modificationEvent: Partial<UserFeedbackEvent> = {
        user_id: '', // Will be set from original event
        session_id: '', // Will be set from original event
        event_type: 'agent_feedback',
        interaction_type: 'user_modification',
        feedback_category: 'modification',
        feedback_subcategory: 'agent_output_correction',
        event_data: {
          original_event_id: originalEventId,
          modified_fields: modification.modified_fields,
          modification_reason: modification.modification_reason,
          time_to_modify_seconds: modification.time_to_modify_seconds
        },
        user_modification: modification.modified_fields,
        feedback_value: 'negative' // User felt need to modify
      };

      // Get original event context
      const { data: originalEvent, error: fetchError } = await supabase
        .from('user_feedback_events')
        .select('user_id, session_id, agent_type, user_context, system_context')
        .eq('id', originalEventId)
        .single();

      if (fetchError) throw fetchError;

      // Inherit context from original event
      modificationEvent.user_id = originalEvent.user_id;
      modificationEvent.session_id = originalEvent.session_id;
      modificationEvent.agent_type = originalEvent.agent_type as AgentType;
      modificationEvent.user_context = originalEvent.user_context;
      modificationEvent.system_context = originalEvent.system_context;

      // Log the modification event
      return await this.logUserFeedback(modificationEvent);
    } catch (error) {
      console.error('Error logging user modification:', error);
      return { data: null, error };
    }
  }

  // =====================================================
  // PATTERN ANALYSIS METHODS
  // =====================================================

  /**
   * Analyze feedback patterns for insights
   */
  static async analyzeFeedbackPatterns(
    query: {
      time_window_hours?: number;
      min_event_count?: number;
      confidence_threshold?: number;
      pattern_types?: string[];
    } = {}
  ): Promise<{ data: FeedbackPattern[] | null; error: any }> {
    try {
      const timeWindowHours = query.time_window_hours || 24;
      const minEventCount = query.min_event_count || 5;
      const confidenceThreshold = query.confidence_threshold || 0.7;

      // Analyze user behavior patterns
      const userPatterns = await this.analyzeUserBehaviorPatterns(timeWindowHours, minEventCount);
      
      // Analyze agent performance patterns
      const agentPatterns = await this.analyzeAgentPerformancePatterns(timeWindowHours, minEventCount);
      
      // Analyze system issue patterns
      const systemPatterns = await this.analyzeSystemIssuePatterns(timeWindowHours, minEventCount);

      const allPatterns = [
        ...userPatterns,
        ...agentPatterns,
        ...systemPatterns
      ].filter(pattern => pattern.confidence_score >= confidenceThreshold);

      // Store detected patterns
      if (allPatterns.length > 0) {
        const { data, error } = await supabase
          .from('feedback_patterns')
          .insert(allPatterns)
          .select();

        if (error) throw error;
        return { data, error: null };
      }

      return { data: [], error: null };
    } catch (error) {
      console.error('Error analyzing feedback patterns:', error);
      return { data: null, error };
    }
  }

  /**
   * Generate learning examples from feedback
   */
  static async generateLearningExample(
    decisionContext: AgentDecisionContext
  ): Promise<{ data: FeedbackLearningExample | null; error: any }> {
    try {
      // Get associated feedback event
      const { data: feedbackEvent, error: eventError } = await supabase
        .from('user_feedback_events')
        .select('*')
        .eq('id', decisionContext.feedback_event_id)
        .single();

      if (eventError) throw eventError;

      // Determine example type based on feedback value
      let exampleType: FeedbackLearningExample['example_type'] = 'preference_learning';
      if (feedbackEvent.feedback_value === 'positive') {
        exampleType = 'positive_example';
      } else if (feedbackEvent.feedback_value === 'negative') {
        exampleType = feedbackEvent.user_modification ? 'negative_example' : 'edge_case';
      }

      // Calculate learning value score
      const learningValueScore = this.calculateLearningValue(feedbackEvent, decisionContext);

      const learningExample: Partial<FeedbackLearningExample> = {
        source_feedback_event_id: decisionContext.feedback_event_id,
        source_decision_context_id: decisionContext.id,
        example_type: exampleType,
        learning_category: `${decisionContext.agent_type}_decision`,
        input_features: decisionContext.input_data,
        expected_output: feedbackEvent.user_modification || decisionContext.decision_output,
        actual_output: decisionContext.decision_output,
        correction_provided: feedbackEvent.user_modification,
        context_snapshot: {
          user_context: feedbackEvent.user_context,
          system_context: feedbackEvent.system_context,
          environmental_context: feedbackEvent.environmental_context
        },
        user_preferences_at_time: decisionContext.user_preferences_snapshot,
        learning_value_score: learningValueScore,
        generalization_potential: learningValueScore > 0.8 ? 'high' : learningValueScore > 0.5 ? 'medium' : 'low',
        complexity_level: this.calculateComplexityLevel(decisionContext.input_data)
      };

      const { data, error } = await supabase
        .from('feedback_learning_examples')
        .insert([learningExample])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error generating learning example:', error);
      return { data: null, error };
    }
  }

  // =====================================================
  // VALIDATION AND SANITIZATION
  // =====================================================

  /**
   * Validate and sanitize feedback data
   */
  static async validateFeedbackData(
    feedbackData: Partial<UserFeedbackEvent>
  ): Promise<FeedbackValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!feedbackData.user_id) errors.push('user_id is required');
    if (!feedbackData.session_id) errors.push('session_id is required');
    if (!feedbackData.event_type) errors.push('event_type is required');
    if (!feedbackData.interaction_type) errors.push('interaction_type is required');
    if (!feedbackData.feedback_category) errors.push('feedback_category is required');
    if (!feedbackData.feedback_subcategory) errors.push('feedback_subcategory is required');

    // Type validation
    const validEventTypes: FeedbackEventType[] = ['agent_feedback', 'ui_feedback', 'system_feedback', 'data_feedback', 'workflow_feedback'];
    if (feedbackData.event_type && !validEventTypes.includes(feedbackData.event_type)) {
      errors.push(`Invalid event_type: ${feedbackData.event_type}`);
    }

    if (feedbackData.agent_type) {
      const validAgentTypes: AgentType[] = ['dispatch_strategist', 'route_optimizer', 'inventory_specialist'];
      if (!validAgentTypes.includes(feedbackData.agent_type)) {
        errors.push(`Invalid agent_type: ${feedbackData.agent_type}`);
      }
    }

    // Confidence validation
    if (feedbackData.agent_confidence !== undefined) {
      if (feedbackData.agent_confidence < 0 || feedbackData.agent_confidence > 1) {
        errors.push('agent_confidence must be between 0 and 1');
      }
    }

    // Data sanitization
    const sanitized: UserFeedbackEvent = {
      ...feedbackData as UserFeedbackEvent,
      event_data: feedbackData.event_data || {},
      event_metadata: feedbackData.event_metadata || {},
      user_context: feedbackData.user_context || {},
      system_context: feedbackData.system_context || {},
      environmental_context: feedbackData.environmental_context || {},
      timestamp: feedbackData.timestamp || new Date().toISOString()
    };

    // Sanitize text fields
    if (sanitized.feedback_category) {
      sanitized.feedback_category = sanitized.feedback_category.toLowerCase().trim();
    }
    if (sanitized.feedback_subcategory) {
      sanitized.feedback_subcategory = sanitized.feedback_subcategory.toLowerCase().trim();
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized_data: errors.length === 0 ? sanitized : undefined
    };
  }

  // =====================================================
  // BATCHING FOR PERFORMANCE
  // =====================================================

  /**
   * Add feedback event to batch for performance
   */
  static async batchFeedbackEvent(
    sessionId: string,
    feedbackData: Partial<UserFeedbackEvent>
  ): Promise<{ queued: boolean; error: any }> {
    try {
      if (!this.pendingBatches.has(sessionId)) {
        this.pendingBatches.set(sessionId, {
          events: [],
          batch_id: `batch_${sessionId}_${Date.now()}`,
          session_id: sessionId,
          created_at: new Date().toISOString()
        });

        // Set timeout for batch processing
        setTimeout(() => {
          this.processFeedbackBatch(sessionId);
        }, this.BATCH_TIMEOUT_MS);
      }

      const batch = this.pendingBatches.get(sessionId)!;
      batch.events.push(feedbackData as UserFeedbackEvent);

      // Process batch if it reaches size limit
      if (batch.events.length >= this.BATCH_SIZE) {
        await this.processFeedbackBatch(sessionId);
      }

      return { queued: true, error: null };
    } catch (error) {
      console.error('Error batching feedback event:', error);
      return { queued: false, error };
    }
  }

  /**
   * Process batched feedback events
   */
  private static async processFeedbackBatch(sessionId: string): Promise<void> {
    const batch = this.pendingBatches.get(sessionId);
    if (!batch || batch.events.length === 0) return;

    try {
      // Process all events in the batch
      const results = await Promise.allSettled(
        batch.events.map(event => this.logUserFeedback(event))
      );

      // Log batch processing results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Feedback batch processed: ${successful} successful, ${failed} failed`);

      // Clean up batch
      this.pendingBatches.delete(sessionId);
    } catch (error) {
      console.error('Error processing feedback batch:', error);
    }
  }

  // =====================================================
  // ANALYTICS AND REPORTING
  // =====================================================

  /**
   * Get comprehensive feedback analytics
   */
  static async getFeedbackAnalytics(
    query: FeedbackAnalyticsQuery
  ): Promise<{ data: FeedbackAnalyticsResult | null; error: any }> {
    try {
      // Use the database function for comprehensive analytics
      const { data, error } = await supabase.rpc('get_user_feedback_analytics', {
        p_user_id: query.user_id,
        p_start_date: query.start_date,
        p_end_date: query.end_date
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error getting feedback analytics:', error);
      return { data: null, error };
    }
  }

  /**
   * Get learning examples for agent training
   */
  static async getLearningExamples(
    agentType: AgentType,
    limit: number = 100
  ): Promise<{ data: FeedbackLearningExample[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('feedback_learning_examples')
        .select('*')
        .eq('learning_category', `${agentType}_decision`)
        .eq('validated', true)
        .order('learning_value_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error getting learning examples:', error);
      return { data: null, error };
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  /**
   * Enrich feedback data with system context
   */
  private static async enrichWithSystemContext(
    feedbackData: UserFeedbackEvent
  ): Promise<UserFeedbackEvent> {
    const systemContext = {
      ...feedbackData.system_context,
      app_version: process.env.EXPO_PUBLIC_APP_VERSION || 'unknown',
      platform: 'mobile',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development'
    };

    return {
      ...feedbackData,
      system_context: systemContext
    };
  }

  /**
   * Queue pattern analysis for background processing
   */
  private static queuePatternAnalysis(event: UserFeedbackEvent): void {
    // In a production app, this would queue the event for background processing
    // For now, we'll just log that it should be analyzed
    console.log(`Queued pattern analysis for event ${event.id}`);
  }

  /**
   * Determine if a decision should generate a learning example
   */
  private static shouldGenerateLearningExample(context: AgentDecisionContext): boolean {
    // Generate learning examples for:
    // 1. Low confidence decisions
    // 2. Decisions with user modifications
    // 3. High-cost decisions
    // 4. Decisions with errors

    return (
      context.confidence_score < 0.7 ||
      (context.llm_tokens_used && context.llm_tokens_used > 1000) ||
      (context.error_conditions && context.error_conditions.length > 0)
    );
  }

  /**
   * Calculate learning value score
   */
  private static calculateLearningValue(
    feedbackEvent: UserFeedbackEvent,
    decisionContext: AgentDecisionContext
  ): number {
    let score = 0.5; // Base score

    // Increase score for negative feedback with modifications
    if (feedbackEvent.feedback_value === 'negative' && feedbackEvent.user_modification) {
      score += 0.3;
    }

    // Increase score for low confidence decisions
    if (decisionContext.confidence_score < 0.5) {
      score += 0.2;
    }

    // Increase score for complex decisions (more tokens used)
    if (decisionContext.llm_tokens_used && decisionContext.llm_tokens_used > 500) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate complexity level of decision input
   */
  private static calculateComplexityLevel(inputData: Record<string, any>): number {
    const dataSize = JSON.stringify(inputData).length;
    const keyCount = Object.keys(inputData).length;
    
    if (dataSize > 5000 || keyCount > 20) return 5;
    if (dataSize > 2000 || keyCount > 15) return 4;
    if (dataSize > 1000 || keyCount > 10) return 3;
    if (dataSize > 500 || keyCount > 5) return 2;
    return 1;
  }

  /**
   * Analyze user behavior patterns
   */
  private static async analyzeUserBehaviorPatterns(
    timeWindowHours: number,
    minEventCount: number
  ): Promise<Partial<FeedbackPattern>[]> {
    // This would contain sophisticated pattern analysis logic
    // For now, returning empty array - would be implemented with ML algorithms
    return [];
  }

  /**
   * Analyze agent performance patterns
   */
  private static async analyzeAgentPerformancePatterns(
    timeWindowHours: number,
    minEventCount: number
  ): Promise<Partial<FeedbackPattern>[]> {
    // This would analyze agent performance trends and issues
    // For now, returning empty array - would be implemented with statistical analysis
    return [];
  }

  /**
   * Analyze system issue patterns
   */
  private static async analyzeSystemIssuePatterns(
    timeWindowHours: number,
    minEventCount: number
  ): Promise<Partial<FeedbackPattern>[]> {
    // This would detect system-wide issues and anomalies
    // For now, returning empty array - would be implemented with anomaly detection
    return [];
  }
} 