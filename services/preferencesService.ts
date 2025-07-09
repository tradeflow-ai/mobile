/**
 * Preferences Service - User Preference Integration for AI Agents
 * 
 * This service extracts user preferences from the profile and formats them
 * for injection into LangGraph agent prompts.
 */

import { supabase } from './supabase';

// User preference interfaces
export interface UserPreferences {
  // Work Schedule
  work_days: string[];
  work_start_time: string;
  work_end_time: string;
  lunch_break_start: string;
  lunch_break_end: string;
  short_break_duration_minutes: number;
  short_break_frequency_hours: number;
  break_location_preference: 'home' | 'job_site' | 'flexible';
  break_buffer_minutes: number;

  // Buffer Times
  travel_buffer_percentage: number;
  emergency_travel_buffer_percentage: number;
  peak_hour_buffer_percentage: number;
  weather_buffer_percentage: number;
  job_duration_buffer_minutes: number;
  enable_smart_buffers: boolean;

  // Emergency Response
  emergency_response_time_minutes: number;
  emergency_buffer_minutes: number;
  emergency_job_types: string[];
  demand_response_time_hours: number;
  maintenance_response_time_days: number;

  // Vehicle & Route Preferences
  vehicle_type: string;
  tool_capacity_cubic_feet: number;
  parts_capacity_weight_lbs: number;
  specialty_equipment_list: string[];
  load_unload_time_minutes: number;
  preferred_routes: string[];
  avoided_areas: string[];
  toll_preference: 'avoid' | 'minimize' | 'accept';
  highway_preference: 'prefer_highways' | 'avoid_highways' | 'flexible';
  parking_difficulty_areas: string[];

  // Supplier Preferences
  primary_supplier: string;
  secondary_suppliers: string[];
  specialty_suppliers: Record<string, string>;
  supplier_preferences: 'price' | 'quality' | 'availability' | 'location';
  supplier_account_numbers: Record<string, string>;
  supplier_priority_order: any[];

  // Inventory Thresholds
  critical_items_min_stock: number;
  standard_items_min_stock: number;
  seasonal_inventory_adjustments: Record<string, number>;
  reorder_point_percentage: number;
  safety_stock_percentage: number;

  // BOMs and Parts
  job_type_templates: Record<string, string[]>;
  common_job_types: string[];
  quality_preference: 'standard' | 'premium' | 'budget';
  preferred_brands: string[];
  substitution_rules: Record<string, string[]>;

  // Availability Preferences
  stock_preference: 'immediate_availability' | 'cost_savings';
  delivery_preference: 'pickup' | 'delivery' | 'flexible';
  lead_time_tolerance_days: number;
  bulk_purchase_threshold: number;
  emergency_stock_items: string[];

  // Client Management
  vip_client_ids: string[];
}

