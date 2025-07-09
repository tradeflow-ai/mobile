/**
 * BoM (Bill of Materials) Data Hooks - TanStack Query integration
 * Provides data access for job types, part templates, and BoM associations
 * MVP Feature: Job type selection and auto-populated parts for job creation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import { supabase } from '@/services/supabase';
import { queryKeys, invalidateQueries } from '@/services/queryClient';

// ==================== TYPES ====================

export interface JobType {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category?: string; // 'plumbing', 'electrical', 'hvac', 'general', etc.
  estimated_duration: number; // minutes
  default_priority: 'low' | 'medium' | 'high' | 'urgent';
  labor_rate?: number; // hourly rate for this type of work
  markup_percentage: number; // default 15% markup on parts
  instructions?: string; // standardized work instructions
  safety_notes?: string; // safety considerations
  required_certifications?: string[]; // certifications needed
  is_active: boolean;
  is_template: boolean; // system template vs user custom
  created_at: string;
  updated_at: string;
}

export interface PartTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  part_number?: string;
  category?: string; // matches inventory categories
  unit: string; // 'each', 'feet', 'gallons', etc.
  estimated_cost?: number;
  preferred_supplier?: string;
  specifications?: string; // technical specs, dimensions, etc.
  notes?: string;
  is_common: boolean; // frequently used parts
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobTypePart {
  id: string;
  user_id: string;
  job_type_id: string;
  part_template_id: string;
  quantity_needed: number; // can be fractional (e.g., 2.5 feet)
  is_required: boolean; // required vs optional parts
  notes?: string; // specific usage notes for this job type
  created_at: string;
  // Joined data from related tables
  job_type?: JobType;
  part_template?: PartTemplate;
}

export interface JobTypePartsWithDetails extends JobTypePart {
  job_type: JobType;
  part_template: PartTemplate;
}

// Create/Update types
export interface CreateJobTypeData {
  name: string;
  description?: string;
  category?: string;
  estimated_duration?: number;
  default_priority?: JobType['default_priority'];
  labor_rate?: number;
  markup_percentage?: number;
  instructions?: string;
  safety_notes?: string;
  required_certifications?: string[];
  is_active?: boolean;
  is_template?: boolean;
}

export interface UpdateJobTypeData {
  name?: string;
  description?: string;
  category?: string;
  estimated_duration?: number;
  default_priority?: JobType['default_priority'];
  labor_rate?: number;
  markup_percentage?: number;
  instructions?: string;
  safety_notes?: string;
  required_certifications?: string[];
  is_active?: boolean;
  is_template?: boolean;
}

export interface CreatePartTemplateData {
  name: string;
  description?: string;
  part_number?: string;
  category?: string;
  unit?: string;
  estimated_cost?: number;
  preferred_supplier?: string;
  specifications?: string;
  notes?: string;
  is_common?: boolean;
  is_active?: boolean;
}

export interface UpdatePartTemplateData {
  name?: string;
  description?: string;
  part_number?: string;
  category?: string;
  unit?: string;
  estimated_cost?: number;
  preferred_supplier?: string;
  specifications?: string;
  notes?: string;
  is_common?: boolean;
  is_active?: boolean;
}

export interface CreateJobTypePartData {
  job_type_id: string;
  part_template_id: string;
  quantity_needed: number;
  is_required?: boolean;
  notes?: string;
}

export interface UpdateJobTypePartData {
  quantity_needed?: number;
  is_required?: boolean;
  notes?: string;
}

// ==================== JOB TYPES QUERY HOOKS ====================

/**
 * Get all job types for the current user
 * MVP Feature: Job type selection for job creation
 */
export const useJobTypes = (filters?: {
  category?: string;
  is_active?: boolean;
  is_template?: boolean;
}) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: filters ? 
      ['job-types', 'filtered', filters] : 
      queryKeys.jobTypes(),
    queryFn: async (): Promise<JobType[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      let query = supabase
        .from('job_types')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.is_template !== undefined) {
        query = query.eq('is_template', filters.is_template);
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
 * Get active job types only
 * Most common use case for job creation
 */
export const useActiveJobTypes = () => {
  return useJobTypes({ is_active: true });
};

/**
 * Get job types by category
 * Organize by work type (plumbing, electrical, etc.)
 */
export const useJobTypesByCategory = (category: string) => {
  return useJobTypes({ category, is_active: true });
};

/**
 * Get a specific job type by ID
 */
export const useJobType = (jobTypeId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: queryKeys.jobType(jobTypeId),
    queryFn: async (): Promise<JobType | null> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('job_types')
        .select('*')
        .eq('id', jobTypeId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Job type not found
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!jobTypeId,
    staleTime: 1000 * 60 * 10, // 10 minutes for individual job types
  });
};

