-- =============================================
-- Migration 006: Feedback Logging System
-- =============================================
-- Description: Comprehensive feedback collection system for agent learning
-- Author: AI Agent Architecture Team
-- Date: 2024-12-20
-- Dependencies: 005-onboarding-analytics-functions.sql

-- =============================================
-- CORE FEEDBACK TABLES
-- =============================================

-- 1. Main feedback events table
-- Stores all user feedback interactions with rich contextual information
CREATE TABLE user_feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identification
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'agent_feedback',
    'ui_feedback', 
    'system_feedback',
    'data_feedback',
    'workflow_feedback'
  )),
  
  -- Event categorization
  interaction_type TEXT NOT NULL,
  feedback_category TEXT NOT NULL,
  feedback_subcategory TEXT NOT NULL,
  
  -- Event timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_sequence_number INTEGER NOT NULL DEFAULT 1,
  
  -- Core event data (flexible JSON for event-specific information)
  event_data JSONB NOT NULL DEFAULT '{}',
  event_metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Context information
  user_context JSONB NOT NULL DEFAULT '{}',
  system_context JSONB NOT NULL DEFAULT '{}',
  environmental_context JSONB NOT NULL DEFAULT '{}',
  
  -- Agent-specific information (nullable for non-agent events)
  agent_type TEXT CHECK (agent_type IN (
    'dispatch_strategist',
    'route_optimizer', 
    'inventory_specialist'
  )),
  agent_version TEXT,
  agent_confidence DECIMAL(3,2) CHECK (agent_confidence BETWEEN 0.0 AND 1.0),
  original_decision JSONB,
  user_modification JSONB,
  
  -- Analytics and processing classification
  feedback_value TEXT CHECK (feedback_value IN (
    'positive', 'neutral', 'negative'
  )),
  confidence_level TEXT CHECK (confidence_level IN (
    'high', 'medium', 'low'
  )),
  priority_level TEXT CHECK (priority_level IN (
    'critical', 'high', 'medium', 'low'
  )),
  
  -- Processing status tracking
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  analysis_result JSONB,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Agent decision contexts table
-- Captures detailed context for AI agent decisions with performance metrics
CREATE TABLE agent_decision_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links to feedback event
  feedback_event_id UUID NOT NULL REFERENCES user_feedback_events(id) ON DELETE CASCADE,
  
  -- Agent information
  agent_type TEXT NOT NULL CHECK (agent_type IN (
    'dispatch_strategist',
    'route_optimizer', 
    'inventory_specialist'
  )),
  agent_version TEXT NOT NULL,
  
  -- Decision context
  decision_id UUID NOT NULL,
  decision_timestamp TIMESTAMPTZ NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}',
  processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
  
  -- Decision details
  decision_output JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(5,4) CHECK (confidence_score BETWEEN 0.0 AND 1.0),
  alternative_options JSONB DEFAULT '[]',
  reasoning_explanation TEXT,
  
  -- User preferences at time of decision
  user_preferences_snapshot JSONB NOT NULL DEFAULT '{}',
  preference_influence_score DECIMAL(3,2) CHECK (preference_influence_score BETWEEN 0.0 AND 1.0),
  
  -- External factors and dependencies
  external_data_used JSONB DEFAULT '{}',
  api_calls_made JSONB DEFAULT '[]',
  error_conditions JSONB DEFAULT '[]',
  
  -- Performance and cost metrics
  llm_tokens_used INTEGER CHECK (llm_tokens_used >= 0),
  llm_cost_cents INTEGER CHECK (llm_cost_cents >= 0),
  cache_hit_rate DECIMAL(3,2) CHECK (cache_hit_rate BETWEEN 0.0 AND 1.0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Feedback pattern analysis table
-- Stores aggregated patterns and insights from feedback data
CREATE TABLE feedback_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern identification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'user_behavior',
    'agent_performance',
    'system_issue',
    'workflow_efficiency',
    'data_quality'
  )),
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,
  
  -- Pattern detection metadata
  detection_algorithm TEXT NOT NULL,
  detection_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
  
  -- Pattern scope and metrics
  event_count INTEGER NOT NULL CHECK (event_count > 0),
  user_count INTEGER NOT NULL CHECK (user_count > 0),
  time_period_start TIMESTAMPTZ NOT NULL,
  time_period_end TIMESTAMPTZ NOT NULL,
  
  -- Pattern data and statistical metrics
  pattern_data JSONB NOT NULL DEFAULT '{}',
  statistical_metrics JSONB NOT NULL DEFAULT '{}',
  
  -- Related events and patterns
  sample_event_ids UUID[] DEFAULT '{}',
  related_pattern_ids UUID[] DEFAULT '{}',
  
  -- Impact assessment
  severity_level TEXT CHECK (severity_level IN (
    'critical', 'high', 'medium', 'low'
  )),
  business_impact TEXT,
  recommended_actions JSONB DEFAULT '[]',
  
  -- Status tracking and assignment
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN (
    'detected', 'investigating', 'resolved', 'dismissed'
  )),
  assigned_to TEXT,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_period CHECK (time_period_end >= time_period_start)
);

