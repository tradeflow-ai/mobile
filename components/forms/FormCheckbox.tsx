/**
 * TradeFlow Mobile App - FormCheckbox Component
 * 
 * A React Hook Form integrated checkbox component that extends the UI Checkbox
 * with form validation and error handling capabilities.
 */

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ViewStyle, TextStyle } from 'react-native';
import { Checkbox } from '@/components/ui/Checkbox';
import { BaseFormFieldProps } from './index';

interface FormCheckboxProps extends BaseFormFieldProps {
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  required?: boolean;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  rules,
  required = false,
  ...checkboxProps
}) => {
  const { control } = useFormContext();

  const validationRules = {
    required: required ? (rules?.required || `${checkboxProps.label || name} is required`) : undefined,
    ...rules,
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={validationRules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Checkbox
          {...checkboxProps}
          checked={value || false}
          onPress={(checked) => onChange(checked)}
          error={!!error}
        />
      )}
    />
  );
}; 