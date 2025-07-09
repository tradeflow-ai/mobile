/**
 * Inventory Data Hooks - TanStack Query integration
 * Provides data access for inventory management and CRUD operations
 * Jack needs these for his CRUD UIs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { supabase } from '@/services/supabase';
import { queryKeys, invalidateQueries } from '@/services/queryClient';

// ==================== TYPES ====================

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  supplier?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  location?: string;
  notes?: string;
  image_url?: string | null; // Base64 encoded image string or null
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryData {
  name: string;
  description?: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  supplier?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  location?: string;
  notes?: string;
  image_url?: string | null; // Base64 encoded image string or null
}

export interface UpdateInventoryData {
  name?: string;
  description?: string;
  sku?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  unit_cost?: number;
  supplier?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  location?: string;
  notes?: string;
  image_url?: string | null; // Base64 encoded image string or null to remove
}

// ==================== QUERY HOOKS ====================

/**
 * Get all inventory items for the current user
 * Jack needs this for the inventory management UI
 */
export const useInventory = (filters?: {
  category?: string;
  status?: InventoryItem['status'];
  supplier?: string;
  location?: string;
}) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: filters ? 
      ['inventory', 'filtered', filters] : 
      queryKeys.inventory(),
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.supplier) {
        query = query.eq('supplier', filters.supplier);
      }
      if (filters?.location) {
        query = query.eq('location', filters.location);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes for inventory
  });
};

/**
 * Get a specific inventory item by ID
 * Jack needs this for item details and editing
 */
export const useInventoryItem = (itemId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: queryKeys.inventoryItem(itemId),
    queryFn: async (): Promise<InventoryItem | null> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Item not found
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!itemId,
    staleTime: 1000 * 60 * 10, // 10 minutes for individual items
  });
};

/**
 * Get inventory items by category
 * Useful for organizing inventory by type
 */
export const useInventoryByCategory = (category: string) => {
  return useInventory({ category });
};

/**
 * Get low stock items
 * Critical for inventory management and alerts
 */
export const useLowStockItems = () => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: queryKeys.inventoryLowStock(),
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .or('status.eq.low_stock,status.eq.out_of_stock')
        .order('quantity', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes for low stock (critical)
  });
};

/**
 * Get inventory items by supplier
 * Useful for supplier management
 */
export const useInventoryBySupplier = (supplier: string) => {
  return useInventory({ supplier });
};

/**
 * Get inventory categories
 * Useful for category management and filtering
 */
export const useInventoryCategories = () => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: async (): Promise<string[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null);

      if (error) {
        throw error;
      }

      // Get unique categories
      const categories = [...new Set(data.map(item => item.category))];
      return categories.sort();
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 15, // 15 minutes for categories
  });
};

// ==================== MUTATION HOOKS ====================

/**
 * Create a new inventory item
 * Jack needs this for adding new items in CRUD UI
 */
export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (itemData: CreateInventoryData): Promise<InventoryItem> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      // Calculate status based on quantity and min_stock_level
      const calculateStatus = (quantity: number, minStock?: number): InventoryItem['status'] => {
        if (quantity === 0) return 'out_of_stock';
        if (minStock && quantity <= minStock) return 'low_stock';
        return 'available';
      };

      const status = calculateStatus(itemData.quantity, itemData.min_stock_level);

      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          ...itemData,
          user_id: user.id,
          status,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (newItem) => {
      // Invalidate and refetch inventory list
      invalidateQueries.allInventory();
      
      // Add the new item to the cache
      queryClient.setQueryData(queryKeys.inventoryItem(newItem.id), newItem);
    },
  });
};

/**
 * Update an existing inventory item
 * Jack needs this for editing items in CRUD UI
 */
