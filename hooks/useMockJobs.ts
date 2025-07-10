/**
 * Mock Jobs Hook - Provides mock job data for planning
 * 
 * This hook provides mock job data that can be used for testing
 * the planning workflow and development.
 */

import { useAtom } from 'jotai';
import { mockJobsAtom } from '@/store/atoms';
import { MockAgentService } from '@/services/mockAgentService';
import type { JobLocation } from './useJobs';

export interface UseMockJobsOptions {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  planDate?: string;
}

export const useMockJobs = (options: UseMockJobsOptions = {}) => {
  const [mockJobs] = useAtom(mockJobsAtom);
  
  // Check if there's an approved daily plan to get prioritized job order
  const mockUser = { id: 'mock-user-123' };
  const approvedPlan = MockAgentService.getTodaysMockDailyPlan(mockUser.id);
  
  let orderedJobs = mockJobs;
  
  // If there's an approved plan, order jobs by priority from dispatch output
  if (approvedPlan?.status === 'approved' && approvedPlan.dispatch_output?.prioritized_jobs) {
    const prioritizedJobIds = approvedPlan.dispatch_output.prioritized_jobs
      .sort((a: any, b: any) => a.priority_rank - b.priority_rank)
      .map((pJob: any) => pJob.job_id);
    
    // Reorder jobs based on priority ranking
    orderedJobs = prioritizedJobIds
      .map((jobId: string) => mockJobs.find(job => job.id === jobId))
      .filter(Boolean);
    
    // Add any jobs not in the priority list at the end
    const unrankedJobs = mockJobs.filter(job => 
      !prioritizedJobIds.includes(job.id)
    );
    orderedJobs = [...orderedJobs, ...unrankedJobs];
  }
  
  // Filter jobs by status if specified
  const filteredJobs = options.status 
    ? orderedJobs.filter(job => job.status === options.status)
    : orderedJobs;
  
  return {
    data: filteredJobs as JobLocation[],
    isLoading: false,
    error: null,
  };
};

/**
 * Hook to get all mock jobs regardless of mode
 * Useful for testing and development
 */
export const useAllMockJobs = () => {
  const [mockJobs] = useAtom(mockJobsAtom);
  
  return {
    data: mockJobs as JobLocation[],
    isLoading: false,
    error: null,
  };
};

/**
 * Hook to get a specific mock job by ID
 */
export const useMockJob = (jobId: string) => {
  const [mockJobs] = useAtom(mockJobsAtom);
  
  const job = mockJobs.find(job => job.id === jobId);
  
  return {
    data: job,
    isLoading: false,
    error: job ? null : 'Job not found',
  };
}; 