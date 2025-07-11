/**
 * Onboarding Service - User Onboarding Flow Management
 * 
 * This service handles the complete onboarding workflow including preferences storage,
 * step progression, validation, and configuration management.
 */

import { supabase } from './supabase';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface WorkScheduleData {
  workDays: string[];
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakStartTime: string;
  breakEndTime: string;
}

export interface TimeBuffersData {
  travelBufferMinutes: number;
  jobBufferMinutes: number;
  enableSmartBuffers: boolean;
}

export interface SuppliersData {
  preferredSuppliers: string[];
  priorityOrder: Array<{
    id: string;
    label: string;
    priority: number;
  }>;
}

export interface OnboardingPreferences {
  id: string;
  user_id: string;
  current_step: string;
  is_completed: boolean;
  completion_score: number;
  
  // Preferences Data
  work_schedule: WorkScheduleData;
  time_buffers: TimeBuffersData;
  suppliers: SuppliersData;
  
  // Timestamps
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StepDefinition {
  title: string;
  description: string;
  required: boolean;
  order: number;
  fields: Record<string, any>;
}

export interface FlowConfiguration {
  completion_threshold: number;
  allow_skip: boolean;
  redirect_on_completion: string;
  save_partial_progress: boolean;
  scoring: {
    'work-schedule': number;
    'time-buffers': number;
    'suppliers': number;
    bonus: number;
  };
}

export interface OnboardingConfiguration {
  id: string;
  config_name: string;
  config_version: string;
  is_active: boolean;
  step_definitions: Record<string, StepDefinition>;
  flow_configuration: FlowConfiguration;
  feature_flags: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  completeness_score: number;
}

// ===========================================
// ONBOARDING SERVICE
// ===========================================

export class OnboardingService {
  /**
   * Get onboarding configuration
   */
  static async getOnboardingConfiguration(): Promise<{ data: OnboardingConfiguration | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_configurations')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting onboarding configuration:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user onboarding preferences
   */
  static async getUserOnboardingPreferences(userId: string): Promise<{ data: OnboardingPreferences | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { data: data || null, error: null };
    } catch (error) {
      console.error('Error getting user onboarding preferences:', error);
      return { data: null, error };
    }
  }

