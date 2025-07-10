/**
 * Mock Agent Service - Self-Contained Development/Testing Implementation
 * 
 * This service provides mock implementations of the AI agents using
 * predefined data stored in atoms. It simulates the complete workflow
 * without requiring external services.
 */

import { 
  mockJobsAtom, 
  mockDispatchOutputAtom, 
  mockInventoryOutputAtom,
  mockDailyPlanAtom
} from '@/store/atoms';
import { createStore } from 'jotai';

// Mock response interface
interface PlanDayResponse {
  success: boolean;
  planId?: string;
  status?: string;
  currentStep?: string;
  error?: string;
}

// Mock daily plan structure
interface MockDailyPlan {
  id: string;
  user_id: string;
  status: 'pending' | 'dispatch_complete' | 'route_complete' | 'inventory_complete' | 'approved' | 'cancelled' | 'error';
  current_step: 'dispatch' | 'route' | 'inventory' | 'complete' | null;
  dispatch_output: any;
  route_output: any;
  inventory_output: any;
  job_ids: string[];
  planned_date: string;
  total_estimated_duration?: number; // Total duration in minutes
  total_distance?: number; // Total distance in kilometers
  created_at: string;
  updated_at: string;
}

// Jotai store for persistent mock daily plans
const store = createStore();

// In-memory storage for mock daily plans (fallback)
let mockDailyPlans: Map<string, MockDailyPlan> = new Map();

// Mock route output data
const mockRouteOutput = {
  optimized_route: {
    waypoints: [
      {
        job_id: "mock-job-1",
        sequence_number: 1,
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        arrival_time: "2024-12-20T09:00:00Z",
        departure_time: "2024-12-20T11:00:00Z",
        duration_at_location: 120,
        travel_time_to_next: 25,
        distance_to_next: 8.5
      },
      {
        job_id: "mock-job-2", 
        sequence_number: 2,
        coordinates: { latitude: 37.7849, longitude: -122.4094 },
        arrival_time: "2024-12-20T11:30:00Z",
        departure_time: "2024-12-20T13:30:00Z",
        duration_at_location: 120,
        travel_time_to_next: 15,
        distance_to_next: 5.2
      }
    ],
    route_geometry: "encoded_polyline_string_for_mapping",
    total_distance: 25.5,
    total_travel_time: 45,
    total_work_time: 360
  },
  agent_reasoning: "Optimized route for minimum travel time while respecting emergency job priorities.",
  execution_time_ms: 1247
};

export class MockAgentService {
  
  /**
   * Calculate total estimated duration from job IDs
   */
  private static calculateTotalDuration(jobIds: string[]): number {
    const mockJobs = mockJobsAtom.init;
    let totalDuration = 0;
    
    for (const jobId of jobIds) {
      const job = mockJobs.find(j => j.id === jobId);
      if (job && job.estimated_duration) {
        totalDuration += job.estimated_duration;
      }
    }
    
    return totalDuration;
  }
  
