/**
 * Mock Supplier API Tool
 * 
 * This tool simulates external hardware store APIs (Lowe's, Home Depot, Grainger, etc.)
 * for real-time stock checking and pricing. In Phase 3, this will be replaced with
 * actual API integrations.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Input schema for supplier API requests
 */
const SupplierAPIInputSchema = z.object({
  supplier: z.string(), // 'home_depot', 'lowes', 'grainger', etc.
  items: z.array(z.object({
    name: z.string(),
    category: z.string().optional(),
    quantity: z.number().optional()
  })),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radius_miles: z.number().optional()
  }).optional()
});

/**
 * Store location interface
 */
export interface StoreLocation {
  store_id: string;
  store_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  hours: {
    open: string;
    close: string;
  };
  distance_miles: number;
}

/**
 * Item availability interface
 */
export interface ItemAvailability {
  item_name: string;
  sku: string;
  brand: string;
  price: number;
  stock_quantity: number;
  in_stock: boolean;
  category: string;
  description: string;
  unit: string;
  image_url?: string;
}

/**
 * Supplier API response interface
 */
export interface SupplierAPIResponse {
  supplier: string;
  request_id: string;
  timestamp: string;
  success: boolean;
  stores: StoreLocation[];
  items: ItemAvailability[];
  total_estimated_cost: number;
  message?: string;
}

/**
 * Mock supplier data for realistic responses
 */
const MOCK_SUPPLIERS = {
  'home_depot': {
    name: 'The Home Depot',
    stores: [
      {
        store_id: 'HD_SF_001',
        store_name: 'The Home Depot #4512',
        address: '1965 Ocean Ave',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94127',
        coordinates: { latitude: 37.7249, longitude: -122.4564 },
        phone: '(415) 469-1142',
        hours: { open: '06:00', close: '22:00' }
      },
      {
        store_id: 'HD_SF_002', 
        store_name: 'The Home Depot #4518',
        address: '2525 Bayshore Blvd',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94134',
        coordinates: { latitude: 37.7403, longitude: -122.3892 },
        phone: '(415) 468-1142',
        hours: { open: '06:00', close: '22:00' }
      }
    ]
  },
  'lowes': {
    name: 'Lowe\'s',
    stores: [
      {
        store_id: 'LWS_SF_001',
        store_name: 'Lowe\'s Home Improvement #2584',
        address: '1200 Harrison St',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94103',
        coordinates: { latitude: 37.7749, longitude: -122.4114 },
        phone: '(415) 864-3500',
        hours: { open: '06:00', close: '21:00' }
      }
    ]
  },
  'grainger': {
    name: 'Grainger Industrial Supply',
    stores: [
      {
        store_id: 'GR_SF_001',
        store_name: 'Grainger Branch #9A549',
        address: '1230 Howard St',
        city: 'San Francisco', 
        state: 'CA',
        zip_code: '94103',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        phone: '(415) 575-0400',
        hours: { open: '07:00', close: '17:00' }
      }
    ]
  },
  'ferguson': {
    name: 'Ferguson Plumbing Supply',
    stores: [
      {
        store_id: 'FRG_SF_001',
        store_name: 'Ferguson Enterprises #1420',
        address: '1001 16th St',
        city: 'San Francisco',
        state: 'CA', 
        zip_code: '94107',
        coordinates: { latitude: 37.7658, longitude: -122.4002 },
        phone: '(415) 861-8300',
        hours: { open: '07:00', close: '16:30' }
      }
    ]
  }
};

/**
 * Mock inventory data with realistic plumbing/electrical items
 */
