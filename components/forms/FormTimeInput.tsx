import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { ViewStyle } from 'react-native';
import { TimeInput } from '@/components/ui/TimeInput';
import { BaseFormFieldProps } from './index';

interface FormTimeInputProps extends BaseFormFieldProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
  format24Hour?: boolean;
}

export const FormTimeInput: React.FC<FormTimeInputProps> = ({
  name,
  rules,
  required = false,
  ...timeInputProps
}) => {
  const { control } = useFormContext();

  const validationRules = {
    required: required ? (rules?.required || `${timeInputProps.label || name} is required`) : undefined,
    ...rules,
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={validationRules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TimeInput
          {...timeInputProps}
          value={value || ''}
          onTimeChange={onChange}
          error={error?.message}
          required={required}
        />
      )}
    />
  );
}; 