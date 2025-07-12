import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, shadows, radius } from '@/constants/Theme';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useConnectionQuality } from '@/hooks/useConnectionQuality';
import { useBatchOperations } from '@/hooks/useBatchOperations';
import { useRetryManagement } from '@/hooks/useRetryManagement';

interface OfflineExperienceBarProps {
  variant?: 'compact' | 'detailed';
  showDetails?: boolean;
  onPress?: () => void;
}

export const OfflineExperienceBar: React.FC<OfflineExperienceBarProps> = ({
  variant = 'compact',
  showDetails = false,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all offline-related data
  const offlineStatus = useOfflineStatus();
  const { connectionQuality, qualityLevel, qualityScore, speed, latency } = useConnectionQuality();
  const { pendingOperations, activeRequests, isProcessing } = useBatchOperations();
  const { failedOperations, retryStats } = useRetryManagement();

  // Calculate total pending operations
  const totalPendingOps = pendingOperations.length + activeRequests.length;
  const totalFailedOps = failedOperations.length;
  const hasActivity = totalPendingOps > 0 || totalFailedOps > 0 || isProcessing;

  // Determine the primary status to show
  const getPrimaryStatus = () => {
    if (!offlineStatus.isOnline) return 'offline';
    if (totalFailedOps > 0) return 'failed';
    if (isProcessing) return 'syncing';
    if (totalPendingOps > 0) return 'pending';
    return 'online';
  };

  const primaryStatus = getPrimaryStatus();

  // Get status colors and icons
  const getStatusConfig = () => {
    switch (primaryStatus) {
      case 'offline':
        return {
          color: colors.error,
          backgroundColor: colors.error + '15',
          icon: 'wifi' as const,
          text: 'Offline',
          description: 'Working offline - changes will sync when connected',
        };
      case 'failed':
        return {
          color: colors.error,
          backgroundColor: colors.error + '15',
          icon: 'exclamation-triangle' as const,
          text: `${totalFailedOps} Failed`,
          description: 'Some operations failed - tap to retry',
        };
      case 'syncing':
        return {
          color: colors.primary,
          backgroundColor: colors.primary + '15',
          icon: 'refresh' as const,
          text: 'Syncing...',
          description: `Processing ${totalPendingOps} operations`,
        };
      case 'pending':
        return {
          color: colors.warning,
          backgroundColor: colors.warning + '15',
          icon: 'clock-o' as const,
          text: `${totalPendingOps} Pending`,
          description: 'Operations queued for sync',
        };
              default:
          return {
            color: colors.success,
            backgroundColor: colors.success + '15',
            icon: 'check-circle' as const,
            text: 'Online',
            description: `Connected - ${qualityLevel} quality`,
          };
    }
  };

  const statusConfig = getStatusConfig();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  if (variant === 'compact' && !hasActivity && offlineStatus.isOnline) {
    // Don't show the bar if online and no activity
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: statusConfig.backgroundColor }]}>
      <TouchableOpacity
        style={[styles.statusBar, { borderColor: statusConfig.color }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.statusContent}>
          <FontAwesome
            name={statusConfig.icon}
            size={16}
            color={statusConfig.color}
            style={primaryStatus === 'syncing' ? styles.spinningIcon : undefined}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
          {variant === 'detailed' && (
            <Text style={[styles.statusDescription, { color: colors.text }]}>
              {statusConfig.description}
            </Text>
          )}
        </View>
        
        {variant === 'detailed' && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailsRow}>
              <Text style={[styles.detailText, { color: colors.placeholder }]}>
                {qualityLevel.toUpperCase()} • {speed.toFixed(1)}Mbps • {latency}ms
              </Text>
              <FontAwesome
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={colors.placeholder}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded Details */}
      {isExpanded && variant === 'detailed' && (
        <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {qualityScore.toFixed(0)}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.placeholder }]}>
                Quality
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {totalPendingOps}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.placeholder }]}>
                Pending
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {totalFailedOps}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.placeholder }]}>
                Failed
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {retryStats.totalFailed}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.placeholder }]}>
                Retries
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.s,
    marginVertical: spacing.xs,
    borderRadius: radius.s,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.s,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    ...typography.body,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  statusDescription: {
    ...typography.caption,
    marginLeft: spacing.s,
    flex: 1,
  },
  detailsContainer: {
    marginLeft: spacing.s,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    ...typography.bodySmall,
    marginRight: spacing.xs,
  },
  expandedContent: {
    borderTopWidth: 1,
    paddingTop: spacing.s,
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.s,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  metricLabel: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  spinningIcon: {
    // Note: React Native doesn't support CSS animations directly
    // This would need to be implemented with Animated.View for rotation
  },
}); 