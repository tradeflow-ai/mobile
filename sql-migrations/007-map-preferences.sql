-- =============================================
-- MAP INTEGRATION PREFERENCES MIGRATION
-- =============================================

-- This migration creates the map integration system with:
-- 1. supported_map_apps - Registry of supported map applications
-- 2. map_app_deep_links - Deep link configurations for each app/platform
-- 3. user_map_preferences - User preferences for map applications

-- Create supported_map_apps table
CREATE TABLE IF NOT EXISTS public.supported_map_apps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- App Identity
  app_name TEXT NOT NULL UNIQUE, -- Internal identifier (e.g., 'apple-maps', 'google-maps')
  app_display_name TEXT NOT NULL, -- User-friendly name (e.g., 'Apple Maps', 'Google Maps')
  app_description TEXT,
  
  -- Platform Support
  ios_supported BOOLEAN DEFAULT FALSE,
  android_supported BOOLEAN DEFAULT FALSE,
  web_supported BOOLEAN DEFAULT FALSE,
  
  -- Platform-specific Identifiers
  ios_bundle_id TEXT, -- e.g., 'com.apple.Maps'
  android_package_name TEXT, -- e.g., 'com.google.android.apps.maps'
  ios_app_store_id TEXT, -- App Store ID for installation links
  google_play_store_id TEXT, -- Play Store ID for installation links
  
  -- Features Support
  supports_directions BOOLEAN DEFAULT TRUE,
  supports_search BOOLEAN DEFAULT FALSE,
  supports_coordinates BOOLEAN DEFAULT TRUE,
  supports_waypoints BOOLEAN DEFAULT FALSE,
  
  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 100,
  popularity_score INTEGER DEFAULT 50, -- 0-100, higher = more popular
  
  -- Visual
  icon_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create map_app_deep_links table