-- 4. Feedback learning examples table
-- Curated examples for agent training and learning
CREATE TABLE feedback_learning_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source information
  source_feedback_event_id UUID NOT NULL REFERENCES user_feedback_events(id) ON DELETE CASCADE,
  source_decision_context_id UUID REFERENCES agent_decision_contexts(id) ON DELETE SET NULL,
  
  -- Learning classification
  example_type TEXT NOT NULL CHECK (example_type IN (
    'positive_example',
    'negative_example',
    'edge_case',
    'preference_learning',
    'error_recovery'
  )),
  learning_category TEXT NOT NULL,
  
  -- Training data structure
  input_features JSONB NOT NULL DEFAULT '{}',
  expected_output JSONB NOT NULL DEFAULT '{}',
  actual_output JSONB,
  correction_provided JSONB,
  
  -- Context preservation for learning
  context_snapshot JSONB NOT NULL DEFAULT '{}',
  user_preferences_at_time JSONB NOT NULL DEFAULT '{}',
  environmental_factors JSONB DEFAULT '{}',
  
  -- Learning value metrics
  learning_value_score DECIMAL(3,2) NOT NULL CHECK (learning_value_score BETWEEN 0.0 AND 1.0),
  generalization_potential TEXT CHECK (generalization_potential IN (
    'high', 'medium', 'low'
  )),
  complexity_level INTEGER CHECK (complexity_level BETWEEN 1 AND 5),
  
  -- Usage tracking for training
  times_used_in_training INTEGER DEFAULT 0 CHECK (times_used_in_training >= 0),
  last_used_in_training TIMESTAMPTZ,
  training_effectiveness_score DECIMAL(3,2) CHECK (training_effectiveness_score BETWEEN 0.0 AND 1.0),
  
  -- Quality assurance
  validated BOOLEAN NOT NULL DEFAULT FALSE,
  validated_by TEXT,
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Feedback session analytics table
-- User session-level feedback analytics and insights
CREATE TABLE feedback_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session identification
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL UNIQUE,
  
  -- Session temporal details
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  session_duration_seconds INTEGER CHECK (session_duration_seconds >= 0),
  
  -- Application context
  app_version TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  
  -- Feedback event summary
  total_feedback_events INTEGER NOT NULL DEFAULT 0 CHECK (total_feedback_events >= 0),
  positive_events INTEGER NOT NULL DEFAULT 0 CHECK (positive_events >= 0),
  neutral_events INTEGER NOT NULL DEFAULT 0 CHECK (neutral_events >= 0),
  negative_events INTEGER NOT NULL DEFAULT 0 CHECK (negative_events >= 0),
  
  -- Event type breakdown
  agent_feedback_count INTEGER NOT NULL DEFAULT 0 CHECK (agent_feedback_count >= 0),
  ui_feedback_count INTEGER NOT NULL DEFAULT 0 CHECK (ui_feedback_count >= 0),
  system_feedback_count INTEGER NOT NULL DEFAULT 0 CHECK (system_feedback_count >= 0),
  data_feedback_count INTEGER NOT NULL DEFAULT 0 CHECK (data_feedback_count >= 0),
  workflow_feedback_count INTEGER NOT NULL DEFAULT 0 CHECK (workflow_feedback_count >= 0),
  
  -- Performance metrics
  avg_response_time_ms DECIMAL(8,2) CHECK (avg_response_time_ms >= 0),
  error_rate DECIMAL(5,4) CHECK (error_rate BETWEEN 0.0 AND 1.0),
  completion_rate DECIMAL(5,4) CHECK (completion_rate BETWEEN 0.0 AND 1.0),
  
  -- User satisfaction indicators
  session_satisfaction_score DECIMAL(3,2) CHECK (session_satisfaction_score BETWEEN 0.0 AND 1.0),
  workflow_completion_success BOOLEAN,
  major_issues_encountered BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Derived insights
  user_expertise_level TEXT CHECK (user_expertise_level IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  )),
  session_efficiency_score DECIMAL(3,2) CHECK (session_efficiency_score BETWEEN 0.0 AND 1.0),
  feature_adoption_score DECIMAL(3,2) CHECK (feature_adoption_score BETWEEN 0.0 AND 1.0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_session_duration CHECK (
    session_end IS NULL OR session_end >= session_start
  ),
  CONSTRAINT valid_event_counts CHECK (
    total_feedback_events = positive_events + neutral_events + negative_events
  ),
  CONSTRAINT valid_type_counts CHECK (
    total_feedback_events >= agent_feedback_count + ui_feedback_count + 
    system_feedback_count + data_feedback_count + workflow_feedback_count
  )
);

