# TradeFlow Mobile App - Complete Database Schema Documentation

*Last Updated: January 2025*

## 📋 Overview

This document provides a comprehensive overview of the TradeFlow mobile app's Supabase database schema. The database supports intelligent tradesmen tracking with maps, GPS tracking, user routes, AI-powered daily planning, comprehensive feedback analytics, and user onboarding systems.

## 🏗️ Database Architecture

### **Core Business Tables**

#### 1. **`profiles`** - User Management
Extended user profiles with business context.

**Key Fields:**
- `id` (UUID, PK) - Links to `auth.users`
- `email` (TEXT, UNIQUE) - User email address
- `first_name`, `last_name` (TEXT) - User names
- `full_name` (TEXT) - Complete name
- `company_name` (TEXT) - Business information
- `phone`, `address`, `city`, `state`, `zip_code` (TEXT) - Contact info
- `timezone` (TEXT, default: 'America/New_York')
- `preferences` (JSONB) - User preferences and settings
- `onboarding_completed_at` (TIMESTAMPTZ) - Onboarding completion time
- `role` (TEXT, default: 'user') - User role

**Relationships:**
- Parent to all user-specific data tables
- Foreign key to `auth.users(id)`

---

#### 2. **`inventory_items`** - Parts and Inventory Management
Complete inventory tracking with supplier information.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `name` (TEXT) - Item name
- `description` (TEXT) - Item description
- `quantity` (INTEGER) - Current stock
- `unit` (TEXT, default: 'each') - Unit of measurement
- `category` (TEXT) - Item category
- `status` (TEXT) - 'available', 'low_stock', 'out_of_stock', 'discontinued'
- `min_quantity`, `max_quantity` (INTEGER) - Stock thresholds
- `cost_per_unit` (NUMERIC) - Unit cost
- `supplier` (TEXT) - Supplier name
- `supplier_part_number` (TEXT) - Supplier SKU
- `barcode` (TEXT) - Barcode for scanning
- `image_url` (TEXT) - Product image
- `tags` (TEXT[]) - Searchable tags

**Business Logic:**
- Automatic status updates based on quantity thresholds
- Integration with job requirements and inventory movements

---

#### 3. **`job_locations`** - Work Orders and Jobs
Individual job/work order management with comprehensive tracking.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `title` (TEXT) - Job title
- `description` (TEXT) - Job description
- `job_type` (TEXT) - 'delivery', 'pickup', 'service', 'inspection', 'maintenance', 'emergency'
- `priority` (TEXT) - 'low', 'medium', 'high', 'urgent'
- `status` (TEXT) - 'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
- `latitude`, `longitude` (NUMERIC) - GPS coordinates
- `address`, `city`, `state`, `zip_code` (TEXT) - Location details
- `scheduled_date` (TIMESTAMPTZ) - Scheduled appointment time
- `estimated_duration` (INTEGER) - Expected duration in minutes
- `actual_start_time`, `actual_end_time` (TIMESTAMPTZ) - Actual timing
- `customer_name`, `customer_phone`, `customer_email` (TEXT) - Customer info
- `instructions` (TEXT) - Special instructions
- `required_items` (UUID[]) - Required inventory items
- `completion_notes` (TEXT) - Job completion notes
- `completion_photos` (TEXT[]) - Photo URLs

**Integration:**
- Links to inventory items for material requirements
- Used in route optimization and daily planning
- Tracks actual vs estimated performance

---

#### 4. **`routes`** - Route Planning and Optimization
Optimized route management for efficient job scheduling.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `name` (TEXT) - Route name
- `description` (TEXT) - Route description
- `status` (TEXT) - 'planned', 'active', 'completed', 'cancelled'
- `job_location_ids` (UUID[]) - Ordered list of job locations
- `optimized_order` (UUID[]) - AI-optimized job order
- `total_distance` (NUMERIC) - Total route distance
- `estimated_time` (INTEGER) - Estimated total time
- `planned_date` (DATE) - Route execution date
- `start_time`, `end_time` (TIMESTAMPTZ) - Actual execution times

**AI Integration:**
- Optimized by route optimization AI agent
- Considers traffic, job priorities, and time windows

---