// Default preferences for new users
const DEFAULT_PREFERENCES: UserPreferences = {
  // Work Schedule
  work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  work_start_time: '08:00',
  work_end_time: '17:00',
  lunch_break_start: '12:00',
  lunch_break_end: '13:00',
  short_break_duration_minutes: 15,
  short_break_frequency_hours: 3,
  break_location_preference: 'flexible',
  break_buffer_minutes: 5,

  // Buffer Times
  travel_buffer_percentage: 15,
  emergency_travel_buffer_percentage: 25,
  peak_hour_buffer_percentage: 10,
  weather_buffer_percentage: 20,
  job_duration_buffer_minutes: 15,
  enable_smart_buffers: true,

  // Emergency Response
  emergency_response_time_minutes: 60,
  emergency_buffer_minutes: 30,
  emergency_job_types: ['emergency', 'urgent', 'gas_leak', 'flooding', 'electrical_hazard'],
  demand_response_time_hours: 4,
  maintenance_response_time_days: 7,

  // Vehicle & Route Preferences
  vehicle_type: 'Service Van',
  tool_capacity_cubic_feet: 200,
  parts_capacity_weight_lbs: 1500,
  specialty_equipment_list: [],
  load_unload_time_minutes: 10,
  preferred_routes: [],
  avoided_areas: [],
  toll_preference: 'minimize',
  highway_preference: 'flexible',
  parking_difficulty_areas: [],

  // Supplier Preferences
  primary_supplier: 'Home Depot',
  secondary_suppliers: ['Lowe\'s', 'Ferguson'],
  specialty_suppliers: {
    'electrical': 'Grainger',
    'plumbing': 'Ferguson',
    'hvac': 'Johnstone Supply'
  },
  supplier_preferences: 'availability',
  supplier_account_numbers: {},
  supplier_priority_order: [],

  // Inventory Thresholds
  critical_items_min_stock: 5,
  standard_items_min_stock: 2,
  seasonal_inventory_adjustments: {},
  reorder_point_percentage: 25,
  safety_stock_percentage: 10,

  // BOMs and Parts
  job_type_templates: {
    'leaky_faucet': ['faucet_cartridge', 'o_rings', 'plumbers_putty'],
    'outlet_installation': ['outlet', 'wire_nuts', '12_awg_wire'],
    'hvac_maintenance': ['air_filter', 'belt', 'motor_oil']
  },
  common_job_types: ['plumbing_repair', 'electrical_service', 'hvac_maintenance'],
  quality_preference: 'standard',
  preferred_brands: ['Kohler', 'Leviton', 'Honeywell'],
  substitution_rules: {
    'kohler_faucet': ['moen_faucet', 'delta_faucet'],
    'leviton_outlet': ['pass_seymour_outlet', 'hubbell_outlet']
  },

  // Availability Preferences
  stock_preference: 'immediate_availability',
  delivery_preference: 'pickup',
  lead_time_tolerance_days: 3,
  bulk_purchase_threshold: 15,
  emergency_stock_items: ['pipe_fittings', 'electrical_tape', 'fuses'],

  // Client Management
  vip_client_ids: []
};

export class PreferencesService {
  /**
   * Get user preferences from profile
   */
  static async getUserPreferences(userId: string): Promise<{ data: UserPreferences | null; error: any }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Merge user preferences with defaults
      const userPrefs = profile?.preferences || {};
      const mergedPreferences = { ...DEFAULT_PREFERENCES, ...userPrefs };

      return { data: mergedPreferences, error: null };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<{ data: UserPreferences | null; error: any }> {
    try {
      // First get current preferences
      const { data: currentPrefs, error: fetchError } = await this.getUserPreferences(userId);
      if (fetchError) throw fetchError;

      // Merge with new preferences
      const updatedPreferences = { ...currentPrefs, ...preferences };

      // Update in database
      const { data, error } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', userId)
        .select('preferences')
        .single();

      if (error) throw error;

      return { data: data.preferences, error: null };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { data: null, error };
    }
  }

  /**
   * Format preferences for dispatcher agent prompt
   */
  static formatDispatcherPreferences(preferences: UserPreferences): Record<string, any> {
    return {
      work_start_time: preferences.work_start_time,
      work_end_time: preferences.work_end_time,
      lunch_break_start: preferences.lunch_break_start,
      lunch_break_end: preferences.lunch_break_end,
      travel_buffer_percentage: preferences.travel_buffer_percentage,
      job_duration_buffer_minutes: preferences.job_duration_buffer_minutes,
      emergency_response_time_minutes: preferences.emergency_response_time_minutes,
      demand_response_time_hours: preferences.demand_response_time_hours,
      maintenance_response_time_days: preferences.maintenance_response_time_days,
      emergency_job_types: preferences.emergency_job_types.join(', '),
      emergency_buffer_minutes: preferences.emergency_buffer_minutes,
      emergency_travel_buffer_percentage: preferences.emergency_travel_buffer_percentage,
      work_days: preferences.work_days.join(', '),
      vip_client_ids: preferences.vip_client_ids.join(', ')
    };
  }

