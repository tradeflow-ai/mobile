import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, ButtonProps } from '@/components/ui/Button';

interface FormButtonProps extends Omit<ButtonProps, 'onPress'> {
  onPress?: () => void;
  type?: 'submit' | 'button';
  disableOnInvalid?: boolean;
}

export const FormButton: React.FC<FormButtonProps> = ({
  onPress,
  type = 'button',
  disableOnInvalid = false,
  disabled = false,
  loading = false,
  ...buttonProps
}) => {
  const { handleSubmit, formState } = useFormContext();

  const handlePress = () => {
    if (type === 'submit') {
      handleSubmit(onPress || (() => {}))();
    } else {
      onPress?.();
    }
  };

  const isDisabled = disabled || 
    loading || 
    (type === 'submit' && formState.isSubmitting) ||
    (disableOnInvalid && !formState.isValid);

  const isLoading = loading || (type === 'submit' && formState.isSubmitting);

  return (
    <Button
      {...buttonProps}
      onPress={handlePress}
      disabled={isDisabled}
      loading={isLoading}
    />
  );
}; 