import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { FormProvider, FormTextInput, FormSelect, FormQuantitySelector, FormActions, SelectOption, FormValidationRules } from '@/components/forms';
import { useCreateJob, CreateJobData } from '@/hooks/useJobs';
import { useInventory } from '@/hooks/useInventory';

// Job form interface
interface JobFormData {
  title: string;
  description?: string;
  job_type: 'delivery' | 'pickup' | 'service' | 'inspection' | 'maintenance' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration?: number;
}

// Default form values
const defaultFormValues: JobFormData = {
  title: '',
  description: '',
  job_type: 'service',
  priority: 'medium',
  estimated_duration: 60,
};

// Job type options
const jobTypeOptions: SelectOption[] = [
  { label: 'Delivery', value: 'delivery' },
  { label: 'Pickup', value: 'pickup' },
  { label: 'Service', value: 'service' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Emergency', value: 'emergency' },
];

// Priority options
const priorityOptions: SelectOption[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];



export default function CreateJobScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Form setup
  const methods = useForm<JobFormData>({
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  // Data fetching
  const { data: inventoryItems = [] } = useInventory();
  const createJobMutation = useCreateJob();

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

  const onSubmit = async (data: JobFormData) => {
    try {
      // Convert form data to CreateJobData format
      const createData: CreateJobData = {
        title: data.title.trim(),
        description: data.description?.trim(),
        address: '', // Will be set by system
        latitude: 0, // Will be set by system
        longitude: 0, // Will be set by system
        job_type: data.job_type,
        priority: data.priority,
        estimated_duration: data.estimated_duration || 60,
      };

      await createJobMutation.mutateAsync(createData);
      
      Alert.alert('Success', 'Job created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Error', 'Failed to create job. Please try again.', [
        { text: 'OK' }
      ]);
    }
  };

  const handleCancel = () => {
    router.back();
  };

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

              {/* Priority */}
              <FormSelect
                name="priority"
                label="Priority"
                options={priorityOptions}
                required
              />

              {/* Estimated Duration */}
              <FormQuantitySelector
                name="estimated_duration"
                label="Estimated Duration (minutes)"
                min={15}
                max={480}
                step={15}
                required
              />
            </View>

            <FormActions
              onSubmit={handleSubmit(onSubmit)}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitTitle="Create Job"
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
}); 