// ==================== PART TEMPLATES QUERY HOOKS ====================

/**
 * Get all part templates for the current user
 * MVP Feature: Parts catalog for BoM creation
 */
export const usePartTemplates = (filters?: {
  category?: string;
  is_active?: boolean;
  is_common?: boolean;
}) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: filters ? 
      ['part-templates', 'filtered', filters] : 
      queryKeys.partTemplates(),
    queryFn: async (): Promise<PartTemplate[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      let query = supabase
        .from('part_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.is_common !== undefined) {
        query = query.eq('is_common', filters.is_common);
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
 * Get active part templates only
 * Most common use case for BoM creation
 */
export const useActivePartTemplates = () => {
  return usePartTemplates({ is_active: true });
};

/**
 * Get commonly used part templates
 * Quick access to frequently used parts
 */
export const useCommonPartTemplates = () => {
  return usePartTemplates({ is_common: true, is_active: true });
};

/**
 * Get part templates by category
 * Organize by part type (electrical, plumbing, etc.)
 */
export const usePartTemplatesByCategory = (category: string) => {
  return usePartTemplates({ category, is_active: true });
};

/**
 * Get a specific part template by ID
 */
export const usePartTemplate = (partTemplateId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: ['part-templates', partTemplateId],
    queryFn: async (): Promise<PartTemplate | null> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('part_templates')
        .select('*')
        .eq('id', partTemplateId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Part template not found
        }
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!partTemplateId,
    staleTime: 1000 * 60 * 10, // 10 minutes for individual part templates
  });
};

// ==================== JOB TYPE PARTS (BOM) QUERY HOOKS ====================

/**
 * Get Bill of Materials for a specific job type
 * MVP Feature: Auto-populate parts based on job type selection
 */
export const useJobTypeParts = (jobTypeId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: queryKeys.jobTypeParts(jobTypeId),
    queryFn: async (): Promise<JobTypePartsWithDetails[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('job_type_parts')
        .select(`
          *,
          job_type:job_types(*),
          part_template:part_templates(*)
        `)
        .eq('job_type_id', jobTypeId)
        .eq('user_id', user.id)
        .order('is_required', { ascending: false }) // Required parts first
        .order('part_template.name', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id && !!jobTypeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get required parts only for a job type
 * Essential parts that must be included
 */
export const useRequiredJobTypeParts = (jobTypeId: string) => {
  const [user] = useAtom(userAtom);

  return useQuery({
    queryKey: ['job-types', jobTypeId, 'parts', 'required'],
    queryFn: async (): Promise<JobTypePartsWithDetails[]> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('job_type_parts')
        .select(`
          *,
          job_type:job_types(*),
          part_template:part_templates(*)
        `)
        .eq('job_type_id', jobTypeId)
        .eq('user_id', user.id)
        .eq('is_required', true)
        .order('part_template.name', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id && !!jobTypeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get estimated cost for a job type's parts
 * Calculate total parts cost for job estimation
 */
export const useJobTypePartsCost = (jobTypeId: string) => {
  const { data: parts } = useJobTypeParts(jobTypeId);
  
  const totalCost = parts?.reduce((sum, part) => {
    const cost = part.part_template?.estimated_cost || 0;
    return sum + (cost * part.quantity_needed);
  }, 0) || 0;

  return {
    totalCost,
    partsCount: parts?.length || 0,
    requiredPartsCount: parts?.filter(p => p.is_required).length || 0,
  };
};

// ==================== JOB TYPE MUTATION HOOKS ====================

/**
 * Create a new job type
 * MVP Feature: Add custom job types for specific work
 */
export const useCreateJobType = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJobTypeData): Promise<JobType> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('job_types')
        .insert([{
          user_id: user.id,
          estimated_duration: 60, // default 1 hour
          default_priority: 'medium',
          markup_percentage: 0.15, // default 15%
          is_active: true,
          is_template: false,
          ...data,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate job types queries
      invalidateQueries.allJobTypes();
    },
  });
};

/**
 * Update an existing job type
 */
export const useUpdateJobType = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateJobTypeData }): Promise<JobType> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('job_types')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate specific job type and related queries
      invalidateQueries.jobType(result.id);
    },
  });
};

/**
 * Delete a job type
 */
export const useDeleteJobType = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobTypeId: string): Promise<void> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('job_types')
        .delete()
        .eq('id', jobTypeId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate job types queries
      invalidateQueries.allJobTypes();
    },
  });
};

// ==================== PART TEMPLATE MUTATION HOOKS ====================

