# TradeFlow Feedback System API Integration Guide

## Overview

This guide provides complete instructions for integrating the TradeFlow feedback system with AI agents, frontend components, and analytics systems. The feedback system captures user interactions, agent decisions, and learning insights to continuously improve the AI agents.

## Table of Contents

1. [Quick Start](#quick-start)
2. [React Hook Integration](#react-hook-integration)
3. [Agent Integration Patterns](#agent-integration-patterns)
4. [Service Layer Integration](#service-layer-integration)
5. [Analytics Integration](#analytics-integration)
6. [Real-time Feedback Collection](#real-time-feedback-collection)
7. [Error Handling & Best Practices](#error-handling--best-practices)
8. [Performance Optimization](#performance-optimization)

---

## Quick Start

### 1. Installation & Setup

The feedback system is already integrated into the TradeFlow codebase. To use it:

```typescript
// Import the feedback hooks
import { 
  useLogFeedback, 
  useLogAgentDecision, 
  useFeedbackTrends,
  useAgentPerformanceMetrics 
} from '@/hooks/useFeedback';

// Import the services (for direct access)
import { FeedbackService } from '@/services/feedbackService';
import { FeedbackAnalyticsService } from '@/services/feedbackAnalyticsService';
```

### 2. Basic Usage Example

```typescript
import { useLogFeedback } from '@/hooks/useFeedback';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '@/store/atoms';

const MyComponent = () => {
  const logFeedback = useLogFeedback();
  const user = useAtomValue(currentUserAtom);

  const handleAgentInteraction = (agentResponse: any) => {
    // Log user feedback about agent interaction
    logFeedback.mutate({
      event_type: 'agent_feedback',
      interaction_type: 'job_recommendation',
      feedback_category: 'recommendation_quality',
      feedback_subcategory: 'job_match_accuracy',
      agent_type: 'dispatch_strategist',
      feedback_value: 'positive',
      agent_confidence: agentResponse.confidence,
      event_data: {
        recommended_jobs: agentResponse.jobs,
        user_selection: agentResponse.selectedJob,
        response_time: agentResponse.responseTime
      }
    });
  };

  return (
    // Your component JSX
  );
};
```

---

## React Hook Integration

### Available Hooks

#### Mutation Hooks (for logging events)

```typescript
// 1. Log general user feedback
const logFeedback = useLogFeedback();

// 2. Log agent decision context
const logAgentDecision = useLogAgentDecision();

// 3. Log user modifications
const logUserModification = useLogUserModification();

// 4. Batch multiple events
const batchFeedback = useBatchFeedbackEvents();
```

#### Query Hooks (for analytics)

```typescript
// 1. Get feedback trends
const { data: trends } = useFeedbackTrends({ 
  period: 'daily', 
  agentTypes: ['dispatch_strategist'] 
});

// 2. Get user feedback profile
const { data: userProfile } = useUserFeedbackProfile(userId);

// 3. Get agent performance metrics
const { data: agentMetrics } = useAgentPerformanceMetrics('dispatch_strategist');

// 4. Get learning analytics
const { data: learningAnalytics } = useLearningExampleAnalytics();
```

### Hook Usage Patterns

#### 1. Real-time Feedback Collection

```typescript
import { useLogFeedback } from '@/hooks/useFeedback';

const JobRecommendationComponent = () => {
  const logFeedback = useLogFeedback();
  
  const handleJobSelection = (selectedJob: Job, recommendedJobs: Job[]) => {
    // Immediately log the user's selection
    logFeedback.mutate({
      event_type: 'agent_feedback',
      interaction_type: 'job_selection',
      feedback_category: 'recommendation_quality',
      feedback_subcategory: 'job_match_accuracy',
      agent_type: 'dispatch_strategist',
      feedback_value: 'positive', // User accepted recommendation
      event_data: {
        selected_job_id: selectedJob.id,
        recommended_jobs: recommendedJobs.map(j => j.id),
        selection_time_ms: Date.now() - recommendationStartTime
      }
    });
  };

  const handleJobModification = (originalJob: Job, modifiedJob: Job) => {
    // Log when user modifies agent recommendations
    logFeedback.mutate({
      event_type: 'agent_feedback',
      interaction_type: 'job_modification',
      feedback_category: 'recommendation_quality',
      feedback_subcategory: 'job_details_accuracy',
      agent_type: 'dispatch_strategist',
      feedback_value: 'neutral', // User partially accepted
      user_modification: {
        original_details: originalJob,
        modified_details: modifiedJob,
        modification_reason: 'Updated client requirements'
      }
    });
  };
};
```

#### 2. Analytics Dashboard Integration

```typescript
import { 
  useFeedbackTrends, 
  useAllAgentPerformanceMetrics,
  useFeedbackMonitoringDashboard 
} from '@/hooks/useFeedback';

const FeedbackDashboard = () => {
  // Get comprehensive dashboard data
  const { 
    trends, 
    agentMetrics, 
    learningAnalytics, 
    isLoading 
  } = useFeedbackMonitoringDashboard({
    autoRefresh: true,
    refetchInterval: 5 * 60 * 1000 // 5 minutes
  });

  // Get specific trends
  const { data: weeklyTrends } = useFeedbackTrends({
    period: 'daily',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });

  // Get agent-specific metrics
  const { data: dispatchMetrics } = useAgentPerformanceMetrics('dispatch_strategist');
  const { data: routeMetrics } = useAgentPerformanceMetrics('route_optimizer');
  const { data: inventoryMetrics } = useAgentPerformanceMetrics('inventory_specialist');

  return (
    <div className="feedback-dashboard">
      <TrendsChart data={weeklyTrends} />
      <AgentMetricsGrid metrics={[dispatchMetrics, routeMetrics, inventoryMetrics]} />
      <LearningInsightsPanel analytics={learningAnalytics} />
    </div>
  );
};
```

---

## Agent Integration Patterns

### 1. Dispatch Strategist Agent Integration

```typescript
// In your agent service or component
import { useLogAgentDecision, useLogFeedback } from '@/hooks/useFeedback';

const DispatchStrategistAgent = () => {
  const logAgentDecision = useLogAgentDecision();
  const logFeedback = useLogFeedback();

  const generateJobRecommendations = async (userPreferences: any) => {
    const startTime = Date.now();
    
    // Your AI logic here
    const recommendations = await generateRecommendations(userPreferences);
    
    // Log the agent decision
    const decisionId = await logAgentDecision.mutateAsync({
      agent_type: 'dispatch_strategist',
      agent_version: '1.0.0',
      decision_id: `dispatch_${Date.now()}`,
      input_data: {
        user_preferences: userPreferences,
        available_jobs: availableJobs,
        user_location: userLocation
      },
      decision_output: {
        recommended_jobs: recommendations,
        ranking_factors: ['urgency', 'proximity', 'skill_match'],
        confidence_scores: recommendations.map(r => r.confidence)
      },
      confidence_score: recommendations.reduce((avg, r) => avg + r.confidence, 0) / recommendations.length,
      processing_time_ms: Date.now() - startTime,
      reasoning_explanation: 'Jobs ranked by urgency, proximity, and skill match',
      user_preferences_snapshot: userPreferences
    });

    return { recommendations, decisionId };
  };

  const handleUserSelection = (selectedJob: Job, decisionId: string) => {
    // Log user feedback on the agent's recommendation
    logFeedback.mutate({
      event_type: 'agent_feedback',
      interaction_type: 'job_selection_feedback',
      feedback_category: 'recommendation_quality',
      feedback_subcategory: 'job_match_accuracy',
      agent_type: 'dispatch_strategist',
      feedback_value: 'positive',
      event_data: {
        selected_job_id: selectedJob.id,
        agent_decision_id: decisionId,
        selection_time_ms: Date.now() - recommendationTime
      }
    });
  };
};
```

### 2. Route Optimizer Agent Integration

```typescript
const RouteOptimizerAgent = () => {
  const logAgentDecision = useLogAgentDecision();
  const logFeedback = useLogFeedback();

  const optimizeRoute = async (jobs: Job[], userLocation: Location) => {
    const startTime = Date.now();
    
    // Your route optimization logic
    const optimizedRoute = await calculateOptimalRoute(jobs, userLocation);
    
    // Log the route optimization decision
    const decisionId = await logAgentDecision.mutateAsync({
      agent_type: 'route_optimizer',
      agent_version: '1.0.0',
      decision_id: `route_${Date.now()}`,
      input_data: {
        jobs: jobs,
        start_location: userLocation,
        optimization_criteria: ['distance', 'time', 'traffic']
      },
      decision_output: {
        optimized_route: optimizedRoute,
        estimated_time: optimizedRoute.totalTime,
        estimated_distance: optimizedRoute.totalDistance,
        waypoints: optimizedRoute.waypoints
      },
      confidence_score: optimizedRoute.confidence,
      processing_time_ms: Date.now() - startTime,
      reasoning_explanation: 'Route optimized for minimum travel time considering traffic',
      alternative_options: optimizedRoute.alternatives
    });

    return { optimizedRoute, decisionId };
  };

  const handleRouteCompletion = (actualRoute: RouteData, decisionId: string) => {
    // Log feedback based on actual vs predicted route performance
    const accuracyScore = calculateRouteAccuracy(actualRoute, predictedRoute);
    
    logFeedback.mutate({
      event_type: 'agent_feedback',
      interaction_type: 'route_completion_feedback',
      feedback_category: 'route_efficiency',
      feedback_subcategory: 'travel_time_accuracy',
      agent_type: 'route_optimizer',
      feedback_value: accuracyScore > 0.8 ? 'positive' : accuracyScore > 0.6 ? 'neutral' : 'negative',
      event_data: {
        predicted_time: predictedRoute.totalTime,
        actual_time: actualRoute.totalTime,
        accuracy_score: accuracyScore,
        agent_decision_id: decisionId
      }
    });
  };
};
```

### 3. Inventory Specialist Agent Integration

```typescript
const InventorySpecialistAgent = () => {
  const logAgentDecision = useLogAgentDecision();
  const logFeedback = useLogFeedback();

  const recommendInventory = async (jobs: Job[], currentInventory: InventoryItem[]) => {
    const startTime = Date.now();
    
    // Your inventory recommendation logic
    const recommendations = await generateInventoryRecommendations(jobs, currentInventory);
    
    // Log the inventory recommendation decision
    const decisionId = await logAgentDecision.mutateAsync({
      agent_type: 'inventory_specialist',
      agent_version: '1.0.0',
      decision_id: `inventory_${Date.now()}`,
      input_data: {
        scheduled_jobs: jobs,
        current_inventory: currentInventory,
        historical_usage: historicalUsageData
      },
      decision_output: {
        recommended_items: recommendations,
        stock_adjustments: recommendations.map(r => ({
          item_id: r.item_id,
          recommended_quantity: r.quantity,
          confidence: r.confidence
        }))
      },
      confidence_score: recommendations.reduce((avg, r) => avg + r.confidence, 0) / recommendations.length,
      processing_time_ms: Date.now() - startTime,
      reasoning_explanation: 'Recommendations based on job requirements and usage patterns'
    });

    return { recommendations, decisionId };
  };

  const handleInventoryAdjustment = (adjustments: InventoryAdjustment[], decisionId: string) => {
    // Log user modifications to inventory recommendations
    logFeedback.mutate({
      event_type: 'agent_feedback',
      interaction_type: 'inventory_adjustment_feedback',
      feedback_category: 'item_recommendation',
      feedback_subcategory: 'quantity_accuracy',
      agent_type: 'inventory_specialist',
      feedback_value: 'neutral', // User made some adjustments
      user_modification: {
        original_recommendations: originalRecommendations,
        user_adjustments: adjustments,
        modification_reason: 'Based on specific client requirements'
      },
      event_data: {
        agent_decision_id: decisionId,
        adjustment_count: adjustments.length
      }
    });
  };
};
```

---

## Service Layer Integration

### Direct Service Usage

For cases where you need direct access to the feedback services:

```typescript
import { FeedbackService } from '@/services/feedbackService';
import { FeedbackAnalyticsService } from '@/services/feedbackAnalyticsService';

// Log feedback directly
const feedbackEventId = await FeedbackService.logUserFeedback({
  user_id: userId,
  session_id: sessionId,
  event_type: 'agent_feedback',
  interaction_type: 'custom_interaction',
  feedback_category: 'custom_category',
  feedback_subcategory: 'custom_subcategory',
  agent_type: 'dispatch_strategist',
  feedback_value: 'positive',
  event_data: customEventData
});

// Get analytics directly
const analytics = await FeedbackAnalyticsService.getFeedbackTrends({
  period: 'daily',
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  endDate: new Date()
});
```

### Batch Processing

For high-volume feedback collection:

```typescript
import { FeedbackService } from '@/services/feedbackService';

const batchEvents = [
  {
    user_id: 'user1',
    session_id: 'session1',
    event_type: 'agent_feedback',
    // ... other event data
  },
  {
    user_id: 'user2',
    session_id: 'session2',
    event_type: 'ui_feedback',
    // ... other event data
  }
];

// Process multiple events efficiently
const results = await FeedbackService.logBatchFeedback(batchEvents);
```

---

## Analytics Integration

### 1. Real-time Analytics Dashboard

```typescript
import { 
  useFeedbackTrends, 
  useAllAgentPerformanceMetrics,
  useFeedbackCorrelationAnalysis 
} from '@/hooks/useFeedback';

const AdminAnalyticsDashboard = () => {
  // Real-time trends
  const { data: trends, isLoading: trendsLoading } = useFeedbackTrends({
    period: 'hourly',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date()
  });

  // Agent performance comparison
  const { data: allAgentMetrics } = useAllAgentPerformanceMetrics({
    timePeriod: 'last_30_days'
  });

  // Correlation analysis
  const { data: correlations } = useFeedbackCorrelationAnalysis({
    analysisType: 'agent_performance_correlation',
    minCorrelationThreshold: 0.5
  });

  return (
    <div className="analytics-dashboard">
      <div className="metrics-grid">
        <TrendsChart data={trends} loading={trendsLoading} />
        <AgentComparisonChart data={allAgentMetrics} />
        <CorrelationMatrix data={correlations} />
      </div>
    </div>
  );
};
```

### 2. User Behavior Analytics

```typescript
const UserBehaviorAnalytics = ({ userId }: { userId: string }) => {
  const { data: userProfile } = useUserFeedbackProfile(userId);
  const { data: userTrends } = useFeedbackTrends({
    period: 'daily',
    userId: userId,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  });

  const insights = useMemo(() => {
    if (!userProfile) return [];
    
    return [
      {
        type: 'engagement',
        value: userProfile.engagement_metrics.feedback_frequency,
        trend: userProfile.engagement_metrics.feedback_frequency > 0.5 ? 'high' : 'low'
      },
      {
        type: 'satisfaction',
        value: userProfile.feedback_patterns.positive_rate,
        trend: userProfile.feedback_patterns.positive_rate > 0.7 ? 'positive' : 'negative'
      },
      {
        type: 'expertise',
        value: userProfile.user_expertise_level,
        trend: userProfile.learning_contribution.training_impact_score > 0.8 ? 'expert' : 'learning'
      }
    ];
  }, [userProfile]);

  return (
    <div className="user-analytics">
      <UserProfileCard profile={userProfile} />
      <UserTrendsChart data={userTrends} />
      <UserInsightsPanel insights={insights} />
    </div>
  );
};
```

---

## Real-time Feedback Collection

### 1. User Interaction Tracking

```typescript
const JobWorkflowComponent = () => {
  const logFeedback = useLogFeedback();
  const [sessionId] = useState(() => `session_${Date.now()}`);

  // Track user interactions throughout the workflow
  const trackWorkflowStep = (step: string, data: any) => {
    logFeedback.mutate({
      event_type: 'workflow_feedback',
      interaction_type: 'workflow_step_completion',
      feedback_category: 'workflow_efficiency',
      feedback_subcategory: step,
      event_data: {
        session_id: sessionId,
        step_name: step,
        step_data: data,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleJobPlanningComplete = (planData: any) => {
    trackWorkflowStep('job_planning_complete', planData);
  };

  const handleRouteOptimizationComplete = (routeData: any) => {
    trackWorkflowStep('route_optimization_complete', routeData);
  };

  const handleInventoryPrepComplete = (inventoryData: any) => {
    trackWorkflowStep('inventory_prep_complete', inventoryData);
  };

  return (
    <WorkflowSteps
      onJobPlanningComplete={handleJobPlanningComplete}
      onRouteOptimizationComplete={handleRouteOptimizationComplete}
      onInventoryPrepComplete={handleInventoryPrepComplete}
    />
  );
};
```

### 2. Error and Exception Tracking

```typescript
const ErrorTrackingWrapper = ({ children }: { children: React.ReactNode }) => {
  const logFeedback = useLogFeedback();

  const handleError = (error: Error, errorInfo: any) => {
    logFeedback.mutate({
      event_type: 'system_feedback',
      interaction_type: 'error_occurrence',
      feedback_category: 'system_reliability',
      feedback_subcategory: 'error_tracking',
      feedback_value: 'negative',
      event_data: {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      }
    });
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};
```

---

## Error Handling & Best Practices

### 1. Error Handling Patterns

```typescript
const SafeFeedbackLogging = () => {
  const logFeedback = useLogFeedback();

  const handleUserAction = async (actionData: any) => {
    try {
      // Perform the user action
      await performUserAction(actionData);
      
      // Log successful feedback
      logFeedback.mutate({
        event_type: 'ui_feedback',
        interaction_type: 'user_action_success',
        feedback_category: 'user_experience',
        feedback_subcategory: 'action_completion',
        feedback_value: 'positive',
        event_data: actionData
      });
    } catch (error) {
      // Log error feedback
      logFeedback.mutate({
        event_type: 'system_feedback',
        interaction_type: 'user_action_error',
        feedback_category: 'system_reliability',
        feedback_subcategory: 'error_handling',
        feedback_value: 'negative',
        event_data: {
          action_attempted: actionData,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      });
      
      // Handle the error appropriately
      throw error;
    }
  };
};
```

### 2. Data Validation

```typescript
const validateFeedbackData = (feedbackData: any) => {
  const required = ['event_type', 'interaction_type', 'feedback_category', 'feedback_subcategory'];
  
  for (const field of required) {
    if (!feedbackData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  if (feedbackData.agent_confidence && (feedbackData.agent_confidence < 0 || feedbackData.agent_confidence > 1)) {
    throw new Error('Agent confidence must be between 0 and 1');
  }
  
  if (feedbackData.feedback_value && !['positive', 'negative', 'neutral'].includes(feedbackData.feedback_value)) {
    throw new Error('Feedback value must be positive, negative, or neutral');
  }
};
```

### 3. Performance Best Practices

```typescript
// Use debounced feedback for high-frequency events
const debouncedFeedback = useMemo(
  () => debounce((feedbackData: any) => {
    logFeedback.mutate(feedbackData);
  }, 1000),
  [logFeedback]
);

// Batch similar events
const batchSimilarEvents = (events: FeedbackEvent[]) => {
  const batches = groupBy(events, (event) => `${event.event_type}_${event.interaction_type}`);
  
  Object.values(batches).forEach(batch => {
    if (batch.length > 1) {
      // Use batch processing for multiple similar events
      batchFeedback.mutate(batch);
    } else {
      // Use individual logging for single events
      logFeedback.mutate(batch[0]);
    }
  });
};
```

---

## Performance Optimization

### 1. Caching Strategy

```typescript
// Use optimized cache settings for different types of queries
const { data: trends } = useFeedbackTrends({
  period: 'daily',
  startDate: startDate,
  endDate: endDate
}, {
  staleTime: 5 * 60 * 1000, // 5 minutes for trends
  cacheTime: 30 * 60 * 1000, // 30 minutes cache
  refetchOnWindowFocus: false
});

const { data: userProfile } = useUserFeedbackProfile(userId, {
  staleTime: 10 * 60 * 1000, // 10 minutes for user profiles
  cacheTime: 60 * 60 * 1000, // 1 hour cache
  enabled: !!userId
});
```

### 2. Batch Processing

```typescript
// Collect feedback events and process in batches
const useBatchedFeedback = (batchSize = 10, flushInterval = 5000) => {
  const [eventQueue, setEventQueue] = useState<FeedbackEvent[]>([]);
  const batchFeedback = useBatchFeedbackEvents();

  const addEvent = useCallback((event: FeedbackEvent) => {
    setEventQueue(prev => {
      const newQueue = [...prev, event];
      
      // Flush if batch size reached
      if (newQueue.length >= batchSize) {
        batchFeedback.mutate(newQueue);
        return [];
      }
      
      return newQueue;
    });
  }, [batchSize, batchFeedback]);

  // Flush remaining events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setEventQueue(prev => {
        if (prev.length > 0) {
          batchFeedback.mutate(prev);
          return [];
        }
        return prev;
      });
    }, flushInterval);

    return () => clearInterval(interval);
  }, [flushInterval, batchFeedback]);

  return { addEvent };
};
```

### 3. Selective Analytics Loading

```typescript
// Load analytics data progressively
const useProgressiveAnalytics = (userId: string) => {
  // Load essential metrics first
  const { data: basicMetrics } = useUserFeedbackProfile(userId, {
    select: (data) => ({
      engagement_metrics: data.engagement_metrics,
      feedback_patterns: data.feedback_patterns
    })
  });

  // Load detailed analytics on demand
  const { data: detailedAnalytics } = useFeedbackCorrelationAnalysis({
    userId: userId,
    analysisType: 'user_behavior_correlation'
  }, {
    enabled: !!basicMetrics, // Only load after basic metrics
    staleTime: 30 * 60 * 1000 // 30 minutes stale time
  });

  return {
    basicMetrics,
    detailedAnalytics,
    hasBasicData: !!basicMetrics,
    hasDetailedData: !!detailedAnalytics
  };
};
```

---

## Summary

The TradeFlow feedback system provides comprehensive capabilities for:

🎯 **Real-time Feedback Collection**: Capture user interactions as they happen
🤖 **AI Agent Integration**: Track agent decisions and user responses
📊 **Advanced Analytics**: Generate insights for continuous improvement
🔒 **Privacy Protection**: GDPR-compliant data handling and user consent
⚡ **Performance Optimization**: Efficient batch processing and caching
🛡️ **Error Handling**: Robust error tracking and system monitoring

### Key Integration Points:

1. **Use React hooks** for frontend components
2. **Integrate with agent services** for AI decision tracking
3. **Implement analytics dashboards** for monitoring and insights
4. **Follow best practices** for performance and error handling
5. **Maintain privacy compliance** with built-in data protection

The system is production-ready and will continuously improve AI agent performance through comprehensive feedback collection and analysis.

---

## Next Steps

1. **Integrate feedback collection** into existing agent workflows
2. **Implement analytics dashboards** for monitoring
3. **Set up alerting** for performance issues
4. **Create feedback reports** for stakeholders
5. **Monitor and optimize** based on usage patterns

For additional support or questions, refer to the validation guide and test results in the project documentation. 