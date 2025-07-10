import { Platform, Linking, Alert } from 'react-native';
import { supabase } from './supabase';
import { openNativeMaps, openDirectionsToJob } from '@/utils/mapUtils';
import { JobLocation } from '@/store/atoms';

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface MapApp {
  id: string;
  app_name: string;
  app_display_name: string;
  app_description?: string;
  ios_supported: boolean;
  android_supported: boolean;
  web_supported: boolean;
  ios_bundle_id?: string;
  android_package_name?: string;
  ios_app_store_id?: string;
  google_play_store_id?: string;
  popularity_score: number;
  supports_directions: boolean;
  supports_search: boolean;
  supports_coordinates: boolean;
  supports_waypoints: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MapAppDeepLink {
  id: string;
  map_app_id: string;
  platform: 'ios' | 'android' | 'web';
  link_type: 'directions' | 'search' | 'coordinate' | 'waypoint';
  url_template: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMapPreference {
  id: string;
  user_id: string;
  map_app_id: string;
  preference_type: 'primary' | 'secondary' | 'fallback';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  map_app?: MapApp;
}

export interface MapIntegrationAnalytics {
  id: string;
  user_id: string;
  map_app_id: string;
  action_type: 'open_directions' | 'open_search' | 'open_coordinates' | 'app_detection';
  success: boolean;
  error_message?: string;
  response_time_ms?: number;
  job_location_id?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
}

export interface MapIntegrationOptions {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  label?: string;
  jobLocation?: JobLocation;
  preferredApp?: string;
  fallbackToDefault?: boolean;
}

export interface AvailableMapApp {
  app: MapApp;
  isInstalled: boolean;
  canOpen: boolean;
  deepLinks: MapAppDeepLink[];
}

// =============================================
// MAP INTEGRATION SERVICE
// =============================================

export class MapIntegrationService {
  private static instance: MapIntegrationService;
  private supportedApps: MapApp[] = [];
  private deepLinks: MapAppDeepLink[] = [];
  private isInitialized = false;

  static getInstance(): MapIntegrationService {
    if (!MapIntegrationService.instance) {
      MapIntegrationService.instance = new MapIntegrationService();
    }
    return MapIntegrationService.instance;
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.loadSupportedApps();
      await this.loadDeepLinks();
      this.isInitialized = true;
      console.log('MapIntegrationService initialized successfully');
    } catch (error) {
      console.error('Error initializing MapIntegrationService:', error);
      throw error;
    }
  }

  private async loadSupportedApps(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('supported_map_apps')
        .select('*')
        .eq('is_active', true)
        .order('popularity_score', { ascending: false });

      if (error) {
        console.error('Error loading supported apps:', error);
        throw error;
      }

      this.supportedApps = data || [];
      console.log(`Loaded ${this.supportedApps.length} supported map apps`);
    } catch (error) {
      console.error('Error loading supported apps:', error);
      throw error;
    }
  }

  private async loadDeepLinks(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('map_app_deep_links')
        .select('*')
        .eq('is_active', true)
        .eq('platform', Platform.OS);

      if (error) {
        console.error('Error loading deep links:', error);
        throw error;
      }

      this.deepLinks = data || [];
      console.log(`Loaded ${this.deepLinks.length} deep links for ${Platform.OS}`);
    } catch (error) {
      console.error('Error loading deep links:', error);
      throw error;
    }
  }

  // =============================================
  // USER PREFERENCES
  // =============================================

  async getUserMapPreferences(userId: string): Promise<{ data: UserMapPreference[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_map_preferences')
        .select(`
          *,
          map_app:supported_map_apps(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('preference_type', { ascending: true });

      if (error) {
        console.error('Error fetching user map preferences:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Unexpected error fetching user map preferences:', error);
      return { data: [], error };
    }
  }

  async updateMapPreference(
    userId: string,
    mapAppId: string,
    preferenceType: 'primary' | 'secondary' | 'fallback'
  ): Promise<{ data: UserMapPreference | null; error: any }> {
    try {
      // First, update any existing preferences of the same type to inactive
      await supabase
        .from('user_map_preferences')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('preference_type', preferenceType);

      // Then create or update the new preference
      const { data, error } = await supabase
        .from('user_map_preferences')
        .upsert({
          user_id: userId,
          map_app_id: mapAppId,
          preference_type: preferenceType,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          map_app:supported_map_apps(*)
        `)
        .single();

      if (error) {
        console.error('Error updating map preference:', error);
        return { data: null, error };
      }

      console.log(`Updated ${preferenceType} map preference for user ${userId}`);
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error updating map preference:', error);
      return { data: null, error };
    }
  }

  // =============================================
  // APP DETECTION & AVAILABILITY
  // =============================================

  async getAvailableMapApps(): Promise<AvailableMapApp[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const availableApps: AvailableMapApp[] = [];
    
    for (const app of this.supportedApps) {
      const deepLinks = this.deepLinks.filter(link => link.map_app_id === app.id);
      const isInstalled = await this.checkAppInstallation(app);
      
      availableApps.push({
        app,
        isInstalled,
        canOpen: isInstalled,
        deepLinks,
      });
    }

    return availableApps.sort((a, b) => {
      // Sort by installation status first, then by popularity
      if (a.isInstalled && !b.isInstalled) return -1;
      if (!a.isInstalled && b.isInstalled) return 1;
      return b.app.popularity_score - a.app.popularity_score;
    });
  }

  private async checkAppInstallation(app: MapApp): Promise<boolean> {
    try {
      let urlScheme: string;
      
      if (Platform.OS === 'ios') {
        switch (app.app_name) {
          case 'apple_maps':
            urlScheme = 'http://maps.apple.com/';
            break;
          case 'google_maps':
            urlScheme = 'comgooglemaps://';
            break;
          case 'waze':
            urlScheme = 'waze://';
            break;
          case 'mapquest':
            urlScheme = 'mapquest://';
            break;
          case 'here_maps':
            urlScheme = 'here-route://';
            break;
          default:
            return false;
        }
      } else {
        switch (app.app_name) {
          case 'google_maps':
            urlScheme = 'https://maps.google.com/';
            break;
          case 'waze':
            urlScheme = 'https://waze.com/ul';
            break;
          case 'mapquest':
            urlScheme = 'https://www.mapquest.com/';
            break;
          case 'here_maps':
            urlScheme = 'https://wego.here.com/';
            break;
          default:
            return false;
        }
      }

      return await Linking.canOpenURL(urlScheme);
    } catch (error) {
      console.error(`Error checking installation for ${app.app_name}:`, error);
      return false;
    }
  }

  // =============================================
  // DEEP LINK GENERATION
  // =============================================

  generateMapDeepLink(
    appName: string,
    linkType: 'directions' | 'search' | 'coordinate',
    options: MapIntegrationOptions
  ): string | null {
    const deepLink = this.deepLinks.find(
      link => link.map_app_id === appName && link.link_type === linkType
    );

    if (!deepLink) {
      console.warn(`No deep link found for ${appName} (${linkType})`);
      return null;
    }

    const { coordinates, label, jobLocation } = options;
    let url = deepLink.url_template;

    // Replace coordinate placeholders
    url = url.replace('{latitude}', coordinates.latitude.toString());
    url = url.replace('{longitude}', coordinates.longitude.toString());
    url = url.replace('{coordinates}', `${coordinates.latitude},${coordinates.longitude}`);

    // Replace label placeholders
    if (label) {
      url = url.replace('{label}', encodeURIComponent(label));
    }

    // Replace job location placeholders
    if (jobLocation) {
      url = url.replace('{destination}', encodeURIComponent(jobLocation.address));
      url = url.replace('{title}', encodeURIComponent(jobLocation.title));
    }

    return url;
  }

  // =============================================
  // EXTERNAL MAP INTEGRATION
  // =============================================

  async openInExternalMap(options: MapIntegrationOptions, userId?: string): Promise<boolean> {
    const startTime = Date.now();
    let success = false;
    let errorMessage: string | undefined;
    let selectedApp: MapApp | null = null;

    try {
      // Get user preferences if userId provided
      let userPreferences: UserMapPreference[] = [];
      if (userId) {
        const { data } = await this.getUserMapPreferences(userId);
        userPreferences = data;
      }

      // Get available apps
      const availableApps = await this.getAvailableMapApps();
      const installedApps = availableApps.filter(app => app.isInstalled);

      // Determine which app to use
      if (options.preferredApp) {
        selectedApp = installedApps.find(app => app.app.app_name === options.preferredApp)?.app || null;
      } else if (userPreferences.length > 0) {
        // Use user's primary preference
        const primaryPref = userPreferences.find(pref => pref.preference_type === 'primary');
        if (primaryPref) {
          selectedApp = installedApps.find(app => app.app.id === primaryPref.map_app_id)?.app || null;
        }
      }

      // Fallback to best available app
      if (!selectedApp && installedApps.length > 0) {
        selectedApp = installedApps[0].app;
      }

      if (!selectedApp) {
        // Use existing mapUtils functions as final fallback
        if (options.jobLocation) {
          await openDirectionsToJob(options.jobLocation);
        } else {
          await openNativeMaps(options.coordinates.latitude, options.coordinates.longitude, options.label);
        }
        success = true;
        console.log('Used fallback map integration');
      } else {
        // Generate deep link and open external app
        const linkType = options.jobLocation ? 'directions' : 'coordinate';
        const deepLink = this.generateMapDeepLink(selectedApp.app_name, linkType, options);

        if (deepLink) {
          const canOpen = await Linking.canOpenURL(deepLink);
          if (canOpen) {
            await Linking.openURL(deepLink);
            success = true;
            console.log(`Opened ${selectedApp.app_display_name} successfully`);
          } else {
            throw new Error(`Cannot open ${selectedApp.app_display_name}`);
          }
        } else {
          throw new Error(`No deep link available for ${selectedApp.app_display_name}`);
        }
      }

    } catch (error) {
      console.error('Error opening external map:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      success = false;

      // Show user-friendly error
      Alert.alert(
        'Map Error',
        'Unable to open the map app. Please try again or check if the app is installed.',
        [{ text: 'OK' }]
      );
    } finally {
      // Log analytics
      if (userId && selectedApp) {
        await this.logMapIntegrationAnalytics({
          userId,
          mapAppId: selectedApp.id,
          actionType: options.jobLocation ? 'open_directions' : 'open_coordinates',
          success,
          errorMessage,
          responseTimeMs: Date.now() - startTime,
          jobLocationId: options.jobLocation?.id,
          coordinates: options.coordinates,
        });
      }
    }

    return success;
  }

  // =============================================
  // ANALYTICS
  // =============================================

  private async logMapIntegrationAnalytics(analytics: {
    userId: string;
    mapAppId: string;
    actionType: 'open_directions' | 'open_search' | 'open_coordinates' | 'app_detection';
    success: boolean;
    errorMessage?: string;
    responseTimeMs?: number;
    jobLocationId?: string;
    coordinates?: { latitude: number; longitude: number };
  }): Promise<void> {
    try {
      await supabase
        .from('map_integration_analytics')
        .insert({
          user_id: analytics.userId,
          map_app_id: analytics.mapAppId,
          action_type: analytics.actionType,
          success: analytics.success,
          error_message: analytics.errorMessage,
          response_time_ms: analytics.responseTimeMs,
          job_location_id: analytics.jobLocationId,
          coordinates: analytics.coordinates,
          created_at: new Date().toISOString(),
        });

      console.log(`Logged map integration analytics: ${analytics.actionType} - ${analytics.success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('Error logging map integration analytics:', error);
    }
  }

  async getMapIntegrationAnalytics(
    userId: string,
    limit: number = 100
  ): Promise<{ data: MapIntegrationAnalytics[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('map_integration_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching map integration analytics:', error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Unexpected error fetching map integration analytics:', error);
      return { data: [], error };
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async refreshSupportedApps(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }

  getSupportedApps(): MapApp[] {
    return this.supportedApps;
  }

  getDeepLinks(): MapAppDeepLink[] {
    return this.deepLinks;
  }
}

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

/**
 * Quick function to open external map with user preferences
 * Extends existing mapUtils functions with enhanced app support
 */
export async function openExternalMap(
  coordinates: { latitude: number; longitude: number },
  label?: string,
  userId?: string
): Promise<boolean> {
  const service = MapIntegrationService.getInstance();
  return await service.openInExternalMap({ coordinates, label }, userId);
}

/**
 * Quick function to open directions to job location with user preferences
 * Extends existing openDirectionsToJob function with enhanced app support
 */
export async function openExternalDirections(
  jobLocation: JobLocation,
  userId?: string
): Promise<boolean> {
  const service = MapIntegrationService.getInstance();
  return await service.openInExternalMap({
    coordinates: jobLocation.coordinates,
    label: jobLocation.title,
    jobLocation,
  }, userId);
}

/**
 * Get user's preferred map app
 */
export async function getUserPreferredMapApp(userId: string): Promise<MapApp | null> {
  const service = MapIntegrationService.getInstance();
  const { data } = await service.getUserMapPreferences(userId);
  const primaryPref = data.find(pref => pref.preference_type === 'primary');
  return primaryPref?.map_app || null;
} 