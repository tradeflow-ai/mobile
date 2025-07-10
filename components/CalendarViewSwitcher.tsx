import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows, touchTargets } from '@/constants/Theme';
import { CalendarView } from './Calendar';

interface CalendarViewSwitcherProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  selectedDate: Date;
  onPreviousDate: () => void;
  onNextDate: () => void;
}

export const CalendarViewSwitcher: React.FC<CalendarViewSwitcherProps> = ({
  currentView,
  onViewChange,
  selectedDate,
  onPreviousDate,
  onNextDate,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getDateRangeText = (): string => {
    switch (currentView) {
      case 'day':
        return selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      case 'agenda':
        return 'Upcoming Schedule';
      case 'month':
        return selectedDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
      default:
        return '';
    }
  };

  // Don't render anything for agenda view
  if (currentView === 'agenda') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Date Navigation */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: colors.card },
            shadows.subtle(colorScheme)
          ]}
          onPress={onPreviousDate}
        >
          <FontAwesome name="chevron-left" size={16} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.dateRange}>
          <Text style={[styles.dateRangeText, { color: colors.text }]}>
            {getDateRangeText()}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: colors.card },
            shadows.subtle(colorScheme)
          ]}
          onPress={onNextDate}
        >
          <FontAwesome name="chevron-right" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...spacing.helpers.padding('m'),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.m,
    ...touchTargets.styles.minimum,
  },
  dateRange: {
    flex: 1,
    alignItems: 'center',
    ...spacing.helpers.marginHorizontal('m'),
  },
  dateRangeText: {
    ...typography.h3,
    textAlign: 'center',
  },
}); 