import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius, touchTargets } from '@/constants/Theme';
import { useJobsForDateRange, JobLocation } from '@/hooks/useJobs';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

interface CalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onJobPress?: (job: JobLocation) => void;
  onTimeSlotPress?: (date: Date, hour: number) => void;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

interface DayData {
  date: Date;
  jobs: JobLocation[];
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

interface EventPosition {
  job: JobLocation;
  top: number;
  height: number;
  left: number;
  width: number;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateChange,
  onJobPress,
  onTimeSlotPress,
  view,
  onViewChange,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Calculate date range based on current view
  const getDateRange = () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (view) {
      case 'day':
        startDate = new Date(selectedDate);
        endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(selectedDate);
        startDate.setDate(selectedDate.getDate() - selectedDate.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        // Get first day of next month
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
        // Go back to last day of current month plus buffer for calendar grid
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()) + 1); // End on Saturday
        break;
      case 'agenda':
        // Show jobs for next 30 days
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        break;
      default:
        startDate = new Date(selectedDate);
        endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  
  // Get jobs for the calculated date range
  const { data: allJobs = [] } = useJobsForDateRange(startDate, endDate);

  // Constants for timeline layout
  const HOUR_HEIGHT = 60;
  const TIME_LABEL_WIDTH = 80;
  const START_HOUR = 0; // Midnight
  const END_HOUR = 23; // 11 PM
  const TOTAL_HOURS = END_HOUR - START_HOUR + 1; // 24 hours



  // Refs for week view synchronized scrolling
  const headerScrollRef = useRef<ScrollView>(null);
  const eventsScrollRef = useRef<ScrollView>(null);
  
  // Refs for day/week timeline auto-scrolling
  const dayTimelineScrollRef = useRef<ScrollView>(null);
  const weekTimelineScrollRef = useRef<ScrollView>(null);
  
  // Prevent scroll synchronization feedback loops
  const isScrollingSynced = useRef(false);
  const lastScrollX = useRef(0);



  // Generate week days for week view
  const generateWeekDays = (date: Date): DayData[] => {
    const days: DayData[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      const dayJobs = allJobs.filter(job => {
        if (!job.scheduled_start) return false;
        const jobDate = new Date(job.scheduled_start);
        return jobDate.toDateString() === day.toDateString();
      });
      
      days.push({
        date: day,
        jobs: dayJobs,
        isToday: isToday(day),
        isSelected: day.toDateString() === selectedDate.toDateString(),
        isCurrentMonth: day.getMonth() === date.getMonth(),
        isWeekend: isWeekend(day)
      });
    }
    
    return days;
  };

  // Auto-scroll effects for day and week views
  useEffect(() => {
    if (view === 'day') {
      const dayJobs = allJobs.filter(job => {
        if (!job.scheduled_start) return false;
        const jobDate = new Date(job.scheduled_start);
        return jobDate.toDateString() === selectedDate.toDateString();
      });
      
      const scrollPosition = getOptimalScrollPosition(dayJobs);
      setTimeout(() => {
        dayTimelineScrollRef.current?.scrollTo({ 
          y: scrollPosition, 
          animated: true 
        });
      }, 100);
    }
  }, [selectedDate, view, allJobs]);

  useEffect(() => {
    if (view === 'week') {
      const multiWeekDays = generateMultipleWeekDays(selectedDate);
      const allWeekJobs = multiWeekDays.flatMap(day => day.jobs);
      const scrollPosition = getOptimalScrollPosition(allWeekJobs);
      setTimeout(() => {
        weekTimelineScrollRef.current?.scrollTo({ 
          y: scrollPosition, 
          animated: true 
        });
      }, 100);
    }
  }, [selectedDate, view, allJobs]);



  // Helper function to get colors (same for all entries)
  const getPriorityColor = (priority: string) => {
    // All entries use the same color regardless of priority
    return { bg: colors.primary + '20', border: colors.primary }; // 20% opacity for all
  };

  // Helper functions
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Format time for display (Apple style)
  const formatTimeForDisplay = (timeString: string): string => {
    const time = new Date(timeString);
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
    return `${displayHours}${displayMinutes} ${period}`;
  };

