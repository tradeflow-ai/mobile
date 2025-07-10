/**
 * TradeFlow Mobile App - Work Schedule Onboarding Step
 * 
 * First step of onboarding flow where users configure their work schedule,
 * including work days, start/end times, and break preferences.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormProvider, FormCheckbox, FormTimeInput } from '@/components/forms';
import { workScheduleSchema, WorkScheduleFormData } from '@/components/forms/validationSchemas';
import { typography, spacing, touchTargets } from '@/constants/Theme';
import { useOnboarding } from './_layout';

type WorkDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const WORK_DAYS: { value: WorkDay; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function WorkScheduleScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { saveStepData, navigateToNextStep, existingPreferences, isLoadingPreferences } = useOnboarding();

  // Transform preferences to form data
  const formatTime = (time24: string, defaultTime: string = '8:00 AM') => {
    if (!time24) return defaultTime;
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getDefaultValues = () => {
    if (existingPreferences) {
      
      // Convert 24-hour format to 12-hour format for the form
      // const formatTime = (time24: string) => { removed

      // Convert work days to lowercase format expected by form
      const workDays = existingPreferences.work_days?.map(day => day.toLowerCase()) as WorkDay[] || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

      const formData = {
        workDays,
        startTime: formatTime(existingPreferences.work_start_time, '8:00 AM'),
        endTime: formatTime(existingPreferences.work_end_time, '5:00 PM'),
        hasBreak: !!(existingPreferences.lunch_break_start && existingPreferences.lunch_break_start !== ''),
        breakStartTime: existingPreferences.lunch_break_start ? formatTime(existingPreferences.lunch_break_start, '12:00 PM') : '12:00 PM',
        breakEndTime: existingPreferences.lunch_break_end ? formatTime(existingPreferences.lunch_break_end, '1:00 PM') : '1:00 PM',
      };

      return formData;
    }

    // Default values if no preferences exist
    return {
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as WorkDay[],
      startTime: '8:00 AM',
      endTime: '5:00 PM',
      hasBreak: true,
      breakStartTime: '12:00 PM',
      breakEndTime: '1:00 PM',
    };
  };

  const methods = useForm({
    resolver: zodResolver(workScheduleSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  const { handleSubmit, watch, setValue, getValues, formState: { errors }, reset } = methods;

  // Reset form when preferences are loaded
  React.useEffect(() => {
    if (!isLoadingPreferences && existingPreferences) {
      reset(getDefaultValues());
    }
  }, [existingPreferences, isLoadingPreferences, reset]);
  const watchedHasBreak = watch('hasBreak');
  const watchedWorkDays = watch('workDays');

  const onSubmit = (data: any) => {
    try {
      // Save step data to parent component state
      saveStepData('work-schedule', data);
      
      // Navigate to next step using parent navigation
      navigateToNextStep();
    } catch (error) {
      console.error('Error saving work schedule:', error);
      Alert.alert('Error', 'Failed to save work schedule. Please try again.');
    }
  };

  const onError = (errors: any) => {
    console.error('Work schedule form validation errors:', errors);
  };

  const handleSkip = () => {
    // Navigate to next step without saving data
    navigateToNextStep();
  };

  const handleWorkDayToggle = (dayValue: WorkDay) => {
    const currentWorkDays = getValues('workDays') || [];
    const newWorkDays = currentWorkDays.includes(dayValue)
      ? currentWorkDays.filter(day => day !== dayValue)
      : [...currentWorkDays, dayValue];
    setValue('workDays', newWorkDays);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <FormProvider methods={methods}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              When do you work?
            </Text>
            <Button
              title="Skip"
              variant="ghost"
              onPress={handleSkip}
              style={styles.skipButton}
            />
          </View>
          <Text style={[styles.description, { color: colors.placeholder }]}>
            Help us understand your schedule so we can plan your day effectively.
          </Text>

          {/* Work Days Selection */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Work Days
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Select the days you typically work
            </Text>
            
            <View style={styles.daysContainer}>
              {/* Monday - Tuesday */}
              <View style={styles.dayRow}>
                {WORK_DAYS.slice(0, 2).map((day) => (
                  <Checkbox
                    key={day.value}
                    label={day.label}
                    checked={watchedWorkDays?.includes(day.value) || false}
                    onPress={() => handleWorkDayToggle(day.value)}
                    containerStyle={styles.dayCheckbox}
                  />
                ))}
              </View>
              
              {/* Wednesday - Thursday */}
              <View style={styles.dayRow}>
                {WORK_DAYS.slice(2, 4).map((day) => (
                  <Checkbox
                    key={day.value}
                    label={day.label}
                    checked={watchedWorkDays?.includes(day.value) || false}
                    onPress={() => handleWorkDayToggle(day.value)}
                    containerStyle={styles.dayCheckbox}
                  />
                ))}
              </View>
              
              {/* Friday - Saturday */}
              <View style={styles.dayRow}>
                {WORK_DAYS.slice(4, 6).map((day) => (
                  <Checkbox
                    key={day.value}
                    label={day.label}
                    checked={watchedWorkDays?.includes(day.value) || false}
                    onPress={() => handleWorkDayToggle(day.value)}
                    containerStyle={styles.dayCheckbox}
                  />
                ))}
              </View>
              
              {/* Sunday */}
              <View style={styles.dayRow}>
                {WORK_DAYS.slice(6, 7).map((day) => (
                  <Checkbox
                    key={day.value}
                    label={day.label}
                    checked={watchedWorkDays?.includes(day.value) || false}
                    onPress={() => handleWorkDayToggle(day.value)}
                    containerStyle={styles.dayCheckbox}
                  />
                ))}
                {/* Empty space for layout balance */}
                <View style={styles.dayCheckbox} />
              </View>
            </View>
          </Card>

          {/* Work Hours */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Work Hours
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Set your typical start and end times
            </Text>
            
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <FormTimeInput
                  name="startTime"
                  label="Start Time"
                  placeholder="Tap to select start time"
                  format24Hour={false}
                  rules={{ required: 'Start time is required' }}
                />
              </View>
              <View style={styles.timeInput}>
                <FormTimeInput
                  name="endTime"
                  label="End Time"
                  placeholder="Tap to select end time"
                  format24Hour={false}
                  rules={{ required: 'End time is required' }}
                />
              </View>
            </View>
          </Card>

          {/* Break Configuration */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Break Schedule
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Configure your lunch break preferences
            </Text>
            
            <FormCheckbox
              name="hasBreak"
              label="I take a lunch break"
              containerStyle={styles.breakToggle}
            />

            {watchedHasBreak && (
              <View style={styles.breakTimes}>
                <View style={styles.timeRow}>
                  <View style={styles.timeInput}>
                    <FormTimeInput
                      name="breakStartTime"
                      label="Break Start"
                      placeholder="Tap to select break start"
                      format24Hour={false}
                      rules={{ required: 'Break start time is required' }}
                    />
                  </View>
                  <View style={styles.timeInput}>
                    <FormTimeInput
                      name="breakEndTime"
                      label="Break End"
                      placeholder="Tap to select break end"
                      format24Hour={false}
                      rules={{ required: 'Break end time is required' }}
                    />
                  </View>
                </View>
              </View>
            )}
          </Card>

          <View style={styles.footer}>
            <Button
              title="Next: Time Buffers"
              variant="primary"
              onPress={handleSubmit(onSubmit, onError)}
              style={styles.nextButton}
            />
          </View>
        </View>
      </FormProvider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.m,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  title: {
    ...typography.h2,
    flex: 1,
  },
  skipButton: {
    marginLeft: spacing.m,
  },
  description: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.caption,
    marginBottom: spacing.m,
  },
  daysContainer: {
    gap: spacing.s,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  dayCheckbox: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  timeInput: {
    flex: 1,
  },
  breakToggle: {
    marginBottom: spacing.m,
  },
  breakTimes: {
    marginTop: spacing.m,
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.l,
  },
  nextButton: {
    alignSelf: 'stretch',
  },
}); 