const MOCK_INVENTORY = {
  'pipe_fitting': {
    brands: ['Nibco', 'Mueller', 'Charlotte'],
    base_price: 3.50,
    stock_range: [15, 45],
    categories: ['plumbing', 'fittings'],
    descriptions: ['1/2" Copper Pipe Fitting', '3/4" PVC Pipe Fitting', '1" Brass Pipe Fitting']
  },
  'pipe_sealant': {
    brands: ['Oatey', 'Rectorseal', 'Hercules'],
    base_price: 8.99,
    stock_range: [5, 20],
    categories: ['plumbing', 'sealants'],
    descriptions: ['Pipe Thread Sealant Tube', 'Plumber\'s Putty 14oz', 'Teflon Tape Roll']
  },
  'pipe_wrench': {
    brands: ['Ridgid', 'Reed', 'Wheeler Rex'],
    base_price: 45.99,
    stock_range: [3, 12],
    categories: ['tools', 'plumbing'],
    descriptions: ['14" Pipe Wrench', '18" Heavy Duty Pipe Wrench', '24" Professional Pipe Wrench']
  },
  'electrical_outlet': {
    brands: ['Leviton', 'Pass & Seymour', 'Hubbell'],
    base_price: 2.89,
    stock_range: [25, 75],
    categories: ['electrical', 'outlets'],
    descriptions: ['GFCI Outlet 15A', 'Duplex Outlet 20A', 'USB Outlet with Charging']
  },
  'wire_nuts': {
    brands: ['Ideal', '3M', 'Buchanan'],
    base_price: 12.99,
    stock_range: [10, 30],
    categories: ['electrical', 'connectors'],
    descriptions: ['Wire Nut Assortment Pack', 'Yellow Wire Nuts (100)', 'Red Wire Nuts (100)']
  },
  'pvc_pipe': {
    brands: ['Charlotte', 'Nibco', 'IPEX'],
    base_price: 4.25,
    stock_range: [20, 60],
    categories: ['plumbing', 'pipes'],
    descriptions: ['1/2" PVC Pipe 10ft', '3/4" PVC Pipe 10ft', '1" PVC Pipe 10ft']
  },
  'ball_valve': {
    brands: ['Apollo', 'SharkBite', 'ProLine'],
    base_price: 15.99,
    stock_range: [8, 25],
    categories: ['plumbing', 'valves'],
    descriptions: ['3/4" Ball Valve Bronze', '1/2" Ball Valve Full Port', '1" Ball Valve Lead Free']
  },
  'air_filter': {
    brands: ['Honeywell', 'Filtrete', 'Nordic Pure'],
    base_price: 18.99,
    stock_range: [12, 40],
    categories: ['hvac', 'filters'],
    descriptions: ['16x20x1 MERV 8 Filter', '20x25x1 MERV 11 Filter', '16x25x1 MERV 13 Filter']
  }
};

/**
 * Mock Supplier API Tool
 * Simulates real-time stock checking and pricing from hardware stores
 */
