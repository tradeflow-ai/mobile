/**
 * Profile Data Hooks - TanStack Query integration
 * Provides data access for user profile management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { ProfileService, UserProfile, CreateProfileData } from '@/services/profileService';
import { queryKeys, invalidateQueries, handleQueryError } from '@/services/queryClient';
import { useOnboardingRequired } from '@/hooks/useOnboarding';

const profileService = new ProfileService();

// ==================== QUERY HOOKS ====================

/**
 * Get user profile data
 * Josh needs this for auth screens and profile display
 */
export const useProfile = (userId?: string) => {
  const [user] = useAtom(userAtom);
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: queryKeys.profile(targetUserId || ''),
    queryFn: async () => {
      if (!targetUserId) {
        throw new Error('No user ID available');
      }
      
      const { data: profile, error } = await profileService.getProfile(targetUserId);
      
      if (error) {
        throw error;
      }
      
      return profile;
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 2, // 2 minutes for profile data
  });
};

/**
 * Get current user's profile with automatic updates
 * Integrates with auth state management
 */
export const useCurrentUserProfile = () => {
  const [user] = useAtom(userAtom);
  
  const query = useProfile(user?.id);
  
  return {
    ...query,
    profile: query.data,
    isAuthenticated: !!user,
    user,
  };
};

// ==================== MUTATION HOOKS ====================

/**
 * Update user profile
 * Josh needs this for profile editing and onboarding
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (profileUpdates: Partial<UserProfile>) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: updatedProfile, error } = await profileService.updateProfile(
        user.id,
        profileUpdates
      );

      if (error) {
        throw error;
      }

      return updatedProfile;
    },
    onSuccess: (updatedProfile) => {
      if (updatedProfile && user?.id) {
        // Update the cache with the new profile data
        queryClient.setQueryData(
          queryKeys.profile(user.id),
          updatedProfile
        );
        
        // Invalidate related queries
        invalidateQueries.profile(user.id);
      }
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
      handleQueryError(error, ['profile', 'update']);
    },
  });
};

/**
 * Create user profile (used during signup)
 * Josh needs this for the signup/onboarding flow
 */
export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: CreateProfileData) => {
      const { data: newProfile, error } = await profileService.upsertProfile(profileData);

      if (error) {
        throw error;
      }

      return newProfile;
    },
    onSuccess: (newProfile) => {
      if (newProfile) {
        // Add the new profile to the cache
        queryClient.setQueryData(
          queryKeys.profile(newProfile.id),
          newProfile
        );
        
        // Invalidate related queries
        invalidateQueries.profile(newProfile.id);
      }
    },
    onError: (error) => {
      console.error('Profile creation failed:', error);
      handleQueryError(error, ['profile', 'create']);
    },
  });
};

/**
 * Delete user profile
 * Generally not used but provided for completeness
 */
export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await profileService.deleteProfile(profileId);

      if (error) {
        throw error;
      }

      return profileId;
    },
    onSuccess: (deletedProfileId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.profile(deletedProfileId)
      });
      
      // Invalidate related queries
      if (user?.id === deletedProfileId) {
        queryClient.clear(); // Clear all queries if user deleted their own profile
      }
    },
    onError: (error) => {
      console.error('Profile deletion failed:', error);
      handleQueryError(error, ['profile', 'delete']);
    },
  });
};

// ==================== UTILITY HOOKS ====================

/**
 * Check if profile is complete (for onboarding)
 * Josh needs this to determine onboarding flow
 */
export const useProfileCompleteness = () => {
  const { profile, isLoading } = useCurrentUserProfile();

  const isComplete = profile ? 
    !!(profile.first_name && 
       profile.last_name && 
       profile.role && 
       profile.email) : false;

  const missingFields = profile ? 
    [
      !profile.first_name && 'first_name',
      !profile.last_name && 'last_name', 
      !profile.role && 'occupation',
      !profile.email && 'email',
    ].filter(Boolean) as string[] : [];

  return {
    isComplete,
    missingFields,
    profile,
    isLoading,
  };
};

/**
 * Combined profile and onboarding status
 * Josh needs this for determining overall user completion status
 */
export const useUserCompletionStatus = () => {
  const profileCompleteness = useProfileCompleteness();
  const onboardingRequired = useOnboardingRequired();

  const isFullyComplete = profileCompleteness.isComplete && !onboardingRequired.isRequired;
  const needsProfile = !profileCompleteness.isComplete;
  const needsOnboarding = onboardingRequired.isRequired;
  
  return {
    // Profile status
    ...profileCompleteness,
    
    // Onboarding status
    onboardingRequired: onboardingRequired.isRequired,
    onboardingNextStep: onboardingRequired.nextStep,
    onboardingProgress: onboardingRequired.completionScore,
    
    // Combined status
    isFullyComplete,
    needsProfile,
    needsOnboarding,
    
    // Loading states
    isLoading: profileCompleteness.isLoading || onboardingRequired.isLoading,
    
    // Next step determination
    nextStep: needsProfile ? 'profile' : needsOnboarding ? 'onboarding' : 'complete',
  };
};

/**
 * Prefetch profile data
 * Utility for preloading profile data
 */
export const usePrefetchProfile = () => {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.profile(userId),
      queryFn: async () => {
        const { data: profile, error } = await profileService.getProfile(userId);
        if (error) throw error;
        return profile;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
}; 