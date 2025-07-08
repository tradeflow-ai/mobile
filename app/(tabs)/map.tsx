import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform, Modal, Animated, Dimensions, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { 
  jobLocationsAtom, 
  currentLocationAtom, 
  selectedJobLocationAtom,
  JobLocation 
} from '@/store/atoms';
import { LocationService } from '@/services/location';
import { 
  openDirectionsToJob, 
  openRouteInNativeMaps,
  getJobMarkerColor,
  getJobTypeIcon
} from '@/utils/mapUtils';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.6;

type CameraPosition = {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  zoom: number;
  bearing?: number;
  tilt?: number;
};

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // State management
  const [jobLocations] = useAtom(jobLocationsAtom);
  const [currentLocation, setCurrentLocation] = useAtom(currentLocationAtom);
  const [selectedJobLocation, setSelectedJobLocation] = useAtom(selectedJobLocationAtom);
  
  // Local state
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isJobModalVisible, setIsJobModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [scrollViewRef, setScrollViewRef] = useState<ScrollView | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.7749, // Default to San Francisco
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const locationService = LocationService.getInstance();

  // Initialize user location
  useEffect(() => {
    initializeLocation();
  }, []);

  // Update map region when user location changes
  useEffect(() => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [currentLocation]);

  const initializeLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error getting initial location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please ensure location services are enabled.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [setCurrentLocation]);

  const handleMyLocationPress = useCallback(async () => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      await initializeLocation();
    }
  }, [currentLocation, initializeLocation]);

  const handleJobMarkerPress = useCallback((jobLocation: JobLocation) => {
    setSelectedJobLocation(jobLocation);
    
    // Center map on selected location
    setMapRegion({
      latitude: jobLocation.coordinates.latitude,
      longitude: jobLocation.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    // Open modal if not already open
    if (!isJobModalVisible) {
      setIsJobModalVisible(true);
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    // Scroll to selected job in modal
    setTimeout(() => {
      if (scrollViewRef) {
        const jobIndex = jobLocations.findIndex(job => job.id === jobLocation.id);
        if (jobIndex !== -1) {
          // Each job item is approximately 140px tall, scroll to position
          scrollViewRef.scrollTo({
            y: jobIndex * 140,
            animated: true
          });
        }
      }
    }, 400); // Wait for modal animation to complete
  }, [setSelectedJobLocation, isJobModalVisible, modalAnimation, scrollViewRef, jobLocations]);

  const handleRoutePress = useCallback(() => {
    if (jobLocations.length === 0) {
      Alert.alert('No Jobs', 'No job locations available for routing.');
      return;
    }

    openRouteInNativeMaps(jobLocations);
  }, [jobLocations]);



  const toggleJobModal = useCallback(() => {
    if (isJobModalVisible) {
      // Close modal
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsJobModalVisible(false);
      });
    } else {
      // Open modal
      setIsJobModalVisible(true);
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isJobModalVisible, modalAnimation]);

  // Create route coordinates for polyline
  const routeCoordinates = jobLocations.map(job => ({
    latitude: job.coordinates.latitude,
    longitude: job.coordinates.longitude,
  }));

  const modalTranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [MODAL_HEIGHT, 0],
  });

  const backdropOpacity = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <MapView
        style={styles.fullScreenMap}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={false}
        onRegionChangeComplete={setMapRegion}
      >
        {/* Job Location Markers */}
        {jobLocations.map((job) => (
          <Marker
            key={job.id}
            coordinate={job.coordinates}
            title={job.title}
            description={job.description}
            pinColor={getJobMarkerColor(job.jobType, job.priority)}
            onPress={() => handleJobMarkerPress(job)}
          />
        ))}

        {/* Route Polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={3}
            onPress={handleRoutePress}
          />
        )}
      </MapView>

      {/* Floating Controls */}
      <SafeAreaView style={styles.floatingControls}>
        {/* My Location Button */}
        <TouchableOpacity
          style={[styles.myLocationButton, { backgroundColor: colors.background }]}
          onPress={handleMyLocationPress}
          disabled={isLoadingLocation}
        >
          <FontAwesome 
            name="location-arrow" 
            size={20} 
            color={isLoadingLocation ? colors.placeholder : colors.primary} 
          />
        </TouchableOpacity>

        {/* Route Button */}
        <TouchableOpacity
          style={[styles.routeButton, { backgroundColor: colors.background }]}
          onPress={handleRoutePress}
        >
          <FontAwesome 
            name="road" 
            size={20} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Job Toggle Button - Only show when modal is closed */}
      {!isJobModalVisible && (
        <SafeAreaView style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.jobToggleButton, { backgroundColor: colors.primary }]}
            onPress={toggleJobModal}
          >
            <View style={styles.jobToggleContent}>
              <Text style={[styles.jobCountText, { color: colors.background }]}>
                {jobLocations.length} Jobs
              </Text>
              <FontAwesome 
                name="chevron-up" 
                size={12} 
                color={colors.background} 
              />
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Job Modal */}
      <Modal
        visible={isJobModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleJobModal}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backdropTouchable}
              onPress={toggleJobModal}
            />
          </Animated.View>

          {/* Modal Content */}
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
          >
            {/* Modal Handle */}
            <View style={styles.modalHandle}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Job Locations
              </Text>
              <TouchableOpacity onPress={toggleJobModal}>
                <FontAwesome name="times" size={20} color={colors.placeholder} />
              </TouchableOpacity>
            </View>

            {/* Job List */}
            <ScrollView 
              style={styles.jobList} 
              showsVerticalScrollIndicator={false}
              ref={setScrollViewRef}
            >
              {jobLocations.map((job) => (
                <View
                  key={job.id}
                  style={[
                    styles.jobItem, 
                    { 
                      backgroundColor: selectedJobLocation?.id === job.id ? colors.primary + '20' : colors.card, 
                      borderColor: selectedJobLocation?.id === job.id ? colors.primary : colors.border 
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.jobItemContent}
                    onPress={() => {
                      setSelectedJobLocation(job);
                      // Center map on selected location
                      setMapRegion({
                        latitude: job.coordinates.latitude,
                        longitude: job.coordinates.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      });
                    }}
                  >
                    <View style={styles.jobItemHeader}>
                      <View style={[styles.jobTypeIndicator, { backgroundColor: getJobMarkerColor(job.jobType, job.priority) }]} />
                      <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                      <Text style={[styles.jobType, { color: colors.placeholder }]}>{job.jobType}</Text>
                    </View>
                    <Text style={[styles.jobDescription, { color: colors.placeholder }]}>{job.description}</Text>
                    <Text style={[styles.jobAddress, { color: colors.placeholder }]}>{job.address}</Text>
                    <View style={styles.jobMeta}>
                      <Text style={[styles.jobPriority, { color: getJobMarkerColor(job.jobType, job.priority) }]}>
                        {job.priority.toUpperCase()} PRIORITY
                      </Text>
                      <Text style={[styles.jobDuration, { color: colors.placeholder }]}>
                        {job.estimatedDuration}min
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Get Directions Button */}
                  <TouchableOpacity
                    style={[styles.directionsButton, { backgroundColor: colors.primary }]}
                    onPress={() => openDirectionsToJob(job)}
                  >
                    <FontAwesome name="location-arrow" size={16} color={colors.background} />
                    <Text style={[styles.directionsButtonText, { color: colors.background }]}>
                      Get Directions
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Job Legend */}
              <View style={[styles.legendContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.legendTitle, { color: colors.text }]}>Job Types</Text>
                <View style={styles.legendGrid}>
                  {[
                    { type: 'delivery', label: 'Delivery', color: '#4CAF50' },
                    { type: 'pickup', label: 'Pickup', color: '#FF9800' },
                    { type: 'service', label: 'Service', color: '#2196F3' },
                    { type: 'inspection', label: 'Inspection', color: '#9C27B0' },
                  ].map(({ type, label, color }) => (
                    <View key={type} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: color }]} />
                      <Text style={[styles.legendText, { color: colors.text }]}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreenMap: {
    flex: 1,
  },
  floatingControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    pointerEvents: 'box-none',
  },

  myLocationButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  routeButton: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  jobToggleButton: {
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  jobToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobCountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    height: MODAL_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  modalHandle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  jobList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jobItem: {
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  jobItemContent: {
    padding: 16,
  },
  jobItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTypeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  jobType: {
    fontSize: 12,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  jobDescription: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  jobAddress: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobPriority: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobDuration: {
    fontSize: 11,
    fontWeight: '500',
  },
  legendContainer: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    gap: 8,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
