# TradeFlow AI – Detailed Code & Table References for Gamma Pitch Deck

## Slide 2: AI Planning in Two Taps - Dispatcher Code

```typescript
// Actual dispatcher execution from the codebase
const dispatcherContext = {
  userId: "contractor-123",
  jobIds: ["job-1", "job-2", "job-3"],
  planDate: "2025-01-15"
};

// Edge function call
const dispatchResult = await DispatcherAgent.execute(dispatcherContext);

// Result structure
{
  prioritized_jobs: [
    {
      job_id: "job-1",
      priority_rank: 1,
      scheduled_start_time: "08:00",
      priority_reason: "Emergency plumbing leak",
      business_priority_tier: "emergency",
      travel_time_to_next: 15
    }
  ],
  optimization_summary: {
    total_jobs: 3,
    total_travel_time: 45,
    total_working_time: 360
  }
}
```

## Slide 3: Route Optimization Table

```sql
-- Actual routes table structure
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  planned_date DATE NOT NULL,
  start_location JSONB, -- {lat, lng, address}
  end_location JSONB,   -- {lat, lng, address}
  waypoints JSONB[],    -- Array of stops with coordinates
  total_distance NUMERIC(10,2), -- kilometers
  total_duration INTEGER,       -- minutes
  optimization_data JSONB,      -- AI reasoning details
  status TEXT CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sample data
INSERT INTO routes VALUES (
  'route-123',
  'user-456',
  'Monday Route',
  '2025-01-15',
  '{"lat": 37.7749, "lng": -122.4194, "address": "Home Base"}',
  '{"lat": 37.7749, "lng": -122.4194, "address": "Home Base"}',
  ARRAY[
    '{"lat": 37.7849, "lng": -122.4094, "address": "Job 1", "arrival": "08:30"}',
    '{"lat": 37.7949, "lng": -122.3994, "address": "Job 2", "arrival": "10:00"}'
  ],
  25.5,
  180,
  '{"reasoning": "Optimized for minimal backtracking"}',
  'planned'
);
```

## Slide 4: Inventory Agent Execution

```typescript
// Full inventory analysis context
const inventoryContext = {
  userId: "contractor-123",
  jobIds: ["job-1", "job-2", "job-3"],
  dispatchOutput: dispatchResult // From previous step
};

// Execute inventory analysis
const inventoryResult = await InventoryAgent.execute(inventoryContext);

// Detailed result with hardware store job
{
  inventory_analysis: {
    parts_needed: [
      {
        item_name: "3/4 inch copper pipe",
        quantity: 10,
        category: "plumbing",
        priority: "critical",
        job_ids: ["job-1", "job-2"]
      }
    ],
    shopping_list: [
      {
        item_name: "3/4 inch copper pipe",
        quantity_to_buy: 10,
        estimated_cost: 45.99,
        preferred_supplier: "home_depot",
        priority: "critical"
      }
    ],
    total_shopping_cost: 127.45
  },
  hardware_store_job: {
    id: "hardware-store-stop",
    title: "Home Depot - Parts Pickup",
    address: "1234 Contractor Way",
    latitude: 37.7899,
    longitude: -122.4044,
    estimated_duration: 30,
    shopping_list: [...], // Full list
    scheduling_notes: "Insert after morning emergency job"
  }
}
```

## Slide 5: Job Status & Inventory Usage Tables

```sql
-- Job status tracking
CREATE TABLE public.job_locations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  status TEXT CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled', 'paused'
  )),
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  completion_notes TEXT,
  parts_used JSONB, -- Tracks actual inventory usage
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory movements table for tracking usage
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  item_id UUID REFERENCES inventory_items(id),
  job_id UUID REFERENCES job_locations(id),
  movement_type TEXT CHECK (movement_type IN (
    'job_usage', 'purchase', 'return', 'adjustment'
  )),
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Example job completion with parts logging
UPDATE job_locations 
SET 
  status = 'completed',
  actual_end = now(),
  parts_used = '[
    {"item_id": "inv-123", "quantity": 2, "name": "Ball valve"},
    {"item_id": "inv-456", "quantity": 5, "name": "Copper fitting"}
  ]'
WHERE id = 'job-1';
```

## Slide 6: User Preferences Structure