#### 5. **`inventory_movements`** - Inventory Audit Trail
Complete audit trail for inventory changes.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `inventory_item_id` (UUID, FK to inventory_items)
- `movement_type` (TEXT) - 'stock_in', 'stock_out', 'adjustment', 'transfer', 'job_used'
- `quantity_change` (INTEGER) - Quantity changed (positive or negative)
- `previous_quantity`, `new_quantity` (INTEGER) - Before/after quantities
- `reason` (TEXT) - Reason for movement
- `job_location_id` (UUID, FK to job_locations) - Associated job (if applicable)
- `notes` (TEXT) - Additional notes

**Business Value:**
- Complete inventory tracking and auditing
- Job-specific material usage tracking
- Automated stock level management

---

### **AI & Planning System**

#### 6. **`daily_plans`** - AI-Powered Daily Planning
Central table for AI agent daily planning workflow.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `status` (TEXT) - 'pending', 'dispatch_complete', 'route_complete', 'inventory_complete', 'approved', 'cancelled', 'error'
- `current_step` (TEXT) - 'dispatch', 'route', 'inventory', 'complete'
- `planned_date` (DATE) - Date for the plan
- `dispatch_output` (JSONB) - AI dispatch strategist output
- `route_output` (JSONB) - AI route optimizer output
- `inventory_output` (JSONB) - AI inventory specialist output
- `user_modifications` (JSONB) - User changes to AI recommendations
- `preferences_snapshot` (JSONB) - User preferences at planning time
- `job_ids` (UUID[]) - Jobs included in plan
- `created_job_ids` (UUID[]) - Jobs created by AI
- `error_state` (JSONB) - Error information if planning fails
- `retry_count` (INTEGER) - Number of retry attempts
- `total_estimated_duration` (INTEGER) - Total planned duration
- `total_distance` (NUMERIC) - Total planned distance
- `started_at`, `completed_at` (TIMESTAMPTZ) - Execution timing

**AI Workflow:**
1. Dispatch Strategist analyzes pending jobs and creates recommendations
2. Route Optimizer creates efficient route plans
3. Inventory Specialist checks material availability
4. User reviews and modifies plan
5. Plan is approved and executed

---

### **Comprehensive Feedback & Analytics System**

#### 7. **`user_feedback_events`** - Core Feedback Events
Central table for all user feedback and AI interaction data.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `session_id` (UUID) - User session identifier
- `event_type` (TEXT) - 'agent_feedback', 'ui_feedback', 'system_feedback', 'data_feedback', 'workflow_feedback'
- `interaction_type` (TEXT) - Specific interaction category
- `feedback_category`, `feedback_subcategory` (TEXT) - Detailed classification
- `timestamp` (TIMESTAMPTZ) - Event occurrence time
- `event_sequence_number` (INTEGER) - Order within session
- `event_data` (JSONB) - Flexible event-specific data
- `event_metadata` (JSONB) - Technical metadata
- `user_context` (JSONB) - User state at time of event
- `system_context` (JSONB) - System state information
- `environmental_context` (JSONB) - Environmental factors
- `agent_type` (TEXT) - 'dispatch_strategist', 'route_optimizer', 'inventory_specialist'
- `agent_version` (TEXT) - Agent version identifier
- `agent_confidence` (NUMERIC) - AI confidence score (0.0-1.0)
- `original_decision` (JSONB) - Original AI decision
- `user_modification` (JSONB) - User changes to AI decision
- `feedback_value` (TEXT) - 'positive', 'neutral', 'negative'
- `confidence_level` (TEXT) - 'high', 'medium', 'low'
- `priority_level` (TEXT) - 'critical', 'high', 'medium', 'low'
- `processed` (BOOLEAN) - Whether event has been analyzed
- `analysis_result` (JSONB) - Analysis output

**Purpose:**
- Capture all user interactions with AI systems
- Enable continuous learning and improvement
- Support detailed analytics and insights

---

#### 8. **`agent_decision_contexts`** - AI Decision Context
Detailed context for every AI agent decision to enable learning.

