/**
 * Agent Service - New 2-Function Edge Architecture
 * 
 * This service handles communication with separate dispatcher and inventory
 * edge functions. Replaces the old unified plan-day function.
 */

import { supabase } from './supabase';

// Dispatcher types
export interface DispatchJobsRequest {
  userId: string;
  jobIds: string[];
  planDate: string;
}

export interface DispatchJobsResponse {
  success: boolean;
  dispatch_output?: any;
  error?: string;
}

// Inventory types
export interface AnalyzeInventoryRequest {
  userId: string;
  jobIds: string[];
  dispatchOutput: any;
}

export interface AnalyzeInventoryResponse {
  success: boolean;
  inventory_output?: any;
  hardware_store_job?: any;
  error?: string;
}

export class AgentService {
  /**
   * Step 1: Dispatch jobs using the dispatcher edge function
   * Prioritizes and routes jobs (Emergency → Inspection → Service)
   */
  static async dispatchJobs(userId: string, jobIds: string[], planDate: string): Promise<DispatchJobsResponse> {
    try {
      console.log('🎯 Calling Dispatcher Edge Function...');
      console.log('📊 Request data:', { userId, jobIds, planDate });
      
      const { data, error } = await supabase.functions.invoke('dispatcher', {
        body: {
          userId,
          jobIds,
          planDate
        }
      });
      
      if (error) {
        console.error('❌ Dispatcher Edge Function error:', error);
        throw new Error(error.message || 'Dispatcher execution failed');
      }
      
      console.log('✅ Dispatcher response:', data);
      return data;
    } catch (error) {
      console.error('❌ Dispatcher service error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown dispatcher error'
      };
    }
  }

  /**
   * Step 2: Analyze inventory using the inventory edge function
   * Creates shopping list and hardware store job if needed
   */
  static async analyzeInventory(userId: string, jobIds: string[], dispatchOutput: any): Promise<AnalyzeInventoryResponse> {
    try {
      console.log('📦 Calling Inventory Edge Function...');
      console.log('📊 Request data:', { userId, jobIds: jobIds.length, dispatchJobs: dispatchOutput.prioritized_jobs?.length });
      
      const { data, error } = await supabase.functions.invoke('inventory', {
        body: {
          userId,
          jobIds,
          dispatchOutput
        }
      });
      
      if (error) {
        console.error('❌ Inventory Edge Function error:', error);
        throw new Error(error.message || 'Inventory analysis failed');
      }
      
      console.log('✅ Inventory response:', data);
      return data;
    } catch (error) {
      console.error('❌ Inventory service error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown inventory error'
      };
    }
  }
} 