# TradeFlow Feedback Event Taxonomy

## 📋 Overview

This document defines the complete taxonomy of feedback events for the TradeFlow mobile app. Every user interaction that could provide valuable learning data for the AI agents and system optimization is categorized and standardized.

## 🎯 Feedback Event Categories

### **1. AI AGENT FEEDBACK EVENTS**

#### **1.1 Dispatch Strategist Feedback**
```typescript
interface DispatchFeedbackEvent {
  event_type: 'agent_feedback';
  agent_type: 'dispatch_strategist';
  feedback_category: 'approval' | 'modification' | 'rejection';
  feedback_subcategory: 
    | 'job_reordering'           // User changes job priority order
    | 'time_adjustment'          // User modifies estimated times
    | 'job_removal'              // User removes suggested job
    | 'priority_disagreement'    // User disagrees with priority logic
    | 'emergency_handling'       // User feedback on emergency job handling
    | 'client_priority_override' // User overrides client priority
    | 'schedule_conflict'        // User identifies scheduling conflicts
    | 'reasoning_clarity';       // User feedback on AI explanation quality
  
  original_decision: DispatchOutput;
  user_modification: UserModifications['dispatch_changes'];
  context: {
    job_count: number;
    plan_date: string;
    user_preferences_snapshot: Record<string, any>;
    time_of_feedback: string;
    decision_confidence: number; // AI's confidence in original decision
  };
}
```

#### **1.2 Route Optimizer Feedback**
```typescript
interface RouteFeedbackEvent {
  event_type: 'agent_feedback';
  agent_type: 'route_optimizer';
  feedback_category: 'approval' | 'modification' | 'rejection';
  feedback_subcategory:
    | 'route_reordering'         // User changes route sequence
    | 'waypoint_modification'    // User adjusts specific waypoints
    | 'travel_time_disagreement' // User disputes travel time estimates
    | 'route_preference'         // User prefers different route type
    | 'traffic_feedback'         // User provides real-time traffic input
    | 'break_location_change'    // User modifies break/lunch locations
    | 'efficiency_disagreement'  // User questions optimization logic
    | 'safety_concern';          // User raises safety issues with route
  
  original_decision: RouteOutput;
  user_modification: UserModifications['route_changes'];
  context: {
    total_distance: number;
    total_travel_time: number;
    waypoint_count: number;
    traffic_conditions: string;
    weather_conditions: string;
    time_of_feedback: string;
  };
}
```

#### **1.3 Inventory Specialist Feedback**
```typescript
interface InventoryFeedbackEvent {
  event_type: 'agent_feedback';
  agent_type: 'inventory_specialist';
  feedback_category: 'approval' | 'modification' | 'rejection';
  feedback_subcategory:
    | 'parts_list_modification'   // User adds/removes parts
    | 'quantity_adjustment'       // User changes quantities
    | 'supplier_preference'       // User prefers different supplier
    | 'parts_substitution'        // User suggests part alternatives
    | 'stock_level_correction'    // User corrects current inventory
    | 'shopping_list_optimization'// User improves shopping list
    | 'store_location_preference' // User prefers different store
    | 'cost_optimization';        // User provides cost feedback
  
  original_decision: InventoryOutput;
  user_modification: UserModifications['inventory_changes'];
  context: {
    parts_count: number;
    shopping_items_count: number;
    estimated_cost: number;
    supplier_used: string;
    inventory_accuracy: number;
    time_of_feedback: string;
  };
}
```

### **2. USER INTERFACE FEEDBACK EVENTS**

#### **2.1 Form Interaction Feedback**
```typescript
interface FormFeedbackEvent {
  event_type: 'ui_feedback';
  interaction_type: 'form_interaction';
  feedback_category: 'completion' | 'abandonment' | 'error' | 'struggle';
  feedback_subcategory:
    | 'field_validation_issue'   // User encounters validation problems
    | 'form_complexity'          // Form too complex or confusing
    | 'input_difficulty'         // Specific input fields problematic
    | 'flow_confusion'           // User confused by form flow
    | 'missing_option'           // User needs option not provided
    | 'help_needed'              // User seeks help or guidance
    | 'successful_completion'    // Form completed successfully
    | 'partial_completion';      // Form partially completed
  
  form_metadata: {
    form_type: 'onboarding' | 'profile' | 'job' | 'client' | 'inventory';
    form_step?: string;
    fields_completed: string[];
    fields_skipped: string[];
    fields_with_errors: string[];
    completion_time_seconds: number;
    retry_attempts: number;
  };
}
```

