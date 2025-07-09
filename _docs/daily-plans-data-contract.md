# Daily Plans Data Contract

## Overview
This document defines the data structure for the `daily_plans` table and real-time subscription patterns for the frontend team to implement the AI agent workflow UI.

## Database Schema

### Table: `public.daily_plans`

```sql
CREATE TABLE public.daily_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  
  -- Workflow state tracking
  status TEXT CHECK (status IN ('pending', 'dispatch_complete', 'route_complete', 'inventory_complete', 'approved', 'cancelled', 'error')),
  current_step TEXT CHECK (current_step IN ('dispatch', 'route', 'inventory', 'complete')),
  
  -- Agent outputs (JSONB)
  dispatch_output JSONB DEFAULT '{}',
  route_output JSONB DEFAULT '{}',
  inventory_output JSONB DEFAULT '{}',
  
  -- Human-in-the-loop modifications
  user_modifications JSONB DEFAULT '{}',
  
  -- Context and preferences snapshot
  preferences_snapshot JSONB DEFAULT '{}',
  job_ids UUID[] DEFAULT '{}', -- Original jobs for the day
  created_job_ids UUID[] DEFAULT '{}', -- Jobs created during workflow (e.g., hardware store runs)
  
  -- Error handling
  error_state JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  
  -- Planning metadata
  planned_date DATE NOT NULL,
  total_estimated_duration INTEGER,
  total_distance DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

## Agent Workflow States

### Status Field Values

| Status | Description | UI State |
|--------|-------------|----------|
| `pending` | Initial state, no agents have run | Show loading/start button |
| `dispatch_complete` | Dispatch Strategist has completed | Show job list for approval |
| `route_complete` | Route Optimizer has completed | Show map view for approval |
| `inventory_complete` | Inventory Specialist has completed | Show checklist for approval |
| `approved` | User has approved the complete plan | Show final plan summary |
| `cancelled` | User cancelled the planning process | Show restart option |
| `error` | Agent execution failed | Show error message and retry |

### Current Step Field Values

| Step | Description | Active Agent |
|------|-------------|--------------|
| `dispatch` | Job prioritization phase | Dispatch Strategist |
| `route` | Route optimization phase | Route Optimizer |
| `inventory` | Parts preparation phase | Inventory Specialist |
| `complete` | All agents finished | None |

## Agent Output Data Structures

### Dispatch Output (`dispatch_output`)

```typescript
interface DispatchOutput {
  prioritized_jobs: Array<{
    job_id: string;
    priority_rank: number;
    estimated_start_time: string; // ISO timestamp
    estimated_end_time: string; // ISO timestamp
    priority_reason: string;
    job_type: 'demand' | 'maintenance' | 'emergency';
    buffer_time_minutes: number;
  }>;
  scheduling_constraints: {
    work_start_time: string; // HH:MM format
    work_end_time: string; // HH:MM format
    lunch_break_start: string; // HH:MM format
    lunch_break_end: string; // HH:MM format
    total_work_hours: number;
  };
  recommendations: string[];
  agent_reasoning: string;
  execution_time_ms: number;
}
```

### Route Output (`route_output`)

```typescript
interface RouteOutput {
  optimized_route: {
    waypoints: Array<{
      job_id: string;
      sequence_number: number;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      arrival_time: string; // ISO timestamp
      departure_time: string; // ISO timestamp
      duration_at_location: number; // minutes
      travel_time_to_next: number; // minutes
      distance_to_next: number; // kilometers
    }>;
    route_geometry: string; // Polyline for map display
    total_distance: number; // kilometers
    total_travel_time: number; // minutes
    total_work_time: number; // minutes
  };
  alternative_routes?: Array<{
    route_id: string;
    total_distance: number;
    total_time: number;
    route_geometry: string;
  }>;
  agent_reasoning: string;
  execution_time_ms: number;
}
```

### Inventory Output (`inventory_output`)

```typescript
interface InventoryOutput {
  parts_manifest: Array<{
    job_id: string;
    required_parts: Array<{
      inventory_item_id: string;
      item_name: string;
      quantity_needed: number;
      quantity_available: number;
      unit: string;
      category: string;
    }>;
  }>;
  shopping_list: Array<{
    item_name: string;
    quantity_needed: number;
    unit: string;
    category: string;
    preferred_supplier: string;
    estimated_cost: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  hardware_store_run?: {
    store_locations: Array<{
      store_name: string;
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      estimated_visit_time: number; // minutes
      items_available: string[];
    }>;
    total_estimated_cost: number;
    estimated_shopping_time: number; // minutes
  };
  created_hardware_store_jobs: string[]; // CRITICAL: Job IDs created by inventory agent
  inventory_alerts: Array<{
    item_name: string;
    alert_type: 'low_stock' | 'out_of_stock' | 'reorder_needed';
    message: string;
  }>;
  agent_reasoning: string;
  execution_time_ms: number;
}
```

### Error State (`error_state`)

```typescript
interface ErrorState {
  error_type: 'agent_failure' | 'validation_error' | 'timeout' | 'external_api_error';
  error_message: string;
  failed_step: 'dispatch' | 'route' | 'inventory';
  timestamp: string; // ISO timestamp
  retry_suggested: boolean;
  diagnostic_info: Record<string, any>;
}
```

### User Modifications (`user_modifications`)

```typescript
interface UserModifications {
  dispatch_changes?: {
    job_reordering?: Array<{
      job_id: string;
      new_priority_rank: number;
      timestamp: string;
    }>;
    job_removals?: Array<{
      job_id: string;
      reason: string;
      timestamp: string;
    }>;
  };
  route_changes?: {
    waypoint_modifications?: Array<{
      job_id: string;
      new_sequence_number: number;
      timestamp: string;
    }>;
  };
  inventory_changes?: {
    parts_modifications?: Array<{
      inventory_item_id: string;
      quantity_override: number;
      timestamp: string;
    }>;
    shopping_list_modifications?: Array<{
      item_name: string;
      action: 'add' | 'remove' | 'modify';
      quantity?: number;
      timestamp: string;
    }>;
  };
}
```

## Real-time Subscription Patterns

### Supabase Subscription Setup

```typescript
// Frontend implementation example
const { data, error } = supabase
  .from('daily_plans')
  .select('*')
  .eq('user_id', userId)
  .eq('planned_date', today)
  .order('created_at', { ascending: false })
  .limit(1)
  .subscribe((payload) => {
    // Handle real-time updates from agent execution
    handleDailyPlanUpdate(payload);
  });
```

### State Transition Events

The frontend should handle these state transitions:

1. **`pending` → `dispatch_complete`**: Show prioritized job list with drag-and-drop
2. **`dispatch_complete` → `route_complete`**: Show optimized route on map
3. **`route_complete` → `inventory_complete`**: Show parts checklist
4. **`inventory_complete` → `approved`**: Show final plan summary
5. **Any state → `error`**: Show error message and retry button

### UI State Management

```typescript
// Suggested React hook pattern
export const useDailyPlan = (planDate: string) => {
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const subscription = supabase
      .from('daily_plans')
      .select('*')
      .eq('planned_date', planDate)
      .subscribe((payload) => {
        setDailyPlan(payload.new);
        setIsLoading(false);
      });
    
    return () => subscription.unsubscribe();
  }, [planDate]);
  
  return { dailyPlan, isLoading, error };
};
```

## Agent Execution Flow

### 1. Plan Initialization
- User triggers "Plan Your Day"
- Frontend creates new `daily_plans` record with `status: 'pending'`
- LangGraph agent begins execution

### 2. Agent State Updates
- Each agent completion updates the database record
- Frontend receives real-time updates via subscription
- UI transitions to next approval step

### 3. Human-in-the-Loop Verification
- User approves/modifies each agent output
- User modifications saved to `user_modifications` field
- Status progresses to next step

### 4. Plan Completion
- Final status set to `approved`
- Plan ready for execution
- Real-time updates stop

## Error Handling

### Agent Failures
- Status set to `error`
- `error_state` populated with failure details
- UI shows error message and retry button

### Timeout Handling
- Plans older than 30 minutes without progress considered stale
- UI should show timeout message
- Retry or restart options provided

### Network Resilience
- Frontend should handle Supabase connection drops
- Implement exponential backoff for reconnection
- Show connection status in UI

## Data Validation

### Frontend Validation
- Validate all JSONB fields before saving modifications
- Check timestamp formats and ranges
- Validate UUIDs and foreign key references

### Backend Validation
- LangGraph agents validate all outputs before saving
- Database constraints enforce data integrity
- RLS policies ensure user data security

## Performance Considerations

### Indexing Strategy
- User-specific queries optimized with `idx_daily_plans_user_id`
- Status-based queries use `idx_daily_plans_status`
- Date-based queries use `idx_daily_plans_planned_date`

### Subscription Management
- Limit to one active subscription per user
- Unsubscribe when component unmounts
- Filter by date to reduce payload size

### Data Retention
- Consider archiving old plans (>30 days)
- Implement soft deletion for user data
- Regular cleanup of error states

## Testing Requirements

### Unit Tests
- Test each data structure parsing
- Validate subscription handling
- Test error state recovery

### Integration Tests
- Test agent state transitions
- Verify real-time updates
- Test user modification handling

### E2E Tests
- Full workflow from start to approval
- Test error scenarios and recovery
- Verify data persistence across sessions 