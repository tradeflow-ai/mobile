/**
 * TradeFlow Mobile App - Checkbox Component
 * 
 * A themeable checkbox component with support for labels, disabled states,
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
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, touchTargets, radius } from '@/constants/Theme';

export interface CheckboxProps {
  checked: boolean;
  onPress: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  error?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
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
      onPress(!checked);
    }
  };

  const getCheckboxStyle = (): ViewStyle => {
    const baseStyle = styles.checkbox;
    
    let sizeStyle: ViewStyle = {};
    switch (size) {
      case 'small':
        sizeStyle = styles.checkboxSmall;
        break;
      case 'large':
        sizeStyle = styles.checkboxLarge;
        break;
      default:
        sizeStyle = styles.checkboxMedium;
        break;
    }
    
    let checkboxStyle: ViewStyle = {
      borderColor: error 
        ? colors.error 
        : checked 
          ? colors.primary 
          : colors.border,
      backgroundColor: checked ? colors.primary : colors.background,
    };

    if (disabled) {
      checkboxStyle.borderColor = colors.disabled;
      checkboxStyle.backgroundColor = checked ? colors.disabled : colors.background;
    }

    return {
      ...baseStyle,
      ...sizeStyle,
      ...checkboxStyle,
    };
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 18;
      default:
        return 14;
    }
  };

  const getIconColor = (): string => {
    if (disabled) {
      return colors.placeholder;
    }
    return checked ? colors.background : 'transparent';
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
      <View style={getCheckboxStyle()}>
        {checked && (
          <FontAwesome
            name="check"
            size={getIconSize()}
            color={getIconColor()}
          />
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
  checkbox: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.s,
  },
  // Size variants
  checkboxSmall: {
    width: spacing.m,
    height: spacing.m,
  },
  checkboxMedium: {
    width: spacing.m + 4, // 20px
    height: spacing.m + 4, // 20px
  },
  checkboxLarge: {
    width: spacing.l,
    height: spacing.l,
  },
  label: {
    flex: 1,
    marginLeft: spacing.s,
  },
}); 