  /**
   * Initialize onboarding for a user
   */
  static async initializeOnboarding(userId: string): Promise<{ data: OnboardingPreferences | null; error: any }> {
    try {
      // Check if already exists
      const { data: existing } = await this.getUserOnboardingPreferences(userId);
      if (existing) return { data: existing, error: null };

      // Create new onboarding preferences
      const { data, error } = await supabase
        .from('onboarding_preferences')
        .insert({
          user_id: userId,
          current_step: 'work-schedule',
          is_completed: false,
          completion_score: 0,
          work_schedule: {},
          time_buffers: {},
          suppliers: {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      return { data: null, error };
    }
  }

  /**
   * Update onboarding preferences for a step
   */
  static async updateOnboardingPreferences(
    userId: string,
    stepName: 'work-schedule' | 'time-buffers' | 'suppliers',
    stepData: WorkScheduleData | TimeBuffersData | SuppliersData,
    completed: boolean = false
  ): Promise<{ data: OnboardingPreferences | null; error: any }> {
    try {
      const { data: current } = await this.getUserOnboardingPreferences(userId);
      if (!current) throw new Error('Onboarding preferences not found');

      // Validate step data
      const validation = await this.validateStepData(stepName, stepData);
      if (!validation.valid) {
        return { data: null, error: { message: 'Validation failed', details: validation.errors } };
      }

      // Calculate completion score
      const { score, isFullyCompleted } = await this.calculateCompletionScore(userId, {
        [stepName]: stepData,
      });

      const nextStep = isFullyCompleted ? 'completed' : this.getNextStep(stepName);

      const updateData = {
        [stepName]: stepData,
        completion_score: score,
        current_step: nextStep,
        ...(isFullyCompleted && {
          is_completed: true,
          completed_at: new Date().toISOString(),
        }),
      };

      const { data, error } = await supabase
        .from('onboarding_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating onboarding preferences:', error);
      return { data: null, error };
    }
  }

  /**
   * Skip a step with reason
   */
  static async skipStep(
    userId: string,
    stepName: 'work-schedule' | 'time-buffers' | 'suppliers',
    reason: string
  ): Promise<{ data: OnboardingPreferences | null; error: any }> {
    try {
      const { data: current } = await this.getUserOnboardingPreferences(userId);
      if (!current) throw new Error('Onboarding preferences not found');

      const nextStep = this.getNextStep(stepName);
      const { score, isFullyCompleted } = await this.calculateCompletionScore(userId, current);

      const updateData = {
        current_step: isFullyCompleted ? 'completed' : nextStep,
        completion_score: score,
        ...(isFullyCompleted && {
          is_completed: true,
          completed_at: new Date().toISOString(),
        }),
      };

      const { data, error } = await supabase
        .from('onboarding_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error skipping step:', error);
      return { data: null, error };
    }
  }

  /**
   * Validate step data
   */
  static async validateStepData(
    stepName: 'work-schedule' | 'time-buffers' | 'suppliers',
    stepData: WorkScheduleData | TimeBuffersData | SuppliersData
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      let completeness_score = 0;

      switch (stepName) {
        case 'work-schedule':
          const workData = stepData as WorkScheduleData;
          
          // Required validations
          if (!workData.workDays || workData.workDays.length === 0) {
            errors.push('At least one work day must be selected');
          } else {
            completeness_score += 25;
          }

          if (!workData.startTime) {
            errors.push('Start time is required');
          } else {
            completeness_score += 25;
          }

          if (!workData.endTime) {
            errors.push('End time is required');
          } else {
            completeness_score += 25;
          }

          // Break validation
          if (workData.hasBreak) {
            if (!workData.breakStartTime || !workData.breakEndTime) {
              errors.push('Break start and end times are required when break is enabled');
            } else {
              completeness_score += 25;
            }
          } else {
            completeness_score += 25;
          }

          // Warnings
          if (workData.workDays && workData.workDays.length > 6) {
            warnings.push('Working 7 days a week may lead to burnout');
          }

          break;

        case 'time-buffers':
          const bufferData = stepData as TimeBuffersData;
          
          if (bufferData.travelBufferMinutes === undefined || bufferData.travelBufferMinutes < 0) {
            errors.push('Travel buffer must be 0 or greater');
          } else {
            completeness_score += 50;
          }

          if (bufferData.jobBufferMinutes === undefined || bufferData.jobBufferMinutes < 0) {
            errors.push('Job buffer must be 0 or greater');
          } else {
            completeness_score += 50;
          }

          // Warnings
          if (bufferData.travelBufferMinutes > 60) {
            warnings.push('Travel buffer over 60 minutes may be excessive');
          }

          if (bufferData.jobBufferMinutes > 120) {
            warnings.push('Job buffer over 2 hours may be excessive');
          }

          break;

        case 'suppliers':
          const supplierData = stepData as SuppliersData;
          
          if (!supplierData.preferredSuppliers || supplierData.preferredSuppliers.length === 0) {
            errors.push('At least one preferred supplier must be selected');
          } else {
            completeness_score += 60;
          }

          if (!supplierData.priorityOrder || supplierData.priorityOrder.length === 0) {
            errors.push('Priority order must be configured');
          } else {
            completeness_score += 40;
          }

          break;
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        completeness_score: Math.min(completeness_score, 100),
      };
    } catch (error) {
      console.error('Error validating step data:', error);
      return {
        valid: false,
        errors: ['Validation error occurred'],
        warnings: [],
        completeness_score: 0,
      };
    }
  }

  /**
   * Calculate completion score based on current progress
   */
  static async calculateCompletionScore(
    userId: string,
    overrides: Partial<OnboardingPreferences> = {}
  ): Promise<{ score: number; isFullyCompleted: boolean }> {
    try {
      // Get configuration for scoring
      const { data: config } = await this.getOnboardingConfiguration();
      if (!config) return { score: 0, isFullyCompleted: false };

      const { data: current } = await this.getUserOnboardingPreferences(userId);
      if (!current) return { score: 0, isFullyCompleted: false };

      // Apply overrides
      const preferences = { ...current, ...overrides };

      let totalScore = 0;
      const scoring = config.flow_configuration.scoring;

      // Calculate score for each step
      if (preferences.work_schedule && Object.keys(preferences.work_schedule).length > 0) {
        totalScore += scoring['work-schedule'];
      }

      if (preferences.time_buffers && Object.keys(preferences.time_buffers).length > 0) {
        totalScore += scoring['time-buffers'];
      }

      if (preferences.suppliers && Object.keys(preferences.suppliers).length > 0) {
        totalScore += scoring.suppliers;
      }

      // Bonus for completion
      const allStepsCompleted = 
        preferences.work_schedule && Object.keys(preferences.work_schedule).length > 0 &&
        preferences.time_buffers && Object.keys(preferences.time_buffers).length > 0 &&
        preferences.suppliers && Object.keys(preferences.suppliers).length > 0;

      if (allStepsCompleted) {
        totalScore += scoring.bonus;
      }

      const isFullyCompleted = totalScore >= config.flow_configuration.completion_threshold;

      return { score: Math.min(totalScore, 100), isFullyCompleted };
    } catch (error) {
      console.error('Error calculating completion score:', error);
      return { score: 0, isFullyCompleted: false };
    }
  }

  /**
   * Get onboarding status for user
   */
  static async getOnboardingStatus(userId: string): Promise<{
    data: {
      preferences: OnboardingPreferences | null;
      configuration: OnboardingConfiguration | null;
      completionScore: number;
      isCompleted: boolean;
      nextStep: string | null;
    } | null;
    error: any;
  }> {
    try {
      const [preferencesResult, configResult] = await Promise.all([
        this.getUserOnboardingPreferences(userId),
        this.getOnboardingConfiguration(),
      ]);

      if (preferencesResult.error || configResult.error) {
        throw preferencesResult.error || configResult.error;
      }

      const preferences = preferencesResult.data;
      const configuration = configResult.data;

      if (!preferences) {
        // No preferences yet - return initial state
        return {
          data: {
            preferences: null,
            configuration,
            completionScore: 0,
            isCompleted: false,
            nextStep: 'work-schedule',
          },
          error: null,
        };
      }

      // Check for legacy completion
      const { isCompleted: legacyCompleted, completionScore: legacyScore } = 
        await this.checkLegacyOnboardingCompletion(userId);

      const completionScore = preferences.completion_score || legacyScore;
      const isCompleted = preferences.is_completed || legacyCompleted;
      const nextStep = isCompleted ? null : preferences.current_step;

      return {
        data: {
          preferences,
          configuration,
          completionScore,
          isCompleted,
          nextStep,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user has completed onboarding via legacy system
   */
  private static async checkLegacyOnboardingCompletion(userId: string): Promise<{
    isCompleted: boolean;
    completionScore: number;
  }> {
    try {
      // Check if user has profile preferences that indicate completion
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (!profile?.preferences) {
        return { isCompleted: false, completionScore: 0 };
      }

      const prefs = profile.preferences;
      let score = 0;

      // Check for work schedule completion
      if (prefs.work_schedule && Object.keys(prefs.work_schedule).length > 0) {
        score += 40;
      }

      // Check for time buffers completion
      if (prefs.travel_time_buffers && Object.keys(prefs.travel_time_buffers).length > 0) {
        score += 30;
      }

      // Check for supplier preferences completion
      if (prefs.suppliers && Object.keys(prefs.suppliers).length > 0) {
        score += 30;
      }

      const isCompleted = score >= 75; // 75% threshold

      return { isCompleted, completionScore: score };
    } catch (error) {
      console.error('Error checking legacy onboarding completion:', error);
      return { isCompleted: false, completionScore: 0 };
    }
  }

  private static getNextStep(currentStep: string): 'work-schedule' | 'time-buffers' | 'suppliers' | 'completed' {
    switch (currentStep) {
      case 'work-schedule':
        return 'time-buffers';
      case 'time-buffers':
        return 'suppliers';
      case 'suppliers':
        return 'completed';
      default:
        return 'work-schedule';
    }
  }

  /**
   * Reset onboarding progress for user
   */
  static async resetOnboarding(userId: string): Promise<{ error: any }> {
    try {
      // Delete onboarding preferences
      await supabase.from('onboarding_preferences').delete().eq('user_id', userId);

      return { error: null };
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      return { error };
    }
  }
} 