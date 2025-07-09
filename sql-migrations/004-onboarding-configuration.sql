-- Migration 004: Add Onboarding Configuration System Tables
-- Run this migration in your Supabase SQL Editor to add onboarding tracking and configuration tables

-- =====================================================
-- 1. ADD ONBOARDING PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.onboarding_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Completion Status
  is_completed BOOLEAN DEFAULT FALSE,
  completion_score INTEGER DEFAULT 0, -- 0-100 percentage
  current_step TEXT DEFAULT 'work-schedule' CHECK (current_step IN ('work-schedule', 'time-buffers', 'suppliers', 'completed')),
  steps_completed TEXT[] DEFAULT '{}',
  
  -- Work Schedule Step Data
  work_schedule_data JSONB DEFAULT '{}',
  work_schedule_completed BOOLEAN DEFAULT FALSE,
  work_schedule_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Time Buffers Step Data
  time_buffers_data JSONB DEFAULT '{}',
  time_buffers_completed BOOLEAN DEFAULT FALSE,
  time_buffers_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Suppliers Step Data
  suppliers_data JSONB DEFAULT '{}',
  suppliers_completed BOOLEAN DEFAULT FALSE,
  suppliers_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Configuration
  onboarding_version TEXT DEFAULT '1.0',
  skip_reasons JSONB DEFAULT '{}', -- reasons for skipping steps
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- =====================================================
-- 2. ADD ONBOARDING ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.onboarding_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Event Tracking
  event_type TEXT NOT NULL CHECK (event_type IN (
    'onboarding_started', 'step_started', 'step_completed', 'step_skipped', 
    'onboarding_completed', 'onboarding_abandoned'
  )),
  step_name TEXT CHECK (step_name IN ('work-schedule', 'time-buffers', 'suppliers')),
  
  -- Timing Data
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_seconds INTEGER, -- time spent on step
  
  -- Context Data
  user_agent TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  onboarding_version TEXT DEFAULT '1.0',
  
  -- Step-specific Data
  form_data JSONB DEFAULT '{}', -- form data at time of event
  validation_errors JSONB DEFAULT '{}', -- validation errors encountered
  
  -- Session Data
  session_id TEXT, -- track user session
  previous_step TEXT,
  next_step TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ADD ONBOARDING CONFIGURATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.onboarding_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Configuration Identity
  config_name TEXT NOT NULL UNIQUE,
  config_version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Step Configuration
  step_definitions JSONB NOT NULL DEFAULT '{}',
  -- Example structure:
  -- {
  --   "work-schedule": {
  --     "title": "Work Schedule",
  --     "description": "Set your work preferences",
  --     "required": true,
  --     "order": 1,
  --     "validation_schema": {...},
  --     "default_values": {...}
  --   },
  --   "time-buffers": {
  --     "title": "Time Buffers",
  --     "description": "Configure buffer times",
  --     "required": true,
  --     "order": 2,
  --     "validation_schema": {...},
  --     "default_values": {...}
  --   },
  --   "suppliers": {
  --     "title": "Supplier Preferences",
  --     "description": "Choose your preferred suppliers",
  --     "required": true,
  --     "order": 3,
  --     "validation_schema": {...},
  --     "default_values": {...}
  --   }
  -- }
  
  -- Flow Configuration
  flow_configuration JSONB NOT NULL DEFAULT '{}',
  -- Example structure:
  -- {
  --   "completion_threshold": 75,
  --   "allow_skip": true,
  --   "redirect_on_completion": "/(tabs)",
  --   "save_partial_progress": true,
  --   "scoring": {
  --     "work-schedule": 40,
  --     "time-buffers": 30,
  --     "suppliers": 30,
  --     "bonus": 10
  --   }
  -- }
  
  -- Feature Flags
  feature_flags JSONB DEFAULT '{}',
  -- Example: { "smart_buffers": true, "supplier_priority": false }
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ADD TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Apply the existing update trigger to onboarding_preferences table
CREATE TRIGGER update_onboarding_preferences_updated_at 
  BEFORE UPDATE ON public.onboarding_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply the existing update trigger to onboarding_configurations table
CREATE TRIGGER update_onboarding_configurations_updated_at 
  BEFORE UPDATE ON public.onboarding_configurations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS for onboarding_preferences
ALTER TABLE public.onboarding_preferences ENABLE ROW LEVEL SECURITY;

