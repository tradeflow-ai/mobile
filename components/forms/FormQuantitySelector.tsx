import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ViewStyle } from 'react-native';
import { QuantitySelector } from '@/components/QuantitySelector';
import { BaseFormFieldProps, FormValidationRules } from './index';

interface FormQuantitySelectorProps extends BaseFormFieldProps {
  placeholder?: string;
  style?: ViewStyle;
  disabled?: boolean;
  allowDecimals?: boolean;
  step?: number;
  min?: number;
  max?: number;
}

export const FormQuantitySelector: React.FC<FormQuantitySelectorProps> = ({
  name,
  rules,
  placeholder = '0',
  style,
  disabled = false,
  allowDecimals = false,
  step = 1,
  min = 0,
  max,
}) => {
  const { control } = useFormContext();

  const validationRules: FormValidationRules = {
    ...rules,
    validate: (value: string) => {
      const numValue = parseFloat(value) || 0;
      
      if (numValue < min) {
        return `Minimum value is ${min}`;
      }
      
      if (max !== undefined && numValue > max) {
        return `Maximum value is ${max}`;
      }
      
      if (rules?.validate) {
        return rules.validate(numValue);
      }
      
      return true;
    },
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={validationRules}
      render={({ field: { onChange, value } }) => {
        const handleIncrease = () => {
          const currentValue = parseFloat(value) || 0;
          const newValue = currentValue + step;
          const clampedValue = max !== undefined ? Math.min(newValue, max) : newValue;
          const formattedValue = allowDecimals ? clampedValue.toString() : Math.round(clampedValue).toString();
          onChange(formattedValue);
        };

        const handleDecrease = () => {
          const currentValue = parseFloat(value) || 0;
          const newValue = Math.max(min, currentValue - step);
          const formattedValue = allowDecimals ? newValue.toString() : Math.round(newValue).toString();
          onChange(formattedValue);
        };

        return (
          <QuantitySelector
            value={value || ''}
            onChangeText={onChange}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            placeholder={placeholder}
            style={style}
            disabled={disabled}
            allowDecimals={allowDecimals}
            step={step}
          />
        );
      }}
    />
  );
}; 