/**
 * Onboarding Data Hooks - TanStack Query integration
 * Provides data access for onboarding flow management, progress tracking, and analytics
 * Josh needs these for his onboarding UI components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { 
  OnboardingService, 
  OnboardingPreferences, 
  OnboardingConfiguration, 
  OnboardingAnalyticsEvent,
  WorkScheduleData,
  TimeBuffersData,
  SuppliersData,
  ValidationResult 
} from '@/services/onboardingService';
import { queryKeys, invalidateQueries, handleQueryError } from '@/services/queryClient';

// ==================== TYPES ====================

export interface OnboardingStatus {
  preferences: OnboardingPreferences | null;
  configuration: OnboardingConfiguration | null;
  completionScore: number;
  isCompleted: boolean;
  nextStep: string | null;
}

export interface OnboardingStepData {
  'work-schedule': WorkScheduleData;
  'time-buffers': TimeBuffersData;
  'suppliers': SuppliersData;
}

export type OnboardingStepName = keyof OnboardingStepData;

// ==================== QUERY HOOKS ====================

/**
 * Get onboarding configuration
 * Josh needs this for dynamic onboarding flow configuration
 */
export const useOnboardingConfiguration = () => {
  return useQuery({
    queryKey: queryKeys.onboardingConfig(),
    queryFn: async (): Promise<OnboardingConfiguration | null> => {
      const { data, error } = await OnboardingService.getOnboardingConfiguration();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour for configuration (rarely changes)
  });
};

/**
 * Get user onboarding preferences
 * Josh needs this for tracking user progress through onboarding
 */
export const useOnboardingPreferences = (userId?: string) => {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: queryKeys.onboardingPreferences(targetUserId || ''),
    queryFn: async (): Promise<OnboardingPreferences | null> => {
      if (!targetUserId) {
        throw new Error('No user ID available');
      }
      
      const { data, error } = await OnboardingService.getUserOnboardingPreferences(targetUserId);
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes for preferences
  });
};

/**
 * Get comprehensive onboarding status
 * Josh needs this for determining current onboarding state and next steps
 */
export const useOnboardingStatus = (userId?: string) => {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: queryKeys.onboardingStatus(targetUserId || ''),
    queryFn: async (): Promise<OnboardingStatus | null> => {
      if (!targetUserId) {
        throw new Error('No user ID available');
      }
      
      const { data, error } = await OnboardingService.getOnboardingStatus(targetUserId);
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 1, // 1 minute for status (dynamic)
  });
};

/**
 * Get current user's onboarding status with automatic updates
 * Josh needs this for the main onboarding flow
 */
export const useCurrentUserOnboarding = () => {
  const [user] = useAtom(userAtom);
  
  const statusQuery = useOnboardingStatus(user?.id);
  const preferencesQuery = useOnboardingPreferences(user?.id);
  const configQuery = useOnboardingConfiguration();
  
  return {
    ...statusQuery,
    status: statusQuery.data,
    preferences: preferencesQuery.data,
    configuration: configQuery.data,
    isAuthenticated: !!user,
    user,
    isLoading: statusQuery.isLoading || preferencesQuery.isLoading || configQuery.isLoading,
    error: statusQuery.error || preferencesQuery.error || configQuery.error,
  };
};

/**
 * Get onboarding analytics for a user
 * Josh needs this for progress tracking and analytics display
 */
export const useOnboardingAnalytics = (userId?: string) => {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: queryKeys.onboardingAnalytics(targetUserId || ''),
    queryFn: async (): Promise<OnboardingAnalyticsEvent[]> => {
      if (!targetUserId) {
        throw new Error('No user ID available');
      }
      
      const { data, error } = await OnboardingService.getOnboardingAnalytics(targetUserId);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes for analytics
  });
};

// ==================== MUTATION HOOKS ====================

/**
 * Initialize onboarding for a user
 * Josh needs this when starting onboarding flow
 */
