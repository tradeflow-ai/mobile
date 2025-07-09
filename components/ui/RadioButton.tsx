/**
 * TradeFlow Mobile App - RadioButton Component
 * 
 * A themeable radio button component with support for labels, disabled states,
 * and consistent styling with the rest of the design system.
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, touchTargets, radius } from '@/constants/Theme';

export interface RadioButtonProps {
  selected: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  error?: boolean;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onPress,
  label,
  disabled = false,
  size = 'medium',
  containerStyle,
  labelStyle,
  error = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  const getRadioButtonStyle = (): ViewStyle => {
    const baseStyle = styles.radioButton;
    
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = styles.radioButtonSmall;
        break;
      case 'large':
        sizeStyle = styles.radioButtonLarge;
        break;
      default:
        sizeStyle = styles.radioButtonMedium;
        break;
    }
    
    let radioButtonStyle: ViewStyle = {
      borderColor: error 
        ? colors.error 
        : selected 
          ? colors.primary 
          : colors.border,
      backgroundColor: colors.background,
    };

    if (disabled) {
      radioButtonStyle.borderColor = colors.disabled;
    }

    return {
      ...baseStyle,
      ...sizeStyle,
      ...radioButtonStyle,
    };
  };

  const getInnerCircleStyle = (): ViewStyle => {
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = styles.innerCircleSmall;
        break;
      case 'large':
        sizeStyle = styles.innerCircleLarge;
        break;
      default:
        sizeStyle = styles.innerCircleMedium;
        break;
    }

    return {
      ...styles.innerCircle,
      ...sizeStyle,
      backgroundColor: disabled ? colors.disabled : colors.primary,
    };
  };

  const getLabelStyle = (): TextStyle => {
    const baseStyle = size === 'small' ? typography.caption : typography.body;
    
    return {
      ...baseStyle,
      color: disabled ? colors.placeholder : error ? colors.error : colors.text,
      ...labelStyle,
    };
  };

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={getRadioButtonStyle()}>
        {selected && (
          <View style={getInnerCircleStyle()} />
        )}
      </View>
      {label && (
        <Text style={[styles.label, getLabelStyle()]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    ...touchTargets.styles.minimum,
  },
  radioButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  // Size variants for radio button
  radioButtonSmall: {
    width: spacing.m,
    height: spacing.m,
  },
  radioButtonMedium: {
    width: spacing.m + 4, // 20px
    height: spacing.m + 4, // 20px
  },
  radioButtonLarge: {
    width: spacing.l,
    height: spacing.l,
  },
  // Inner circle (selected indicator)
  innerCircle: {
    borderRadius: radius.full,
  },
  innerCircleSmall: {
    width: spacing.s,
    height: spacing.s,
  },
  innerCircleMedium: {
    width: spacing.s + 2, // 10px
    height: spacing.s + 2, // 10px
  },
  innerCircleLarge: {
    width: spacing.s + 4, // 12px
    height: spacing.s + 4, // 12px
  },
  label: {
    flex: 1,
    marginLeft: spacing.s,
  },
}); 