-- Onboarding preferences policies
CREATE POLICY "Users can view own onboarding preferences" ON public.onboarding_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding preferences" ON public.onboarding_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding preferences" ON public.onboarding_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own onboarding preferences" ON public.onboarding_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for onboarding_analytics
ALTER TABLE public.onboarding_analytics ENABLE ROW LEVEL SECURITY;

-- Onboarding analytics policies
CREATE POLICY "Users can view own onboarding analytics" ON public.onboarding_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding analytics" ON public.onboarding_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE/DELETE policies for analytics - they should be append-only

-- Enable RLS for onboarding_configurations
ALTER TABLE public.onboarding_configurations ENABLE ROW LEVEL SECURITY;

-- Onboarding configurations policies (admin-only access)
CREATE POLICY "Allow read access to onboarding configurations" ON public.onboarding_configurations
  FOR SELECT USING (true); -- All authenticated users can read configurations

-- Admin-only write access (will be updated when admin roles are implemented)
CREATE POLICY "Allow admin to manage onboarding configurations" ON public.onboarding_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 6. ADD PERFORMANCE INDEXES
-- =====================================================

-- Onboarding preferences indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_user_id ON public.onboarding_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_is_completed ON public.onboarding_preferences(is_completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_current_step ON public.onboarding_preferences(current_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_completion_score ON public.onboarding_preferences(completion_score);

-- Onboarding analytics indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_user_id ON public.onboarding_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_event_type ON public.onboarding_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_step_name ON public.onboarding_analytics(step_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_event_timestamp ON public.onboarding_analytics(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_session_id ON public.onboarding_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_platform ON public.onboarding_analytics(platform);

-- Compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_user_event_time ON public.onboarding_analytics(user_id, event_type, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_step_event_time ON public.onboarding_analytics(step_name, event_type, event_timestamp);

-- Onboarding configurations indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_configurations_config_name ON public.onboarding_configurations(config_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_configurations_is_active ON public.onboarding_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_onboarding_configurations_config_version ON public.onboarding_configurations(config_version);

-- =====================================================
-- 7. INSERT DEFAULT CONFIGURATION
-- =====================================================

-- Insert default onboarding configuration
INSERT INTO public.onboarding_configurations (
  config_name,
  config_version,
  is_active,
  step_definitions,
  flow_configuration,
  feature_flags
) VALUES (
  'default',
  '1.0',
  true,
  '{
    "work-schedule": {
      "title": "Work Schedule",
      "description": "When do you work?",
      "required": true,
      "order": 1,
      "points": 40,
      "default_values": {
        "workDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "startTime": "8:00 AM",
        "endTime": "5:00 PM",
        "hasBreak": true,
        "breakStartTime": "12:00 PM",
        "breakEndTime": "1:00 PM"
      }
    },
    "time-buffers": {
      "title": "Time Buffers",
      "description": "Add buffer time to your schedule",
      "required": true,
      "order": 2,
      "points": 30,
      "default_values": {
        "travelBufferMinutes": 15,
        "jobBufferMinutes": 15,
        "enableSmartBuffers": true
      }
    },
    "suppliers": {
      "title": "Supplier Preferences",
      "description": "Choose your preferred suppliers",
      "required": true,
      "order": 3,
      "points": 30,
      "default_values": {
        "preferredSuppliers": ["home-depot"],
        "priorityOrder": [
          {"id": "price", "label": "Price", "priority": 1},
          {"id": "location", "label": "Location", "priority": 2},
          {"id": "stock", "label": "Stock Availability", "priority": 3}
        ]
      }
    }
  }',
  '{
    "completion_threshold": 70,
    "allow_skip": true,
    "redirect_on_completion": "/(tabs)",
    "save_partial_progress": true,
    "scoring": {
      "work-schedule": 40,
      "time-buffers": 30,
      "suppliers": 30,
      "bonus": 10
    }
  }',
  '{
    "smart_buffers": true,
    "supplier_priority": true,
    "skip_confirmation": false
  }'
) ON CONFLICT (config_name) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify the migration worked
SELECT 'Onboarding configuration system tables created successfully' as migration_status;

-- Optional: Check table structures
-- \d public.onboarding_preferences;
-- \d public.onboarding_analytics;
-- \d public.onboarding_configurations; 