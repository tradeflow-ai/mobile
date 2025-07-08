import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, touchTargets, radius } from '@/constants/Theme';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const TextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  required = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getInputStyle = () => {
    return [
      styles.input,
      {
        borderColor: error ? colors.error : isFocused ? colors.primary : colors.border,
        backgroundColor: colors.background,
        color: colors.text,
      },
      props.style,
    ];
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
        </Text>
      )}
      <RNTextInput
        {...props}
        style={getInputStyle()}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={colors.placeholder}
      />
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      {helperText && !error && (
        <Text style={[styles.helperText, { color: colors.placeholder }]}>{helperText}</Text>
      )}
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
    borderWidth: 1,
    borderRadius: radius.m,
    ...spacing.helpers.paddingHorizontal('s'),
    fontSize: typography.sizes.caption, // Use smaller font size for inputs
    fontWeight: typography.weights.normal,
    minHeight: touchTargets.minimum,
    // Platform-specific text alignment and padding
    ...Platform.select({
      ios: {
        paddingTop: spacing.s + 4, // More top padding for iOS
        paddingBottom: spacing.s + 4, // Equal bottom padding for iOS
        textAlignVertical: 'center',
        lineHeight: typography.sizes.caption * 1.2, // Tighter line height for better centering
      },
      android: {
        paddingVertical: spacing.s + 2,
        textAlignVertical: 'center',
        lineHeight: typography.sizes.caption * 1.3, // Slightly more line height for Android
      },
    }),
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
}); 