# Onboarding Configuration API Documentation

## 📋 Overview

The TradeFlow onboarding system provides a comprehensive configuration and analytics platform for managing user onboarding flows. This documentation covers the complete API for developers working with the onboarding system.

## 🏗️ System Architecture

### Core Components

1. **OnboardingService** - Main service layer for data operations
2. **Onboarding Hooks** - React Query-based hooks for UI integration
3. **Analytics Service** - Comprehensive analytics and reporting
4. **Database Schema** - Persistent storage with RLS security

### Data Flow

```
User Interface → Onboarding Hooks → OnboardingService → Supabase Database
                                                    ↓
                                           Analytics Service → Reports
```

## 🔧 OnboardingService API

### Core Methods

#### `getOnboardingStatus(userId: string)`
Get comprehensive onboarding status for a user.

**Parameters:**
- `userId` (string): User ID to check status for

**Returns:**
```typescript
{
  data: {
    preferences: OnboardingPreferences | null;
    configuration: OnboardingConfiguration | null;
    completionScore: number; // 0-100
    isCompleted: boolean;
    nextStep: string | null;
  } | null;
  error: any;
}
```

**Example Usage:**
```typescript
import { OnboardingService } from '@/services/onboardingService';

const { data, error } = await OnboardingService.getOnboardingStatus(userId);
if (data) {
  console.log('Completion Score:', data.completionScore);
  console.log('Is Completed:', data.isCompleted);
  console.log('Next Step:', data.nextStep);
}
```

#### `initializeOnboarding(userId: string)`
Initialize onboarding preferences for a new user.

**Parameters:**
- `userId` (string): User ID to initialize

**Returns:**
```typescript
{
  data: OnboardingPreferences | null;
  error: any;
}
```

**Example Usage:**
```typescript
const { data, error } = await OnboardingService.initializeOnboarding(userId);
if (data) {
  console.log('Onboarding initialized for user:', data.user_id);
}
```

#### `updateOnboardingPreferences(userId, stepName, stepData, completed)`
Update onboarding preferences for a specific step.

**Parameters:**
- `userId` (string): User ID
- `stepName` ('work-schedule' | 'time-buffers' | 'suppliers'): Step to update
- `stepData` (WorkScheduleData | TimeBuffersData | SuppliersData): Step data
- `completed` (boolean): Whether step is completed

**Returns:**
```typescript
{
  data: OnboardingPreferences | null;
  error: any;
}
```

**Example Usage:**
```typescript
const workScheduleData = {
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '08:00',
  endTime: '17:00',
  hasBreak: true,
  breakStartTime: '12:00',
  breakEndTime: '13:00'
};

const { data, error } = await OnboardingService.updateOnboardingPreferences(
  userId,
  'work-schedule',
  workScheduleData,
  true
);
```

#### `trackOnboardingProgress(event: OnboardingAnalyticsEvent)`
Track onboarding analytics events.

**Parameters:**
- `event` (OnboardingAnalyticsEvent): Analytics event data

**Returns:**
```typescript
{
  error: any;
}
```

**Example Usage:**
```typescript
await OnboardingService.trackOnboardingProgress({
  user_id: userId,
  event_type: 'step_completed',
  step_name: 'work-schedule',
  form_data: workScheduleData,
  onboarding_version: '1.0'
});
```

## 🎣 Onboarding Hooks API

### Primary Hooks

#### `useOnboardingStatus(userId?: string)`
Get onboarding status with real-time updates.

**Parameters:**
- `userId` (string, optional): User ID (defaults to current user)

**Returns:**
```typescript
{
  data: OnboardingStatus | null;
  isLoading: boolean;
  error: any;
  refetch: () => void;
}
```

**Example Usage:**
```typescript
import { useOnboardingStatus } from '@/hooks/useOnboarding';

function OnboardingComponent() {
  const { data: status, isLoading, error } = useOnboardingStatus();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <h2>Onboarding Progress: {status?.completionScore}%</h2>
      <p>Current Step: {status?.nextStep || 'Completed'}</p>
    </div>
  );
}
```

#### `useOnboardingPreferences(userId?: string)`
Get user's onboarding preferences.

**Returns:**
```typescript
{
  data: OnboardingPreferences | null;
  isLoading: boolean;
  error: any;
}
```

#### `useOnboardingConfiguration()`
Get active onboarding configuration.

**Returns:**
```typescript
{
  data: OnboardingConfiguration | null;
  isLoading: boolean;
  error: any;
}
```

#### `useUpdateOnboardingStep()`
Mutation hook for updating onboarding steps.

