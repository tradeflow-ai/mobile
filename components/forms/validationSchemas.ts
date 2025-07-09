/**
 * TradeFlow Mobile App - Form Validation Schemas
 * 
 * Zod validation schemas for authentication and onboarding forms.
 * These schemas provide type-safe validation for all form inputs.
 */

import { z } from 'zod';

// Common validation patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

const timeSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format');

const time12HourSchema = z
  .string()
  .regex(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, 'Please enter a valid time in HH:MM AM/PM format');

// Authentication Schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Onboarding Schemas
export const workScheduleSchema = z.object({
  workDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
    .min(1, 'Please select at least one work day'),
  startTime: time12HourSchema,
  endTime: time12HourSchema,
  breakStartTime: time12HourSchema.optional(),
  breakEndTime: time12HourSchema.optional(),
  hasBreak: z.boolean().default(false),
}).refine((data) => {
  if (data.hasBreak && (!data.breakStartTime || !data.breakEndTime)) {
    return false;
  }
  return true;
}, {
  message: 'Break times are required when break is enabled',
  path: ['hasBreak'],
});

export const timeBuffersSchema = z.object({
  travelBufferMinutes: z.number().min(0, 'Travel buffer must be 0 or greater').max(120, 'Travel buffer must be 120 minutes or less'),
  jobBufferMinutes: z.number().min(0, 'Job buffer must be 0 or greater').max(120, 'Job buffer must be 120 minutes or less'),
  enableSmartBuffers: z.boolean().default(true),
});



export const supplierPreferencesSchema = z.object({
  preferredSuppliers: z.array(z.string()).min(1, 'Please select at least one supplier'),
  priorityOrder: z.array(z.object({
    id: z.string(),
    label: z.string(),
    priority: z.number(),
  })).length(3, 'Priority order must contain exactly 3 items'),
});

// Combined onboarding schema
export const onboardingSchema = z.object({
  workSchedule: workScheduleSchema,
  timeBuffers: timeBuffersSchema,
  supplierPreferences: supplierPreferencesSchema,
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type WorkScheduleFormData = z.infer<typeof workScheduleSchema>;
export type TimeBuffersFormData = z.infer<typeof timeBuffersSchema>;

export type SupplierPreferencesFormData = z.infer<typeof supplierPreferencesSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Validation helper functions
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => err.message) 
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

export const getFieldError = (errors: z.ZodError, fieldName: string): string | undefined => {
  const error = errors.errors.find(err => err.path.includes(fieldName));
  return error?.message;
}; 