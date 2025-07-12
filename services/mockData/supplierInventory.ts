/**
 * Mock Supplier Inventory Data
 * 
 * Centralized mock data for supplier inventory checking.
 * This simulates real-time inventory data from hardware stores like Lowe's or Home Depot.
 */

export interface SupplierItem {
  itemName: string;
  inStock: boolean;
  available: number;
  price: number;
  storeId: string;
  category: string;
  sku: string;
  description: string;
}

export interface StoreLocation {
  storeId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

// Mock inventory data for common plumbing supplies
export const MOCK_INVENTORY_DATA: SupplierItem[] = [
  {
    itemName: 'Copper Pipe',
    inStock: true,
    available: 150,
    price: 12.99,
    storeId: '0595',
    category: 'Plumbing',
    sku: 'CP-075-10',
    description: '3/4" Copper Pipe, 10ft length'
  },
  {
    itemName: 'PVC Pipe',
    inStock: true,
    available: 200,
    price: 8.49,
    storeId: '0595',
    category: 'Plumbing',
    sku: 'PVC-4-10',
    description: '4" PVC Pipe, 10ft length'
  },
  {
    itemName: 'Teflon Tape',
    inStock: true,
    available: 75,
    price: 2.99,
    storeId: '0595',
    category: 'Plumbing',
    sku: 'TT-WHT-260',
    description: 'White Teflon Tape, 260" length'
  },
  {
    itemName: 'Ball Valve',
    inStock: true,
    available: 45,
    price: 24.99,
    storeId: '0595',
    category: 'Plumbing',
    sku: 'BV-075-BR',
    description: '3/4" Brass Ball Valve'
  },
  {
    itemName: 'Pipe Wrench',
    inStock: false,
    available: 0,
    price: 45.99,
    storeId: '0595',
    category: 'Tools',
    sku: 'PW-14-STL',
    description: '14" Steel Pipe Wrench'
  },
  {
    itemName: 'Pipe Fittings',
    inStock: true,
    available: 120,
    price: 5.99,
    storeId: '0595',
    category: 'Plumbing',
    sku: 'PF-ELB-075',
    description: '3/4" Copper Elbow Fitting'
  },
  {
    itemName: 'Drain Snake',
    inStock: true,
    available: 25,
    price: 89.99,
    storeId: '0595',
    category: 'Tools',
    sku: 'DS-25-FLX',
    description: '25ft Flexible Drain Snake'
  },
  {
    itemName: 'Plumber\'s Putty',
    inStock: true,
    available: 60,
    price: 4.99,
    storeId: '0595',
    category: 'Plumbing',
    sku: 'PP-14OZ',
    description: '14oz Plumber\'s Putty'
  },
  {
    itemName: 'Shut-off Valve',
    inStock: true,
    available: 35,
    price: 18.99,
    storeId: '0595',
    category: 'Plumbing',
    sku: 'SOV-05-BR',
    description: '1/2" Brass Shut-off Valve'
  },
  {
    itemName: 'Pipe Insulation',
    inStock: false,
    available: 0,
    price: 12.99,
    storeId: '0595',
    category: 'Plumbing',
    sku: 'PI-075-6',
    description: '3/4" Pipe Insulation, 6ft length'
  }
];

// Mock store locations
export const MOCK_STORE_LOCATIONS: StoreLocation[] = [
  {
    storeId: '0595',
    name: 'Lowe\'s Home Improvement',
    address: '1250 Bayshore Hwy',
    city: 'Burlingame',
    state: 'CA',
    zipCode: '94010',
    latitude: 37.5847,
    longitude: -122.3617,
    phone: '(650) 558-0595',
    hours: {
      monday: '6:00 AM - 10:00 PM',
      tuesday: '6:00 AM - 10:00 PM',
      wednesday: '6:00 AM - 10:00 PM',
      thursday: '6:00 AM - 10:00 PM',
      friday: '6:00 AM - 10:00 PM',
      saturday: '6:00 AM - 10:00 PM',
      sunday: '8:00 AM - 8:00 PM'
    }
  },
  {
    storeId: '1205',
    name: 'Home Depot',
    address: '1691 El Camino Real',
    city: 'San Bruno',
    state: 'CA',
    zipCode: '94066',
    latitude: 37.6175,
    longitude: -122.4111,
    phone: '(650) 873-1205',
    hours: {
      monday: '6:00 AM - 9:00 PM',
      tuesday: '6:00 AM - 9:00 PM',
      wednesday: '6:00 AM - 9:00 PM',
      thursday: '6:00 AM - 9:00 PM',
      friday: '6:00 AM - 9:00 PM',
      saturday: '6:00 AM - 9:00 PM',
      sunday: '8:00 AM - 8:00 PM'
    }
  }
];

// Helper function to get inventory data as a Map for quick lookups
export const getInventoryMap = (): Map<string, SupplierItem> => {
  const map = new Map<string, SupplierItem>();
  MOCK_INVENTORY_DATA.forEach(item => {
    map.set(item.itemName.toLowerCase(), item);
  });
  return map;
};

// Helper function to get store locations as a Map for quick lookups
export const getStoreLocationsMap = (): Map<string, StoreLocation> => {
  const map = new Map<string, StoreLocation>();
  MOCK_STORE_LOCATIONS.forEach(store => {
    map.set(store.storeId, store);
  });
  return map;
}; 