#### **2.2 Navigation Feedback**
```typescript
interface NavigationFeedbackEvent {
  event_type: 'ui_feedback';
  interaction_type: 'navigation';
  feedback_category: 'successful' | 'confused' | 'blocked' | 'redirected';
  feedback_subcategory:
    | 'expected_navigation'      // User navigated as expected
    | 'unexpected_redirect'      // System redirected unexpectedly
    | 'dead_end'                 // User reached dead end
    | 'back_button_confusion'    // User confusion with back navigation
    | 'tab_switching_pattern'    // User tab usage patterns
    | 'deep_link_issue'          // Problems with deep linking
    | 'onboarding_flow_issue'    // Onboarding navigation problems
    | 'auth_flow_confusion';     // Authentication flow issues
  
  navigation_metadata: {
    from_screen: string;
    to_screen: string;
    navigation_method: 'tap' | 'gesture' | 'system_redirect' | 'deep_link';
    time_on_previous_screen: number;
    user_intent: string;
    successful: boolean;
  };
}
```

### **3. SYSTEM PERFORMANCE FEEDBACK EVENTS**

#### **3.1 Loading & Performance Feedback**
```typescript
interface PerformanceFeedbackEvent {
  event_type: 'system_feedback';
  interaction_type: 'performance';
  feedback_category: 'acceptable' | 'slow' | 'error' | 'timeout';
  feedback_subcategory:
    | 'loading_time_excessive'   // User experiences slow loading
    | 'api_timeout'              // API requests timing out
    | 'offline_sync_issue'       // Offline synchronization problems
    | 'memory_performance'       // App performance issues
    | 'battery_drain'            // Excessive battery usage
    | 'data_usage_concern'       // High data usage
    | 'cache_effectiveness'      // Cache performance issues
    | 'smooth_experience';       // Positive performance feedback
  
  performance_metadata: {
    operation_type: string;
    duration_ms: number;
    network_quality: 'excellent' | 'good' | 'poor' | 'offline';
    device_specs: Record<string, any>;
    memory_usage_mb: number;
    battery_level: number;
  };
}
```

#### **3.2 Error Handling Feedback**
```typescript
interface ErrorFeedbackEvent {
  event_type: 'system_feedback';
  interaction_type: 'error_handling';
  feedback_category: 'resolved' | 'unresolved' | 'user_blocked' | 'data_loss';
  feedback_subcategory:
    | 'network_error_recovery'   // Network error handling effectiveness
    | 'auth_error_clarity'       // Authentication error messaging
    | 'validation_error_help'    // Form validation error helpfulness
    | 'database_error_recovery'  // Database error handling
    | 'offline_error_graceful'   // Offline state error handling
    | 'retry_mechanism_success'  // Retry mechanisms effectiveness
    | 'error_message_clarity'    // Error message understanding
    | 'recovery_path_clear';     // Clear path to resolve error
  
  error_metadata: {
    error_type: string;
    error_code?: string;
    error_message: string;
    recovery_attempted: boolean;
    recovery_successful: boolean;
    user_action_taken: string;
    context_lost: boolean;
  };
}
```

### **4. DATA QUALITY FEEDBACK EVENTS**

#### **4.1 Data Accuracy Feedback**
```typescript
interface DataAccuracyFeedbackEvent {
  event_type: 'data_feedback';
  interaction_type: 'data_quality';
  feedback_category: 'accurate' | 'inaccurate' | 'outdated' | 'missing';
  feedback_subcategory:
    | 'inventory_count_wrong'    // Inventory quantities incorrect
    | 'client_info_outdated'     // Client information out of date
    | 'job_details_incomplete'   // Job information missing details
    | 'location_data_wrong'      // GPS/address data incorrect
    | 'preference_not_applied'   // User preferences not respected
    | 'sync_data_conflict'       // Data synchronization conflicts
    | 'suggested_data_helpful'   // AI suggestions were accurate
    | 'import_data_quality';     // Data import quality issues
  
  data_metadata: {
    data_type: string;
    record_id: string;
    expected_value: any;
    actual_value: any;
    confidence_level: number;
    last_updated: string;
    source: 'user_input' | 'ai_generated' | 'imported' | 'synced';
  };
}
```

