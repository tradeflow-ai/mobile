import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { radius, shadows } from '@/constants/Theme';
import { openNativeMaps } from '@/utils/mapUtils';

interface LocationMapViewProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  onPress?: () => void;
  style?: ViewStyle;
  height?: number;
  editable?: boolean;
  disabled?: boolean;
}

export const LocationMapView: React.FC<LocationMapViewProps> = ({
  latitude,
  longitude,
  title,
  address,
  onPress,
  style,
  height = 120,
  editable = false,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleMapPress = async () => {
    if (disabled) return;
    
    if (onPress) {
      onPress();
    } else {
      // Default behavior: open in external maps
      try {
        await openNativeMaps(latitude, longitude, title || address);
      } catch (error) {
        console.error('Error opening maps:', error);
        Alert.alert('Error', 'Unable to open maps app');
      }
    }
  };

  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.02, // Zoomed out to show more area
    longitudeDelta: 0.02,
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.mapWrapper, { height }]}
        onPress={handleMapPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <MapView
          style={styles.map}
          region={region}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={true}
          showsTraffic={false}
          toolbarEnabled={false}
          pointerEvents="none"
        >
          <Marker
            coordinate={{ latitude, longitude }}
            title={title}
            description={address}
          >
            <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
              <FontAwesome name="map-marker" size={20} color={colors.background} />
            </View>
          </Marker>
        </MapView>
        
        {/* Tap to open indicator */}
        <View style={[styles.tapIndicator, { backgroundColor: colors.card }]}>
          <FontAwesome name="external-link" size={12} color={colors.primary} />
        </View>
        
        {/* Edit indicator */}
        {editable && (
          <View style={[styles.editIndicator, { backgroundColor: colors.primary }]}>
            <FontAwesome name="edit" size={12} color={colors.background} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  mapWrapper: {
    position: 'relative',
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tapIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  editIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
}); 