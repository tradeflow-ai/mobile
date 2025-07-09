import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, touchTargets, radius } from '@/constants/Theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[size];
    
    let variantStyle: ViewStyle = {};
    
    switch (variant) {
      case 'primary':
        variantStyle = {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          ...shadows.medium(colorScheme),
        };
        break;
      case 'secondary':
        variantStyle = {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
          ...shadows.subtle(colorScheme),
        };
        break;
      case 'outline':
        variantStyle = {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 1,
        };
        break;
      case 'ghost':
        variantStyle = {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
        break;
    }

    if (disabled) {
      variantStyle.backgroundColor = colors.disabled;
      variantStyle.borderColor = colors.disabled;
      // Remove shadows for disabled state
      variantStyle.shadowOpacity = 0;
      variantStyle.elevation = 0;
    }

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    let textColor = colors.background; // white/black based on theme
    
    switch (variant) {
      case 'outline':
      case 'ghost':
        textColor = colors.primary;
        break;
      default:
        textColor = colors.background;
    }

    if (disabled) {
      textColor = colors.placeholder;
    }

    return {
      ...typography.button,
      ...styles[`${size}Text`],
      color: textColor,
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextStyle().color} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...touchTargets.styles.minimum,
  },
  // Size variants using theme spacing
  small: {
    ...spacing.helpers.paddingHorizontal('s'),
    paddingVertical: spacing.xs + 2, // 6px
    minHeight: touchTargets.minimum * 0.8, // 35px
  },
  medium: {
    ...spacing.helpers.paddingHorizontal('m'),
    paddingVertical: spacing.s + 2, // 10px
    minHeight: touchTargets.minimum, // 44px
  },
  large: {
    ...spacing.helpers.paddingHorizontal('l'),
    paddingVertical: spacing.m - 2, // 14px
    minHeight: touchTargets.comfortable, // 48px
  },
  // Text size variants using theme typography
  smallText: {
    fontSize: typography.sizes.caption,
  },
  mediumText: {
    fontSize: typography.sizes.button,
  },
  largeText: {
    fontSize: typography.sizes.h4,
  },
}); 