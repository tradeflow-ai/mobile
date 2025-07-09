# Onboarding Analytics Test Guide

## Overview

This guide provides comprehensive testing instructions for the onboarding analytics system implemented in Step 5. The system includes funnel analytics, completion tracking, drop-off identification, and performance monitoring capabilities.

## System Components

### 1. Analytics Service Layer
- **File**: `services/onboardingAnalyticsService.ts`
- **Purpose**: Core analytics business logic and data processing
- **Key Functions**: Funnel analysis, completion trends, drop-off analysis, performance metrics

### 2. SQL Functions
- **File**: `sql-migrations/005-onboarding-analytics-functions.sql`
- **Purpose**: Database-level analytics queries for performance
- **Key Functions**: Completion trends, funnel data, user journey analysis, drop-off analysis

### 3. React Hooks
- **File**: `hooks/useOnboardingAnalytics.ts`
- **Purpose**: React integration with TanStack Query for analytics data
- **Key Hooks**: Funnel analytics, completion trends, drop-off analysis, monitoring dashboard

### 4. Query Client Integration
- **File**: `services/queryClient.ts`
- **Purpose**: Centralized query key management and cache invalidation
- **Key Features**: Analytics query keys, invalidation functions

## Prerequisites

Before testing the analytics system, ensure you have:

1. **Database Setup**: Run migration `005-onboarding-analytics-functions.sql` in Supabase
2. **Sample Data**: Generate sample onboarding analytics events (see sample data section)
3. **Environment**: React Native app with proper service imports

## Testing Instructions

### 1. Database Functions Testing

#### A. Test Completion Trends Function

```sql
-- Test daily completion trends (last 30 days)
SELECT * FROM get_onboarding_completion_trends(
  (NOW() - INTERVAL '30 days')::TEXT,
  NOW()::TEXT,
  'YYYY-MM-DD',
  '1 day'
);

-- Test weekly completion trends
SELECT * FROM get_onboarding_completion_trends(
  (NOW() - INTERVAL '12 weeks')::TEXT,
  NOW()::TEXT,
  'YYYY-"W"WW',
  '1 week'
);

-- Test monthly completion trends
SELECT * FROM get_onboarding_completion_trends(
  (NOW() - INTERVAL '6 months')::TEXT,
  NOW()::TEXT,
  'YYYY-MM',
  '1 month'
);
```

**Expected Results**:
- Array of data points with date, started_count, completed_count, completion_rate, average_completion_time_minutes
- Dates should be properly formatted according to the specified format
- Completion rate should be calculated as (completed/started) * 100

#### B. Test Funnel Analysis Function

```sql
-- Test funnel analysis for last 30 days
SELECT * FROM get_onboarding_funnel_data(
  (NOW() - INTERVAL '30 days')::TEXT,
  NOW()::TEXT
);

-- Test funnel analysis without date filter (uses default 30 days)
SELECT * FROM get_onboarding_funnel_data();
```

**Expected Results**:
- Three rows (work-schedule, time-buffers, suppliers)
- Each row should have: step_name, step_order, started_count, completed_count, skipped_count, abandoned_count, conversion_rate, average_time_seconds, drop_off_rate
- Step orders should be 1, 2, 3 respectively

#### C. Test User Journey Analysis Function

```sql
-- Test user journey for all users
SELECT * FROM get_user_journey_summary(
  NULL,
  (NOW() - INTERVAL '30 days')::TEXT,
  NOW()::TEXT
);

-- Test user journey for specific user
SELECT * FROM get_user_journey_summary(
  'USER_ID_HERE'::UUID,
  (NOW() - INTERVAL '30 days')::TEXT,
  NOW()::TEXT
);
```

**Expected Results**:
- User journey data with start/end times, completion status, steps completed/skipped
- Platform and onboarding version information
- Total time spent calculation

#### D. Test Drop-Off Analysis Function

```sql
-- Test drop-off analysis
SELECT * FROM get_drop_off_analysis(
  (NOW() - INTERVAL '30 days')::TEXT,
  NOW()::TEXT
);
```

**Expected Results**:
- Drop-off data by step with rates and common validation errors
- Session duration before drop-off
- JSONB validation errors data

#### E. Test Platform Performance Function

```sql
-- Test platform performance
SELECT * FROM get_platform_performance(
  (NOW() - INTERVAL '30 days')::TEXT,
  NOW()::TEXT
);
```

