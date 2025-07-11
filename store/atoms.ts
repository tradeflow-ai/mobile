import { atom } from 'jotai';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/services/profileService';
import type { JobLocation } from '@/hooks/useJobs';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

// Auth types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Profile types
export interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

// Types for inventory management
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  lastUpdated: Date;
  imageUri?: string;
}

export interface Route {
  id: string;
  name: string;
  waypoints: {
    latitude: number;
    longitude: number;
    address?: string;
    itemId?: string;
  }[];
  createdAt: Date;
  isCompleted: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

// Job route types (keeping only the route interface)
export interface JobRoute {
  id: string;
  name: string;
  jobLocations: JobLocation[];
  totalDistance: number; // in kilometers
  estimatedTime: number; // in minutes
  createdAt: Date;
  status: 'planned' | 'active' | 'completed';
}

// ✅ MIGRATED TO TANSTACK QUERY - Use hooks/useInventory.ts instead
// Legacy inventory data - now replaced with TanStack Query hooks:
// - useInventory() - fetch all inventory items
// - useInventoryItem(id) - fetch specific item
// - useCreateInventoryItem() - create new items
// - useUpdateInventoryItem() - update existing items
// - useDeleteInventoryItem() - delete items
// - useLowStockItems() - get low stock alerts
// Sample data now in sample-data.sql for proper database seeding

export const currentLocationAtom = atom<UserLocation | null>(null);

// Theme atoms
export const themeModeAtom = atom<ThemeMode>('system');
export const systemColorSchemeAtom = atom<ColorScheme>('light');

// Derived theme atom that respects user preference
export const effectiveColorSchemeAtom = atom((get) => {
  const themeMode = get(themeModeAtom);
  const systemColorScheme = get(systemColorSchemeAtom);
  
  if (themeMode === 'system') {
    return systemColorScheme;
  }
  
  return themeMode as ColorScheme;
});

// Auth atoms
export const userAtom = atom<User | null>(null);
export const isAuthLoadingAtom = atom<boolean>(true);
export const authErrorAtom = atom<string | null>(null);

// Profile atoms
export const userProfileAtom = atom<UserProfile | null>(null);
export const isProfileLoadingAtom = atom<boolean>(false);
export const profileErrorAtom = atom<string | null>(null);

// Derived auth atoms
export const isAuthenticatedAtom = atom((get) => {
  const user = get(userAtom);
  return user !== null;
});

export const authStateAtom = atom<AuthState>((get) => {
  const user = get(userAtom);
  const isLoading = get(isAuthLoadingAtom);
  
  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
  };
});

// Derived profile atoms
export const profileStateAtom = atom<ProfileState>((get) => {
  const profile = get(userProfileAtom);
  const isLoading = get(isProfileLoadingAtom);
  const error = get(profileErrorAtom);
  
  return {
    profile,
    isLoading,
    error,
  };
});

// Mock job data atom for calendar persistence
export const mockJobDataAtom = atom<JobLocation[]>([]);

// Daily Plan Workflow atoms for global state
export interface DailyPlanWorkflowState {
  isPlanning: boolean;
  currentStep: 'dispatcher' | 'confirmation' | 'inventory' | 'complete' | null;
  hasHardwareStoreJob: boolean;
  planId: string | null;
}

export const dailyPlanWorkflowAtom = atom<DailyPlanWorkflowState>({
  isPlanning: false,
  currentStep: null,
  hasHardwareStoreJob: false,
  planId: null,
});

// Hardware store job state for cross-component access
export const hardwareStoreJobAtom = atom<any | null>(null);