/**
 * Create a new part template
 * MVP Feature: Add custom parts to catalog
 */
export const useCreatePartTemplate = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePartTemplateData): Promise<PartTemplate> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('part_templates')
        .insert([{
          user_id: user.id,
          unit: 'each', // default unit
          is_common: false,
          is_active: true,
          ...data,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate part templates queries
      queryClient.invalidateQueries({ queryKey: queryKeys.partTemplates() });
    },
  });
};

/**
 * Update an existing part template
 */
export const useUpdatePartTemplate = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePartTemplateData }): Promise<PartTemplate> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('part_templates')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate part templates queries
      queryClient.invalidateQueries({ queryKey: queryKeys.partTemplates() });
    },
  });
};

/**
 * Delete a part template
 */
export const useDeletePartTemplate = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partTemplateId: string): Promise<void> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('part_templates')
        .delete()
        .eq('id', partTemplateId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate part templates queries
      queryClient.invalidateQueries({ queryKey: queryKeys.partTemplates() });
    },
  });
};

// ==================== JOB TYPE PARTS (BOM) MUTATION HOOKS ====================

/**
 * Associate a part template with a job type (create BoM entry)
 * MVP Feature: Build Bill of Materials for job types
 */
export const useAssociatePartsToJobType = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJobTypePartData): Promise<JobTypePart> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('job_type_parts')
        .insert([{
          user_id: user.id,
          is_required: true, // default to required
          ...data,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate job type parts queries
      queryClient.invalidateQueries({ queryKey: queryKeys.jobTypeParts(result.job_type_id) });
      invalidateQueries.jobType(result.job_type_id);
    },
  });
};

/**
 * Update job type part association (modify BoM entry)
 */
export const useUpdateJobTypePart = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateJobTypePartData }): Promise<JobTypePart> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { data: result, error } = await supabase
        .from('job_type_parts')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate job type parts queries
      queryClient.invalidateQueries({ queryKey: queryKeys.jobTypeParts(result.job_type_id) });
      invalidateQueries.jobType(result.job_type_id);
    },
  });
};

/**
 * Remove part from job type (delete BoM entry)
 */
export const useRemovePartFromJobType = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, jobTypeId }: { id: string; jobTypeId: string }): Promise<void> => {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('job_type_parts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, { jobTypeId }) => {
      // Invalidate job type parts queries
      queryClient.invalidateQueries({ queryKey: queryKeys.jobTypeParts(jobTypeId) });
      invalidateQueries.jobType(jobTypeId);
    },
  });
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get job type display name with fallback
 */
export const getJobTypeDisplayName = (jobType: JobType | null | undefined): string => {
  if (!jobType) return 'Unknown Job Type';
  return jobType.name || 'Untitled Job Type';
};

/**
 * Get part template display name with fallback
 */
export const getPartTemplateDisplayName = (partTemplate: PartTemplate | null | undefined): string => {
  if (!partTemplate) return 'Unknown Part';
  return partTemplate.name || 'Untitled Part';
};

/**
 * Format estimated cost for display
 */
export const formatEstimatedCost = (cost: number | null | undefined): string => {
  if (!cost) return 'No estimate';
  return `$${cost.toFixed(2)}`;
};

/**
 * Get job type categories for filtering
 */
export const getJobTypeCategories = (jobTypes: JobType[]): string[] => {
  const categories = jobTypes
    .map(jt => jt.category)
    .filter((category): category is string => !!category);
  return Array.from(new Set(categories)).sort();
};

/**
 * Get part template categories for filtering
 */
export const getPartTemplateCategories = (partTemplates: PartTemplate[]): string[] => {
  const categories = partTemplates
    .map(pt => pt.category)
    .filter((category): category is string => !!category);
  return Array.from(new Set(categories)).sort();
};

/**
 * Prefetch job type data for performance
 */
export const usePrefetchJobType = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return (jobTypeId: string) => {
    if (!user?.id) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.jobType(jobTypeId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('job_types')
          .select('*')
          .eq('id', jobTypeId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };
};

/**
 * Prefetch job type parts for performance
 */
export const usePrefetchJobTypeParts = () => {
  const [user] = useAtom(userAtom);
  const queryClient = useQueryClient();

  return (jobTypeId: string) => {
    if (!user?.id) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.jobTypeParts(jobTypeId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('job_type_parts')
          .select(`
            *,
            job_type:job_types(*),
            part_template:part_templates(*)
          `)
          .eq('job_type_id', jobTypeId)
          .eq('user_id', user.id)
          .order('is_required', { ascending: false })
          .order('part_template.name', { ascending: true });

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
}; 