**Returns:**
```typescript
{
  mutate: (params: UpdateStepParams) => void;
  isPending: boolean;
  error: any;
  data: OnboardingPreferences | null;
}
```

**Example Usage:**
```typescript
import { useUpdateOnboardingStep } from '@/hooks/useOnboarding';

function WorkScheduleForm() {
  const updateStep = useUpdateOnboardingStep();
  
  const handleSubmit = (formData) => {
    updateStep.mutate({
      stepName: 'work-schedule',
      stepData: formData,
      completed: true
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={updateStep.isPending}>
        {updateStep.isPending ? 'Saving...' : 'Save & Continue'}
      </button>
    </form>
  );
}
```

#### `useOnboarding()`
Master hook providing all onboarding functionality.

**Returns:**
```typescript
{
  // Status and data
  status: OnboardingStatus | null;
  preferences: OnboardingPreferences | null;
  configuration: OnboardingConfiguration | null;
  isLoading: boolean;
  error: any;
  
  // Actions
  updateStep: (params: UpdateStepParams) => void;
  skipStep: (params: SkipStepParams) => void;
  initialize: (userId?: string) => void;
  
  // States
  isUpdating: boolean;
  isSkipping: boolean;
  isInitializing: boolean;
}
```

## 📊 Analytics API

### Analytics Hooks

#### `useOnboardingAnalytics(options)`
Get comprehensive onboarding analytics.

**Parameters:**
```typescript
{
  startDate?: string;
  endDate?: string;
  autoRefresh?: boolean;
  refetchInterval?: number;
}
```

**Returns:**
```typescript
{
  funnel: FunnelAnalytics;
  completionTrends: CompletionTrends;
  dropOff: DropOffAnalysis;
  performance: PerformanceMetrics;
  isLoading: boolean;
  error: any;
}
```

#### `useOnboardingFunnelAnalytics(startDate, endDate)`
Get funnel conversion analytics.

**Returns:**
```typescript
{
  data: OnboardingFunnelAnalytics | null;
  isLoading: boolean;
  error: any;
}
```

## 📝 TypeScript Interfaces

### Core Types

```typescript
export interface OnboardingPreferences {
  id: string;
  user_id: string;
  is_completed: boolean;
  completion_score: number;
  current_step: 'work-schedule' | 'time-buffers' | 'suppliers' | 'completed';
  steps_completed: string[];
  
  // Step Data
  work_schedule_data: WorkScheduleData;
  work_schedule_completed: boolean;
  time_buffers_data: TimeBuffersData;
  time_buffers_completed: boolean;
  suppliers_data: SuppliersData;
  suppliers_completed: boolean;
  
  // Metadata
  started_at: string;
  completed_at: string | null;
  last_accessed_at: string;
  onboarding_version: string;
  skip_reasons: Record<string, string>;
}

export interface WorkScheduleData {
  workDays: string[];
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakStartTime: string;
  breakEndTime: string;
}

export interface TimeBuffersData {
  travelBufferPercentage: number;
  jobDurationBufferMinutes: number;
  useDynamicBuffers: boolean;
}

export interface SuppliersData {
  primarySupplier: string;
  secondarySuppliers: string[];
  supplierPreferences: {
    priceWeight: number;
    qualityWeight: number;
    deliveryWeight: number;
  };
}

export interface OnboardingConfiguration {
  id: string;
  config_name: string;
  config_version: string;
  is_active: boolean;
  step_definitions: Record<string, StepDefinition>;
  flow_configuration: FlowConfiguration;
  feature_flags: Record<string, boolean>;
}

export interface OnboardingAnalyticsEvent {
  user_id: string;
  event_type: 'onboarding_started' | 'step_started' | 'step_completed' | 'step_skipped' | 'onboarding_completed' | 'onboarding_abandoned';
  step_name?: 'work-schedule' | 'time-buffers' | 'suppliers';
  event_timestamp?: string;
  time_spent_seconds?: number;
  form_data?: Record<string, any>;
  onboarding_version?: string;
  platform?: 'ios' | 'android' | 'web';
}
```

## 🔒 Security & RLS Policies

### Row Level Security

All onboarding tables have RLS enabled with the following policies:

#### Onboarding Preferences
- **SELECT**: Users can view their own preferences
- **INSERT**: Users can create their own preferences
- **UPDATE**: Users can update their own preferences
- **DELETE**: Users can delete their own preferences

#### Onboarding Analytics
- **SELECT**: Users can view their own analytics
- **INSERT**: Users can create their own analytics
- **UPDATE/DELETE**: Not allowed (append-only)

#### Onboarding Configurations
- **SELECT**: All authenticated users can read configurations
- **INSERT/UPDATE/DELETE**: Admin users only

