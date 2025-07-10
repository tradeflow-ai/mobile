import { Platform, Linking, Alert } from 'react-native';
import { JobLocation } from '@/hooks/useJobs';

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
      const url = `http://maps.apple.com/?daddr=${jobLocation.latitude},${jobLocation.longitude}&dirflg=d`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open Maps app for directions');
      }
    } else {
      // Fallback for other platforms
      const url = `https://www.google.com/maps/dir/?api=1&destination=${jobLocation.latitude},${jobLocation.longitude}`;
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error('Error opening directions:', error);
    Alert.alert('Error', 'Unable to open directions');
  }
};



/**
 * Gets the color for a job marker based on job type and priority
 */
export const getJobMarkerColor = (jobType: JobLocation['job_type'], priority: JobLocation['priority']): string => {
  if (priority === 'high') return '#FF4444'; // Red for high priority
  
  switch (jobType) {
    case 'service':
      return '#2196F3'; // Blue
    case 'inspection':
      return '#9C27B0'; // Purple
    case 'emergency':
      return '#FF4444'; // Red for emergency
    default:
      return '#757575'; // Gray
  }
};

/**
 * Gets the job type icon name for FontAwesome
 */
export const getJobTypeIcon = (jobType: JobLocation['job_type']): string => {
  switch (jobType) {
    case 'service':
      return 'wrench';
    case 'inspection':
      return 'clipboard-check';
    case 'emergency':
      return 'exclamation-triangle';
    default:
      return 'map-marker';
  }
}; 