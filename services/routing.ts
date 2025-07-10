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

  private constructor() {}

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
}

// Export legacy routing service class for backward compatibility
export class RoutingService extends CoordinateService {
  // Alias for backward compatibility
  static getInstance(): RoutingService {
    return super.getInstance() as RoutingService;
  }
} 