### Authentication

All operations require valid Supabase authentication:

```typescript
// Example of authenticated request
const { data, error } = await supabase
  .from('onboarding_preferences')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

## 🚀 Integration Examples

### Basic Onboarding Flow

```typescript
import { useOnboarding } from '@/hooks/useOnboarding';

function OnboardingFlow() {
  const {
    status,
    preferences,
    configuration,
    updateStep,
    isLoading,
    error
  } = useOnboarding();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const handleStepComplete = (stepName: string, stepData: any) => {
    updateStep({
      stepName,
      stepData,
      completed: true
    });
  };

  if (status?.isCompleted) {
    return <OnboardingComplete />;
  }

  switch (status?.nextStep) {
    case 'work-schedule':
      return <WorkScheduleStep onComplete={handleStepComplete} />;
    case 'time-buffers':
      return <TimeBuffersStep onComplete={handleStepComplete} />;
    case 'suppliers':
      return <SuppliersStep onComplete={handleStepComplete} />;
    default:
      return <OnboardingStart />;
  }
}
```

### Analytics Dashboard

```typescript
import { useOnboardingAnalytics } from '@/hooks/useOnboardingAnalytics';

function OnboardingDashboard() {
  const {
    funnel,
    completionTrends,
    performance,
    isLoading
  } = useOnboardingAnalytics({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    autoRefresh: true
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Onboarding Analytics</h1>
      
      <div>
        <h2>Funnel Performance</h2>
        <p>Overall Completion Rate: {funnel.data?.overall_completion_rate}%</p>
        <p>Total Users Started: {funnel.data?.total_users_started}</p>
      </div>
      
      <div>
        <h2>Performance Metrics</h2>
        <p>Average Completion Time: {performance.data?.average_completion_time_minutes} minutes</p>
        <p>Drop-off Rate: {performance.data?.overall_drop_off_rate}%</p>
      </div>
    </div>
  );
}
```

## 📈 Performance Considerations

### Optimization Tips

1. **Caching**: All hooks use React Query with appropriate stale times
2. **Pagination**: Analytics queries support date ranges for large datasets
3. **Indexes**: Database tables have optimized indexes for common queries
4. **Batch Operations**: Use `Promise.all()` for multiple parallel operations

### Best Practices

1. **Error Handling**: Always handle errors from hooks and services
2. **Loading States**: Show loading indicators for better UX
3. **Data Validation**: Validate form data before submission
4. **Analytics Tracking**: Track all user interactions for insights

## 🛠️ Testing

### Mock Data Examples

```typescript
// Mock onboarding preferences
const mockPreferences: OnboardingPreferences = {
  id: 'test-id',
  user_id: 'user-123',
  is_completed: false,
  completion_score: 60,
  current_step: 'suppliers',
  steps_completed: ['work-schedule', 'time-buffers'],
  work_schedule_data: {
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '08:00',
    endTime: '17:00',
    hasBreak: true,
    breakStartTime: '12:00',
    breakEndTime: '13:00'
  },
  work_schedule_completed: true,
  // ... other fields
};
```

### Test Utilities

```typescript
import { OnboardingService } from '@/services/onboardingService';

// Reset user onboarding for testing
export const resetUserOnboarding = async (userId: string) => {
  const { error } = await OnboardingService.resetOnboarding(userId);
  if (error) throw error;
};

// Create test onboarding data
export const createTestOnboardingData = async (userId: string) => {
  const { data, error } = await OnboardingService.initializeOnboarding(userId);
  if (error) throw error;
  return data;
};
```

## 🔍 Troubleshooting

### Common Issues

1. **RLS Permission Denied**: Ensure user is authenticated and accessing their own data
2. **Missing Configuration**: Check that default configuration exists in database
3. **Analytics Not Tracking**: Verify analytics events are being sent correctly
4. **Completion Score Incorrect**: Check step completion logic and scoring configuration

### Debug Commands

```typescript
// Check user onboarding status
const debugStatus = await OnboardingService.getOnboardingStatus(userId);
console.log('Debug Status:', debugStatus);

// Check user preferences
const debugPreferences = await OnboardingService.getUserOnboardingPreferences(userId);
console.log('Debug Preferences:', debugPreferences);

// Check configuration
const debugConfig = await OnboardingService.getOnboardingConfiguration();
console.log('Debug Configuration:', debugConfig);
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

When adding new features to the onboarding system:

1. Update the corresponding TypeScript interfaces
2. Add proper error handling and loading states
3. Include analytics tracking for new events
4. Update this documentation
5. Add tests for new functionality

---

*This documentation is maintained by the TradeFlow development team. Last updated: December 2024* 