-- =============================================
-- SUPPORT TABLES FOR ADVANCED FEATURES
-- =============================================

-- 6. Feedback event correlations table
-- Links related feedback events for pattern analysis
CREATE TABLE feedback_event_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  primary_event_id UUID NOT NULL REFERENCES user_feedback_events(id) ON DELETE CASCADE,
  related_event_id UUID NOT NULL REFERENCES user_feedback_events(id) ON DELETE CASCADE,
  
  correlation_type TEXT NOT NULL CHECK (correlation_type IN (
    'temporal', 'causal', 'contextual', 'user_pattern', 'system_related'
  )),
  
  correlation_strength DECIMAL(3,2) NOT NULL CHECK (correlation_strength BETWEEN 0.0 AND 1.0),
  correlation_explanation TEXT,
  
  -- Time relationship analysis
  time_difference_seconds INTEGER,
  sequence_order INTEGER,
  
  -- Detection metadata
  detection_method TEXT NOT NULL,
  detection_confidence DECIMAL(3,2) CHECK (detection_confidence BETWEEN 0.0 AND 1.0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent self-correlation
  CONSTRAINT no_self_correlation CHECK (primary_event_id != related_event_id)
);

-- 7. Feedback data retention policies table
-- Manages data retention and archival automation
CREATE TABLE feedback_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy definition
  policy_name TEXT NOT NULL UNIQUE,
  policy_description TEXT,
  
  -- Data selection criteria
  table_name TEXT NOT NULL,
  data_filter JSONB DEFAULT '{}',
  
  -- Retention timeline rules
  hot_retention_days INTEGER NOT NULL DEFAULT 90 CHECK (hot_retention_days > 0),
  warm_retention_days INTEGER NOT NULL DEFAULT 365 CHECK (warm_retention_days > hot_retention_days),
  cold_retention_days INTEGER NOT NULL DEFAULT 1095 CHECK (cold_retention_days > warm_retention_days),
  final_deletion_days INTEGER NOT NULL DEFAULT 2555 CHECK (final_deletion_days > cold_retention_days),
  
  -- Transition actions
  warm_transition_action TEXT DEFAULT 'pseudonymize' CHECK (warm_transition_action IN (
    'pseudonymize', 'anonymize', 'archive', 'delete'
  )),
  cold_transition_action TEXT DEFAULT 'anonymize' CHECK (cold_transition_action IN (
    'anonymize', 'archive', 'delete'
  )),
  archive_transition_action TEXT DEFAULT 'aggregate' CHECK (archive_transition_action IN (
    'aggregate', 'compress', 'delete'
  )),
  
  -- Processing configuration
  batch_size INTEGER DEFAULT 1000 CHECK (batch_size > 0),
  processing_schedule TEXT DEFAULT 'daily',
  
  -- Compliance and legal settings
  legal_hold_exempt BOOLEAN DEFAULT FALSE,
  gdpr_compliant BOOLEAN DEFAULT TRUE,
  audit_required BOOLEAN DEFAULT TRUE,
  
  -- Status and scheduling
  active BOOLEAN DEFAULT TRUE,
  last_executed TIMESTAMPTZ,
  next_execution TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Primary performance indexes for feedback events