  // Check if two events overlap
  const eventsOverlap = (event1: JobLocation, event2: JobLocation): boolean => {
    if (!event1.scheduled_start || !event1.scheduled_end || !event2.scheduled_start || !event2.scheduled_end) {
      return false;
    }
    
    const start1 = new Date(event1.scheduled_start);
    const end1 = new Date(event1.scheduled_end);
    const start2 = new Date(event2.scheduled_start);
    const end2 = new Date(event2.scheduled_end);
    
    return start1 < end2 && start2 < end1;
  };

  // Calculate event positions with overlap handling
  const calculateEventPositions = (jobs: JobLocation[], dayWidth: number = SCREEN_WIDTH - TIME_LABEL_WIDTH): EventPosition[] => {
    const positions: EventPosition[] = [];
    const processed = new Set<string>();
    
    jobs.forEach((job, index) => {
      if (processed.has(job.id)) return;
      
      // Find all overlapping events
      const overlappingEvents = [job];
      for (let i = index + 1; i < jobs.length; i++) {
        if (eventsOverlap(job, jobs[i])) {
          overlappingEvents.push(jobs[i]);
        }
      }
      
      // Calculate positions for overlapping events
      overlappingEvents.forEach((overlappingJob, overlappingIndex) => {
        if (processed.has(overlappingJob.id)) return;
        
        const basePosition = calculateSingleEventPosition(overlappingJob, dayWidth);
        const eventWidth = Math.floor((dayWidth - 16) / overlappingEvents.length);
        const eventLeft = Math.floor(8 + (overlappingIndex * eventWidth));
        
        positions.push({
          ...basePosition,
          width: Math.floor(eventWidth - 4), // Small gap between events
          left: eventLeft,
        });
        
        processed.add(overlappingJob.id);
      });
    });
    
    return positions;
  };

  // Calculate single event position (helper function)
  const calculateSingleEventPosition = (job: JobLocation, dayWidth: number): EventPosition => {
    if (!job.scheduled_start) {
      return { job, top: 0, height: 40, left: 0, width: dayWidth - 20 };
    }

    const startTime = new Date(job.scheduled_start);
    let endTime: Date;
    
    // If no scheduled_end, calculate it from start time + estimated duration
    if (job.scheduled_end) {
      endTime = new Date(job.scheduled_end);
    } else {
      endTime = new Date(startTime.getTime() + (job.estimated_duration || 60) * 60 * 1000);
    }
    
    // Calculate position relative to timeline
    const startHourFloat = startTime.getHours() + startTime.getMinutes() / 60;
    const endHourFloat = endTime.getHours() + endTime.getMinutes() / 60;
    const duration = endHourFloat - startHourFloat;
    
    // Position from top of timeline
    const top = Math.floor((startHourFloat - START_HOUR) * HOUR_HEIGHT);
    const height = Math.max(Math.floor(duration * HOUR_HEIGHT), Math.floor(0.5 * HOUR_HEIGHT)); // Minimum 30 minutes
    
    return {
      job,
      top,
      height,
      left: 8,
      width: Math.floor(dayWidth - 16)
    };
  };

  // Get current time indicator position
  const getCurrentTimePosition = (): number => {
    const now = new Date();
    const currentHourFloat = now.getHours() + now.getMinutes() / 60;
    return Math.floor((currentHourFloat - START_HOUR) * HOUR_HEIGHT);
  };

  // Calculate optimal scroll position for day/week views
  const getOptimalScrollPosition = (dayJobs: JobLocation[]): number => {
    // If today and current time is within business hours, scroll to current time
    const now = new Date();
    const currentHour = now.getHours();
    
    if (isToday(selectedDate) && currentHour >= 6 && currentHour <= 22) {
      return Math.max(0, currentHour * HOUR_HEIGHT - 120); // Scroll to current time with some padding
    }
    
    // Otherwise, scroll to earliest event
    if (dayJobs.length > 0) {
      const earliestJob = dayJobs.reduce((earliest, job) => {
        if (!job.scheduled_start || !earliest.scheduled_start) return job;
        return new Date(job.scheduled_start) < new Date(earliest.scheduled_start) ? job : earliest;
      });
      
      if (earliestJob.scheduled_start) {
        const startTime = new Date(earliestJob.scheduled_start);
        const scrollPosition = Math.max(0, startTime.getHours() * HOUR_HEIGHT - 120);
        return scrollPosition;
      }
    }
    
    // Default to 6 AM if no events
    return 6 * HOUR_HEIGHT;
  };