export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: UpdateInventoryData }): Promise<InventoryItem> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      // If quantity is being updated, recalculate status
      let statusUpdate = {};
      if (updates.quantity !== undefined) {
        const currentItem = await supabase
          .from('inventory_items')
          .select('min_stock_level')
          .eq('id', itemId)
          .single();

        if (!currentItem.error) {
          const minStock = updates.min_stock_level ?? currentItem.data.min_stock_level;
          const calculateStatus = (quantity: number, minStock?: number): InventoryItem['status'] => {
            if (quantity === 0) return 'out_of_stock';
            if (minStock && quantity <= minStock) return 'low_stock';
            return 'available';
          };

          statusUpdate = { status: calculateStatus(updates.quantity, minStock) };
        }
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          ...updates,
          ...statusUpdate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (updatedItem) => {
      // Update specific item in cache
      queryClient.setQueryData(queryKeys.inventoryItem(updatedItem.id), updatedItem);
      
      // Invalidate inventory list to reflect changes
      invalidateQueries.allInventory();
    },
  });
};

/**
 * Delete an inventory item
 * Jack needs this for removing items in CRUD UI
 */
export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (itemId: string): Promise<string> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return itemId;
    },
    onSuccess: (deletedItemId) => {
      // Remove from specific item cache
      queryClient.removeQueries({ queryKey: queryKeys.inventoryItem(deletedItemId) });
      
      // Invalidate inventory list
      invalidateQueries.allInventory();
    },
  });
};

/**
 * Adjust inventory quantity
 * Special mutation for stock adjustments
 */
export const useAdjustInventoryQuantity = () => {
  const updateItemMutation = useUpdateInventoryItem();

  return useMutation({
    mutationFn: async ({ itemId, adjustment, notes }: { 
      itemId: string; 
      adjustment: number; // positive for increase, negative for decrease
      notes?: string;
    }) => {
      // First get current quantity
      const currentItem = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', itemId)
        .single();

      if (currentItem.error) {
        throw currentItem.error;
      }

      const newQuantity = Math.max(0, currentItem.data.quantity + adjustment);

      return updateItemMutation.mutateAsync({
        itemId,
        updates: {
          quantity: newQuantity,
          notes: notes || `Quantity adjusted by ${adjustment}`,
        },
      });
    },
  });
};

/**
 * Batch update inventory items
 * Useful for bulk operations
 */
export const useBatchUpdateInventory = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (updates: Array<{ itemId: string; updates: UpdateInventoryData }>) => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const results = await Promise.all(
        updates.map(async ({ itemId, updates }) => {
          const { data, error } = await supabase
            .from('inventory_items')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', itemId)
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) {
            throw error;
          }

          return data;
        })
      );

      return results;
    },
    onSuccess: () => {
      // Invalidate all inventory queries
      invalidateQueries.allInventory();
    },
  });
};

// ==================== UTILITY HOOKS ====================

/**
 * Get inventory statistics
 * Useful for dashboard metrics
 */
export const useInventoryStats = () => {
  const { data: inventory, isLoading } = useInventory();
  const { data: lowStockItems } = useLowStockItems();

  const stats = inventory ? {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + (item.unit_cost || 0) * item.quantity, 0),
    averageValue: inventory.length > 0 ? inventory.reduce((sum, item) => sum + (item.unit_cost || 0) * item.quantity, 0) / inventory.length : 0,
    lowStockCount: lowStockItems?.length || 0,
    outOfStockCount: inventory.filter(item => item.status === 'out_of_stock').length,
    categories: [...new Set(inventory.map(item => item.category))].length,
  } : null;

  return {
    stats,
    isLoading,
  };
};

/**
 * Search inventory items
 * Useful for search functionality
 */
export const useSearchInventory = (searchTerm: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: ['inventory', 'search', searchTerm],
    queryFn: async (): Promise<InventoryItem[]> => {
      if (!user?.id || !searchTerm.trim()) {
        return [];
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id && !!searchTerm.trim(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Prefetch inventory item data
 * Utility for preloading item data
 */
export const usePrefetchInventoryItem = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return (itemId: string) => {
    if (!user?.id) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.inventoryItem(itemId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('id', itemId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10,
    });
  };
}; 