  /**
   * Format preferences for router agent prompt
   */
  static formatRouterPreferences(preferences: UserPreferences): Record<string, any> {
    return {
      work_start_time: preferences.work_start_time,
      work_end_time: preferences.work_end_time,
      travel_buffer_percentage: preferences.travel_buffer_percentage,
      emergency_travel_buffer_percentage: preferences.emergency_travel_buffer_percentage,
      peak_hour_buffer_percentage: preferences.peak_hour_buffer_percentage,
      weather_buffer_percentage: preferences.weather_buffer_percentage,
      lunch_break_start: preferences.lunch_break_start,
      lunch_break_end: preferences.lunch_break_end,
      short_break_duration_minutes: preferences.short_break_duration_minutes,
      short_break_frequency_hours: preferences.short_break_frequency_hours,
      break_location_preference: preferences.break_location_preference,
      break_buffer_minutes: preferences.break_buffer_minutes,
      vehicle_type: preferences.vehicle_type,
      tool_capacity_cubic_feet: preferences.tool_capacity_cubic_feet,
      parts_capacity_weight_lbs: preferences.parts_capacity_weight_lbs,
      specialty_equipment_list: preferences.specialty_equipment_list.join(', '),
      load_unload_time_minutes: preferences.load_unload_time_minutes,
      preferred_routes: preferences.preferred_routes.join(', '),
      avoided_areas: preferences.avoided_areas.join(', '),
      toll_preference: preferences.toll_preference,
      highway_preference: preferences.highway_preference,
      parking_difficulty_areas: preferences.parking_difficulty_areas.join(', '),
      job_duration_buffer_minutes: preferences.job_duration_buffer_minutes
    };
  }

  /**
   * Format preferences for inventory agent prompt
   */
  static formatInventoryPreferences(preferences: UserPreferences): Record<string, any> {
    return {
      primary_supplier: preferences.primary_supplier,
      secondary_suppliers: preferences.secondary_suppliers.join(', '),
      specialty_suppliers: Object.entries(preferences.specialty_suppliers)
        .map(([category, supplier]) => `${category}: ${supplier}`)
        .join(', '),
      supplier_preferences: preferences.supplier_preferences,
      supplier_account_numbers: Object.entries(preferences.supplier_account_numbers)
        .map(([supplier, account]) => `${supplier}: ${account}`)
        .join(', '),
      critical_items_min_stock: preferences.critical_items_min_stock,
      standard_items_min_stock: preferences.standard_items_min_stock,
      seasonal_inventory_adjustments: Object.entries(preferences.seasonal_inventory_adjustments)
        .map(([item, adjustment]) => `${item}: ${adjustment}`)
        .join(', '),
      reorder_point_percentage: preferences.reorder_point_percentage,
      safety_stock_percentage: preferences.safety_stock_percentage,
      job_type_templates: Object.entries(preferences.job_type_templates)
        .map(([jobType, parts]) => `${jobType}: [${parts.join(', ')}]`)
        .join(', '),
      common_job_types: preferences.common_job_types.join(', '),
      quality_preference: preferences.quality_preference,
      preferred_brands: preferences.preferred_brands.join(', '),
      substitution_rules: Object.entries(preferences.substitution_rules)
        .map(([item, substitutes]) => `${item}: [${substitutes.join(', ')}]`)
        .join(', '),
      stock_preference: preferences.stock_preference,
      delivery_preference: preferences.delivery_preference,
      lead_time_tolerance_days: preferences.lead_time_tolerance_days,
      bulk_purchase_threshold: preferences.bulk_purchase_threshold,
      emergency_stock_items: preferences.emergency_stock_items.join(', ')
    };
  }

