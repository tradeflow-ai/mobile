import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform, Modal, Animated, Dimensions, ScrollView, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { 
  currentLocationAtom, 
} from '@/store/atoms';
import { JobLocation } from '@/hooks/useJobs';
import { useMockJobs } from '@/hooks/useMockJobs';
import { LocationService } from '@/services/location';
import { MockAgentService } from '@/services/mockAgentService';
import { 
  openDirectionsToJob, 
  getJobMarkerColor,
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
  const { data: jobLocations = [] } = useMockJobs();
  const [currentLocation, setCurrentLocation] = useAtom(currentLocationAtom);
  const [selectedJobLocation, setSelectedJobLocation] = useState<JobLocation | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Check if it's an active day with any plan in progress
  const isActiveDay = useMemo(() => {
    const mockUser = { id: 'mock-user-123' };
    const activePlan = MockAgentService.getTodaysMockDailyPlan(mockUser.id);
    // Show current job panel for any plan that's at least started
    return activePlan && ['dispatch_complete', 'route_complete', 'inventory_complete', 'approved'].includes(activePlan.status);
  }, [refreshTrigger]);
  
  // Get current/next job (first pending job)
  const currentJob = useMemo(() => {
    if (!isActiveDay) return null;
    return jobLocations.find(job => job.status === 'pending') || jobLocations[0];
  }, [isActiveDay, jobLocations]);
  
  // Local state
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isJobModalVisible, setIsJobModalVisible] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [scrollViewRef, setScrollViewRef] = useState<ScrollView | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 30.2672, // Default to Austin, Texas
    longitude: -97.7431,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const locationService = LocationService.getInstance();

  // Initialize user location
  useEffect(() => {
    initializeLocation();
  }, []);

  // Refresh plan status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    }, [])
  );

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
      latitude: jobLocation.latitude,
      longitude: jobLocation.longitude,
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

  const handleCurrentJobDirections = useCallback(() => {
    if (currentJob) {
      openDirectionsToJob(currentJob);
    }
  }, [currentJob]);

  const handleCurrentJobDetails = useCallback(() => {
    if (currentJob) {
      Alert.alert(
        currentJob.title,
        `${currentJob.description}\n\nAddress: ${currentJob.address}\nClient: ${currentJob.customer_name}\nPhone: ${currentJob.customer_phone}\nPriority: ${currentJob.priority}`,
        [{ text: 'OK' }]
      );
    }
  }, [currentJob]);



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
        {/* Job Location Markers with Stop Numbers */}
        {jobLocations.map((job: JobLocation, index: number) => (
          <Marker
            key={job.id}
            coordinate={{ latitude: job.latitude, longitude: job.longitude }}
            title={job.title}
            description={job.description}
            onPress={() => handleJobMarkerPress(job)}
          >
            <View style={[styles.customMarker, { backgroundColor: colors.primary }]}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
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
      </SafeAreaView>

      {/* Current Job Panel - Show on active day, otherwise show job toggle button */}
      {!isJobModalVisible && (
        <SafeAreaView style={styles.bottomControls}>
          {isActiveDay && currentJob ? (
            // Current Job Panel for active day
            <View style={[styles.currentJobPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.currentJobHeader}>
                <View style={styles.currentJobInfo}>
                  <Text style={[styles.currentJobLabel, { color: colors.placeholder }]}>
                    Current Job
                  </Text>
                  <Text style={[styles.currentJobTitle, { color: colors.text }]} numberOfLines={1}>
                    {currentJob.title}
                  </Text>
                  <Text style={[styles.currentJobAddress, { color: colors.placeholder }]} numberOfLines={1}>
                    {currentJob.address}
                  </Text>
                </View>
                <View style={[styles.currentJobNumber, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.currentJobNumberText, { color: colors.background }]}>
                    {jobLocations.findIndex(job => job.id === currentJob.id) + 1}
                  </Text>
                </View>
              </View>
              
              <View style={styles.currentJobActions}>
                <TouchableOpacity
                  style={[styles.currentJobButton, { backgroundColor: colors.primary }]}
                  onPress={handleCurrentJobDirections}
                >
                  <FontAwesome name="location-arrow" size={16} color={colors.background} />
                  <Text style={[styles.currentJobButtonText, { color: colors.background }]}>
                    Directions
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.currentJobButton, styles.currentJobSecondaryButton, { borderColor: colors.primary }]}
                  onPress={handleCurrentJobDetails}
                >
                  <FontAwesome name="info-circle" size={16} color={colors.primary} />
                  <Text style={[styles.currentJobButtonText, { color: colors.primary }]}>
                    Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Job Toggle Button for non-active days
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
          )}
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
              {jobLocations.map((job: JobLocation, index: number) => (
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
                        latitude: job.latitude,
                        longitude: job.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      });
                    }}
                  >
                    <View style={styles.jobItemHeader}>
                      <View style={[styles.stopNumberIndicator, { backgroundColor: colors.primary }]}>
                        <Text style={styles.stopNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                      <Text style={[styles.jobType, { color: colors.placeholder }]}>{job.job_type}</Text>
                    </View>
                    <Text style={[styles.jobDescription, { color: colors.placeholder }]}>{job.description}</Text>
                    <Text style={[styles.jobAddress, { color: colors.placeholder }]}>{job.address}</Text>
                    <View style={styles.jobMeta}>
                      <Text style={[styles.jobPriority, { color: getJobMarkerColor(job.job_type, job.priority) }]}>
                        {job.priority.toUpperCase()} PRIORITY
                      </Text>
                      <Text style={[styles.jobDuration, { color: colors.placeholder }]}>
                        {job.estimated_duration || 60}min
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
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  jobToggleButton: {
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
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stopNumberIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  currentJobPanel: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  currentJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentJobInfo: {
    flex: 1,
    marginRight: 12,
  },
  currentJobLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentJobTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentJobAddress: {
    fontSize: 14,
    fontWeight: '400',
  },
  currentJobNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentJobNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentJobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  currentJobButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  currentJobSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  currentJobButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
