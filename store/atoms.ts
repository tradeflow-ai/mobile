import { atom } from 'jotai';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

// Types for inventory management
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: 'plumbing' | 'hvac' | 'electrical';
  status: 'available' | 'low_stock' | 'out_of_stock';
  lastUpdated: Date;
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

// Job location types
export interface JobLocation {
  id: string;
  title: string;
  description: string;
  jobType: 'delivery' | 'pickup' | 'service' | 'inspection';
  priority: 'high' | 'medium' | 'low';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: string;
  scheduledDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedDuration: number; // in minutes
}

export interface JobRoute {
  id: string;
  name: string;
  jobLocations: JobLocation[];
  totalDistance: number; // in kilometers
  estimatedTime: number; // in minutes
  createdAt: Date;
  status: 'planned' | 'active' | 'completed';
}

// Atoms for state management
export const inventoryItemsAtom = atom<InventoryItem[]>([
  // Plumbing items
  {
    id: '1',
    name: 'PVC Pipe 1/2"',
    quantity: 25,
    category: 'plumbing',
    lastUpdated: new Date(),
    status: 'available',
  },
  {
    id: '2',
    name: 'Copper Fittings',
    quantity: 3,
    category: 'plumbing',
    lastUpdated: new Date(),
    status: 'low_stock',
  },
  {
    id: '3',
    name: 'Ball Valve 3/4"',
    quantity: 0,
    category: 'plumbing',
    lastUpdated: new Date(),
    status: 'out_of_stock',
  },
  {
    id: '4',
    name: 'Pipe Wrench',
    quantity: 8,
    category: 'plumbing',
    lastUpdated: new Date(),
    status: 'available',
  },
  // HVAC items
  {
    id: '5',
    name: 'Air Filter 16x20',
    quantity: 12,
    category: 'hvac',
    lastUpdated: new Date(),
    status: 'available',
  },
  {
    id: '6',
    name: 'Thermostat Digital',
    quantity: 2,
    category: 'hvac',
    lastUpdated: new Date(),
    status: 'low_stock',
  },
  {
    id: '7',
    name: 'Duct Tape',
    quantity: 15,
    category: 'hvac',
    lastUpdated: new Date(),
    status: 'available',
  },
  // Electrical items
  {
    id: '8',
    name: 'Wire 12 AWG',
    quantity: 0,
    category: 'electrical',
    lastUpdated: new Date(),
    status: 'out_of_stock',
  },
  {
    id: '9',
    name: 'Outlet GFCI',
    quantity: 6,
    category: 'electrical',
    lastUpdated: new Date(),
    status: 'available',
  },
  {
    id: '10',
    name: 'Circuit Breaker 20A',
    quantity: 1,
    category: 'electrical',
    lastUpdated: new Date(),
    status: 'low_stock',
  },
  {
    id: '11',
    name: 'Wire Nuts',
    quantity: 45,
    category: 'electrical',
    lastUpdated: new Date(),
    status: 'available',
  },
]);
export const routesAtom = atom<Route[]>([]);
export const currentLocationAtom = atom<UserLocation | null>(null);
export const selectedItemAtom = atom<InventoryItem | null>(null);
export const isLoadingAtom = atom<boolean>(false);
export const searchQueryAtom = atom<string>('');
export const selectedCategoryAtom = atom<string>('all');

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

// Job-related atoms
export const jobLocationsAtom = atom<JobLocation[]>([
  {
    id: '1',
    title: 'Downtown Office Building',
    description: 'HVAC maintenance and inspection',
    jobType: 'service',
    priority: 'high',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    address: '123 Market Street, San Francisco, CA',
    scheduledDate: new Date('2024-01-15T09:00:00'),
    status: 'pending',
    estimatedDuration: 120
  },
  {
    id: '2',
    title: 'Residential Complex',
    description: 'Equipment delivery and installation',
    jobType: 'delivery',
    priority: 'medium',
    coordinates: {
      latitude: 37.7849,
      longitude: -122.4094
    },
    address: '456 Oak Avenue, San Francisco, CA',
    scheduledDate: new Date('2024-01-15T11:30:00'),
    status: 'pending',
    estimatedDuration: 90
  },
  {
    id: '3',
    title: 'Industrial Warehouse',
    description: 'Safety inspection and compliance check',
    jobType: 'inspection',
    priority: 'high',
    coordinates: {
      latitude: 37.7649,
      longitude: -122.4294
    },
    address: '789 Industrial Drive, San Francisco, CA',
    scheduledDate: new Date('2024-01-15T14:00:00'),
    status: 'pending',
    estimatedDuration: 180
  },
  {
    id: '4',
    title: 'Tech Startup Office',
    description: 'Equipment pickup and recycling',
    jobType: 'pickup',
    priority: 'low',
    coordinates: {
      latitude: 37.7549,
      longitude: -122.4394
    },
    address: '321 Mission Street, San Francisco, CA',
    scheduledDate: new Date('2024-01-15T16:00:00'),
    status: 'pending',
    estimatedDuration: 60
  }
]);

export const jobRoutesAtom = atom<JobRoute[]>([
  {
    id: 'route-1',
    name: 'Daily Route - January 15',
    jobLocations: [], // Will be populated from jobLocationsAtom
    totalDistance: 12.5,
    estimatedTime: 180,
    createdAt: new Date('2024-01-15T08:00:00'),
    status: 'planned'
  }
]);

export const activeJobRouteAtom = atom<JobRoute | null>(null);
export const selectedJobLocationAtom = atom<JobLocation | null>(null);

// Derived atoms
export const filteredInventoryAtom = atom((get) => {
  const items = get(inventoryItemsAtom);
  const searchQuery = get(searchQueryAtom);
  const selectedCategory = get(selectedCategoryAtom);

  return items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
});

export const lowStockItemsAtom = atom((get) => {
  const items = get(inventoryItemsAtom);
  return items.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock');
});

export const categoriesAtom = atom((get) => {
  const items = get(inventoryItemsAtom);
  const categories = new Set(items.map(item => item.category));
  return Array.from(categories);
});

// Actions for inventory management
export const updateInventoryItemAtom = atom(
  null,
  (get, set, update: { id: string; updates: Partial<InventoryItem> }) => {
    const items = get(inventoryItemsAtom);
    const updatedItems = items.map(item =>
      item.id === update.id
        ? { ...item, ...update.updates, lastUpdated: new Date() }
        : item
    );
    set(inventoryItemsAtom, updatedItems);
  }
);

export const deleteInventoryItemAtom = atom(
  null,
  (get, set, itemId: string) => {
    const items = get(inventoryItemsAtom);
    const filteredItems = items.filter(item => item.id !== itemId);
    set(inventoryItemsAtom, filteredItems);
  }
);

export const addInventoryItemAtom = atom(
  null,
  (get, set, newItem: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const items = get(inventoryItemsAtom);
    const itemWithId: InventoryItem = {
      ...newItem,
      id: Date.now().toString(),
      lastUpdated: new Date(),
    };
    set(inventoryItemsAtom, [...items, itemWithId]);
  }
); 