/**
 * Daily Plan Hook - Real-time subscription to AI agent workflow
 * 
 * This hook manages the daily planning workflow state, providing real-time updates
 * as the LangGraph agents complete their tasks. It handles the three-step process:
 * 1. Dispatch Strategist - Job prioritization
 * 2. Route Optimizer - Travel route optimization  
 * 3. Inventory Specialist - Parts preparation and shopping lists
 */

import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { MockAgentService } from '@/services/mockAgentService';

// Mock daily plan interface (matches what MockAgentService returns)
interface DailyPlan {
  id: string;
  user_id: string;
  status: 'pending' | 'dispatch_complete' | 'route_complete' | 'inventory_complete' | 'approved' | 'cancelled' | 'error';
  current_step: 'dispatch' | 'route' | 'inventory' | 'complete' | null;
  dispatch_output: any;
  route_output: any;
  inventory_output: any;
  job_ids: string[];
  planned_date: string;
  created_at: string;
  updated_at: string;
}

interface UseDailyPlanOptions {
  /**
   * Whether to start planning immediately if no plan exists
   * @default false
   */
  autoStart?: boolean;
  
  /**
   * Jobs to include in the daily plan
   * Only used if autoStart is true
   */
  initialJobIds?: string[];
}

interface UseDailyPlanReturn {
  // Plan state
  dailyPlan: DailyPlan | null;
  isLoading: boolean;
  error: string | null;
  
  // Agent status
  currentStep: 'dispatch' | 'route' | 'inventory' | 'complete' | null;
  isProcessing: boolean;
  
  // Actions
  startPlanning: (jobIds: string[]) => Promise<void>;
  retryPlanning: () => Promise<void>;
  cancelPlanning: () => Promise<void>;
  approvePlan: () => Promise<void>;
  
  // Utility
  canRetry: boolean;
  retryCount: number;
  
  // Real-time status
  isConnected: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook for managing daily plan workflow with mock data
 * Provides complete state management for the Plan Your Day feature
 */
export const useDailyPlan = (
  planDate: string = new Date().toISOString().split('T')[0],
  options: UseDailyPlanOptions = {}
): UseDailyPlanReturn => {
  const [user] = useAtom(userAtom);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true); // Mock always connected
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Create a mock user if none exists
  const mockUser = user || { id: 'mock-user-123', email: 'test@tradeflow.com' };

  // Derived state
  const currentStep = dailyPlan?.current_step || null;
  const isProcessing = dailyPlan?.status === 'pending' || 
                       (dailyPlan?.status === 'dispatch_complete' && dailyPlan?.current_step === 'route') ||
                       (dailyPlan?.status === 'route_complete' && dailyPlan?.current_step === 'inventory');
  const canRetry = false; // Mock mode doesn't support retry
  const retryCount = 0;

  /**
   * Initialize and fetch current daily plan
   */
  const initializePlan = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get today's plan from MockAgentService
      const existingPlan = MockAgentService.getTodaysMockDailyPlan(mockUser.id);
      
      if (existingPlan) {
        setDailyPlan(existingPlan);
        setLastUpdated(new Date());
      } else {
        setDailyPlan(null);
      }

      // Auto-start if requested and no plan exists
      if (!existingPlan && options.autoStart && options.initialJobIds?.length) {
        await startPlanning(options.initialJobIds);
      }
    } catch (err) {
      console.error('Error initializing daily plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize daily plan');
    } finally {
      setIsLoading(false);
    }
  }, [mockUser.id, planDate, options.autoStart, options.initialJobIds]);

  /**
   * Start the daily planning workflow
   */
  const startPlanning = useCallback(async (jobIds: string[]) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting daily planning with jobs:', jobIds);

      // Use MockAgentService to start planning
      const result = await MockAgentService.planDay(mockUser.id, jobIds, planDate);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start planning');
      }

      // Get the created plan
      if (result.planId) {
        const createdPlan = MockAgentService.getMockDailyPlan(result.planId);
        if (createdPlan) {
          setDailyPlan(createdPlan);
          setLastUpdated(new Date());
        }
      }

      console.log('Daily planning started successfully');
    } catch (err) {
      console.error('Error starting planning:', err);
      setError(err instanceof Error ? err.message : 'Failed to start planning');
    } finally {
      setIsLoading(false);
    }
  }, [mockUser.id, planDate]);

  /**
   * Retry failed planning workflow
   */
  const retryPlanning = useCallback(async () => {
    if (!dailyPlan) return;

    try {
      setIsLoading(true);
      setError(null);

      // Clear existing plan and restart
      MockAgentService.clearMockData();
      const result = await MockAgentService.planDay(mockUser.id, dailyPlan.job_ids, planDate);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to retry planning');
      }

      // Get the new plan
      if (result.planId) {
        const newPlan = MockAgentService.getMockDailyPlan(result.planId);
        if (newPlan) {
          setDailyPlan(newPlan);
          setLastUpdated(new Date());
        }
      }

      console.log('Daily planning retried successfully');
    } catch (err) {
      console.error('Error retrying planning:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry planning');
    } finally {
      setIsLoading(false);
    }
  }, [dailyPlan, mockUser.id, planDate]);

  /**
   * Cancel the current daily plan
   */
  const cancelPlanning = useCallback(async () => {
    if (!dailyPlan) return;

    try {
      setError(null);
      
      // Clear the plan
      MockAgentService.clearMockData();
      setDailyPlan(null);
      setLastUpdated(new Date());

      console.log('Daily plan cancelled');
    } catch (err) {
      console.error('Error cancelling plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel plan');
    }
  }, [dailyPlan]);

  /**
   * Approve the final plan
   */
  const approvePlan = useCallback(async () => {
    if (!dailyPlan) return;

    try {
      setError(null);
      
      // Update plan status to approved
      const updatedPlan = { ...dailyPlan, status: 'approved' as const };
      setDailyPlan(updatedPlan);
      setLastUpdated(new Date());

      console.log('Daily plan approved');
    } catch (err) {
      console.error('Error approving plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve plan');
    }
  }, [dailyPlan]);

  // Initialize plan on mount and when dependencies change
  useEffect(() => {
    initializePlan();
  }, [initializePlan]);

  return {
    dailyPlan,
    isLoading,
    error,
    currentStep,
    isProcessing,
    startPlanning,
    retryPlanning,
    cancelPlanning,
    approvePlan,
    canRetry,
    retryCount,
    isConnected,
    lastUpdated,
  };
};

/**
 * Hook to get today's daily plan
 */
export const useTodaysPlan = (options?: UseDailyPlanOptions) => {
  return useDailyPlan(new Date().toISOString().split('T')[0], options);
}; 