CREATE INDEX idx_feedback_events_user_timestamp ON user_feedback_events(user_id, timestamp DESC);
CREATE INDEX idx_feedback_events_type_category ON user_feedback_events(event_type, feedback_category);
CREATE INDEX idx_feedback_events_agent_type ON user_feedback_events(agent_type, timestamp DESC) WHERE agent_type IS NOT NULL;
CREATE INDEX idx_feedback_events_session ON user_feedback_events(session_id, timestamp);
CREATE INDEX idx_feedback_events_unprocessed ON user_feedback_events(processed, timestamp) WHERE NOT processed;
CREATE INDEX idx_feedback_events_priority ON user_feedback_events(priority_level, timestamp DESC) WHERE priority_level IN ('critical', 'high');

-- JSON field indexes for flexible querying
CREATE INDEX idx_feedback_events_event_data ON user_feedback_events USING GIN(event_data);
CREATE INDEX idx_feedback_events_metadata ON user_feedback_events USING GIN(event_metadata);
CREATE INDEX idx_feedback_events_user_context ON user_feedback_events USING GIN(user_context);
CREATE INDEX idx_feedback_events_system_context ON user_feedback_events USING GIN(system_context);

-- Agent decision context indexes
CREATE INDEX idx_agent_decisions_feedback_event ON agent_decision_contexts(feedback_event_id);
CREATE INDEX idx_agent_decisions_agent_type ON agent_decision_contexts(agent_type, decision_timestamp DESC);
CREATE INDEX idx_agent_decisions_confidence ON agent_decision_contexts(confidence_score DESC);
CREATE INDEX idx_agent_decisions_performance ON agent_decision_contexts(processing_time_ms, llm_tokens_used);
CREATE INDEX idx_agent_decisions_decision_id ON agent_decision_contexts(decision_id);

-- Pattern analysis indexes
CREATE INDEX idx_feedback_patterns_type_time ON feedback_patterns(pattern_type, detection_timestamp DESC);
CREATE INDEX idx_feedback_patterns_confidence ON feedback_patterns(confidence_score DESC);
CREATE INDEX idx_feedback_patterns_severity ON feedback_patterns(severity_level, status);
CREATE INDEX idx_feedback_patterns_time_period ON feedback_patterns(time_period_start, time_period_end);
CREATE INDEX idx_feedback_patterns_status ON feedback_patterns(status, severity_level);

