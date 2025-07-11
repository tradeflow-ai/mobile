# 2-Step Workflow Process Guide

## Overview

TradeFlow's 2-step workflow architecture provides intelligent job prioritization and inventory management through user-confirmed stages. This guide covers the complete workflow from initiation to execution.

## Workflow Architecture

### High-Level Flow
```
User Selection → Dispatcher → User Confirmation → Inventory → Execution
```

### Detailed Flow
```
1. Start Planning
   ↓
2. Dispatcher Function (Job Prioritization)
   ↓
3. Dispatcher Confirmation Screen
   ↓
4. User Confirmation/Modification
   ↓
5. Inventory Function (Parts Analysis)
   ↓
6. Hardware Store Job Creation (if needed)
   ↓
7. Final Execution Plan
   ↓
8. User Approval & Execution
```

## Step-by-Step Process

### Step 1: Start Planning
**User Action**: Select jobs and initiate planning

**Mobile App State**: `pending`
- User selects jobs from job list
- User taps "Start Planning" button
- App shows loading indicator
- Database status: `pending`

**Data Flow**:
- Selected job IDs collected
- User preferences retrieved
- Current date/time captured
- Dispatcher function called

### Step 2: Dispatcher Function Execution
**System Action**: Prioritize jobs and optimize routes

**Mobile App State**: `dispatcher_analyzing`
- Loading screen with dispatcher progress
- "Analyzing jobs and optimizing routes..." message
- Database status: `dispatcher_analyzing`

**Dispatcher Function Process**:
1. **Job Data Retrieval**: Fetch job details from database
2. **User Preferences**: Load work schedule and preferences
3. **Business Rule Application**: Apply priority rules (Emergency → Inspection → Service)
4. **Route Optimization**: Use GPT-4o spatial reasoning for optimal routing
5. **Result Generation**: Create prioritized job list with timing

**Expected Output**:
```typescript
{
  prioritized_jobs: [
    {
      job_id: "job-emergency-1",
      priority_rank: 1,
      job_type: "emergency",
      estimated_start_time: "08:00",
      estimated_end_time: "09:30",
      priority_reason: "Emergency plumbing leak requires immediate attention",
      scheduling_notes: "Must be first job of the day",
      business_priority_tier: "emergency",
      geographic_reasoning: "Closest emergency job to starting location",
      travel_time_to_next: 20
    }
  ],
  optimization_summary: {
    emergency_jobs: 1,
    inspection_jobs: 2,
    service_jobs: 3,
    total_travel_time: 65,
    route_efficiency: 0.85
  }
}
```

### Step 3: Dispatcher Confirmation Screen
**User Action**: Review and confirm job prioritization

**Mobile App State**: `dispatcher_complete` → `awaiting_confirmation`
- Display prioritized job list
- Show route optimization summary
- Allow user modifications
- Database status: `awaiting_confirmation`

**UI Components**:
- **Job List**: Prioritized jobs with drag-and-drop reordering
- **Route Summary**: Total travel time, efficiency score
- **Modification Options**: Reorder jobs, adjust timing
- **Confirmation Button**: "Confirm and Proceed to Inventory"

**User Options**:
- **Confirm as-is**: Proceed with dispatcher recommendations
- **Modify order**: Drag-and-drop to reorder jobs
- **Adjust timing**: Modify start/end times
- **Cancel**: Return to job selection

### Step 4: User Confirmation/Modification
**User Action**: Confirm or modify job order

**Process**:
1. **User Reviews**: Examines proposed job order and timing
2. **Modifications** (if needed): Reorders jobs, adjusts timing
3. **Confirmation**: Approves final job order
4. **Database Update**: Status changes to `inventory_analyzing`

**Data Validation**:
- Ensure all selected jobs are included
- Validate time constraints (work hours, lunch breaks)
- Check for scheduling conflicts
- Confirm route feasibility

### Step 5: Inventory Function Execution
**System Action**: Analyze parts requirements and create shopping list

**Mobile App State**: `inventory_analyzing`
- Loading screen with inventory progress
- "Analyzing parts requirements..." message
- Database status: `inventory_analyzing`

**Inventory Function Process**:
1. **Job Analysis**: Examine each job's parts requirements
2. **Inventory Check**: Compare against on-hand inventory
3. **Shopping List Generation**: Create prioritized shopping list
4. **Supplier Optimization**: Find best suppliers and locations
5. **Hardware Store Job Creation**: Generate hardware store job if needed

**Expected Output**:
```typescript
{
  inventory_analysis: {
    shopping_list: [
      {
        item_name: "Pipe fittings",
        quantity_to_buy: 2,
        estimated_cost: 7.50,
        preferred_supplier: "home_depot",
        priority: "critical"
      }
    ],
    total_shopping_cost: 45.99,
    inventory_status: "needs_shopping",
    parts_availability: "Some parts unavailable"
  },
  hardware_store_job: {
    id: "hw-store-123",
    title: "Home Depot - Parts Pickup",
    job_type: "hardware_store",
    priority: "high",
    address: "1234 Store St, San Francisco, CA",
    latitude: 37.7750,
    longitude: -122.4180,
    estimated_duration: 30,
    estimated_cost: 45.99,
    shopping_list: [/* shopping list items */]
  }
}
```

### Step 6: Hardware Store Job Creation & Insertion
**System Action**: Create and insert hardware store job

**Mobile App State**: `inventory_complete` → `hardware_store_added`
- Display inventory analysis results
- Show hardware store job details
- Display updated job list with hardware store inserted
- Database status: `hardware_store_added`

