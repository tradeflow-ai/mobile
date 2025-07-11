-- TradeFlow Database Schema Setup
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location data (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- 2. USER PROFILES TABLE
-- =====================================================

-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  company_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- =====================================================
-- 4. INVENTORY ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'each',
  category TEXT,
  location_name TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock', 'discontinued')),
  min_quantity INTEGER DEFAULT 0,
  max_quantity INTEGER,
  cost_per_unit DECIMAL(10, 2),
  supplier TEXT,
  supplier_part_number TEXT,
  barcode TEXT,
  image_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. JOB LOCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  job_type TEXT NOT NULL CHECK (job_type IN ('delivery', 'pickup', 'service', 'inspection', 'maintenance', 'emergency')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  
  -- Location data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Scheduling
  scheduled_date TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER DEFAULT 60, -- minutes
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  
  -- Contact information (legacy fields - use client_id instead)
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Job details
  instructions TEXT,
  required_items UUID[] DEFAULT '{}', -- references to inventory_items
  completion_notes TEXT,
  completion_photos TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ROUTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  
  -- Route optimization data
  job_location_ids UUID[] NOT NULL, -- ordered array of job_location IDs
  optimized_order UUID[], -- optimized order of job_location IDs
  total_distance DECIMAL(10, 2), -- in kilometers
  estimated_time INTEGER, -- in minutes
  
  -- Scheduling
  planned_date DATE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. INVENTORY MOVEMENTS TABLE (for tracking changes)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment', 'transfer', 'job_used')),
  quantity_change INTEGER NOT NULL, -- positive for additions, negative for subtractions
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  job_location_id UUID REFERENCES public.job_locations(id), -- if related to a job
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================

-- 8. JOB TYPES TABLE (Bill of Materials - Job Definitions)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'plumbing', 'electrical', 'hvac', 'general', etc.
  estimated_duration INTEGER DEFAULT 60, -- minutes
  default_priority TEXT DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
  labor_rate DECIMAL(10, 2), -- hourly rate for this type of work
  markup_percentage DECIMAL(5, 2) DEFAULT 0.15, -- 15% default markup on parts
  instructions TEXT, -- standardized work instructions
  safety_notes TEXT, -- safety considerations for this job type
  required_certifications TEXT[], -- certifications needed
  is_active BOOLEAN DEFAULT TRUE,
  is_template BOOLEAN DEFAULT FALSE, -- true for system templates, false for user custom
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique job type names per user
  UNIQUE(user_id, name)
);

-- =====================================================
-- 9. PART TEMPLATES TABLE (Bill of Materials - Parts Catalog)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.part_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  part_number TEXT,
  category TEXT, -- matches inventory categories
  unit TEXT DEFAULT 'each',
  estimated_cost DECIMAL(10, 2),
  preferred_supplier TEXT,
  specifications TEXT, -- technical specs, dimensions, etc.
  notes TEXT,
  is_common BOOLEAN DEFAULT FALSE, -- frequently used parts
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique part names per user
  UNIQUE(user_id, name)
);

-- =====================================================
-- 10. JOB TYPE PARTS TABLE (Bill of Materials - Join Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_type_parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_type_id UUID REFERENCES public.job_types(id) ON DELETE CASCADE NOT NULL,
  part_template_id UUID REFERENCES public.part_templates(id) ON DELETE CASCADE NOT NULL,
  quantity_needed DECIMAL(10, 2) NOT NULL DEFAULT 1.0, -- can be fractional (e.g., 2.5 feet)
  is_required BOOLEAN DEFAULT TRUE, -- required vs optional parts
  notes TEXT, -- specific usage notes for this job type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique part per job type
  UNIQUE(job_type_id, part_template_id)
);

-- =====================================================
-- 11. TRIGGERS FOR UPDATED_AT

-- 7. DAILY PLANS TABLE (for AI agent workflow state)
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
-- 8. TRIGGERS FOR UPDATED_AT

-- =====================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



CREATE TRIGGER update_inventory_items_updated_at 
  BEFORE UPDATE ON public.inventory_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_locations_updated_at 
  BEFORE UPDATE ON public.job_locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at 
  BEFORE UPDATE ON public.routes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_job_types_updated_at 
  BEFORE UPDATE ON public.job_types 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_part_templates_updated_at 
  BEFORE UPDATE ON public.part_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES

