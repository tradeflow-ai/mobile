/**
 * Job Data Hooks - TanStack Query integration
 * Provides data access for job management and CRUD operations
 * Jack needs these for his CRUD UIs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { supabase } from '@/services/supabase';
import { queryKeys, invalidateQueries } from '@/services/queryClient';

// ==================== TYPES ====================

export interface JobLocation {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  job_type: 'delivery' | 'pickup' | 'service' | 'inspection' | 'maintenance' | 'emergency' | 'hardware_store';
  business_category?: 'Demand' | 'Maintenance';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration?: number;
  actual_start?: string;
  actual_end?: string;
  required_items?: string[]; // inventory item IDs
  notes?: string;
  completion_notes?: string;
  use_ai_scheduling?: boolean; // Whether AI should select optimal scheduling times
  // Customer fields
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobData {
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  job_type: JobLocation['job_type'];
  business_category?: JobLocation['business_category'];
  priority: JobLocation['priority'];
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration?: number;
  required_items?: string[];
  notes?: string;
  use_ai_scheduling?: boolean;
  // Customer fields
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface UpdateJobData {
  title?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  job_type?: JobLocation['job_type'];
  business_category?: JobLocation['business_category'];
  status?: JobLocation['status'];
  priority?: JobLocation['priority'];
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_duration?: number;
  actual_start?: string;
  actual_end?: string;
  required_items?: string[];
  notes?: string;
  completion_notes?: string;
  use_ai_scheduling?: boolean; // Whether AI should select optimal scheduling times
  // Customer fields
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
}

// ==================== QUERY HOOKS ====================

/**
 * Get all jobs for the current user
 * Jack needs this for the job management UI
 */
export const useJobs = (filters?: {
  status?: JobLocation['status'];
  job_type?: JobLocation['job_type'];
  business_category?: JobLocation['business_category'];
  priority?: JobLocation['priority'];
}) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: filters ? 
      ['jobs', 'filtered', filters] : 
      queryKeys.jobs(),
    queryFn: async (): Promise<JobLocation[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      let query = supabase
        .from('job_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type);
      }
      if (filters?.business_category) {
        query = query.eq('business_category', filters.business_category);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Get a specific job by ID
 * Jack needs this for job details and editing
 */
export const useJob = (jobId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: queryKeys.job(jobId),
    queryFn: async (): Promise<JobLocation | null> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('job_locations')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Job not found
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!jobId,
    staleTime: 1000 * 60 * 5, // 5 minutes for individual jobs
  });
};

/**
 * Get jobs by status (pending, in_progress, completed, cancelled)
 * Useful for filtering and dashboard views
 */
export const useJobsByStatus = (status: JobLocation['status']) => {
  return useJobs({ status });
};

/**
 * Get jobs by type (delivery, pickup, service, etc.)
 * Useful for organizing work by type
 */
export const useJobsByType = (job_type: JobLocation['job_type']) => {
  return useJobs({ job_type });
};

/**
 * Get jobs by business category (Demand vs Maintenance)
 * Useful for business analytics
 */
export const useJobsByBusinessCategory = (business_category: JobLocation['business_category']) => {
  return useJobs({ business_category });
};



// ==================== MUTATION HOOKS ====================

