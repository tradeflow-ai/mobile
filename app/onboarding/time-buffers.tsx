/**
 * TradeFlow Mobile App - Time Buffers Onboarding Step
 * 
 * Second step of onboarding flow where users configure time buffers for
 * travel and job duration to improve schedule reliability.
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
import { FormProvider, FormTextInput, FormCheckbox, FormQuantitySelector } from '@/components/forms';
import { timeBuffersSchema } from '@/components/forms/validationSchemas';
import { typography, spacing } from '@/constants/Theme';
import { useOnboarding } from './_layout';

export default function TimeBuffersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { saveStepData, navigateToNextStep, existingPreferences } = useOnboarding();

  // Transform preferences to form data
  const getDefaultValues = () => {
    if (existingPreferences) {
      return {
        travelBufferMinutes: existingPreferences.travel_buffer_minutes || existingPreferences.travel_buffer_percentage || 15,
        jobBufferMinutes: existingPreferences.job_duration_buffer_minutes || 15,
        enableSmartBuffers: existingPreferences.emergency_travel_buffer_percentage > 0,
      };
    }

    // Default values if no preferences exist
    return {
      travelBufferMinutes: 15,
      jobBufferMinutes: 15,
      enableSmartBuffers: true,
    };
  };

  const methods = useForm({
    resolver: zodResolver(timeBuffersSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  const { handleSubmit, watch, getValues, formState: { errors } } = methods;
  const watchedSmartBuffers = watch('enableSmartBuffers');

  const onSubmit = (data: any) => {
    try {
      console.log('Time Buffers - onSubmit called with data:', data);
      
      // Save step data to parent component state
      saveStepData('time-buffers', data);
      console.log('Time Buffers - saveStepData called');
      
      // Navigate to next step using parent navigation
      navigateToNextStep();
    } catch (error) {
      console.error('Error saving time buffers:', error);
      Alert.alert('Error', 'Failed to save time buffers. Please try again.');
    }
  };

  const onError = (errors: any) => {
    console.log('Time Buffers - Form validation errors:', errors);
    console.log('Time Buffers - Current form values:', getValues());
  };

  const handleSkip = () => {
    // Navigate to next step without saving data
    navigateToNextStep();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <FormProvider methods={methods}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              Time Buffers
            </Text>
            <Button
              title="Skip"
              variant="ghost"
              onPress={handleSkip}
              style={styles.skipButton}
            />
          </View>
          <Text style={[styles.description, { color: colors.placeholder }]}>
            Add buffer time to your schedule to account for unexpected delays and ensure you never run late.
          </Text>

          {/* Smart Buffers Toggle */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Smart Buffers
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Let AI automatically adjust buffer times based on traffic, weather, and historical data
            </Text>
            
            <FormCheckbox
              name="enableSmartBuffers"
              label="Enable smart buffer adjustments"
              containerStyle={styles.smartBuffersToggle}
            />

            {watchedSmartBuffers && (
              <View style={[styles.smartBuffersInfo, { backgroundColor: colors.info + '20' }]}>
                <Text style={[styles.infoText, { color: colors.info }]}>
                  ✓ Smart buffers will automatically increase during peak hours, bad weather, and high-traffic days
                </Text>
              </View>
            )}
          </Card>

          {/* Travel Buffer */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Travel Buffer
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Extra time added to travel between job sites to account for traffic and route changes
            </Text>
            
            <FormQuantitySelector
              name="travelBufferMinutes"
              label="Travel buffer (minutes)"
              step={5}
              min={0}
            />

            <View style={[styles.bufferExample, { backgroundColor: colors.card }]}>
              <Text style={[styles.exampleText, { color: colors.placeholder }]}>
                Example: 20 minute drive + 15 minute buffer = 35 minutes total
              </Text>
            </View>
          </Card>

          {/* Job Duration Buffer */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Job Duration Buffer
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              Extra time added to each job to handle unexpected complications or prep time
            </Text>
            
            <FormQuantitySelector
              name="jobBufferMinutes"
              label="Job buffer (minutes)"
              step={5}
              min={0}
            />

            <View style={[styles.bufferExample, { backgroundColor: colors.card }]}>
              <Text style={[styles.exampleText, { color: colors.placeholder }]}>
                Example: 2 hour job + 15 minute buffer = 2h 15m scheduled
              </Text>
            </View>
          </Card>

          {/* Buffer Preview */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Schedule Preview
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.placeholder }]}>
              How buffers affect your daily schedule
            </Text>
            
            <View style={[styles.preview, { backgroundColor: colors.card }]}>
              <View style={styles.previewItem}>
                <Text style={[styles.previewLabel, { color: colors.text }]}>
                  Without buffers:
                </Text>
                <Text style={[styles.previewTime, { color: colors.warning }]}>
                  8:00 AM → 5:00 PM (9 hours)
                </Text>
              </View>
              
              <View style={styles.previewItem}>
                <Text style={[styles.previewLabel, { color: colors.text }]}>
                  With buffers:
                </Text>
                <Text style={[styles.previewTime, { color: colors.success }]}>
                  8:00 AM → 5:30 PM (9.5 hours)
                </Text>
              </View>
              
              <Text style={[styles.previewNote, { color: colors.placeholder }]}>
                Buffers help ensure you finish on time and reduce stress
              </Text>
            </View>
          </Card>

          <View style={styles.footer}>
            <Button
              title="Next: Suppliers"
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
  smartBuffersToggle: {
    marginBottom: spacing.m,
  },
  smartBuffersInfo: {
    padding: spacing.m,
    borderRadius: 8,
  },
  infoText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  bufferExample: {
    marginTop: spacing.s,
    padding: spacing.s,
    borderRadius: 6,
  },
  exampleText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  preview: {
    padding: spacing.m,
    borderRadius: 8,
    width: '100%',
    overflow: 'hidden',
  },
  previewItem: {
    marginBottom: spacing.m,
  },
  previewLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  previewTime: {
    ...typography.caption,
    fontFamily: 'monospace',
  },
  previewNote: {
    ...typography.caption,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.s,
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.l,
  },
  nextButton: {
    alignSelf: 'stretch',
  },
}); 