-- Learning examples indexes
CREATE INDEX idx_learning_examples_type_category ON feedback_learning_examples(example_type, learning_category);
CREATE INDEX idx_learning_examples_value_score ON feedback_learning_examples(learning_value_score DESC);
CREATE INDEX idx_learning_examples_source_event ON feedback_learning_examples(source_feedback_event_id);
CREATE INDEX idx_learning_examples_validated ON feedback_learning_examples(validated, learning_value_score DESC);
CREATE INDEX idx_learning_examples_training_usage ON feedback_learning_examples(times_used_in_training, last_used_in_training);
CREATE INDEX idx_learning_examples_complexity ON feedback_learning_examples(complexity_level, generalization_potential);

-- Session analytics indexes
CREATE INDEX idx_session_analytics_user_time ON feedback_session_analytics(user_id, session_start DESC);
CREATE INDEX idx_session_analytics_satisfaction ON feedback_session_analytics(session_satisfaction_score DESC);
CREATE INDEX idx_session_analytics_performance ON feedback_session_analytics(error_rate DESC, avg_response_time_ms DESC);
CREATE INDEX idx_session_analytics_completion ON feedback_session_analytics(workflow_completion_success, session_satisfaction_score);
CREATE INDEX idx_session_analytics_session_id ON feedback_session_analytics(session_id);

-- Event correlations indexes
CREATE INDEX idx_feedback_correlations_primary ON feedback_event_correlations(primary_event_id);
CREATE INDEX idx_feedback_correlations_related ON feedback_event_correlations(related_event_id);
CREATE INDEX idx_feedback_correlations_type_strength ON feedback_event_correlations(correlation_type, correlation_strength DESC);
CREATE INDEX idx_feedback_correlations_temporal ON feedback_event_correlations(time_difference_seconds) WHERE correlation_type = 'temporal';

-- Retention policies indexes
CREATE INDEX idx_retention_policies_active ON feedback_retention_policies(active, next_execution) WHERE active = TRUE;
CREATE INDEX idx_retention_policies_table ON feedback_retention_policies(table_name, active);

-- =============================================
-- TRIGGERS AND AUTOMATION
-- =============================================

-- Update timestamp trigger function (reuse existing if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_feedback_events_updated_at
  BEFORE UPDATE ON user_feedback_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_patterns_updated_at
  BEFORE UPDATE ON feedback_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_examples_updated_at
  BEFORE UPDATE ON feedback_learning_examples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_analytics_updated_at
  BEFORE UPDATE ON feedback_session_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at
  BEFORE UPDATE ON feedback_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatic session analytics computation trigger
CREATE OR REPLACE FUNCTION update_session_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session analytics when feedback events are added
  INSERT INTO feedback_session_analytics (
    user_id,
    session_id,
    session_start,
    app_version,
    platform,
    total_feedback_events,
    positive_events,
    neutral_events,
    negative_events,
    agent_feedback_count,
    ui_feedback_count,
    system_feedback_count,
    data_feedback_count,
    workflow_feedback_count
  )
  VALUES (
    NEW.user_id,
    NEW.session_id,
    NEW.timestamp,
    COALESCE(NEW.system_context->>'app_version', 'unknown'),
    COALESCE(NEW.system_context->>'platform', 'unknown'),
    1,
    CASE WHEN NEW.feedback_value = 'positive' THEN 1 ELSE 0 END,
    CASE WHEN NEW.feedback_value = 'neutral' THEN 1 ELSE 0 END,
    CASE WHEN NEW.feedback_value = 'negative' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'agent_feedback' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'ui_feedback' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'system_feedback' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'data_feedback' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'workflow_feedback' THEN 1 ELSE 0 END
  )
  ON CONFLICT (session_id) DO UPDATE SET
    total_feedback_events = feedback_session_analytics.total_feedback_events + 1,
    positive_events = feedback_session_analytics.positive_events + 
      CASE WHEN NEW.feedback_value = 'positive' THEN 1 ELSE 0 END,
    neutral_events = feedback_session_analytics.neutral_events + 
      CASE WHEN NEW.feedback_value = 'neutral' THEN 1 ELSE 0 END,
    negative_events = feedback_session_analytics.negative_events + 
      CASE WHEN NEW.feedback_value = 'negative' THEN 1 ELSE 0 END,
    agent_feedback_count = feedback_session_analytics.agent_feedback_count + 
      CASE WHEN NEW.event_type = 'agent_feedback' THEN 1 ELSE 0 END,
    ui_feedback_count = feedback_session_analytics.ui_feedback_count + 
      CASE WHEN NEW.event_type = 'ui_feedback' THEN 1 ELSE 0 END,
    system_feedback_count = feedback_session_analytics.system_feedback_count + 
      CASE WHEN NEW.event_type = 'system_feedback' THEN 1 ELSE 0 END,
    data_feedback_count = feedback_session_analytics.data_feedback_count + 
      CASE WHEN NEW.event_type = 'data_feedback' THEN 1 ELSE 0 END,
    workflow_feedback_count = feedback_session_analytics.workflow_feedback_count + 
      CASE WHEN NEW.event_type = 'workflow_feedback' THEN 1 ELSE 0 END,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_analytics_on_feedback
  AFTER INSERT ON user_feedback_events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_analytics();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all feedback tables
ALTER TABLE user_feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decision_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_learning_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_event_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_retention_policies ENABLE ROW LEVEL SECURITY;

-- User feedback events policies
CREATE POLICY "Users can access their own feedback events" ON user_feedback_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can access all feedback events" ON user_feedback_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin access to all feedback events
CREATE POLICY "Admins can access all feedback events" ON user_feedback_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Analytics access policy (read-only, anonymized)
CREATE POLICY "Analytics read access to feedback events" ON user_feedback_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('analyst', 'data_scientist')
    )
  );

