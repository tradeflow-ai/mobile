import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextInputProps } from 'react-native';
import { TextInput } from '@/components/ui/TextInput';
import { BaseFormFieldProps } from './index';

interface FormTextInputProps extends BaseFormFieldProps, Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur'> {
  label?: string;
  helperText?: string;
  required?: boolean;
  containerStyle?: any;
}

export const FormTextInput: React.FC<FormTextInputProps> = ({
  name,
  rules,
  required = false,
  ...textInputProps
}) => {
  const { control } = useFormContext();

  const validationRules = {
    required: required ? (rules?.required || `${textInputProps.label || name} is required`) : undefined,
    ...rules,
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={validationRules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <TextInput
          {...textInputProps}
          value={value || ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          required={required}
        />
      )}
    />
  );
}; 