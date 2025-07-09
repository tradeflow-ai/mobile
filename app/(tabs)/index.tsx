import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { QuickActionButton } from '@/components/QuickActionButton';
import { Button, Card } from '@/components/ui';
import { useAppNavigation } from '@/hooks/useNavigation';
import { inventoryItemsAtom, userProfileAtom } from '@/store/atoms';
import { ProfileManager } from '@/services/profileManager';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [inventoryItems] = useAtom(inventoryItemsAtom);
  const [userProfile] = useAtom(userProfileAtom);
  const [isDayStarted, setIsDayStarted] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);

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
    setIsDayStarted(true);
    setIsOnBreak(false);
  };

  const handleEndDay = () => {
    setIsDayStarted(false);
    setIsOnBreak(false);
  };

  const handleTakeBreak = () => {
    setIsOnBreak(true);
  };

  const handleEndBreak = () => {
    setIsOnBreak(false);
  };

  // ========================================
  // JEREMIAH'S TEMPORARY CODE - START
  // This function calls the backend LangGraph service to avoid React Native compatibility issues
  // TODO: Josh to redesign this as part of the proper "Plan Your Day" UI flow
  // ========================================
  const handlePlanYourDay = async () => {
    try {
      // Import Jeremiah's agent service for backend communication
      const { AgentService } = await import('../../services/agentService');
      
      Alert.alert('Planning Your Day', 'AI Agent workflow starting...', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: async () => {
            try {
              // Check if backend is healthy first
              const isHealthy = await AgentService.checkHealth();
              if (!isHealthy) {
                Alert.alert('Error', 'Backend service is not available. Please start Docker containers:\n\ndocker-compose up langgraph-backend');
                return;
              }
              
              // Call backend API instead of running LangGraph directly in React Native
              const result = await AgentService.planDay(
                'test-user-123',
                ['job-1', 'job-2', 'job-3'],
                new Date().toISOString().split('T')[0]
              );
              
              if (result.success) {
                Alert.alert('Success!', `Daily plan created: ${result.planId}\nStatus: ${result.currentStep || result.status}`);
              } else {
                Alert.alert('Error', `Agent workflow failed: ${result.error}`);
              }
            } catch (error) {
              Alert.alert('Error', `Agent workflow failed: ${error.message}`);
            }
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', `Failed to start planning: ${error.message}`);
    }
  };
  // ========================================
  // JEREMIAH'S TEMPORARY CODE - END
  // ========================================

<!--   const handleViewFullSchedule = () => {
    Alert.alert('Full Schedule', 'This will show the complete schedule view');
  }; -->
  const quickActions = [
    // JEREMIAH'S TEMPORARY CODE: Plan Your Day button for testing backend integration
    {
      id: 'plan-day',
      title: 'Plan Your Day',
      icon: 'calendar',
      onPress: handlePlanYourDay,
    },
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
                 0
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
                 0h
               </Text>
               <Text style={[styles.statLabel, { color: colors.placeholder }]}>
                 Estimated Time
               </Text>
             </Card>
           </View>

           {/* Start My Day Button */}
           {!isDayStarted ? (
             <Button
               variant="primary"
               onPress={handleStartDay}
               title="▶ Start My Day"
               style={styles.startDayButton}
             />
           ) : (
             <View style={styles.dayButtonsContainer}>
               <Button
                 variant="primary"
                 onPress={handleEndDay}
                 title="End Day"
                 style={styles.dayButtonLeft}
               />
               <Button
                 variant="primary"
                 onPress={isOnBreak ? handleEndBreak : handleTakeBreak}
                 title={isOnBreak ? 'End Break' : 'Take Break'}
                 style={styles.dayButtonRight}
               />
             </View>
           )}

           {/* Today's Schedule */}
           <View style={styles.scheduleSection}>
             <View style={styles.scheduleHeader}>
               <Text style={[styles.scheduleTitle, { color: colors.text }]}>
                 Today's Schedule
               </Text>
               <Text style={[styles.scheduleCount, { color: colors.placeholder }]}>
                 0 jobs
               </Text>
             </View>
             
             <Card style={styles.scheduleCard}>
               <View style={styles.emptySchedule}>
                 <FontAwesome name="calendar-o" size={24} color={colors.placeholder} />
                 <Text style={[styles.emptyScheduleText, { color: colors.placeholder }]}>
                   No jobs scheduled for today
                 </Text>
               </View>
               <TouchableOpacity 
                 onPress={handleViewFullSchedule} 
                 style={[
                   styles.viewFullSchedule,
                   { borderTopColor: colors.border }
                 ]}
               >
                 <Text style={[styles.viewFullScheduleText, { color: colors.primary }]}>
                   View Full Schedule
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
    ...typography.h1,
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
});
