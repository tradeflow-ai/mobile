import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { spacing } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { TabSelector, TabOption } from '@/components/ui';
import { Calendar, CalendarView } from '@/components/Calendar';
import { JobLocation } from '@/hooks/useJobs';
import { useAppNavigation } from '@/hooks/useNavigation';

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { navigate } = useAppNavigation();

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');

  // View options for TabSelector - Apple Calendar order
  const viewOptions: TabOption[] = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'agenda', label: 'List' },
  ];

  const handleAddJob = () => {
    navigate('/create-job');
  };

  const handleJobPress = (job: JobLocation) => {
    navigate('/job-details');
  };

  const handleTimeSlotPress = (date: Date, hour: number) => {
    // Navigate to create job with pre-filled date and time
    navigate('/create-job');
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
  };

  const handleTabSelectorChange = (key: string) => {
    setCurrentView(key as CalendarView);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Header
            title="Schedule"
            rightAction={{
              icon: 'plus',
              onPress: handleAddJob,
            }}
          />
        </View>

        {/* View Selector */}
        <View style={styles.viewSelectorContainer}>
          <TabSelector
            options={viewOptions}
            selectedKey={currentView}
            onSelectionChange={handleTabSelectorChange}
            containerStyle={styles.viewSelector}
          />
        </View>

        {/* Calendar Content */}
        <Calendar
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onJobPress={handleJobPress}
          onTimeSlotPress={handleTimeSlotPress}
          view={currentView}
          onViewChange={handleViewChange}
        />
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
    ...spacing.helpers.paddingVertical('m'),
  },
  headerContainer: {
    ...spacing.helpers.paddingHorizontal('m'),
  },
  viewSelectorContainer: {
    ...spacing.helpers.paddingHorizontal('m'),
    marginBottom: spacing.m,
  },
  viewSelector: {
    // Custom styles for view selector if needed
  },
});