import React, { useState, useEffect } from 'react';
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
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { QuickActionButton } from '@/components/QuickActionButton';
import { Button, Card, OptimisticStatusBar, BatchProgressBar, RetryManagementPanel } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useNavigation';

import { useTodaysPlan } from '@/hooks/useDailyPlan';

import { ProfileManager } from '@/services/profileManager';


export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { dailyPlan, isLoading: planLoading, refreshPlan } = useTodaysPlan();


  const [isDayStarted, setIsDayStarted] = useState(false);

  const { navigate } = useAppNavigation();

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
      return;
    }

    // Otherwise, navigate to Plan Your Day workflow
    navigate('/plan-your-day');
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
    navigate('/create-job');
  };

  const handleInventoryPress = () => {
    navigate('/inventory');
  };

  // Force refresh daily plan when screen comes into focus
  // This ensures the UI is always up-to-date after resets or other changes
  useFocusEffect(
    React.useCallback(() => {
      if (refreshPlan) {
        refreshPlan();
      }
    }, [refreshPlan])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Header
          title="TradeFlow"
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
          </View>

                     {/* Job Stats */}
           <View style={styles.statsContainer}>
             <Card style={styles.statCard}>
               <View style={styles.statIconContainer}>
                 <FontAwesome name="briefcase" size={16} color={colors.primary} />
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
                 <FontAwesome name="clock-o" size={16} color={colors.success} />
               </View>
               <Text style={[styles.statNumber, { color: colors.text }]}>
                 {dailyPlan?.total_estimated_duration ? `${Math.round(dailyPlan.total_estimated_duration / 60)}h` : '0h'}
               </Text>
               <Text style={[styles.statLabel, { color: colors.placeholder }]}>
                 Estimated Time
               </Text>
             </Card>
           </View>

           {/* Start My Day Button */}
           {!isDayStarted && dailyPlan?.status !== 'approved' ? (
             <Button
               variant="primary"
               onPress={handleStartDay}
               title={planLoading ? 'Loading...' : 'Plan & Start My Day'}
               style={styles.startDayButton}
               disabled={planLoading}
             />
           ) : null}

           {/* Today's Calendar */}
           <View style={styles.scheduleSection}>
                        <TouchableOpacity 
             style={styles.scheduleHeader}
             onPress={() => navigate('/calendar')}
             activeOpacity={0.7}
           >
             <Text style={[styles.scheduleTitle, { color: colors.text }]}>
               Today's Calendar
             </Text>
           </TouchableOpacity>
             
             <Card style={styles.scheduleCard}>
               {dailyPlan?.job_ids?.length ? (
                 <View style={styles.scheduleWithJobs}>
                   <Text style={[styles.scheduleStatus, { color: colors.success }]}>
                     {dailyPlan.status === 'approved' ? 
                       'Daily plan optimized and ready' : 
                       'AI planning in progress...'
                     }
                   </Text>
                   <Text style={[styles.scheduleDetails, { color: colors.placeholder }]}>
                     {dailyPlan.job_ids.length} jobs • {dailyPlan.total_estimated_duration ? `${Math.round(dailyPlan.total_estimated_duration / 60)}h` : 'Calculating'} estimated
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
                  New Job
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
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Optimistic Status Bar */}
        <OptimisticStatusBar position="bottom" />
        
        {/* Batch Progress Bar */}
        <BatchProgressBar position="bottom" detailed={true} />
        

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
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    ...spacing.helpers.padding('s'),
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
  scheduleSection: {
    marginBottom: spacing.l,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  scheduleTitle: {
    ...typography.h3,
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
  testSection: {
    marginBottom: spacing.l,
    ...spacing.helpers.padding('m'),
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: radius.m,
  },
  testTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  testSubtitle: {
    ...typography.caption,
    marginBottom: spacing.m,
  },
  testButtonContainer: {
    flexDirection: 'row',
    gap: spacing.s,
    flexWrap: 'wrap',
  },
  testButton: {
    flex: 1,
    minWidth: 100,
  },
  infoSection: {
    alignItems: 'center',
    marginTop: spacing.l,
  },
  infoText: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
