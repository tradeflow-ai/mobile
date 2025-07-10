/**
 * Onboarding Service - User Onboarding Configuration and Progress Tracking
 * 
 * This service manages user onboarding flow configuration, progress tracking,
 * analytics collection, and completion scoring for the TradeFlow app.
 */

import { supabase } from './supabase';

// =====================================================
// TYPESCRIPT INTERFACES
// =====================================================

// Onboarding step data interfaces
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

// Onboarding preferences interface
export interface OnboardingPreferences {
  id: string;
  user_id: string;
  is_completed: boolean;
  completion_score: number;
  current_step: 'work-schedule' | 'time-buffers' | 'suppliers' | 'completed';
  steps_completed: string[];
  
  // Step data
  work_schedule_data: WorkScheduleData;
  work_schedule_completed: boolean;
  work_schedule_completed_at?: string;
  
  time_buffers_data: TimeBuffersData;
  time_buffers_completed: boolean;
  time_buffers_completed_at?: string;
  
  suppliers_data: SuppliersData;
  suppliers_completed: boolean;
  suppliers_completed_at?: string;
  
  // Metadata
  started_at: string;
  completed_at?: string;
  last_accessed_at: string;
  onboarding_version: string;
  skip_reasons: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// Analytics event interface
export interface OnboardingAnalyticsEvent {
  user_id: string;
  event_type: 'onboarding_started' | 'step_started' | 'step_completed' | 'step_skipped' | 'onboarding_completed' | 'onboarding_abandoned';
  step_name?: 'work-schedule' | 'time-buffers' | 'suppliers';
  event_timestamp?: string;
  time_spent_seconds?: number;
  user_agent?: string;
  platform?: 'ios' | 'android' | 'web';
  onboarding_version?: string;
  form_data?: Record<string, any>;
  validation_errors?: Record<string, any>;
  session_id?: string;
  previous_step?: string;
  next_step?: string;
}

// Configuration interfaces
export interface StepDefinition {
  title: string;
  description: string;
  required: boolean;
  order: number;
  points: number;
  default_values: Record<string, any>;
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

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  completeness_score: number;
}

// =====================================================
// ONBOARDING SERVICE CLASS
// =====================================================

export class OnboardingService {
  
  /**
   * Get active onboarding configuration
   */
  static async getOnboardingConfiguration(): Promise<{ data: OnboardingConfiguration | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_configurations')
        .select('*')
        .eq('is_active', true)
        .eq('config_name', 'default')
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

      if (error && error.code === 'PGRST116') {
        // No preferences found, return null (not an error)
        return { data: null, error: null };
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting user onboarding preferences:', error);
      return { data: null, error };
    }
  }

