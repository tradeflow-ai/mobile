/**
 * TradeFlow Mobile App - Plan Your Day Workflow Orchestrator
 * 
 * This is the main entry point for the AI-powered daily planning workflow.
 * It manages the new 2-step process and routes users through each stage:
 * 1. Dispatcher - Job prioritization and route optimization
 * 2. Inventory - Parts analysis and hardware store job creation
 * 
 * Features real-time agent status updates and user confirmation between steps.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { spacing } from '@/constants/Theme';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { LoadingStepUI } from '../../components/LoadingStepUI';
import { ErrorStepUI } from '../../components/ErrorStepUI';
import { StartPlanningUI } from '../../components/StartPlanningUI';
import { useJobs } from '@/hooks/useJobs';

export default function PlanYourDayIndex() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Get today's jobs for initial planning
  const { data: jobs, isLoading: jobsLoading } = useJobs({ status: 'pending' });
  
  // Get today's daily plan with real-time updates
  const {
    dailyPlan,
    isLoading,
    error,
    currentStep,
    isProcessing,
    startPlanning,
    retryPlanning,
    canRetry,
    isConnected,
    isAwaitingConfirmation,
    hasHardwareStoreJob,
    resetPlan, // 🔄 Add resetPlan functionality
  } = useTodaysPlan();

  /**
   * Handle automatic navigation based on daily plan status - New 2-step workflow
   */
  useEffect(() => {
    if (!dailyPlan || isProcessing) return;

    // Navigate to appropriate step based on current status
    switch (dailyPlan.status) {
      case 'dispatcher_complete':
      case 'awaiting_confirmation':
        // Show dispatcher results for user confirmation
        router.push('/plan-your-day/dispatcher-confirmation');
        break;
      case 'ready_for_execution':
      case 'hardware_store_added':
        // Show inventory results and final plan
        router.push('/plan-your-day/inventory-results');
        break;
      case 'approved':
        // Planning complete - show success and navigate to execution
        Alert.alert(
          'Planning Complete!',
          `Your daily plan is ready${hasHardwareStoreJob ? ' with hardware store stop' : ''}. Time to start your day!`,
          [
            { text: 'Back to Home', onPress: () => router.push('/(tabs)') },
            { text: 'Start Working', onPress: () => router.push('/(tabs)') },
          ]
        );
        break;
    }
  }, [dailyPlan?.status, currentStep, isProcessing, router, hasHardwareStoreJob]);

  /**
   * Handle starting the planning workflow
   */
  const handleStartPlanning = async () => {
    const pendingJobs = jobs?.filter(job => job.status === 'pending') || [];
    
    if (pendingJobs.length === 0) {
      Alert.alert(
        'No Pending Jobs',
        'You need at least one pending job to create a daily plan.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await startPlanning(pendingJobs.map(job => job.id));
    } catch (err) {
      Alert.alert(
        'Failed to Start Planning',
        err instanceof Error ? err.message : 'An unexpected error occurred',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle retrying failed planning
   */
  const handleRetry = async () => {
    try {
      await retryPlanning();
    } catch (err) {
      Alert.alert(
        'Failed to Retry Planning',
        err instanceof Error ? err.message : 'An unexpected error occurred',
        [{ text: 'OK' }]
      );
    }
  };

  // Loading state
  if (isLoading || jobsLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <LoadingStepUI 
          step="Loading your daily plan..." 
          isConnected={isConnected}
        />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ErrorStepUI 
          error={error}
          onRetry={() => {
            resetPlan(); // Clear state first
            // The component will re-render and show the start planning UI
          }}
          retryText="Start Over"
          onSecondaryAction={() => router.back()}
          secondaryActionText="Go Back"
        />
      </SafeAreaView>
    );
  }

  // No plan exists - show start planning UI
  if (!dailyPlan) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StartPlanningUI 
          onStartPlanning={handleStartPlanning}
          availableJobs={jobs?.filter(job => job.status === 'pending') || []}
        />
      </SafeAreaView>
    );
  }

  // Agent is processing - show loading with current step
  if (isProcessing) {
    const stepMessages = {
      dispatcher: 'Analyzing, prioritizing, and optimizing your schedule...',
      inventory: 'Checking parts and creating shopping list...',
    };

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <LoadingStepUI 
          step={stepMessages[currentStep as keyof typeof stepMessages] || 'Processing...'}
          isConnected={isConnected}
          planId={dailyPlan.id}
        />
      </SafeAreaView>
    );
  }

  // Plan exists but no automatic navigation triggered
  // This is a fallback that shouldn't normally happen
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LoadingStepUI 
        step="Preparing your daily plan..."
        isConnected={isConnected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    ...spacing.helpers.padding('m'),
  },
}); 