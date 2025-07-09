/**
 * Daily Plan Service - LangGraph State Persistence
 * 
 * This service handles all database operations for the daily_plans table,
 * providing state persistence for the LangGraph agent workflow.
 */

import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// Type definitions for daily plan data structures
export interface DailyPlan {
  id: string;
  user_id: string;
  status: 'pending' | 'dispatch_complete' | 'route_complete' | 'inventory_complete' | 'approved' | 'cancelled' | 'error';
  current_step: 'dispatch' | 'route' | 'inventory' | 'complete';
  dispatch_output: DispatchOutput;
  route_output: RouteOutput;
  inventory_output: InventoryOutput;
  user_modifications: UserModifications;
  preferences_snapshot: Record<string, any>;
  job_ids: string[]; // Original jobs for the day
  created_job_ids: string[]; // Jobs created during workflow (e.g., hardware store runs)
  error_state: ErrorState;
  retry_count: number;
  planned_date: string;
  total_estimated_duration: number | null;
  total_distance: number | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface DispatchOutput {
  prioritized_jobs: Array<{
    job_id: string;
    priority_rank: number;
    estimated_start_time: string;
    estimated_end_time: string;
    priority_reason: string;
    job_type: 'demand' | 'maintenance' | 'emergency';
    buffer_time_minutes: number;
    priority_score: number;
    scheduling_notes: string;
  }>;
  scheduling_constraints: {
    work_start_time: string;
    work_end_time: string;
    lunch_break_start: string;
    lunch_break_end: string;
    total_work_hours: number;
    total_jobs_scheduled: number;
    schedule_conflicts: string[];
  };
  recommendations: string[];
  agent_reasoning: string;
  execution_time_ms: number;
  optimization_summary: {
    emergency_jobs: number;
    demand_jobs: number;
    maintenance_jobs: number;
    vip_clients: number;
    schedule_efficiency: number;
  };
}

export interface RouteOutput {
  optimized_route: {
    waypoints: Array<{
      job_id: string;
      sequence_number: number;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      arrival_time: string;
      departure_time: string;
      duration_at_location: number;
      travel_time_to_next: number;
      distance_to_next: number;
    }>;
    route_geometry: string;
    total_distance: number;
    total_travel_time: number;
    total_work_time: number;
  };
  alternative_routes?: Array<{
    route_id: string;
    total_distance: number;
    total_time: number;
    route_geometry: string;
  }>;
  agent_reasoning: string;
  execution_time_ms: number;
}

export interface InventoryOutput {
  parts_manifest: Array<{
    job_id: string;
    required_parts: Array<{
      inventory_item_id: string;
      item_name: string;
      quantity_needed: number;
      quantity_available: number;
      unit: string;
      category: string;
    }>;
  }>;
  shopping_list: Array<{
    item_name: string;
    quantity_needed: number;
    unit: string;
    category: string;
    preferred_supplier: string;
    estimated_cost: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  hardware_store_run?: {
    store_locations: Array<{
      store_name: string;
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      estimated_visit_time: number;
      items_available: string[];
    }>;
    total_estimated_cost: number;
    estimated_shopping_time: number;
  };
  // CRITICAL: Track dynamically created hardware store run jobs
  created_hardware_store_jobs: string[]; // Array of job_location IDs created by this agent
  inventory_alerts: Array<{
    item_name: string;
    alert_type: 'low_stock' | 'out_of_stock' | 'reorder_needed';
    message: string;
  }>;
  agent_reasoning: string;
  execution_time_ms: number;
}

export interface UserModifications {
  dispatch_changes?: {
    job_reordering?: Array<{
      job_id: string;
      new_priority_rank: number;
      timestamp: string;
    }>;
    job_removals?: Array<{
      job_id: string;
      reason: string;
      timestamp: string;
    }>;
  };
  route_changes?: {
    waypoint_modifications?: Array<{
      job_id: string;
      new_sequence_number: number;
      timestamp: string;
    }>;
  };
  inventory_changes?: {
    parts_modifications?: Array<{
      inventory_item_id: string;
      quantity_override: number;
      timestamp: string;
    }>;
    shopping_list_modifications?: Array<{
      item_name: string;
      action: 'add' | 'remove' | 'modify';
      quantity?: number;
      timestamp: string;
    }>;
  };
}

export interface ErrorState {
  error_type: 'agent_failure' | 'validation_error' | 'timeout' | 'external_api_error';
  error_message: string;
  failed_step: 'dispatch' | 'route' | 'inventory';
  timestamp: string;
  retry_suggested: boolean;
  diagnostic_info: Record<string, any>;
}

export interface CreateDailyPlanInput {
  user_id: string;
  planned_date: string;
  job_ids: string[];
  preferences_snapshot: Record<string, any>;
}

export interface UpdateDailyPlanInput {
  id: string;
  status?: DailyPlan['status'];
  current_step?: DailyPlan['current_step'];
  dispatch_output?: DispatchOutput;
  route_output?: RouteOutput;
  inventory_output?: InventoryOutput;
  user_modifications?: UserModifications;
  error_state?: ErrorState;
  retry_count?: number;
  total_estimated_duration?: number;
  total_distance?: number;
  started_at?: string;
  completed_at?: string;
}

export class DailyPlanService {
  /**
   * Create a new daily plan record
   */
  static async createDailyPlan(input: CreateDailyPlanInput): Promise<{ data: DailyPlan | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .insert([{
          user_id: input.user_id,
          planned_date: input.planned_date,
          job_ids: input.job_ids,
          preferences_snapshot: input.preferences_snapshot,
          status: 'pending',
          current_step: 'dispatch',
          started_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating daily plan:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a daily plan record - Used by LangGraph agents
   */
  static async updateDailyPlan(input: UpdateDailyPlanInput): Promise<{ data: DailyPlan | null; error: any }> {
    try {
      const updateData: any = {};
      
      if (input.status) updateData.status = input.status;
      if (input.current_step) updateData.current_step = input.current_step;
      if (input.dispatch_output) updateData.dispatch_output = input.dispatch_output;
      if (input.route_output) updateData.route_output = input.route_output;
      if (input.inventory_output) updateData.inventory_output = input.inventory_output;
      if (input.user_modifications) updateData.user_modifications = input.user_modifications;
      if (input.error_state) updateData.error_state = input.error_state;
      if (input.retry_count !== undefined) updateData.retry_count = input.retry_count;
      if (input.total_estimated_duration !== undefined) updateData.total_estimated_duration = input.total_estimated_duration;
      if (input.total_distance !== undefined) updateData.total_distance = input.total_distance;
      if (input.started_at) updateData.started_at = input.started_at;
      if (input.completed_at) updateData.completed_at = input.completed_at;

      const { data, error } = await supabase
        .from('daily_plans')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating daily plan:', error);
      return { data: null, error };
    }
  }

  /**
   * Get the current daily plan for a user and date
   */
  static async getCurrentDailyPlan(userId: string, planDate: string): Promise<{ data: DailyPlan | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('planned_date', planDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { data: data || null, error: null };
    } catch (error) {
      console.error('Error getting current daily plan:', error);
      return { data: null, error };
    }
  }

  /**
   * Get daily plan by ID
   */
  static async getDailyPlanById(planId: string): Promise<{ data: DailyPlan | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting daily plan by ID:', error);
      return { data: null, error };
    }
  }

  /**
   * Get daily plans for a user within a date range
   */
  static async getDailyPlansInRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<{ data: DailyPlan[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', userId)
        .gte('planned_date', startDate)
        .lte('planned_date', endDate)
        .order('planned_date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting daily plans in range:', error);
      return { data: null, error };
    }
  }

  /**
   * Cancel a daily plan
   */
  static async cancelDailyPlan(planId: string): Promise<{ data: DailyPlan | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error cancelling daily plan:', error);
      return { data: null, error };
    }
  }

  /**
   * Mark a daily plan as having an error
   */
  static async markDailyPlanError(
    planId: string, 
    errorState: ErrorState,
    retryCount: number = 0
  ): Promise<{ data: DailyPlan | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .update({ 
          status: 'error',
          error_state: errorState,
          retry_count: retryCount
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error marking daily plan as error:', error);
      return { data: null, error };
    }
  }

  /**
   * Approve a daily plan (final step)
   */
  static async approveDailyPlan(planId: string): Promise<{ data: DailyPlan | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .update({ 
          status: 'approved',
          current_step: 'complete',
          completed_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error approving daily plan:', error);
      return { data: null, error };
    }
  }

  /**
   * LangGraph Agent State Persistence Methods
   */

  /**
   * Update daily plan after dispatch agent completion
   */
  static async completeDispatchStep(
    planId: string, 
    dispatchOutput: DispatchOutput
  ): Promise<{ data: DailyPlan | null; error: any }> {
    return await this.updateDailyPlan({
      id: planId,
      status: 'dispatch_complete',
      current_step: 'route',
      dispatch_output: dispatchOutput,
      total_estimated_duration: dispatchOutput.scheduling_constraints.total_work_hours * 60
    });
  }

  /**
   * Update daily plan after route agent completion
   */
  static async completeRouteStep(
    planId: string, 
    routeOutput: RouteOutput
  ): Promise<{ data: DailyPlan | null; error: any }> {
    return await this.updateDailyPlan({
      id: planId,
      status: 'route_complete',
      current_step: 'inventory',
      route_output: routeOutput,
      total_distance: routeOutput.optimized_route.total_distance,
      total_estimated_duration: routeOutput.optimized_route.total_travel_time + routeOutput.optimized_route.total_work_time
    });
  }

  /**
   * Update daily plan after inventory agent completion
   */
  static async completeInventoryStep(
    planId: string, 
    inventoryOutput: InventoryOutput
  ): Promise<{ data: DailyPlan | null; error: any }> {
    // Update the plan with inventory output and any created hardware store jobs
    const updateData: any = {
      id: planId,
      status: 'inventory_complete',
      current_step: 'complete',
      inventory_output: inventoryOutput
    };

    // If hardware store jobs were created, add them to created_job_ids
    if (inventoryOutput.created_hardware_store_jobs.length > 0) {
      // First get the current plan to merge with existing created jobs
      const { data: currentPlan, error: fetchError } = await this.getDailyPlanById(planId);
      if (fetchError) {
        console.error('Error fetching current plan for hardware store job update:', fetchError);
        return { data: null, error: fetchError };
      }

      const existingCreatedJobs = currentPlan?.created_job_ids || [];
      updateData.created_job_ids = [...existingCreatedJobs, ...inventoryOutput.created_hardware_store_jobs];
    }

    return await this.updateDailyPlan(updateData);
  }

  /**
   * Cleanup stale daily plans (older than 30 minutes without progress)
   */
  static async cleanupStalePlans(): Promise<{ data: DailyPlan[] | null; error: any }> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('daily_plans')
        .update({ 
          status: 'error',
          error_state: {
            error_type: 'timeout',
            error_message: 'Plan execution timed out after 30 minutes',
            failed_step: 'dispatch',
            timestamp: new Date().toISOString(),
            retry_suggested: true,
            diagnostic_info: { reason: 'stale_plan_cleanup' }
          }
        })
        .in('status', ['pending', 'dispatch_complete', 'route_complete'])
        .lt('started_at', thirtyMinutesAgo)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error cleaning up stale plans:', error);
      return { data: null, error };
    }
  }

  /**
   * Get daily plans that need retry (failed with retry_suggested = true)
   */
  static async getRetryablePlans(userId: string): Promise<{ data: DailyPlan[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'error')
        .eq('error_state->>retry_suggested', 'true')
        .lt('retry_count', 3)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting retryable plans:', error);
      return { data: null, error };
    }
  }

  /**
   * Subscribe to daily plan changes for real-time updates
   */
  static subscribeToDailyPlan(
    userId: string, 
    planDate: string, 
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('daily_plan_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_plans',
          filter: `user_id=eq.${userId} AND planned_date=eq.${planDate}`
        },
        callback
      )
      .subscribe();
  }

