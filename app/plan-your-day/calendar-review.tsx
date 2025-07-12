/**
 * TradeFlow Mobile App - Calendar Review Screen
 * 
 * This screen displays the AI-generated job calendar from the Dispatch Strategist
 * and allows users to review and reorder jobs using drag-and-drop functionality.
 * Users can approve the schedule or make modifications before proceeding to route optimization.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { typography, spacing, radius } from '@/constants/Theme';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { LoadingStepUI } from '../../components/LoadingStepUI';
import { ErrorStepUI } from '../../components/ErrorStepUI';
import { formatTimeString } from '@/utils/dateUtils';
import type { DispatchOutput } from '@/services/dailyPlanService';

interface JobItem {
  id: string;
  title: string;
  address: string;
  priority: 'high' | 'medium' | 'low';
  estimatedStartTime: string;
  estimatedEndTime: string;
  priorityReason: string;
  jobType: 'service' | 'inspection' | 'emergency';
  bufferTime: number;
}

export default function CalendarReviewScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    dailyPlan,
    isLoading,
    error,
    confirmDispatch,
    saveUserModifications,
    isConnected,
  } = useTodaysPlan();
  
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  /**
   * Convert dispatch output to job items for display
   */
  useEffect(() => {
    if (dailyPlan?.dispatch_output?.prioritized_jobs) {
      const jobItems: JobItem[] = dailyPlan.dispatch_output.prioritized_jobs.map(job => ({
        id: job.job_id,
        title: `Job ${job.job_id}`, // Would be replaced with actual job title
        address: 'Job Address', // Would be replaced with actual job address
        priority: job.priority_rank <= 2 ? 'high' : job.priority_rank <= 4 ? 'medium' : 'low',
        estimatedStartTime: job.estimated_start_time,
        estimatedEndTime: job.estimated_end_time,
        priorityReason: job.priority_reason,
        jobType: job.job_type,
        bufferTime: job.buffer_time_minutes,
      }));
      setJobs(jobItems);
    }
  }, [dailyPlan?.dispatch_output]);

  /**
   * Handle job reordering with drag-and-drop
   */
  const handleDragEnd = ({ data }: { data: JobItem[] }) => {
    const hasReordered = data.some((item, index) => item.id !== jobs[index]?.id);
    
    if (hasReordered) {
      setJobs(data);
      setHasChanges(true);
    }
  };

  /**
   * Toggle job expansion/collapse
   */
  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  /**
   * Render individual job item with drag handle
   */
  const renderJobItem = ({ item: job, drag, isActive, getIndex }: RenderItemParams<JobItem>) => {
    const index = getIndex();
    const isExpanded = expandedJobs.has(job.id);
    
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[styles.jobCard, isActive && styles.activeJobCard]}
        >
          <TouchableOpacity
            onPress={() => toggleJobExpansion(job.id)}
            activeOpacity={0.7}
            style={styles.jobContent}
          >
            <View style={styles.jobHeader}>
              <View style={styles.jobRank}>
                <Text style={[styles.rankText, { color: colors.primary }]}>
                  {(index ?? 0) + 1}
                </Text>
              </View>
              
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: colors.text }]}>
                  {job.title}
                </Text>
                <Text style={[styles.jobAddress, { color: colors.secondary }]}>
                  {job.address}
                </Text>
              </View>
              
              <View style={styles.jobActions}>
                <TouchableOpacity
                  onPress={() => toggleJobExpansion(job.id)}
                  style={styles.expandButton}
                >
                  <FontAwesome 
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={14} 
                    color={colors.secondary}
                  />
                </TouchableOpacity>
                
                <View style={styles.dragHandle}>
                  <FontAwesome 
                    name="bars" 
                    size={16} 
                    color={colors.secondary}
                  />
                </View>
              </View>
            </View>

            {/* Basic info shown when collapsed */}
            {!isExpanded && (
              <View style={styles.jobSummary}>
                <View style={styles.jobMeta}>
                  <View style={styles.jobType}>
                    <FontAwesome 
                      name={getJobTypeIcon(job.jobType)} 
                      size={14} 
                      color={colors.primary}
                    />
                    <Text style={[styles.jobTypeText, { color: colors.text }]}>
                      {job.jobType}
                    </Text>
                  </View>
                  
                  <View style={[styles.priorityBadge, { 
                    backgroundColor: getPriorityColor(job.priority) 
                  }]}>
                    <Text style={[styles.priorityText, { color: colors.background }]}>
                      {job.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.timeText, { color: colors.secondary }]}>
                  {formatTime(job.estimatedStartTime)} - {formatTime(job.estimatedEndTime)}
                </Text>
              </View>
            )}

            {/* Detailed info shown when expanded */}
            {isExpanded && (
              <View style={styles.jobDetails}>
                <View style={styles.jobMeta}>
                  <View style={styles.jobType}>
                    <FontAwesome 
                      name={getJobTypeIcon(job.jobType)} 
                      size={14} 
                      color={colors.primary}
                    />
                    <Text style={[styles.jobTypeText, { color: colors.text }]}>
                      {job.jobType}
                    </Text>
                  </View>
                  
                  <View style={[styles.priorityBadge, { 
                    backgroundColor: getPriorityColor(job.priority) 
                  }]}>
                    <Text style={[styles.priorityText, { color: colors.background }]}>
                      {job.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.timeInfo}>
                  <View style={styles.timeRow}>
                    <Text style={[styles.timeLabel, { color: colors.secondary }]}>
                      Start Time:
                    </Text>
                    <Text style={[styles.timeValue, { color: colors.text }]}>
                      {formatTime(job.estimatedStartTime)}
                    </Text>
                  </View>
                  
                  <View style={styles.timeRow}>
                    <Text style={[styles.timeLabel, { color: colors.secondary }]}>
                      End Time:
                    </Text>
                    <Text style={[styles.timeValue, { color: colors.text }]}>
                      {formatTime(job.estimatedEndTime)}
                    </Text>
                  </View>
                  
                  <View style={styles.timeRow}>
                    <Text style={[styles.timeLabel, { color: colors.secondary }]}>
                      Buffer Time:
                    </Text>
                    <Text style={[styles.timeValue, { color: colors.text }]}>
                      {job.bufferTime} minutes
                    </Text>
                  </View>
                </View>
                
                <View style={styles.priorityReason}>
                  <Text style={[styles.priorityReasonLabel, { color: colors.secondary }]}>
                    Priority Reason:
                  </Text>
                  <Text style={[styles.priorityReasonText, { color: colors.text }]}>
                    {job.priorityReason}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <LoadingStepUI 
          step="Loading your schedule..." 
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
          context="Failed to load your schedule"
        />
      </SafeAreaView>
    );
  }

  /**
   * Handle schedule confirmation
   */
  const handleConfirmSchedule = async () => {
    setIsConfirming(true);
    
    try {
      // Save user modifications if any
      if (hasChanges) {
        const modifications = {
          dispatch_changes: {
            job_reordering: jobs.map((job, index) => ({
              job_id: job.id,
              new_priority_rank: index + 1,
              timestamp: new Date().toISOString(),
            })),
          },
        };
        await saveUserModifications(modifications);
      }
      
      // Confirm dispatch and proceed to route optimization
      await confirmDispatch();
      
      // Navigate to map view
      router.push('./map-view');
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to confirm schedule',
        [{ text: 'OK' }]
      );
    } finally {
      setIsConfirming(false);
    }
  };

  /**
   * Format time display
   */
  const formatTime = (timeString: string) => {
    return formatTimeString(timeString);
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.secondary;
    }
  };

  /**
   * Get job type icon
   */
  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'emergency': return 'exclamation';
      case 'service': return 'wrench';
      case 'inspection': return 'clipboard';
      default: return 'briefcase';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Review Your Schedule
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {jobs.length} jobs planned • Drag to reorder
          </Text>
        </View>

        {/* Job List */}
        <View style={styles.jobList}>
          <DraggableFlatList
            data={jobs}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderJobItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>

        {/* Actions */}
                 <View style={styles.actions}>
           <Button
             title="Cancel"
             variant="outline"
             onPress={() => router.back()}
             disabled={isConfirming}
             style={styles.cancelButton}
           />
           
           <Button
             title={isConfirming ? 'Confirming...' : 'Confirm Schedule'}
             variant="primary"
             onPress={handleConfirmSchedule}
             disabled={isConfirming}
             loading={isConfirming}
             style={styles.confirmButton}
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
    ...spacing.helpers.paddingHorizontal('m'),
  },
  header: {
    ...spacing.helpers.paddingVertical('m'),
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
  },
  jobList: {
    flex: 1,
    marginBottom: spacing.m,
  },
  listContainer: {
    paddingBottom: spacing.m,
  },
  jobCard: {
    marginBottom: spacing.m,
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  activeJobCard: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  jobContent: {
    backgroundColor: 'white',
    ...spacing.helpers.padding('m'),
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  jobRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  rankText: {
    ...typography.bodyBold,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  jobAddress: {
    ...typography.caption,
  },
  jobActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  expandButton: {
    padding: spacing.xs,
  },
  dragHandle: {
    padding: spacing.xs,
  },
  jobSummary: {
    marginTop: spacing.s,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  jobType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  jobTypeText: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
  },
  priorityText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  timeText: {
    ...typography.caption,
  },
  jobDetails: {
    marginTop: spacing.s,
  },
  timeInfo: {
    marginTop: spacing.s,
    marginBottom: spacing.s,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  timeLabel: {
    ...typography.caption,
  },
  timeValue: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  priorityReason: {
    marginTop: spacing.s,
  },
  priorityReasonLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  priorityReasonText: {
    ...typography.caption,
  },
  actions: {
    flexDirection: 'row',
    ...spacing.helpers.paddingVertical('m'),
    gap: spacing.m,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
}); 