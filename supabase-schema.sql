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
-- 3. INVENTORY ITEMS TABLE
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
-- 4. JOB LOCATIONS TABLE
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
  
  -- Contact information
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
-- 5. ROUTES TABLE
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
-- 6. INVENTORY MOVEMENTS TABLE (for tracking changes)
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
-- 7. TRIGGERS FOR UPDATED_AT
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

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- User-based indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON public.inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_job_locations_user_id ON public.job_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON public.routes(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON public.inventory_movements(user_id);

-- Status and type indexes for filtering
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_job_locations_status ON public.job_locations(status);
CREATE INDEX IF NOT EXISTS idx_job_locations_type ON public.job_locations(job_type);
CREATE INDEX IF NOT EXISTS idx_job_locations_priority ON public.job_locations(priority);

-- Date indexes for scheduling
CREATE INDEX IF NOT EXISTS idx_job_locations_scheduled_date ON public.job_locations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_routes_planned_date ON public.routes(planned_date);

-- Location indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_job_locations_lat_lng ON public.job_locations(latitude, longitude);

-- =====================================================
-- 10. FUNCTIONS FOR AUTOMATIC PROFILE CREATION
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