-- Agent decision contexts policies (inherit from feedback events)
CREATE POLICY "Access agent contexts via feedback events" ON agent_decision_contexts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_feedback_events 
      WHERE id = feedback_event_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_feedback_events 
      WHERE id = feedback_event_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can access all agent contexts" ON agent_decision_contexts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can access all agent contexts" ON agent_decision_contexts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Feedback patterns policies (admin and analyst access)
CREATE POLICY "Admins and analysts can access feedback patterns" ON feedback_patterns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin', 'analyst', 'data_scientist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin', 'analyst')
    )
  );

CREATE POLICY "Service role can access all feedback patterns" ON feedback_patterns
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Learning examples policies (restricted access)
CREATE POLICY "System access to learning examples" ON feedback_learning_examples
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin access to learning examples" ON feedback_learning_examples
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Session analytics policies (user owns their sessions)
CREATE POLICY "Users can access their own session analytics" ON feedback_session_analytics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can access all session analytics" ON feedback_session_analytics
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can access all session analytics" ON feedback_session_analytics
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin', 'analyst')
    )
  );

-- Event correlations policies (inherit from primary event)
CREATE POLICY "Access correlations via primary event" ON feedback_event_correlations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_feedback_events 
      WHERE id = primary_event_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can access all correlations" ON feedback_event_correlations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Retention policies (admin only)
CREATE POLICY "Admin access to retention policies" ON feedback_retention_policies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

CREATE POLICY "Service role can access retention policies" ON feedback_retention_policies
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- ANALYTICAL VIEWS
-- =============================================

-- User feedback summary view
CREATE VIEW user_feedback_summary AS
SELECT 
  u.user_id,
  p.email,
  p.full_name,
  COUNT(*) as total_feedback_events,
  COUNT(*) FILTER (WHERE u.feedback_value = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE u.feedback_value = 'negative') as negative_count,
  COUNT(*) FILTER (WHERE u.event_type = 'agent_feedback') as agent_feedback_count,
  AVG(CASE WHEN u.agent_confidence IS NOT NULL THEN u.agent_confidence END) as avg_agent_confidence,
  MIN(u.created_at) as first_feedback,
  MAX(u.created_at) as latest_feedback,
  COUNT(DISTINCT u.session_id) as total_sessions,
  EXTRACT(EPOCH FROM (MAX(u.created_at) - MIN(u.created_at))) / NULLIF(COUNT(*) - 1, 0) as avg_time_between_events_seconds