**Key Fields:**
- `id` (UUID, PK)
- `feedback_event_id` (UUID, FK to user_feedback_events)
- `agent_type` (TEXT) - Which AI agent made the decision
- `agent_version` (TEXT) - Agent version
- `decision_id` (UUID) - Unique decision identifier
- `decision_timestamp` (TIMESTAMPTZ) - When decision was made
- `input_data` (JSONB) - Input data provided to agent
- `processing_time_ms` (INTEGER) - Decision processing time
- `decision_output` (JSONB) - Agent's decision output
- `confidence_score` (NUMERIC) - Decision confidence (0.0-1.0)
- `alternative_options` (JSONB) - Other options considered
- `reasoning_explanation` (TEXT) - Human-readable reasoning
- `user_preferences_snapshot` (JSONB) - User preferences at decision time
- `preference_influence_score` (NUMERIC) - How much preferences influenced decision
- `external_data_used` (JSONB) - External data sources used
- `api_calls_made` (JSONB) - API calls made during decision
- `llm_tokens_used` (INTEGER) - Language model tokens consumed
- `llm_cost_cents` (INTEGER) - Cost of decision in cents
- `cache_hit_rate` (NUMERIC) - Cache efficiency

**Value:**
- Enable detailed analysis of AI decision-making
- Support model improvement and training
- Track performance and costs

---

#### 9. **`feedback_patterns`** - Automated Pattern Detection
AI-detected patterns in user feedback for system improvement.

**Key Fields:**
- `id` (UUID, PK)
- `pattern_type` (TEXT) - 'user_behavior', 'agent_performance', 'system_issue', 'workflow_efficiency', 'data_quality'
- `pattern_name` (TEXT) - Human-readable pattern name
- `detection_algorithm` (TEXT) - Algorithm that detected pattern
- `confidence_score` (NUMERIC) - Pattern confidence (0.0-1.0)
- `event_count` (INTEGER) - Number of events in pattern
- `user_count` (INTEGER) - Number of users affected
- `time_period_start`, `time_period_end` (TIMESTAMPTZ) - Pattern time window
- `pattern_data` (JSONB) - Detailed pattern information
- `statistical_metrics` (JSONB) - Statistical analysis
- `sample_event_ids` (UUID[]) - Sample events demonstrating pattern
- `severity_level` (TEXT) - 'critical', 'high', 'medium', 'low'
- `business_impact` (TEXT) - Business impact description
- `recommended_actions` (JSONB) - Recommended fixes
- `status` (TEXT) - 'detected', 'investigating', 'resolved', 'dismissed'

**Automation:**
- Automatically detects issues and opportunities
- Provides actionable insights for improvements
- Tracks resolution progress

---

#### 10. **`feedback_learning_examples`** - AI Training Data
Curated examples for continuous AI agent improvement.

**Key Fields:**
- `id` (UUID, PK)
- `source_feedback_event_id` (UUID, FK to user_feedback_events)
- `source_decision_context_id` (UUID, FK to agent_decision_contexts)
- `example_type` (TEXT) - 'positive_example', 'negative_example', 'edge_case', 'preference_learning', 'error_recovery'
- `learning_category` (TEXT) - Learning classification
- `input_features` (JSONB) - Input data for training
- `expected_output` (JSONB) - Desired output
- `actual_output` (JSONB) - What AI actually produced
- `correction_provided` (JSONB) - User correction
- `context_snapshot` (JSONB) - Context at time of decision
- `learning_value_score` (NUMERIC) - Value for training (0.0-1.0)
- `generalization_potential` (TEXT) - 'high', 'medium', 'low'
- `complexity_level` (INTEGER) - Complexity (1-5)
- `times_used_in_training` (INTEGER) - Usage count
- `training_effectiveness_score` (NUMERIC) - Training effectiveness
- `validated` (BOOLEAN) - Quality validation status

**AI Learning:**
- Continuous improvement of AI agents
- Quality-controlled training examples
- Tracks learning effectiveness

---

#### 11. **`feedback_session_analytics`** - User Session Analytics
Session-level analytics for user experience optimization.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `session_id` (UUID, UNIQUE) - Session identifier
- `session_start`, `session_end` (TIMESTAMPTZ) - Session timing
- `session_duration_seconds` (INTEGER) - Total session time
- `app_version` (TEXT) - App version used
- `platform` (TEXT) - Platform (iOS, Android, Web)
- `device_info` (JSONB) - Device information
- Feedback event counts by type
- Performance metrics (response time, error rate, completion rate)
- `session_satisfaction_score` (NUMERIC) - Overall satisfaction
- `workflow_completion_success` (BOOLEAN) - Workflow success
- User expertise and efficiency scores

