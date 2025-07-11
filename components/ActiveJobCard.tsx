import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, scale } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { JobLocation } from '@/hooks/useJobs';
import { openDirectionsToJob } from '@/utils/mapUtils';
import { formatDate } from '@/utils/dateUtils';

interface ActiveJobCardProps {
  job: JobLocation;
}

export function ActiveJobCard({ job }: ActiveJobCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleViewDetails = () => {
    router.push(`/job-details?id=${job.id}`);
  };

  const handleGetDirections = () => {
    openDirectionsToJob(job);
  };

  const streetAddress = job.address ? job.address.split(',')[0] : '';
  const formattedStartTime = job.scheduled_start ? formatDate(job.scheduled_start, 'p') : 'Not scheduled';
  const isMediumScreen = scale.screen.isMedium;

  return (
    <Card style={styles.card}>
      <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
      <Text style={[styles.address, { color: colors.placeholder }]}>{streetAddress}</Text>
      
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <FontAwesome name="tag" size={12} color={colors.placeholder} />
          <Text style={[styles.metaText, { color: colors.placeholder }]}>
            {job.job_type.replace(/_/g, ' ')}
          </Text>
        </View>
        {!isMediumScreen && (
          <View style={styles.metaItem}>
            <FontAwesome name="clock-o" size={12} color={colors.placeholder} />
            <Text style={[styles.metaText, { color: colors.placeholder }]}>
              Est. {job.estimated_duration || '--'} min
            </Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <FontAwesome name="calendar-check-o" size={12} color={colors.placeholder} />
          <Text style={[styles.metaText, { color: colors.placeholder }]}>
            {formattedStartTime}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button 
          title="Details" 
          variant="outline" 
          onPress={handleViewDetails} 
          style={styles.button}
          textStyle={styles.buttonText}
        />
        <Button 
          title="Directions" 
          variant="primary" 
          onPress={handleGetDirections} 
          style={styles.button}
          textStyle={styles.buttonText}
          icon={<FontAwesome name="location-arrow" size={14} color={colors.background} />}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    ...spacing.helpers.padding('m'),
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  jobTitle: {
    ...typography.h3,
    ...spacing.helpers.marginBottom('xs'),
  },
  address: {
    ...typography.body,
    ...spacing.helpers.marginBottom('m'),
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    ...spacing.helpers.marginBottom('m'),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.body2,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.s,
  },
  button: {
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
  },
}); 