export const useInitializeOnboarding = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (userId?: string) => {
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await OnboardingService.initializeOnboarding(targetUserId);

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      if (data && user?.id) {
        // Update caches
        queryClient.setQueryData(
          queryKeys.onboardingPreferences(user.id),
          data
        );
        
        // Invalidate related queries
        invalidateQueries.userOnboarding(user.id);
      }
    },
    onError: (error) => {
      console.error('Onboarding initialization failed:', error);
      handleQueryError(error, ['onboarding', 'initialize']);
    },
  });
};

/**
 * Update onboarding preferences for a specific step
 * Josh needs this for saving step progress and data
 */
export const useUpdateOnboardingStep = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (params: {
      stepName: OnboardingStepName;
      stepData: OnboardingStepData[OnboardingStepName];
      completed?: boolean;
      userId?: string;
    }) => {
      const { stepName, stepData, completed = false, userId } = params;
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await OnboardingService.updateOnboardingPreferences(
        targetUserId,
        stepName,
        stepData,
        completed
      );

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const targetUserId = variables.userId || user?.id;
      
      if (data && targetUserId) {
        // Update preferences cache
        queryClient.setQueryData(
          queryKeys.onboardingPreferences(targetUserId),
          data
        );
        
        // Invalidate status and analytics
        invalidateQueries.userOnboarding(targetUserId);
      }
    },
    onError: (error) => {
      console.error('Onboarding step update failed:', error);
      handleQueryError(error, ['onboarding', 'update']);
    },
  });
};

/**
 * Skip an onboarding step
 * Josh needs this for allowing users to skip optional steps
 */
export const useSkipOnboardingStep = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (params: {
      stepName: OnboardingStepName;
      reason: string;
      userId?: string;
    }) => {
      const { stepName, reason, userId } = params;
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await OnboardingService.skipStep(
        targetUserId,
        stepName,
        reason
      );

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const targetUserId = variables.userId || user?.id;
      
      if (data && targetUserId) {
        // Update preferences cache
        queryClient.setQueryData(
          queryKeys.onboardingPreferences(targetUserId),
          data
        );
        
        // Invalidate status and analytics
        invalidateQueries.userOnboarding(targetUserId);
      }
    },
    onError: (error) => {
      console.error('Onboarding step skip failed:', error);
      handleQueryError(error, ['onboarding', 'skip']);
    },
  });
};

/**
 * Track onboarding progress analytics
 * Josh needs this for capturing user interactions and analytics
 */
export const useTrackOnboardingProgress = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (event: Omit<OnboardingAnalyticsEvent, 'user_id'>) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await OnboardingService.trackOnboardingProgress({
        ...event,
        user_id: user.id,
      });

      if (error) {
        throw error;
      }

      return event;
    },
    onSuccess: () => {
      if (user?.id) {
        // Invalidate analytics cache
        queryClient.invalidateQueries({
          queryKey: queryKeys.onboardingAnalytics(user.id)
        });
      }
    },
    onError: (error) => {
      console.error('Onboarding analytics tracking failed:', error);
      // Don't show error to user for analytics failures
    },
  });
};

/**
 * Reset onboarding for a user (testing utility)
 * Josh needs this for testing and development
 */
export const useResetOnboarding = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (userId?: string) => {
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        throw new Error('No authenticated user');
      }

      const { error } = await OnboardingService.resetOnboarding(targetUserId);

      if (error) {
        throw error;
      }

      return targetUserId;
    },
    onSuccess: (targetUserId) => {
      // Clear all onboarding-related caches
      queryClient.removeQueries({
        queryKey: queryKeys.onboardingPreferences(targetUserId)
      });
      queryClient.removeQueries({
        queryKey: queryKeys.onboardingStatus(targetUserId)
      });
      queryClient.removeQueries({
        queryKey: queryKeys.onboardingAnalytics(targetUserId)
      });
    },
    onError: (error) => {
      console.error('Onboarding reset failed:', error);
      handleQueryError(error, ['onboarding', 'reset']);
    },
  });
};

// ==================== VALIDATION HOOKS ====================

/**
 * Validate onboarding step data
 * Josh needs this for real-time form validation
 */
export const useOnboardingValidation = () => {
  return useMutation({
    mutationFn: async (params: {
      stepName: OnboardingStepName;
      stepData: OnboardingStepData[OnboardingStepName];
    }): Promise<ValidationResult> => {
      const { stepName, stepData } = params;
      
      const result = await OnboardingService.validateStepData(stepName, stepData);
      return result;
    },
    onError: (error) => {
      console.error('Onboarding validation failed:', error);
    },
  });
};

