import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { Card, Button } from '@/components/ui';

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleAddJob = () => {
    Alert.alert('Add Job', 'This will open the add job modal');
  };

  const handleViewCalendar = () => {
    Alert.alert('Calendar View', 'This will show the calendar view');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Header
          title="Schedule"
          rightAction={{
            icon: 'plus',
            onPress: handleAddJob,
          }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Today's Overview */}
          <Card style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Text style={[styles.todayTitle, { color: colors.text }]}>
                Today's Schedule
              </Text>
              <Text style={[styles.todayDate, { color: colors.placeholder }]}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>

            <View style={styles.todayStats}>
              <View style={styles.statItem}>
                <FontAwesome name="briefcase" size={16} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.placeholder }]}>Jobs</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="clock-o" size={16} color={colors.success} />
                <Text style={[styles.statNumber, { color: colors.text }]}>0h</Text>
                <Text style={[styles.statLabel, { color: colors.placeholder }]}>Est. Time</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome name="map-marker" size={16} color={colors.accent} />
                <Text style={[styles.statNumber, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.placeholder }]}>Locations</Text>
              </View>
            </View>
          </Card>

          {/* Calendar View Button */}
          <Button
            variant="outline"
            onPress={handleViewCalendar}
            title="📅 View Calendar"
            style={styles.calendarButton}
          />

          {/* Upcoming Jobs */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Upcoming Jobs
            </Text>
            
            <Card style={styles.emptyCard}>
              <View style={styles.emptyState}>
                <FontAwesome name="calendar-o" size={48} color={colors.placeholder} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No jobs scheduled
                </Text>
                <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
                  Your schedule is clear. Add a new job to get started.
                </Text>
                <Button
                  variant="primary"
                  onPress={handleAddJob}
                  title="Add New Job"
                  style={styles.addButton}
                />
              </View>
            </Card>
          </View>

          {/* Recent Jobs */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Jobs
            </Text>
            
            <Card style={styles.recentCard}>
              <View style={styles.recentItem}>
                <FontAwesome name="circle" size={8} color={colors.placeholder} />
                <Text style={[styles.recentText, { color: colors.placeholder }]}>
                  No recent jobs
                </Text>
              </View>
            </Card>
          </View>
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
  todayCard: {
    ...spacing.helpers.padding('m'),
    marginBottom: spacing.m,
  },
  todayHeader: {
    marginBottom: spacing.m,
  },
  todayTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  todayDate: {
    ...typography.body,
  },
  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h3,
    marginVertical: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  calendarButton: {
    marginBottom: spacing.l,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
  },
  emptyCard: {
    ...spacing.helpers.padding('xl'),
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyDescription: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  addButton: {
    minWidth: 120,
  },
  recentCard: {
    ...spacing.helpers.padding('m'),
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  recentText: {
    ...typography.body,
    marginLeft: spacing.s,
  },
}); 