  /**
   * Initialize onboarding for a new user
   */
  static async initializeOnboarding(userId: string): Promise<{ data: OnboardingPreferences | null; error: any }> {
    try {
      // Get default configuration
      const { data: config, error: configError } = await this.getOnboardingConfiguration();
      if (configError) throw configError;

      const initialData = {
        user_id: userId,
        is_completed: false,
        completion_score: 0,
        current_step: 'work-schedule' as const,
        steps_completed: [],
        work_schedule_data: config?.step_definitions?.['work-schedule']?.default_values || {},
        work_schedule_completed: false,
        time_buffers_data: config?.step_definitions?.['time-buffers']?.default_values || {},
        time_buffers_completed: false,
        suppliers_data: config?.step_definitions?.['suppliers']?.default_values || {},
        suppliers_completed: false,
        started_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        onboarding_version: config?.config_version || '1.0',
        skip_reasons: {},
      };

      const { data, error } = await supabase
        .from('onboarding_preferences')
        .upsert([initialData], { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      // Track onboarding started event
      await this.trackOnboardingProgress({
        user_id: userId,
        event_type: 'onboarding_started',
        onboarding_version: config?.config_version || '1.0',
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      return { data: null, error };
    }
  }

  /**
   * Update onboarding preferences for a specific step
   */
  static async updateOnboardingPreferences(
    userId: string,
    stepName: 'work-schedule' | 'time-buffers' | 'suppliers',
    stepData: WorkScheduleData | TimeBuffersData | SuppliersData,
    completed: boolean = false
  ): Promise<{ data: OnboardingPreferences | null; error: any }> {
    try {
      // Get current preferences
      let { data: current } = await this.getUserOnboardingPreferences(userId);
      
      // Initialize if doesn't exist
      if (!current) {
        const { data: initialized } = await this.initializeOnboarding(userId);
        current = initialized;
      }

      if (!current) throw new Error('Failed to initialize onboarding preferences');

      // Prepare update data
      const updateData: any = {
        last_accessed_at: new Date().toISOString(),
      };

      // Update step-specific data
      switch (stepName) {
        case 'work-schedule':
          updateData.work_schedule_data = stepData;
          updateData.work_schedule_completed = completed;
          if (completed) {
            updateData.work_schedule_completed_at = new Date().toISOString();
          }
          break;
        case 'time-buffers':
          updateData.time_buffers_data = stepData;
          updateData.time_buffers_completed = completed;
          if (completed) {
            updateData.time_buffers_completed_at = new Date().toISOString();
          }
          break;
        case 'suppliers':
          updateData.suppliers_data = stepData;
          updateData.suppliers_completed = completed;
          if (completed) {
            updateData.suppliers_completed_at = new Date().toISOString();
          }
          break;
      }

      // Update steps completed array
      if (completed && !current.steps_completed.includes(stepName)) {
        updateData.steps_completed = [...current.steps_completed, stepName];
      }

      // Calculate completion score
      const { score, isFullyCompleted } = await this.calculateCompletionScore(userId, updateData);
      updateData.completion_score = score;

      if (isFullyCompleted) {
        updateData.is_completed = true;
        updateData.completed_at = new Date().toISOString();
        updateData.current_step = 'completed';
      } else {
        // Update current step to next step
        const nextStep = this.getNextStep(stepName);
        if (nextStep) {
          updateData.current_step = nextStep;
        }
      }

      // Update in database
      const { data, error } = await supabase
        .from('onboarding_preferences')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Track analytics event
      await this.trackOnboardingProgress({
        user_id: userId,
        event_type: completed ? 'step_completed' : 'step_started',
        step_name: stepName,
        form_data: stepData,
        onboarding_version: current.onboarding_version,
      });

      // Track completion if fully completed
      if (isFullyCompleted) {
        await this.trackOnboardingProgress({
          user_id: userId,
          event_type: 'onboarding_completed',
          onboarding_version: current.onboarding_version,
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating onboarding preferences:', error);
      return { data: null, error };
    }
  }

  /**
   * Track onboarding progress analytics
   */
  static async trackOnboardingProgress(event: OnboardingAnalyticsEvent): Promise<{ error: any }> {
    try {
      const analyticsData = {
        ...event,
        event_timestamp: event.event_timestamp || new Date().toISOString(),
        onboarding_version: event.onboarding_version || '1.0',
      };

      const { error } = await supabase
        .from('onboarding_analytics')
        .insert([analyticsData]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error tracking onboarding progress:', error);
      return { error };
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

      const skipReasons = { ...current.skip_reasons, [stepName]: reason };
      const stepsCompleted = [...current.steps_completed];
      if (!stepsCompleted.includes(stepName)) {
        stepsCompleted.push(stepName);
      }

      const nextStep = this.getNextStep(stepName);
      const { score, isFullyCompleted } = await this.calculateCompletionScore(userId, {
        steps_completed: stepsCompleted,
        skip_reasons: skipReasons,
      });

      const updateData = {
        skip_reasons: skipReasons,
        steps_completed: stepsCompleted,
        completion_score: score,
        current_step: isFullyCompleted ? 'completed' : nextStep,
        last_accessed_at: new Date().toISOString(),
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

      // Track skip event
      await this.trackOnboardingProgress({
        user_id: userId,
        event_type: 'step_skipped',
        step_name: stepName,
        form_data: { skip_reason: reason },
        onboarding_version: current.onboarding_version,
      });

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
      if (!config) throw new Error('Configuration not found');

      // Get current preferences
      const { data: current } = await this.getUserOnboardingPreferences(userId);
      if (!current) return { score: 0, isFullyCompleted: false };

      // Merge with overrides
      const preferences = { ...current, ...overrides };

      const scoring = config.flow_configuration.scoring;
      let totalScore = 0;

      // Calculate score for each step
      if (preferences.work_schedule_completed || preferences.steps_completed.includes('work-schedule')) {
        totalScore += scoring['work-schedule'];
      }

      if (preferences.time_buffers_completed || preferences.steps_completed.includes('time-buffers')) {
        totalScore += scoring['time-buffers'];
      }

      if (preferences.suppliers_completed || preferences.steps_completed.includes('suppliers')) {
        totalScore += scoring['suppliers'];
      }

      // Bonus points for completing all steps without skipping
      const allStepsCompleted = preferences.steps_completed.includes('work-schedule') &&
                               preferences.steps_completed.includes('time-buffers') &&
                               preferences.steps_completed.includes('suppliers');

      const noStepsSkipped = Object.keys(preferences.skip_reasons || {}).length === 0;

      if (allStepsCompleted && noStepsSkipped) {
        totalScore += scoring.bonus;
      }

      const isFullyCompleted = totalScore >= config.flow_configuration.completion_threshold;

      return {
        score: Math.min(totalScore, 100),
        isFullyCompleted,
      };
    } catch (error) {
      console.error('Error calculating completion score:', error);
      return { score: 0, isFullyCompleted: false };
    }
  }

  /**
   * Get completion status and analytics
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

      if (preferencesResult.error) throw preferencesResult.error;
      if (configResult.error) throw configResult.error;

      const preferences = preferencesResult.data;
      const configuration = configResult.data;

      let completionScore = 0;
      let isCompleted = false;
      let nextStep: string | null = null;

      if (preferences) {
        // Use new onboarding system, but also check legacy preferences as fallback
        const { score, isFullyCompleted } = await this.calculateCompletionScore(userId);
        
        // If new system shows incomplete, double-check with legacy system
        if (!isFullyCompleted) {
          const legacyCompletion = await this.checkLegacyOnboardingCompletion(userId);
          if (legacyCompletion.isCompleted) {
            // Legacy system shows complete, use those results
            completionScore = legacyCompletion.completionScore;
            isCompleted = true;
            nextStep = null;
          } else {
            // Both systems show incomplete
            completionScore = score;
            isCompleted = isFullyCompleted;
            nextStep = preferences.current_step;
          }
        } else {
          // New system shows complete
          completionScore = score;
          isCompleted = isFullyCompleted;
          nextStep = null;
        }
      } else {
        // Fallback: Check old preferences system for completion
        const legacyCompletion = await this.checkLegacyOnboardingCompletion(userId);
        isCompleted = legacyCompletion.isCompleted;
        completionScore = legacyCompletion.completionScore;
        nextStep = isCompleted ? null : 'work-schedule';
      }

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
   * Check if user has completed onboarding via the legacy preferences system
   * This provides compatibility with the existing onboarding UI
   */
  private static async checkLegacyOnboardingCompletion(userId: string): Promise<{
    isCompleted: boolean;
    completionScore: number;
  }> {
    try {
      // Check if user has preferences saved via the old system
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('No profile preferences found for legacy check');
        return { isCompleted: false, completionScore: 0 };
      }

      const prefs = profile?.preferences || {};
      let score = 0;

      // Check work schedule completion (30 points)
      if (prefs.work_days && prefs.work_start_time && prefs.work_end_time) {
        score += 30;
      }

      // Check time buffers completion (30 points)
      if ((prefs.travel_buffer_percentage !== undefined || prefs.travel_buffer_minutes !== undefined) && prefs.job_duration_buffer_minutes !== undefined) {
        score += 30;
      }

      // Check supplier preferences completion (40 points)
      if (prefs.primary_supplier || (prefs.preferred_suppliers && prefs.preferred_suppliers.length > 0)) {
        score += 40;
      }

      const isCompleted = score >= 75; // At least work schedule + time buffers OR work schedule + suppliers

      console.log('Legacy onboarding check:', { userId, score, isCompleted, hasPrefs: !!prefs.work_days });

      return { isCompleted, completionScore: score };
    } catch (error) {
      console.error('Error checking legacy onboarding completion:', error);
      return { isCompleted: false, completionScore: 0 };
    }
  }

  /**
   * Get onboarding analytics for a user
   */
  static async getOnboardingAnalytics(userId: string): Promise<{ data: OnboardingAnalyticsEvent[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('event_timestamp', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting onboarding analytics:', error);
      return { data: null, error };
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Get the next step in the onboarding flow
   */
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
   * Reset onboarding for a user (useful for testing)
   */
  static async resetOnboarding(userId: string): Promise<{ error: any }> {
    try {
      // Delete existing preferences and analytics
      await Promise.all([
        supabase.from('onboarding_preferences').delete().eq('user_id', userId),
        supabase.from('onboarding_analytics').delete().eq('user_id', userId),
      ]);

      return { error: null };
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      return { error };
    }
  }
} 