**Expected Results**:
- Platform breakdown with user counts and completion rates
- Average completion time by platform

### 2. Service Layer Testing

#### A. Test Analytics Service Functions

```typescript
// Test in React Native debugger or test file
import { OnboardingAnalyticsService } from '@/services/onboardingAnalyticsService';

// Test funnel analytics
const testFunnelAnalytics = async () => {
  const result = await OnboardingAnalyticsService.getFunnelAnalytics();
  console.log('Funnel Analytics:', result);
  // Expected: { data: OnboardingFunnelAnalytics, error: null }
};

// Test completion trends
const testCompletionTrends = async () => {
  const result = await OnboardingAnalyticsService.getCompletionRateTrends('daily');
  console.log('Completion Trends:', result);
  // Expected: { data: CompletionRateMetrics, error: null }
};

// Test drop-off analysis
const testDropOffAnalysis = async () => {
  const result = await OnboardingAnalyticsService.getDropOffAnalysis();
  console.log('Drop-off Analysis:', result);
  // Expected: { data: DropOffAnalysis[], error: null }
};

// Test performance metrics
const testPerformanceMetrics = async () => {
  const result = await OnboardingAnalyticsService.getPerformanceMetrics();
  console.log('Performance Metrics:', result);
  // Expected: { data: OnboardingPerformanceMetrics, error: null }
};

// Test user journey
const testUserJourney = async (userId: string) => {
  const result = await OnboardingAnalyticsService.getUserJourney(userId);
  console.log('User Journey:', result);
  // Expected: { data: UserJourneyAnalytics, error: null }
};

// Test data export
const testDataExport = async () => {
  const jsonResult = await OnboardingAnalyticsService.exportOnboardingData('json');
  console.log('JSON Export:', jsonResult);
  
  const csvResult = await OnboardingAnalyticsService.exportOnboardingData('csv');
  console.log('CSV Export:', csvResult);
  // Expected: { data: OnboardingExportData | string, error: null }
};
```

#### B. Test Error Handling

```typescript
// Test with invalid date ranges
const testErrorHandling = async () => {
  try {
    const result = await OnboardingAnalyticsService.getFunnelAnalytics(
      '2024-12-31', 
      '2024-01-01' // End date before start date
    );
    console.log('Should not reach here');
  } catch (error) {
    console.log('Expected error:', error);
  }
};
```

### 3. React Hooks Testing

#### A. Test Analytics Hooks in Component

```typescript
// Test component for analytics hooks
import React from 'react';
import { View, Text, Button } from 'react-native';
import { 
  useOnboardingAnalytics,
  useOnboardingFunnelAnalytics,
  useOnboardingCompletionTrends,
  useOnboardingDropOffAnalysis,
  useOnboardingPerformanceMetrics,
  useOnboardingMonitoringDashboard,
  useOnboardingAnalyticsInsights,
  useExportOnboardingData
} from '@/hooks/useOnboardingAnalytics';

export const AnalyticsTestComponent: React.FC = () => {
  // Test master analytics hook
  const analytics = useOnboardingAnalytics({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    autoRefresh: true,
    refetchInterval: 30000,
  });

  // Test individual hooks
  const funnelData = useOnboardingFunnelAnalytics();
  const completionTrends = useOnboardingCompletionTrends('daily');
  const dropOffData = useOnboardingDropOffAnalysis();
  const performanceMetrics = useOnboardingPerformanceMetrics();
  const monitoringDashboard = useOnboardingMonitoringDashboard();
  const analyticsInsights = useOnboardingAnalyticsInsights();
  const exportMutation = useExportOnboardingData();

  const handleExport = () => {
    exportMutation.mutate({
      format: 'json',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    });
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Analytics Test Component</Text>
      
      {/* Master Analytics */}
      <Text>Loading: {analytics.isLoading ? 'Yes' : 'No'}</Text>
      <Text>Error: {analytics.error?.message || 'None'}</Text>
      
      {/* Funnel Data */}
      <Text>Funnel Loading: {funnelData.isLoading ? 'Yes' : 'No'}</Text>
      <Text>Total Started: {funnelData.data?.total_users_started || 0}</Text>
      <Text>Total Completed: {funnelData.data?.total_users_completed || 0}</Text>
      <Text>Completion Rate: {funnelData.data?.overall_completion_rate || 0}%</Text>
      
      {/* Performance Metrics */}
      <Text>Performance Loading: {performanceMetrics.isLoading ? 'Yes' : 'No'}</Text>
      <Text>Active Users: {performanceMetrics.data?.overview.active_users_in_progress || 0}</Text>
      <Text>Avg Time: {performanceMetrics.data?.overview.average_completion_time_minutes || 0} min</Text>
      
      {/* Insights */}
      <Text>Health Score: {analyticsInsights.healthScore}/100</Text>
      <Text>Biggest Bottleneck: {analyticsInsights.biggestBottleneck?.step_name || 'None'}</Text>
      <Text>Recommendations: {analyticsInsights.recommendations.length}</Text>
      
      {/* Monitoring Dashboard */}
      <Text>Dashboard Loading: {monitoringDashboard.isLoading ? 'Yes' : 'No'}</Text>
      
      {/* Actions */}
      <Button 
        title="Export Data" 
        onPress={handleExport}
        disabled={exportMutation.isPending}
      />
      
      <Button 
        title="Refresh All" 
        onPress={() => analytics.refetchAll()}
      />
      
      <Button 
        title="Invalidate Cache" 
        onPress={() => analytics.invalidation.invalidateAll()}
      />
    </View>
  );
};
```

