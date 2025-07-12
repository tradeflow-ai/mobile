/**
 * Today's Calendar Job List Component
 * 
 * Displays a condensed list of jobs for the daily plan with job details,
 * priority, location, and start time. Shows jobs in priority order.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useJob } from '@/hooks/useJobs';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';
import { Card } from '@/components/ui';
import { formatTimeString } from '@/utils/dateUtils';
import type { DailyPlan } from '@/services/dailyPlanService';
import { useAppNavigation } from '@/hooks/useNavigation';

interface TodaysCalendarJobListProps {
  dailyPlan: DailyPlan;
}

interface JobItemProps {
  jobId: string;
  priorityRank: number;
  estimatedStartTime: string;
  priorityReason: string;
  onPress: () => void;
}

/**
 * Individual job item component
 */
const JobItem: React.FC<JobItemProps> = ({ 
  jobId, 
  priorityRank, 
  estimatedStartTime, 
  priorityReason, 
  onPress 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: job } = useJob(jobId);

  if (!job) {
    return (
      <View style={[styles.jobItem, { backgroundColor: colors.card }]}>
        <Text style={[styles.loadingText, { color: colors.placeholder }]}>
          Loading job details...
        </Text>
      </View>
    );
  }

  // Format start time to show only time (e.g., "9:00 AM")
  const formatStartTime = (timeString: string) => {
    return formatTimeString(timeString, 'Time TBD');
  };

  // Get priority icon and color
  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { icon: 'exclamation-circle' as const, color: colors.error };
      case 'high':
        return { icon: 'exclamation-triangle' as const, color: colors.warning };
      case 'medium':
        return { icon: 'circle' as const, color: colors.info };
      case 'low':
        return { icon: 'circle-o' as const, color: colors.placeholder };
      default:
        return { icon: 'circle' as const, color: colors.placeholder };
    }
  };

  const priorityDisplay = getPriorityDisplay(job.priority);

  return (
    <TouchableOpacity 
      style={[styles.jobItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobRankContainer}>
          <Text style={[styles.jobRank, { color: colors.primary }]}>
            {priorityRank}
          </Text>
        </View>
        <View style={styles.jobMainContent}>
          <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
            {job.title}
          </Text>
          <View style={styles.jobDetails}>
            <View style={styles.priorityContainer}>
              <FontAwesome 
                name={priorityDisplay.icon} 
                size={12} 
                color={priorityDisplay.color} 
              />
              <Text style={[styles.priorityText, { color: priorityDisplay.color }]}>
                {job.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.jobLocation, { color: colors.placeholder }]} numberOfLines={1}>
              {job.address}
            </Text>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <Text style={[styles.startTime, { color: colors.text }]}>
            {formatStartTime(estimatedStartTime)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Main component that displays the list of jobs for today
 */
export const TodaysCalendarJobList: React.FC<TodaysCalendarJobListProps> = ({ dailyPlan }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { navigate } = useAppNavigation();

  const handleJobPress = (jobId: string) => {
    navigate(`/job-details?id=${jobId}`);
  };

  const prioritizedJobs = dailyPlan.dispatcher_output?.prioritized_jobs || [];

  if (prioritizedJobs.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
        <FontAwesome name="calendar-o" size={24} color={colors.placeholder} />
        <Text style={[styles.emptyStateText, { color: colors.placeholder }]}>
          No jobs scheduled for today
        </Text>
      </View>
    );
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Today's Schedule
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
          {prioritizedJobs.length} jobs • {dailyPlan.total_estimated_duration ? `${Math.round(dailyPlan.total_estimated_duration / 60)}h` : 'Calculating'} estimated
        </Text>
      </View>

      <View style={styles.jobsList}>
        {prioritizedJobs.map((prioritizedJob, index) => (
          <JobItem
            key={prioritizedJob.job_id}
            jobId={prioritizedJob.job_id}
            priorityRank={prioritizedJob.priority_rank}
            estimatedStartTime={prioritizedJob.estimated_start_time}
            priorityReason={prioritizedJob.priority_reason}
            onPress={() => handleJobPress(prioritizedJob.job_id)}
          />
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    ...spacing.helpers.padding('m'),
  },
  header: {
    marginBottom: spacing.m,
  },
  headerTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.caption,
  },
  jobsList: {
    gap: spacing.s,
  },
  jobItem: {
    borderRadius: radius.s,
    ...spacing.helpers.padding('s'),
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobRankContainer: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: 'rgba(244, 164, 96, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  jobRank: {
    ...typography.h4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  jobMainContent: {
    flex: 1,
    marginRight: spacing.s,
  },
  jobTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  jobDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priorityText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: 'bold',
  },
  jobLocation: {
    ...typography.caption,
    flex: 1,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  startTime: {
    ...typography.h4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderRadius: radius.m,
  },
  emptyStateText: {
    ...typography.body,
    marginTop: spacing.s,
    textAlign: 'center',
  },
}); 