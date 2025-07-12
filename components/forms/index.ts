// Shared form interfaces
export interface FormValidationRules {
  required?: boolean | string;
  pattern?: { value: RegExp; message: string };
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  validate?: (value: any) => boolean | string;
}

export interface BaseFormFieldProps {
  name: string;
  rules?: FormValidationRules;
  label?: string;
  required?: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
}

// Form components
export { FormProvider } from './FormProvider';
export { FormTextInput } from './FormTextInput';
export { FormQuantitySelector } from './FormQuantitySelector';
export { FormSelect } from './FormSelect';
export { FormCheckbox } from './FormCheckbox';
export { FormTimeInput } from './FormTimeInput';
export { FormRadioGroup } from './FormRadioGroup';
export { FormLocationPicker } from './FormLocationPicker';

// Validation schemas
export * from './validationSchemas'; 
export { FormActions } from './FormActions'; 