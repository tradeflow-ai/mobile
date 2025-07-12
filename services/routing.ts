/**
 * Coordinate Service - Simple coordinate utilities for spatial calculations
 * Replaces the VROOM routing service with basic coordinate formatting and distance calculation
 */

export interface JobLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  estimated_duration: number; // in minutes
}

export interface RouteCalculationResult {
  total_distance: number; // in kilometers
  total_travel_time: number; // in minutes
  individual_segments: Array<{
    from_job_id: string;
    to_job_id: string;
    distance: number; // in kilometers
    travel_time: number; // in minutes
  }>;
}

export interface UserPreferences {
  home_location: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Simple coordinate service for basic spatial calculations
 */
export class CoordinateService {
  private static instance: CoordinateService;

  constructor() {}

  static getInstance(): CoordinateService {
    if (!CoordinateService.instance) {
      CoordinateService.instance = new CoordinateService();
    }
    return CoordinateService.instance;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  /**
   * Get coordinate bounds for a set of locations
   */
  getCoordinateBounds(locations: JobLocation[]): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    if (locations.length === 0) {
      return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
    }

    const lats = locations.map(loc => loc.latitude);
    const lngs = locations.map(loc => loc.longitude);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }

  /**
   * Calculate travel time between two coordinates
   * Uses a simple speed-based calculation with traffic factors
   */
  calculateTravelTime(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
    preferences?: UserPreferences
  ): number {
    const distance = this.calculateDistance(from, to);
    
    // Base speed assumptions (km/h)
    const citySpeed = 30; // City driving
    const highwaySpeed = 80; // Highway driving
    
    // Simple speed calculation - use city speed for distances under 10km
    const averageSpeed = distance < 10 ? citySpeed : highwaySpeed;
    
    // Calculate base travel time in minutes
    let travelTime = (distance / averageSpeed) * 60;
    
    // Apply buffer from preferences if available
    if (preferences?.home_location) {
      // Default buffer of 5 minutes
      travelTime += 5;
    } else {
      // Default buffer of 5 minutes
      travelTime += 5;
    }
    
    return Math.ceil(travelTime);
  }

  /**
   * Calculate route for a sequence of job locations
   */
  calculateRoute(
    jobLocations: JobLocation[],
    preferences?: UserPreferences
  ): RouteCalculationResult {
    if (jobLocations.length === 0) {
      return {
        total_distance: 0,
        total_travel_time: 0,
        individual_segments: [],
      };
    }

    if (jobLocations.length === 1) {
      return {
        total_distance: 0,
        total_travel_time: 0,
        individual_segments: [],
      };
    }

    const segments = [];
    let totalDistance = 0;
    let totalTravelTime = 0;

    // Calculate segments between consecutive jobs
    for (let i = 0; i < jobLocations.length - 1; i++) {
      const from = jobLocations[i];
      const to = jobLocations[i + 1];
      
      const distance = this.calculateDistance(
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude }
      );
      
      const travelTime = this.calculateTravelTime(
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude },
        preferences
      );

      segments.push({
        from_job_id: from.id,
        to_job_id: to.id,
        distance,
        travel_time: travelTime,
      });

      totalDistance += distance;
      totalTravelTime += travelTime;
    }

    return {
      total_distance: totalDistance,
      total_travel_time: totalTravelTime,
      individual_segments: segments,
    };
  }

  /**
   * Recalculate route with updated job order
   */
  async recalculateRouteWithNewOrder(
    jobLocations: JobLocation[],
    preferences?: UserPreferences
  ): Promise<RouteCalculationResult> {
    // In a real implementation, this would call an external routing service
    // For now, we'll use our simple calculation
    return this.calculateRoute(jobLocations, preferences);
  }
}

// Export legacy routing service class for backward compatibility
export class RoutingService extends CoordinateService {
  // Alias for backward compatibility
  static getInstance(): RoutingService {
    return super.getInstance() as RoutingService;
  }
} 