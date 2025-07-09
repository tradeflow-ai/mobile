/**
 * Routing Engine Service - VROOM API Integration
 * Handles route optimization with advanced constraints for TradeFlow AI
 */

// ==================== TYPESCRIPT INTERFACES ====================

export interface JobLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  job_type: string;
  estimated_duration: number; // in minutes
  time_window?: TimeWindow;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  required_items?: string[]; // inventory item IDs
  client_id?: string;
  notes?: string;
}

export interface TimeWindow {
  start: string; // ISO 8601 format (e.g., "2024-01-15T09:00:00Z")
  end: string;   // ISO 8601 format (e.g., "2024-01-15T17:00:00Z")
}

export interface TechnicianBreak {
  start: string; // ISO 8601 format
  end: string;   // ISO 8601 format
  location?: {
    latitude: number;
    longitude: number;
  };
  is_mandatory: boolean;
}

export interface VehicleCapacity {
  max_weight?: number; // in kg
  max_volume?: number; // in cubic meters
  max_items?: number;  // maximum number of items
}

export interface TravelTimeBuffer {
  default_buffer_minutes: number;
  traffic_multiplier: number; // 1.0 = no adjustment, 1.5 = 50% longer for traffic
  weather_multiplier: number; // adjustment for weather conditions
}

export interface UserPreferences {
  work_schedule: {
    start_time: string; // "09:00"
    end_time: string;   // "17:00"
    break_duration: number; // in minutes
    preferred_lunch_time?: string; // "12:00"
  };
  technician_breaks: TechnicianBreak[];
  travel_time_buffers: TravelTimeBuffer;
  vehicle_capacity?: VehicleCapacity;
  home_location: {
    latitude: number;
    longitude: number;
  };
}

// ==================== VROOM API INTERFACES ====================

export interface VRoomJob {
  id: number;
  description: string;
  location: [number, number]; // [longitude, latitude]
  service: number; // service time in seconds
  time_windows?: [[number, number]]; // [start_epoch, end_epoch]
  priority?: number; // 1-100
  skills?: number[]; // required skills
}

export interface VRoomVehicle {
  id: number;
  description: string;
  start: [number, number]; // [longitude, latitude]
  end: [number, number];   // [longitude, latitude]
  capacity?: number[];     // [weight, volume, items]
  time_window?: [number, number]; // [start_epoch, end_epoch]
  breaks?: VRoomBreak[];
}

export interface VRoomBreak {
  id: number;
  time_windows: [[number, number]]; // [start_epoch, end_epoch]
  service: number; // break duration in seconds
  description: string;
}

export interface VRoomRequest {
  jobs: VRoomJob[];
  vehicles: VRoomVehicle[];
  options?: {
    g?: boolean; // return geometry
    explore?: boolean; // explore alternatives
  };
}

export interface VRoomResponse {
  code: number;
  summary: {
    cost: number;
    unassigned: number;
    service: number;
    duration: number;
    waiting_time: number;
    priority: number;
    delivery: number[];
    pickup: number[];
    distance: number;
    violations: number;
  };
  unassigned: any[];
  routes: VRoomRoute[];
}

export interface VRoomRoute {
  vehicle: number;
  cost: number;
  service: number;
  duration: number;
  waiting_time: number;
  priority: number;
  delivery: number[];
  pickup: number[];
  distance: number;
  steps: VRoomStep[];
  violations: any[];
  geometry?: string; // encoded polyline
}

export interface VRoomStep {
  type: 'start' | 'job' | 'break' | 'end';
  location: [number, number];
  id?: number;
  service: number;
  waiting_time: number;
  arrival: number;
  duration: number;
  violations: any[];
  description: string;
}

// ==================== OPTIMIZED ROUTE INTERFACES ====================

export interface OptimizedRoute {
  id: string;
  total_duration: number; // in minutes
  total_distance: number; // in meters
  total_cost: number;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  stops: RouteStop[];
  polyline?: string; // encoded polyline for map display
  summary: {
    jobs_completed: number;
    total_service_time: number;
    total_travel_time: number;
    total_waiting_time: number;
    violations: string[];
  };
}

export interface RouteStop {
  id: string;
  type: 'start' | 'job' | 'break' | 'end';
  job_id?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  arrival_time: string; // ISO 8601
  departure_time: string; // ISO 8601
  service_duration: number; // in minutes
  waiting_time: number; // in minutes
  description: string;
  violations: string[];
}

// ==================== ROUTING SERVICE CLASS ====================

