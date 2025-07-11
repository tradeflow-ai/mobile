-- =============================================
-- Migration 007: Map Integration Preferences
-- =============================================
-- Description: User preferences for external map app integration and analytics
-- Author: Backend Architecture Team
-- Date: 2024-12-20
-- Dependencies: 005-onboarding-analytics-functions.sql

-- =============================================
-- SUPPORTED MAP APPS REFERENCE TABLE
-- =============================================

-- Reference table for supported external map applications
CREATE TABLE IF NOT EXISTS public.supported_map_apps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- App identification
  app_name TEXT NOT NULL UNIQUE,
  app_display_name TEXT NOT NULL,
  app_description TEXT,
  
  -- Platform availability
  ios_available BOOLEAN NOT NULL DEFAULT FALSE,
  android_available BOOLEAN NOT NULL DEFAULT FALSE,
  web_available BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- App store information
  ios_bundle_id TEXT, -- e.g., 'com.apple.Maps', 'com.google.Maps'
  android_package_name TEXT, -- e.g., 'com.google.android.apps.maps'
  web_url TEXT,
  
  -- Configuration
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  
  -- Features supported
  supports_directions BOOLEAN NOT NULL DEFAULT TRUE,
  supports_search BOOLEAN NOT NULL DEFAULT TRUE,
  supports_coordinates BOOLEAN NOT NULL DEFAULT TRUE,
  supports_address BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  icon_url TEXT,
  documentation_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MAP APP DEEP LINKS CONFIGURATION
-- =============================================

-- Configuration for app-specific deep link URL patterns
CREATE TABLE IF NOT EXISTS public.map_app_deep_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Links to supported app
  map_app_id UUID NOT NULL REFERENCES public.supported_map_apps(id) ON DELETE CASCADE,
  
  -- Deep link patterns
  directions_url_template TEXT NOT NULL,
  -- Example: 'https://maps.apple.com/?daddr={latitude},{longitude}&dirflg=d'
  
  search_url_template TEXT,
  -- Example: 'https://maps.apple.com/?q={query}&ll={latitude},{longitude}'
  
  coordinate_url_template TEXT,
  -- Example: 'https://maps.apple.com/?ll={latitude},{longitude}'
  
  address_url_template TEXT,
  -- Example: 'https://maps.apple.com/?address={address}'
  
  -- Platform-specific templates
  ios_url_scheme TEXT, -- e.g., 'maps://', 'comgooglemaps://'
  android_intent_action TEXT,
  
  -- Configuration
  is_default_for_platform TEXT CHECK (is_default_for_platform IN ('ios', 'android', 'web', NULL)),
  requires_app_detection BOOLEAN NOT NULL DEFAULT TRUE,
  fallback_to_web BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Validation and testing
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT CHECK (test_status IN ('passed', 'failed', 'pending', NULL)),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one configuration per app
  UNIQUE(map_app_id)
);

-- =============================================
-- USER MAP PREFERENCES
-- =============================================

-- Individual user preferences for map app integration
CREATE TABLE IF NOT EXISTS public.user_map_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Primary preference
  preferred_map_app_id UUID REFERENCES public.supported_map_apps(id) ON DELETE SET NULL,
  
  -- Fallback preferences (ordered by priority)
  fallback_map_apps UUID[] DEFAULT '{}', -- Array of map_app_ids
  
  -- Platform-specific preferences
  ios_preferred_app_id UUID REFERENCES public.supported_map_apps(id) ON DELETE SET NULL,
  android_preferred_app_id UUID REFERENCES public.supported_map_apps(id) ON DELETE SET NULL,
  web_preferred_app_id UUID REFERENCES public.supported_map_apps(id) ON DELETE SET NULL,
  
  -- Usage behavior preferences
  auto_open_directions BOOLEAN NOT NULL DEFAULT FALSE,
  prompt_before_opening BOOLEAN NOT NULL DEFAULT TRUE,
  remember_choice BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Context preferences
  prefer_navigation_for_long_routes BOOLEAN NOT NULL DEFAULT TRUE,
  long_route_threshold_miles DECIMAL(5,2) DEFAULT 5.0,
  prefer_search_for_addresses BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Integration settings
  enable_deep_linking BOOLEAN NOT NULL DEFAULT TRUE,
  enable_fallback_apps BOOLEAN NOT NULL DEFAULT TRUE,
  enable_web_fallback BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Analytics preferences
  allow_usage_analytics BOOLEAN NOT NULL DEFAULT TRUE,
  allow_performance_tracking BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Last usage tracking
  last_used_app_id UUID REFERENCES public.supported_map_apps(id) ON DELETE SET NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  total_usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  preferences_version TEXT DEFAULT '1.0',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  CONSTRAINT valid_route_threshold CHECK (long_route_threshold_miles > 0)
);

