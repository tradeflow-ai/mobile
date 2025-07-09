/**
 * TradeFlow Mobile App - TimeInput Component
 * 
 * A themeable time input component with picker dropdowns for time selection,
 * labels, disabled states, and consistent styling with the rest of the design system.
 * Supports both 12-hour and 24-hour formats with intuitive picker interface.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Modal,
  Platform,
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
              <Picker
                key={`hour-${timeComponents.hour}`}
                selectedValue={timeComponents.hour}
                style={styles.picker}
                itemStyle={styles.pickerItem}
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
            </View>

            {/* Minute Picker */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Minute</Text>
              <Picker
                key={`minute-${timeComponents.minute}`}
                selectedValue={timeComponents.minute}
                style={styles.picker}
                itemStyle={styles.pickerItem}
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
            </View>

            {/* AM/PM Picker (only for 12-hour format) */}
            {!format24Hour && (
                             <View style={styles.pickerSection}>
                 <Text style={[styles.pickerLabel, { color: colors.text }]}>Period</Text>
                 
                 {Platform.OS === 'android' ? (
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
                     itemStyle={styles.pickerItem}
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
    maxHeight: '70%',
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
    paddingVertical: spacing.m,
  },
  pickerSection: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },

  picker: {
    width: '100%',
    height: 160,
  },
  pickerItem: {
    fontSize: 18,
    textAlign: 'center',
    height: 50,
  },
  pickerItemAndroid: {
    fontSize: 18,
    textAlign: 'center',
    height: 50,
    color: '#000000',
  },
  androidPickerContainer: {
    position: 'relative',
    height: 160,
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
}); 