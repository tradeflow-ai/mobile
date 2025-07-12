/**
 * Supplier Service - Mock Hardware Store Inventory Integration
 * 
 * Provides real-time inventory checking capability for the Inventory & Prep Specialist agent.
 * Uses mock data to simulate hardware store APIs like Lowe's or Home Depot.
 */

import { 
  MOCK_INVENTORY_DATA, 
  MOCK_STORE_LOCATIONS, 
  getInventoryMap, 
  getStoreLocationsMap,
  type SupplierItem,
  type StoreLocation
} from './mockData/supplierInventory';

export interface StockCheckItem {
  itemName: string;
  inStock: boolean;
  available: number;
  price: number;
  storeId: string;
  category: string;
  sku: string;
  description: string;
  alternatives?: string[];
}

export interface StockCheckResult {
  items: StockCheckItem[];
  totalItems: number;
  inStockCount: number;
  outOfStockCount: number;
  estimatedTotal: number;
  storeId: string;
  timestamp: string;
}

export interface StoreLocationInfo {
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
  distanceFromUser?: number; // in miles
}

export class SupplierService {
  private static instance: SupplierService;
  private inventoryMap: Map<string, SupplierItem>;
  private storeLocationsMap: Map<string, StoreLocation>;

  private constructor() {
    this.inventoryMap = getInventoryMap();
    this.storeLocationsMap = getStoreLocationsMap();
  }

  static getInstance(): SupplierService {
    if (!SupplierService.instance) {
      SupplierService.instance = new SupplierService();
    }
    return SupplierService.instance;
  }

  /**
   * Check stock availability for a list of items
   * @param itemNames Array of item names to check
   * @param preferredStoreId Optional preferred store ID
   * @returns Promise resolving to stock check results
   */
  async checkStock(itemNames: string[], preferredStoreId?: string): Promise<StockCheckResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const results: StockCheckItem[] = [];
    let totalPrice = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;

    // Default to first store if no preference specified
    const storeId = preferredStoreId || MOCK_STORE_LOCATIONS[0].storeId;

    for (const itemName of itemNames) {
      const normalizedName = itemName.toLowerCase().trim();
      let item = this.inventoryMap.get(normalizedName);

      // If exact match not found, try fuzzy matching
      if (!item) {
        item = this.findSimilarItem(normalizedName);
      }

      if (item) {
        const stockItem: StockCheckItem = {
          itemName: item.itemName,
          inStock: item.inStock,
          available: item.available,
          price: item.price,
          storeId: item.storeId,
          category: item.category,
          sku: item.sku,
          description: item.description,
          alternatives: item.inStock ? undefined : this.findAlternatives(item.category)
        };

        results.push(stockItem);
        totalPrice += item.price;
        
        if (item.inStock) {
          inStockCount++;
        } else {
          outOfStockCount++;
        }
      } else {
        // Item not found in our mock data
        const unknownItem: StockCheckItem = {
          itemName: itemName,
          inStock: false,
          available: 0,
          price: 0,
          storeId: storeId,
          category: 'Unknown',
          sku: 'N/A',
          description: `${itemName} - Item not found in inventory`,
          alternatives: ['Contact store for availability']
        };

        results.push(unknownItem);
        outOfStockCount++;
      }
    }

    return {
      items: results,
      totalItems: itemNames.length,
      inStockCount,
      outOfStockCount,
      estimatedTotal: totalPrice,
      storeId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get store location information
   * @param storeId Store identifier
   * @returns Promise resolving to store location details
   */
  async getStoreLocation(storeId: string): Promise<StoreLocationInfo | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const store = this.storeLocationsMap.get(storeId);
    if (!store) {
      return null;
    }

    return {
      storeId: store.storeId,
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      zipCode: store.zipCode,
      latitude: store.latitude,
      longitude: store.longitude,
      phone: store.phone,
      hours: store.hours
    };
  }

  /**
   * Get all available store locations
   * @returns Promise resolving to array of store locations
   */
  async getAllStoreLocations(): Promise<StoreLocationInfo[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 75));

    return Array.from(this.storeLocationsMap.values()).map(store => ({
      storeId: store.storeId,
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      zipCode: store.zipCode,
      latitude: store.latitude,
      longitude: store.longitude,
      phone: store.phone,
      hours: store.hours
    }));
  }

  /**
   * Find the nearest store to given coordinates
   * @param userLatitude User's latitude
   * @param userLongitude User's longitude
   * @returns Promise resolving to nearest store location
   */
  async findNearestStore(userLatitude: number, userLongitude: number): Promise<StoreLocationInfo | null> {
    const stores = await this.getAllStoreLocations();
    
    if (stores.length === 0) {
      return null;
    }

    let nearestStore = stores[0];
    let minDistance = this.calculateDistance(userLatitude, userLongitude, nearestStore.latitude, nearestStore.longitude);

    for (const store of stores) {
      const distance = this.calculateDistance(userLatitude, userLongitude, store.latitude, store.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = store;
      }
    }

    return {
      ...nearestStore,
      distanceFromUser: minDistance
    };
  }

  /**
   * Private helper to find similar items using fuzzy matching
   */
  private findSimilarItem(searchTerm: string): SupplierItem | undefined {
    const searchWords = searchTerm.split(' ');
    
    for (const item of MOCK_INVENTORY_DATA) {
      const itemName = item.itemName.toLowerCase();
      const itemWords = itemName.split(' ');
      
      // Check if any search word matches any item word
      for (const searchWord of searchWords) {
        for (const itemWord of itemWords) {
          if (itemWord.includes(searchWord) || searchWord.includes(itemWord)) {
            return item;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Private helper to find alternatives for out-of-stock items
   */
  private findAlternatives(category: string): string[] {
    const alternatives = MOCK_INVENTORY_DATA
      .filter(item => item.category === category && item.inStock)
      .map(item => item.itemName)
      .slice(0, 3); // Return up to 3 alternatives

    return alternatives.length > 0 ? alternatives : ['Check with store associate for alternatives'];
  }

  /**
   * Private helper to calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Private helper to convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
export const supplierService = SupplierService.getInstance(); 