// ==================== UTILITY HOOKS ====================

/**
 * Check if user needs onboarding
 * Josh needs this for routing and conditional rendering
 */
export const useOnboardingRequired = () => {
  const { status, isLoading } = useCurrentUserOnboarding();
  
  const isRequired = status ? !status.isCompleted : true;
  const nextStep = status?.nextStep || 'work-schedule';
  const completionScore = status?.completionScore || 0;
  
  return {
    isRequired,
    nextStep,
    completionScore,
    isLoading,
    canSkip: status?.configuration?.flow_configuration?.allow_skip || false,
  };
};

/**
 * Get onboarding progress percentage
 * Josh needs this for progress indicators
 */
export const useOnboardingProgress = () => {
  const { status, isLoading } = useCurrentUserOnboarding();
  
  const progress = status?.completionScore || 0;
  const isCompleted = status?.isCompleted || false;
  const currentStep = status?.nextStep || 'work-schedule';
  const stepsCompleted = status?.preferences?.steps_completed || [];
  
  const stepProgress = {
    'work-schedule': stepsCompleted.includes('work-schedule'),
    'time-buffers': stepsCompleted.includes('time-buffers'),
    'suppliers': stepsCompleted.includes('suppliers'),
  };
  
  return {
    progress,
    isCompleted,
    currentStep,
    stepProgress,
    isLoading,
    totalSteps: 3,
    completedSteps: stepsCompleted.length,
  };
};

/**
 * Get onboarding step configuration
 * Josh needs this for dynamic step rendering
 */
export const useOnboardingStepConfig = (stepName: OnboardingStepName) => {
  const { data: configuration } = useOnboardingConfiguration();
  
  const stepConfig = configuration?.step_definitions?.[stepName];
  const flowConfig = configuration?.flow_configuration;
  
  return {
    step: stepConfig,
    flow: flowConfig,
    isRequired: stepConfig?.required || false,
    points: stepConfig?.points || 0,
    title: stepConfig?.title || '',
    description: stepConfig?.description || '',
    defaultValues: stepConfig?.default_values || {},
  };
};

/**
 * Prefetch onboarding data
 * Josh needs this for performance optimization
 */
export const usePrefetchOnboarding = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return {
    prefetchStatus: () => {
      if (user?.id) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.onboardingStatus(user.id),
          queryFn: async () => {
            const { data } = await OnboardingService.getOnboardingStatus(user.id);
            return data;
          },
        });
      }
    },
    prefetchConfiguration: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.onboardingConfig(),
        queryFn: async () => {
          const { data } = await OnboardingService.getOnboardingConfiguration();
          return data;
        },
      });
    },
  };
};

/**
 * Combined onboarding hook for Josh's main onboarding screens
 * This is the primary hook Josh should use for onboarding components
 */
export const useOnboarding = () => {
  const currentUser = useCurrentUserOnboarding();
  const progress = useOnboardingProgress();
  const required = useOnboardingRequired();
  const updateStep = useUpdateOnboardingStep();
  const skipStep = useSkipOnboardingStep();
  const trackProgress = useTrackOnboardingProgress();
  const validation = useOnboardingValidation();
  const initialize = useInitializeOnboarding();
  
  return {
    // Status and progress
    ...currentUser,
    progress,
    required,
    
    // Actions
    updateStep: updateStep.mutate,
    skipStep: skipStep.mutate,
    trackProgress: trackProgress.mutate,
    validate: validation.mutate,
    initialize: initialize.mutate,
    
    // Loading states
    isUpdating: updateStep.isPending,
    isSkipping: skipStep.isPending,
    isTracking: trackProgress.isPending,
    isValidating: validation.isPending,
    isInitializing: initialize.isPending,
    
    // Validation results
    validationResult: validation.data,
    
    // Error states
    updateError: updateStep.error,
    skipError: skipStep.error,
    validationError: validation.error,
    initializeError: initialize.error,
  };
}; 