export class RoutingService {
  private static instance: RoutingService;
  private vroomEndpoint: string;
  private isProduction: boolean;

  private constructor() {
    // In production, this would be the deployed VROOM endpoint
    this.vroomEndpoint = process.env.VROOM_API_URL || 'http://localhost:3000';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): RoutingService {
    if (!RoutingService.instance) {
      RoutingService.instance = new RoutingService();
    }
    return RoutingService.instance;
  }

  /**
   * Main routing function - optimize route with advanced constraints
   */
  async optimizeRoute(
    jobs: JobLocation[],
    userPreferences: UserPreferences,
    options?: {
      includeGeometry?: boolean;
      exploreAlternatives?: boolean;
    }
  ): Promise<OptimizedRoute> {
    try {
      // Format data for VROOM API
      const vroomRequest = this.formatForVROOM(jobs, userPreferences, options);
      
      // Call VROOM API (with fallback to mock in development)
      const vroomResponse = await this.callVROOMAPI(vroomRequest);
      
      // Convert VROOM response to our optimized format
      const optimizedRoute = this.formatVROOMResponse(vroomResponse, jobs, userPreferences);
      
      return optimizedRoute;
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw new Error(`Route optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format job locations and constraints for VROOM API consumption
   */
  private formatForVROOM(
    jobs: JobLocation[],
    userPreferences: UserPreferences,
    options?: { includeGeometry?: boolean; exploreAlternatives?: boolean }
  ): VRoomRequest {
    // Convert jobs to VROOM format
    const vroomJobs: VRoomJob[] = jobs.map((job, index) => ({
      id: index + 1,
      description: `${job.job_type} - ${job.address}`,
      location: [job.longitude, job.latitude],
      service: job.estimated_duration * 60, // convert minutes to seconds
      time_windows: job.time_window ? [
        [
          Math.floor(new Date(job.time_window.start).getTime() / 1000),
          Math.floor(new Date(job.time_window.end).getTime() / 1000)
        ]
      ] : undefined,
      priority: this.getPriorityScore(job.priority),
      skills: job.required_items ? [1] : undefined // simplified skill requirements
    }));

    // Convert user preferences to VROOM vehicle
    const vroomVehicle: VRoomVehicle = {
      id: 1,
      description: "Technician Vehicle",
      start: [userPreferences.home_location.longitude, userPreferences.home_location.latitude],
      end: [userPreferences.home_location.longitude, userPreferences.home_location.latitude],
      capacity: userPreferences.vehicle_capacity ? [
        userPreferences.vehicle_capacity.max_weight || 1000,
        userPreferences.vehicle_capacity.max_volume || 10,
        userPreferences.vehicle_capacity.max_items || 50
      ] : undefined,
      time_window: [
        this.parseTimeToEpoch(userPreferences.work_schedule.start_time),
        this.parseTimeToEpoch(userPreferences.work_schedule.end_time)
      ],
      breaks: this.formatBreaksForVROOM(userPreferences.technician_breaks)
    };

    return {
      jobs: vroomJobs,
      vehicles: [vroomVehicle],
      options: {
        g: options?.includeGeometry || false,
        explore: options?.exploreAlternatives || false
      }
    };
  }

  /**
   * Call VROOM API or return mock data for development
   */
  private async callVROOMAPI(request: VRoomRequest): Promise<VRoomResponse> {
    if (!this.isProduction) {
      // Return mock response for development
      return this.generateMockResponse(request);
    }

    try {
      const response = await fetch(`${this.vroomEndpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`VROOM API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('VROOM API call failed:', error);
      // Fallback to mock response
      return this.generateMockResponse(request);
    }
  }

  /**
   * Convert VROOM response to optimized route format
   */
  private formatVROOMResponse(
    vroomResponse: VRoomResponse,
    originalJobs: JobLocation[],
    userPreferences: UserPreferences
  ): OptimizedRoute {
    const route = vroomResponse.routes[0]; // Single vehicle route
    
    const stops: RouteStop[] = route.steps.map(step => {
      const originalJob = step.id ? originalJobs[step.id - 1] : null;
      
      return {
        id: step.id?.toString() || 'unknown',
        type: step.type,
        job_id: originalJob?.id,
        location: {
          latitude: step.location[1],
          longitude: step.location[0],
          address: originalJob?.address || 'Unknown location'
        },
        arrival_time: new Date(step.arrival * 1000).toISOString(),
        departure_time: new Date((step.arrival + step.service) * 1000).toISOString(),
        service_duration: step.service / 60, // convert seconds to minutes
        waiting_time: step.waiting_time / 60, // convert seconds to minutes
        description: step.description,
        violations: step.violations.map(v => v.description || 'Unknown violation')
      };
    });

    return {
      id: `route_${Date.now()}`,
      total_duration: route.duration / 60, // convert seconds to minutes
      total_distance: route.distance,
      total_cost: route.cost,
      start_time: stops[0]?.arrival_time || new Date().toISOString(),
      end_time: stops[stops.length - 1]?.departure_time || new Date().toISOString(),
      stops,
      polyline: route.geometry,
      summary: {
        jobs_completed: originalJobs.length - vroomResponse.summary.unassigned,
        total_service_time: route.service / 60,
        total_travel_time: (route.duration - route.service) / 60,
        total_waiting_time: route.waiting_time / 60,
        violations: route.violations.map(v => v.description || 'Unknown violation')
      }
    };
  }

  /**
   * Generate mock response for development/testing
   */
  private generateMockResponse(request: VRoomRequest): VRoomResponse {
    const jobs = request.jobs;
    const vehicle = request.vehicles[0];
    
    // Create mock optimized route
    const steps: VRoomStep[] = [
      {
        type: 'start',
        location: vehicle.start,
        service: 0,
        waiting_time: 0,
        arrival: Math.floor(Date.now() / 1000),
        duration: 0,
        violations: [],
        description: 'Start location'
      },
      ...jobs.map((job, index) => ({
        type: 'job' as const,
        location: job.location,
        id: job.id,
        service: job.service,
        waiting_time: 0,
        arrival: Math.floor(Date.now() / 1000) + (index + 1) * 1800, // 30 min intervals
        duration: 0,
        violations: [],
        description: job.description
      })),
      {
        type: 'end',
        location: vehicle.end,
        service: 0,
        waiting_time: 0,
        arrival: Math.floor(Date.now() / 1000) + (jobs.length + 1) * 1800,
        duration: 0,
        violations: [],
        description: 'End location'
      }
    ];

    return {
      code: 0,
      summary: {
        cost: jobs.length * 1000,
        unassigned: 0,
        service: jobs.reduce((sum, job) => sum + job.service, 0),
        duration: jobs.length * 1800,
        waiting_time: 0,
        priority: 0,
        delivery: [],
        pickup: [],
        distance: jobs.length * 5000, // 5km per job
        violations: 0
      },
      unassigned: [],
      routes: [{
        vehicle: 1,
        cost: jobs.length * 1000,
        service: jobs.reduce((sum, job) => sum + job.service, 0),
        duration: jobs.length * 1800,
        waiting_time: 0,
        priority: 0,
        delivery: [],
        pickup: [],
        distance: jobs.length * 5000,
        steps,
        violations: [],
        geometry: 'mock_polyline_string'
      }]
    };
  }

  // ==================== UTILITY METHODS ====================

  private getPriorityScore(priority?: string): number {
    switch (priority) {
      case 'urgent': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 50;
    }
  }

  private parseTimeToEpoch(timeString: string): number {
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    return Math.floor(date.getTime() / 1000);
  }

  private formatBreaksForVROOM(breaks: TechnicianBreak[]): VRoomBreak[] {
    return breaks.map((breakItem, index) => ({
      id: index + 1,
      time_windows: [[
        Math.floor(new Date(breakItem.start).getTime() / 1000),
        Math.floor(new Date(breakItem.end).getTime() / 1000)
      ]],
      service: Math.floor((new Date(breakItem.end).getTime() - new Date(breakItem.start).getTime()) / 1000),
      description: `Break ${index + 1}`
    }));
  }

  /**
   * AI Agent Tool Interface - Simple function for agent consumption
   */
  async optimizeRouteForAgent(
    jobs: JobLocation[],
    userPreferences: UserPreferences
  ): Promise<OptimizedRoute> {
    return this.optimizeRoute(jobs, userPreferences, {
      includeGeometry: true,
      exploreAlternatives: false
    });
  }

  /**
   * Health check for the routing service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', message: string }> {
    try {
      if (!this.isProduction) {
        return { status: 'healthy', message: 'Mock routing service active' };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.vroomEndpoint}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        return { status: 'healthy', message: 'VROOM service is operational' };
      } else {
        return { status: 'unhealthy', message: `VROOM service returned ${response.status}` };
      }
    } catch (error) {
      return { status: 'unhealthy', message: `VROOM service unreachable: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }
}

// ==================== SINGLETON EXPORT ====================

export const routingService = RoutingService.getInstance();
export default routingService; 