  /**
   * Format preferences for all agents
   */
  static formatAllAgentPreferences(preferences: UserPreferences): {
    dispatcher: Record<string, any>;
    router: Record<string, any>;
    inventory: Record<string, any>;
  } {
    return {
      dispatcher: this.formatDispatcherPreferences(preferences),
      router: this.formatRouterPreferences(preferences),
      inventory: this.formatInventoryPreferences(preferences)
    };
  }

  /**
   * Inject preferences into agent prompts
   */
  static injectPreferencesIntoPrompt(prompt: string, preferences: Record<string, any>): string {
    let injectedPrompt = prompt;
    
    // Replace all {preference_name} placeholders with actual values
    Object.entries(preferences).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      injectedPrompt = injectedPrompt.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return injectedPrompt;
  }

  /**
   * Get formatted prompt for dispatcher agent
   */
  static async getDispatcherPrompt(userId: string, basePrompt: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data: preferences, error } = await this.getUserPreferences(userId);
      if (error) throw error;

      const formattedPreferences = this.formatDispatcherPreferences(preferences!);
      const injectedPrompt = this.injectPreferencesIntoPrompt(basePrompt, formattedPreferences);

      return { data: injectedPrompt, error: null };
    } catch (error) {
      console.error('Error getting dispatcher prompt:', error);
      return { data: null, error };
    }
  }

  /**
   * Get formatted prompt for router agent
   */
  static async getRouterPrompt(userId: string, basePrompt: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data: preferences, error } = await this.getUserPreferences(userId);
      if (error) throw error;

      const formattedPreferences = this.formatRouterPreferences(preferences!);
      const injectedPrompt = this.injectPreferencesIntoPrompt(basePrompt, formattedPreferences);

      return { data: injectedPrompt, error: null };
    } catch (error) {
      console.error('Error getting router prompt:', error);
      return { data: null, error };
    }
  }

  /**
   * Get formatted prompt for inventory agent
   */
  static async getInventoryPrompt(userId: string, basePrompt: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data: preferences, error } = await this.getUserPreferences(userId);
      if (error) throw error;

      const formattedPreferences = this.formatInventoryPreferences(preferences!);
      const injectedPrompt = this.injectPreferencesIntoPrompt(basePrompt, formattedPreferences);

      return { data: injectedPrompt, error: null };
    } catch (error) {
      console.error('Error getting inventory prompt:', error);
      return { data: null, error };
    }
  }

  /**
   * Validate user preferences
   */
  static validatePreferences(preferences: Partial<UserPreferences>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate work hours
    if (preferences.work_start_time && preferences.work_end_time) {
      const startTime = new Date(`1970-01-01T${preferences.work_start_time}`);
      const endTime = new Date(`1970-01-01T${preferences.work_end_time}`);
      
      if (startTime >= endTime) {
        errors.push('Work start time must be before work end time');
      }
    }

    // Validate break times
    if (preferences.lunch_break_start && preferences.lunch_break_end) {
      const breakStart = new Date(`1970-01-01T${preferences.lunch_break_start}`);
      const breakEnd = new Date(`1970-01-01T${preferences.lunch_break_end}`);
      
      if (breakStart >= breakEnd) {
        errors.push('Lunch break start time must be before lunch break end time');
      }
    }

    // Validate percentages
    if (preferences.travel_buffer_percentage !== undefined && preferences.travel_buffer_percentage < 0) {
      errors.push('Travel buffer percentage must be non-negative');
    }

    if (preferences.emergency_travel_buffer_percentage !== undefined && preferences.emergency_travel_buffer_percentage < 0) {
      errors.push('Emergency travel buffer percentage must be non-negative');
    }

    // Validate capacity values
    if (preferences.tool_capacity_cubic_feet !== undefined && preferences.tool_capacity_cubic_feet <= 0) {
      errors.push('Tool capacity must be positive');
    }

    if (preferences.parts_capacity_weight_lbs !== undefined && preferences.parts_capacity_weight_lbs <= 0) {
      errors.push('Parts capacity must be positive');
    }

    return { valid: errors.length === 0, errors };
  }
} 