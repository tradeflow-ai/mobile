/**
 * TradeFlow Mobile App - Start Planning UI Component
 * 
 * Displays the initial state when no daily plan exists, allowing users to
 * begin the AI-powered planning workflow. Shows available jobs and provides
 * a clear entry point to start planning.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { typography, spacing, radius, touchTargets } from '@/constants/Theme';
import type { JobLocation } from '@/hooks/useJobs';

interface StartPlanningUIProps {
  /**
   * Function to call when user starts planning
   */
  onStartPlanning: () => void;
  
  /**
   * Available jobs for planning
   */
  availableJobs: JobLocation[];
  
  /**
   * Whether the planning process is starting
   * @default false
   */
  isStarting?: boolean;
}

export const StartPlanningUI: React.FC<StartPlanningUIProps> = ({
  onStartPlanning,
  availableJobs,
  isStarting = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isJobsExpanded, setIsJobsExpanded] = useState(false);

  // If no jobs available, show empty state
  if (availableJobs.length === 0) {
    return (
      <EmptyState
        icon="calendar-o"
        title="No Jobs to Plan"
        description="You need at least one pending job to create a daily plan. Add some jobs first."
        createButtonText="Add Job"
      />
    );
  }

  // Determine which jobs to display
  const displayJobs = isJobsExpanded ? availableJobs : availableJobs.slice(0, 3);
  const hasMoreJobs = availableJobs.length > 3;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <FontAwesome 
              name="magic" 
              size={28} 
              color={colors.background}
            />
          </View>
          
          <View style={styles.headerText}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              Ready to Plan Your Day?
            </Text>
            <Text style={[styles.subtitleText, { color: colors.secondary }]}>
              Our AI agents will analyze your jobs, optimize your route, and check your inventory.
            </Text>
          </View>
        </View>
      </Card>

      {/* Jobs Summary Card */}
      <Card style={styles.jobsCard}>
        <View style={styles.jobsHeader}>
          <Text style={[styles.jobsTitle, { color: colors.text }]}>
            Jobs Ready for Planning
          </Text>
          <View style={styles.jobsCount}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {availableJobs.length}
            </Text>
          </View>
        </View>

        <View style={styles.jobsList}>
          {displayJobs.map((job) => (
            <View key={job.id} style={styles.jobItem}>
              <View style={styles.jobContent}>
                <Text style={[styles.jobTitle, { color: colors.text }]}>
                  {job.title}
                </Text>
                <Text style={[styles.jobAddress, { color: colors.secondary }]}>
                  {job.address}
                </Text>
              </View>
              
              <View style={[styles.priorityBadge, { 
                 backgroundColor: job.priority === 'high' ? colors.error : 
                                job.priority === 'medium' ? colors.warning : colors.success 
               }]}>
                 <Text style={[styles.priorityText, { color: colors.background }]}>
                   {job.priority.toUpperCase()}
                 </Text>
               </View>
            </View>
          ))}
          
          {hasMoreJobs && (
            <TouchableOpacity
              style={styles.moreJobsButton}
              onPress={() => setIsJobsExpanded(!isJobsExpanded)}
              activeOpacity={0.7}
            >
              <Text style={[styles.moreJobsText, { color: colors.secondary }]}>
                {isJobsExpanded ? 'Show less' : `+${availableJobs.length - 3} more jobs`}
              </Text>
              <FontAwesome 
                name={isJobsExpanded ? "chevron-up" : "chevron-down"} 
                size={12} 
                color={colors.secondary}
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* What Happens Next Card */}
      <Card style={styles.processCard}>
        <View style={styles.processHeader}>
          <FontAwesome 
            name="cogs" 
            size={20} 
            color={colors.primary}
            style={styles.processIcon}
          />
          <Text style={[styles.processTitle, { color: colors.text }]}>
            What Happens Next
          </Text>
        </View>

        <View style={styles.processSteps}>
          <View style={styles.processStep}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: colors.background }]}>
                1
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Job Prioritization
              </Text>
              <Text style={[styles.stepDescription, { color: colors.secondary }]}>
                AI analyzes urgency, location, and constraints
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: colors.background }]}>
                2
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Route Optimization
              </Text>
              <Text style={[styles.stepDescription, { color: colors.secondary }]}>
                Calculates the most efficient travel path
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: colors.background }]}>
                3
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Inventory Check
              </Text>
              <Text style={[styles.stepDescription, { color: colors.secondary }]}>
                Verifies parts and creates shopping list
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Start Planning Button */}
      <View style={styles.actionContainer}>
        <Button
          title={isStarting ? 'Starting AI Planning...' : 'Start Planning My Day'}
          onPress={onStartPlanning}
          variant="primary"
          disabled={isStarting}
          style={styles.startButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...spacing.helpers.padding('l'),
  },
  headerCard: {
    marginBottom: spacing.l,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
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
  jobsCard: {
    marginBottom: spacing.l,
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
  jobsCount: {
    backgroundColor: 'rgba(244, 164, 96, 0.2)',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.full,
  },
  countText: {
    ...typography.h4,
    fontWeight: 'bold',
  },
  jobsList: {
    gap: spacing.m,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobContent: {
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
  moreJobsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.s,
    ...spacing.helpers.padding('s'),
  },
  moreJobsText: {
    ...typography.caption,
    fontStyle: 'italic',
    marginRight: spacing.xs,
  },
  chevronIcon: {
    opacity: 0.7,
  },
  processCard: {
    marginBottom: spacing.l,
  },
  processHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  processIcon: {
    marginRight: spacing.s,
  },
  processTitle: {
    ...typography.h3,
  },
  processSteps: {
    gap: spacing.m,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  stepNumberText: {
    ...typography.body,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.caption,
    lineHeight: 16,
  },
  actionContainer: {
    marginTop: spacing.l,
    marginBottom: spacing.xl,
  },
  startButton: {
    // Button styles are handled by the Button component
  },
}); 