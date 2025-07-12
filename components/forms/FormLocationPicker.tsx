/**
 * TradeFlow Mobile App - FormLocationPicker Component
 * 
 * A React Hook Form integrated location picker component that allows users to
 * search and select locations on a map with validation and error handling.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, touchTargets } from '@/constants/Theme';
import { Label, ErrorMessage, LocationMapView } from '@/components/ui';
import { LocationPicker, LocationData } from '@/components/ui/LocationPicker';
import { BaseFormFieldProps } from './index';

export interface FormLocationPickerProps extends BaseFormFieldProps {
  placeholder?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  height?: number;
  showPreview?: boolean;
  previewHeight?: number;
}

export const FormLocationPicker: React.FC<FormLocationPickerProps> = ({
  name,
  rules,
  label,
  required = false,
  placeholder = "Search for a location...",
  disabled = false,
  containerStyle,
  height = 400,
  showPreview = true,
  previewHeight = 120,
}) => {
  const { control } = useFormContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const validationRules = {
    required: required ? (rules?.required || `${label || name} is required`) : undefined,
    ...rules,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Label text={label} required={required} />}
      
      <Controller
        control={control}
        name={name}
        rules={validationRules}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View>
            {/* Location Input Button */}
            <TouchableOpacity
              onPress={() => !disabled && setShowLocationPicker(true)}
              disabled={disabled}
              style={[
                styles.locationButton,
                { 
                  backgroundColor: colors.card,
                  borderColor: error ? colors.error : colors.border,
                },
                disabled && { opacity: 0.5 }
              ]}
            >
              <View style={styles.locationButtonContent}>
                <FontAwesome 
                  name="map-marker" 
                  size={20} 
                  color={value ? colors.primary : colors.placeholder} 
                />
                <View style={styles.locationTextContainer}>
                  <Text 
                    style={[
                      styles.locationButtonText,
                      { color: value ? colors.text : colors.placeholder }
                    ]}
                    numberOfLines={2}
                  >
                    {value ? value.address : placeholder}
                  </Text>
                </View>
              </View>
              <FontAwesome 
                name="chevron-right" 
                size={16} 
                color={colors.placeholder} 
              />
            </TouchableOpacity>

            {/* Location Preview */}
            {showPreview && value && value.address && (
              <View style={[styles.previewContainer, { height: previewHeight }]}>
                <LocationMapView
                  latitude={value.latitude}
                  longitude={value.longitude}
                  address={value.address}
                  height={previewHeight}
                  disabled={true}
                />
              </View>
            )}

            {/* Error Message */}
            <ErrorMessage message={error?.message} />

            {/* Location Picker Modal */}
            <LocationPicker
              visible={showLocationPicker}
              value={value}
              onLocationSelect={(location: LocationData) => {
                onChange(location);
                setShowLocationPicker(false);
              }}
              onCancel={() => setShowLocationPicker(false)}
              label={label}
              placeholder={placeholder}
              height={height}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.m,
    ...spacing.helpers.padding('m'),
    minHeight: touchTargets.minimum,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.s,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationButtonText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.normal,
    lineHeight: typography.sizes.caption * 1.2,
  },
  previewContainer: {
    marginTop: spacing.s,
    borderRadius: radius.m,
    overflow: 'hidden',
    position: 'relative',
  },
  previewOverlay: {
    position: 'absolute',
    top: spacing.s,
    left: spacing.s,
    right: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    ...spacing.helpers.padding('xs'),
    borderRadius: radius.s,
    opacity: 0.9,
    gap: spacing.xs,
  },

}); 