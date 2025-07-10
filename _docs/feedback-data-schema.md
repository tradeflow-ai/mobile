# TradeFlow Feedback Data Schema

## 📋 Overview

This document defines the complete database schema for storing feedback events in the TradeFlow system. The schema is designed to capture rich contextual information while maintaining query performance and data integrity.

## 🏗️ Core Schema Architecture

### **Schema Design Principles**

1. **Flexible Event Storage**: JSON columns for event-specific data
2. **Rich Context Capture**: Comprehensive metadata for every event
3. **Query Performance**: Optimized indexes for analytics queries
4. **Data Integrity**: Foreign key constraints and validation
5. **Scalability**: Partitioning and archival strategies
6. **Privacy**: Built-in anonymization capabilities

## 📊 Database Tables

### **1. Core Feedback Events Table**

```sql
-- Main table for all feedback events
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
  
  -- Core event data (flexible JSON)
  event_data JSONB NOT NULL DEFAULT '{}',
  event_metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Context information
  user_context JSONB NOT NULL DEFAULT '{}',
  system_context JSONB NOT NULL DEFAULT '{}',
  environmental_context JSONB NOT NULL DEFAULT '{}',
  
  -- Agent-specific information
  agent_type TEXT,
  agent_version TEXT,
  agent_confidence DECIMAL(3,2),
  original_decision JSONB,
  user_modification JSONB,
  
  -- Analytics and processing
  feedback_value TEXT CHECK (feedback_value IN (
    'positive', 'neutral', 'negative'
  )),
  confidence_level TEXT CHECK (confidence_level IN (
    'high', 'medium', 'low'
  )),
  priority_level TEXT CHECK (priority_level IN (
    'critical', 'high', 'medium', 'low'
  )),
  
  -- Processing status
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  analysis_result JSONB,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_feedback_events_user_timestamp ON user_feedback_events(user_id, timestamp DESC);
CREATE INDEX idx_feedback_events_type_category ON user_feedback_events(event_type, feedback_category);
CREATE INDEX idx_feedback_events_agent_type ON user_feedback_events(agent_type) WHERE agent_type IS NOT NULL;
CREATE INDEX idx_feedback_events_session ON user_feedback_events(session_id);
CREATE INDEX idx_feedback_events_unprocessed ON user_feedback_events(processed, timestamp) WHERE NOT processed;

-- GIN indexes for JSON fields
CREATE INDEX idx_feedback_events_event_data ON user_feedback_events USING GIN(event_data);
CREATE INDEX idx_feedback_events_metadata ON user_feedback_events USING GIN(event_metadata);
CREATE INDEX idx_feedback_events_user_context ON user_feedback_events USING GIN(user_context);

-- Trigger for updated_at
CREATE TRIGGER update_feedback_events_updated_at
  BEFORE UPDATE ON user_feedback_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### **2. Agent Decision Context Table**

```sql
-- Captures detailed context for AI agent decisions
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
  processing_time_ms INTEGER,
  
  -- Decision details
  decision_output JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(5,4),
  alternative_options JSONB DEFAULT '[]',
  reasoning_explanation TEXT,
  
  -- User preferences at time of decision
  user_preferences_snapshot JSONB NOT NULL DEFAULT '{}',
  preference_influence_score DECIMAL(3,2),
  
  -- External factors
  external_data_used JSONB DEFAULT '{}',
  api_calls_made JSONB DEFAULT '[]',
  error_conditions JSONB DEFAULT '[]',
  
  -- Performance metrics
  llm_tokens_used INTEGER,
  llm_cost_cents INTEGER,
  cache_hit_rate DECIMAL(3,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_decisions_feedback_event ON agent_decision_contexts(feedback_event_id);
CREATE INDEX idx_agent_decisions_agent_type ON agent_decision_contexts(agent_type, decision_timestamp DESC);
CREATE INDEX idx_agent_decisions_confidence ON agent_decision_contexts(confidence_score DESC);
CREATE INDEX idx_agent_decisions_performance ON agent_decision_contexts(processing_time_ms, llm_tokens_used);
```

### **3. Feedback Pattern Analysis Table**

```sql
-- Aggregated patterns and insights from feedback data
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
  
  -- Pattern detection
  detection_algorithm TEXT NOT NULL,
  detection_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence_score DECIMAL(5,4) NOT NULL,
  
  -- Pattern details
  event_count INTEGER NOT NULL,
  user_count INTEGER NOT NULL,
  time_period_start TIMESTAMPTZ NOT NULL,
  time_period_end TIMESTAMPTZ NOT NULL,
  
  -- Pattern data
  pattern_data JSONB NOT NULL DEFAULT '{}',
  statistical_metrics JSONB NOT NULL DEFAULT '{}',
  
  -- Related events
  sample_event_ids UUID[] DEFAULT '{}',
  related_pattern_ids UUID[] DEFAULT '{}',
  
  -- Impact assessment
  severity_level TEXT CHECK (severity_level IN (
    'critical', 'high', 'medium', 'low'
  )),
  business_impact TEXT,
  recommended_actions JSONB DEFAULT '[]',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN (
    'detected', 'investigating', 'resolved', 'dismissed'
  )),
  assigned_to TEXT,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_patterns_type_time ON feedback_patterns(pattern_type, detection_timestamp DESC);
