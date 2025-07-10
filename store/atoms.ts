import { atom } from 'jotai';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/services/profileService';
import type { JobLocation } from '@/hooks/useJobs';
import type { DispatchOutput, InventoryOutput } from '@/services/dailyPlanService';

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

// ===== MOCK AGENT DATA ATOMS =====

// Mock jobs data that persists across reloads
export const mockJobsAtom = atom([
  // Emergency jobs (will be prioritized first)
  {
    id: 'emergency-001',
    user_id: 'mock-user',
    title: 'Gas Leak Emergency',
    description: 'Urgent gas leak repair at commercial building',
    job_type: 'emergency' as const,
    priority: 'urgent' as const,
    status: 'pending' as const,
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Emergency St, San Francisco, CA',
    scheduled_start: new Date().toISOString(),
    estimated_duration: 90,
    customer_name: 'ABC Corporation',
    customer_phone: '(555) 123-4567',
    customer_email: 'emergency@abccorp.com',
    notes: 'Emergency response required. Gas leak detected in basement. Shut off main valve immediately.',
    required_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } satisfies JobLocation,
  {
    id: 'emergency-002',
    user_id: 'mock-user',
    title: 'Water Heater Failure',
    description: 'Complete water heater replacement needed immediately',
    job_type: 'emergency' as const,
    priority: 'urgent' as const,
    status: 'pending' as const,
    latitude: 37.7849,
    longitude: -122.4094,
    address: '456 Crisis Ave, San Francisco, CA',
    scheduled_start: new Date().toISOString(),
    estimated_duration: 120,
    customer_name: 'Johnson Family',
    customer_phone: '(555) 234-5678',
    customer_email: 'johnson@email.com',
    notes: 'Water heater burst. No hot water. Replace unit today.',
    required_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } satisfies JobLocation,
  
  // Regular maintenance jobs
  {
    id: 'regular-004',
    user_id: 'mock-user',
    title: 'Quarterly HVAC Maintenance',
    description: 'Routine maintenance and filter replacement',
    job_type: 'maintenance' as const,
    priority: 'medium' as const,
    status: 'pending' as const,
    latitude: 37.7649,
    longitude: -122.4294,
    address: '789 Maintenance Dr, San Francisco, CA',
    scheduled_start: new Date().toISOString(),
    estimated_duration: 60,
    customer_name: 'Tech Startup Inc',
    customer_phone: '(555) 345-6789',
    customer_email: 'facilities@techstartup.com',
    notes: 'Regular quarterly maintenance. Check all units, replace filters.',
    required_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } satisfies JobLocation,
  {
    id: 'regular-005',
    user_id: 'mock-user',
    title: 'Plumbing Inspection',
    description: 'Annual plumbing system inspection',
    job_type: 'inspection' as const,
    priority: 'low' as const,
    status: 'pending' as const,
    latitude: 37.7549,
    longitude: -122.4394,
    address: '321 Inspection Ln, San Francisco, CA',
    scheduled_start: new Date().toISOString(),
    estimated_duration: 45,
    customer_name: 'Wilson Property Management',
    customer_phone: '(555) 456-7890',
    customer_email: 'maintenance@wilsonpm.com',
    notes: 'Annual inspection of all plumbing systems. Document any issues.',
    required_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } satisfies JobLocation,
  {
    id: 'regular-003',
    user_id: 'mock-user',
    title: 'Faucet Replacement',
    description: 'Replace kitchen faucet in office building',
    job_type: 'service' as const,
    priority: 'medium' as const,
    status: 'pending' as const,
    latitude: 37.7449,
    longitude: -122.4494,
    address: '654 Service Rd, San Francisco, CA',
    scheduled_start: new Date().toISOString(),
    estimated_duration: 30,
    customer_name: 'Downtown Office Complex',
    customer_phone: '(555) 567-8901',
    customer_email: 'building@downtown.com',
    notes: 'Replace old kitchen faucet in break room. Customer has purchased new faucet.',
    required_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } satisfies JobLocation,
  {
    id: 'regular-001',
    user_id: 'mock-user',
    title: 'HVAC Maintenance',
    description: 'Routine HVAC system maintenance and filter replacement',
    job_type: 'maintenance' as const,
    priority: 'low' as const,
    status: 'pending' as const,
    latitude: 37.7649,
    longitude: -122.4194,
    address: '789 Industrial Blvd, San Francisco, CA',
    scheduled_start: new Date().toISOString(),
    estimated_duration: 60,
    customer_name: 'Industrial Park Management',
    customer_phone: '(555) 678-9012',
    customer_email: 'maintenance@industrialpark.com',
    notes: 'Replace HVAC filters and perform routine maintenance checks.',
    required_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } satisfies JobLocation,
  {
    id: 'regular-002',
    user_id: 'mock-user',
    title: 'System Inspection',
    description: 'Monthly system inspection and documentation',
    job_type: 'inspection' as const,
    priority: 'low' as const,
    status: 'pending' as const,
    latitude: 37.7549,
    longitude: -122.4294,
    address: '321 Residential Ave, San Francisco, CA',
    scheduled_start: new Date().toISOString(),
    estimated_duration: 45,
    customer_name: 'Residential Complex',
    customer_phone: '(555) 789-0123',
    customer_email: 'office@residentialcomplex.com',
    notes: 'Perform monthly inspection of all systems and document findings.',
    required_items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } satisfies JobLocation
]);

