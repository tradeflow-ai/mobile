/**
 * TradeFlow Mobile App - TimeInput Component
 * 
 * A themeable time input component with picker dropdowns for time selection,
 * labels, disabled states, and consistent styling with the rest of the design system.
 * Supports both 12-hour and 24-hour formats with intuitive picker interface.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, touchTargets, radius, shadows } from '@/constants/Theme';

export interface TimeInputProps {
  value?: string; // Format: "HH:MM" or "HH:MM AM/PM"
  onTimeChange: (time: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
  format24Hour?: boolean;
}

interface TimeComponents {
  hour: number;
  minute: number;
  period?: 'AM' | 'PM';
}

interface IOSWheelPickerProps {
  items: number[] | string[];
  selectedValue: number | string;
  onValueChange: (value: number | string) => void;
  itemHeight?: number;
  visibleItems?: number;
  colors: any;
}

const IOSWheelPicker: React.FC<IOSWheelPickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  itemHeight = 44,
  visibleItems = 5,
  colors,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentCenterIndex, setCurrentCenterIndex] = useState(0);
  const containerHeight = itemHeight * visibleItems;
  const paddingItems = Math.floor(visibleItems / 2);

  // Create padded items array to center the selection
  const paddedItems = [
    ...Array(paddingItems).fill(''),
    ...items.map(item => item),
    ...Array(paddingItems).fill(''),
  ];

  // Find the index of the selected value in the padded array
  const selectedIndex = paddedItems.findIndex(item => item === selectedValue);

  useEffect(() => {
    // Center the initially selected item, and don't fight user scrolling
    if (scrollViewRef.current && selectedIndex >= 0 && !isScrolling) {
      const y = (selectedIndex - paddingItems) * itemHeight;
      scrollViewRef.current.scrollTo({ y, animated: false });
      setCurrentCenterIndex(selectedIndex);
    }
  }, [selectedValue, items]);

  const handleScroll = (event: any) => {
    if (!isScrolling) return;
    // Update visual highlight to match scroll position
    const scrollY = event.nativeEvent.contentOffset.y;
    const topItemIndex = Math.round(scrollY / itemHeight);
    const centerItemIndex = topItemIndex + paddingItems;
    setCurrentCenterIndex(centerItemIndex);
  };

  const handleScrollBeginDrag = () => {
    setIsScrolling(true);
  };

  const onScrollEnd = (event: any) => {
    if (!isScrolling) return;

    const scrollY = event.nativeEvent.contentOffset.y;
    const topItemIndex = Math.round(scrollY / itemHeight);
    const centerItemIndex = topItemIndex + paddingItems;

    // Check if item exists to prevent crash on out of bounds
    if (centerItemIndex < 0 || centerItemIndex >= paddedItems.length) {
      setIsScrolling(false);
      return;
    }
    
    const selectedItem = paddedItems[centerItemIndex];
    
    setCurrentCenterIndex(centerItemIndex);

    if (selectedItem !== '' && selectedItem !== selectedValue) {
      onValueChange(selectedItem);
    }
    setIsScrolling(false);
  };

  return (
    <View style={[styles.iosWheelContainer, { height: containerHeight }]}>
      {/* Selection indicator overlay */}
      <View
        style={[
          styles.selectionIndicator,
          {
            top: paddingItems * itemHeight,
            height: itemHeight,
            backgroundColor: colors.primary + '15',
            borderColor: colors.primary + '30',
          },
        ]}
      />
      
              <ScrollView
          ref={scrollViewRef}
          style={styles.iosWheelScrollView}
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
        >
        {paddedItems.map((item, index) => (
          <TouchableOpacity
            key={`${item}-${index}`}
            style={[styles.iosWheelItem, { height: itemHeight }]}
            onPress={() => {
              if (item !== '') {
                onValueChange(item);
                scrollViewRef.current?.scrollTo({ y: index * itemHeight, animated: true });
              }
            }}
          >
            <Text
              style={[
                styles.iosWheelItemText,
                { color: index === currentCenterIndex ? colors.primary : colors.text },
                { opacity: item === '' ? 0 : 1 },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onTimeChange,
  label,
  placeholder = 'Tap to select time',
  disabled = false,
  error,
  helperText,
  containerStyle,
  required = false,
  format24Hour = false,
}) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [timeComponents, setTimeComponents] = useState<TimeComponents>({
    hour: format24Hour ? 8 : 8,
    minute: 0,
    period: format24Hour ? undefined : 'AM',
  });

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Parse existing value into components
  useEffect(() => {
    if (value) {
      const components = parseTimeValue(value);
      if (components) {
        setTimeComponents(components);
      }
    }
  }, [value]);

  const parseTimeValue = (timeStr: string): TimeComponents | null => {
    if (format24Hour) {
      // Parse 24-hour format: "HH:MM"
      const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        return {
          hour: parseInt(match[1], 10),
          minute: parseInt(match[2], 10),
        };
      }
    } else {
      // Parse 12-hour format: "HH:MM AM/PM"
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
      if (match) {
        return {
          hour: parseInt(match[1], 10),
          minute: parseInt(match[2], 10),
          period: match[3].toUpperCase() as 'AM' | 'PM',
        };
      }
    }
    return null;
  };

  const formatTimeComponents = (components: TimeComponents): string => {
    if (format24Hour) {
      return `${components.hour.toString().padStart(2, '0')}:${components.minute.toString().padStart(2, '0')}`;
    } else {
      return `${components.hour}:${components.minute.toString().padStart(2, '0')} ${components.period}`;
    }
  };

  const generateHourOptions = () => {
    if (format24Hour) {
      return Array.from({ length: 24 }, (_, i) => i);
    } else {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
  };

  const generateMinuteOptions = () => {
    // Generate minutes in 5-minute increments for better UX
    return Array.from({ length: 12 }, (_, i) => i * 5);
  };

  const handleTimeChange = (newComponents: TimeComponents) => {
    setTimeComponents(newComponents);
    const formattedTime = formatTimeComponents(newComponents);
    onTimeChange(formattedTime);
  };

  const getDisplayValue = (): string => {
    if (value) {
      return value;
    }
    return formatTimeComponents(timeComponents);
  };

  const getInputStyle = (): ViewStyle => {
    return {
      ...styles.input,
      borderColor: error ? colors.error : colors.border,
      backgroundColor: disabled ? colors.disabled : colors.background,
    };
  };

  const renderPickerModal = () => (
    <Modal
      visible={isPickerVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsPickerVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }, shadows.medium(colorScheme)]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Time
            </Text>
            <TouchableOpacity
              onPress={() => setIsPickerVisible(false)}
              style={styles.closeButton}
            >
              <FontAwesome name="times" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickersContainer}>
            {/* Hour Picker */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Hour</Text>
              {Platform.OS === 'ios' ? (
                <IOSWheelPicker
                  items={generateHourOptions()}
                  selectedValue={timeComponents.hour}
                  onValueChange={(value) => handleTimeChange({ ...timeComponents, hour: value as number })}
                  colors={colors}
                />
              ) : (
                <Picker
                  key={`hour-${timeComponents.hour}`}
                  selectedValue={timeComponents.hour}
                  style={styles.picker}
                  itemStyle={[styles.pickerItem, { color: colors.text }]}
                  onValueChange={(itemValue) =>
                    handleTimeChange({ ...timeComponents, hour: itemValue })
                  }
                >
                  {generateHourOptions().map((hour) => (
                    <Picker.Item
                      key={hour}
                      label={format24Hour ? hour.toString().padStart(2, '0') : hour.toString()}
                      value={hour}
                    />
                  ))}
                </Picker>
              )}
            </View>

            {/* Minute Picker */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Minute</Text>
              {Platform.OS === 'ios' ? (
                <IOSWheelPicker
                  items={generateMinuteOptions()}
                  selectedValue={timeComponents.minute}
                  onValueChange={(value) => handleTimeChange({ ...timeComponents, minute: value as number })}
                  colors={colors}
                />
              ) : (
                <Picker
                  key={`minute-${timeComponents.minute}`}
                  selectedValue={timeComponents.minute}
                  style={styles.picker}
                  itemStyle={[styles.pickerItem, { color: colors.text }]}
                  onValueChange={(itemValue) =>
                    handleTimeChange({ ...timeComponents, minute: itemValue })
                  }
                >
                  {generateMinuteOptions().map((minute) => (
                    <Picker.Item
                      key={minute}
                      label={minute.toString().padStart(2, '0')}
                      value={minute}
                    />
                  ))}
                </Picker>
              )}
            </View>

            {/* AM/PM Picker (only for 12-hour format) */}
            {!format24Hour && (
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: colors.text }]}>Period</Text>
                
                {Platform.OS === 'ios' ? (
                  <IOSWheelPicker
                    items={['AM', 'PM']}
                    selectedValue={String(timeComponents.period || 'AM')}
                    onValueChange={(value) => handleTimeChange({ ...timeComponents, period: value as 'AM' | 'PM' })}
                    colors={colors}
                  />
                ) : Platform.OS === 'android' ? (
                  <View style={styles.androidPickerContainer}>
                    <TouchableOpacity
                      style={[styles.androidPickerButton, { borderColor: colors.border }]}
                      onPress={() => {
                        // This will trigger the picker dialog
                      }}
                    >
                      <Text style={[styles.androidPickerText, { color: colors.text }]}>
                        {timeComponents.period || 'AM'}
                      </Text>
                    </TouchableOpacity>
                    <Picker
                      key={`period-${timeComponents.period}-${Date.now()}`}
                      selectedValue={String(timeComponents.period || 'AM')}
                      style={styles.hiddenPicker}
                      mode="dialog"
                      prompt="Select Period"
                      onValueChange={(itemValue) => {
                        handleTimeChange({ ...timeComponents, period: itemValue as 'AM' | 'PM' });
                      }}
                    >
                      <Picker.Item label="AM" value="AM" />
                      <Picker.Item label="PM" value="PM" />
                    </Picker>
                  </View>
                ) : (
                  <Picker
                    key={`period-${timeComponents.period}`}
                    selectedValue={String(timeComponents.period || 'AM')}
                    style={styles.picker}
                    itemStyle={[styles.pickerItem, { color: colors.text }]}
                    onValueChange={(itemValue) => {
                      handleTimeChange({ ...timeComponents, period: itemValue as 'AM' | 'PM' });
                    }}
                  >
                    <Picker.Item label="AM" value="AM" />
                    <Picker.Item label="PM" value="PM" />
                  </Picker>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsPickerVisible(false)}
          >
            <Text style={[styles.doneButtonText, { color: colors.background }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={getInputStyle()}
        onPress={() => !disabled && setIsPickerVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.inputText, { color: value ? colors.text : colors.placeholder }]}>
          {value || placeholder}
        </Text>
        <FontAwesome
          name="clock-o"
          size={16}
          color={disabled ? colors.placeholder : colors.primary}
          style={styles.icon}
        />
      </TouchableOpacity>

      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && (
        <Text style={[styles.helperText, { color: colors.placeholder }]}>{helperText}</Text>
      )}

      {renderPickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  label: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  required: {
    ...typography.h4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.m,
    ...spacing.helpers.paddingHorizontal('s'),
    minHeight: touchTargets.minimum,
    paddingVertical: spacing.s + 2,
  },
  inputText: {
    flex: 1,
    ...typography.body,
  },
  icon: {
    marginLeft: spacing.s,
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: radius.l,
    padding: spacing.l,
    maxHeight: Platform.OS === 'ios' ? '80%' : '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  modalTitle: {
    ...typography.h3,
  },
  closeButton: {
    padding: spacing.s,
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.l,
    paddingVertical: spacing.s,
  },
  pickerSection: {
    flex: 1,
    alignItems: 'center',
    minHeight: Platform.OS === 'ios' ? 220 : 180,
  },
  pickerLabel: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },

  picker: {
    width: '100%',
    height: 180,
  },
  pickerItem: {
    fontSize: 20,
    height: 44,
    textAlign: 'center',
  },
  pickerItemAndroid: {
    fontSize: 20,
    textAlign: 'center',
    height: 44,
  },
  androidPickerContainer: {
    position: 'relative',
    height: 180,
    justifyContent: 'center',
  },
  androidPickerButton: {
    borderWidth: 1,
    borderRadius: radius.m,
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  androidPickerText: {
    fontSize: 18,
    textAlign: 'center',
  },
  hiddenPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  doneButton: {
    padding: spacing.m,
    borderRadius: radius.m,
    alignItems: 'center',
  },
  doneButtonText: {
    ...typography.h4,
    fontWeight: '600',
  },
  // iOS Custom Wheel Picker Styles
  iosWheelContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.m,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
    pointerEvents: 'none',
  },
  iosWheelScrollView: {
    flex: 1,
  },
  iosWheelItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
  },
  iosWheelItemText: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 