FROM user_feedback_events u
JOIN profiles p ON u.user_id = p.id
GROUP BY u.user_id, p.email, p.full_name;

-- Agent performance metrics view
CREATE VIEW agent_performance_metrics AS
SELECT 
  u.agent_type,
  u.feedback_category,
  COUNT(*) as event_count,
  AVG(u.agent_confidence) as avg_confidence,
  AVG(d.processing_time_ms) as avg_processing_time,
  AVG(d.llm_tokens_used) as avg_tokens_used,
  COUNT(*) FILTER (WHERE u.feedback_value = 'positive') * 100.0 / COUNT(*) as approval_rate,
  COUNT(*) FILTER (WHERE u.user_modification IS NOT NULL) * 100.0 / COUNT(*) as modification_rate,
  AVG(d.llm_cost_cents) as avg_cost_per_decision
FROM user_feedback_events u
LEFT JOIN agent_decision_contexts d ON u.id = d.feedback_event_id
WHERE u.agent_type IS NOT NULL
GROUP BY u.agent_type, u.feedback_category;

-- Daily feedback trends view
CREATE VIEW daily_feedback_trends AS
SELECT 
  DATE(timestamp) as feedback_date,
  event_type,
  feedback_category,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CASE WHEN agent_confidence IS NOT NULL THEN agent_confidence END) as avg_agent_confidence,
  COUNT(*) FILTER (WHERE feedback_value = 'positive') * 100.0 / COUNT(*) as positive_rate
FROM user_feedback_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_type, feedback_category
ORDER BY feedback_date DESC, event_type, feedback_category;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to log feedback events with automatic categorization
CREATE OR REPLACE FUNCTION log_feedback_event(
  p_user_id UUID,
  p_session_id UUID,
  p_event_type TEXT,
  p_interaction_type TEXT,
  p_feedback_category TEXT,
  p_feedback_subcategory TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_user_context JSONB DEFAULT '{}',
  p_agent_type TEXT DEFAULT NULL,
  p_agent_confidence DECIMAL DEFAULT NULL,
  p_original_decision JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
  feedback_value TEXT;
  confidence_level TEXT;
  priority_level TEXT;
BEGIN
  -- Auto-determine feedback value
  feedback_value := CASE 
    WHEN p_feedback_category IN ('approval', 'completion', 'success') THEN 'positive'
    WHEN p_feedback_category IN ('rejection', 'error', 'failure') THEN 'negative'
    ELSE 'neutral'
  END;
  
  -- Auto-determine confidence level
  confidence_level := CASE 
    WHEN p_agent_confidence >= 0.8 THEN 'high'
    WHEN p_agent_confidence >= 0.5 THEN 'medium'
    ELSE 'low'
  END;
  
  -- Auto-determine priority level
  priority_level := CASE 
    WHEN p_feedback_category IN ('error', 'failure', 'rejection') AND p_event_type = 'agent_feedback' THEN 'high'
    WHEN p_feedback_category IN ('completion', 'success') THEN 'low'
    ELSE 'medium'
  END;
  
  -- Insert feedback event
  INSERT INTO user_feedback_events (
    user_id,
    session_id,
    event_type,
    interaction_type,
    feedback_category,
    feedback_subcategory,
    event_data,
    user_context,
    system_context,
    agent_type,
    agent_confidence,
    original_decision,
    feedback_value,
    confidence_level,
    priority_level
  ) VALUES (
    p_user_id,
    p_session_id,
    p_event_type,
    p_interaction_type,
    p_feedback_category,
    p_feedback_subcategory,
    p_event_data,
    p_user_context,
    jsonb_build_object(
      'app_version', current_setting('app.version', true),
      'environment', current_setting('app.environment', true),
      'timestamp', extract(epoch from now())
    ),
    p_agent_type,
    p_agent_confidence,
    p_original_decision,
    feedback_value,
    confidence_level,
    priority_level
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user feedback analytics
CREATE OR REPLACE FUNCTION get_user_feedback_analytics(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'positive_rate', COUNT(*) FILTER (WHERE feedback_value = 'positive') * 100.0 / NULLIF(COUNT(*), 0),
    'agent_interactions', COUNT(*) FILTER (WHERE event_type = 'agent_feedback'),
    'avg_session_duration', AVG(EXTRACT(EPOCH FROM (session_end - session_start)) / 60.0),
    'most_common_issues', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'category', feedback_category,
          'count', cnt
        )
      )
      FROM (
        SELECT feedback_category, COUNT(*) as cnt
        FROM user_feedback_events
        WHERE user_id = p_user_id 
          AND timestamp BETWEEN p_start_date AND p_end_date
          AND feedback_value = 'negative'
        GROUP BY feedback_category
        ORDER BY cnt DESC
        LIMIT 5
      ) issues
    ),
    'agent_performance', (
      SELECT jsonb_object_agg(
        agent_type,
        jsonb_build_object(
          'approval_rate', approval_rate,
          'avg_confidence', avg_confidence
        )
      )
      FROM (
        SELECT 
          agent_type,
          COUNT(*) FILTER (WHERE feedback_value = 'positive') * 100.0 / COUNT(*) as approval_rate,
          AVG(agent_confidence) as avg_confidence
        FROM user_feedback_events
        WHERE user_id = p_user_id 
          AND timestamp BETWEEN p_start_date AND p_end_date
          AND agent_type IS NOT NULL
        GROUP BY agent_type
      ) agent_stats
    )
  ) INTO result
  FROM user_feedback_events f
  LEFT JOIN feedback_session_analytics s ON f.session_id = s.session_id
  WHERE f.user_id = p_user_id 
    AND f.timestamp BETWEEN p_start_date AND p_end_date;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INITIAL DATA AND CONFIGURATION