  // Generate timeline hours
  const generateTimelineHours = () => {
    const hours = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      hours.push(hour);
    }
    return hours;
  };

  // Format hour for timeline display
  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  };

  // Navigation functions for day view
  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(selectedDate.getDate() - 1);
    onDateChange(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    onDateChange(nextDay);
  };

  // Navigation functions for month view
  const goToPreviousMonth = () => {
    const previousMonth = new Date(selectedDate);
    previousMonth.setMonth(selectedDate.getMonth() - 1);
    onDateChange(previousMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(selectedDate.getMonth() + 1);
    onDateChange(nextMonth);
  };

  // Format date for day view header
  const formatDayViewHeader = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Render Day View - Apple Timeline Style
  const renderDayView = () => {
    const dayJobs = allJobs.filter(job => {
      if (!job.scheduled_start) return false;
      const jobDate = new Date(job.scheduled_start);
      return jobDate.toDateString() === selectedDate.toDateString();
    });

    const timelineHours = generateTimelineHours();
    const eventPositions = calculateEventPositions(dayJobs);
    const currentTimeTop = getCurrentTimePosition();
    const showCurrentTime = isToday(selectedDate);

    return (
      <View style={styles.dayContainer}>
        {/* Day header with navigation */}
        <View style={[styles.dayHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.dayNavButton,
              { 
                backgroundColor: colors.card, 
                borderColor: colors.border 
              }
            ]}
            onPress={goToPreviousDay}
          >
            <FontAwesome 
              name="chevron-left" 
              size={16} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <View style={styles.dayHeaderTitle}>
            <Text style={[styles.dayHeaderText, { color: colors.text }]}>
              {formatDayViewHeader(selectedDate)}
            </Text>
            <Text style={[styles.dayHeaderDate, { color: colors.placeholder }]}>
              {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.dayNavButton,
              { 
                backgroundColor: colors.card, 
                borderColor: colors.border 
              }
            ]}
            onPress={goToNextDay}
          >
            <FontAwesome 
              name="chevron-right" 
              size={16} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={dayTimelineScrollRef}
          style={styles.timelineContainer} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.timeline}>
            {/* Hour labels and lines */}
            {timelineHours.map((hour, index) => (
              <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
                <View style={[styles.hourLabel, { width: TIME_LABEL_WIDTH }]}>
                  <Text style={[styles.hourText, { color: colors.placeholder }]}>
                    {formatHour(hour)}
                  </Text>
                </View>
                <View style={[styles.hourLine, { borderColor: colors.border }]} />
              </View>
            ))}
            
            {/* Current time indicator */}
            {showCurrentTime && currentTimeTop >= 0 && (
              <View style={[styles.currentTimeLine, { top: currentTimeTop }]}>
                <View style={styles.currentTimeCircle} />
                <View style={styles.currentTimeLineBar} />
              </View>
            )}
            
            {/* Event blocks */}
            <View style={[styles.eventsContainer, { marginLeft: TIME_LABEL_WIDTH }]}>
                           {eventPositions.map((eventPos, index) => {
               const jobColors = getPriorityColor(eventPos.job.priority);
               const isNarrow = eventPos.width < 120; // Show only title if width is less than 120px
               return (
                 <TouchableOpacity
                   key={eventPos.job.id}
                   style={[
                     styles.eventBlock,
                     {
                       top: eventPos.top,
                       height: eventPos.height,
                       left: eventPos.left,
                       width: eventPos.width,
                       backgroundColor: jobColors.bg,
                       borderLeftColor: jobColors.border,
                     },
                     shadows.subtle(colorScheme)
                   ]}
                   onPress={() => onJobPress?.(eventPos.job)}
                 >
                   <Text style={[styles.eventTime, { color: jobColors.border }]}>
                     {formatTimeForDisplay(eventPos.job.scheduled_start || '')}
                   </Text>
                   <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={isNarrow ? 2 : 3}>
                     {eventPos.job.title}
                   </Text>
                 </TouchableOpacity>
               );
             })}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Generate multiple weeks of days for infinite scroll experience
  const generateMultipleWeekDays = (selectedDate: Date): DayData[] => {
    const days: DayData[] = [];
    
    // Generate 3 weeks of data: 1 week before, current week, 1 week after
    for (let weekOffset = -1; weekOffset <= 1; weekOffset++) {
      const weekStartDate = new Date(selectedDate);
      weekStartDate.setDate(selectedDate.getDate() - selectedDate.getDay() + (weekOffset * 7));
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStartDate);
        day.setDate(weekStartDate.getDate() + i);
        
        const dayJobs = allJobs.filter(job => {
          if (!job.scheduled_start) return false;
          const jobDate = new Date(job.scheduled_start);
          return jobDate.toDateString() === day.toDateString();
        });
        
        days.push({
          date: day,
          jobs: dayJobs,
          isToday: isToday(day),
          isSelected: day.toDateString() === selectedDate.toDateString(),
          isCurrentMonth: day.getMonth() === selectedDate.getMonth(),
          isWeekend: isWeekend(day)
        });
      }
    }
    
    return days;
  };

  // Generate 3-day periods for infinite scroll week view
  const generate3DayPeriods = (selectedDate: Date) => {
    const multiWeekDays = generateMultipleWeekDays(selectedDate);
    const periods = [];
    
    // Create periods of 3 days
    for (let i = 0; i < multiWeekDays.length; i += 3) {
      periods.push(multiWeekDays.slice(i, i + 3));
    }
    
    return periods;
  };

  // Find which 3-day period contains the selected date
  const getCurrentPeriodIndex = (selectedDate: Date) => {
    const multiWeekDays = generateMultipleWeekDays(selectedDate);
    const selectedIndex = multiWeekDays.findIndex(day => 
      day.date.toDateString() === selectedDate.toDateString()
    );
    return Math.floor(selectedIndex / 3);
  };

  // Render Week View - 3-day horizontally scrollable
  const renderWeekView = () => {
    const periods = generate3DayPeriods(selectedDate);
    const timelineHours = generateTimelineHours();
    const currentTimeTop = getCurrentTimePosition();
    const dayColumnWidth = Math.floor((SCREEN_WIDTH - TIME_LABEL_WIDTH) / 3); // 3 days at a time
    const periodWidth = SCREEN_WIDTH;
    const currentPeriodIndex = getCurrentPeriodIndex(selectedDate);

    // Initial scroll to show current period (only when view first loads)
    const initialScrollX = currentPeriodIndex * periodWidth;

    // Synchronize scroll between header and events
    const handleHeaderScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      if (isScrollingSynced.current || Math.abs(scrollX - lastScrollX.current) < 1) return;
      
      isScrollingSynced.current = true;
      lastScrollX.current = scrollX;
      eventsScrollRef.current?.scrollTo({ x: scrollX, animated: false });
      
      // Immediate reset for better responsiveness
      requestAnimationFrame(() => {
        isScrollingSynced.current = false;
      });
    };

    const handleEventsScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      if (isScrollingSynced.current || Math.abs(scrollX - lastScrollX.current) < 1) return;
      
      isScrollingSynced.current = true;
      lastScrollX.current = scrollX;
      headerScrollRef.current?.scrollTo({ x: scrollX, animated: false });
      
      // Immediate reset for better responsiveness
      requestAnimationFrame(() => {
        isScrollingSynced.current = false;
      });
    };

    return (
      <View style={styles.weekContainer}>
        {/* Week header - scrollable */}
        <View style={[styles.weekHeader, { backgroundColor: colors.card }]}>
          <View style={{ width: TIME_LABEL_WIDTH }} />
          <ScrollView 
            ref={headerScrollRef}
            horizontal 
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.weekHeaderScroll}
            contentContainerStyle={{ width: Math.floor(periodWidth * periods.length) }}
            contentOffset={{ x: initialScrollX, y: 0 }}
            onScroll={handleHeaderScroll}
            scrollEventThrottle={1}
            decelerationRate="fast"
            snapToInterval={periodWidth}
            snapToAlignment="start"
          >
            {periods.map((period, periodIndex) => (
              <View key={`header-${periodIndex}-${period[0]?.date.toDateString()}`} style={[styles.weekHeaderPeriod, { width: Math.floor(periodWidth - TIME_LABEL_WIDTH) }]}>
                {period.map((day) => (
                  <View
                    key={day.date.toDateString()}
                    style={[
                      styles.weekHeaderDay,
                      { width: dayColumnWidth },
                    ]}
                  >
                    <Text style={[
                      styles.weekDayName,
                      { color: day.isWeekend ? colors.placeholder : colors.text },
                    ]}>
                      {day.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[
                      styles.weekDayDate,
                      { color: day.isWeekend ? colors.placeholder : colors.text },
                      day.isToday && { color: colors.primary },
                    ]}>
                      {day.date.getDate()}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
        
        {/* Week timeline - scrollable */}
        <ScrollView 
          ref={weekTimelineScrollRef}
          style={styles.timelineContainer} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.timeline}>
            {/* Hour labels and lines */}
            {timelineHours.map((hour) => (
              <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
                <View style={[styles.hourLabel, { width: TIME_LABEL_WIDTH }]}>
                  <Text style={[styles.hourText, { color: colors.placeholder }]}>
                    {formatHour(hour)}
                  </Text>
                </View>
                <View style={[styles.hourLine, { borderColor: colors.border }]} />
              </View>
            ))}
            
            {/* Current time indicator */}
            {currentTimeTop >= 0 && (
              <View style={[styles.currentTimeLine, { top: currentTimeTop }]}>
                <View style={styles.currentTimeCircle} />
                <View style={styles.currentTimeLineBar} />
              </View>
            )}
            
            {/* Week events - scrollable */}
            <View style={[styles.weekEventsContainer, { marginLeft: TIME_LABEL_WIDTH }]}>
                             <ScrollView 
                 ref={eventsScrollRef}
                 horizontal 
                 pagingEnabled
                 showsHorizontalScrollIndicator={false}
                 style={styles.weekEventsScroll}
                 contentContainerStyle={{ width: Math.floor(periodWidth * periods.length) }}
                 contentOffset={{ x: initialScrollX, y: 0 }}
                 onScroll={handleEventsScroll}
                 scrollEventThrottle={1}
                 decelerationRate="fast"
                 snapToInterval={periodWidth}
                 snapToAlignment="start"
               >
                                 {periods.map((period, periodIndex) => (
                   <View key={`events-${periodIndex}-${period[0]?.date.toDateString()}`} style={[styles.weekEventsPeriod, { width: Math.floor(periodWidth - TIME_LABEL_WIDTH) }]}>
                    {period.map((day, dayIndexInPeriod) => {
                      const dayEvents = calculateEventPositions(day.jobs, dayColumnWidth);
                      return (
                        <View 
                          key={day.date.toDateString()}
                          style={[
                            styles.weekDayColumn,
                            { 
                              width: dayColumnWidth,
                              left: dayIndexInPeriod * dayColumnWidth,
                              borderRightColor: colors.border
                            }
                          ]}
                        >
                          {dayEvents.map((eventPos) => {
                            const jobColors = getPriorityColor(eventPos.job.priority);
                            const isNarrow = eventPos.width < 80;
                            return (
                              <TouchableOpacity
                                key={eventPos.job.id}
                                style={[
                                  styles.weekEventBlock,
                                  {
                                    top: eventPos.top,
                                    height: eventPos.height,
                                    left: eventPos.left,
                                    width: eventPos.width,
                                    backgroundColor: jobColors.bg,
                                    borderLeftColor: jobColors.border,
                                  }
                                ]}
                                onPress={() => onJobPress?.(eventPos.job)}
                              >
                                                           <Text style={[styles.weekEventTime, { color: jobColors.border }]}>
                             {formatTimeForDisplay(eventPos.job.scheduled_start || '')}
                           </Text>
                           <Text style={[styles.weekEventTitle, { color: colors.text }]} numberOfLines={isNarrow ? 2 : 1}>
                             {eventPos.job.title}
                           </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Month View - Apple grid style
  const renderMonthView = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];
    
    // Add empty days at the beginning (previous month)
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(firstDayOfMonth);
      prevDate.setDate(firstDayOfMonth.getDate() - (firstDayOfWeek - i));
      currentWeek.push({
        date: prevDate,
        jobs: [],
        isToday: false,
        isSelected: false,
        isCurrentMonth: false,
        isWeekend: isWeekend(prevDate)
      });
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const dayJobs = allJobs.filter(job => {
        if (!job.scheduled_start) return false;
        const jobDate = new Date(job.scheduled_start);
        return jobDate.toDateString() === date.toDateString();
      });
      
      currentWeek.push({
        date,
        jobs: dayJobs,
        isToday: isToday(date),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        isCurrentMonth: true,
        isWeekend: isWeekend(date)
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add remaining days to complete the last week (next month)
    if (currentWeek.length > 0) {
      const nextMonthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
      let nextDay = 1;
      while (currentWeek.length < 7) {
        const nextDate = new Date(nextMonthStart);
        nextDate.setDate(nextDay);
        currentWeek.push({
          date: nextDate,
          jobs: [],
          isToday: false,
          isSelected: false,
          isCurrentMonth: false,
          isWeekend: isWeekend(nextDate)
        });
        nextDay++;
      }
      weeks.push(currentWeek);
    }
    
    return (
      <View style={styles.monthContainer}>
        {/* Month header with navigation */}
        <View style={[styles.monthHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.monthNavButton,
              { 
                backgroundColor: colors.card, 
                borderColor: colors.border 
              }
            ]}
            onPress={goToPreviousMonth}
          >
            <FontAwesome 
              name="chevron-left" 
              size={16} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <View style={styles.monthHeaderTitle}>
            <Text style={[styles.monthHeaderText, { color: colors.text }]}>
              {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.monthNavButton,
              { 
                backgroundColor: colors.card, 
                borderColor: colors.border 
              }
            ]}
            onPress={goToNextMonth}
          >
            <FontAwesome 
              name="chevron-right" 
              size={16} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Week days header */}
        <View style={[styles.weekDaysHeader, { backgroundColor: colors.card }]}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text 
              key={day + index} 
              style={[
                styles.weekDayText, 
                { color: (index === 0 || index === 6) ? colors.placeholder : colors.text }
              ]}
            >
              {day}
            </Text>
          ))}
        </View>
        
        {/* Month grid */}
        <View style={styles.monthGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((dayData, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.monthDayCell,
                    { borderColor: colors.border },
                    !dayData.isCurrentMonth && styles.otherMonthCell,
                    dayData.isWeekend && dayData.isCurrentMonth && styles.weekendCell,
                    dayData.isSelected && [styles.selectedDayCell, { backgroundColor: colors.primary }],
                    dayData.isToday && !dayData.isSelected && [styles.todayCell, { borderColor: colors.primary }]
                  ]}
                  onPress={() => {
                    onDateChange(dayData.date);
                    // Switch to day view when a day is selected (Apple behavior)
                    if (dayData.isCurrentMonth) {
                      onViewChange('day');
                    }
                  }}
                >
                  <View style={styles.monthDayContent}>
                    <Text style={[
                      styles.monthDayText,
                      { color: dayData.isCurrentMonth ? colors.text : colors.placeholder },
                      dayData.isSelected && { color: colors.card },
                      dayData.isToday && !dayData.isSelected && { color: colors.primary }
                    ]}>
                      {dayData.date.getDate()}
                    </Text>
                    
                    {/* Event indicators - Apple style */}
                    {dayData.jobs.length > 0 && (
                      <View style={styles.monthJobsContainer}>
                        {dayData.jobs.slice(0, 3).map((job, index) => {
                          const jobColors = getPriorityColor(job.priority);
                          return (
                            <View
                              key={job.id}
                              style={[
                                styles.monthJobIndicator,
                                { backgroundColor: jobColors.border }
                              ]}
                            />
                          );
                        })}
                        {dayData.jobs.length > 3 && (
                          <Text style={[styles.monthJobCount, { color: dayData.isSelected ? colors.card : colors.placeholder }]}>
                            +{dayData.jobs.length - 3}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Generate days for agenda view (next 30 days)
  const generateAgendaDays = (): DayData[] => {
    const days: DayData[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      
      const dayJobs = allJobs.filter(job => {
        if (!job.scheduled_start) return false;
        const jobDate = new Date(job.scheduled_start);
        return jobDate.toDateString() === day.toDateString();
      });
      
      days.push({ 
        date: day, 
        jobs: dayJobs,
        isToday: isToday(day),
        isSelected: day.toDateString() === selectedDate.toDateString(),
        isCurrentMonth: day.getMonth() === today.getMonth(),
        isWeekend: isWeekend(day)
      });
    }
    
    return days;
  };

  // Render agenda view (list of days with events)
  const renderAgendaView = () => {
    const agendaDays = generateAgendaDays();
    
    const renderAgendaDay = ({ item }: { item: DayData }) => (
      <View style={styles.agendaDay}>
        <TouchableOpacity
          style={[styles.agendaDayHeader, { backgroundColor: colors.card }]}
          onPress={() => {
            onDateChange(item.date);
            onViewChange('day');
          }}
        >
          <Text style={[styles.agendaDayHeaderText, { color: colors.text }]}>
            {item.date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          {item.isToday && (
            <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.todayBadgeText, { color: colors.card }]}>Today</Text>
            </View>
          )}
        </TouchableOpacity>
        
                 {item.jobs.length > 0 ? (
           item.jobs.map((job) => {
             const jobColors = getPriorityColor(job.priority);
             return (
               <TouchableOpacity
                 key={job.id}
                 style={[styles.agendaJobItem, { backgroundColor: colors.card }]}
                 onPress={() => onJobPress?.(job)}
               >
                 <View style={[styles.agendaJobColorBar, { backgroundColor: jobColors.border }]} />
                 <View style={styles.agendaJobContent}>
                   <Text style={[styles.agendaJobTitle, { color: colors.text }]}>
                     {job.title}
                   </Text>
                   <Text style={[styles.agendaJobTime, { color: colors.placeholder }]}>
                     {job.scheduled_start && job.scheduled_end 
                       ? `${formatTimeForDisplay(job.scheduled_start)} - ${formatTimeForDisplay(job.scheduled_end)}`
                       : 'Time not set'}
                   </Text>
                 </View>
               </TouchableOpacity>
             );
           })
        ) : (
          <View style={styles.agendaEmptyDay}>
            <Text style={[styles.agendaEmptyText, { color: colors.placeholder }]}>
              No jobs scheduled
            </Text>
          </View>
        )}
      </View>
    );

    return (
      <FlatList
        data={agendaDays}
        renderItem={renderAgendaDay}
        keyExtractor={(item, index) => `agenda-${index}`}
        showsVerticalScrollIndicator={false}
        style={styles.agendaList}
        contentContainerStyle={styles.agendaListContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
      {view === 'agenda' && renderAgendaView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Day & Week Timeline Styles
  dayContainer: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...spacing.helpers.paddingVertical('m'),
    ...spacing.helpers.paddingHorizontal('m'),
    borderBottomWidth: 1,
  },
  dayNavButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.m,
  },
  dayHeaderTitle: {
    flex: 1,
    alignItems: 'center',
    ...spacing.helpers.marginHorizontal('m'),
  },
  dayHeaderText: {
    ...typography.h3,
    fontWeight: '600',
  },
  dayHeaderDate: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  timelineContainer: {
    flex: 1,
  },
  timeline: {
    position: 'relative',
    height: 24 * 60 + 20, // Total height for all 24 hours (1440px) plus padding for 11PM
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourLabel: {
    paddingTop: 4,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  hourText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '400',
  },
  hourLine: {
    flex: 1,
    borderTopWidth: 0.5,
    marginTop: 0,
  },
  
  // Current time indicator
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
  },
  currentTimeCircle: {
    position: 'absolute',
    left: 72,
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  currentTimeLineBar: {
    position: 'absolute',
    left: 80,
    right: 8,
    top: -1,
    height: 2,
    backgroundColor: '#FF3B30',
  },
  
  // Events
  eventsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventBlock: {
    position: 'absolute',
    borderLeftWidth: 3,
    borderRadius: 4,
    ...spacing.helpers.padding('s'),
    minHeight: 30,
  },
  eventTime: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventTitle: {
    ...typography.caption,
    fontWeight: '500',
    marginBottom: 2,
  },
  eventCustomer: {
    ...typography.caption,
    fontSize: 11,
  },
  
  // Week View Styles
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    ...spacing.helpers.paddingVertical('s'),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  weekHeaderScroll: {
    flex: 1,
  },
  weekHeaderPeriod: {
    flexDirection: 'row',
  },
  weekHeaderDay: {
    alignItems: 'center',
    ...spacing.helpers.paddingVertical('s'),
    borderRadius: radius.s,
    marginHorizontal: 1,
  },
  selectedWeekDay: {
    borderRadius: radius.s,
  },
  weekDayName: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  weekDayDate: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 2,
    fontSize: 16,
  },
  weekEventsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  weekEventsScroll: {
    flex: 1,
  },
  weekEventsPeriod: {
    position: 'relative',
    height: '100%',
  },
  weekDayColumn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRightWidth: 0.5,
  },
     weekEventBlock: {
     position: 'absolute',
     borderLeftWidth: 3,
     borderRadius: 3,
     padding: 4,
     minHeight: 20,
   },
  weekEventTime: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 1,
  },
  weekEventTitle: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '500',
  },
  
  // Month View Styles
  monthContainer: {
    flex: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...spacing.helpers.paddingVertical('m'),
    ...spacing.helpers.paddingHorizontal('m'),
    borderBottomWidth: 1,
  },
  monthNavButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.m,
  },
  monthHeaderTitle: {
    flex: 1,
    alignItems: 'center',
    ...spacing.helpers.marginHorizontal('m'),
  },
  monthHeaderText: {
    ...typography.h2,
    fontWeight: '600',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    ...spacing.helpers.paddingVertical('s'),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  weekDayText: {
    flex: 1,
    ...typography.caption,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
  monthGrid: {
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    height: 90,
  },
  monthDayCell: {
    flex: 1,
    height: 90,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingVertical: spacing.xs,
  },
  otherMonthCell: {
    opacity: 0.3,
  },
  weekendCell: {
    opacity: 0.7,
  },
  selectedDayCell: {
    borderRadius: radius.s,
  },
  todayCell: {
    borderWidth: 2,
    borderRadius: radius.s,
  },
  monthDayText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 16,
  },
  monthJobsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 14,
  },
  monthJobIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  monthJobCount: {
    ...typography.caption,
    fontSize: 9,
    marginLeft: 2,
  },
  
  // Agenda View Styles
  agendaList: {
    flex: 1,
  },
  agendaListContent: {
    paddingHorizontal: 0,
  },
  agendaDay: {
    marginBottom: spacing.s,
  },
  agendaDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...spacing.helpers.paddingVertical('m'),
    ...spacing.helpers.paddingHorizontal('m'),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  agendaDayHeaderText: {
    ...typography.h4,
    fontWeight: '600',
  },
  todayBadge: {
    ...spacing.helpers.paddingVertical('xs'),
    ...spacing.helpers.paddingHorizontal('s'),
    borderRadius: radius.s,
  },
  todayBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  agendaJobItem: {
    flexDirection: 'row',
    ...spacing.helpers.paddingVertical('m'),
    ...spacing.helpers.paddingHorizontal('m'),
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  agendaJobColorBar: {
    width: 4,
    marginRight: spacing.m,
    borderRadius: 2,
  },
  agendaJobContent: {
    flex: 1,
  },
  agendaJobTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  agendaJobTime: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  agendaJobClient: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  agendaEmptyDay: {
    ...spacing.helpers.paddingVertical('m'),
    ...spacing.helpers.paddingHorizontal('m'),
    alignItems: 'center',
  },
  agendaEmptyText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
}); 