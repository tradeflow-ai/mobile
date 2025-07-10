/**
 * TradeFlow Mobile App - Schedule Review Screen
 * 
 * This screen displays the AI-generated job schedule from the Dispatch Strategist
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
import type { DispatchOutput } from '@/services/dailyPlanService';

interface JobItem {
  id: string;
  title: string;
  address: string;
  priority: 'high' | 'medium' | 'low';
  estimatedStartTime: string;
  estimatedEndTime: string;
  priorityReason: string;
  jobType: 'demand' | 'maintenance' | 'emergency';
  bufferTime: number;
}

export default function ScheduleReviewScreen() {
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
                  <Text style={[styles.timeText, { color: colors.secondary }]}>
                    {formatTime(job.estimatedStartTime)} - {formatTime(job.estimatedEndTime)}
                  </Text>
                  <Text style={[styles.bufferText, { color: colors.secondary }]}>
                    +{job.bufferTime}min buffer
                  </Text>
                </View>
                
                <Text style={[styles.reasonText, { color: colors.secondary }]}>
                  {job.priorityReason}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

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
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      case 'emergency': return 'exclamation-triangle';
      case 'demand': return 'clock-o';
      case 'maintenance': return 'wrench';
      default: return 'briefcase';
    }
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
          onRetry={() => router.back()}
          retryText="Go Back"
        />
      </SafeAreaView>
    );
  }

  // No dispatch output available
  if (!dailyPlan?.dispatch_output) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ErrorStepUI 
          error="No schedule available to review"
          onRetry={() => router.back()}
          retryText="Go Back"
        />
      </SafeAreaView>
    );
  }

  const dispatchOutput = dailyPlan.dispatch_output as DispatchOutput;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <FontAwesome 
                name="calendar-check-o" 
                size={24} 
                color={colors.background}
              />
            </View>
            
            <View style={styles.headerText}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                Review Your Schedule
              </Text>
              <Text style={[styles.subtitleText, { color: colors.secondary }]}>
                AI has prioritized your jobs. Long press and drag to reorder.
              </Text>
            </View>
          </View>
        </Card>

        {/* Schedule Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Schedule Summary
            </Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                Total Jobs
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {jobs.length}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                Work Hours
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {Math.round(dispatchOutput.scheduling_constraints.total_work_hours)}h
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                Start Time
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatTime(dispatchOutput.scheduling_constraints.work_start_time)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Job List */}
        <Card style={styles.jobsCard}>
          <View style={styles.jobsHeader}>
            <Text style={[styles.jobsTitle, { color: colors.text }]}>
              Prioritized Jobs
            </Text>
            {hasChanges && (
              <View style={styles.changesIndicator}>
                <FontAwesome 
                  name="pencil" 
                  size={12} 
                  color={colors.warning}
                />
                <Text style={[styles.changesText, { color: colors.warning }]}>
                  Modified
                </Text>
              </View>
            )}
          </View>

          <DraggableFlatList
            data={jobs}
            renderItem={renderJobItem}
            keyExtractor={(item) => item.id}
            onDragEnd={handleDragEnd}
            containerStyle={styles.jobsList}
            contentContainerStyle={styles.jobsListContent}
          />
        </Card>

        {/* AI Reasoning */}
        <Card style={styles.reasoningCard}>
          <View style={styles.reasoningHeader}>
            <FontAwesome 
              name="lightbulb-o" 
              size={20} 
              color={colors.primary}
            />
            <Text style={[styles.reasoningTitle, { color: colors.text }]}>
              AI Reasoning
            </Text>
          </View>
          
          <Text style={[styles.reasoningText, { color: colors.secondary }]}>
            {dispatchOutput.agent_reasoning}
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title={isConfirming ? 'Confirming...' : 'Confirm Schedule'}
            onPress={handleConfirmSchedule}
            variant="primary"
            disabled={isConfirming}
            style={styles.confirmButton}
          />
          
          <Button
            title="Make Changes"
            onPress={() => router.back()}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
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
  headerCard: {
    marginBottom: spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  headerText: {
    flex: 1,
  },
  titleText: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    ...typography.body,
    lineHeight: 20,
  },
  summaryCard: {
    marginBottom: spacing.m,
  },
  summaryHeader: {
    marginBottom: spacing.m,
  },
  summaryTitle: {
    ...typography.h3,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  jobsCard: {
    marginBottom: spacing.m,
  },
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  jobsTitle: {
    ...typography.h3,
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  changesText: {
    ...typography.caption,
    fontWeight: '600',
  },
  jobsList: {
    gap: spacing.m,
  },
  jobsListContent: {
    gap: spacing.m,
  },
  jobCard: {
    backgroundColor: 'rgba(244, 164, 96, 0.05)',
    borderRadius: radius.m,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(244, 164, 96, 0.2)',
    marginBottom: spacing.m,
  },
  jobContent: {
    flex: 1,
  },
  activeJobCard: {
    backgroundColor: 'rgba(244, 164, 96, 0.15)',
    borderColor: 'rgba(244, 164, 96, 0.4)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  jobRank: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(244, 164, 96, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  rankText: {
    ...typography.body,
    fontWeight: 'bold',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  jobAddress: {
    ...typography.caption,
  },
  jobActions: {
    marginLeft: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  expandButton: {
    padding: spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.s,
    backgroundColor: 'rgba(244, 164, 96, 0.1)',
  },
  dragHandle: {
    padding: spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.s,
    backgroundColor: 'rgba(244, 164, 96, 0.1)',
  },
  jobSummary: {
    marginTop: spacing.m,
    gap: spacing.s,
  },
  jobDetails: {
    gap: spacing.s,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 10,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  bufferText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  reasonText: {
    ...typography.caption,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  reasoningCard: {
    marginBottom: spacing.l,
    backgroundColor: 'rgba(244, 164, 96, 0.1)',
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  reasoningTitle: {
    ...typography.h4,
  },
  reasoningText: {
    ...typography.body,
    lineHeight: 20,
  },
  actionContainer: {
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  confirmButton: {
    // Button styles handled by Button component
  },
  backButton: {
    // Button styles handled by Button component
  },
}); 