// Mock inventory items
export const mockInventoryAtom = atom([
  // Items we have in stock
  { id: 'inv-001', name: 'Gas Shut-off Valve', quantity: 3, unit: 'each', category: 'plumbing' },
  { id: 'inv-002', name: 'Water Heater (40 gal)', quantity: 1, unit: 'each', category: 'appliances' },
  { id: 'inv-003', name: 'HVAC Filter 16x20', quantity: 5, unit: 'each', category: 'hvac' },
  { id: 'inv-004', name: 'Copper Pipe 1/2"', quantity: 50, unit: 'feet', category: 'plumbing' },
  { id: 'inv-005', name: 'Pipe Fittings Assorted', quantity: 20, unit: 'each', category: 'plumbing' },
  { id: 'inv-006', name: 'Kitchen Faucet', quantity: 0, unit: 'each', category: 'fixtures' },
  
  // Items we're low on
  { id: 'inv-007', name: 'Pipe Thread Sealant', quantity: 0, unit: 'tube', category: 'sealants' },
  { id: 'inv-008', name: 'Teflon Tape', quantity: 1, unit: 'roll', category: 'sealants' },
  { id: 'inv-009', name: 'Water Heater Anode Rod', quantity: 0, unit: 'each', category: 'appliances' },
  { id: 'inv-010', name: 'Gas Line Connector', quantity: 1, unit: 'each', category: 'gas' },
]);

// Mock dispatch agent output
export const mockDispatchOutputAtom = atom({
  prioritized_jobs: [
    {
      job_id: 'emergency-001',
      priority_rank: 1,
      estimated_start_time: '08:00',
      estimated_end_time: '09:30',
      priority_reason: 'Emergency gas leak requires immediate response for safety',
      job_type: 'emergency' as const,
      buffer_time_minutes: 30
    },
    {
      job_id: 'emergency-002',
      priority_rank: 2,
      estimated_start_time: '10:00',
      estimated_end_time: '12:00',
      priority_reason: 'Water heater failure affecting customer daily operations',
      job_type: 'emergency' as const,
      buffer_time_minutes: 30
    },
    {
      job_id: 'regular-003',
      priority_rank: 3,
      estimated_start_time: '13:00',
      estimated_end_time: '13:30',
      priority_reason: 'Quick service call fits well after lunch break',
      job_type: 'service' as const,
      buffer_time_minutes: 15
    },
    {
      job_id: 'regular-001',
      priority_rank: 4,
      estimated_start_time: '14:00',
      estimated_end_time: '15:00',
      priority_reason: 'Routine maintenance can be scheduled flexibly',
      job_type: 'maintenance' as const,
      buffer_time_minutes: 15
    },
    {
      job_id: 'regular-002',
      priority_rank: 5,
      estimated_start_time: '15:30',
      estimated_end_time: '16:15',
      priority_reason: 'Inspection work scheduled for end of day',
      job_type: 'inspection' as const,
      buffer_time_minutes: 15
    }
  ],
  scheduling_constraints: {
    work_start_time: '08:00',
    work_end_time: '17:00',
    lunch_break_start: '12:00',
    lunch_break_end: '13:00',
    total_work_hours: 8
  },
  recommendations: [
    'Emergency jobs prioritized for immediate response',
    'Buffer time added for gas emergency due to safety protocols',
    'Routine maintenance scheduled around emergency repairs',
    'End-of-day inspection allows for thorough documentation'
  ],
  agent_reasoning: 'Prioritized safety-critical emergency jobs first, followed by customer-impacting water heater failure. Scheduled routine work around lunch break and emergencies for optimal efficiency.',
  execution_time_ms: 1247
});

