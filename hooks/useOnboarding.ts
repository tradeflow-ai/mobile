/**
 * Onboarding Hooks - Simplified Legacy System
 * 
 * Simplified hooks for onboarding functionality using only the legacy
 * profiles.preferences system as the source of truth.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { PreferencesService, UserPreferences } from '@/services/preferencesService';

/**
 * Hook to check if user has completed onboarding based on their preferences
 */
export const useOnboardingCompletion = (userId?: string) => {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['onboardingCompletion', targetUserId],
    queryFn: async () => {
      if (!targetUserId) {
        return { isCompleted: false, preferences: null };
      }

      const { data: preferences, error } = await PreferencesService.getUserPreferences(targetUserId);
      
      if (error) {
        throw error;
      }

      // Check if user has completed core onboarding requirements
      const hasWorkSchedule = preferences?.work_days && preferences?.work_start_time && preferences?.work_end_time;
      const hasBuffers = preferences?.travel_buffer_minutes && preferences?.job_duration_buffer_minutes;
      const hasSuppliers = preferences?.preferred_suppliers && preferences?.preferred_suppliers.length > 0;
      
      const isCompleted = Boolean(hasWorkSchedule && hasBuffers && hasSuppliers);

      return {
        isCompleted,
        preferences,
        completionDetails: {
          hasWorkSchedule: Boolean(hasWorkSchedule),
          hasBuffers: Boolean(hasBuffers),
          hasSuppliers: Boolean(hasSuppliers),
        }
      };
    },
    enabled: Boolean(targetUserId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get user preferences (alias for PreferencesService for consistency)
 */
export const useUserPreferences = (userId?: string) => {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['userPreferences', targetUserId],
    queryFn: async () => {
      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await PreferencesService.getUserPreferences(targetUserId);
      
      if (error) {
        throw error;
      }

      return data;
    },
    enabled: Boolean(targetUserId),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update user preferences
 */
export const useUpdatePreferences = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await PreferencesService.updateUserPreferences(user.id, preferences);
      
      if (error) {
        throw error;
      }

      return preferences;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['onboardingCompletion', user?.id] });
    },
  });
}; 