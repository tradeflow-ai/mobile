/**
 * Agent Service - Supabase Edge Functions Client
 * 
 * This service handles communication with the LangGraph workflow running
 * in Supabase Edge Functions. The agents execute server-side to avoid
 * React Native compatibility issues with LangGraph.
 */

import { supabase } from './supabase';

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

export class AgentService {
  /**
   * Trigger the daily planning workflow
   * This will start the LangGraph agent crew in Supabase Edge Functions
   */
  static async planDay(userId: string, jobIds: string[], planDate: string): Promise<PlanDayResponse> {
    try {
      console.log('🚀 Calling Supabase Edge Function to plan day...');
      console.log('📊 Request data:', { userId, jobIds, planDate });
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('plan-day', {
        body: {
          userId,
          jobIds,
          planDate
        }
      });
      
      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(error.message || 'Edge Function execution failed');
      }
      
      console.log('✅ Edge Function response:', data);
      return data;
    } catch (error) {
      console.error('❌ Agent service error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return error response in consistent format
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 