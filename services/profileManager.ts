import { ProfileService, UserProfile } from './profileService';
import { AuthManager } from './authManager';
import { supabase } from './supabase';
import { userProfileAtom, isProfileLoadingAtom, profileErrorAtom } from '@/store/atoms';
import { getDefaultStore } from 'jotai';
import type { User } from '@supabase/supabase-js';

export class ProfileManager {
  private static instance: ProfileManager;
  private profileService: ProfileService;
  private authManager: AuthManager;
  private store = getDefaultStore();

  private constructor() {
    this.profileService = ProfileService.getInstance();
    this.authManager = AuthManager.getInstance();
    this.initializeProfileSync();
  }

  static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  private initializeProfileSync() {
    // Subscribe to auth state changes to load/clear profile
    this.authManager.onAuthStateChange(async (authState) => {
      if (authState.user && authState.isAuthenticated) {
        // User signed in - load their profile
        await this.loadUserProfile(authState.user);
      } else {
        // User signed out - clear profile
        this.clearProfile();
      }
    });
  }

  /**
   * Load user profile from database
   */
  async loadUserProfile(user: User): Promise<void> {
    try {
      this.store.set(isProfileLoadingAtom, true);
      this.store.set(profileErrorAtom, null);

      const { data: profile, error } = await this.profileService.getProfile(user.id);
      
      if (error) {
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          await this.createBasicProfile(user);
        } else {
          console.error('Error loading profile:', error);
          this.store.set(profileErrorAtom, 'Failed to load profile');
        }
      } else if (profile) {
        // Check if user has pending profile data from signup that needs to be applied
        const hasPendingProfileData = user.user_metadata?.profile_data_pending;
        
        if (hasPendingProfileData) {
          // Update the existing profile with the signup metadata
          await this.updateProfileFromMetadata(user, profile);
        } else {
          // No pending data, use the existing profile
          this.store.set(userProfileAtom, profile);
        }
      } else {
        // No profile found and no error, create a basic one
        await this.createBasicProfile(user);
      }
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
      this.store.set(profileErrorAtom, 'Failed to load profile');
    } finally {
      this.store.set(isProfileLoadingAtom, false);
    }
  }

  /**
   * Create a basic profile for new users
   */
  private async createBasicProfile(user: User): Promise<void> {
    try {
      // Check if profile already exists (may have been created during signup)
      const existingProfile = await this.profileService.getProfile(user.id);
      if (existingProfile.data) {
        this.store.set(userProfileAtom, existingProfile.data);
        return;
      }

      // Try to create profile with any metadata from signup
      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: user.user_metadata?.occupation || 'user',
        company_name: user.user_metadata?.company_name || '',
        phone: user.user_metadata?.phone || '',
      };

      const { data: profile, error } = await this.profileService.upsertProfile(profileData);

      if (error) {
        console.error('Error creating basic profile:', error);
        // If RLS error, provide specific guidance
        if (error.code === '42501') {
          this.store.set(profileErrorAtom, 'Database security policy error. Please check RLS policies.');
        } else {
          this.store.set(profileErrorAtom, 'Failed to create profile');
        }
      } else if (profile) {
        this.store.set(userProfileAtom, profile);
      }
    } catch (error) {
      console.error('Unexpected error creating basic profile:', error);
      this.store.set(profileErrorAtom, 'Failed to create profile');
    }
  }

  /**
   * Update existing profile with pending metadata from signup
   */
  private async updateProfileFromMetadata(user: User, existingProfile: UserProfile): Promise<void> {
    try {
      // Extract profile data from user metadata
      const updates = {
        first_name: user.user_metadata?.first_name || existingProfile.first_name,
        last_name: user.user_metadata?.last_name || existingProfile.last_name,
        full_name: user.user_metadata?.full_name || existingProfile.full_name,
        role: user.user_metadata?.occupation || existingProfile.role,
        company_name: user.user_metadata?.company_name || existingProfile.company_name,
        phone: user.user_metadata?.phone || existingProfile.phone,
      };

      // Update the profile with the new data
      const { data: updatedProfile, error } = await this.profileService.updateProfile(user.id, updates);

      if (error) {
        console.error('Error updating profile from metadata:', error);
        this.store.set(profileErrorAtom, 'Failed to update profile');
        // Fall back to existing profile if update fails
        this.store.set(userProfileAtom, existingProfile);
      } else if (updatedProfile) {
        this.store.set(userProfileAtom, updatedProfile);
        
        // Clear the pending profile data flag
        try {
          await supabase.auth.updateUser({
            data: {
              profile_data_pending: false,
            }
          });
          console.log('Profile updated from metadata and pending flag cleared');
        } catch (metadataError) {
          console.warn('Failed to clear pending profile data flag:', metadataError);
        }
      }
    } catch (error) {
      console.error('Unexpected error updating profile from metadata:', error);
      this.store.set(profileErrorAtom, 'Failed to update profile');
      // Fall back to existing profile if update fails
      this.store.set(userProfileAtom, existingProfile);
    }
  }

  /**
   * Clear profile data
   */
  private clearProfile(): void {
    this.store.set(userProfileAtom, null);
    this.store.set(isProfileLoadingAtom, false);
    this.store.set(profileErrorAtom, null);
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    role?: string;
    company_name?: string;
    phone?: string;
    avatar_url?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.authManager.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      this.store.set(isProfileLoadingAtom, true);
      this.store.set(profileErrorAtom, null);

      const { data: profile, error } = await this.profileService.updateProfile(user.id, updates);

      if (error) {
        console.error('Error updating profile:', error);
        this.store.set(profileErrorAtom, 'Failed to update profile');
        return { success: false, error: 'Failed to update profile' };
      }

      if (profile) {
        this.store.set(userProfileAtom, profile);
        return { success: true };
      }

      return { success: false, error: 'Profile update failed' };
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
      this.store.set(profileErrorAtom, 'Failed to update profile');
      return { success: false, error: 'Failed to update profile' };
    } finally {
      this.store.set(isProfileLoadingAtom, false);
    }
  }

  /**
   * Get current profile from atom
   */
  getCurrentProfile(): UserProfile | null {
    return this.store.get(userProfileAtom);
  }

  /**
   * Get display name for current user
   */
  getDisplayName(): string {
    const profile = this.getCurrentProfile();
    if (!profile) {
      const user = this.authManager.getCurrentUser();
      return user?.email?.split('@')[0] || 'User';
    }
    return this.profileService.getDisplayName(profile);
  }

  /**
   * Get initials for current user
   */
  getInitials(): string {
    const profile = this.getCurrentProfile();
    if (!profile) {
      const user = this.authManager.getCurrentUser();
      return user?.email?.charAt(0).toUpperCase() || 'U';
    }
    return this.profileService.getInitials(profile);
  }

  /**
   * Get user's email
   */
  getUserEmail(): string {
    const profile = this.getCurrentProfile();
    if (profile) {
      return profile.email;
    }
    const user = this.authManager.getCurrentUser();
    return user?.email || '';
  }

  /**
   * Get user's role/occupation
   */
  getUserRole(): string {
    const profile = this.getCurrentProfile();
    return profile?.role || 'User';
  }

  /**
   * Force refresh profile
   */
  async refreshProfile(): Promise<void> {
    const user = this.authManager.getCurrentUser();
    if (user) {
      await this.loadUserProfile(user);
    }
  }

  /**
   * Create profile during signup with provided information
   */
  async createProfileDuringSignup(userId: string, profileData: {
    email: string;
    firstName?: string;
    lastName?: string;
    occupation?: string;
    companyName?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      this.store.set(isProfileLoadingAtom, true);
      this.store.set(profileErrorAtom, null);

      const { data: profile, error } = await this.profileService.upsertProfile({
        id: userId,
        email: profileData.email,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        full_name: profileData.firstName && profileData.lastName 
          ? `${profileData.firstName} ${profileData.lastName}` 
          : undefined,
        role: profileData.occupation || 'user',
        company_name: profileData.companyName,
        phone: profileData.phone,
      });

      if (error) {
        console.error('Error creating profile during signup:', error);
        this.store.set(profileErrorAtom, 'Failed to create profile');
        return { success: false, error: 'Failed to create profile' };
      }

      if (profile) {
        this.store.set(userProfileAtom, profile);
        return { success: true };
      }

      return { success: false, error: 'Profile creation failed' };
    } catch (error) {
      console.error('Unexpected error creating profile during signup:', error);
      this.store.set(profileErrorAtom, 'Failed to create profile');
      return { success: false, error: 'Failed to create profile' };
    } finally {
      this.store.set(isProfileLoadingAtom, false);
    }
  }
} 