#### B. Test Hook Performance

```typescript
// Test hook performance and caching
const testHookPerformance = () => {
  const { performance } = useOnboardingAnalytics();
  
  // Check if data is cached (should be fast on second call)
  const startTime = performance.now();
  const data = performance.data;
  const endTime = performance.now();
  
  console.log('Hook execution time:', endTime - startTime, 'ms');
  console.log('Is from cache:', !performance.isLoading && !performance.isFetching);
};
```

### 4. Query Client Integration Testing

#### A. Test Query Key Management

```typescript
// Test query key consistency
import { queryKeys } from '@/services/queryClient';

const testQueryKeys = () => {
  // Test analytics query keys
  const funnelKey = queryKeys.onboardingFunnel();
  const trendsKey = queryKeys.onboardingCompletionTrends('daily');
  const dropOffKey = queryKeys.onboardingDropOff();
  const performanceKey = queryKeys.onboardingPerformance();
  
  console.log('Query keys:', {
    funnelKey,
    trendsKey,
    dropOffKey,
    performanceKey,
  });
};
```

#### B. Test Cache Invalidation

```typescript
// Test cache invalidation
import { invalidateQueries } from '@/services/queryClient';

const testCacheInvalidation = () => {
  // Test individual invalidations
  invalidateQueries.onboardingFunnel();
  invalidateQueries.onboardingCompletionTrends('daily');
  invalidateQueries.onboardingDropOff();
  invalidateQueries.onboardingPerformance();
  
  // Test bulk invalidation
  invalidateQueries.allOnboardingAnalytics();
  
  console.log('Cache invalidations triggered');
};
```

### 5. End-to-End Testing

#### A. Complete Analytics Flow Test

```typescript
// End-to-end test scenario
const testAnalyticsFlow = async () => {
  console.log('Starting analytics flow test...');
  
  // 1. Generate sample analytics events
  await generateSampleAnalyticsData();
  
  // 2. Test funnel analysis
  const funnelResult = await OnboardingAnalyticsService.getFunnelAnalytics();
  console.log('Funnel analysis:', funnelResult);
  
  // 3. Test completion trends
  const trendsResult = await OnboardingAnalyticsService.getCompletionRateTrends('daily');
  console.log('Completion trends:', trendsResult);
  
  // 4. Test drop-off analysis
  const dropOffResult = await OnboardingAnalyticsService.getDropOffAnalysis();
  console.log('Drop-off analysis:', dropOffResult);
  
  // 5. Test performance metrics
  const performanceResult = await OnboardingAnalyticsService.getPerformanceMetrics();
  console.log('Performance metrics:', performanceResult);
  
  // 6. Test data export
  const exportResult = await OnboardingAnalyticsService.exportOnboardingData('json');
  console.log('Export data:', exportResult);
  
  console.log('Analytics flow test completed');
};
```

### 6. Sample Data Generation

#### A. Generate Sample Analytics Events

