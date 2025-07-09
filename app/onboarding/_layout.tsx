/**
 * TradeFlow Mobile App - Onboarding Layout
 * 
 * Multi-step onboarding flow layout with step navigation and progress tracking.
 * Manages the overall onboarding state and navigation between steps.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { Header } from '@/components/Header';
import { typography, spacing, touchTargets } from '@/constants/Theme';
import { PreferencesService } from '@/services/preferencesService';
import { useAtom } from 'jotai';
import { userProfileAtom } from '@/store/atoms';

const ONBOARDING_STEPS = [
  { key: 'work-schedule', label: 'Schedule' },
  { key: 'time-buffers', label: 'Buffers' },
  { key: 'suppliers', label: 'Suppliers' },
];

export default function OnboardingLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const segments = useSegments();
  const [userProfile] = useAtom(userProfileAtom);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});

  // Get current step from route
  useEffect(() => {
    const onboardingSegment = segments[segments.length - 1];
    const stepIndex = ONBOARDING_STEPS.findIndex(step => step.key === onboardingSegment);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
    }
  }, [segments]);

  // Save step data to temporary storage
  const saveStepData = (stepKey: string, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [stepKey]: data
    }));
  };

  // Navigate to next step
  const navigateToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < ONBOARDING_STEPS.length) {
      const step = ONBOARDING_STEPS[stepIndex];
      router.push(`/onboarding/${step.key}` as any);
    }
  };

  // Complete onboarding and save all data
  const completeOnboarding = async () => {
    try {
      if (!userProfile?.id) {
        Alert.alert('Error', 'User profile not found');
        return;
      }

      // Transform form data to preferences format
      const preferencesData = {
        // Work Schedule
        work_days: onboardingData.workSchedule?.workDays || [],
        work_start_time: onboardingData.workSchedule?.startTime || '08:00',
        work_end_time: onboardingData.workSchedule?.endTime || '17:00',
        lunch_break_start: onboardingData.workSchedule?.breakStartTime || '12:00',
        lunch_break_end: onboardingData.workSchedule?.breakEndTime || '13:00',
        
        // Time Buffers
        travel_buffer_percentage: onboardingData.timeBuffers?.travelBufferMinutes || 15,
        job_duration_buffer_minutes: onboardingData.timeBuffers?.jobBufferMinutes || 15,
        
        // Supplier Preferences
        primary_supplier: onboardingData.supplierPreferences?.preferredSuppliers?.[0] || 'Home Depot',
        secondary_suppliers: onboardingData.supplierPreferences?.preferredSuppliers?.slice(1) || [],
      };

      const { error } = await PreferencesService.updateUserPreferences(
        userProfile.id,
        preferencesData
      );

      if (error) {
        throw error;
      }

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Header
          title="Setup Your Preferences"
          rightAction={
            currentStep === ONBOARDING_STEPS.length - 1 ? {
              text: 'Complete',
              onPress: completeOnboarding,
            } : undefined
          }
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