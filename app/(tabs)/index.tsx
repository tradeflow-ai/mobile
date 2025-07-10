import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius, touchTargets } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { QuickActionButton } from '@/components/QuickActionButton';
import { Button, Card } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useNavigation';

import { useInventory } from '@/hooks/useInventory';
import { useTodaysPlan } from '@/hooks/useDailyPlan';

import { userProfileAtom } from '@/store/atoms';
import { ProfileManager } from '@/services/profileManager';
import { MockAgentService } from '@/services/mockAgentService';


export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { data: inventoryItems = [] } = useInventory();
  const { dailyPlan, isLoading: planLoading } = useTodaysPlan();

  const [userProfile] = useAtom(userProfileAtom);

  const [isDayStarted, setIsDayStarted] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Automatically consider day started if we have an approved plan
  const isActuallyDayStarted = isDayStarted || dailyPlan?.status === 'approved';

  const { navigate } = useAppNavigation();

  // Refresh data when screen comes into focus (helps with reset)
  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    }, [])
  );

  // Get user's first name from ProfileManager
  const profileManager = ProfileManager.getInstance();
  const displayName = profileManager.getDisplayName();
  const firstName = displayName.split(' ')[0]; // Get first name only

  // Get dynamic greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good evening';
    } else {
      return 'Good evening';
    }
  };

    const handleStartDay = () => {
    // If there's already an approved plan, just start the day
    if (dailyPlan?.status === 'approved') {
      setIsDayStarted(true);
      setIsOnBreak(false);
      return;
    }
    
    // Otherwise, navigate to Plan Your Day workflow
    navigate('/plan-your-day');
  };

  const handleEndDay = () => {
    // Clear the daily plan and reset day state
    MockAgentService.clearTodaysPlan('mock-user-123');
    setIsDayStarted(false);
    setIsOnBreak(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTakeBreak = () => {
    setIsOnBreak(true);
  };

  const handleEndBreak = () => {
    setIsOnBreak(false);
  };

  /**
   * Handle Plan Your Day navigation
   * Opens the complete AI-powered daily planning workflow
   */
  const handlePlanYourDay = () => {
    navigate('/plan-your-day');
  };

  const quickActions = [
    {
      id: 'inventory',
      title: 'Inventory',
      icon: 'list',
      onPress: () => navigate('/inventory'),
    },
    {
      id: 'map',
      title: 'Map',
      icon: 'map',
      onPress: () => navigate('/map'),
    },
    {
      id: 'add-item',
      title: 'Add Item',
      icon: 'plus',
      onPress: () => Alert.alert('Add Item', 'This will open the add item modal'),
    },
  ];

  const handleAddNewJob = () => {
    Alert.alert('Add New Job', 'This will open the add job modal');
  };

  const handleInventoryPress = () => {
    navigate('/inventory');
  };

  const handleResetPlan = () => {
    Alert.alert(
      'Reset Daily Plan',
      'This will clear your current daily plan and allow you to plan again. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            MockAgentService.clearTodaysPlan('mock-user-123');
            // Force refresh of this screen
            setRefreshTrigger(prev => prev + 1);
            // Force a small delay to allow state to update
            setTimeout(() => {
              Alert.alert('Plan Reset', 'Your daily plan has been cleared. You can now plan your day again.');
            }, 100);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Header
          title="TradeFlow"
          rightAction={{
            icon: 'bell',
            onPress: () => Alert.alert('Notifications', 'No new notifications'),
          }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>
              {getTimeBasedGreeting()}, {firstName}
            </Text>
            <Text style={[styles.greetingSubtitle, { color: colors.placeholder }]}>
              Ready to start your day?
            </Text>
          </View>

                     {/* Job Stats */}
           <View style={styles.statsContainer}>
             <Card style={styles.statCard}>
               <View style={styles.statIconContainer}>
                 <FontAwesome name="briefcase" size={20} color={colors.primary} />
               </View>
               <Text style={[styles.statNumber, { color: colors.text }]}>
                 {dailyPlan?.job_ids?.length || 0}
               </Text>
               <Text style={[styles.statLabel, { color: colors.placeholder }]}>
                 Today's Jobs
               </Text>
             </Card>
             
             <Card style={styles.statCard}>
               <View style={styles.statIconContainer}>
                 <FontAwesome name="clock-o" size={20} color={colors.success} />
               </View>
               <Text style={[styles.statNumber, { color: colors.text }]}>
                 {(dailyPlan as any)?.total_estimated_duration ? `${Math.round((dailyPlan as any).total_estimated_duration / 60)}h` : '0h'}
               </Text>
               <Text style={[styles.statLabel, { color: colors.placeholder }]}>
                 Estimated Time
               </Text>
             </Card>
           </View>

           {/* Start My Day Button - Only show if no approved plan */}
           {!isActuallyDayStarted && (
             <Button
               variant="primary"
               onPress={handleStartDay}
               title={
                 planLoading ? 'Loading...' :
                 dailyPlan?.status === 'approved' ? '▶ Start My Day' : 
                 '🧠 Plan & Start My Day'
               }
               style={styles.startDayButton}
               disabled={planLoading}
             />
           )}

           {/* Today's Calendar */}
           <View style={styles.scheduleSection}>
             <View style={styles.scheduleHeader}>
               <TouchableOpacity 
                 style={styles.scheduleHeaderLeft}
                 onPress={() => navigate('/calendar')}
                 activeOpacity={0.7}
               >
                 <Text style={[styles.scheduleTitle, { color: colors.text }]}>
                   Today's Calendar
                 </Text>
                 <View style={styles.scheduleHeaderRight}>
                   <Text style={[styles.scheduleCount, { color: colors.placeholder }]}>
                     {dailyPlan?.job_ids?.length || 0} jobs
                   </Text>
                   <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
                 </View>
               </TouchableOpacity>
               {dailyPlan?.status === 'approved' && (
                 <TouchableOpacity 
                   style={styles.resetButton}
                   onPress={handleResetPlan}
                   activeOpacity={0.7}
                 >
                   <FontAwesome name="refresh" size={16} color={colors.primary} />
                 </TouchableOpacity>
               )}
             </View>
             
             <Card style={styles.scheduleCard}>
               {dailyPlan?.job_ids?.length ? (
                 <View style={styles.scheduleWithJobs}>
                   <Text style={[styles.scheduleStatus, { color: colors.success }]}>
                     {dailyPlan.status === 'approved' ? 
                       '✓ Daily plan optimized and ready' : 
                       '🧠 AI planning in progress...'
                     }
                   </Text>
                   <Text style={[styles.scheduleDetails, { color: colors.placeholder }]}>
                     {dailyPlan.job_ids.length} jobs • {(dailyPlan as any)?.total_estimated_duration ? `${Math.round((dailyPlan as any).total_estimated_duration / 60)}h` : 'Calculating'} estimated
                   </Text>
                 </View>
               ) : (
               <View style={styles.emptySchedule}>
                 <FontAwesome name="calendar-o" size={24} color={colors.placeholder} />
                 <Text style={[styles.emptyScheduleText, { color: colors.placeholder }]}>
                   No jobs scheduled for today
                 </Text>
               </View>
               )}
               <TouchableOpacity 
                 onPress={() => navigate('/calendar')} 
                 style={[
                   styles.viewFullSchedule,
                   { borderTopColor: colors.border }
                 ]}
               >
                 <Text style={[styles.viewFullScheduleText, { color: colors.primary }]}>
                   View Full Calendar
                 </Text>
               </TouchableOpacity>
             </Card>
           </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={[
                styles.quickAction, 
                { 
                  backgroundColor: colors.card,
                  ...shadows.subtle(colorScheme)
                }
              ]} 
              onPress={handleAddNewJob}
            >
              <View style={[
                styles.quickActionIcon,
                { backgroundColor: colors.background }
              ]}>
                <FontAwesome name="plus" size={20} color={colors.primary} />
              </View>
              <View style={styles.quickActionContent}>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  Add New Job
                </Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.placeholder }]}>
                  Create a new work order
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.quickAction, 
                { 
                  backgroundColor: colors.card,
                  ...shadows.subtle(colorScheme)
                }
              ]} 
              onPress={handleInventoryPress}
            >
              <View style={[
                styles.quickActionIcon,
                { backgroundColor: colors.background }
              ]}>
                <FontAwesome name="archive" size={20} color={colors.primary} />
              </View>
              <View style={styles.quickActionContent}>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  Inventory
                </Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.placeholder }]}>
                  Manage your supplies
                </Text>
              </View>
            </TouchableOpacity>
          </View>



          {/* Recent Activity */}
          <Card style={styles.recentCard}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>
              Recent Activity
            </Text>
            <View style={styles.recentItem}>
              <FontAwesome name="circle" size={8} color={colors.placeholder} />
              <Text style={[styles.recentText, { color: colors.placeholder }]}>
                No recent activity
              </Text>
            </View>
          </Card>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  greetingSection: {
    marginBottom: spacing.l,
  },
  greetingTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  greetingSubtitle: {
    ...typography.body,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
  },
  statNumber: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  startDayButton: {
    marginBottom: spacing.l,
  },
  dayButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  dayButtonLeft: {
    flex: 1,
  },
  dayButtonRight: {
    flex: 1,
  },
  scheduleSection: {
    marginBottom: spacing.l,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  scheduleHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  resetButton: {
    ...touchTargets.styles.minimum,
    ...spacing.helpers.padding('xs'),
    marginLeft: spacing.s,
  },
  scheduleTitle: {
    ...typography.h3,
  },
  scheduleCount: {
    ...typography.caption,
  },
  scheduleCard: {
    ...spacing.helpers.padding('m'),
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyScheduleText: {
    ...typography.body,
    marginTop: spacing.s,
    textAlign: 'center',
  },
  viewFullSchedule: {
    alignItems: 'center',
    paddingTop: spacing.m,
    borderTopWidth: 1,
  },
  viewFullScheduleText: {
    ...typography.h4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  quickAction: {
    flex: 1,
    borderRadius: radius.m,
    ...spacing.helpers.padding('m'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  quickActionSubtitle: {
    ...typography.caption,
  },
  recentCard: {
    ...spacing.helpers.padding('m'),
  },
  recentTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  recentContent: {
    flex: 1,
    marginLeft: spacing.s,
  },
  recentText: {
    ...typography.body,
    marginBottom: spacing.xs,
    marginLeft: spacing.s,
  },
  recentTime: {
    ...typography.caption,
  },
  scheduleWithJobs: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  scheduleStatus: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  scheduleDetails: {
    ...typography.caption,
  },

});
