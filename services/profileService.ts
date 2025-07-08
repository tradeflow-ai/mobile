import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
  company_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  timezone?: string;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  role?: string;
}

export interface UpdateProfileData {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
  company_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  timezone?: string;
  preferences?: Record<string, any>;
}

export class ProfileService {
  private static instance: ProfileService;

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Create or update user profile
   */
  async upsertProfile(profileData: CreateProfileData): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          company_name: profileData.company_name,
          phone: profileData.phone,
          role: profileData.role || 'user',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting profile:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error upserting profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting profile:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error deleting profile:', error);
      return { error };
    }
  }

  /**
   * Generate display name from profile data
   */
  getDisplayName(profile: UserProfile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.full_name) {
      return profile.full_name;
    }
    return profile.email.split('@')[0];
  }

  /**
   * Generate initials from profile data
   */
  getInitials(profile: UserProfile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    if (profile.full_name) {
      const names = profile.full_name.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }
    return profile.email.charAt(0).toUpperCase();
  }
} 