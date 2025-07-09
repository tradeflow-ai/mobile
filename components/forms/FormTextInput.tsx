import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { View, TextInputProps } from 'react-native';
import { spacing } from '@/constants/Theme';
import { TextInput, Label, ErrorMessage } from '@/components/ui';
import { BaseFormFieldProps } from './index';

interface FormTextInputProps extends BaseFormFieldProps, Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur'> {
  helperText?: string;
}

export const FormTextInput: React.FC<FormTextInputProps> = ({
  name,
  label,
  rules,
  required = false,
  ...textInputProps
}) => {
  const { control } = useFormContext();

  const validationRules = {
    required: required ? (rules?.required || `${label || name} is required`) : undefined,
    ...rules,
  };

  return (
    <View style={[{ marginBottom: spacing.m }]}>
      {label && <Label text={label} required={required} />}
      <Controller
        control={control}
        name={name}
        rules={validationRules}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <View>
            <TextInput
              {...textInputProps}
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
            <ErrorMessage message={error?.message} />
          </View>
        )}
      />
    </View>
  );
}; 