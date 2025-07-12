/**
 * TradeFlow Mobile App - Native-Style Date Picker
 * 
 * A clean, iOS-style calendar component for date selection that matches
 * the native iOS calendar design with month navigation and day selection.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, touchTargets } from '@/constants/Theme';

interface NativeDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  containerStyle?: ViewStyle;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const NativeDatePicker: React.FC<NativeDatePickerProps> = ({
  selectedDate,
  onDateChange,
  containerStyle,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onDateChange(newDate);
  };

  const isSelectedDay = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const calendarDays = generateCalendarDays();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }, containerStyle]}>
      {/* Header with month/year navigation */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handlePreviousMonth}
          style={[styles.navButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <FontAwesome name="chevron-left" size={16} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.monthYearContainer}>
          <Text style={[styles.monthYear, { color: colors.text }]}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={handleNextMonth}
          style={[styles.navButton, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <FontAwesome name="chevron-right" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day names header */}
      <View style={styles.dayNamesContainer}>
        {DAY_NAMES.map((dayName) => (
          <View key={dayName} style={styles.dayNameCell}>
            <Text style={[styles.dayName, { color: colors.placeholder }]}>
              {dayName}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
              <View key={`${weekIndex}-${dayIndex}`} style={styles.dayCell}>
                {day && (
                  <TouchableOpacity
                    onPress={() => handleDayPress(day)}
                    style={[
                      styles.dayButton,
                      isSelectedDay(day) && [styles.selectedDay, { backgroundColor: colors.primary }],
                      isToday(day) && !isSelectedDay(day) && [styles.todayDay, { borderColor: colors.primary }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.text },
                        isSelectedDay(day) && [styles.selectedDayText, { color: colors.background }],
                        isToday(day) && !isSelectedDay(day) && [styles.todayDayText, { color: colors.primary }],
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.m,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
    borderBottomWidth: 1,
  },
  navButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.s,
    borderWidth: 1,
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYear: {
    ...typography.h4,
    fontWeight: '600',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.s,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  calendarGrid: {
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    // backgroundColor set dynamically
  },
  todayDay: {
    borderWidth: 2,
  },
  dayText: {
    ...typography.body,
    fontWeight: '500',
    fontSize: 16,
  },
  selectedDayText: {
    fontWeight: '600',
  },
  todayDayText: {
    fontWeight: '600',
  },
}); 