// Mock inventory agent output
export const mockInventoryOutputAtom = atom({
  parts_manifest: [
    {
      job_id: 'emergency-001',
      required_parts: [
        {
          inventory_item_id: 'inv-001',
          item_name: 'Gas Shut-off Valve',
          quantity_needed: 1,
          quantity_available: 3,
          unit: 'each',
          category: 'plumbing'
        },
        {
          inventory_item_id: 'inv-007',
          item_name: 'Pipe Thread Sealant',
          quantity_needed: 1,
          quantity_available: 0,
          unit: 'tube',
          category: 'sealants'
        }
      ]
    },
    {
      job_id: 'emergency-002',
      required_parts: [
        {
          inventory_item_id: 'inv-002',
          item_name: 'Water Heater (40 gal)',
          quantity_needed: 1,
          quantity_available: 1,
          unit: 'each',
          category: 'appliances'
        },
        {
          inventory_item_id: 'inv-009',
          item_name: 'Water Heater Anode Rod',
          quantity_needed: 1,
          quantity_available: 0,
          unit: 'each',
          category: 'appliances'
        },
        {
          inventory_item_id: 'inv-010',
          item_name: 'Gas Line Connector',
          quantity_needed: 1,
          quantity_available: 1,
          unit: 'each',
          category: 'gas'
        }
      ]
    },
    {
      job_id: 'regular-001',
      required_parts: [
        {
          inventory_item_id: 'inv-003',
          item_name: 'HVAC Filter 16x20',
          quantity_needed: 2,
          quantity_available: 5,
          unit: 'each',
          category: 'hvac'
        }
      ]
    },
    {
      job_id: 'regular-003',
      required_parts: [
        {
          inventory_item_id: 'inv-006',
          item_name: 'Kitchen Faucet',
          quantity_needed: 1,
          quantity_available: 0,
          unit: 'each',
          category: 'fixtures'
        },
        {
          inventory_item_id: 'inv-008',
          item_name: 'Teflon Tape',
          quantity_needed: 1,
          quantity_available: 1,
          unit: 'roll',
          category: 'sealants'
        }
      ]
    }
  ],
  shopping_list: [
    {
      item_name: 'Pipe Thread Sealant',
      quantity_needed: 2,
      unit: 'tube',
      category: 'sealants',
      preferred_supplier: 'Home Depot',
      estimated_cost: 8.99,
      priority: 'high' as const
    },
    {
      item_name: 'Water Heater Anode Rod',
      quantity_needed: 1,
      unit: 'each',
      category: 'appliances',
      preferred_supplier: 'Lowe\'s',
      estimated_cost: 24.99,
      priority: 'high' as const
    },
    {
      item_name: 'Kitchen Faucet',
      quantity_needed: 1,
      unit: 'each',
      category: 'fixtures',
      preferred_supplier: 'Home Depot',
      estimated_cost: 89.99,
      priority: 'medium' as const
    }
  ],
  hardware_store_run: {
    store_locations: [
      {
        store_name: 'The Home Depot #4512',
        address: '1965 Ocean Ave, San Francisco, CA 94127',
        coordinates: {
          latitude: 37.7249,
          longitude: -122.4564
        },
        estimated_visit_time: 25,
        items_available: ['Pipe Thread Sealant', 'Kitchen Faucet']
      },
      {
        store_name: 'Lowe\'s #1843',
        address: '2675 Geary Blvd, San Francisco, CA 94118',
        coordinates: {
          latitude: 37.7815,
          longitude: -122.4415
        },
        estimated_visit_time: 20,
        items_available: ['Water Heater Anode Rod']
      }
    ],
    total_estimated_cost: 123.97,
    estimated_shopping_time: 45
  },
  created_hardware_store_jobs: [],
  inventory_alerts: [
    {
      item_name: 'Pipe Thread Sealant',
      alert_type: 'out_of_stock' as const,
      message: 'Critical item out of stock - needed for emergency gas repair'
    },
    {
      item_name: 'Water Heater Anode Rod',
      alert_type: 'out_of_stock' as const,
      message: 'Required for water heater replacement - add to shopping list'
    },
    {
      item_name: 'Kitchen Faucet',
      alert_type: 'out_of_stock' as const,
      message: 'Customer expecting faucet installation - purchase needed'
    }
  ],
  agent_reasoning: 'Identified missing critical items for emergency repairs. Created optimized shopping list with two store locations to minimize travel time. High-priority emergency items flagged for immediate pickup.',
  execution_time_ms: 1834
});

// AI mode toggle atom
export const mockModeAtom = atom(true); // Default to AI mode for planning

// Mock daily plan atom for storing the current planning session
export const mockDailyPlanAtom = atom<any>(null);


