import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { RadioButton } from '@/components/ui/RadioButton';
import { BaseFormFieldProps } from './index';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing } from '@/constants/Theme';

interface RadioOption {
  label: string;
  value: string;
}

interface FormRadioGroupProps extends BaseFormFieldProps {
  label?: string;
  options: RadioOption[];
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
  required?: boolean;
  helperText?: string;
}

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  name,
  rules,
  required = false,
  label,
  options,
  disabled = false,
  size = 'medium',
  containerStyle,
  helperText,
}) => {
  const { control } = useFormContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const validationRules = {
    required: required ? (rules?.required || `${label || name} is required`) : undefined,
    ...rules,
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={validationRules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={[styles.container, containerStyle]}>
          {label && (
            <Text style={[styles.label, { color: colors.text }]}>
              {label}
              {required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
            </Text>
          )}
          
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <RadioButton
                key={option.value}
                selected={value === option.value}
                onPress={() => onChange(option.value)}
                label={option.label}
                disabled={disabled}
                size={size}
                error={!!error}
                containerStyle={styles.radioOption}
              />
            ))}
          </View>
          
          {error && <Text style={[styles.errorText, { color: colors.error }]}>{error.message}</Text>}
          {helperText && !error && (
            <Text style={[styles.helperText, { color: colors.placeholder }]}>{helperText}</Text>
          )}
        </View>
      )}
    />
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
  optionsContainer: {
    marginTop: spacing.xs,
  },
  radioOption: {
    marginBottom: spacing.s,
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