**Analytics:**
- Session-level user experience tracking
- Performance monitoring
- User satisfaction measurement

---

#### 12. **`feedback_event_correlations`** - Event Relationship Analysis
Links related feedback events for pattern analysis.

**Key Fields:**
- `id` (UUID, PK)
- `primary_event_id` (UUID, FK to user_feedback_events)
- `related_event_id` (UUID, FK to user_feedback_events)
- `correlation_type` (TEXT) - 'temporal', 'causal', 'contextual', 'user_pattern', 'system_related'
- `correlation_strength` (NUMERIC) - Strength (0.0-1.0)
- `correlation_explanation` (TEXT) - Human-readable explanation
- `time_difference_seconds` (INTEGER) - Time between events
- `detection_method` (TEXT) - How correlation was detected
- `detection_confidence` (NUMERIC) - Detection confidence

**Analysis:**
- Identifies related events and patterns
- Supports causal analysis
- Improves pattern detection accuracy

---

#### 13. **`feedback_retention_policies`** - Data Lifecycle Management
Manages data retention, privacy, and archival policies.

**Key Fields:**
- `id` (UUID, PK)
- `policy_name` (TEXT, UNIQUE) - Policy identifier
- `table_name` (TEXT) - Target table
- `data_filter` (JSONB) - Data selection criteria
- Retention periods for different data lifecycle stages
- Transition actions (pseudonymize, anonymize, archive, delete)
- Processing configuration (batch size, schedule)
- Compliance flags (legal hold, GDPR, audit requirements)
- Execution tracking

**Compliance:**
- GDPR compliance
- Data retention management
- Privacy protection
- Automated data lifecycle

---

### **Map Integration System**

#### 14. **`supported_map_apps`** - Map Application Registry
Registry of supported map applications with capabilities.

**Key Fields:**
- `id` (UUID, PK)
- `app_name` (TEXT, UNIQUE) - Internal app identifier
- `app_display_name` (TEXT) - User-friendly name
- `app_description` (TEXT) - App description
- Platform availability (`ios_available`, `android_available`, `web_available`)
- Platform-specific identifiers (bundle ID, package name, web URL)
- Feature support flags (directions, search, coordinates, address)
- Configuration (active status, sort order, popularity score)
- `icon_url` (TEXT) - App icon URL

**Integration:**
- Supports multiple map applications
- Platform-specific deep linking
- Feature capability mapping

---

#### 15. **`map_app_deep_links`** - Deep Link Configuration
Deep link URL templates and configuration for map applications.

**Key Fields:**
- `id` (UUID, PK)
- `map_app_id` (UUID, FK to supported_map_apps, UNIQUE)
- URL templates for different functions:
  - `directions_url_template` (TEXT) - Navigation directions
  - `search_url_template` (TEXT) - Location search
  - `coordinate_url_template` (TEXT) - Coordinate-based navigation
  - `address_url_template` (TEXT) - Address-based navigation
- Platform-specific schemes (`ios_url_scheme`, `android_intent_action`)
- Configuration flags (default for platform, app detection, web fallback)
- Testing status and timestamps

**Deep Linking:**
- Template-based URL generation
- Platform-specific handling
- Fallback strategies

---

#### 16. **`user_map_preferences`** - User Map Preferences
User-specific map application preferences and settings.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles, UNIQUE)
- Map app preferences by platform:
  - `preferred_map_app_id` (UUID, FK to supported_map_apps) - Overall preference
  - `ios_preferred_app_id` (UUID) - iOS-specific preference
  - `android_preferred_app_id` (UUID) - Android-specific preference
  - `web_preferred_app_id` (UUID) - Web-specific preference
- `fallback_map_apps` (UUID[]) - Fallback options
- Behavior preferences:
  - `auto_open_directions` (BOOLEAN) - Automatically open directions
  - `prompt_before_opening` (BOOLEAN) - Show confirmation dialog
  - `remember_choice` (BOOLEAN) - Remember user choices
  - `prefer_navigation_for_long_routes` (BOOLEAN) - Use navigation apps for long routes
  - `long_route_threshold_miles` (NUMERIC) - Distance threshold
