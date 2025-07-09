# Frontend Handoff: Real-time UI Implementation

## 🎯 Overview
This document provides Josh with everything needed to implement the real-time UI for the AI agent workflow. All backend infrastructure is complete and ready for frontend integration.

## ✅ What's Ready for You

### 1. Database & Schema
- ✅ `daily_plans` table created with full schema
- ✅ All RLS policies and indexes in place
- ✅ Real-time subscriptions enabled

### 2. Backend Services
- ✅ `DailyPlanService` with complete CRUD operations
- ✅ Real-time subscription system
- ✅ Error handling and recovery
- ✅ Hardware store job creation support

### 3. Data Contracts
- ✅ Complete TypeScript interfaces
- ✅ Agent output data structures
- ✅ State transition specifications

## 🚀 Implementation Tasks for Josh

### Task 1: Real-time Subscription Hook

Create `hooks/useDailyPlan.ts`:

```typescript
import { useState, useEffect } from 'react';
import { DailyPlanService, type DailyPlan } from '@/services/dailyPlanService';

export const useDailyPlan = (planDate: string) => {
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = 'your-user-id'; // Get from auth context
    
    // Initial fetch
    DailyPlanService.getCurrentDailyPlan(userId, planDate)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setDailyPlan(data);
        }
        setIsLoading(false);
      });

    // Real-time subscription
    const subscription = DailyPlanService.subscribeToDailyPlan(
      userId,
      planDate,
      (payload) => {
        console.log('Real-time update:', payload);
        if (payload.eventType === 'UPDATE') {
          setDailyPlan(payload.new);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [planDate]);

  return { dailyPlan, isLoading, error };
};
```

### Task 2: Plan Your Day UI Flow

Create the main workflow component in `components/PlanYourDay.tsx`:

```typescript
import React from 'react';
import { useDailyPlan } from '@/hooks/useDailyPlan';
import { DispatchStepUI } from './DispatchStepUI';
import { RouteStepUI } from './RouteStepUI';
import { InventoryStepUI } from './InventoryStepUI';
import { LoadingStepUI } from './LoadingStepUI';
import { ErrorStepUI } from './ErrorStepUI';

export const PlanYourDayFlow = () => {
  const today = new Date().toISOString().split('T')[0];
  const { dailyPlan, isLoading, error } = useDailyPlan(today);

  if (isLoading) return <LoadingStepUI />;
  if (error) return <ErrorStepUI error={error} />;
  if (!dailyPlan) return <StartPlanningUI />;

  // Render based on current step
  switch (dailyPlan.current_step) {
    case 'dispatch':
      if (dailyPlan.status === 'dispatch_complete') {
        return <DispatchStepUI plan={dailyPlan} />;
      }
      return <LoadingStepUI step="Analyzing jobs..." />;
      
    case 'route':
      if (dailyPlan.status === 'route_complete') {
        return <RouteStepUI plan={dailyPlan} />;
      }
      return <LoadingStepUI step="Optimizing route..." />;
      
    case 'inventory':
      if (dailyPlan.status === 'inventory_complete') {
        return <InventoryStepUI plan={dailyPlan} />;
      }
      return <LoadingStepUI step="Checking inventory..." />;
      
    case 'complete':
      return <FinalPlanSummary plan={dailyPlan} />;
      
    default:
      return <ErrorStepUI error="Unknown step" />;
  }
};
```

### Task 3: Dispatch Step UI (Drag & Drop)

Create `components/DispatchStepUI.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Button } from '@/components/ui';
import type { DailyPlan, DispatchOutput } from '@/services/dailyPlanService';

interface DispatchStepUIProps {
  plan: DailyPlan;
}

export const DispatchStepUI: React.FC<DispatchStepUIProps> = ({ plan }) => {
  const [jobOrder, setJobOrder] = useState(
    plan.dispatch_output.prioritized_jobs || []
  );

  const handleConfirmSchedule = async () => {
    // Save user modifications
    const modifications = {
      dispatch_changes: {
        job_reordering: jobOrder.map((job, index) => ({
          job_id: job.job_id,
          new_priority_rank: index + 1,
          timestamp: new Date().toISOString()
        }))
      }
    };

    await DailyPlanService.saveUserModifications(plan.id, modifications);
    
    // This will trigger the next step via agent execution
    // The real-time subscription will update the UI automatically
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Your Daily Schedule</Text>
      <Text style={styles.subtitle}>
        Drag to reorder jobs by priority
      </Text>
      
      <DraggableFlatList
        data={jobOrder}
        onDragEnd={({ data }) => setJobOrder(data)}
        keyExtractor={(item) => item.job_id}
        renderItem={({ item, drag, isActive }) => (
          <JobCard 
            job={item} 
            onLongPress={drag}
            isActive={isActive}
          />
        )}
      />
      
      <Button 
        title="Confirm Schedule"
        onPress={handleConfirmSchedule}
        variant="primary"
      />
    </View>
  );
};
```

### Task 4: Route Step UI (Map View)

Create `components/RouteStepUI.tsx`:

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Button } from '@/components/ui';
import type { DailyPlan } from '@/services/dailyPlanService';

