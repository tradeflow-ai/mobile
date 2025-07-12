/**
 * Dispatcher Confirmation Screen
 * 
 * Shows the results of the dispatcher edge function and allows user to
 * confirm or modify the job prioritization before proceeding to inventory.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius } from '@/constants/Theme';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { useJob } from '@/hooks/useJobs';
import { Button } from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';
import { LoadingStepUI } from '@/components/LoadingStepUI';
import { formatTimeString } from '@/utils/dateUtils';

// Component to display individual job information
const JobDisplayCard = ({ job, index, colors, colorScheme }: { 
  job: any, 
  index: number, 
  colors: any, 
  colorScheme: string 
}) => {
  const { data: jobDetails, isLoading: jobLoading } = useJob(job.job_id);

  if (jobLoading) {
    return (
      <View style={styles.jobItem}>
        <View style={styles.jobHeader}>
          <View style={[styles.jobNumber, { backgroundColor: colors.primary }]}>
            <Text style={[styles.jobNumberText, { color: colors.background }]}>
              {job.priority_rank}
            </Text>
          </View>
          <View style={styles.jobInfo}>
            <Text style={[styles.jobTitle, { color: colors.text, opacity: 0.6 }]}>
              Loading job details...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!jobDetails) {
    return (
      <View style={styles.jobItem}>
        <View style={styles.jobHeader}>
          <View style={[styles.jobNumber, { backgroundColor: colors.error }]}>
            <Text style={[styles.jobNumberText, { color: colors.background }]}>
              {job.priority_rank}
            </Text>
          </View>
          <View style={styles.jobInfo}>
            <Text style={[styles.jobTitle, { color: colors.error }]}>
              Job not found
            </Text>
            <Text style={[styles.jobTime, { color: colors.text }]}>
              ID: {job.job_id.substring(0, 8)}...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Helper function to get priority level and colors based on actual job priority
  const getPriorityInfo = (jobPriority: string) => {
    switch (jobPriority) {
      case 'urgent':
      case 'high':
        return { 
          level: 'High', 
          backgroundColor: colors.error + '30', // 30% opacity
          borderColor: colors.error // Full opacity for border
        };
      case 'medium':
        return { 
          level: 'Medium', 
          backgroundColor: colors.warning + '30', // 30% opacity
          borderColor: colors.warning // Full opacity for border
        };
      case 'low':
      default:
        return { 
          level: 'Low', 
          backgroundColor: colors.success + '30', // 30% opacity
          borderColor: colors.success // Full opacity for border
        };
    }
  };

  const priorityInfo = getPriorityInfo(jobDetails.priority);

  return (
    <View style={styles.jobItem}>
      <View style={styles.jobHeader}>
        <View style={[styles.jobNumber, { backgroundColor: colors.primary }]}>
          <Text style={[styles.jobNumberText, { color: colors.background }]}>
            {job.priority_rank}
          </Text>
        </View>
        <View style={styles.jobInfo}>
          <View style={styles.jobTitleRow}>
            <Text style={[styles.jobTitle, { color: colors.text }]}>
              {jobDetails.title}
            </Text>
            <View style={[styles.priorityBox, { 
              backgroundColor: priorityInfo.backgroundColor,
              borderColor: priorityInfo.borderColor 
            }]}>
              <Text style={[styles.priorityText, { color: colors.text }]}>
                Priority Level: {priorityInfo.level}
              </Text>
            </View>
          </View>
          {jobDetails.customer_name && (
            <Text style={[styles.jobCustomer, { color: colors.text }]}>
              👤 {jobDetails.customer_name}
            </Text>
          )}
          <Text style={[styles.jobAddress, { color: colors.text }]}>
            📍 {jobDetails.address}
          </Text>
          <Text style={[styles.jobTime, { color: colors.text }]}>
            ⏰ {formatTimeString(job.estimated_start_time)} - {formatTimeString(job.estimated_end_time)}
          </Text>
          
          {/* Priority reasoning */}
          <View style={styles.jobDetails}>
            <Text style={[styles.jobReason, { color: colors.text }]}>
              💡 {job.priority_reason}
            </Text>
            {job.geographic_reasoning && (
              <Text style={[styles.jobGeographic, { color: colors.text }]}>
                🗺️ {job.geographic_reasoning}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

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
        step="Optimizing Schedule"
        subtitle="AI is prioritizing your jobs and optimizing your route for maximum efficiency"
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

          {/* Prioritized Jobs List */}
          <View style={[styles.jobsCard, { backgroundColor: colors.card }, shadows.subtle(colorScheme)]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Your Optimized Schedule
            </Text>
            
            {prioritizedJobs.length === 0 ? (
              <View style={styles.noJobsContainer}>
                <Text style={[styles.noJobsText, { color: colors.text }]}>
                  No jobs scheduled for today
                </Text>
              </View>
            ) : (
              prioritizedJobs.map((job, index) => (
                <JobDisplayCard
                  key={job.job_id}
                  job={job}
                  index={index}
                  colors={colors}
                  colorScheme={colorScheme}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Modify Schedule"
            onPress={() => router.push('/plan-your-day/modify-plan')}
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
    borderRadius: radius.m,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  jobsCard: {
    borderRadius: radius.m,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  recommendationsCard: {
    borderRadius: radius.m,
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
  noJobsContainer: {
    padding: spacing.l,
    alignItems: 'center',
  },
  noJobsText: {
    ...typography.body1,
    textAlign: 'center',
    opacity: 0.6,
  },
  jobItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: spacing.m,
    marginBottom: spacing.m,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  jobNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  jobTitle: {
    ...typography.body1,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.s,
  },
  jobCustomer: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  jobAddress: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  jobTime: {
    ...typography.caption,
    opacity: 0.8,
  },
  priorityBox: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    alignSelf: 'flex-start',
    minWidth: 120,
    borderWidth: 1.5,
  },
  priorityText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  jobDetails: {
    marginTop: spacing.s,
  },
  jobReason: {
    ...typography.body2,
    marginBottom: spacing.xs,
  },
  jobGeographic: {
    ...typography.caption,
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