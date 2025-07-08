import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { TextInput } from '@/components/ui';

interface QuantitySelectorProps {
  value: string;
  onChangeText: (text: string) => void;
  onIncrease: () => void;
  onDecrease: () => void;
  placeholder?: string;
  style?: ViewStyle;
  disabled?: boolean;
  allowDecimals?: boolean;
  step?: number;
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
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleTextChange = (text: string) => {
    if (allowDecimals) {
      // Allow decimal input
      if (text === '' || /^\d*\.?\d*$/.test(text)) {
        onChangeText(text);
      }
    } else {
      // Only allow whole numbers
      if (text === '' || /^\d+$/.test(text)) {
        onChangeText(text);
      }
    }
  };

  const handleIncrease = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue + step;
    const formattedValue = allowDecimals ? newValue.toString() : Math.round(newValue).toString();
    onChangeText(formattedValue);
    onIncrease();
  };

  const handleDecrease = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = Math.max(0, currentValue - step);
    const formattedValue = allowDecimals ? newValue.toString() : Math.round(newValue).toString();
    onChangeText(formattedValue);
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
        value={value}
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
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