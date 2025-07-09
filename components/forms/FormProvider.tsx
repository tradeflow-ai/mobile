import React from 'react';
import { FormProvider as RHFormProvider, UseFormReturn } from 'react-hook-form';

interface FormProviderProps<T extends Record<string, any>> {
  methods: UseFormReturn<T>;
  children: React.ReactNode;
}

export function FormProvider<T extends Record<string, any>>({
  methods,
  children,
}: FormProviderProps<T>) {
  return (
    <RHFormProvider {...methods}>
      {children}
    </RHFormProvider>
  );
} 