CREATE TRIGGER update_daily_plans_updated_at 
  BEFORE UPDATE ON public.daily_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES

-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_type_parts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;


-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);



-- Inventory items policies
CREATE POLICY "Users can view own inventory" ON public.inventory_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" ON public.inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON public.inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory" ON public.inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- Job locations policies
CREATE POLICY "Users can view own jobs" ON public.job_locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.job_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.job_locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON public.job_locations
  FOR DELETE USING (auth.uid() = user_id);

-- Routes policies
CREATE POLICY "Users can view own routes" ON public.routes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routes" ON public.routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routes" ON public.routes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routes" ON public.routes
  FOR DELETE USING (auth.uid() = user_id);

-- Inventory movements policies
CREATE POLICY "Users can view own movements" ON public.inventory_movements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movements" ON public.inventory_movements
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Job types policies
CREATE POLICY "Users can view own job types" ON public.job_types
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job types" ON public.job_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job types" ON public.job_types
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job types" ON public.job_types
  FOR DELETE USING (auth.uid() = user_id);

-- Part templates policies
CREATE POLICY "Users can view own part templates" ON public.part_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own part templates" ON public.part_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own part templates" ON public.part_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own part templates" ON public.part_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Job type parts policies (Bill of Materials)
CREATE POLICY "Users can view own job type parts" ON public.job_type_parts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job type parts" ON public.job_type_parts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job type parts" ON public.job_type_parts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job type parts" ON public.job_type_parts
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 13. INDEXES FOR PERFORMANCE

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
-- 10. INDEXES FOR PERFORMANCE

-- =====================================================

-- User-based indexes for fast filtering

CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_job_locations_user_id ON public.job_locations(user_id);

CREATE INDEX IF NOT EXISTS idx_routes_user_id ON public.routes(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON public.inventory_movements(user_id);

CREATE INDEX IF NOT EXISTS idx_job_types_user_id ON public.job_types(user_id);
CREATE INDEX IF NOT EXISTS idx_part_templates_user_id ON public.part_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_job_type_parts_user_id ON public.job_type_parts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_type_parts_job_type_id ON public.job_type_parts(job_type_id);
CREATE INDEX IF NOT EXISTS idx_job_type_parts_part_template_id ON public.job_type_parts(part_template_id);

CREATE INDEX IF NOT EXISTS idx_daily_plans_user_id ON public.daily_plans(user_id);


-- Status and type indexes for filtering

CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_job_locations_status ON public.job_locations(status);
CREATE INDEX IF NOT EXISTS idx_job_locations_type ON public.job_locations(job_type);
CREATE INDEX IF NOT EXISTS idx_job_locations_priority ON public.job_locations(priority);
CREATE INDEX IF NOT EXISTS idx_job_types_category ON public.job_types(category);
CREATE INDEX IF NOT EXISTS idx_job_types_is_active ON public.job_types(is_active);
CREATE INDEX IF NOT EXISTS idx_job_types_is_template ON public.job_types(is_template);
CREATE INDEX IF NOT EXISTS idx_part_templates_category ON public.part_templates(category);
CREATE INDEX IF NOT EXISTS idx_part_templates_is_active ON public.part_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_part_templates_is_common ON public.part_templates(is_common);

-- Date indexes for scheduling
CREATE INDEX IF NOT EXISTS idx_job_locations_scheduled_date ON public.job_locations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_routes_planned_date ON public.routes(planned_date);
CREATE INDEX IF NOT EXISTS idx_daily_plans_planned_date ON public.daily_plans(planned_date);

-- Daily plans specific indexes
CREATE INDEX IF NOT EXISTS idx_daily_plans_status ON public.daily_plans(status);
CREATE INDEX IF NOT EXISTS idx_daily_plans_current_step ON public.daily_plans(current_step);
CREATE INDEX IF NOT EXISTS idx_daily_plans_status_user_id ON public.daily_plans(status, user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_planned_date_user_id ON public.daily_plans(planned_date, user_id);

-- Location indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_job_locations_lat_lng ON public.job_locations(latitude, longitude);

-- =====================================================

-- 14. FUNCTIONS FOR AUTOMATIC PROFILE CREATION

-- =====================================================

-- Function to create user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Insert some sample data for testing (optional)
-- This will be added after you've created your first user account 