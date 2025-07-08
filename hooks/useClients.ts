/**
 * Client Data Hooks - TanStack Query integration
 * Provides data access for client management and CRUD operations
 * MVP Feature: Client management for job assignment
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { supabase } from '@/services/supabase';
import { queryKeys, invalidateQueries } from '@/services/queryClient';

// ==================== TYPES ====================

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  business_type?: string;
  preferred_contact_method: 'phone' | 'email' | 'text';
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  business_type?: string;
  preferred_contact_method?: Client['preferred_contact_method'];
  notes?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  business_type?: string;
  preferred_contact_method?: Client['preferred_contact_method'];
  notes?: string;
  is_active?: boolean;
}

// ==================== QUERY HOOKS ====================

/**
 * Get all clients for the current user
 * MVP Feature: Client list for job assignment
 */
export const useClients = (filters?: {
  is_active?: boolean;
  business_type?: string;
  city?: string;
  state?: string;
}) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: filters ? 
      ['clients', 'filtered', filters] : 
      queryKeys.clients(),
    queryFn: async (): Promise<Client[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      let query = supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      // Apply filters
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.business_type) {
        query = query.eq('business_type', filters.business_type);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get active clients only
 * Most common use case for job assignment
 */
export const useActiveClients = () => {
  return useClients({ is_active: true });
};

/**
 * Get a specific client by ID
 * For client details and editing
 */
export const useClient = (clientId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: queryKeys.client(clientId),
    queryFn: async (): Promise<Client | null> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Client not found
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!clientId,
    staleTime: 1000 * 60 * 10, // 10 minutes for individual clients
  });
};

/**
 * Search clients by name, company, or email
 * For client lookup functionality
 */
export const useSearchClients = (searchTerm: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: ['clients', 'search', searchTerm],
    queryFn: async (): Promise<Client[]> => {
      if (!user?.id || !searchTerm.trim()) {
        return [];
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
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
 * Get clients by business type
 * For business analytics and filtering
 */
export const useClientsByBusinessType = (businessType: string) => {
  return useClients({ business_type: businessType });
};

/**
 * Get clients by location (city/state)
 * For geographic organization
 */
export const useClientsByLocation = (city?: string, state?: string) => {
  return useClients({ city, state });
};

// ==================== MUTATION HOOKS ====================

/**
 * Create a new client
 * MVP Feature: Add new clients for job assignment
 */
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (clientData: CreateClientData): Promise<Client> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (newClient) => {
      // Invalidate and refetch clients list
      invalidateQueries.allClients();
      
      // Add the new client to the cache
      queryClient.setQueryData(queryKeys.client(newClient.id), newClient);
    },
  });
};

/**
 * Update an existing client
 * MVP Feature: Edit client information
 */
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async ({ clientId, updates }: { clientId: string; updates: UpdateClientData }): Promise<Client> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (updatedClient) => {
      // Update specific client in cache
      queryClient.setQueryData(queryKeys.client(updatedClient.id), updatedClient);
      
      // Invalidate clients list to reflect changes
      invalidateQueries.allClients();
      
      // Invalidate jobs that reference this client
      invalidateQueries.allJobs();
    },
  });
};

/**
 * Delete a client
 * MVP Feature: Remove clients (soft delete by deactivating)
 */
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (clientId: string): Promise<string> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return clientId;
    },
    onSuccess: (deletedClientId) => {
      // Remove from specific client cache
      queryClient.removeQueries({ queryKey: queryKeys.client(deletedClientId) });
      
      // Invalidate clients list
      invalidateQueries.allClients();
      
      // Invalidate jobs that might reference this client
      invalidateQueries.allJobs();
    },
  });
};

/**
 * Deactivate a client (soft delete)
 * Preferred over hard delete to maintain job history
 */
export const useDeactivateClient = () => {
  const updateClientMutation = useUpdateClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      return updateClientMutation.mutateAsync({
        clientId,
        updates: { is_active: false },
      });
    },
  });
};

/**
 * Reactivate a client
 * Restore deactivated client
 */
export const useReactivateClient = () => {
  const updateClientMutation = useUpdateClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      return updateClientMutation.mutateAsync({
        clientId,
        updates: { is_active: true },
      });
    },
  });
};

// ==================== UTILITY HOOKS ====================

/**
 * Get client statistics
 * For dashboard and analytics
 */
export const useClientStats = () => {
  const { data: clients, isLoading } = useClients();

  const stats = clients ? {
    totalClients: clients.length,
    activeClients: clients.filter(client => client.is_active).length,
    inactiveClients: clients.filter(client => !client.is_active).length,
    businessTypes: [...new Set(clients.map(client => client.business_type).filter(Boolean))],
    locations: [...new Set(clients.map(client => client.city).filter(Boolean))],
    withEmail: clients.filter(client => client.email).length,
    withPhone: clients.filter(client => client.phone).length,
  } : null;

  return {
    stats,
    isLoading,
  };
};

/**
 * Get client jobs count
 * Shows how many jobs each client has
 */
export const useClientJobsCount = (clientId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: ['clients', clientId, 'jobs-count'],
    queryFn: async (): Promise<number> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { count, error } = await supabase
        .from('job_locations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      return count || 0;
    },
    enabled: !!user?.id && !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get client display name
 * Helper for consistent client naming
 */
export const getClientDisplayName = (client: Client): string => {
  if (client.company_name) {
    return client.contact_person ? 
      `${client.company_name} (${client.contact_person})` : 
      client.company_name;
  }
  return client.name;
};

/**
 * Get client display contact
 * Helper for consistent contact display
 */
export const getClientDisplayContact = (client: Client): string => {
  const contacts = [];
  if (client.phone) contacts.push(client.phone);
  if (client.email) contacts.push(client.email);
  return contacts.join(' • ');
};

/**
 * Prefetch client data
 * Utility for preloading client data
 */
export const usePrefetchClient = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return (clientId: string) => {
    if (!user?.id) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.client(clientId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10,
    });
  };
}; 