**Hardware Store Job Insertion Logic**:
1. **Standard Case**: Insert after Emergency + Inspection jobs, before Service jobs
2. **Emergency Case**: If emergency job needs immediate parts, hardware store goes first
3. **Optimization**: Group parts for multiple jobs into single store visit

**Example Job Order**:
```
Before Hardware Store:
1. Emergency Plumbing Leak
2. HVAC Inspection
3. Sink Repair

After Hardware Store Insertion:
1. Emergency Plumbing Leak
2. HVAC Inspection
3. Home Depot - Parts Pickup ← INSERTED
4. Sink Repair
```

### Step 7: Final Execution Plan
**User Action**: Review final plan and approve

**Mobile App State**: `ready_for_execution`
- Display complete job list with hardware store
- Show shopping list and costs
- Present final execution summary
- Database status: `ready_for_execution`

**UI Components**:
- **Complete Job List**: All jobs including hardware store
- **Shopping Summary**: Parts list and total cost
- **Execution Summary**: Total time, costs, route efficiency
- **Approval Button**: "Approve and Start Execution"

### Step 8: User Approval & Execution
**User Action**: Approve plan and begin execution

**Mobile App State**: `approved`
- Plan approved and ready for execution
- Real-time job tracking begins
- Database status: `approved`

**Execution Features**:
- **Job Navigation**: Turn-by-turn directions to each job
- **Real-time Updates**: Live progress tracking
- **Completion Tracking**: Mark jobs as completed
- **Inventory Updates**: Update inventory as parts are used

## Database State Management

### Daily Plans Table States
```sql
CREATE TYPE daily_plan_status AS ENUM (
  'pending',
  'dispatcher_analyzing',
  'dispatcher_complete',
  'awaiting_confirmation',
  'inventory_analyzing',
  'inventory_complete',
  'hardware_store_added',
  'ready_for_execution',
  'approved',
  'in_progress',
  'completed',
  'cancelled'
);
```

### State Transitions
```
pending → dispatcher_analyzing → dispatcher_complete → awaiting_confirmation
                                                             ↓
approved ← ready_for_execution ← hardware_store_added ← inventory_complete
                                                             ↓
                                                      inventory_analyzing
```

## Error Handling

### Dispatcher Function Errors
**Network Errors**:
- Show retry button with exponential backoff
- Implement offline mode with cached results
- Display user-friendly error messages

**API Errors**:
- Handle OpenAI API rate limits
- Implement fallback algorithms
- Log errors for debugging

**Data Errors**:
- Validate job data completeness
- Handle missing user preferences
- Provide default values where appropriate

### Inventory Function Errors
**Supplier API Errors**:
- Fall back to cached supplier data
- Use alternative suppliers
- Continue without hardware store if critical

**Parts Database Errors**:
- Use estimated parts requirements
- Continue with manual shopping list
- Allow user to edit parts list

## Performance Optimization

### Response Time Targets
- **Dispatcher Function**: < 3 seconds
- **Inventory Function**: < 5 seconds
- **User Interface**: < 1 second response time

### Optimization Strategies
1. **Caching**: Cache route calculations and parts data
2. **Parallel Processing**: Process multiple jobs simultaneously
3. **Incremental Updates**: Update UI as data becomes available
4. **Offline Support**: Cache critical data for offline usage

## User Experience Guidelines

### Loading States
- Show progress indicators for all async operations
- Provide informative loading messages
- Allow cancellation of long-running operations

### Error States
- Display clear, actionable error messages
- Provide retry options where appropriate
- Offer fallback workflows for critical failures

### Success States
- Show confirmation of successful operations
- Display summary information
- Provide clear next steps

## Testing Strategy

### Unit Tests
- Test individual function components
- Mock external dependencies
- Validate data transformations

### Integration Tests
- Test complete workflow from start to finish
- Verify database state transitions
- Test error handling and recovery

### User Acceptance Tests
- Test user interaction flows
- Verify UI responsiveness
- Test edge cases and error scenarios

## Monitoring & Analytics

### Key Metrics
- **Function Performance**: Response times, error rates
- **User Engagement**: Completion rates, modification frequency
- **Business Impact**: Route efficiency, time savings

### Alerts
- Function timeouts or errors
- Unusual user behavior patterns
- Database performance issues

### Dashboards
- Real-time function performance
- User workflow analytics
- Business metrics and KPIs

## Best Practices

### Development
1. **Function Isolation**: Keep functions focused and independent
2. **Error Handling**: Implement comprehensive error handling
3. **Documentation**: Maintain up-to-date documentation
4. **Testing**: Write tests for all critical paths

### User Experience
1. **Feedback**: Provide clear feedback for all user actions
2. **Flexibility**: Allow user modifications where appropriate
3. **Performance**: Optimize for speed and responsiveness
4. **Accessibility**: Ensure UI is accessible to all users

### Operations
1. **Monitoring**: Implement comprehensive monitoring
2. **Logging**: Log all critical operations
3. **Backup**: Have rollback strategies for failures
4. **Security**: Validate all inputs and secure API calls

## Future Enhancements

### Planned Features
- **Machine Learning**: Learn from user preferences and modifications
- **Advanced Routing**: Real-time traffic integration
- **Predictive Inventory**: Predict parts needs based on job history
- **Multi-day Planning**: Extend planning to multiple days

### Scalability Considerations
- **Function Optimization**: Continue optimizing function performance
- **Database Scaling**: Plan for increased data volume
- **User Growth**: Prepare for increased user base
- **Feature Expansion**: Design for additional features and complexity 