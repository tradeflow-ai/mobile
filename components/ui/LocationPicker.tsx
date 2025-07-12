/**
 * TradeFlow Mobile App - LocationPicker Component
 * 
 * A location picker component that allows users to search and select locations on a map.
 * Supports both manual coordinate selection and address search with geocoding.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, touchTargets } from '@/constants/Theme';
import { SearchBar, Button } from '@/components/ui';
import { LocationService } from '@/services/location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationPickerProps {
  value?: LocationData;
  onLocationSelect: (location: LocationData) => void;
  onCancel?: () => void;
  visible: boolean;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
  height?: number;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onLocationSelect,
  onCancel,
  visible,
  label,
  placeholder = "Search for a location...",
  disabled = false,
  error,
  helperText,
  containerStyle,
  required = false,
  height = 400,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const mapRef = useRef<MapView>(null);
  const locationService = LocationService.getInstance();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(value || null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: value?.latitude || 0,
    longitude: value?.longitude || 0,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // Update region when modal opens
  useEffect(() => {
    if (visible) {
      if (value && value.latitude !== 0 && value.longitude !== 0) {
        // Use existing location if available
        setRegion({
          latitude: value.latitude,
          longitude: value.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        setSelectedLocation(value);
      } else {
        // Get user's current location as default
        getCurrentLocationForDefault();
      }
    }
  }, [visible]);

  // Get current location for default view (without setting as selected)
  const getCurrentLocationForDefault = async () => {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        setRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        
        // Animate to current location
        mapRef.current?.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting current location for default view:', error);
      // Fallback to a reasonable default location (San Francisco)
      setRegion({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        const address = await locationService.reverseGeocode(
          currentLocation.latitude,
          currentLocation.longitude
        );
        
        const locationData: LocationData = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: address || `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`,
        };

        setSelectedLocation(locationData);
        setRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });

        // Animate to current location
        mapRef.current?.animateToRegion({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Unable to get current location. Please check location permissions.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Search for locations using forward geocoding
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use expo-location's geocoding
      const results = await Location.geocodeAsync(query);
      
      const locationResults: LocationData[] = [];
      
      for (const result of results.slice(0, 5)) { // Limit to 5 results
        const address = await locationService.reverseGeocode(result.latitude, result.longitude);
        locationResults.push({
          latitude: result.latitude,
          longitude: result.longitude,
          address: address || `${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
        });
      }

      setSearchResults(locationResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching locations:', error);
      Alert.alert('Error', 'Unable to search for locations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        searchLocations(text);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle map press
  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    
    try {
      const address = await locationService.reverseGeocode(
        coordinate.latitude,
        coordinate.longitude
      );

      const locationData: LocationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address || `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
      };

      setSelectedLocation(locationData);
      setSearchQuery('');
      setShowSearchResults(false);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      
      // Still set location even if reverse geocoding fails
      const locationData: LocationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
      };

      setSelectedLocation(locationData);
    }
  };

  // Handle search result selection
  const handleSearchResultPress = (location: LocationData) => {
    setSelectedLocation(location);
    setSearchQuery('');
    setShowSearchResults(false);
    
    // Animate to selected location
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 1000);
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedLocation(value || null);
    setSearchQuery('');
    setShowSearchResults(false);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {label || 'Select Location'}
          </Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <FontAwesome name="times" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder={placeholder}
            style={styles.searchBar}
          />
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
            style={[styles.currentLocationButton, { backgroundColor: colors.primary }]}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <FontAwesome name="location-arrow" size={16} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {showSearchResults && (
          <View style={[styles.searchResults, { backgroundColor: colors.card }]}>
            <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
              {isSearching ? (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.searchingText, { color: colors.text }]}>
                    Searching locations...
                  </Text>
                </View>
              ) : searchResults.length > 0 ? (
                searchResults.map((location, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSearchResultPress(location)}
                    style={[styles.resultItem, { borderBottomColor: colors.border }]}
                  >
                    <FontAwesome name="map-marker" size={16} color={colors.primary} />
                    <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={2}>
                      {location.address}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.noResultsText, { color: colors.placeholder }]}>
                  No locations found
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* Map */}
        <View style={[styles.mapContainer, { height }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsBuildings={true}
            showsTraffic={false}
            pitchEnabled={true}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={true}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                title="Selected Location"
                description={selectedLocation.address}
              >
                <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
                  <FontAwesome name="map-marker" size={24} color={colors.background} />
                </View>
              </Marker>
            )}
          </MapView>
          
          {/* Map instruction overlay */}
          <View style={[styles.mapInstructionOverlay, { backgroundColor: colors.card }]}>
            <FontAwesome name="hand-pointer-o" size={14} color={colors.primary} />
            <Text style={[styles.mapInstructionText, { color: colors.text }]}>
              Tap on the map to select a location
            </Text>
          </View>
        </View>

        {/* Selected Location Info and Action Buttons */}
        <View style={styles.bottomContainer}>
          {selectedLocation && (
            <View style={[styles.selectedLocationInfo, { backgroundColor: colors.card }]}>
              <FontAwesome name="map-marker" size={16} color={colors.primary} />
              <Text style={[styles.selectedLocationText, { color: colors.text }]} numberOfLines={2}>
                {selectedLocation.address}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title="Confirm Location"
              onPress={handleConfirm}
              disabled={!selectedLocation}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.h3,
  },
  closeButton: {
    ...touchTargets.styles.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
    gap: spacing.s,
  },
  searchBar: {
    flex: 1,
  },
  currentLocationButton: {
    marginTop: -16,
    height: 44,
    width: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    maxHeight: 200,
    marginHorizontal: spacing.m,
    borderRadius: radius.m,
    ...shadows.subtle(undefined),
  },
  resultsScroll: {
    maxHeight: 200,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
    gap: spacing.s,
  },
  searchingText: {
    ...typography.body,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...spacing.helpers.padding('m'),
    borderBottomWidth: 1,
    gap: spacing.s,
  },
  resultText: {
    ...typography.body,
    flex: 1,
  },
  noResultsText: {
    ...typography.body,
    textAlign: 'center',
    ...spacing.helpers.padding('m'),
  },
  mapContainer: {
    flex: 1,
    margin: spacing.m,
    borderRadius: radius.m,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapInstructionOverlay: {
    position: 'absolute',
    top: spacing.m,
    left: spacing.m,
    right: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    ...spacing.helpers.padding('s'),
    borderRadius: radius.s,
    opacity: 0.9,
    gap: spacing.s,
  },
  mapInstructionText: {
    ...typography.caption,
    flex: 1,
  },
  bottomContainer: {
    ...spacing.helpers.padding('m'),
    paddingTop: spacing.s,
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
    borderRadius: radius.m,
    gap: spacing.s,
  },
  selectedLocationText: {
    ...typography.body,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
}); 