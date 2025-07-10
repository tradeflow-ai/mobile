/**
 * TradeFlow Mobile App - Map View Screen
 * 
 * This screen displays the AI-optimized route from the Route Optimizer agent
 * using react-native-maps. Users can review the route, see job locations,
 * and confirm to proceed to inventory checking.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { typography, spacing, radius } from '@/constants/Theme';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { LoadingStepUI } from '../../components/LoadingStepUI';
import { ErrorStepUI } from '../../components/ErrorStepUI';
import type { RouteOutput } from '@/services/dailyPlanService';

interface RouteWaypoint {
  id: string;
  title: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  arrivalTime: string;
  departureTime: string;
  sequenceNumber: number;
  distanceToNext: number;
  travelTimeToNext: number;
}

const { width, height } = Dimensions.get('window');

export default function MapViewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const mapRef = useRef<MapView>(null);
  
  const {
    dailyPlan,
    isLoading,
    error,
    confirmRoute,
    saveUserModifications,
    isConnected,
  } = useTodaysPlan();
  
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [selectedWaypoint, setSelectedWaypoint] = useState<RouteWaypoint | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  /**
   * Convert route output to waypoints for display
   */
  useEffect(() => {
    if (dailyPlan?.route_output?.optimized_route) {
      const routeOutput = dailyPlan.route_output as RouteOutput;
      const route = routeOutput.optimized_route;
      
      // Convert waypoints
      const waypointData: RouteWaypoint[] = route.waypoints.map(waypoint => ({
        id: waypoint.job_id,
        title: `Job ${waypoint.job_id}`, // Would be replaced with actual job title
        coordinates: waypoint.coordinates,
        arrivalTime: waypoint.arrival_time,
        departureTime: waypoint.departure_time,
        sequenceNumber: waypoint.sequence_number,
        distanceToNext: waypoint.distance_to_next,
        travelTimeToNext: waypoint.travel_time_to_next,
      }));
      
      setWaypoints(waypointData);
      
      // Convert route geometry to coordinates (simplified - would decode polyline in real app)
      const coordinates = waypointData.map(wp => wp.coordinates);
      setRouteCoordinates(coordinates);
    }
  }, [dailyPlan?.route_output]);

  /**
   * Fit map to show all waypoints
   */
  useEffect(() => {
    if (mapReady && waypoints.length > 0 && mapRef.current) {
      const coordinates = waypoints.map(wp => wp.coordinates);
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [mapReady, waypoints]);

  /**
   * Handle route confirmation
   */
  const handleConfirmRoute = async () => {
    setIsConfirming(true);
    
    try {
      // Confirm route and proceed to inventory check
      await confirmRoute();
      
      // Navigate to inventory checklist
      router.push('./inventory-checklist');
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to confirm route',
        [{ text: 'OK' }]
      );
    } finally {
      setIsConfirming(false);
    }
  };

  /**
   * Format time display
   */
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  /**
   * Format distance display
   */
  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  /**
   * Format duration display
   */
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  /**
   * Get marker color based on sequence
   */
  const getMarkerColor = (sequence: number) => {
    if (sequence === 1) return '#28A745'; // Green for start
    if (sequence === waypoints.length) return '#DC3545'; // Red for end
    return '#F4A460'; // Primary color for middle points
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <LoadingStepUI 
          step="Loading your route..." 
          isConnected={isConnected}
        />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ErrorStepUI 
          error={error}
          onRetry={() => router.back()}
          retryText="Go Back"
        />
      </SafeAreaView>
    );
  }

  // No route output available
  if (!dailyPlan?.route_output) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ErrorStepUI 
          error="No route available to review"
          onRetry={() => router.back()}
          retryText="Go Back"
        />
      </SafeAreaView>
    );
  }

  const routeOutput = dailyPlan.route_output as RouteOutput;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            onMapReady={() => setMapReady(true)}
          >
            {/* Route Polyline */}
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={colors.primary}
                strokeWidth={4}
                lineDashPattern={[5, 5]}
              />
            )}
            
            {/* Waypoint Markers */}
            {waypoints.map((waypoint, index) => (
              <Marker
                key={waypoint.id}
                coordinate={waypoint.coordinates}
                title={waypoint.title}
                description={`Stop ${waypoint.sequenceNumber} - ${formatTime(waypoint.arrivalTime)}`}
                pinColor={getMarkerColor(waypoint.sequenceNumber)}
                onPress={() => setSelectedWaypoint(waypoint)}
              >
                <View style={[styles.markerContainer, { 
                  backgroundColor: getMarkerColor(waypoint.sequenceNumber)
                }]}>
                  <Text style={styles.markerText}>
                    {waypoint.sequenceNumber}
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Route Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                           <FontAwesome 
               name="map-o" 
               size={20} 
               color={colors.background}
             />
            </View>
            
            <View style={styles.summaryText}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Optimized Route
              </Text>
              <Text style={[styles.summarySubtitle, { color: colors.secondary }]}>
                AI calculated the most efficient path
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDistance(routeOutput.optimized_route.total_distance)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                Total Distance
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDuration(routeOutput.optimized_route.total_travel_time)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                Travel Time
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {waypoints.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                Stops
              </Text>
            </View>
          </View>
        </Card>

        {/* Selected Waypoint Details */}
        {selectedWaypoint && (
          <Card style={styles.waypointCard}>
            <View style={styles.waypointHeader}>
              <Text style={[styles.waypointTitle, { color: colors.text }]}>
                Stop {selectedWaypoint.sequenceNumber}: {selectedWaypoint.title}
              </Text>
              <Button
                title="×"
                onPress={() => setSelectedWaypoint(null)}
                variant="ghost"
                style={styles.closeButton}
              />
            </View>
            
            <View style={styles.waypointDetails}>
              <View style={styles.waypointTime}>
                <Text style={[styles.timeLabel, { color: colors.secondary }]}>
                  Arrival: {formatTime(selectedWaypoint.arrivalTime)}
                </Text>
                <Text style={[styles.timeLabel, { color: colors.secondary }]}>
                  Departure: {formatTime(selectedWaypoint.departureTime)}
                </Text>
              </View>
              
              {selectedWaypoint.sequenceNumber < waypoints.length && (
                <View style={styles.nextInfo}>
                  <Text style={[styles.nextLabel, { color: colors.secondary }]}>
                    To next stop: {formatDistance(selectedWaypoint.distanceToNext)} • {formatDuration(selectedWaypoint.travelTimeToNext)}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title={isConfirming ? 'Confirming...' : 'Confirm Route'}
            onPress={handleConfirmRoute}
            variant="primary"
            disabled={isConfirming}
            style={styles.confirmButton}
          />
          
          <Button
            title="Modify Schedule"
            onPress={() => router.back()}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    ...spacing.helpers.padding('m'),
  },
  mapContainer: {
    flex: 1,
    borderRadius: radius.m,
    overflow: 'hidden',
    marginBottom: spacing.m,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryCard: {
    marginBottom: spacing.m,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  summarySubtitle: {
    ...typography.caption,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  waypointCard: {
    marginBottom: spacing.m,
    backgroundColor: 'rgba(244, 164, 96, 0.1)',
  },
  waypointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  waypointTitle: {
    ...typography.h4,
    flex: 1,
  },
  closeButton: {
    minWidth: 30,
    height: 30,
  },
  waypointDetails: {
    gap: spacing.s,
  },
  waypointTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  nextInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 164, 96, 0.3)',
    paddingTop: spacing.s,
  },
  nextLabel: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    gap: spacing.m,
  },
  confirmButton: {
    // Button styles handled by Button component
  },
  backButton: {
    // Button styles handled by Button component
  },
}); 