-- =============================================
-- MAP INTEGRATION ANALYTICS
-- =============================================

-- Analytics for map integration usage and performance
CREATE TABLE IF NOT EXISTS public.map_integration_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Event identification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'map_app_opened',
    'directions_requested',
    'search_performed',
    'app_detection_performed',
    'fallback_triggered',
    'preference_changed',
    'deep_link_failed',
    'web_fallback_used'
  )),
  
  -- App and platform context
  map_app_id UUID REFERENCES public.supported_map_apps(id) ON DELETE SET NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  user_agent TEXT,
  
  -- Request details
  request_type TEXT CHECK (request_type IN ('directions', 'search', 'coordinates', 'address')),
  source_screen TEXT, -- which screen triggered the map integration
  
  -- Location context
  origin_latitude DECIMAL(10, 8),
  origin_longitude DECIMAL(11, 8),
  destination_latitude DECIMAL(10, 8),
  destination_longitude DECIMAL(11, 8),
  search_query TEXT,
  
  -- Performance metrics
  detection_time_ms INTEGER CHECK (detection_time_ms >= 0),
  app_launch_time_ms INTEGER CHECK (app_launch_time_ms >= 0),
  total_interaction_time_ms INTEGER CHECK (total_interaction_time_ms >= 0),
  
  -- Success metrics
  app_detection_successful BOOLEAN,
  deep_link_successful BOOLEAN,
  user_completed_action BOOLEAN,
  returned_to_app BOOLEAN,
  
  -- Error tracking
  error_type TEXT,
  error_message TEXT,
  fallback_used BOOLEAN DEFAULT FALSE,
  fallback_app_id UUID REFERENCES public.supported_map_apps(id) ON DELETE SET NULL,
  
  -- Context data
  job_location_id UUID, -- Reference to job if applicable
  session_id TEXT,
  
  -- Timing
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Apply the existing update trigger to new tables
CREATE TRIGGER update_supported_map_apps_updated_at 
  BEFORE UPDATE ON public.supported_map_apps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_app_deep_links_updated_at 
  BEFORE UPDATE ON public.map_app_deep_links 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_map_preferences_updated_at 
  BEFORE UPDATE ON public.user_map_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS for user_map_preferences
ALTER TABLE public.user_map_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own map preferences" ON public.user_map_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own map preferences" ON public.user_map_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own map preferences" ON public.user_map_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own map preferences" ON public.user_map_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for map_integration_analytics
ALTER TABLE public.map_integration_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own map analytics" ON public.map_integration_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own map analytics" ON public.map_integration_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE/DELETE policies for analytics - they should be append-only

-- Enable RLS for reference tables (public read access)
ALTER TABLE public.supported_map_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_app_deep_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supported map apps" ON public.supported_map_apps
  FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can view map app deep links" ON public.map_app_deep_links
  FOR SELECT USING (TRUE);

-- Only authenticated users can modify reference tables (admin functionality)
CREATE POLICY "Authenticated users can modify supported map apps" ON public.supported_map_apps
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify map app deep links" ON public.map_app_deep_links
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User map preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_map_preferences_user_id ON public.user_map_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_map_preferences_preferred_app ON public.user_map_preferences(preferred_map_app_id);
CREATE INDEX IF NOT EXISTS idx_user_map_preferences_last_used ON public.user_map_preferences(last_used_app_id);
CREATE INDEX IF NOT EXISTS idx_user_map_preferences_platform_ios ON public.user_map_preferences(ios_preferred_app_id);
CREATE INDEX IF NOT EXISTS idx_user_map_preferences_platform_android ON public.user_map_preferences(android_preferred_app_id);