interface RouteStepUIProps {
  plan: DailyPlan;
}

export const RouteStepUI: React.FC<RouteStepUIProps> = ({ plan }) => {
  const route = plan.route_output.optimized_route;
  
  const handleApproveRoute = async () => {
    await DailyPlanService.updateDailyPlan({
      id: plan.id,
      status: 'approved'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Optimized Route</Text>
      <Text style={styles.subtitle}>
        {route.total_distance}km • {route.total_travel_time} min travel
      </Text>
      
      <MapView style={styles.map}>
        {/* Route polyline */}
        <Polyline 
          coordinates={decodePolyline(route.route_geometry)}
          strokeColor="#F4A460"
          strokeWidth={4}
        />
        
        {/* Job markers */}
        {route.waypoints.map((waypoint, index) => (
          <Marker
            key={waypoint.job_id}
            coordinate={waypoint.coordinates}
            title={`Stop ${index + 1}`}
          />
        ))}
      </MapView>
      
      <Button 
        title="Approve Route"
        onPress={handleApproveRoute}
        variant="primary"
      />
    </View>
  );
};
```

### Task 5: Inventory Step UI (Checklist)

Create `components/InventoryStepUI.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, FlatList, Switch } from 'react-native';
import { Button } from '@/components/ui';
import type { DailyPlan } from '@/services/dailyPlanService';

interface InventoryStepUIProps {
  plan: DailyPlan;
}

export const InventoryStepUI: React.FC<InventoryStepUIProps> = ({ plan }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
  const handleItemToggle = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const handleFinalizePlan = async () => {
    await DailyPlanService.approveDailyPlan(plan.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parts & Inventory</Text>
      
      {/* Parts manifest */}
      <Text style={styles.sectionTitle}>Required Parts</Text>
      <FlatList
        data={plan.inventory_output.parts_manifest}
        renderItem={({ item }) => (
          <PartManifestItem 
            manifest={item}
            checkedItems={checkedItems}
            onToggle={handleItemToggle}
          />
        )}
      />
      
      {/* Shopping list */}
      {plan.inventory_output.shopping_list.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Shopping List</Text>
          <FlatList
            data={plan.inventory_output.shopping_list}
            renderItem={({ item }) => (
              <ShoppingListItem item={item} />
            )}
          />
        </>
      )}
      
      {/* Hardware store jobs */}
      {plan.inventory_output.created_hardware_store_jobs.length > 0 && (
        <Text style={styles.info}>
          Hardware store stops have been added to your route
        </Text>
      )}
      
      <Button 
        title="Finalize Plan"
        onPress={handleFinalizePlan}
        variant="primary"
      />
    </View>
  );
};
```

## 📋 State Management Integration

### Using TanStack Query

Once Trevor provides the TanStack Query hooks, integrate them like this:

```typescript
// Replace direct service calls with query hooks
const { data: dailyPlan, isLoading } = useDailyPlanQuery(planDate);
const updatePlanMutation = useUpdateDailyPlanMutation();

// Use in component
const handleUpdate = () => {
  updatePlanMutation.mutate({
    id: plan.id,
    user_modifications: modifications
  });
};
```

## 🔄 State Transitions to Handle

Your UI must handle these real-time state changes:

1. **`pending` → `dispatch_complete`**: Show job list with drag-and-drop
2. **`dispatch_complete` → `route_complete`**: Show optimized route on map  
3. **`route_complete` → `inventory_complete`**: Show parts checklist
4. **`inventory_complete` → `approved`**: Show final plan summary
5. **Any state → `error`**: Show error message and retry button

## 🚨 Error Handling

```typescript
export const ErrorStepUI: React.FC<{ error: string }> = ({ error }) => {
  const handleRetry = async () => {
    // Retry logic - create new plan or retry failed step
  };

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Planning Failed</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <Button title="Retry" onPress={handleRetry} />
    </View>
  );
};
```

## 📋 Sample JSON Payloads

These are the actual JSON structures you'll receive from the agent workflow:

### Dispatch Agent Output
```json
{
  "prioritized_jobs": [
    {
      "job_id": "uuid-job-123",
      "priority_rank": 1,
      "estimated_start_time": "2024-02-15T09:00:00Z",
      "estimated_end_time": "2024-02-15T11:00:00Z",
      "priority_reason": "Emergency job - gas leak requires immediate response",
      "job_type": "demand",
      "buffer_time_minutes": 30
    },
    {
      "job_id": "uuid-job-456", 
      "priority_rank": 2,
      "estimated_start_time": "2024-02-15T11:30:00Z",
      "estimated_end_time": "2024-02-15T13:00:00Z",
      "priority_reason": "High-value client with VIP status",
      "job_type": "maintenance",
      "buffer_time_minutes": 15
    }
  ],
  "scheduling_constraints": {
    "work_start_time": "08:00",
    "work_end_time": "17:00", 
    "lunch_break_start": "12:00",
    "lunch_break_end": "13:00",
    "total_work_hours": 8
  },
  "recommendations": [
    "Emergency job prioritized due to safety concerns",
    "VIP client scheduled during optimal time window"
  ],
  "agent_reasoning": "Prioritized emergency gas leak repair first due to safety protocols. Scheduled VIP client maintenance during morning hours for optimal service quality.",
  "execution_time_ms": 1247
}
```

### Route Agent Output
```json
{
  "optimized_route": {
    "waypoints": [
      {
        "job_id": "uuid-job-123",
        "sequence_number": 1,
        "coordinates": {
          "latitude": 37.7749,
          "longitude": -122.4194
        },
        "arrival_time": "2024-02-15T09:00:00Z",
        "departure_time": "2024-02-15T11:00:00Z",
        "duration_at_location": 120,
        "travel_time_to_next": 25,
        "distance_to_next": 8.5
      },
      {
        "job_id": "store-run-uuid",
        "sequence_number": 2,
        "coordinates": {
          "latitude": 37.7849,
          "longitude": -122.4094
        },
        "arrival_time": "2024-02-15T11:25:00Z",
        "departure_time": "2024-02-15T11:45:00Z",
        "duration_at_location": 20,
        "travel_time_to_next": 15,
        "distance_to_next": 5.2
      }
    ],
    "route_geometry": "encoded_polyline_string_for_mapping",
    "total_distance": 25.5,
    "total_travel_time": 45,
    "total_work_time": 360
  },
  "alternative_routes": [
    {
      "route_id": "alt_route_1",
      "total_distance": 28.2,
      "total_time": 52,
      "route_geometry": "alternative_encoded_polyline"
    }
  ],
  "agent_reasoning": "Selected route minimizes travel time while respecting time windows. Added hardware store stop between jobs for optimal efficiency.",
  "execution_time_ms": 2156
}
```

### Inventory Agent Output
```json
{
  "parts_manifest": [
    {
      "job_id": "uuid-job-123",
      "required_parts": [
        {
          "inventory_item_id": "inv-item-789",
          "item_name": "Gas Shut-off Valve",
          "quantity_needed": 1,
          "quantity_available": 2,
          "unit": "each",
          "category": "plumbing"
        },
        {
          "inventory_item_id": "inv-item-456", 
          "item_name": "Pipe Thread Sealant",
          "quantity_needed": 1,
          "quantity_available": 0,
          "unit": "tube",
          "category": "sealants"
        }
      ]
    }
  ],
  "shopping_list": [
    {
      "item_name": "Pipe Thread Sealant",
      "quantity_needed": 1,
      "unit": "tube",
      "category": "sealants",
      "preferred_supplier": "Home Depot",
      "estimated_cost": 8.99,
      "priority": "high"
    }
  ],
  "hardware_store_run": {
    "store_locations": [
      {
        "store_name": "The Home Depot #4512",
        "address": "1965 Ocean Ave, San Francisco, CA 94127",
        "coordinates": {
          "latitude": 37.7249,
          "longitude": -122.4564
        },
        "estimated_visit_time": 20,
        "items_available": ["Pipe Thread Sealant"]
      }
    ],
    "total_estimated_cost": 8.99,
    "estimated_shopping_time": 20
  },
  "created_hardware_store_jobs": ["store-run-uuid"],
  "inventory_alerts": [
    {
      "item_name": "Pipe Thread Sealant",
      "alert_type": "out_of_stock", 
      "message": "Critical item out of stock - added to shopping list"
    }
  ],
  "agent_reasoning": "Identified missing pipe thread sealant for emergency repair. Created optimized hardware store run at nearby Home Depot location.",
  "execution_time_ms": 1834
}
```

### Error State Example
```json
{
  "error_state": {
    "error_type": "agent_failure",
    "error_message": "Route optimization failed: VROOM engine unreachable",
    "failed_step": "route",
    "timestamp": "2024-02-15T10:30:45Z",
    "retry_suggested": true,
    "diagnostic_info": {
      "vroom_endpoint": "http://localhost:3000/vroom",
      "job_count": 3,
      "timeout_seconds": 30
    }
  }
}
```

## 🧪 Testing Your Implementation

1. **Test with static data first**: Use mock daily plan objects
2. **Test state transitions**: Manually update plan status in Supabase
3. **Test real-time updates**: Have another user/session update the plan
4. **Test error scenarios**: Set plan status to 'error' 
5. **Test hardware store jobs**: Verify created jobs appear in route

## 📞 Support & Coordination

**Questions about:**
- **Database queries**: Ask Trevor (he'll create TanStack Query hooks)
- **Agent outputs**: Ask Jeremiah (all data structures are finalized)
- **Real-time subscriptions**: This documentation has everything you need

**Next coordination points:**
- Week 2: Integration with Trevor's TanStack Query hooks
- Week 3: Testing with live LangGraph agent execution

## 🎯 Success Criteria

Your implementation is complete when:
- ✅ Real-time subscription updates UI automatically
- ✅ Drag-and-drop job reordering works
- ✅ Map displays optimized route with markers
- ✅ Inventory checklist handles all manifest items
- ✅ Error states show retry options
- ✅ Hardware store jobs appear in route visualization

You have everything you need to start building! The backend is solid and ready for your frontend magic. 🚀 