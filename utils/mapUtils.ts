import { Platform, Linking, Alert } from 'react-native';
import { JobLocation } from '@/store/atoms';

/**
 * Opens the native iOS Maps app with the specified coordinates
 */
export const openNativeMaps = async (
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      const url = `http://maps.apple.com/?q=${label || 'Location'}&ll=${latitude},${longitude}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open Maps app');
      }
    } else {
      // Fallback for other platforms
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error('Error opening native maps:', error);
    Alert.alert('Error', 'Unable to open Maps app');
  }
};

/**
 * Opens native Maps with directions to a specific job location
 */
export const openDirectionsToJob = async (jobLocation: JobLocation): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      const url = `http://maps.apple.com/?daddr=${jobLocation.coordinates.latitude},${jobLocation.coordinates.longitude}&dirflg=d`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open Maps app for directions');
      }
    } else {
      // Fallback for other platforms
      const url = `https://www.google.com/maps/dir/?api=1&destination=${jobLocation.coordinates.latitude},${jobLocation.coordinates.longitude}`;
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error('Error opening directions:', error);
    Alert.alert('Error', 'Unable to open directions');
  }
};

/**
 * Opens native Maps with a route through multiple job locations
 */
export const openRouteInNativeMaps = async (jobLocations: JobLocation[]): Promise<void> => {
  try {
    if (jobLocations.length === 0) {
      Alert.alert('Error', 'No job locations to route');
      return;
    }

    if (Platform.OS === 'ios') {
      // For iOS, we'll open with the first destination and show an alert about multiple stops
      const firstJob = jobLocations[0];
      const url = `http://maps.apple.com/?daddr=${firstJob.coordinates.latitude},${firstJob.coordinates.longitude}&dirflg=d`;
      
      if (jobLocations.length > 1) {
        Alert.alert(
          'Multiple Stops',
          `Opening directions to ${firstJob.title}. You have ${jobLocations.length} total stops on this route.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Maps', onPress: () => Linking.openURL(url) }
          ]
        );
      } else {
        await Linking.openURL(url);
      }
    }
  } catch (error) {
    console.error('Error opening route:', error);
    Alert.alert('Error', 'Unable to open route');
  }
};

/**
 * Gets the color for a job marker based on job type and priority
 */
export const getJobMarkerColor = (jobType: JobLocation['jobType'], priority: JobLocation['priority']): string => {
  if (priority === 'high') return '#FF4444'; // Red for high priority
  
  switch (jobType) {
    case 'delivery':
      return '#4CAF50'; // Green
    case 'pickup':
      return '#FF9800'; // Orange
    case 'service':
      return '#2196F3'; // Blue
    case 'inspection':
      return '#9C27B0'; // Purple
    default:
      return '#757575'; // Gray
  }
};

/**
 * Gets the job type icon name for FontAwesome
 */
export const getJobTypeIcon = (jobType: JobLocation['jobType']): string => {
  switch (jobType) {
    case 'delivery':
      return 'truck';
    case 'pickup':
      return 'hand-o-up';
    case 'service':
      return 'wrench';
    case 'inspection':
      return 'clipboard-check';
    default:
      return 'map-marker';
  }
}; 