-- Map integration analytics indexes
CREATE INDEX IF NOT EXISTS idx_map_analytics_user_id ON public.map_integration_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_map_analytics_event_type ON public.map_integration_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_map_analytics_map_app_id ON public.map_integration_analytics(map_app_id);
CREATE INDEX IF NOT EXISTS idx_map_analytics_platform ON public.map_integration_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_map_analytics_timestamp ON public.map_integration_analytics(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_map_analytics_source_screen ON public.map_integration_analytics(source_screen);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_map_analytics_user_event_time ON public.map_integration_analytics(user_id, event_type, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_map_analytics_app_event_time ON public.map_integration_analytics(map_app_id, event_type, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_map_analytics_platform_event_time ON public.map_integration_analytics(platform, event_type, event_timestamp);

-- Supported map apps indexes
CREATE INDEX IF NOT EXISTS idx_supported_map_apps_app_name ON public.supported_map_apps(app_name);
CREATE INDEX IF NOT EXISTS idx_supported_map_apps_is_active ON public.supported_map_apps(is_active);
CREATE INDEX IF NOT EXISTS idx_supported_map_apps_sort_order ON public.supported_map_apps(sort_order);
CREATE INDEX IF NOT EXISTS idx_supported_map_apps_ios ON public.supported_map_apps(ios_available) WHERE ios_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_supported_map_apps_android ON public.supported_map_apps(android_available) WHERE android_available = TRUE;

-- Map app deep links indexes
CREATE INDEX IF NOT EXISTS idx_map_app_deep_links_map_app_id ON public.map_app_deep_links(map_app_id);
CREATE INDEX IF NOT EXISTS idx_map_app_deep_links_default_platform ON public.map_app_deep_links(is_default_for_platform) WHERE is_default_for_platform IS NOT NULL;

-- =====================================================
-- INSERT DEFAULT SUPPORTED MAP APPS
-- =====================================================

-- Insert default supported map applications
INSERT INTO public.supported_map_apps (
  app_name, app_display_name, app_description,
  ios_available, android_available, web_available,
  ios_bundle_id, android_package_name, web_url,
  is_active, sort_order, popularity_score,
  supports_directions, supports_search, supports_coordinates, supports_address
) VALUES 
-- Apple Maps (iOS default)
(
  'apple_maps', 'Apple Maps', 'Apple''s built-in navigation app for iOS devices',
  TRUE, FALSE, TRUE,
  'com.apple.Maps', NULL, 'https://maps.apple.com',
  TRUE, 1, 90,
  TRUE, TRUE, TRUE, TRUE
),
-- Google Maps (Cross-platform)
(
  'google_maps', 'Google Maps', 'Google''s comprehensive mapping and navigation service',
  TRUE, TRUE, TRUE,
  'com.google.Maps', 'com.google.android.apps.maps', 'https://maps.google.com',
  TRUE, 2, 95,
  TRUE, TRUE, TRUE, TRUE
),
-- Waze (Navigation focused)
(
  'waze', 'Waze', 'Community-driven navigation app with real-time traffic updates',
  TRUE, TRUE, TRUE,
  'com.waze.iphone', 'com.waze', 'https://www.waze.com',
  TRUE, 3, 80,
  TRUE, FALSE, TRUE, TRUE
),
-- MapQuest
(
  'mapquest', 'MapQuest', 'MapQuest navigation and mapping service',
  TRUE, TRUE, TRUE,
  'com.mapquest.MapQuestMobile', 'com.mapquest.android.ace', 'https://www.mapquest.com',
  TRUE, 4, 60,
  TRUE, TRUE, TRUE, TRUE
),
-- HERE Maps
(
  'here_maps', 'HERE Maps', 'HERE Technologies mapping and navigation service',
  FALSE, TRUE, TRUE,
  NULL, 'com.here.app.maps', 'https://wego.here.com',
  TRUE, 5, 50,
  TRUE, TRUE, TRUE, TRUE
)
ON CONFLICT (app_name) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT DEEP LINK CONFIGURATIONS
-- =====================================================

-- Insert deep link configurations for supported apps
INSERT INTO public.map_app_deep_links (
  map_app_id, directions_url_template, search_url_template, 
  coordinate_url_template, address_url_template,
  ios_url_scheme, android_intent_action,
  is_default_for_platform, requires_app_detection, fallback_to_web
)
SELECT 
  sma.id,
  CASE sma.app_name
    WHEN 'apple_maps' THEN 'maps://?daddr={latitude},{longitude}&dirflg=d'
    WHEN 'google_maps' THEN 'comgooglemaps://?daddr={latitude},{longitude}&directionsmode=driving'
    WHEN 'waze' THEN 'waze://?ll={latitude},{longitude}&navigate=yes'
    WHEN 'mapquest' THEN 'mapquest://navigation/v2/route?to={latitude},{longitude}'
    WHEN 'here_maps' THEN 'here-route://mylocation/{latitude},{longitude}'
  END as directions_url_template,
  CASE sma.app_name
    WHEN 'apple_maps' THEN 'maps://?q={query}&ll={latitude},{longitude}'
    WHEN 'google_maps' THEN 'comgooglemaps://?q={query}&center={latitude},{longitude}'
    WHEN 'waze' THEN NULL -- Waze doesn't support search
    WHEN 'mapquest' THEN 'mapquest://search/v1/find?query={query}&location={latitude},{longitude}'
    WHEN 'here_maps' THEN 'here-location://search?q={query}&at={latitude},{longitude}'
  END as search_url_template,
  CASE sma.app_name
    WHEN 'apple_maps' THEN 'maps://?ll={latitude},{longitude}'
    WHEN 'google_maps' THEN 'comgooglemaps://?center={latitude},{longitude}&zoom=15'
    WHEN 'waze' THEN 'waze://?ll={latitude},{longitude}'
    WHEN 'mapquest' THEN 'mapquest://search/v1/find?location={latitude},{longitude}'
    WHEN 'here_maps' THEN 'here-location://{latitude},{longitude}'
  END as coordinate_url_template,
  CASE sma.app_name
    WHEN 'apple_maps' THEN 'maps://?address={address}'
    WHEN 'google_maps' THEN 'comgooglemaps://?q={address}'
    WHEN 'waze' THEN 'waze://?q={address}'
    WHEN 'mapquest' THEN 'mapquest://search/v1/find?query={address}'
    WHEN 'here_maps' THEN 'here-location://search?q={address}'
  END as address_url_template,
  CASE sma.app_name
    WHEN 'apple_maps' THEN 'maps://'
    WHEN 'google_maps' THEN 'comgooglemaps://'
    WHEN 'waze' THEN 'waze://'
    WHEN 'mapquest' THEN 'mapquest://'
    WHEN 'here_maps' THEN 'here-location://'
  END as ios_url_scheme,
  CASE sma.app_name
    WHEN 'google_maps' THEN 'android.intent.action.VIEW'
    WHEN 'waze' THEN 'android.intent.action.VIEW'
    WHEN 'mapquest' THEN 'android.intent.action.VIEW'
    WHEN 'here_maps' THEN 'android.intent.action.VIEW'
    ELSE NULL
  END as android_intent_action,
  CASE sma.app_name
    WHEN 'apple_maps' THEN 'ios'
    WHEN 'google_maps' THEN NULL -- Available on all platforms
    ELSE NULL
  END as is_default_for_platform,
  TRUE as requires_app_detection,
  TRUE as fallback_to_web
FROM public.supported_map_apps sma
WHERE sma.is_active = TRUE;

-- =====================================================
-- MIGRATION COMPLETION NOTICE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 007: Map integration preferences tables created successfully';
  RAISE NOTICE 'Tables created: supported_map_apps, map_app_deep_links, user_map_preferences, map_integration_analytics';
  RAISE NOTICE 'Default map apps inserted: Apple Maps, Google Maps, Waze, MapQuest, HERE Maps';
  RAISE NOTICE 'Deep link configurations created for all supported apps';
  RAISE NOTICE 'RLS policies and indexes applied for optimal performance';
END $$; 