/**
 * Create a new job with enhanced optimistic updates
 * Jack needs this for adding new jobs in CRUD UI
 */
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async ({ 
      jobData, 
      operationId 
    }: { 
      jobData: CreateJobData; 
      operationId?: string 
    }): Promise<JobLocation> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      // Check if we're offline or should batch this operation
      const { offlineStatusService } = await import('@/services/offlineStatusService');
      const { batchOperationsService } = await import('@/services/batchOperationsService');
      
      if (!offlineStatusService.isOnline()) {
        // Queue operation for batch processing when back online
        const batchOperationId = batchOperationsService.queueOperation(
          'create',
          'job',
          {
            ...jobData,
            user_id: user.id,
            status: 'pending',
          },
          undefined,
          'critical' // Job operations are critical
        );
        
        console.log(`Job creation queued for batch processing: ${batchOperationId}`);
        
        // Create a temporary response for optimistic updates
        const tempJob: JobLocation = {
          id: `temp_${Date.now()}`,
          ...jobData,
          user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        return tempJob;
      }

      try {
        const { data, error } = await supabase
          .from('job_locations')
          .insert({
            ...jobData,
            user_id: user.id,
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Mark optimistic operation as successful
        if (operationId) {
          offlineStatusService.handleSyncSuccess(operationId);
        }

        return data;
      } catch (error) {
        // If online but operation failed, queue for batch retry
        const batchOperationId = batchOperationsService.queueOperation(
          'create',
          'job',
          {
            ...jobData,
            user_id: user.id,
            status: 'pending',
          },
          undefined,
          'critical'
        );
        
        console.log(`Job creation failed, queued for batch retry: ${batchOperationId}`);
        
        // Mark optimistic operation as failed
        if (operationId) {
          offlineStatusService.handleSyncFailure(error, operationId);
        }
        throw error;
      }
    },
    onSuccess: (newJob, { operationId }) => {
      // Replace the temporary optimistic job with the real one
      if (operationId) {
        // Find and replace temporary job in cache
        queryClient.setQueryData(queryKeys.jobs(), (old: any[]) => {
          if (!old) return [newJob];
          return old.map(job => 
            job.id?.startsWith('temp_') ? newJob : job
          );
        });
      } else {
        // Invalidate and refetch jobs list (fallback for non-optimistic updates)
        invalidateQueries.allJobs();
      }
      
      // Add the real job to the cache
      queryClient.setQueryData(queryKeys.job(newJob.id), newJob);
    },
    onError: (error, { operationId }) => {
      console.error('Job creation failed:', error);
      // Optimistic rollback is handled automatically in the mutation function
    },
  });
};

/**
 * Update an existing job
 * Jack needs this for editing jobs in CRUD UI
 */
export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: UpdateJobData }): Promise<JobLocation> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('job_locations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (updatedJob) => {
      // Update specific job in cache
      queryClient.setQueryData(queryKeys.job(updatedJob.id), updatedJob);
      
      // Invalidate jobs list to reflect changes
      invalidateQueries.allJobs();
      
      // If route-related changes, invalidate routes
      if (updatedJob.latitude || updatedJob.longitude || updatedJob.scheduled_start) {
        invalidateQueries.allRoutes();
      }
    },
  });
};

/**
 * Delete a job
 * Jack needs this for removing jobs in CRUD UI
 */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return useMutation({
    mutationFn: async (jobId: string): Promise<string> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('job_locations')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return jobId;
    },
    onSuccess: (deletedJobId) => {
      // Remove from specific job cache
      queryClient.removeQueries({ queryKey: queryKeys.job(deletedJobId) });
      
      // Invalidate jobs list
      invalidateQueries.allJobs();
      
      // Invalidate routes that might include this job
      invalidateQueries.allRoutes();
    },
  });
};

/**
 * Mark job as completed
 * Special mutation for completing jobs with completion notes
 * ENHANCED: Uses critical operations service for offline-first updates
 */
export const useCompleteJob = () => {
  const updateJobMutation = useUpdateJob();

  return useMutation({
    mutationFn: async ({ jobId, completionNotes, actualEnd, location }: { 
      jobId: string; 
      completionNotes?: string;
      actualEnd?: string;
      location?: { latitude: number; longitude: number };
    }) => {
      // Use critical operations service for offline-first status update
      const { criticalOperationsService } = await import('@/services/criticalOperationsService');
      
      await criticalOperationsService.updateJobStatus({
        jobId,
        newStatus: 'completed',
        previousStatus: 'in_progress', // Assume it was in progress
        timestamp: new Date(),
        location,
      });

      // Also update via traditional mutation for additional fields
      return updateJobMutation.mutateAsync({
        jobId,
        updates: {
          status: 'completed',
          completion_notes: completionNotes,
          actual_end: actualEnd || new Date().toISOString(),
          ...(location && {
            current_latitude: location.latitude,
            current_longitude: location.longitude,
          }),
        },
      });
    },
  });
};