export const mockSupplierAPI = tool(
  async ({ supplier, items, location }) => {
    try {
      console.log(`🏪 Mock Supplier API: Checking ${supplier} for ${items.length} items`);
      
      // Simulate API processing delay
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
      
      const supplierData = MOCK_SUPPLIERS[supplier as keyof typeof MOCK_SUPPLIERS];
      if (!supplierData) {
        throw new Error(`Supplier '${supplier}' not supported in mock API`);
      }
      
      // Calculate store distances if location provided
      const stores = supplierData.stores.map(store => ({
        ...store,
        distance_miles: location ? calculateDistance(
          location.latitude,
          location.longitude,
          store.coordinates.latitude,
          store.coordinates.longitude
        ) * 0.621371 : 5.2 // Convert km to miles, default to 5.2 miles
      })).sort((a, b) => a.distance_miles - b.distance_miles);
      
      // Generate item availability
      const itemAvailability: ItemAvailability[] = items.map(item => {
        const itemKey = findItemKey(item.name);
        const mockItem = MOCK_INVENTORY[itemKey as keyof typeof MOCK_INVENTORY];
        
        if (!mockItem) {
          // Generate basic mock data for unknown items
          return generateGenericItem(item.name, supplier);
        }
        
        // Generate realistic availability data
        const brand = mockItem.brands[Math.floor(Math.random() * mockItem.brands.length)];
        const description = mockItem.descriptions[Math.floor(Math.random() * mockItem.descriptions.length)];
        const stockQuantity = Math.floor(Math.random() * (mockItem.stock_range[1] - mockItem.stock_range[0])) + mockItem.stock_range[0];
        const priceVariation = 0.8 + Math.random() * 0.4; // ±20% price variation
        const price = Math.round(mockItem.base_price * priceVariation * 100) / 100;
        
        return {
          item_name: item.name,
          sku: generateSKU(supplier, itemKey),
          brand,
          price,
          stock_quantity: stockQuantity,
          in_stock: stockQuantity > 0,
          category: mockItem.categories[0],
          description,
          unit: 'each',
          image_url: `https://example.com/images/${itemKey}.jpg`
        };
      });
      
      const totalCost = itemAvailability.reduce((sum, item) => {
        const quantity = items.find(i => i.name === item.item_name)?.quantity || 1;
        return sum + (item.price * quantity);
      }, 0);
      
      const response: SupplierAPIResponse = {
        supplier,
        request_id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        success: true,
        stores: stores.slice(0, 3), // Return top 3 closest stores
        items: itemAvailability,
        total_estimated_cost: Math.round(totalCost * 100) / 100,
        message: `Found ${itemAvailability.filter(i => i.in_stock).length}/${items.length} items in stock`
      };
      
      console.log(`✅ Mock Supplier API: ${response.message}`);
      return response;
      
    } catch (error) {
      console.error('❌ Mock Supplier API Error:', error);
      
      return {
        supplier,
        request_id: `error_${Date.now()}`,
        timestamp: new Date().toISOString(),
        success: false,
        stores: [],
        items: [],
        total_estimated_cost: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  {
    name: "mock_supplier_api",
    description: "Mock supplier API for checking hardware store inventory and pricing",
    schema: SupplierAPIInputSchema,
  }
);

/**
 * Helper function to find the closest matching item key
 */
function findItemKey(itemName: string): string {
  const normalizedName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Check for exact matches first
  for (const key of Object.keys(MOCK_INVENTORY)) {
    if (normalizedName.includes(key.replace('_', ''))) {
      return key;
    }
  }
  
  // Check for partial matches
  const partialMatches: Record<string, string[]> = {
    'pipe': ['pipe_fitting', 'pvc_pipe'],
    'fitting': ['pipe_fitting'],
    'sealant': ['pipe_sealant'],
    'wrench': ['pipe_wrench'],
    'outlet': ['electrical_outlet'],
    'wire': ['wire_nuts'],
    'electrical': ['electrical_outlet', 'wire_nuts'],
    'valve': ['ball_valve'],
    'filter': ['air_filter'],
    'hvac': ['air_filter'],
    'plumbing': ['pipe_fitting', 'pipe_sealant', 'ball_valve']
  };
  
  for (const [keyword, keys] of Object.entries(partialMatches)) {
    if (normalizedName.includes(keyword)) {
      return keys[0]; // Return first match
    }
  }
  
  // Default fallback
  return 'pipe_fitting';
}

/**
 * Generate generic item data for unknown items
 */
function generateGenericItem(itemName: string, supplier: string): ItemAvailability {
  const genericBrands = ['Generic', 'ProTech', 'BuildMaster', 'TradePro'];
  const brand = genericBrands[Math.floor(Math.random() * genericBrands.length)];
  const price = 5.99 + Math.random() * 45; // $5.99 - $50.99
  const stockQuantity = Math.floor(Math.random() * 20);
  
  return {
    item_name: itemName,
    sku: generateSKU(supplier, 'generic'),
    brand,
    price: Math.round(price * 100) / 100,
    stock_quantity: stockQuantity,
    in_stock: stockQuantity > 0,
    category: 'general',
    description: `${brand} ${itemName}`,
    unit: 'each'
  };
}

/**
 * Generate realistic SKU numbers
 */
function generateSKU(supplier: string, itemKey: string): string {
  const prefixes: Record<string, string> = {
    'home_depot': 'HD',
    'lowes': 'LW',
    'grainger': 'GR',
    'ferguson': 'FG'
  };
  
  const prefix = prefixes[supplier] || 'GN';
  const itemCode = itemKey.slice(0, 4).toUpperCase().padEnd(4, '0');
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  return `${prefix}-${itemCode}-${randomNum}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

/**
 * Utility function to test the mock API
 */
export async function testMockSupplierAPI() {
  console.log('🧪 Testing Mock Supplier API...');
  
  const testResult = await mockSupplierAPI.invoke({
    supplier: 'home_depot',
    items: [
      { name: 'Pipe Fitting', category: 'plumbing', quantity: 2 },
      { name: 'Wire Nuts', category: 'electrical', quantity: 1 },
      { name: 'Ball Valve', category: 'plumbing', quantity: 1 }
    ],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      radius_miles: 10
    }
  });
  
  console.log('✅ Mock API Test Result:', testResult);
  return testResult;
} 