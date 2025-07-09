import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, touchTargets } from '@/constants/Theme';
import { Card, Button } from '@/components/ui';
import { useJob, JobLocation } from '@/hooks/useJobs';
import { useInventory } from '@/hooks/useInventory';
import { formatDate } from '@/utils/dateUtils';

export default function JobDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch job data
  const { data: job, isLoading, error } = useJob(id!);
  const { data: inventoryItems = [] } = useInventory();

  // Set up edit button in header
  useEffect(() => {
    if (job) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleEdit}
            style={{
              ...touchTargets.styles.minimum,
              ...spacing.helpers.paddingHorizontal('s'),
              justifyContent: 'center',
            }}
          >
            <FontAwesome name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    }
  }, [job, navigation, colors.primary]);

  const handleEdit = () => {
    if (job) {
      router.push(`/edit-job?id=${job.id}`);
    }
  };

  const getStatusColor = (status: JobLocation['status']) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'in_progress': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.placeholder;
    }
  };

  const getPriorityColor = (priority: JobLocation['priority']) => {
    switch (priority) {
      case 'urgent': return colors.error;
      case 'high': return '#FF6B35';
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.placeholder;
    }
  };



  const getInventoryItemName = (itemId: string) => {
    const item = inventoryItems.find(item => item.id === itemId);
    return item ? item.name : 'Unknown item';
  };

  const checkInventoryAvailability = (itemId: string, quantityNeeded: number = 1) => {
    const item = inventoryItems.find(item => item.id === itemId);
    if (!item) return { available: false, inStock: 0, needFromStore: quantityNeeded };
    
    const available = item.quantity >= quantityNeeded;
    const inStock = Math.min(item.quantity, quantityNeeded);
    const needFromStore = Math.max(0, quantityNeeded - item.quantity);
    
    return { available, inStock, needFromStore };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Job Not Found</Text>
          <Text style={[styles.errorDescription, { color: colors.placeholder }]}>
            The job you're looking for could not be found.
          </Text>
          <Button
            variant="primary"
            onPress={() => router.back()}
            title="Go Back"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Job Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
            <View style={styles.headerBadges}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(job.status) }]}>
                  {job.status.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) }]}>
                <Text style={styles.priorityText}>{job.priority.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          
          {job.description && (
            <Text style={[styles.jobDescription, { color: colors.text }]}>
              {job.description}
            </Text>
          )}
          
          <View style={styles.jobTypeContainer}>
            <FontAwesome name="briefcase" size={16} color={colors.placeholder} />
            <Text style={[styles.jobType, { color: colors.placeholder }]}>
              {job.job_type.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={[styles.estimatedDuration, { color: colors.placeholder }]}>
              • {job.estimated_duration || 60} minutes
            </Text>
          </View>
        </Card>

        {/* Location Information */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
          <View style={styles.locationRow}>
            <FontAwesome name="map-marker" size={16} color={colors.primary} />
            <Text style={[styles.locationAddress, { color: colors.text }]}>
              {job.address}
            </Text>
          </View>
          <View style={styles.locationCoordinates}>
            <Text style={[styles.coordinatesText, { color: colors.placeholder }]}>
              {job.latitude.toFixed(6)}, {job.longitude.toFixed(6)}
            </Text>
          </View>
        </Card>

        {/* Customer Information */}
        {job.customer_name && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer</Text>
            <View style={styles.customerInfo}>
              <View style={styles.customerRow}>
                <FontAwesome name="user" size={16} color={colors.primary} />
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {job.customer_name}
                </Text>
              </View>
              {job.customer_phone && (
                <View style={styles.customerRow}>
                  <FontAwesome name="phone" size={16} color={colors.primary} />
                  <Text style={[styles.customerDetail, { color: colors.text }]}>
                    {job.customer_phone}
                  </Text>
                </View>
              )}
              {job.customer_email && (
                <View style={styles.customerRow}>
                  <FontAwesome name="envelope" size={16} color={colors.primary} />
                  <Text style={[styles.customerDetail, { color: colors.text }]}>
                    {job.customer_email}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Scheduling Information */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>
          <View style={styles.scheduleInfo}>
            <View style={styles.scheduleRow}>
              <FontAwesome name="calendar" size={16} color={colors.primary} />
              <View style={styles.scheduleDetails}>
                <Text style={[styles.scheduleLabel, { color: colors.placeholder }]}>Scheduled Start</Text>
                <Text style={[styles.scheduleValue, { color: colors.text }]}>
                  {formatDate(job.scheduled_start)}
                </Text>
              </View>
            </View>
            {job.scheduled_end && (
              <View style={styles.scheduleRow}>
                <FontAwesome name="calendar-o" size={16} color={colors.primary} />
                <View style={styles.scheduleDetails}>
                  <Text style={[styles.scheduleLabel, { color: colors.placeholder }]}>Scheduled End</Text>
                  <Text style={[styles.scheduleValue, { color: colors.text }]}>
                    {formatDate(job.scheduled_end)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Required Items */}
        {job.required_items && job.required_items.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Items</Text>
            {job.required_items.map((itemId, index) => {
              const availability = checkInventoryAvailability(itemId);
              return (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {getInventoryItemName(itemId)}
                    </Text>
                    <View style={styles.itemAvailability}>
                      {availability.inStock > 0 && (
                        <View style={[styles.availabilityBadge, { backgroundColor: colors.success + '20' }]}>
                          <FontAwesome name="check" size={12} color={colors.success} />
                          <Text style={[styles.availabilityText, { color: colors.success }]}>
                            {availability.inStock} in stock
                          </Text>
                        </View>
                      )}
                      {availability.needFromStore > 0 && (
                        <View style={[styles.availabilityBadge, { backgroundColor: colors.warning + '20' }]}>
                          <FontAwesome name="shopping-cart" size={12} color={colors.warning} />
                          <Text style={[styles.availabilityText, { color: colors.warning }]}>
                            {availability.needFromStore} from store
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Notes */}
        {job.notes && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>
              {job.notes}
            </Text>
          </Card>
        )}

        {/* Completion Notes */}
        {job.completion_notes && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Completion Notes</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>
              {job.completion_notes}
            </Text>
          </Card>
        )}

        {/* Timestamps */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Timestamps</Text>
          <View style={styles.timestampInfo}>
            <View style={styles.timestampRow}>
              <Text style={[styles.timestampLabel, { color: colors.placeholder }]}>Created</Text>
              <Text style={[styles.timestampValue, { color: colors.text }]}>
                {formatDate(job.created_at)}
              </Text>
            </View>
            <View style={styles.timestampRow}>
              <Text style={[styles.timestampLabel, { color: colors.placeholder }]}>Last Updated</Text>
              <Text style={[styles.timestampValue, { color: colors.text }]}>
                {formatDate(job.updated_at)}
              </Text>
            </View>
            {job.actual_start && (
              <View style={styles.timestampRow}>
                <Text style={[styles.timestampLabel, { color: colors.placeholder }]}>Started</Text>
                <Text style={[styles.timestampValue, { color: colors.text }]}>
                  {formatDate(job.actual_start)}
                </Text>
              </View>
            )}
            {job.actual_end && (
              <View style={styles.timestampRow}>
                <Text style={[styles.timestampLabel, { color: colors.placeholder }]}>Completed</Text>
                <Text style={[styles.timestampValue, { color: colors.text }]}>
                  {formatDate(job.actual_end)}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.m,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...spacing.helpers.padding('l'),
  },
  errorTitle: {
    ...typography.h3,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  errorDescription: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  backButton: {
    marginTop: spacing.m,
  },
  headerCard: {
    ...spacing.helpers.margin('m'),
    marginBottom: spacing.s,
  },
  sectionCard: {
    ...spacing.helpers.marginHorizontal('m'),
    marginBottom: spacing.s,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  jobTitle: {
    ...typography.h2,
    flex: 1,
    marginRight: spacing.m,
  },
  headerBadges: {
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  priorityText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  jobDescription: {
    ...typography.body,
    marginBottom: spacing.s,
    lineHeight: 22,
  },
  jobTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  jobType: {
    ...typography.body,
    fontWeight: '500',
  },
  estimatedDuration: {
    ...typography.body,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.m,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  locationAddress: {
    ...typography.body,
    flex: 1,
    lineHeight: 20,
  },
  locationCoordinates: {
    marginTop: spacing.s,
    marginLeft: spacing.l,
  },
  coordinatesText: {
    ...typography.caption,
    fontFamily: 'monospace',
  },
  customerInfo: {
    gap: spacing.s,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  customerName: {
    ...typography.body,
    fontWeight: '600',
  },
  customerDetail: {
    ...typography.body,
  },
  scheduleInfo: {
    gap: spacing.m,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  scheduleValue: {
    ...typography.body,
  },
  itemRow: {
    marginBottom: spacing.m,
  },
  itemInfo: {
    gap: spacing.s,
  },
  itemName: {
    ...typography.body,
    fontWeight: '600',
  },
  itemAvailability: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    gap: spacing.xs,
  },
  availabilityText: {
    ...typography.caption,
    fontWeight: '500',
  },
  notesText: {
    ...typography.body,
    lineHeight: 22,
  },
  timestampInfo: {
    gap: spacing.s,
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampLabel: {
    ...typography.body,
    fontWeight: '500',
  },
  timestampValue: {
    ...typography.body,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
}); 