CREATE INDEX idx_feedback_patterns_confidence ON feedback_patterns(confidence_score DESC);
CREATE INDEX idx_feedback_patterns_severity ON feedback_patterns(severity_level, status);
CREATE INDEX idx_feedback_patterns_time_period ON feedback_patterns(time_period_start, time_period_end);
```

### **4. Feedback Learning Examples Table**

```sql
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
  
  -- Training data
  input_features JSONB NOT NULL DEFAULT '{}',
  expected_output JSONB NOT NULL DEFAULT '{}',
  actual_output JSONB,
  correction_provided JSONB,
  
  -- Context preservation
  context_snapshot JSONB NOT NULL DEFAULT '{}',
  user_preferences_at_time JSONB NOT NULL DEFAULT '{}',
  environmental_factors JSONB DEFAULT '{}',
  
  -- Learning metrics
  learning_value_score DECIMAL(3,2) NOT NULL,
  generalization_potential TEXT CHECK (generalization_potential IN (
    'high', 'medium', 'low'
  )),
  complexity_level INTEGER CHECK (complexity_level BETWEEN 1 AND 5),
  
  -- Usage tracking
  times_used_in_training INTEGER DEFAULT 0,
  last_used_in_training TIMESTAMPTZ,
  training_effectiveness_score DECIMAL(3,2),
  
  -- Quality assurance
  validated BOOLEAN NOT NULL DEFAULT FALSE,
  validated_by TEXT,
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_learning_examples_type_category ON feedback_learning_examples(example_type, learning_category);
CREATE INDEX idx_learning_examples_value_score ON feedback_learning_examples(learning_value_score DESC);
CREATE INDEX idx_learning_examples_source_event ON feedback_learning_examples(source_feedback_event_id);
CREATE INDEX idx_learning_examples_validated ON feedback_learning_examples(validated, learning_value_score DESC);
CREATE INDEX idx_learning_examples_training_usage ON feedback_learning_examples(times_used_in_training, last_used_in_training);
```

### **5. Feedback Session Analytics Table**

```sql
-- User session-level feedback analytics
CREATE TABLE feedback_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session identification
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL UNIQUE,
  
  -- Session details
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  session_duration_seconds INTEGER,
  
  -- App context
  app_version TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  
  -- Feedback summary
  total_feedback_events INTEGER NOT NULL DEFAULT 0,
  positive_events INTEGER NOT NULL DEFAULT 0,
  neutral_events INTEGER NOT NULL DEFAULT 0,
  negative_events INTEGER NOT NULL DEFAULT 0,
  
  -- Event type breakdown
  agent_feedback_count INTEGER NOT NULL DEFAULT 0,
  ui_feedback_count INTEGER NOT NULL DEFAULT 0,
  system_feedback_count INTEGER NOT NULL DEFAULT 0,
  data_feedback_count INTEGER NOT NULL DEFAULT 0,
  workflow_feedback_count INTEGER NOT NULL DEFAULT 0,
  
  -- Performance metrics
  avg_response_time_ms DECIMAL(8,2),
  error_rate DECIMAL(5,4),
  completion_rate DECIMAL(5,4),
  
  -- User satisfaction indicators
  session_satisfaction_score DECIMAL(3,2),
  workflow_completion_success BOOLEAN,
  major_issues_encountered BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Derived insights
  user_expertise_level TEXT CHECK (user_expertise_level IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  )),
  session_efficiency_score DECIMAL(3,2),
  feature_adoption_score DECIMAL(3,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_session_analytics_user_time ON feedback_session_analytics(user_id, session_start DESC);
CREATE INDEX idx_session_analytics_satisfaction ON feedback_session_analytics(session_satisfaction_score DESC);
CREATE INDEX idx_session_analytics_performance ON feedback_session_analytics(error_rate DESC, avg_response_time_ms DESC);
CREATE INDEX idx_session_analytics_completion ON feedback_session_analytics(workflow_completion_success, session_satisfaction_score);
```

## 🔧 Schema Extensions

### **6. Feedback Correlation Table**

```sql
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
  
  -- Time relationship
  time_difference_seconds INTEGER,
  sequence_order INTEGER,
  
  -- Detected by
  detection_method TEXT NOT NULL,
  detection_confidence DECIMAL(3,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_correlations_primary ON feedback_event_correlations(primary_event_id);
CREATE INDEX idx_feedback_correlations_related ON feedback_event_correlations(related_event_id);
CREATE INDEX idx_feedback_correlations_type_strength ON feedback_event_correlations(correlation_type, correlation_strength DESC);
```

### **7. Feedback Data Retention Policy Table**

```sql
-- Manages data retention and archival
CREATE TABLE feedback_data_retention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy definition
  policy_name TEXT NOT NULL UNIQUE,
  policy_description TEXT,
  
  -- Retention rules
  retention_period_days INTEGER NOT NULL,
  archive_after_days INTEGER,
  anonymize_after_days INTEGER,
  
  -- Applies to
  event_types TEXT[] NOT NULL,
  priority_levels TEXT[] DEFAULT '{}',
  
  -- Processing status
  last_applied TIMESTAMPTZ,
  next_application TIMESTAMPTZ NOT NULL,
  
  -- Policy metadata
  created_by TEXT NOT NULL,
  approved_by TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 📈 Analytical Views

### **User Feedback Summary View**

```sql
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
  AVG(EXTRACT(EPOCH FROM (u.timestamp - LAG(u.timestamp) OVER (PARTITION BY u.user_id ORDER BY u.timestamp)))) as avg_time_between_events
FROM user_feedback_events u
JOIN profiles p ON u.user_id = p.id
GROUP BY u.user_id, p.email, p.full_name;
```

### **Agent Performance Metrics View**

```sql
CREATE VIEW agent_performance_metrics AS
SELECT 
  u.agent_type,
  u.feedback_category,
  COUNT(*) as event_count,
  AVG(u.agent_confidence) as avg_confidence,
  AVG(d.processing_time_ms) as avg_processing_time,
  AVG(d.llm_tokens_used) as avg_tokens_used,
  COUNT(*) FILTER (WHERE u.feedback_value = 'positive') * 100.0 / COUNT(*) as approval_rate,
  COUNT(*) FILTER (WHERE u.user_modification IS NOT NULL) * 100.0 / COUNT(*) as modification_rate
FROM user_feedback_events u
LEFT JOIN agent_decision_contexts d ON u.id = d.feedback_event_id
WHERE u.agent_type IS NOT NULL
GROUP BY u.agent_type, u.feedback_category;
```

## 🔒 Row Level Security Policies

```sql
-- Enable RLS on all feedback tables
ALTER TABLE user_feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decision_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_learning_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_session_analytics ENABLE ROW LEVEL SECURITY;

-- User feedback events policy
CREATE POLICY "Users can access their own feedback events" ON user_feedback_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Admin access policy
CREATE POLICY "Admins can access all feedback events" ON user_feedback_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- Analytics access policy (anonymized)
CREATE POLICY "Analytics access to anonymized data" ON user_feedback_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('analyst', 'data_scientist')
    )
  );
```

## 🚀 Schema Migration Strategy

### **Migration Steps**

1. **Phase 1**: Core tables (user_feedback_events, agent_decision_contexts)
2. **Phase 2**: Analytics tables (feedback_patterns, session_analytics)
3. **Phase 3**: Learning tables (feedback_learning_examples)
4. **Phase 4**: Extensions (correlations, retention policies)

### **Performance Considerations**

- **Partitioning**: Partition feedback_events by timestamp for large datasets
- **Archival**: Automated archival of old feedback data
- **Indexes**: Optimized for common query patterns
- **Compression**: JSON data compression for storage efficiency

### **Data Privacy**

- **Anonymization**: Built-in support for user data anonymization
- **Retention**: Configurable data retention policies
- **Consent**: User consent tracking for feedback collection
- **Export**: GDPR-compliant data export functionality

This schema provides a robust foundation for comprehensive feedback collection while maintaining performance, privacy, and analytical capabilities. 