### **5. WORKFLOW EFFICIENCY FEEDBACK EVENTS**

#### **5.1 Process Optimization Feedback**
```typescript
interface ProcessFeedbackEvent {
  event_type: 'workflow_feedback';
  interaction_type: 'process_efficiency';
  feedback_category: 'efficient' | 'redundant' | 'missing_step' | 'confusing';
  feedback_subcategory:
    | 'onboarding_too_long'      // Onboarding process excessive
    | 'daily_planning_helpful'   // Daily planning workflow effective
    | 'job_creation_smooth'      // Job creation process smooth
    | 'approval_process_clear'   // Approval processes clear
    | 'data_entry_redundant'     // Redundant data entry required
    | 'workflow_interruption'    // Workflow unnecessarily interrupted
    | 'automation_beneficial'    // Automation helped productivity
    | 'manual_override_needed';  // Manual intervention required
  
  workflow_metadata: {
    workflow_type: string;
    steps_completed: string[];
    steps_skipped: string[];
    total_time_seconds: number;
    interruptions_count: number;
    efficiency_score: number;
    user_satisfaction: 1 | 2 | 3 | 4 | 5;
  };
}
```

## 🎯 Feedback Collection Triggers

### **Explicit Feedback Triggers**
- User actively approves/rejects AI suggestions
- User modifies AI-generated plans
- User submits forms with validation errors
- User reports bugs or issues
- User provides ratings or reviews

### **Implicit Feedback Triggers**
- User behavior patterns (time spent, clicks, navigation)
- System performance metrics (load times, error rates)
- Data quality indicators (correction frequency, validation failures)
- Workflow completion rates and abandonment patterns
- Feature usage analytics and adoption metrics

## 🏷️ Feedback Event Metadata Standards

### **Universal Metadata** (included in all events)
```typescript
interface UniversalFeedbackMetadata {
  event_id: string;
  user_id: string;
  session_id: string;
  timestamp: string;
  app_version: string;
  platform: 'ios' | 'android' | 'web';
  device_info: Record<string, any>;
  network_quality: 'excellent' | 'good' | 'poor' | 'offline';
  user_context: {
    screen: string;
    previous_screen?: string;
    user_flow: string;
    time_since_session_start: number;
  };
}
```

### **Contextual Metadata** (varies by event type)
- **User Preferences**: Current user settings and preferences
- **System State**: Current app state, loaded data, cache status
- **Environmental**: Time of day, location, connectivity
- **Historical**: Previous similar events, patterns, trends

## 🎨 Feedback Categorization Schema

### **Feedback Values** (standardized across all events)
- **Positive**: `approval`, `successful`, `efficient`, `accurate`, `helpful`
- **Neutral**: `partial`, `acceptable`, `unclear`, `mixed`
- **Negative**: `rejection`, `error`, `slow`, `confusing`, `unhelpful`

### **Feedback Confidence Levels**
- **High**: Direct user action (explicit approval/rejection)
- **Medium**: Clear behavioral pattern (repeated action)
- **Low**: Inferred from usage patterns or timing

### **Feedback Priority Levels**
- **Critical**: Impacts core functionality or user safety
- **High**: Affects user productivity or satisfaction
- **Medium**: Influences user experience quality
- **Low**: Minor convenience or preference indicators

## 📊 Feedback Analytics Categories

1. **Agent Learning**: Feedback specifically for AI agent improvement
2. **UX Optimization**: Feedback for user interface and experience enhancement
3. **System Performance**: Feedback for technical performance optimization
4. **Feature Development**: Feedback for new feature prioritization
5. **Bug Detection**: Feedback for identifying and fixing issues

---

## 🔄 Feedback Event Lifecycle

1. **Collection**: Capture feedback event with full context
2. **Validation**: Ensure data quality and completeness
3. **Categorization**: Apply taxonomy and classification
4. **Storage**: Persist with appropriate retention policies
5. **Analysis**: Process for patterns and insights
6. **Action**: Apply learnings to system improvements
7. **Monitoring**: Track impact of changes made

This taxonomy serves as the foundation for comprehensive feedback collection across the entire TradeFlow system, enabling continuous learning and optimization. 