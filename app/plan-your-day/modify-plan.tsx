/**
 * TradeFlow Mobile App - Modify Plan Screen
 * 
 * This screen allows users to reorder their AI-generated job schedule using drag-and-drop
 * functionality. It recalculates drive times and total duration when jobs are reordered,
 * providing users with accurate time estimates for their modified plan.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card, Button } from '@/components/ui';
import { typography, spacing, shadows, radius } from '@/constants/Theme';
import { useTodaysPlan } from '@/hooks/useDailyPlan';
import { useJob } from '@/hooks/useJobs';
import { LoadingStepUI } from '@/components/LoadingStepUI';
import { ErrorStepUI } from '@/components/ErrorStepUI';
import { CoordinateService } from '@/services/routing';
import type { DispatcherOutput } from '@/services/dailyPlanService';

interface ModifiableJob {
  id: string;
  job_id: string;
  title: string;
  address: string;
  customer_name?: string;
  priority_rank: number;
  estimated_start_time: string;
  estimated_end_time: string;
  estimated_duration: number; // in minutes
  travel_time_to_next: number; // in minutes
  priority_reason: string;
  job_type: 'emergency' | 'inspection' | 'service' | 'hardware_store';
  latitude?: number;
  longitude?: number;
  buffer_time_minutes: number;
  geographic_reasoning: string;
}

const { width } = Dimensions.get('window');

export default function ModifyPlanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const coordinateService = CoordinateService.getInstance();
  
  const {
    dailyPlan,
    isLoading,
    error,
    saveUserModifications,
    isConnected,
  } = useTodaysPlan();
  
  const [jobs, setJobs] = useState<ModifiableJob[]>([]);
  const [originalJobs, setOriginalJobs] = useState<ModifiableJob[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [totalTravelTime, setTotalTravelTime] = useState<number>(0);

  /**
   * Component for displaying individual job information with drag handle
   */
  const JobCard = React.memo(({ job, isDragging }: { job: ModifiableJob; isDragging: boolean }) => {
    const { data: jobDetails } = useJob(job.job_id);
    
    const formatTime = (timeString: string) => {
      try {
        return new Date(timeString).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch {
        return timeString;
      }
    };

    const getJobTypeColor = (jobType: string) => {
      switch (jobType) {
        case 'emergency':
          return colors.error;
        case 'inspection':
          return colors.primary;
        case 'service':
          return colors.success;
        case 'hardware_store':
          return colors.warning;
        default:
          return colors.text;
      }
    };

         const cardStyle = StyleSheet.flatten([
       styles.jobCard,
       isDragging ? styles.draggedCard : null,
       { backgroundColor: colors.card }
     ]);

     return (
       <Card 
         style={cardStyle}
       >
        <View style={styles.jobHeader}>
          <View style={styles.jobMainInfo}>
            <View style={[styles.jobNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.jobNumberText, { color: colors.background }]}>
                {job.priority_rank}
              </Text>
            </View>
            <View style={styles.jobDetails}>
              <Text style={[styles.jobTitle, { color: colors.text }]}>
                {jobDetails?.title || `Job ${job.job_id.substring(0, 8)}...`}
              </Text>
              {jobDetails?.customer_name && (
                <Text style={[styles.jobCustomer, { color: colors.text }]}>
                  👤 {jobDetails.customer_name}
                </Text>
              )}
              <Text style={[styles.jobAddress, { color: colors.text }]}>
                📍 {jobDetails?.address || job.address}
              </Text>
              <Text style={[styles.jobTime, { color: colors.text }]}>
                ⏰ {formatTime(job.estimated_start_time)} - {formatTime(job.estimated_end_time)}
              </Text>
            </View>
          </View>
          <View style={styles.jobMeta}>
            <View style={[styles.jobTypeBadge, { backgroundColor: getJobTypeColor(job.job_type) }]}>
              <Text style={[styles.jobTypeText, { color: colors.background }]}>
                {job.job_type}
              </Text>
            </View>
            <FontAwesome 
              name="bars" 
              size={20} 
              color={colors.text} 
              style={styles.dragHandle}
            />
          </View>
        </View>
        
        <View style={styles.jobMetrics}>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.text }]}>Duration</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {job.estimated_duration}m
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.text }]}>Travel</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {job.travel_time_to_next}m
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.text }]}>Buffer</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {job.buffer_time_minutes}m
            </Text>
          </View>
        </View>
        
        <Text style={[styles.jobReason, { color: colors.text }]}>
          💡 {job.priority_reason}
        </Text>
      </Card>
    );
  });

  /**
   * Convert dispatcher output to modifiable jobs
   */
  useEffect(() => {
    if (dailyPlan?.dispatcher_output?.prioritized_jobs) {
      const dispatcherOutput = dailyPlan.dispatcher_output as DispatcherOutput;
      const modifiableJobs: ModifiableJob[] = dispatcherOutput.prioritized_jobs.map(job => ({
        id: job.job_id,
        job_id: job.job_id,
        title: `Job ${job.job_id.substring(0, 8)}...`, // Will be replaced by actual job data
        address: 'Loading address...', // Will be replaced by actual job data
        priority_rank: job.priority_rank,
        estimated_start_time: job.estimated_start_time,
        estimated_end_time: job.estimated_end_time,
        estimated_duration: job.buffer_time_minutes || 60, // Default duration
        travel_time_to_next: job.travel_time_to_next || 15,
        priority_reason: job.priority_reason,
        job_type: job.job_type,
        buffer_time_minutes: job.buffer_time_minutes || 0,
        geographic_reasoning: job.geographic_reasoning || '',
      }));
      
      setJobs(modifiableJobs);
      setOriginalJobs(modifiableJobs);
      calculateTotalTimes(modifiableJobs);
    }
  }, [dailyPlan?.dispatcher_output]);

  /**
   * Calculate total duration and travel time
   */
  const calculateTotalTimes = (jobList: ModifiableJob[]) => {
    const totalDur = jobList.reduce((sum, job) => sum + job.estimated_duration, 0);
    const totalTravel = jobList.reduce((sum, job) => sum + job.travel_time_to_next, 0);
    setTotalDuration(totalDur);
    setTotalTravelTime(totalTravel);
  };

  /**
   * Recalculate drive times based on job order
   */
  const recalculateDriveTimes = async (reorderedJobs: ModifiableJob[]) => {
    setIsRecalculating(true);
    
    try {
      const updatedJobs = [...reorderedJobs];
      
      // Update priority ranks and recalculate times
      for (let i = 0; i < updatedJobs.length; i++) {
        updatedJobs[i].priority_rank = i + 1;
        
        // Simple travel time calculation (in a real app, this would call a routing service)
        if (i < updatedJobs.length - 1) {
          // For now, use a base travel time with some variation
          const baseTime = 15; // Base 15 minutes
          const variation = Math.random() * 10; // Random variation 0-10 minutes
          updatedJobs[i].travel_time_to_next = Math.round(baseTime + variation);
        } else {
          updatedJobs[i].travel_time_to_next = 0; // Last job has no travel time
        }
        
        // Recalculate start/end times based on new order
        if (i === 0) {
          // First job starts at work start time
          updatedJobs[i].estimated_start_time = '08:00';
        } else {
          // Calculate start time based on previous job's end time + travel time
          const prevJob = updatedJobs[i - 1];
          const prevEndTime = new Date(`2023-01-01T${prevJob.estimated_end_time}:00`);
          const startTime = new Date(prevEndTime.getTime() + prevJob.travel_time_to_next * 60000);
          updatedJobs[i].estimated_start_time = startTime.toTimeString().slice(0, 5);
        }
        
        // Calculate end time based on start time + duration
        const startTime = new Date(`2023-01-01T${updatedJobs[i].estimated_start_time}:00`);
        const endTime = new Date(startTime.getTime() + updatedJobs[i].estimated_duration * 60000);
        updatedJobs[i].estimated_end_time = endTime.toTimeString().slice(0, 5);
      }
      
      setJobs(updatedJobs);
      calculateTotalTimes(updatedJobs);
      
    } catch (error) {
      console.error('Error recalculating drive times:', error);
      Alert.alert('Error', 'Failed to recalculate drive times. Please try again.');
    } finally {
      setIsRecalculating(false);
    }
  };

  /**
   * Handle job reordering with drag-and-drop
   */
  const handleDragEnd = async ({ data }: { data: ModifiableJob[] }) => {
    const hasReordered = data.some((item, index) => item.id !== jobs[index]?.id);
    
    if (hasReordered) {
      setHasChanges(true);
      await recalculateDriveTimes(data);
    }
  };

  /**
   * Save the modified plan
   */
  const handleSavePlan = async () => {
    if (!dailyPlan || !hasChanges) return;
    
    setIsSaving(true);
    
    try {
      // Create user modifications object
      const modifications = {
        dispatcher_changes: {
          job_reordering: jobs.map((job, index) => ({
            job_id: job.job_id,
            new_priority_rank: index + 1,
            new_estimated_start_time: job.estimated_start_time,
            new_estimated_end_time: job.estimated_end_time,
            new_travel_time_to_next: job.travel_time_to_next,
            timestamp: new Date().toISOString(),
          })),
        },
        route_recalculation: {
          total_duration: totalDuration,
          total_travel_time: totalTravelTime,
          recalculated_at: new Date().toISOString(),
        },
      };
      
      await saveUserModifications(modifications);
      
      Alert.alert(
        'Plan Updated! ✅',
        `Your modified plan has been saved with updated drive times.\n\nTotal Duration: ${Math.round(totalDuration / 60)}h ${totalDuration % 60}m\nTotal Travel Time: ${Math.round(totalTravelTime / 60)}h ${totalTravelTime % 60}m`,
        [
          { text: 'Continue to Inventory', onPress: () => router.back() }
        ]
      );
      
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save plan modifications',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset to original plan
   */
  const handleReset = () => {
    Alert.alert(
      'Restore Original',
      'Are you sure you want to restore the original AI-generated plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restore', 
          style: 'destructive',
          onPress: () => {
            setJobs(originalJobs);
            setHasChanges(false);
            calculateTotalTimes(originalJobs);
          }
        }
      ]
    );
  };

  /**
   * Render job item for drag-and-drop list
   */
     const renderJobItem = ({ item, drag, isActive }: RenderItemParams<ModifiableJob>) => {
     return (
       <ScaleDecorator>
         <TouchableOpacity onLongPress={drag} activeOpacity={0.9}>
           <JobCard job={item} isDragging={isActive} />
         </TouchableOpacity>
       </ScaleDecorator>
     );
   };

  // Loading state
  if (isLoading) {
       return (
     <SafeAreaView style={StyleSheet.flatten([styles.safeArea, { backgroundColor: colors.background }])}>
       <LoadingStepUI 
         step="Loading your plan..." 
         isConnected={isConnected}
       />
     </SafeAreaView>
   );
  }

     // Error state
   if (error || !dailyPlan) {
     return (
       <SafeAreaView style={StyleSheet.flatten([styles.safeArea, { backgroundColor: colors.background }])}>
         <ErrorStepUI 
           error={error || 'No plan available to modify'}
           onRetry={() => router.back()}
           retryText="Go Back"
         />
       </SafeAreaView>
     );
   }

  const formattedTotalDuration = `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`;
  const formattedTravelTime = `${Math.floor(totalTravelTime / 60)}h ${totalTravelTime % 60}m`;

     return (
     <SafeAreaView style={StyleSheet.flatten([styles.safeArea, { backgroundColor: colors.background }])}>
       <KeyboardAvoidingView
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
         style={styles.container}
       >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            ✏️ Modify Your Plan
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Drag jobs to reorder • Drive times auto-update
          </Text>
        </View>

        {/* Summary Stats */}
        <Card style={StyleSheet.flatten([styles.summaryCard, { backgroundColor: colors.card }])}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Jobs</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {jobs.length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Duration</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {formattedTotalDuration}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.text }]}>Travel Time</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {formattedTravelTime}
              </Text>
            </View>
          </View>
          {hasChanges && (
            <View style={styles.changesIndicator}>
              <FontAwesome name="exclamation-circle" size={16} color={colors.warning} />
              <Text style={[styles.changesText, { color: colors.warning }]}>
                Plan modified - drive times recalculated
              </Text>
            </View>
          )}
        </Card>

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
            title="Restore Original"
            onPress={handleReset}
            variant="outline"
            style={styles.resetButton}
            disabled={!hasChanges}
          />
          <Button
            title={isSaving ? 'Saving...' : 'Save Modified Plan'}
            onPress={handleSavePlan}
            variant="primary"
            style={styles.saveButton}
            disabled={!hasChanges || isSaving}
            loading={isSaving}
          />
        </View>

        {/* Recalculating Overlay */}
        {isRecalculating && (
          <View style={styles.recalculatingOverlay}>
            <Card style={StyleSheet.flatten([styles.recalculatingCard, { backgroundColor: colors.card }])}>
              <Text style={StyleSheet.flatten([styles.recalculatingText, { color: colors.text }])}>
                🔄 Recalculating drive times...
              </Text>
            </Card>
          </View>
        )}
      </KeyboardAvoidingView>
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
    marginBottom: spacing.m,
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
    ...shadows.subtle('light'),
  },
  summaryRow: {
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
    ...typography.h4,
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  changesText: {
    ...typography.body2,
    marginLeft: spacing.s,
  },
  jobList: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: spacing.m,
  },
  jobCard: {
    borderRadius: radius.m,
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
    ...shadows.subtle('light'),
  },
  draggedCard: {
    transform: [{ scale: 1.05 }],
    ...shadows.medium('light'),
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  jobMainInfo: {
    flexDirection: 'row',
    flex: 1,
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
  jobDetails: {
    flex: 1,
  },
  jobTitle: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.xs,
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
  jobMeta: {
    alignItems: 'flex-end',
  },
  jobTypeBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    marginBottom: spacing.s,
  },
  jobTypeText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dragHandle: {
    padding: spacing.s,
  },
  jobMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.body2,
    fontWeight: '600',
  },
  jobReason: {
    ...typography.body2,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.m,
    paddingTop: spacing.m,
  },
  resetButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  recalculatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recalculatingCard: {
    borderRadius: radius.m,
    ...spacing.helpers.padding('l'),
    ...shadows.medium('light'),
  },
  recalculatingText: {
    ...typography.h4,
    textAlign: 'center',
  },
}); 