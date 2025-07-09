import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius, touchTargets } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { SearchBar, EmptyState } from '@/components/ui';
import { useJobs, useTodaysJobs, JobLocation } from '@/hooks/useJobs';
import { formatDate } from '@/utils/dateUtils';

export default function JobsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  // Data fetching
  const { data: allJobs = [], isLoading: isLoadingAll } = useJobs();
  const { data: todaysJobs = [], isLoading: isLoadingToday } = useTodaysJobs();

  // Determine which jobs to show
  const jobs = showTodayOnly ? todaysJobs : allJobs;
  const isLoading = showTodayOnly ? isLoadingToday : isLoadingAll;

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJobPress = (job: JobLocation) => {
    router.push(`/job-details?id=${job.id}`);
  };

  const handleCreateJob = () => {
    router.push('/create-job');
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



  const renderJob = ({ item }: { item: JobLocation }) => (
    <TouchableOpacity
      style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleJobPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobHeaderLeft}>
          <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.jobMeta}>
                         <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
               <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                 {item.status.toUpperCase()}
               </Text>
             </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={styles.jobHeaderRight}>
          <Text style={[styles.jobType, { color: colors.placeholder }]}>
            {item.job_type.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={[styles.estimatedDuration, { color: colors.placeholder }]}>
            {item.estimated_duration || 60}min
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.jobDescription, { color: colors.text }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.jobDetails}>
        <View style={styles.jobDetailRow}>
          <FontAwesome name="map-marker" size={14} color={colors.placeholder} />
          <Text style={[styles.jobAddress, { color: colors.placeholder }]} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        
        {item.customer_name && (
          <View style={styles.jobDetailRow}>
            <FontAwesome name="user" size={14} color={colors.placeholder} />
            <Text style={[styles.customerName, { color: colors.placeholder }]} numberOfLines={1}>
              {item.customer_name}
            </Text>
          </View>
        )}
        
        <View style={styles.jobDetailRow}>
          <FontAwesome name="clock-o" size={14} color={colors.placeholder} />
          <Text style={[styles.scheduledTime, { color: colors.placeholder }]}>
            {formatDate(item.scheduled_start, 'Not scheduled')}
          </Text>
        </View>
      </View>

      <View style={styles.jobFooter}>
        <Text style={[styles.createdAt, { color: colors.placeholder }]}>
          Created {formatDate(item.created_at)}
        </Text>
        <FontAwesome name="chevron-right" size={16} color={colors.placeholder} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="briefcase"
      title={searchQuery ? 'No jobs found' : showTodayOnly ? 'No jobs today' : 'No jobs'}
      description={searchQuery ? 'Try adjusting your search terms' : 'Create your first job to get started'}
      createButtonText={searchQuery ? undefined : 'Create Job'}
      handleOnCreatePress={handleCreateJob}
    />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Header
          title="Jobs"
          rightAction={{
            icon: 'plus',
            onPress: handleCreateJob,
          }}
        />

        <View style={styles.content}>
          {/* Search Bar */}
          <SearchBar
            placeholder="Search jobs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />

          {/* Today/All Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                showTodayOnly && styles.toggleButtonActive,
                { backgroundColor: showTodayOnly ? colors.primary : colors.card, borderColor: colors.border }
              ]}
              onPress={() => setShowTodayOnly(true)}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: showTodayOnly ? colors.background : colors.text }
              ]}>
                Today ({todaysJobs.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                !showTodayOnly && styles.toggleButtonActive,
                { backgroundColor: !showTodayOnly ? colors.primary : colors.card, borderColor: colors.border }
              ]}
              onPress={() => setShowTodayOnly(false)}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: !showTodayOnly ? colors.background : colors.text }
              ]}>
                All ({allJobs.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Jobs List */}
          <FlatList
            data={filteredJobs}
            renderItem={renderJob}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.jobsList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            ListEmptyComponent={renderEmptyState}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
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
    ...spacing.helpers.padding('m'),
  },
  content: {
    flex: 1,
  },
  searchBar: {
    marginBottom: spacing.m,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    backgroundColor: 'transparent',
    borderRadius: radius.s,
    gap: spacing.xs,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: radius.s,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...touchTargets.styles.minimum,
  },
  toggleButtonActive: {
    // Styles applied when button is active
  },
  toggleButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  jobsList: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.s,
  },
  jobCard: {
    borderRadius: radius.m,
    borderWidth: 1,
    ...spacing.helpers.padding('m'),
    ...shadows.subtle,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  jobHeaderLeft: {
    flex: 1,
  },
  jobHeaderRight: {
    alignItems: 'flex-end',
  },
  jobTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
  },
  priorityText: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  jobType: {
    ...typography.caption,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  estimatedDuration: {
    ...typography.caption,
    fontWeight: '500',
  },
  jobDescription: {
    ...typography.body,
    marginBottom: spacing.s,
    lineHeight: 20,
  },
  jobDetails: {
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  jobAddress: {
    ...typography.body,
    flex: 1,
  },
  customerName: {
    ...typography.body,
    flex: 1,
  },
  scheduledTime: {
    ...typography.body,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: spacing.s,
  },
  createdAt: {
    ...typography.caption,
  },
}); 