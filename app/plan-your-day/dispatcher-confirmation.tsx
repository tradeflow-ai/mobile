/**
 * Dispatcher Confirmation Screen
 * 
 * Shows the results of the dispatcher edge function and allows user to
 * confirm or modify the job prioritization before proceeding to inventory.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows } from '@/constants/Theme';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { Button } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';
import { LoadingStepUI } from '@/components/LoadingStepUI';

export default function DispatcherConfirmationScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isConfirming, setIsConfirming] = useState(false);
  
  const {
    dailyPlan,
    isLoading,
    error,
    confirmDispatcherOutput,
    proceedToInventory,
  } = useTodaysPlan();

  useEffect(() => {
    if (!dailyPlan) return;

    const status = dailyPlan.status;
    if (status === 'ready_for_execution' || status === 'hardware_store_added') {
      router.push('/plan-your-day/inventory-results');
    }
  }, [dailyPlan, router]);

  const handleConfirmAndProceed = async () => {
    if (!dailyPlan) return;

    try {
      setIsConfirming(true);
      
      // Confirm dispatcher output
      await confirmDispatcherOutput();
      
      // Proceed to inventory analysis
      await proceedToInventory();
      
      // Navigation will be handled by the main screen
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to proceed to inventory',
        [{ text: 'OK' }]
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading || !dailyPlan) {
    return (
      <LoadingStepUI
        title="Optimizing Schedule"
        subtitle="AI is prioritizing your jobs and optimizing your route for maximum efficiency"
        step="dispatcher"
        steps={[
          { label: "Analyzing job priorities", completed: false, current: true },
          { label: "Optimizing travel routes", completed: false, current: false },
          { label: "Checking time constraints", completed: false, current: false },
          { label: "Finalizing schedule", completed: false, current: false },
        ]}
      />
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Button
            title="Go Back"
            onPress={handleGoBack}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const dispatcherOutput = dailyPlan.dispatcher_output;
  const prioritizedJobs = dispatcherOutput?.prioritized_jobs || [];
  const optimizationSummary = dispatcherOutput?.optimization_summary;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              📋 Job Schedule Optimized
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Review your prioritized job schedule before checking inventory
            </Text>
          </View>

          {/* Optimization Summary */}
          {optimizationSummary && (
            <View style={[styles.summaryCard, { backgroundColor: colors.card }, shadows.subtle(colorScheme)]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Optimization Summary
              </Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Emergency Jobs</Text>
                  <Text style={[styles.summaryValue, { color: colors.error }]}>
                    {optimizationSummary.emergency_jobs}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Inspection Jobs</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {optimizationSummary.inspection_jobs}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Service Jobs</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {optimizationSummary.service_jobs}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Route Efficiency</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    {optimizationSummary.route_efficiency != null
                      ? `${Math.round(optimizationSummary.route_efficiency * 100)}%`
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Prioritized Jobs List */}
          <View style={[styles.jobsCard, { backgroundColor: colors.card }, shadows.subtle(colorScheme)]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Your Optimized Schedule
            </Text>
            
            {prioritizedJobs.map((job, index) => (
              <View key={job.job_id} style={styles.jobItem}>
                <View style={styles.jobHeader}>
                  <View style={styles.jobNumber}>
                    <Text style={[styles.jobNumberText, { color: colors.background }]}>
                      {job.priority_rank}
                    </Text>
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={[styles.jobTitle, { color: colors.text }]}>
                      {job.job_id}
                    </Text>
                    <Text style={[styles.jobTime, { color: colors.text }]}>
                      {job.estimated_start_time} - {job.estimated_end_time}
                    </Text>
                  </View>
                  <View style={[styles.jobTypeBadge, { backgroundColor: getJobTypeColor(job.job_type, colors) }]}>
                    <Text style={[styles.jobTypeText, { color: colors.background }]}>
                      {job.job_type}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.jobReason, { color: colors.text }]}>
                  {job.priority_reason}
                </Text>
                {job.geographic_reasoning && (
                  <Text style={[styles.jobGeographic, { color: colors.text }]}>
                    🗺️ {job.geographic_reasoning}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Recommendations */}
          {dispatcherOutput?.recommendations && dispatcherOutput.recommendations.length > 0 && (
            <View style={[styles.recommendationsCard, { backgroundColor: colors.card }, shadows.subtle(colorScheme)]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                📝 Recommendations
              </Text>
              {dispatcherOutput.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <FontAwesome name="lightbulb-o" size={16} color={colors.primary} />
                  <Text style={[styles.recommendationText, { color: colors.text }]}>
                    {recommendation}
                  </Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Modify Schedule"
            onPress={() => Alert.alert('Feature Coming Soon', 'Schedule modification will be available in a future update.')}
            variant="outline"
            style={styles.modifyButton}
          />
          <Button
            title="Continue to Inventory"
            onPress={handleConfirmAndProceed}
            loading={isConfirming}
            style={styles.continueButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function getJobTypeColor(jobType: string, colors: any) {
  switch (jobType) {
    case 'emergency':
      return colors.error;
    case 'inspection':
      return colors.primary;
    case 'service':
      return colors.success;
    default:
      return colors.text;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    ...spacing.helpers.padding('m'),
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
  },
  loadingText: {
    ...typography.body1,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
  },
  errorText: {
    ...typography.body1,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  backButton: {
    width: '100%',
  },
  header: {
    marginBottom: spacing.l,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    opacity: 0.8,
  },
  summaryCard: {
    borderRadius: 12,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  jobsCard: {
    borderRadius: 12,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  recommendationsCard: {
    borderRadius: 12,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: spacing.m,
  },
  summaryLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h3,
  },
  jobItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: spacing.m,
    marginBottom: spacing.m,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  jobNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  jobNumberText: {
    ...typography.body2,
    fontWeight: 'bold',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    ...typography.body1,
    fontWeight: '600',
  },
  jobTime: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  jobTypeBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  jobTypeText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  jobReason: {
    ...typography.body2,
    marginLeft: 44,
    marginBottom: spacing.xs,
  },
  jobGeographic: {
    ...typography.caption,
    marginLeft: 44,
    opacity: 0.8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  recommendationText: {
    ...typography.body2,
    flex: 1,
    marginLeft: spacing.s,
  },
  actions: {
    flexDirection: 'row',
    ...spacing.helpers.paddingTop('m'),
    gap: spacing.m,
  },
  modifyButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
}); 