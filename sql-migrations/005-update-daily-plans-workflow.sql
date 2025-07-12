-- Migration 008: Update Daily Plans for New 2-Step Workflow
-- This migration updates the daily_plans table to support the new workflow
-- with dispatcher and inventory edge functions instead of the old 3-step process

BEGIN;

-- Update daily_plans table status enum to include new workflow states
ALTER TABLE daily_plans DROP CONSTRAINT IF EXISTS daily_plans_status_check;
ALTER TABLE daily_plans ADD CONSTRAINT daily_plans_status_check 
CHECK (status IN (
    'pending',
    'dispatcher_complete',
    'awaiting_confirmation', 
    'inventory_analyzing',
    'inventory_complete',
    'hardware_store_added',
    'ready_for_execution',
    'approved',
    'cancelled',
    'error'
));

-- Update daily_plans table current_step enum to match new workflow
ALTER TABLE daily_plans DROP CONSTRAINT IF EXISTS daily_plans_current_step_check;
ALTER TABLE daily_plans ADD CONSTRAINT daily_plans_current_step_check 
CHECK (current_step IN (
    'dispatcher',
    'confirmation',
    'inventory',
    'complete'
));

-- Rename dispatch_output to dispatcher_output for clarity
ALTER TABLE daily_plans RENAME COLUMN dispatch_output TO dispatcher_output;

-- Remove route_output column (no longer needed in new workflow)
ALTER TABLE daily_plans DROP COLUMN IF EXISTS route_output;

-- Add comment explaining the new workflow
COMMENT ON TABLE daily_plans IS 'Daily planning workflow with 2-step process: 1) Dispatcher (job prioritization + routing), 2) Inventory (parts analysis + hardware store jobs)';

-- Update job_locations table to support hardware_store job type
ALTER TABLE job_locations DROP CONSTRAINT IF EXISTS job_locations_job_type_check;
ALTER TABLE job_locations ADD CONSTRAINT job_locations_job_type_check 
CHECK (job_type IN (
    'delivery',
    'pickup', 
    'service',
    'inspection',
    'maintenance',
    'emergency',
    'hardware_store'
));

-- Add index for hardware store jobs for quick filtering
CREATE INDEX IF NOT EXISTS idx_job_locations_hardware_store 
ON job_locations(user_id, job_type, scheduled_start) 
WHERE job_type = 'hardware_store';

-- Add index for daily_plans status for quick filtering
CREATE INDEX IF NOT EXISTS idx_daily_plans_status_step 
ON daily_plans(user_id, status, current_step, planned_date);

-- Add comments for documentation
COMMENT ON COLUMN daily_plans.dispatcher_output IS 'JSON output from dispatcher edge function containing job prioritization and routing';
COMMENT ON COLUMN daily_plans.inventory_output IS 'JSON output from inventory edge function containing parts analysis and hardware store job creation';
COMMENT ON COLUMN daily_plans.status IS 'Current status of the daily plan workflow: pending -> dispatcher_complete -> awaiting_confirmation -> inventory_analyzing -> (inventory_complete|hardware_store_added|ready_for_execution) -> approved';
COMMENT ON COLUMN daily_plans.current_step IS 'Current step in the workflow: dispatcher -> confirmation -> inventory -> complete';

-- Update any existing records to use new status values (if any exist)
-- This is a safe migration as the new statuses are similar to old ones
UPDATE daily_plans 
SET status = 'dispatcher_complete' 
WHERE status = 'dispatch_complete';

UPDATE daily_plans 
SET status = 'ready_for_execution' 
WHERE status = 'inventory_complete';

UPDATE daily_plans 
SET current_step = 'dispatcher' 
WHERE current_step = 'dispatch';

-- Add sample hardware store job for testing (optional)
INSERT INTO job_locations (
    id,
    user_id,
    title,
    description,
    address,
    latitude,
    longitude,
    job_type,
    status,
    priority,
    scheduled_start,
    scheduled_end,
    estimated_duration,
    metadata,
    created_at,
    updated_at
) VALUES (
    'hardware_store_sample_' || gen_random_uuid(),
    (SELECT id FROM profiles LIMIT 1), -- Use first user for testing
    'Hardware Store Stop - Sample',
    'Pick up critical parts needed for today''s jobs',
    '1200 Harrison St, San Francisco, CA 94103',
    37.7749,
    -122.4114,
    'hardware_store',
    'scheduled',
    'high',
    CURRENT_DATE || ' 08:00:00+00',
    CURRENT_DATE || ' 08:45:00+00',
    45,
    '{"shopping_list": [{"item_name": "Pipe fitting", "quantity": 2, "cost": 15.99}], "preferred_supplier": "lowes", "created_by_agent": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

COMMIT; 