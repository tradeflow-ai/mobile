-- =====================================================
-- ONBOARDING CONFIGURATION MIGRATION
-- =====================================================

-- This migration creates the onboarding system with:
-- 1. onboarding_preferences - User preferences storage
-- 2. onboarding_configurations - Admin configurations

-- =====================================================
-- 1. ADD ONBOARDING PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.onboarding_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Progress Tracking
  current_step TEXT DEFAULT 'work-schedule',
  is_completed BOOLEAN DEFAULT FALSE,
  completion_score INTEGER DEFAULT 0, -- 0-100 score based on completion
  
  -- Preferences Data (Store all user selections)
  work_schedule JSONB DEFAULT '{}',
  time_buffers JSONB DEFAULT '{}', 
  suppliers JSONB DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- =====================================================
-- 2. ADD ONBOARDING CONFIGURATIONS TABLE
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
-- 3. ADD TRIGGERS FOR UPDATED_AT
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
-- 4. ENABLE ROW LEVEL SECURITY
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
-- 5. ADD PERFORMANCE INDEXES
-- =====================================================

-- Onboarding preferences indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_user_id ON public.onboarding_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_is_completed ON public.onboarding_preferences(is_completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_current_step ON public.onboarding_preferences(current_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_preferences_completion_score ON public.onboarding_preferences(completion_score);

-- Onboarding configurations indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_configurations_config_name ON public.onboarding_configurations(config_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_configurations_is_active ON public.onboarding_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_onboarding_configurations_config_version ON public.onboarding_configurations(config_version);

-- =====================================================
-- 6. INSERT DEFAULT CONFIGURATION
-- =====================================================

INSERT INTO public.onboarding_configurations (config_name, step_definitions, flow_configuration, feature_flags) 
VALUES (
  'default',
  '{
    "work-schedule": {
      "title": "Work Schedule",
      "description": "Set your work preferences and schedule",
      "required": true,
      "order": 1,
      "fields": {
        "start_time": {"type": "time", "required": true, "default": "09:00"},
        "end_time": {"type": "time", "required": true, "default": "17:00"},
        "lunch_break": {"type": "boolean", "default": true},
        "break_duration": {"type": "number", "required": false, "default": 30}
      }
    },
    "time-buffers": {
      "title": "Time Buffers",
      "description": "Configure buffer times for travel and setup",
      "required": true,
      "order": 2,
      "fields": {
        "default_buffer_minutes": {"type": "number", "required": true, "default": 15},
        "traffic_multiplier": {"type": "number", "required": false, "default": 1.2},
        "weather_multiplier": {"type": "number", "required": false, "default": 1.1}
      }
    },
    "suppliers": {
      "title": "Supplier Preferences",
      "description": "Choose your preferred suppliers and priorities",
      "required": true,
      "order": 3,
      "fields": {
        "preferred_suppliers": {"type": "array", "required": false},
        "backup_suppliers": {"type": "array", "required": false},
        "price_priority": {"type": "number", "required": false, "default": 50},
        "distance_priority": {"type": "number", "required": false, "default": 30},
        "reliability_priority": {"type": "number", "required": false, "default": 20}
      }
    }
  }',
  '{
    "completion_threshold": 75,
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
    "supplier_priority": false,
    "auto_schedule_optimization": true
  }'
) ON CONFLICT (config_name) DO NOTHING;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
-- \dt public.onboarding_preferences;
-- \dt public.onboarding_configurations;

-- Verify default data
-- SELECT config_name, is_active FROM public.onboarding_configurations; 