  /**
   * Mock implementation of the daily planning workflow
   * Simulates all three agents: dispatch, route, and inventory
   */
  static async planDay(userId: string, jobIds: string[], planDate: string): Promise<PlanDayResponse> {
    try {
      console.log('🧠 Running AI agents for daily planning...');
      console.log('📊 Request data:', { userId, jobIds, planDate });
      
      // Generate unique plan ID
      const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create mock daily plan
      const dailyPlan: MockDailyPlan = {
        id: planId,
        user_id: userId,
        status: 'pending',
        current_step: 'dispatch',
        dispatch_output: {},
        route_output: {},
        inventory_output: {},
        job_ids: jobIds,
        planned_date: planDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store the plan in both memory and atom
      mockDailyPlans.set(planId, dailyPlan);
      store.set(mockDailyPlanAtom, dailyPlan);
      
      console.log('✅ Created daily plan:', planId);

      // Step 1: Run Mock Dispatch Agent
      await this.runMockDispatchAgent(planId);
      
      // Step 2: Run Mock Route Optimizer
      await this.runMockRouteAgent(planId);
      
      // Step 3: Run Mock Inventory Agent  
      await this.runMockInventoryAgent(planId);

      // Step 4: Auto-approve the plan for immediate use
      await this.approveMockPlan(planId);

      console.log('✅ AI agents completed successfully');

      return {
        success: true,
        planId: planId,
        status: 'approved',
        currentStep: 'complete'
      };

    } catch (error) {
      console.error('❌ AI agent service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Mock Dispatch Strategist Agent
   * Uses predefined job prioritization logic with mock data
   */
  private static async runMockDispatchAgent(planId: string): Promise<void> {
    console.log('🎯 Running Dispatch Strategist...');
    
    // Get the plan
    const plan = mockDailyPlans.get(planId);
    if (!plan) {
      throw new Error('Daily plan not found');
    }
    
    // Get mock dispatch output from atom
    const mockDispatchOutput = mockDispatchOutputAtom.init;
    
    // Update the plan with dispatch results
    plan.status = 'dispatch_complete';
    plan.current_step = 'route';
    plan.dispatch_output = mockDispatchOutput;
    plan.updated_at = new Date().toISOString();
    
    // Store updated plan in both memory and atom
    mockDailyPlans.set(planId, plan);
    store.set(mockDailyPlanAtom, plan);
    
    console.log('✅ Dispatch Agent completed');
  }

    /**
   * Mock Route Optimizer Agent
   * Creates optimized route with waypoints and travel data
   */
  private static async runMockRouteAgent(planId: string): Promise<void> {
    console.log('🗺️ Running Route Optimizer...');
    
    // Get the plan
    const plan = mockDailyPlans.get(planId);
    if (!plan) {
      throw new Error('Daily plan not found');
    }

    // Get prioritized jobs from dispatch output
    const prioritizedJobs = plan.dispatch_output?.prioritized_jobs || [];
    console.log('🎯 Prioritized jobs to schedule:', prioritizedJobs);
    
    // Create dynamic route with proper time scheduling
    const today = new Date();
    const startHour = 8; // Start at 8 AM
    let currentTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, 0, 0);
    console.log('⏰ Starting schedule at:', currentTime.toISOString());
    
    const waypoints = [];
    let totalDistance = 0;
    let totalTravelTime = 0;
    let totalWorkTime = 0;

    // Get current jobs from atom and create a copy to update
    const currentJobs = store.get(mockJobsAtom) || mockJobsAtom.init;
    const updatedJobs = [...currentJobs];

    // Generate waypoints for each job with proper time spacing
    for (let i = 0; i < prioritizedJobs.length; i++) {
      const prioritizedJob = prioritizedJobs[i];
      const jobIndex = updatedJobs.findIndex(j => j.id === prioritizedJob.job_id);
      const job = updatedJobs[jobIndex];
      
      console.log(`📋 Processing job ${i + 1}/${prioritizedJobs.length}: ${prioritizedJob.job_id}`);
      console.log(`🔍 Found job at index ${jobIndex}:`, job ? job.title : 'NOT FOUND');
      
      if (job && jobIndex >= 0) {
        const duration = job.estimated_duration || 60; // Default 1 hour
        const travelTime = i === 0 ? 0 : 15 + Math.floor(Math.random() * 20); // 15-35 min travel between jobs
        
        // Add travel time before job
        if (travelTime > 0) {
          currentTime = new Date(currentTime.getTime() + travelTime * 60 * 1000);
          totalTravelTime += travelTime;
        }
        
        const arrivalTime = new Date(currentTime);
        const departureTime = new Date(currentTime.getTime() + duration * 60 * 1000);
        
        console.log(`⏱️  Job ${job.title}:`);
        console.log(`   - Arrival: ${arrivalTime.toISOString()}`);
        console.log(`   - Departure: ${departureTime.toISOString()}`);
        console.log(`   - Duration: ${duration} minutes`);
        
        waypoints.push({
          job_id: job.id,
          sequence_number: i + 1,
          coordinates: { 
            latitude: job.latitude || (37.7749 + (Math.random() - 0.5) * 0.1), 
            longitude: job.longitude || (-122.4194 + (Math.random() - 0.5) * 0.1)
          },
          arrival_time: arrivalTime.toISOString(),
          departure_time: departureTime.toISOString(),
          duration_at_location: duration,
          travel_time_to_next: i < prioritizedJobs.length - 1 ? 15 + Math.floor(Math.random() * 20) : 0,
          distance_to_next: i < prioritizedJobs.length - 1 ? 3 + Math.random() * 10 : 0
        });

        // Update job's scheduled times in the jobs array
        updatedJobs[jobIndex] = {
          ...job,
          scheduled_start: arrivalTime.toISOString(),
          scheduled_end: departureTime.toISOString()
        } as any;
        
        // Move to next time slot
        currentTime = departureTime;
        totalWorkTime += duration;
        
        // Add some buffer time between jobs
        const bufferTime = 5 + Math.floor(Math.random() * 10); // 5-15 min buffer
        currentTime = new Date(currentTime.getTime() + bufferTime * 60 * 1000);
      } else {
        console.log(`❌ Job ${prioritizedJob.job_id} not found in jobs array`);
      }
    }

    // Update the jobs atom with the scheduled times
    store.set(mockJobsAtom, updatedJobs);

    // Log the updated jobs for debugging
    console.log('📅 Updated jobs with scheduled times:', updatedJobs.map(job => ({
      id: job.id,
      title: job.title,
      scheduled_start: job.scheduled_start,
      scheduled_end: (job as any).scheduled_end
    })));

    totalDistance = waypoints.reduce((sum, wp) => sum + (wp.distance_to_next || 0), 0);

    const dynamicRouteOutput = {
      optimized_route: {
        waypoints,
        route_geometry: "encoded_polyline_string_for_mapping",
        total_distance: totalDistance,
        total_travel_time: totalTravelTime,
        total_work_time: totalWorkTime
      },
      agent_reasoning: `Optimized route for ${waypoints.length} jobs with ${Math.round(totalDistance)} km total distance and ${Math.round(totalTravelTime + totalWorkTime)} minutes total time.`,
      execution_time_ms: 1247
    };
    
    // Update the plan with route results
    plan.status = 'route_complete';
    plan.current_step = 'inventory';
    plan.route_output = dynamicRouteOutput;
    plan.updated_at = new Date().toISOString();
    
    // Store updated plan in both memory and atom
    mockDailyPlans.set(planId, plan);
    store.set(mockDailyPlanAtom, plan);
    
    console.log('✅ Route Optimizer completed with', waypoints.length, 'scheduled jobs');
  }

  /**
   * Mock Inventory Specialist Agent
   * Analyzes job requirements and generates shopping lists using mock data
   */
  private static async runMockInventoryAgent(planId: string): Promise<void> {
    console.log('📦 Running Inventory Specialist...');
    
    // Get the plan
    const plan = mockDailyPlans.get(planId);
    if (!plan) {
      throw new Error('Daily plan not found');
    }
    
    // Get mock inventory output from atom
    const mockInventoryOutput = mockInventoryOutputAtom.init;
    
    // Update the plan with inventory results
    plan.status = 'inventory_complete';
    plan.current_step = 'complete';
    plan.inventory_output = mockInventoryOutput;
    plan.updated_at = new Date().toISOString();
    
    // Store updated plan in both memory and atom
    mockDailyPlans.set(planId, plan);
    store.set(mockDailyPlanAtom, plan);
    
    console.log('✅ Inventory Agent completed');
  }

  /**
   * Auto-approve the mock plan for immediate use
   */
  private static async approveMockPlan(planId: string): Promise<void> {
    console.log('✅ Auto-approving plan...');
    
    // Get the plan
    const plan = mockDailyPlans.get(planId);
    if (!plan) {
      throw new Error('Daily plan not found');
    }
    
    // Calculate totals from the planned jobs
    plan.total_estimated_duration = this.calculateTotalDuration(plan.job_ids);
    plan.total_distance = plan.route_output?.optimized_route?.total_distance || 25.5;
    
    // Update the plan to approved status
    plan.status = 'approved';
    plan.current_step = 'complete';
    plan.updated_at = new Date().toISOString();
    
    // Store updated plan in both memory and atom
    mockDailyPlans.set(planId, plan);
    store.set(mockDailyPlanAtom, plan);
    
    console.log('✅ Plan approved and ready for execution');
  }

  /**
   * Get a mock daily plan by ID
   */
  static getMockDailyPlan(planId: string): MockDailyPlan | undefined {
    return mockDailyPlans.get(planId);
  }

  /**
   * Get all mock daily plans for a user
   */
  static getUserMockDailyPlans(userId: string): MockDailyPlan[] {
    return Array.from(mockDailyPlans.values()).filter(plan => plan.user_id === userId);
  }

  /**
   * Get today's mock daily plan for a user
   */
  static getTodaysMockDailyPlan(userId: string): MockDailyPlan | undefined {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we have a stored plan in the atom
    const storedPlan = store.get(mockDailyPlanAtom);
    if (storedPlan && storedPlan.user_id === userId && storedPlan.planned_date === today) {
      return storedPlan;
    }
    
    // Check in-memory plans
    const memoryPlan = Array.from(mockDailyPlans.values()).find(plan => 
      plan.user_id === userId && plan.planned_date === today
    );
    if (memoryPlan) return memoryPlan;
    
    // Don't auto-create default plan - return undefined if no plan exists
    return undefined;
  }

  /**
   * Create a default approved plan for testing (separate method)
   */
  static createDefaultPlanForToday(userId: string): MockDailyPlan {
    const today = new Date().toISOString().split('T')[0];
    const jobIds = ['emergency-001', 'emergency-002', 'regular-001', 'regular-002', 'regular-003', 'regular-004', 'regular-005'];
    
    const defaultPlan: MockDailyPlan = {
      id: `default_plan_${Date.now()}`,
      user_id: userId,
      status: 'approved',
      current_step: 'complete',
      dispatch_output: mockDispatchOutputAtom.init,
      route_output: mockRouteOutput,
      inventory_output: mockInventoryOutputAtom.init,
      job_ids: jobIds,
      total_estimated_duration: this.calculateTotalDuration(jobIds),
      total_distance: mockRouteOutput.optimized_route.total_distance,
      planned_date: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store the default plan in the atom for persistence
    store.set(mockDailyPlanAtom, defaultPlan);
    mockDailyPlans.set(defaultPlan.id, defaultPlan);
    
    return defaultPlan;
  }

  /**
   * Get mock jobs for testing (from atom)
   */
  static getMockJobs() {
    return mockJobsAtom.init;
  }

  /**
   * Check if mock mode is available
   */
  static isAvailable(): boolean {
    return true; // Mock agents are always available
  }

  /**
   * Health check for mock agents
   */
  static async healthCheck(): Promise<boolean> {
    return true; // Mock agents are always healthy
  }

  /**
   * Clear today's daily plan for a user (reset to plan mode)
   */
  static clearTodaysPlan(userId: string): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Clear from in-memory storage
    const plansToDelete = Array.from(mockDailyPlans.entries())
      .filter(([_, plan]) => plan.user_id === userId && plan.planned_date === today)
      .map(([id, _]) => id);
    
    plansToDelete.forEach(id => mockDailyPlans.delete(id));
    
    // Clear from atom storage
    store.set(mockDailyPlanAtom, null);
    
    console.log('🔄 Today\'s daily plan cleared - ready to plan again');
  }

  /**
   * Clear all mock data for testing
   */
  static clearMockData(): void {
    mockDailyPlans.clear();
    store.set(mockDailyPlanAtom, null);
    console.log('🧹 Mock data cleared');
  }
} 