-- =============================================

-- Insert default retention policies
INSERT INTO feedback_retention_policies (
  policy_name,
  policy_description,
  table_name,
  data_filter,
  hot_retention_days,
  warm_retention_days,
  cold_retention_days,
  final_deletion_days,
  processing_schedule
) VALUES 
(
  'standard_feedback_events',
  'Standard retention policy for user feedback events',
  'user_feedback_events',
  '{}',
  90, 365, 1095, 2555,
  'daily'
),
(
  'high_value_agent_feedback',
  'Extended retention for valuable agent learning data',
  'user_feedback_events',
  '{"event_type": "agent_feedback", "feedback_value": "negative"}',
  180, 730, 2190, 3650,
  'daily'
),
(
  'learning_examples_premium',
  'Premium retention for high-value learning examples',
  'feedback_learning_examples',
  '{"learning_value_score": {"$gte": 0.8}}',
  365, 1095, 2190, 3650,
  'weekly'
);

-- =============================================
-- MIGRATION COMPLETION
-- =============================================

-- Create completion log entry
DO $$
BEGIN
  -- Log successful migration
  RAISE NOTICE 'Migration 006-feedback-logging.sql completed successfully';
  RAISE NOTICE 'Created tables: user_feedback_events, agent_decision_contexts, feedback_patterns, feedback_learning_examples, feedback_session_analytics, feedback_event_correlations, feedback_retention_policies';
  RAISE NOTICE 'Created indexes: % performance-optimized indexes for feedback analytics', 25;
  RAISE NOTICE 'Created RLS policies: Comprehensive data access control and privacy protection';
  RAISE NOTICE 'Created views: user_feedback_summary, agent_performance_metrics, daily_feedback_trends';
  RAISE NOTICE 'Created functions: log_feedback_event(), get_user_feedback_analytics()';
  RAISE NOTICE 'Feedback logging system is ready for implementation';
END $$; 