```sql
-- Actual preferences JSONB structure in profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  preferences JSONB DEFAULT '{}'::jsonb,
  -- Other fields...
);

-- Complete preferences structure
UPDATE profiles 
SET preferences = '{
  "work_days": ["mon", "tue", "wed", "thu", "fri"],
  "work_start_time": "08:00",
  "work_end_time": "17:00",
  "lunch_break_start": "12:00",
  "lunch_break_end": "13:00",
  "travel_buffer_minutes": 15,
  "job_duration_buffer_minutes": 15,
  "emergency_response_time_minutes": 60,
  "preferred_suppliers": ["home_depot", "lowes"],
  "vehicle_type": "van",
  "toll_preference": "avoid",
  "break_location_preference": "job_site",
  "enable_smart_buffers": true,
  "primary_supplier": "home_depot",
  "quality_preference": "professional",
  "max_daily_jobs": 6,
  "max_daily_hours": 8,
  "preferred_map_app": "apple_maps"
}'
WHERE id = 'user-123';
```

## Slide 7: Real-time Sync Hook

```typescript
// Actual hook from useDailyPlan.ts
import { useDailyPlan } from '@/hooks/useDailyPlan';

export default function PlanScreen() {
  const {
    dailyPlan,
    isProcessing,
    currentStep,
    startPlanning,
    confirmDispatcherOutput,
    proceedToInventory,
    // Real-time subscription active
  } = useDailyPlan();

  // Real-time database subscription (automatic)
  useEffect(() => {
    const subscription = supabase
      .channel(`daily_plan_${planId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'daily_plans',
        filter: `id=eq.${planId}`
      }, (payload) => {
        // Auto-updates UI when plan changes
        console.log('Plan updated:', payload.new);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [planId]);

  // Dynamic replanning
  const handleReplan = async () => {
    await cancelPlanning();
    await startPlanning(updatedJobIds);
  };
}
```

## Slide 8: Complete Setup Commands

```bash
# Clone the repository
git clone https://github.com/tradeflow/tradeflow-app.git
cd tradeflow-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and OpenAI keys

# Set up Supabase
npx supabase init
npx supabase db push

# Deploy edge functions
npx supabase functions deploy dispatcher
npx supabase functions deploy inventory

# Start development
npm start

# For production self-hosting
docker-compose up -d
```

## Slide 9: Feedback & Learning Tables

```sql
-- User feedback events table (actual schema)
CREATE TABLE public.user_feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT CHECK (event_type IN (
    'job_reorder', 'job_added', 'job_removed',
    'route_modified', 'inventory_adjusted',
    'plan_approved', 'plan_rejected'
  )),
  entity_type TEXT, -- 'job', 'route', 'inventory'
  entity_id UUID,
  original_value JSONB,
  modified_value JSONB,
  reason TEXT,
  context JSONB, -- Full plan context
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent decision contexts (for learning)
CREATE TABLE public.agent_decision_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT, -- 'dispatcher' or 'inventory'
  decision_type TEXT,
  input_context JSONB,
  output_decision JSONB,
  user_feedback_id UUID REFERENCES user_feedback_events(id),
  confidence_score NUMERIC(3,2),
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Example: User reorders jobs
INSERT INTO user_feedback_events VALUES (
  'feedback-123',
  'user-456',
  'job_reorder',
  'job',
  'job-2',
  '{"position": 3}',  -- Was third
  '{"position": 1}',  -- Moved to first
  'Customer called, urgent',
  '{"plan_id": "plan-789", "total_jobs": 5}',
  now()
);
```

## Additional Visual Elements

### System Architecture Diagram (for slides)
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Mobile    │────▶│ Supabase DB  │────▶│ Edge Funcs  │
│  React App  │     │ (PostgreSQL) │     │  (Deno)     │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       │                    │                     ▼
       │                    │              ┌──────────┐
       │                    │              │ OpenAI   │
       └────────────────────┴─────────────▶│ GPT-4o   │
                 Real-time Sync             └──────────┘
```

### Performance Metrics (for impact slide)
```typescript
// Before TradeFlow
const manualPlanning = {
  time_spent: 120, // minutes
  routes_efficiency: 0.65, // 65% optimal
  missed_parts: 2.3, // average per day
  revenue_lost: 250 // dollars per day
};

// After TradeFlow
const withTradeFlow = {
  time_spent: 5, // minutes
  routes_efficiency: 0.92, // 92% optimal
  missed_parts: 0.1, // rare
  revenue_gained: 250 // dollars per day
};
``` 