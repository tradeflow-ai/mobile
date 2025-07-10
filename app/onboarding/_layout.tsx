/**
 * TradeFlow Mobile App - Onboarding Layout
 * 
 * Multi-step onboarding flow layout with step navigation and progress tracking.
 * Manages the overall onboarding state and navigation between steps.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Header } from '@/components/Header';
import { typography, spacing, touchTargets } from '@/constants/Theme';
import { PreferencesService, UserPreferences } from '@/services/preferencesService';
import { AuthManager } from '@/services/authManager';
import { supabase } from '@/services/supabase';
import { userAtom } from '@/store/atoms';

const ONBOARDING_STEPS = [
  { key: 'work-schedule', label: 'Schedule' },
  { key: 'time-buffers', label: 'Buffers' },
  { key: 'suppliers', label: 'Suppliers' },
];

// Context types
interface OnboardingContextType {
  saveStepData: (stepKey: string, data: any) => void;
  navigateToNextStep: () => void;
  completeOnboardingWithData: (finalStepData: any) => void;
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  existingPreferences: UserPreferences | null;
  isLoadingPreferences: boolean;
}

// Create context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Custom hook to use the context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default function OnboardingLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const segments = useSegments();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPreferences, setExistingPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  // Effect to run completion logic only when data is ready
  useEffect(() => {
    if (isCompleting && onboardingData.suppliers) {
      completeOnboardingWithFinalData(onboardingData);
      setIsCompleting(false); // Reset trigger
    }
  }, [onboardingData, isCompleting]);

  // Get current step from route
  useEffect(() => {
    const onboardingSegment = segments[segments.length - 1];
    const stepIndex = ONBOARDING_STEPS.findIndex(step => step.key === onboardingSegment);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
    }
  }, [segments]);

  // Load existing preferences when component mounts
  useEffect(() => {
    const loadExistingPreferences = async () => {
      const authManager = AuthManager.getInstance();
      const currentUser = authManager.getCurrentUser();
      
      if (!currentUser?.id) {
        setIsLoadingPreferences(false);
        return;
      }

      try {
        // Get raw preferences without defaults to avoid polluting clean profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error loading existing preferences:', error);
          setExistingPreferences(null);
        } else {
          // Only use the raw stored preferences, don't merge with defaults
          const rawPreferences = profile?.preferences || {};
          setExistingPreferences(rawPreferences as UserPreferences);
        }
      } catch (error) {
        console.error('Error loading existing preferences:', error);
        setExistingPreferences(null);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadExistingPreferences();
  }, []);

  // Save step data to temporary storage
  const saveStepData = (stepKey: string, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [stepKey]: data
    }));
  };

  // Navigate to next step with validation
  const navigateToNextStep = () => {
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[nextStepIndex];
      router.push(`/onboarding/${nextStep.key}` as any);
    } else {
      // Last step - trigger the completion process
      setIsCompleting(true);
    }
  };

  // This function is now deprecated and will be removed.
  // The new useEffect handles completion.
  const completeOnboardingWithData = (data: any) => {
    // This can be left empty or just log a warning if needed
  };

  // Complete onboarding with the provided data
  const completeOnboardingWithFinalData = async (finalOnboardingData: Record<string, any>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const authManager = AuthManager.getInstance();
      const currentUser = authManager.getCurrentUser();
      
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // Helper function to convert 12-hour format to 24-hour format
      const convertTo24Hour = (time12: string): string | undefined => {
        if (!time12) return undefined;
        
        const [time, period] = time12.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours);
        
        if (period.toUpperCase() === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period.toUpperCase() === 'AM' && hour === 12) {
          hour = 0;
        }
        
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      };

      // Create a PARTIAL preferences object containing only the data from this flow
      const newPreferences: Partial<UserPreferences> = {
        // Work Schedule
        work_days: finalOnboardingData['work-schedule']?.workDays?.map((day: string) => 
          day.charAt(0).toUpperCase() + day.slice(1)
        ),
        work_start_time: convertTo24Hour(finalOnboardingData['work-schedule']?.startTime),
        work_end_time: convertTo24Hour(finalOnboardingData['work-schedule']?.endTime),
        lunch_break_start: (finalOnboardingData['work-schedule']?.hasBreak === true && finalOnboardingData['work-schedule']?.breakStartTime) 
          ? convertTo24Hour(finalOnboardingData['work-schedule'].breakStartTime)
          : '',
        lunch_break_end: (finalOnboardingData['work-schedule']?.hasBreak === true && finalOnboardingData['work-schedule']?.breakEndTime) 
          ? convertTo24Hour(finalOnboardingData['work-schedule'].breakEndTime)
          : '',
        
        // Time Buffers
        travel_buffer_minutes: finalOnboardingData['time-buffers']?.travelBufferMinutes,
        job_duration_buffer_minutes: finalOnboardingData['time-buffers']?.jobBufferMinutes,
        enable_smart_buffers: finalOnboardingData['time-buffers']?.enableSmartBuffers,
        emergency_travel_buffer_percentage: finalOnboardingData['time-buffers']?.enableSmartBuffers ? 25 : 0,
        
        // Supplier Preferences
        preferred_suppliers: finalOnboardingData['suppliers']?.preferredSuppliers?.map((supplier: string) =>
          supplier.replace(/-/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        ),
        supplier_priority_order: finalOnboardingData['suppliers']?.priorityOrder,
      };

      // Remove undefined keys so they don't overwrite existing data in the DB
      Object.keys(newPreferences).forEach(key => {
        if (newPreferences[key as keyof UserPreferences] === undefined) {
          delete newPreferences[key as keyof UserPreferences];
        }
      });

      console.log('Sending final preferences update to service:', newPreferences);
      
      const { error } = await PreferencesService.updateUserPreferences(
        currentUser.id,
        newPreferences
      );

      if (error) {
        throw error;
      }

      // Mark onboarding as completed in the profiles table
      const { error: completionError } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      if (completionError) {
        console.error('Failed to mark onboarding as completed:', completionError);
        // Don't throw here - preferences were saved successfully
      }

      // Navigate to main app - AuthGuard will detect completion and refresh profile data
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to specific step
  const navigateToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < ONBOARDING_STEPS.length) {
      const step = ONBOARDING_STEPS[stepIndex];
      router.push(`/onboarding/${step.key}` as any);
    }
  };

  // Complete onboarding and save all data (for header button)
  const completeOnboarding = async () => {
    if (onboardingData.suppliers) {
      completeOnboardingWithFinalData(onboardingData);
    } else {
      // This can happen if the user is on the last step but hasn't submitted the form yet.
      // We can either show an alert or try to submit the form for them if we have a way to do it.
      Alert.alert(
        "Form Incomplete", 
        "Please fill out and save the final step before completing."
      );
    }
  };

  // Context value
  const contextValue: OnboardingContextType = {
    saveStepData,
    navigateToNextStep,
    completeOnboardingWithData, // Keep for now for compatibility
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    canProceed: true, // Could add validation logic here
    existingPreferences,
    isLoadingPreferences,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <Header
            title="Setup Your Preferences"
            rightAction={undefined}
          />

          <StepIndicator
            currentStep={currentStep}
            totalSteps={ONBOARDING_STEPS.length}
            stepLabels={ONBOARDING_STEPS.map(step => step.label)}
            showLabels={true}
            containerStyle={styles.stepIndicator}
          />

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="work-schedule" />
            <Stack.Screen name="time-buffers" />
            <Stack.Screen name="suppliers" />
          </Stack>
        </View>
      </SafeAreaView>
    </OnboardingContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.m,
  },
  stepIndicator: {
    marginBottom: spacing.l,
  },
});

// Export helper functions for use in onboarding screens
export { ONBOARDING_STEPS };
export type OnboardingData = Record<string, any>; 