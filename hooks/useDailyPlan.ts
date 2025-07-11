/**
 * Daily Plan Hook - Real-time subscription to AI agent workflow
 * 
 * This hook manages the daily planning workflow state, providing real-time updates
 * as the Edge Functions complete their tasks. It handles the two-step process:
 * 1. Dispatcher - Job prioritization and route optimization
 * 2. Inventory - Parts preparation and hardware store jobs
 */

import { useState, useEffect, useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { userAtom, activeJobAtom } from '@/store/atoms';
import { DailyPlanService, type DailyPlan, type UserModifications } from '@/services/dailyPlanService';
import { AgentService } from '@/services/agentService';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryClient';
import { JobLocation } from './useJobs';

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
  currentStep: 'dispatcher' | 'confirmation' | 'inventory' | 'complete' | null;
  isProcessing: boolean;
  
  // Actions
  startPlanning: (jobIds: string[]) => Promise<void>;
  retryPlanning: () => Promise<void>;
  cancelPlanning: () => Promise<void>;
  saveUserModifications: (modifications: UserModifications) => Promise<void>;
  approvePlan: () => Promise<void>;
  resetPlan: () => void;
  
  // Step-specific actions
  confirmDispatcherOutput: (modifications?: UserModifications) => Promise<void>;
  proceedToInventory: () => Promise<void>;
  confirmInventory: (modifications?: UserModifications) => Promise<void>;
  
  // New workflow support
  isAwaitingConfirmation: boolean;
  hasHardwareStoreJob: boolean;
  
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
  const setActiveJob = useSetAtom(activeJobAtom);
  const queryClient = useQueryClient();
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Derived state
  const currentStep = dailyPlan?.current_step || null;
  const isProcessing = dailyPlan?.status === 'pending' || 
                       dailyPlan?.current_step === 'dispatcher' ||
                       dailyPlan?.current_step === 'inventory';
  const isAwaitingConfirmation = dailyPlan?.status === 'dispatcher_complete' ||
                                dailyPlan?.status === 'awaiting_confirmation';
  const hasHardwareStoreJob = dailyPlan?.status === 'hardware_store_added' ||
                             dailyPlan?.inventory_output?.hardware_store_job != null;
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
   * Start the daily planning workflow - Step 1: Dispatcher
   */
  const startPlanning = useCallback(async (jobIds: string[]) => {
    if (!user?.id) {
      setError('No authenticated user');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDailyPlan(null); // 🔄 Clear existing plan state

      // 🔧 FIX: Clean up any existing daily plan for today first
      console.log('🧹 Checking for existing daily plan to clean up...');
      const { data: existingPlan } = await DailyPlanService.getCurrentDailyPlan(user.id, planDate);
      
      if (existingPlan) {
        console.log('🗑️ Found existing plan, cancelling it first:', existingPlan.id);
        await DailyPlanService.cancelDailyPlan(existingPlan.id);
        console.log('✅ Existing plan cancelled, creating fresh plan');
      } else {
        console.log('🆕 No existing plan found, proceeding with fresh creation');
      }

      // Create daily plan record
      const preferences = {}; // TODO: Get user preferences
      const { data: plan, error: createError } = await DailyPlanService.createDailyPlan({
        user_id: user.id,
        planned_date: planDate,
        job_ids: jobIds,
        preferences_snapshot: preferences
      });

      if (createError || !plan) {
        throw new Error(createError?.message || 'Failed to create daily plan');
      }

      setDailyPlan(plan);
      console.log('🆕 Fresh daily plan created:', plan.id);

      // Step 1: Call dispatcher edge function
      console.log('🎯 Starting dispatcher edge function...');
      const dispatchResult = await AgentService.dispatchJobs(user.id, jobIds, planDate);
      
      if (!dispatchResult.success) {
        throw new Error(dispatchResult.error || 'Failed to dispatch jobs');
      }

      // Update plan with dispatcher output
      console.log('📝 Updating daily plan with dispatcher output...');
      const { data: updatedPlan, error: updateError } = await DailyPlanService.completeDispatcherStep(plan.id, dispatchResult.dispatch_output);

      if (updateError) {
        console.error('❌ Failed to update daily plan:', updateError);
        throw new Error(`Failed to save dispatcher results: ${updateError.message || updateError}`);
      }

      console.log('🎯 Dispatcher completed successfully');
      console.log('✅ Daily plan updated:', updatedPlan?.id, 'Status:', updatedPlan?.status);
      
      // 🔧 CRITICAL FIX: Update local React state immediately
      setDailyPlan(updatedPlan);
    } catch (err) {
      console.error('Error starting planning:', err);
      setError(err instanceof Error ? err.message : 'Failed to start planning');
      setDailyPlan(null); // 🔄 Clear plan state on error
    } finally {
      setIsLoading(false); // 🔄 Ensure it's always called
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

      // Retry from the failed step
      if (dailyPlan.error_state?.failed_step === 'dispatcher') {
        // Retry dispatcher step
        const dispatchResult = await AgentService.dispatchJobs(user!.id, dailyPlan.job_ids, planDate);
        
        if (!dispatchResult.success) {
          throw new Error(dispatchResult.error || 'Failed to retry dispatcher');
        }

        await DailyPlanService.completeDispatcherStep(dailyPlan.id, dispatchResult.dispatch_output);
        console.log('🎯 Dispatcher retried successfully');
      } else if (dailyPlan.error_state?.failed_step === 'inventory') {
        // Retry inventory step
        const inventoryResult = await AgentService.analyzeInventory(
          user!.id, 
          dailyPlan.job_ids, 
          dailyPlan.dispatcher_output
        );
        
        if (!inventoryResult.success) {
          throw new Error(inventoryResult.error || 'Failed to retry inventory');
        }

        await DailyPlanService.completeInventoryStep(dailyPlan.id, inventoryResult.inventory_output);
        console.log('📦 Inventory retried successfully');
      }
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
      
      const { data: approvedPlan, error: approveError } = await DailyPlanService.approveDailyPlan(dailyPlan.id);
      
      if (approveError) {
        throw approveError;
      }

      if (approvedPlan) {
        // The dispatcher output contains the definitive, final order of jobs,
        // including any hardware store runs. We just need to pick the first one.
        if (approvedPlan.dispatcher_output?.prioritized_jobs?.length > 0) {
          const firstJobId = approvedPlan.dispatcher_output.prioritized_jobs[0].job_id;
          
          // Fetch the full job details from the cache or network
          const jobDetails = await queryClient.fetchQuery<JobLocation | null>({
            queryKey: queryKeys.job(firstJobId),
          });

          if (jobDetails) {
            setActiveJob(jobDetails);
          } else {
            console.warn(`Could not fetch details for the first job (ID: ${firstJobId}).`);
          }
        }
      }

      console.log('Daily plan approved:', dailyPlan.id);
    } catch (err) {
      console.error('Error approving plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve plan');
    }
  }, [dailyPlan, setActiveJob, queryClient]);

  /**
   * Confirm dispatcher output and mark as ready for inventory
   */
  const confirmDispatcherOutput = useCallback(async (modifications?: UserModifications) => {
    if (!dailyPlan || dailyPlan.status !== 'dispatcher_complete') return;

    try {
      setError(null);
      
      // Save modifications if provided
      if (modifications) {
        await saveUserModifications(modifications);
      }

      // Mark as awaiting inventory analysis
      await DailyPlanService.markAwaitingInventoryAnalysis(dailyPlan.id);
      console.log('✅ Dispatcher output confirmed, ready for inventory analysis');
    } catch (err) {
      console.error('Error confirming dispatcher output:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm dispatcher output');
    }
  }, [dailyPlan, saveUserModifications]);

  /**
   * Proceed to inventory analysis step
   */
  const proceedToInventory = useCallback(async () => {
    if (!dailyPlan || !dailyPlan.dispatcher_output) return;

    try {
      setIsLoading(true);
      setError(null);

      // Step 2: Call inventory edge function
      const inventoryResult = await AgentService.analyzeInventory(
        user!.id, 
        dailyPlan.job_ids, 
        dailyPlan.dispatcher_output
      );
      
      if (!inventoryResult.success) {
        throw new Error(inventoryResult.error || 'Failed to analyze inventory');
      }

      // Update plan with inventory output
      await DailyPlanService.completeInventoryStep(dailyPlan.id, inventoryResult.inventory_output);

      console.log('📦 Inventory analysis completed successfully');
      
      if (inventoryResult.hardware_store_job) {
        console.log('🛒 Hardware store job created');
      }
    } catch (err) {
      console.error('Error proceeding to inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to proceed to inventory');
    } finally {
      setIsLoading(false);
    }
  }, [dailyPlan, user]);

  /**
   * Confirm inventory step and complete planning
   */
  const confirmInventory = useCallback(async (modifications?: UserModifications) => {
    if (!dailyPlan || (dailyPlan.status !== 'ready_for_execution' && dailyPlan.status !== 'hardware_store_added')) return;

    try {
      setError(null);
      
      // Save modifications if provided
      if (modifications) {
        await saveUserModifications(modifications);
      }

      // Complete the planning process
      await approvePlan();
      console.log('✅ Inventory confirmed, planning complete');
      
      if (hasHardwareStoreJob) {
        console.log('🛒 Hardware store job included in final plan');
      }
    } catch (err) {
      console.error('Error confirming inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm inventory');
    }
  }, [dailyPlan, saveUserModifications, approvePlan, hasHardwareStoreJob]);

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

    // Set up subscription immediately - no delay
    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('Daily plan subscription cleaned up');
      }
    };
  }, [user?.id, planDate]);

  /**
   * Reset the daily plan state completely
   */
  const resetPlan = useCallback(() => {
    setDailyPlan(null);
    setError(null);
    setIsLoading(false);
    setLastUpdated(null);
    console.log('🔄 Daily plan state reset');
  }, []);

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
    resetPlan, // 🔄 Add reset functionality
    
    // Step-specific actions
    confirmDispatcherOutput,
    proceedToInventory,
    confirmInventory,
    
    // New workflow support
    isAwaitingConfirmation,
    hasHardwareStoreJob,
    
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