- Privacy settings (`allow_usage_analytics`, `allow_performance_tracking`)
- Usage tracking (`last_used_app_id`, `total_usage_count`)

**Personalization:**
- Platform-specific preferences
- Smart app selection
- Privacy controls

---

#### 17. **`map_integration_analytics`** - Map Usage Analytics
Detailed analytics for map integration usage and performance.

**Key Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `event_type` (TEXT) - Type of map integration event
- `map_app_id` (UUID, FK to supported_map_apps) - App used
- `platform` (TEXT) - Platform (iOS, Android, Web)
- `request_type` (TEXT) - 'directions', 'search', 'coordinates', 'address'
- `source_screen` (TEXT) - Where request originated
- Location data (origin/destination coordinates, search query)
- Performance metrics:
  - `detection_time_ms` (INTEGER) - App detection time
  - `app_launch_time_ms` (INTEGER) - App launch time
  - `total_interaction_time_ms` (INTEGER) - Total interaction time
- Success/failure tracking:
  - `app_detection_successful` (BOOLEAN)
  - `deep_link_successful` (BOOLEAN)
  - `user_completed_action` (BOOLEAN)
  - `returned_to_app` (BOOLEAN)
- Error information (`error_type`, `error_message`)
- Fallback usage (`fallback_used`, `fallback_app_id`)
- Context (`job_location_id`, `session_id`)

**Analytics:**
- Map integration performance monitoring
- User behavior analysis
- Error tracking and optimization
- A/B testing support

---

## 🔄 **Data Relationships & Flow**

### **Core Business Flow**
```
profiles → job_locations → routes → daily_plans
    ↓           ↓             ↓
inventory_items → inventory_movements
```

### **AI & Feedback Flow**
```
daily_plans → user_feedback_events → agent_decision_contexts
                        ↓
            feedback_learning_examples ← feedback_patterns
                        ↓
            feedback_session_analytics
```

### **Map Integration Flow**
```
job_locations → user_map_preferences → supported_map_apps
                        ↓                       ↓
            map_integration_analytics ← map_app_deep_links
```

## 🔒 **Security & Compliance**

### **Row Level Security (RLS)**
- All tables have RLS enabled
- User-specific data isolated by `user_id`
- Admin access for system management
- Analytics access with anonymization

### **Data Privacy**
- GDPR compliance through retention policies
- Automated data anonymization
- User consent tracking
- Right to deletion support

### **Audit Trail**
- Complete inventory movement tracking
- AI decision context preservation
- User feedback event logging
- Change tracking on all critical tables

## 📊 **Analytics & Insights**

### **Business Intelligence**
- User behavior patterns
- AI agent performance metrics
- Workflow efficiency analysis
- Inventory optimization insights

### **System Performance**
- API response times
- Error rates and patterns
- User satisfaction scores
- Feature adoption tracking

### **Continuous Improvement**
- Automated pattern detection
- AI model training data
- User preference learning
- System optimization recommendations

## 🚀 **Scalability Considerations**

### **Performance Optimizations**
- Strategic indexes on high-query columns
- GIN indexes for JSONB fields
- Partitioning for time-series data
- Materialized views for analytics

### **Data Lifecycle Management**
- Automated data archival
- Retention policy enforcement
- Performance monitoring
- Cost optimization

## 📈 **Migration Status**

### **Completed Migrations**
1. `001-initial-schema.sql` - Core business tables
2. `002-profile-signup-fix.sql` - Profile enhancements
3. `003-daily-plans-table.sql` - AI planning system
4. `004-onboarding-configuration.sql` - Onboarding system
5. `005-onboarding-analytics-functions.sql` - Onboarding analytics
6. `006-feedback-logging.sql` - Comprehensive feedback system
7. `007-map-preferences.sql` - Map integration system

### **Current Schema Completeness**
- ✅ Core business operations (100%)
- ✅ AI agent integration (100%)
- ✅ Feedback & analytics system (100%)
- ✅ Map integration (100%)
- ⚠️ Bill of Materials system (planned)
- ⚠️ Advanced inventory optimization (planned)

---

*This documentation reflects the current production state of the TradeFlow Supabase database as of January 2025.* 