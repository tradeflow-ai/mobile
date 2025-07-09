/**
 * Agent Service - Client-Side AI Agent Execution
 * 
 * Per tech stack requirements, this service runs LangGraph agents CLIENT-SIDE
 * in React Native and saves results to Supabase. No Express backend needed.
 * 
 * Backend is reserved for VROOM/OSRM routing engine only (Task 7).
 */

import { supabase } from './supabase';
import { DispatchStrategistAgent } from '../agent/agents';

export interface PlanDayRequest {
  userId: string;
  jobIds: string[];
  planDate: string;
}

export interface PlanDayResponse {
  success: boolean;
  planId?: string;
  status?: string;
  currentStep?: string;
  error?: string;
}

/**
 * Generate a UUID v4 for testing purposes
 */
function generateTestUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Convert mock job IDs to proper UUIDs for testing
 */
function convertMockJobIdsToUUIDs(jobIds: string[]): string[] {
  return jobIds.map(jobId => {
    // If already a UUID, return as is
    if (jobId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return jobId;
    }
    
    // Generate a deterministic UUID for mock job IDs
    const mockJobMapping: { [key: string]: string } = {
      'job-1': '550e8400-e29b-41d4-a716-446655440001',
      'job-2': '550e8400-e29b-41d4-a716-446655440002',
      'job-3': '550e8400-e29b-41d4-a716-446655440003',
    };
    
    return mockJobMapping[jobId] || generateTestUUID();
  });
}

export class AgentService {
  /**
   * Check if the agent service is healthy (Supabase connectivity)
   */
  static async checkHealth(): Promise<boolean> {
    try {
      console.log('🔍 Checking Supabase connectivity...');
      
      // Test Supabase connection by querying daily_plans table
      const { data, error } = await supabase
        .from('daily_plans')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase health check failed:', error);
        return false;
      }
      
      console.log('✅ Supabase health check passed');
      return true;
    } catch (error) {
      console.error('❌ Agent service health check failed:', error);
      return false;
    }
  }
  
  /**
   * Trigger the daily planning workflow (CLIENT-SIDE)
   * Runs the dispatch agent client-side and saves results to Supabase
   */
  static async planDay(userId: string, jobIds: string[], planDate: string): Promise<PlanDayResponse> {
    try {
      console.log('🚀 Starting client-side agent execution...');
      
      // Convert mock job IDs to proper UUIDs
      const properJobIds = convertMockJobIdsToUUIDs(jobIds);
      console.log('🔄 Converted job IDs:', { original: jobIds, converted: properJobIds });
      
      console.log('📊 Request data:', { userId, jobIds: properJobIds, planDate });
      
      // Create initial daily plan record in Supabase
      // Get current authenticated user (or create a test session if needed)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      let currentUserId;
      if (user) {
        // Use authenticated user ID
        console.log('✅ Using authenticated user:', user.id);
        currentUserId = user.id;
      } else {
        // For testing: Create a temporary anonymous session
        console.log('🔒 No authenticated user, creating anonymous session...');
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) throw new Error(`Auth error: ${anonError.message}`);
        console.log('✅ Anonymous session created:', anonData.user.id);
        currentUserId = anonData.user.id;
      }
      
      const { data: planData, error: planError } = await supabase
        .from('daily_plans')
        .insert({
          user_id: currentUserId,
          status: 'pending',
          current_step: 'dispatch',
          dispatch_output: null,
          route_output: null,
          inventory_output: null,
          user_modifications: null,
          preferences_snapshot: null,
          error_state: null,
          planned_date: planDate,
          job_ids: properJobIds, // Use proper UUIDs
        })
        .select()
        .single();

      if (planError) {
        throw new Error(`Failed to create plan: ${planError.message}`);
      }

      const planId = planData.id;
      console.log('📋 Created daily plan:', planId);

      // Update status to indicate dispatch is running  
      await supabase
        .from('daily_plans')
        .update({
          status: 'pending',
          current_step: 'dispatch',
        })
        .eq('id', planId);

      // Run the dispatch agent client-side with proper context
      const dispatchAgent = new DispatchStrategistAgent();
      const mockContext = {
        userId: currentUserId,
        planId: planId, // CRITICAL: Add planId to context
        jobIds: properJobIds, // Use proper UUIDs
        planDate,
        preferences: {
          vip_client_ids: ['vip-customer-1'],
          emergency_job_types: ['emergency', 'urgent'],
          work_start_time: '08:00',
          work_end_time: '17:00',
          lunch_break_start: '12:00',
          lunch_break_end: '13:00',
          job_duration_buffer_minutes: 15,
          emergency_buffer_minutes: 30,
          demand_response_time_hours: 24,
          emergency_response_time_minutes: 60,
          maintenance_response_time_days: 7
        }
      };

      const dispatchResult = await dispatchAgent.execute(mockContext);

      // Save dispatch results to Supabase
      const { error: updateError } = await supabase
        .from('daily_plans')
        .update({
          status: 'dispatch_complete',  // ✅ Tracks what's completed
          current_step: 'route',        // ✅ Tracks next step to execute
          dispatch_output: dispatchResult,
        })
        .eq('id', planId);

      if (updateError) {
        throw new Error(`Failed to save dispatch results: ${updateError.message}`);
      }

      console.log(`✅ Daily plan created: ${planId}`);
      console.log(`👤 User ID: ${currentUserId}`);
      console.log(`🎯 Dispatch results: ${dispatchResult.prioritized_jobs.length} jobs prioritized`);
      console.log(`📊 Emergency jobs: ${dispatchResult.optimization_summary.emergency_jobs}`);
      console.log(`⭐ VIP clients: ${dispatchResult.optimization_summary.vip_clients}`);

      return {
        success: true,
        planId,
        status: 'dispatch_complete',
        currentStep: 'route',  // ✅ Next step to execute
      };
    } catch (error) {
      console.error('❌ Agent service error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 