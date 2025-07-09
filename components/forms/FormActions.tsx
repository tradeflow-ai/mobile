import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FormButton } from './FormButton';

interface FormActionsProps {
  onSubmit: () => void;
  onCancel: () => void;
  submitTitle?: string;
  cancelTitle?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
  submitButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSubmit,
  onCancel,
  submitTitle = 'Save',
  cancelTitle = 'Cancel',
  isSubmitting = false,
  disabled = false,
  submitButtonVariant = 'primary',
}) => {
  return (
    <View style={styles.container}>
      <FormButton
        title={submitTitle}
        type="submit"
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={disabled}
        variant={submitButtonVariant}
        style={styles.submitButton}
      />
      
      <FormButton
        title={cancelTitle}
        onPress={onCancel}
        variant="outline"
        disabled={disabled || isSubmitting}
        style={styles.cancelButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 32,
  },
  submitButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 8,
  },
}); 