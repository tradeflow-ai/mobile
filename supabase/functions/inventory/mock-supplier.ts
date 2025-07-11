/**
 * Mock Supplier API Tool - Deno Compatible
 * 
 * This tool simulates external hardware store APIs (Lowe's, Home Depot, Grainger, etc.)
 * for real-time stock checking and pricing.
 */

/**
 * Input interface for supplier API requests
 */
interface SupplierAPIInput {
  supplier: string;
  items: Array<{
    name: string;
    category?: string;
    quantity?: number;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    radius_miles?: number;
  };
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
    category: 'plumbing'
  },
  'pipe_sealant': {
    brands: ['Oatey', 'Rectorseal', 'Hercules'],
    base_price: 8.99,
    stock_range: [5, 20],
    category: 'plumbing'
  },
  'electrical_outlet': {
    brands: ['Leviton', 'Pass & Seymour', 'Hubbell'],
    base_price: 2.89,
    stock_range: [25, 75],
    category: 'electrical'
  },
  'wire_nuts': {
    brands: ['Ideal', '3M', 'Buchanan'],
    base_price: 12.99,
    stock_range: [10, 30],
    category: 'electrical'
  },
  'ball_valve': {
    brands: ['Apollo', 'SharkBite', 'ProLine'],
    base_price: 15.99,
    stock_range: [8, 25],
    category: 'plumbing'
  }
};

/**
 * Mock Supplier API Function
 * Simulates real-time stock checking and pricing from hardware stores
 */
export const mockSupplierAPI = {
  async invoke(input: SupplierAPIInput) {
    try {
      const { supplier, items, location } = input;
      console.log(`🏪 Mock Supplier API: Checking ${supplier} for ${items.length} items`);
      
      // Simulate API processing delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
        ) * 0.621371 : 5.2
      }));
      
      // Generate item availability
      const itemAvailability = items.map(item => {
        const itemKey = findItemKey(item.name);
        const mockItem = MOCK_INVENTORY[itemKey as keyof typeof MOCK_INVENTORY];
        
        if (!mockItem) {
          return generateGenericItem(item.name, supplier);
        }
        
        const brand = mockItem.brands[Math.floor(Math.random() * mockItem.brands.length)];
        const stockQuantity = Math.floor(Math.random() * (mockItem.stock_range[1] - mockItem.stock_range[0])) + mockItem.stock_range[0];
        const priceVariation = 0.8 + Math.random() * 0.4;
        const price = Math.round(mockItem.base_price * priceVariation * 100) / 100;
        
        return {
          item_name: item.name,
          sku: generateSKU(supplier, itemKey),
          brand,
          price,
          stock_quantity: stockQuantity,
          in_stock: stockQuantity > 0,
          category: mockItem.category,
          description: `${brand} ${item.name}`,
          unit: 'each'
        };
      });
      
      const totalCost = itemAvailability.reduce((sum, item) => {
        const quantity = items.find(i => i.name === item.item_name)?.quantity || 1;
        return sum + (item.price * quantity);
      }, 0);
      
      const response = {
        supplier,
        request_id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        success: true,
        stores: stores.slice(0, 3),
        items: itemAvailability,
        total_estimated_cost: Math.round(totalCost * 100) / 100,
        message: `Found ${itemAvailability.filter(i => i.in_stock).length}/${items.length} items in stock`
      };
      
      console.log(`✅ Mock Supplier API: ${response.message}`);
      return response;
      
    } catch (error) {
      console.error('❌ Mock Supplier API Error:', error);
      
      return {
        supplier: input.supplier,
        request_id: `error_${Date.now()}`,
        timestamp: new Date().toISOString(),
        success: false,
        stores: [],
        items: [],
        total_estimated_cost: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Helper function to find the closest matching item key
 */
function findItemKey(itemName: string): string {
  const normalizedName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const partialMatches: Record<string, string> = {
    'pipe': 'pipe_fitting',
    'fitting': 'pipe_fitting', 
    'sealant': 'pipe_sealant',
    'outlet': 'electrical_outlet',
    'wire': 'wire_nuts',
    'electrical': 'electrical_outlet',
    'valve': 'ball_valve',
    'plumbing': 'pipe_fitting'
  };
  
  for (const [keyword, key] of Object.entries(partialMatches)) {
    if (normalizedName.includes(keyword)) {
      return key;
    }
  }
  
  return 'pipe_fitting';
}

/**
 * Generate generic item data for unknown items
 */
function generateGenericItem(itemName: string, supplier: string) {
  const genericBrands = ['Generic', 'ProTech', 'BuildMaster'];
  const brand = genericBrands[Math.floor(Math.random() * genericBrands.length)];
  const price = 5.99 + Math.random() * 45;
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