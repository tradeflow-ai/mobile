-- Migration 001: Add Daily Plans Table for AI Agent Workflow
-- Run this migration in your Supabase SQL Editor to add the daily_plans table

-- =====================================================
-- 1. ADD DAILY PLANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Workflow state tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dispatch_complete', 'route_complete', 'inventory_complete', 'approved', 'cancelled', 'error')),
  current_step TEXT DEFAULT 'dispatch' CHECK (current_step IN ('dispatch', 'route', 'inventory', 'complete')),
  
  -- Agent outputs (JSONB for flexibility)
  dispatch_output JSONB DEFAULT '{}', -- Prioritized job list from Dispatch Strategist
  route_output JSONB DEFAULT '{}', -- Optimized route data from Route Optimizer
  inventory_output JSONB DEFAULT '{}', -- Parts manifest and shopping list from Inventory Specialist
  
  -- Human-in-the-loop modifications
  user_modifications JSONB DEFAULT '{}', -- Any user changes to AI suggestions
  
  -- Context and preferences snapshot
  preferences_snapshot JSONB DEFAULT '{}', -- User preferences at time of planning
  job_ids UUID[] DEFAULT '{}', -- Array of original job_location IDs for this plan
  created_job_ids UUID[] DEFAULT '{}', -- Array of job_location IDs created during workflow (e.g., hardware store runs)
  
  -- Error handling
  error_state JSONB DEFAULT '{}', -- Any agent execution errors
  retry_count INTEGER DEFAULT 0, -- Number of retry attempts
  
  -- Planning metadata
  planned_date DATE NOT NULL,
  total_estimated_duration INTEGER, -- Total estimated time in minutes
  total_distance DECIMAL(10, 2), -- Total distance in kilometers
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. ADD TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Apply the existing update trigger to daily_plans table
CREATE TRIGGER update_daily_plans_updated_at 
  BEFORE UPDATE ON public.daily_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

-- Daily plans policies
CREATE POLICY "Users can view own daily plans" ON public.daily_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily plans" ON public.daily_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily plans" ON public.daily_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily plans" ON public.daily_plans
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. ADD PERFORMANCE INDEXES
-- =====================================================

-- User-based index for fast filtering
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_id ON public.daily_plans(user_id);

-- Date indexes for scheduling
CREATE INDEX IF NOT EXISTS idx_daily_plans_planned_date ON public.daily_plans(planned_date);

-- Daily plans specific indexes
CREATE INDEX IF NOT EXISTS idx_daily_plans_status ON public.daily_plans(status);
CREATE INDEX IF NOT EXISTS idx_daily_plans_current_step ON public.daily_plans(current_step);
CREATE INDEX IF NOT EXISTS idx_daily_plans_status_user_id ON public.daily_plans(status, user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_planned_date_user_id ON public.daily_plans(planned_date, user_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify the migration worked
SELECT 'Daily plans table created successfully' as migration_status;

-- Optional: Check table structure
-- \d public.daily_plans; 
