/**
 * TradeFlow Mobile App - Plan Your Day Workflow Orchestrator
 * 
 * This is the main entry point for the AI-powered daily planning workflow.
 * It manages the planning process and shows the results to the user.
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
import { useMockJobs } from '@/hooks/useMockJobs';

export default function PlanYourDayIndex() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Get today's jobs for initial planning
  const { data: jobs, isLoading: jobsLoading } = useMockJobs({ status: 'pending' });
  
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
  } = useTodaysPlan();

  /**
   * Handle automatic navigation when planning is complete
   */
  useEffect(() => {
    if (!dailyPlan || isProcessing) return;

    // Navigate to plan summary when planning is complete
    if (dailyPlan.status === 'approved') {
      router.push('/plan-summary');
    }
  }, [dailyPlan?.status, isProcessing, router]);

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
          onRetry={canRetry ? handleRetry : undefined}
          retryText={canRetry ? 'Retry Planning' : undefined}
        />
      </SafeAreaView>
    );
  }

  // Agent is processing - show loading with current step
  if (isProcessing || (dailyPlan && dailyPlan.status !== 'approved')) {
    const stepMessages = {
      dispatch: '🎯 Prioritizing your jobs...',
      route: '🗺️ Optimizing your travel route...',
      inventory: '📦 Checking parts and creating shopping list...',
      complete: '✅ Finalizing your daily plan...',
    };

    const currentMessage = stepMessages[currentStep as keyof typeof stepMessages] || '🧠 AI agents working...';

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <LoadingStepUI 
          step={currentMessage}
          isConnected={isConnected}
          planId={dailyPlan?.id}
        />
      </SafeAreaView>
    );
  }

  // Plan is complete - show success message (this shouldn't be visible due to navigation)
  if (dailyPlan && dailyPlan.status === 'approved') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <LoadingStepUI 
            step="🎉 Daily plan complete! Redirecting to summary..."
            isConnected={isConnected}
          />
        </View>
      </SafeAreaView>
    );
  }

  // No plan exists - show start planning UI
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StartPlanningUI 
        onStartPlanning={handleStartPlanning}
        availableJobs={jobs?.filter(job => job.status === 'pending') || []}
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