```typescript
// Generate sample analytics events for testing
import { OnboardingService } from '@/services/onboardingService';

const generateSampleAnalyticsData = async () => {
  const sampleUsers = [
    'user1', 'user2', 'user3', 'user4', 'user5'
  ];
  
  for (const userId of sampleUsers) {
    // Simulate onboarding started
    await OnboardingService.trackOnboardingProgress({
      user_id: userId,
      event_type: 'onboarding_started',
      event_timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      platform: ['ios', 'android'][Math.floor(Math.random() * 2)],
      onboarding_version: '1.0',
    });
    
    // Simulate step events
    const steps = ['work-schedule', 'time-buffers', 'suppliers'];
    for (const step of steps) {
      // Step started
      await OnboardingService.trackOnboardingProgress({
        user_id: userId,
        event_type: 'step_started',
        step_name: step,
        event_timestamp: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000).toISOString(),
        platform: ['ios', 'android'][Math.floor(Math.random() * 2)],
        onboarding_version: '1.0',
      });
      
      // Step completed or skipped (80% completion rate)
      const completed = Math.random() > 0.2;
      await OnboardingService.trackOnboardingProgress({
        user_id: userId,
        event_type: completed ? 'step_completed' : 'step_skipped',
        step_name: step,
        event_timestamp: new Date(Date.now() - Math.random() * 24 * 24 * 60 * 60 * 1000).toISOString(),
        time_spent_seconds: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
        platform: ['ios', 'android'][Math.floor(Math.random() * 2)],
        onboarding_version: '1.0',
      });
    }
    
    // Simulate onboarding completion (70% completion rate)
    if (Math.random() > 0.3) {
      await OnboardingService.trackOnboardingProgress({
        user_id: userId,
        event_type: 'onboarding_completed',
        event_timestamp: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
        platform: ['ios', 'android'][Math.floor(Math.random() * 2)],
        onboarding_version: '1.0',
      });
    }
  }
  
  console.log('Sample analytics data generated');
};
```

## Expected Test Results

### 1. Funnel Analytics
- **Total Users Started**: > 0
- **Total Users Completed**: < Total Started
- **Overall Completion Rate**: 50-90%
- **Steps Data**: 3 steps with decreasing completion rates
- **Average Completion Time**: 5-20 minutes

### 2. Completion Trends
- **Data Points**: Array of daily/weekly/monthly data
- **Completion Rate**: Percentage values
- **Started/Completed Counts**: Realistic numbers
- **Date Formatting**: Proper format based on period

### 3. Drop-Off Analysis
- **Step Analysis**: Data for each step
- **Drop-off Rates**: Percentage values
- **Common Errors**: Validation error breakdown
- **Session Duration**: Time before drop-off

### 4. Performance Metrics
- **Overview**: Complete summary statistics
- **Step Performance**: Detailed step breakdown
- **Platform Breakdown**: Platform-specific metrics
- **Version Performance**: Version comparison

### 5. User Journey
- **Journey Events**: Complete event timeline
- **Completion Status**: Accurate status classification
- **Time Calculations**: Proper time spent calculation
- **Platform Info**: Platform and version data

## Troubleshooting

### Common Issues

1. **No Data Returned**: Check if sample data was generated properly
2. **SQL Function Errors**: Verify migration was applied correctly
3. **Hook Loading Forever**: Check network connection and Supabase setup
4. **Type Errors**: Ensure all imports are correct and types match
5. **Cache Issues**: Try invalidating queries manually

### Debug Steps

1. **Check Database**: Verify tables and functions exist
2. **Test SQL Directly**: Run SQL functions in Supabase SQL editor
3. **Check Network**: Verify API calls are working
4. **Inspect Data**: Log raw data to understand structure
5. **Test Incrementally**: Test one component at a time

## Performance Considerations

1. **Query Optimization**: Use appropriate date ranges
2. **Caching Strategy**: Leverage TanStack Query caching
3. **Data Volume**: Consider pagination for large datasets
4. **Real-time Updates**: Use appropriate refresh intervals
5. **Memory Usage**: Monitor memory consumption with large exports

## Conclusion

This comprehensive test guide covers all aspects of the onboarding analytics system. Follow the testing procedures in order, starting with database functions and moving up to the React hooks layer. The system should provide accurate, performant analytics for monitoring onboarding success and identifying areas for improvement. 