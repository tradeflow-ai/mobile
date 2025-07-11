import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius, touchTargets } from '@/constants/Theme';
import { Header } from '@/components/Header';
import { SearchBar, EmptyState, TabSelector, TabOption, OfflineExperienceBar } from '@/components/ui';
import { useJobs, useTodaysJobs, JobLocation } from '@/hooks/useJobs';
import { formatDate, formatDateOnly } from '@/utils/dateUtils';
import { useAtomValue } from 'jotai';
import { activeJobAtom } from '@/store/atoms';
import { ActiveJobCard } from '@/components/ActiveJobCard';

export default function JobsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Get active job
  const activeJob = useAtomValue(activeJobAtom);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('today');

  // Data fetching
  const { data: allJobs = [], isLoading: isLoadingAll } = useJobs();
  const { data: todaysJobs = [], isLoading: isLoadingToday } = useTodaysJobs();

  // Determine which jobs to show
  const jobs = selectedJobFilter === 'today' ? todaysJobs : allJobs;
  const isLoading = selectedJobFilter === 'today' ? isLoadingToday : isLoadingAll;

  // Job options for TabSelector
  const jobOptions: TabOption[] = [
    { key: 'today', label: 'Today', count: todaysJobs.length },
    { key: 'all', label: 'All', count: allJobs.length },
  ];

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

  const handleJobFilterChange = (key: string) => {
    setSelectedJobFilter(key);
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
          <FontAwesome 
            name={item.use_ai_scheduling ? "magic" : "clock-o"} 
            size={14} 
            color={item.use_ai_scheduling ? colors.primary : colors.placeholder} 
          />
          <View style={styles.timeContainer}>
            <Text style={[styles.scheduledTime, { color: colors.placeholder }]}>
              {(() => {
                // Display scheduled_start if available (AI-generated or finalized times)
                if (item.scheduled_start) {
                  return item.use_ai_scheduling 
                    ? formatDateOnly(item.scheduled_start, 'Not scheduled')
                    : formatDate(item.scheduled_start, 'Not scheduled');
                }
                // Fall back to scheduled_date if available (user's preferred date)
                else if (item.scheduled_date) {
                  return formatDateOnly(item.scheduled_date, 'Not scheduled');
                }
                // Default fallback
                else {
                  return 'Not scheduled';
                }
              })()}
            </Text>
            {item.use_ai_scheduling && !item.scheduled_start && (
              <Text style={[
                styles.aiSchedulingIndicator, 
                { 
                  color: colors.primary,
                  fontStyle: 'italic'
                }
              ]}>
                ✨ AI will select optimal times
              </Text>
            )}
          </View>
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
      title={searchQuery ? 'No jobs found' : selectedJobFilter === 'today' ? 'No jobs today' : 'No jobs'}
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

        {/* Offline Experience Bar */}
        <OfflineExperienceBar variant="compact" />

        <View style={styles.content}>
          {/* Active Job Card */}
          {activeJob && (
            <View style={styles.activeJobContainer}>
              <ActiveJobCard job={activeJob} />
            </View>
          )}

          {/* Search Bar */}
          <SearchBar
            placeholder="Search jobs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />

          {/* Today/All Toggle */}
          <TabSelector
            options={jobOptions}
            selectedKey={selectedJobFilter}
            onSelectionChange={handleJobFilterChange}
            containerStyle={styles.toggleContainer}
          />

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
  activeJobContainer: {
    marginBottom: spacing.m,
  },
  content: {
    flex: 1,
  },
  searchBar: {
    marginBottom: spacing.m,
  },
  toggleContainer: {
    marginBottom: spacing.m,
  },
  jobsList: {
    flexGrow: 1,
    paddingBottom: 64, // Add extra bottom padding to ensure full scrollability (spacing.2xl + spacing.m = 48 + 16)
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
  timeContainer: {
    flex: 1,
  },
  aiSchedulingIndicator: {
    ...typography.caption,
    marginTop: spacing.xs,
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