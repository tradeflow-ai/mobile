import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, touchTargets } from '@/constants/Theme';
import { Card } from '@/components/ui';
import { useMockJobs } from '@/hooks/useMockJobs';
import { MockAgentService } from '@/services/mockAgentService';

export default function PlanSummaryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { data: allJobs } = useMockJobs();
  
  // Get today's plan
  const todaysPlan = useMemo(() => {
    const plan = MockAgentService.getTodaysMockDailyPlan('mock-user-123');
    console.log('Plan Summary - Retrieved plan:', plan ? { 
      id: plan.id, 
      status: plan.status, 
      hasDispatchOutput: !!plan.dispatch_output,
      jobIds: plan.job_ids 
    } : 'No plan found');
    
    // If no plan found, try to create a default one for testing
    if (!plan) {
      console.log('Plan Summary - Creating default plan');
      return MockAgentService.createDefaultPlanForToday('mock-user-123');
    }
    
    return plan;
  }, []);

  // Get prioritized jobs in order
  const prioritizedJobs = useMemo(() => {
    if (!todaysPlan?.dispatch_output?.prioritized_jobs || !allJobs) return [];
    
    return todaysPlan.dispatch_output.prioritized_jobs
      .sort((a: any, b: any) => a.priority_rank - b.priority_rank)
      .map((prioritizedJob: any) => {
        const jobData = allJobs.find(job => job.id === prioritizedJob.job_id);
        return {
          ...jobData,
          priority_rank: prioritizedJob.priority_rank,
          priority_reason: prioritizedJob.priority_reason,
          estimated_start_time: prioritizedJob.estimated_start_time,
          estimated_end_time: prioritizedJob.estimated_end_time,
        };
      })
      .filter(Boolean);
  }, [todaysPlan, allJobs]);

  const handleContinue = () => {
    router.push('/inventory-summary');
  };

  const getPriorityIcon = (rank: number) => {
    if (rank <= 2) return 'exclamation-circle'; // High priority
    if (rank <= 4) return 'clock-o'; // Medium priority
    return 'info-circle'; // Normal priority
  };

  const getPriorityColor = (rank: number) => {
    if (rank <= 2) return colors.error; // High priority
    if (rank <= 4) return '#FF8C00'; // Medium priority (orange)
    return colors.primary; // Normal priority
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!todaysPlan || !prioritizedJobs.length) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: colors.text }]}>
            No plan available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            🎯 Your Optimized Job Schedule
          </Text>
          <Text style={[styles.subtitle, { color: colors.placeholder }]}>
            AI prioritized {prioritizedJobs.length} jobs for maximum efficiency
          </Text>
        </View>

        {/* Jobs List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {prioritizedJobs.map((job: any, index: number) => (
            <Card key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={styles.jobPriority}>
                  <FontAwesome 
                    name={getPriorityIcon(job.priority_rank)} 
                    size={16} 
                    color={getPriorityColor(job.priority_rank)} 
                  />
                  <Text style={[styles.priorityNumber, { color: getPriorityColor(job.priority_rank) }]}>
                    #{job.priority_rank}
                  </Text>
                </View>
                <View style={styles.jobTiming}>
                  <Text style={[styles.timeText, { color: colors.placeholder }]}>
                    {formatTime(job.estimated_start_time)} - {formatTime(job.estimated_end_time)}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.jobTitle, { color: colors.text }]}>
                {job.title}
              </Text>
              
              <Text style={[styles.jobClient, { color: colors.placeholder }]}>
                {job.customer_name} • {job.address}
              </Text>
              
              <Text style={[styles.priorityReason, { color: colors.placeholder }]}>
                Why this order: {job.priority_reason}
              </Text>
              
              <View style={styles.jobFooter}>
                <View style={[styles.jobTypeBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.jobTypeText, { color: colors.primary }]}>
                    {job.job_type?.toUpperCase() || 'SERVICE'}
                  </Text>
                </View>
                <Text style={[styles.durationText, { color: colors.placeholder }]}>
                  ~{job.estimated_duration}min
                </Text>
              </View>
            </Card>
          ))}
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueButtonText, { color: 'white' }]}>
              Review Inventory Requirements
            </Text>
            <FontAwesome name="arrow-right" size={16} color="white" />
          </TouchableOpacity>
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
  header: {
    marginBottom: spacing.l,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  jobCard: {
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
    borderRadius: radius.m,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  jobPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priorityNumber: {
    ...typography.caption,
    fontWeight: '600',
  },
  jobTiming: {
    alignItems: 'flex-end',
  },
  timeText: {
    ...typography.caption,
    fontWeight: '500',
  },
  jobTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  jobClient: {
    ...typography.body,
    marginBottom: spacing.s,
  },
  priorityReason: {
    ...typography.caption,
    fontStyle: 'italic',
    marginBottom: spacing.s,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTypeBadge: {
    ...spacing.helpers.paddingHorizontal('s'),
    ...spacing.helpers.paddingVertical('xs'),
    borderRadius: radius.s,
  },
  jobTypeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  durationText: {
    ...typography.caption,
  },
  buttonContainer: {
    paddingTop: spacing.m,
  },
  continueButton: {
    ...touchTargets.styles.minimum,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: radius.m,
    ...spacing.helpers.paddingVertical('m'),
  },
  continueButtonText: {
    ...typography.button,
  },
}); 