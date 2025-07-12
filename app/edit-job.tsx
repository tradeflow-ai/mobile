import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { spacing, typography } from '@/constants/Theme';
import { FormProvider, FormTextInput, FormSelect, FormQuantitySelector, FormActions, FormTimeInput, FormCheckbox, SelectOption, FormValidationRules } from '@/components/forms';
import { Label, NativeDatePicker } from '@/components/ui';
import { useUpdateJob, useJob, UpdateJobData } from '@/hooks/useJobs';
import { useInventory } from '@/hooks/useInventory';

// Job form interface
interface JobFormData {
  title: string;
  description?: string;
  job_type: 'service' | 'inspection' | 'emergency';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date?: Date;
  use_ai_scheduling?: boolean;
  estimated_duration?: number;
  completion_notes?: string;
}

// Job type options
const jobTypeOptions: SelectOption[] = [
  { label: 'Service', value: 'service' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Emergency', value: 'emergency' },
];

// Priority options
const priorityOptions: SelectOption[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

// Status options
const statusOptions: SelectOption[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Paused', value: 'paused' },
];



export default function EditJobScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Form setup
  const methods = useForm<JobFormData>({
    mode: 'onChange',
  });

  const { handleSubmit, watch, setValue, formState: { isSubmitting }, reset } = methods;

  // Data fetching
  const { data: job, isLoading: isLoadingJob } = useJob(id!);
  const { data: inventoryItems = [] } = useInventory();
  const updateJobMutation = useUpdateJob();

  // Inventory options
  const inventoryOptions: SelectOption[] = inventoryItems.map(item => ({
    label: `${item.name} - ${item.quantity} ${item.unit}`,
    value: item.id,
  }));

  // Form validation rules
  const titleRules: FormValidationRules = {
    minLength: { value: 3, message: 'Title must be at least 3 characters' },
    maxLength: { value: 100, message: 'Title must be less than 100 characters' },
  };

  // Pre-populate form with existing job data
  useEffect(() => {
    if (job) {
      const formData: JobFormData = {
        title: job.title,
        description: job.description || '',
        job_type: job.job_type,
        status: job.status,
        priority: job.priority,
        scheduled_date: job.scheduled_date ? new Date(job.scheduled_date) : undefined,
        use_ai_scheduling: job.use_ai_scheduling || false,
        estimated_duration: job.estimated_duration || 60,
        completion_notes: job.completion_notes || '',
      };
      reset(formData);
    }
  }, [job, reset]);

  const onSubmit = async (data: JobFormData) => {
    try {
      if (!id) {
        Alert.alert('Error', 'Job ID is missing', [{ text: 'OK' }]);
        return;
      }

      // Handle scheduled_date timestamp
      let scheduledDate = data.scheduled_date ? new Date(data.scheduled_date) : undefined;
      
      // If using AI scheduling, set time to 00:00 (midnight) to let AI determine optimal time
      if (scheduledDate && data.use_ai_scheduling) {
        scheduledDate.setHours(0, 0, 0, 0);
      }
      // If not using AI scheduling, use the user-selected date and time from the picker

      // Convert form data to UpdateJobData format
      const updateData: UpdateJobData = {
        title: data.title.trim(),
        description: data.description?.trim(),
        job_type: data.job_type,
        status: data.status,
        priority: data.priority,
        scheduled_date: scheduledDate ? scheduledDate.toISOString() : undefined,
        use_ai_scheduling: data.use_ai_scheduling,
        estimated_duration: data.estimated_duration || 60,
        completion_notes: data.completion_notes?.trim(),
      };

      await updateJobMutation.mutateAsync({
        jobId: id,
        updates: updateData,
      });
      
      Alert.alert('Success', 'Job updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating job:', error);
      Alert.alert('Error', 'Failed to update job. Please try again.', [
        { text: 'OK' }
      ]);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoadingJob) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading job...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <FormProvider methods={methods}>
            <View style={styles.form}>
              {/* Job Title */}
              <FormTextInput
                name="title"
                label="Job Title"
                placeholder="Enter job title"
                required
                rules={titleRules}
              />

              {/* Job Description */}
              <FormTextInput
                name="description"
                label="Description"
                placeholder="Enter job description"
                multiline
                numberOfLines={3}
              />

              {/* Job Type */}
              <FormSelect
                name="job_type"
                label="Job Type"
                options={jobTypeOptions}
                required
              />

              {/* Status */}
              <FormSelect
                name="status"
                label="Status"
                options={statusOptions}
                required
              />

              {/* Priority */}
              <FormSelect
                name="priority"
                label="Priority"
                options={priorityOptions}
                required
              />

              {/* Scheduled Date */}
              <View style={styles.dateContainer}>
                <Label text="Scheduled Date" />
                <View style={styles.miniCalendarContainer}>
                  <NativeDatePicker
                    selectedDate={watch('scheduled_date') || new Date()}
                    onDateChange={(date) => setValue('scheduled_date', date)}
                    containerStyle={styles.nativeDatePicker}
                  />
                </View>
              </View>

              {/* AI Scheduling Option */}
              <FormCheckbox
                name="use_ai_scheduling"
                label="Let AI Agent select optimal times"
                containerStyle={styles.aiCheckbox}
              />

              {watch('use_ai_scheduling') && (
                <Text style={[styles.helpText, { color: colors.placeholder }]}>
                  Time will be set to 12:00 AM - AI will determine optimal scheduling
                </Text>
              )}

              {/* Estimated Duration */}
              <FormQuantitySelector
                name="estimated_duration"
                label="Estimated Duration (minutes)"
                min={15}
                max={480}
                step={15}
                required
              />

              {/* Completion Notes */}
              <FormTextInput
                name="completion_notes"
                label="Completion Notes"
                placeholder="Enter completion notes"
                multiline
                numberOfLines={3}
              />
            </View>

            <FormActions
              onSubmit={handleSubmit(onSubmit)}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitTitle="Save Changes"
              cancelTitle="Cancel"
            />
          </FormProvider>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  form: {
    marginBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  dateContainer: {
    marginBottom: spacing.m,
  },
  miniCalendarContainer: {
    marginTop: spacing.s,
  },
  nativeDatePicker: {
    // Custom styles for the date picker if needed
  },
  aiCheckbox: {
    marginBottom: spacing.m,
  },
  helpText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
}); 