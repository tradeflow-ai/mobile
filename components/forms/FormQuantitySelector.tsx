import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { View, ViewStyle } from 'react-native';
import { spacing } from '@/constants/Theme';
import { QuantitySelector } from '@/components/QuantitySelector';
import { Label, ErrorMessage } from '@/components/ui';
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
  label,
  rules,
  required = false,
  placeholder = '0',
  style,
  disabled = false,
  allowDecimals = false,
  step = 1,
  min = 0,
  max,
}) => {
  const { control } = useFormContext();

  const validationRules = {
    required: required ? (rules?.required || `${label || name} is required`) : undefined,
    ...rules,
    validate: (value: number) => {
      const numValue = value || 0;
      
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
    <View style={[{ marginBottom: spacing.m }, style]}>
      {label && <Label text={label} required={required} />}
      <Controller
        control={control}
        name={name}
        rules={validationRules}
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          const handleValueChange = (newValue: number) => {
            // Apply min/max constraints
            let constrainedValue = newValue;
            if (constrainedValue < min) {
              constrainedValue = min;
            }
            if (max !== undefined && constrainedValue > max) {
              constrainedValue = max;
            }
            
            // Apply decimal/integer constraint
            const finalValue = allowDecimals ? constrainedValue : Math.round(constrainedValue);
            onChange(finalValue);
          };

          return (
            <View>
              <QuantitySelector
                value={value || 0}
                onChangeText={handleValueChange}
                onIncrease={() => {}} // Empty handlers since QuantitySelector handles internally
                onDecrease={() => {}} // Empty handlers since QuantitySelector handles internally
                placeholder={placeholder}
                disabled={disabled}
                allowDecimals={allowDecimals}
                step={step}
              />
              <ErrorMessage message={error?.message} />
            </View>
          );
        }}
      />
    </View>
  );
}; 