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
import { DailyPlanService, type DailyPlan, type UserModifications } from '@/services/dailyPlanService';
import { AgentService } from '@/services/agentService';

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
  saveUserModifications: (modifications: UserModifications) => Promise<void>;
  approvePlan: () => Promise<void>;
  
  // Step-specific actions
  confirmDispatch: (modifications?: UserModifications) => Promise<void>;
  confirmRoute: (modifications?: UserModifications) => Promise<void>;
  confirmInventory: (modifications?: UserModifications) => Promise<void>;
  
  // Utility
  canRetry: boolean;
  retryCount: number;
  
  // Real-time status
  isConnected: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook for managing daily plan workflow with real-time updates
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
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Derived state
  const currentStep = dailyPlan?.current_step || null;
  const isProcessing = dailyPlan?.status === 'pending' || 
                       (dailyPlan?.status === 'dispatch_complete' && dailyPlan?.current_step === 'route') ||
                       (dailyPlan?.status === 'route_complete' && dailyPlan?.current_step === 'inventory');
  const canRetry = dailyPlan?.status === 'error' && 
                   (dailyPlan?.error_state?.retry_suggested || false) &&
                   (dailyPlan?.retry_count || 0) < 3;
  const retryCount = dailyPlan?.retry_count || 0;

  /**
   * Initialize and fetch current daily plan
   */
  const initializePlan = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await DailyPlanService.getCurrentDailyPlan(user.id, planDate);
      
      if (fetchError) {
        console.error('Error fetching daily plan:', fetchError);
        setError('Failed to load daily plan');
        return;
      }

      setDailyPlan(data);
      setLastUpdated(new Date());

      // Auto-start if requested and no plan exists
      if (!data && options.autoStart && options.initialJobIds?.length) {
        await startPlanning(options.initialJobIds);
      }
    } catch (err) {
      console.error('Error initializing daily plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize daily plan');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, planDate, options.autoStart, options.initialJobIds]);

  /**
   * Start the daily planning workflow
   */
  const startPlanning = useCallback(async (jobIds: string[]) => {
    if (!user?.id) {
      setError('No authenticated user');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use AgentService to start the workflow
      const result = await AgentService.planDay(user.id, jobIds, planDate);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start planning');
      }

      // The real-time subscription will update the state as the workflow progresses
      console.log('Daily planning started:', result.planId);
    } catch (err) {
      console.error('Error starting planning:', err);
      setError(err instanceof Error ? err.message : 'Failed to start planning');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, planDate]);

  /**
   * Retry failed planning workflow
   */
  const retryPlanning = useCallback(async () => {
    if (!dailyPlan || !canRetry) return;

    try {
      setIsLoading(true);
      setError(null);

      // Use AgentService to retry the workflow
      const result = await AgentService.planDay(user!.id, dailyPlan.job_ids, planDate);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to retry planning');
      }

      console.log('Daily planning retried:', result.planId);
    } catch (err) {
      console.error('Error retrying planning:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry planning');
    } finally {
      setIsLoading(false);
    }
  }, [dailyPlan, canRetry, user, planDate]);

  /**
   * Cancel the current daily plan
   */
  const cancelPlanning = useCallback(async () => {
    if (!dailyPlan) return;

    try {
      setError(null);
      
      const { error: cancelError } = await DailyPlanService.cancelDailyPlan(dailyPlan.id);
      
      if (cancelError) {
        throw cancelError;
      }

      console.log('Daily plan cancelled:', dailyPlan.id);
    } catch (err) {
      console.error('Error cancelling plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel plan');
    }
  }, [dailyPlan]);

  /**
   * Save user modifications to the daily plan
   */
  const saveUserModifications = useCallback(async (modifications: UserModifications) => {
    if (!dailyPlan) return;

    try {
      setError(null);
      
      const { error: saveError } = await DailyPlanService.saveUserModifications(dailyPlan.id, modifications);
      
      if (saveError) {
        throw saveError;
      }

      console.log('User modifications saved:', modifications);
    } catch (err) {
      console.error('Error saving modifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to save modifications');
    }
  }, [dailyPlan]);

  /**
   * Approve the final daily plan
   */
  const approvePlan = useCallback(async () => {
    if (!dailyPlan) return;

    try {
      setError(null);
      
      const { error: approveError } = await DailyPlanService.approveDailyPlan(dailyPlan.id);
      
      if (approveError) {
        throw approveError;
      }

      console.log('Daily plan approved:', dailyPlan.id);
    } catch (err) {
      console.error('Error approving plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve plan');
    }
  }, [dailyPlan]);

  /**
   * Confirm dispatch step and proceed to route
   */
  const confirmDispatch = useCallback(async (modifications?: UserModifications) => {
    if (!dailyPlan || dailyPlan.status !== 'dispatch_complete') return;

    try {
      setError(null);
      
      // Save modifications if provided
      if (modifications) {
        await saveUserModifications(modifications);
      }

      // Continue to route step by triggering the agent
      // The agent will automatically proceed to the next step
      console.log('Dispatch confirmed, proceeding to route optimization');
    } catch (err) {
      console.error('Error confirming dispatch:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm dispatch');
    }
  }, [dailyPlan, saveUserModifications]);

  /**
   * Confirm route step and proceed to inventory
   */
  const confirmRoute = useCallback(async (modifications?: UserModifications) => {
    if (!dailyPlan || dailyPlan.status !== 'route_complete') return;

    try {
      setError(null);
      
      // Save modifications if provided
      if (modifications) {
        await saveUserModifications(modifications);
      }

      // Continue to inventory step
      console.log('Route confirmed, proceeding to inventory check');
    } catch (err) {
      console.error('Error confirming route:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm route');
    }
  }, [dailyPlan, saveUserModifications]);

  /**
   * Confirm inventory step and complete planning
   */
  const confirmInventory = useCallback(async (modifications?: UserModifications) => {
    if (!dailyPlan || dailyPlan.status !== 'inventory_complete') return;

    try {
      setError(null);
      
      // Save modifications if provided
      if (modifications) {
        await saveUserModifications(modifications);
      }

      // Complete the planning process
      await approvePlan();
      console.log('Inventory confirmed, planning complete');
    } catch (err) {
      console.error('Error confirming inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm inventory');
    }
  }, [dailyPlan, saveUserModifications, approvePlan]);

  /**
   * Set up real-time subscription to daily plan changes
   */
  useEffect(() => {
    if (!user?.id) return;

    let subscription: any = null;

    const setupSubscription = () => {
      try {
        subscription = DailyPlanService.subscribeToDailyPlan(
          user.id,
          planDate,
          (payload) => {
            console.log('Daily plan real-time update:', payload);
            setIsConnected(true);
            setLastUpdated(new Date());

            if (payload.eventType === 'UPDATE') {
              setDailyPlan(payload.new);
            } else if (payload.eventType === 'INSERT') {
              setDailyPlan(payload.new);
            } else if (payload.eventType === 'DELETE') {
              setDailyPlan(null);
            }
          }
        );

        // Connection established
        setIsConnected(true);
        console.log('Daily plan subscription established');
      } catch (err) {
        console.error('Error setting up daily plan subscription:', err);
        setIsConnected(false);
      }
    };

    // Set up subscription after initial load
    const timer = setTimeout(setupSubscription, 1000);

    return () => {
      clearTimeout(timer);
      if (subscription) {
        subscription.unsubscribe();
        console.log('Daily plan subscription cleaned up');
      }
    };
  }, [user?.id, planDate]);

  /**
   * Initialize plan on mount and user change
   */
  useEffect(() => {
    initializePlan();
  }, [initializePlan]);

  return {
    // Plan state
    dailyPlan,
    isLoading,
    error,
    
    // Agent status
    currentStep,
    isProcessing,
    
    // Actions
    startPlanning,
    retryPlanning,
    cancelPlanning,
    saveUserModifications,
    approvePlan,
    
    // Step-specific actions
    confirmDispatch,
    confirmRoute,
    confirmInventory,
    
    // Utility
    canRetry,
    retryCount,
    
    // Real-time status
    isConnected,
    lastUpdated,
  };
};

/**
 * Convenience hook for today's daily plan
 * Most common use case for the Plan Your Day feature
 */
export const useTodaysPlan = (options?: UseDailyPlanOptions) => {
  const today = new Date().toISOString().split('T')[0];
  return useDailyPlan(today, options);
}; 