CREATE TABLE IF NOT EXISTS public.map_app_deep_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  map_app_id UUID REFERENCES public.supported_map_apps(id) ON DELETE CASCADE UNIQUE,
  
  -- Platform-specific deep link templates
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  
  -- Deep Link Templates (support {latitude}, {longitude}, {coordinates}, {label}, etc.)
  directions_url_template TEXT, -- For navigation/directions
  search_url_template TEXT, -- For location search
  coordinate_url_template TEXT, -- For coordinate-based navigation
  address_url_template TEXT, -- For address-based navigation
  
  -- Platform-specific schemes
  ios_url_scheme TEXT, -- e.g., 'maps://'
  android_intent_action TEXT, -- e.g., 'android.intent.action.VIEW'
  
  -- Configuration
  is_default_for_platform BOOLEAN DEFAULT FALSE,
  supports_app_detection BOOLEAN DEFAULT TRUE,
  fallback_to_web BOOLEAN DEFAULT TRUE,
  
  -- Testing
  is_active BOOLEAN DEFAULT TRUE,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT CHECK (test_status IN ('untested', 'passing', 'failing')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_map_preferences table
CREATE TABLE IF NOT EXISTS public.user_map_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Primary map app preferences
  preferred_map_app_id UUID REFERENCES public.supported_map_apps(id),
  
  -- Platform-specific preferences
  ios_preferred_app_id UUID REFERENCES public.supported_map_apps(id),
  android_preferred_app_id UUID REFERENCES public.supported_map_apps(id),
  web_preferred_app_id UUID REFERENCES public.supported_map_apps(id),
  
  -- Fallback options (ordered by preference)
  fallback_map_apps UUID[], -- Array of map app IDs
  
  -- Behavior preferences
  auto_open_directions BOOLEAN DEFAULT TRUE,
  prompt_before_opening BOOLEAN DEFAULT FALSE,
  remember_choice BOOLEAN DEFAULT TRUE,
  prefer_navigation_for_long_routes BOOLEAN DEFAULT TRUE,
  long_route_threshold_miles DECIMAL(5,2) DEFAULT 5.0,
  
  -- Privacy settings
  allow_usage_analytics BOOLEAN DEFAULT TRUE,
  allow_performance_tracking BOOLEAN DEFAULT FALSE,
  
  -- Usage tracking
  last_used_app_id UUID REFERENCES public.supported_map_apps(id),
  total_usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS for all tables
ALTER TABLE public.supported_map_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_app_deep_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_map_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access for supported_map_apps (configuration data)
CREATE POLICY "Public read access for supported map apps" ON public.supported_map_apps
  FOR SELECT TO authenticated
  USING (true);

-- Public read access for map_app_deep_links (configuration data)
CREATE POLICY "Public read access for map app deep links" ON public.map_app_deep_links
  FOR SELECT TO authenticated
  USING (true);

-- User can view and manage their own map preferences
CREATE POLICY "Users can view own map preferences" ON public.user_map_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own map preferences" ON public.user_map_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own map preferences" ON public.user_map_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own map preferences" ON public.user_map_preferences
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for supported_map_apps
CREATE INDEX IF NOT EXISTS idx_supported_apps_active ON public.supported_map_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_supported_apps_platform_ios ON public.supported_map_apps(ios_supported) WHERE ios_supported = true;
CREATE INDEX IF NOT EXISTS idx_supported_apps_platform_android ON public.supported_map_apps(android_supported) WHERE android_supported = true;
CREATE INDEX IF NOT EXISTS idx_supported_apps_platform_web ON public.supported_map_apps(web_supported) WHERE web_supported = true;
CREATE INDEX IF NOT EXISTS idx_supported_apps_popularity ON public.supported_map_apps(popularity_score DESC);

-- Indexes for map_app_deep_links
CREATE INDEX IF NOT EXISTS idx_deep_links_map_app_id ON public.map_app_deep_links(map_app_id);
CREATE INDEX IF NOT EXISTS idx_deep_links_platform ON public.map_app_deep_links(platform);
CREATE INDEX IF NOT EXISTS idx_deep_links_active ON public.map_app_deep_links(is_active);
CREATE INDEX IF NOT EXISTS idx_deep_links_default_platform ON public.map_app_deep_links(platform, is_default_for_platform) WHERE is_default_for_platform = true;

-- Indexes for user_map_preferences
CREATE INDEX IF NOT EXISTS idx_user_map_prefs_user_id ON public.user_map_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_map_prefs_preferred_app ON public.user_map_preferences(preferred_map_app_id);
CREATE INDEX IF NOT EXISTS idx_user_map_prefs_ios_app ON public.user_map_preferences(ios_preferred_app_id);
CREATE INDEX IF NOT EXISTS idx_user_map_prefs_android_app ON public.user_map_preferences(android_preferred_app_id);
CREATE INDEX IF NOT EXISTS idx_user_map_prefs_web_app ON public.user_map_preferences(web_preferred_app_id);
CREATE INDEX IF NOT EXISTS idx_user_map_prefs_last_used ON public.user_map_preferences(last_used_app_id);

-- =============================================
-- SEED DATA FOR SUPPORTED MAP APPS
-- =============================================

-- Insert popular map applications
INSERT INTO public.supported_map_apps (
  app_name, app_display_name, app_description,
  ios_supported, android_supported, web_supported,
  ios_bundle_id, android_package_name,
  supports_directions, supports_search, supports_coordinates, supports_waypoints,
  popularity_score, sort_order
) VALUES 
-- Apple Maps (iOS default)
('apple-maps', 'Apple Maps', 'Apple''s built-in mapping service', 
 true, false, false,
 'com.apple.Maps', null,
 true, true, true, true,
 95, 1),

-- Google Maps (Most popular cross-platform)
('google-maps', 'Google Maps', 'Google''s comprehensive mapping service',
 true, true, true,
 'com.google.Maps', 'com.google.android.apps.maps',
 true, true, true, true,
 98, 2),

-- Waze (Popular for navigation)
('waze', 'Waze', 'Community-driven navigation app',
 true, true, false,
 'com.waze.iphone', 'com.waze',
 true, false, true, false,
 85, 3),

-- MapQuest (Alternative option)
('mapquest', 'MapQuest', 'Classic mapping service',
 true, true, true,
 'com.mapquest.mapquest', 'com.mapquest.android',
 true, true, true, false,
 60, 4),

-- HERE WeGo (Offline-capable)
('here-maps', 'HERE WeGo', 'HERE mapping with offline support',
 true, true, true,
 'com.here.Here', 'com.here.app.maps',
 true, true, true, false,
 70, 5)

ON CONFLICT (app_name) DO NOTHING;

-- =============================================
-- SEED DATA FOR DEEP LINKS
-- =============================================

-- iOS Deep Links
INSERT INTO public.map_app_deep_links (
  map_app_id, platform,
  directions_url_template, coordinate_url_template, search_url_template,
  ios_url_scheme, is_default_for_platform, is_active
) VALUES 
-- Apple Maps iOS
((SELECT id FROM public.supported_map_apps WHERE app_name = 'apple-maps'), 'ios',
 'maps://?daddr={latitude},{longitude}&t=m',
 'maps://?ll={latitude},{longitude}&t=m',
 'maps://?q={label}',
 'maps://', true, true),

-- Google Maps iOS  
((SELECT id FROM public.supported_map_apps WHERE app_name = 'google-maps'), 'ios',
 'comgooglemaps://?daddr={latitude},{longitude}&directionsmode=driving',
 'comgooglemaps://?center={latitude},{longitude}&zoom=15',
 'comgooglemaps://?q={label}',
 'comgooglemaps://', false, true),

-- Waze iOS
((SELECT id FROM public.supported_map_apps WHERE app_name = 'waze'), 'ios',
 'waze://?ll={latitude},{longitude}&navigate=yes',
 'waze://?ll={latitude},{longitude}',
 null,
 'waze://', false, true)

ON CONFLICT (map_app_id) DO NOTHING;

-- Android Deep Links  
INSERT INTO public.map_app_deep_links (
  map_app_id, platform,
  directions_url_template, coordinate_url_template, search_url_template,
  android_intent_action, is_default_for_platform, is_active
) VALUES
-- Google Maps Android (default)
((SELECT id FROM public.supported_map_apps WHERE app_name = 'google-maps'), 'android',
 'google.navigation:q={latitude},{longitude}&mode=d',
 'geo:{latitude},{longitude}?z=15',
 'geo:0,0?q={label}',
 'android.intent.action.VIEW', true, true),

-- Waze Android
((SELECT id FROM public.supported_map_apps WHERE app_name = 'waze'), 'android',
 'waze://?ll={latitude},{longitude}&navigate=yes',
 'waze://?ll={latitude},{longitude}',
 null,
 'android.intent.action.VIEW', false, true)

ON CONFLICT (map_app_id) DO NOTHING;

-- Web Deep Links
INSERT INTO public.map_app_deep_links (
  map_app_id, platform,
  directions_url_template, coordinate_url_template, search_url_template,
  is_default_for_platform, is_active
) VALUES
-- Google Maps Web (default)
((SELECT id FROM public.supported_map_apps WHERE app_name = 'google-maps'), 'web',
 'https://www.google.com/maps/dir/?api=1&destination={latitude},{longitude}',
 'https://www.google.com/maps?q={latitude},{longitude}',
 'https://www.google.com/maps/search/{label}',
 true, true),

-- MapQuest Web
((SELECT id FROM public.supported_map_apps WHERE app_name = 'mapquest'), 'web',
 'https://www.mapquest.com/directions/to/{latitude},{longitude}',
 'https://www.mapquest.com/latlng/{latitude},{longitude}',
 'https://www.mapquest.com/search/{label}',
 false, true)

ON CONFLICT (map_app_id) DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Map integration migration completed successfully!';
  RAISE NOTICE 'Tables created: supported_map_apps, map_app_deep_links, user_map_preferences';
  RAISE NOTICE 'Seeded % map apps with deep link configurations', (SELECT COUNT(*) FROM public.supported_map_apps);
  RAISE NOTICE 'Ready for map integration service initialization';
END $$; 