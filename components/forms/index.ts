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
}

export interface SelectOption {
  label: string;
  value: string;
}

// Form components
export { FormProvider } from './FormProvider';
export { FormTextInput } from './FormTextInput';
export { FormButton } from './FormButton';
export { FormQuantitySelector } from './FormQuantitySelector';
export { FormSelect } from './FormSelect'; 