  /**
   * Save user modifications to a daily plan
   */
  static async saveUserModifications(
    planId: string,
    modifications: UserModifications
  ): Promise<{ data: DailyPlan | null; error: any }> {
    try {
      // First get the current plan to merge modifications
      const { data: currentPlan, error: fetchError } = await this.getDailyPlanById(planId);
      if (fetchError) throw fetchError;

      if (!currentPlan) {
        throw new Error('Daily plan not found');
      }

      // Merge with existing modifications
      const mergedModifications = {
        ...currentPlan.user_modifications,
        ...modifications
      };

      return await this.updateDailyPlan({
        id: planId,
        user_modifications: mergedModifications
      });
    } catch (error) {
      console.error('Error saving user modifications:', error);
      return { data: null, error };
    }
  }

  /**
   * Create hardware store run jobs - Used by Inventory Agent
   */
  static async createHardwareStoreRunJobs(
    userId: string,
    planDate: string,
    storeLocations: Array<{
      store_name: string;
      address: string;
      coordinates: { latitude: number; longitude: number };
      estimated_visit_time: number;
      items_available: string[];
    }>
  ): Promise<{ data: string[] | null; error: any }> {
    try {
      const createdJobIds: string[] = [];

      for (const store of storeLocations) {
        const { data: jobData, error: jobError } = await supabase
          .from('job_locations')
          .insert([{
            user_id: userId,
            title: `Hardware Store Run - ${store.store_name}`,
            description: `Pick up parts: ${store.items_available.join(', ')}`,
            job_type: 'pickup',
            priority: 'medium',
            status: 'pending',
            latitude: store.coordinates.latitude,
            longitude: store.coordinates.longitude,
            address: store.address,
            scheduled_date: planDate,
            estimated_duration: store.estimated_visit_time,
            customer_name: store.store_name,
            instructions: `Items to pick up: ${store.items_available.join(', ')}`,
            required_items: [] // No inventory items required for pickup
          }])
          .select('id')
          .single();

        if (jobError) {
          console.error('Error creating hardware store job:', jobError);
          throw jobError;
        }

        createdJobIds.push(jobData.id);
      }

      return { data: createdJobIds, error: null };
    } catch (error) {
      console.error('Error creating hardware store run jobs:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all jobs for a daily plan (original + created)
   */
  static async getAllJobsForPlan(planId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data: plan, error: planError } = await this.getDailyPlanById(planId);
      if (planError) throw planError;

      if (!plan) {
        throw new Error('Daily plan not found');
      }

      // Combine original and created job IDs
      const allJobIds = [...plan.job_ids, ...(plan.created_job_ids || [])];

      if (allJobIds.length === 0) {
        return { data: [], error: null };
      }

      // Fetch all jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('job_locations')
        .select('*')
        .in('id', allJobIds)
        .order('scheduled_date', { ascending: true });

      if (jobsError) throw jobsError;

      return { data: jobs, error: null };
    } catch (error) {
      console.error('Error getting all jobs for plan:', error);
      return { data: null, error };
    }
  }
} 