/**
 * Start job (mark as in_progress)
 * Special mutation for starting jobs
 * ENHANCED: Uses critical operations service for offline-first updates
 */
export const useStartJob = () => {
  const updateJobMutation = useUpdateJob();

  return useMutation({
    mutationFn: async ({ jobId, actualStart, location }: { 
      jobId: string; 
      actualStart?: string;
      location?: { latitude: number; longitude: number };
    }) => {
      // Use critical operations service for offline-first status update
      const { criticalOperationsService } = await import('@/services/criticalOperationsService');
      
      await criticalOperationsService.updateJobStatus({
        jobId,
        newStatus: 'in_progress',
        previousStatus: 'pending', // Assume it was pending
        timestamp: new Date(),
        location,
      });

      // Also update via traditional mutation for additional fields
      return updateJobMutation.mutateAsync({
        jobId,
        updates: {
          status: 'in_progress',
          actual_start: actualStart || new Date().toISOString(),
          ...(location && {
            current_latitude: location.latitude,
            current_longitude: location.longitude,
          }),
        },
      });
    },
  });
};

/**
 * Pause job (mark as paused)
 * Special mutation for pausing jobs with offline-first support
 */
export const usePauseJob = () => {
  const updateJobMutation = useUpdateJob();

  return useMutation({
    mutationFn: async ({ jobId, location }: { 
      jobId: string; 
      location?: { latitude: number; longitude: number };
    }) => {
      // Use critical operations service for offline-first status update
      const { criticalOperationsService } = await import('@/services/criticalOperationsService');
      
      await criticalOperationsService.updateJobStatus({
        jobId,
        newStatus: 'paused',
        previousStatus: 'in_progress', // Assume it was in progress
        timestamp: new Date(),
        location,
      });

      // Also update via traditional mutation
      return updateJobMutation.mutateAsync({
        jobId,
        updates: {
          status: 'paused',
          ...(location && {
            current_latitude: location.latitude,
            current_longitude: location.longitude,
          }),
        },
      });
    },
  });
};

// ==================== UTILITY HOOKS ====================

/**
 * Get jobs count by status
 * Useful for dashboard metrics
 */
export const useJobsCount = () => {
  const { data: jobs, isLoading } = useJobs();

  const counts = jobs?.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<JobLocation['status'], number>) || {};

  return {
    counts,
    totalJobs: jobs?.length || 0,
    isLoading,
  };
};

/**
 * Get jobs for a specific date range
 * Useful for calendar views that show multiple days
 */
export const useJobsForDateRange = (startDate: Date, endDate: Date) => {
  const [user] = useAtom(userAtom);
  
  // Convert local dates to UTC for database query
  // Get the local date string first, then convert to UTC
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDateStr = getLocalDateString(startDate);
  const endDateStr = getLocalDateString(endDate);

  return useQuery({
    queryKey: ['jobs', 'date-range', startDateStr, endDateStr],
    queryFn: async (): Promise<JobLocation[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      // Convert local date strings to UTC timestamps for database query
      const startUTC = new Date(`${startDateStr}T00:00:00`).toISOString();
      const endUTC = new Date(`${endDateStr}T00:00:00`).toISOString();

      const { data, error } = await supabase
        .from('job_locations')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_start', startUTC)
        .lt('scheduled_start', endUTC)
        .order('scheduled_start', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get today's jobs
 * Useful for daily planning
 */
export const useTodaysJobs = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return useJobsForDateRange(today, tomorrow);
};

/**
 * Prefetch job data
 * Utility for preloading job data
 */
export const usePrefetchJob = () => {
  const queryClient = useQueryClient();
  const [user] = useAtom(userAtom);

  return (jobId: string) => {
    if (!user?.id) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.job(jobId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('job_locations')
          .select('*')
          .eq('id', jobId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 5,
    });
  };
}; 