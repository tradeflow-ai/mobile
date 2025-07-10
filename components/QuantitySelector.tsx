import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { radius, touchTargets, spacing } from '@/constants/Theme';
import { TextInput } from '@/components/ui';

interface QuantitySelectorProps {
  value: number;
  onChangeText: (value: number) => void;
  onIncrease: () => void;
  onDecrease: () => void;
  placeholder?: string;
  style?: ViewStyle;
  disabled?: boolean;
  allowDecimals?: boolean;
  step?: number;
  min?: number;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChangeText,
  onIncrease,
  onDecrease,
  placeholder = '0',
  style,
  disabled = false,
  allowDecimals = false,
  step = 1,
  min = 0,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleTextChange = (text: string) => {
    if (allowDecimals) {
      // Allow decimal input
      if (text === '' || /^\d*\.?\d*$/.test(text)) {
        const numValue = parseFloat(text) || 0;
        onChangeText(numValue);
      }
    } else {
      // Only allow whole numbers
      if (text === '' || /^\d+$/.test(text)) {
        const numValue = parseInt(text) || 0;
        onChangeText(numValue);
      }
    }
  };

  const handleIncrease = () => {
    const currentValue = value || 0;
    const newValue = currentValue + step;
    const finalValue = allowDecimals ? newValue : Math.round(newValue);
    onChangeText(finalValue);
    onIncrease();
  };

  const handleDecrease = () => {
    const currentValue = value || 0;
    const newValue = Math.max(min, currentValue - step);
    const finalValue = allowDecimals ? newValue : Math.round(newValue);
    onChangeText(finalValue);
    onDecrease();
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: disabled ? colors.disabled : colors.card, 
            borderColor: disabled ? colors.disabled : colors.border 
          }
        ]}
        onPress={handleDecrease}
        disabled={disabled}
      >
        <FontAwesome 
          name="minus" 
          size={16} 
          color={disabled ? colors.placeholder : colors.text} 
        />
      </TouchableOpacity>
      
      <TextInput
        value={value.toString()}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        keyboardType={allowDecimals ? "decimal-pad" : "number-pad"}
        style={styles.input}
        containerStyle={styles.inputContainer}
        editable={!disabled}
      />
      
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: disabled ? colors.disabled : colors.card, 
            borderColor: disabled ? colors.disabled : colors.border 
          }
        ]}
        onPress={handleIncrease}
        disabled={disabled}
      >
        <FontAwesome 
          name="plus" 
          size={16} 
          color={disabled ? colors.placeholder : colors.text} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.m,
    // Match TextInput height with platform-specific padding and make buttons square
    ...Platform.select({
      ios: {
        paddingTop: spacing.s + 4,
        paddingBottom: spacing.s + 4,
        width: touchTargets.minimum + (spacing.s + 4) * 2, // 44 + 24 = 68px
      },
      android: {
        paddingVertical: spacing.s + 2,
        width: touchTargets.minimum + (spacing.s + 2) * 2, // 44 + 20 = 64px
      },
    }),
  },
  input: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 2,
    marginBottom: 0, // Override default margin from TextInput
  },
}); 