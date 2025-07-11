/**
 * Batch Progress Bar Component
 * Shows progress of batch operations with detailed information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useBatchOperations, useBatchProgress } from '@/hooks/useBatchOperations';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';

// ==================== COMPONENT PROPS ====================

export interface BatchProgressBarProps {
  /** Whether to show the progress bar */
  visible?: boolean;
  /** Whether to show detailed information */
  detailed?: boolean;
  /** Whether to show force sync button */
  showSyncButton?: boolean;
  /** Position of the progress bar */
  position?: 'top' | 'bottom';
  /** Custom styles */
  style?: any;
  /** Callback when sync button is pressed */
  onSyncPress?: () => void;
}

// ==================== MAIN COMPONENT ====================

export const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  visible = true,
  detailed = false,
  showSyncButton = true,
  position = 'bottom',
  style,
  onSyncPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    progress,
    isProcessing,
    totalPending,
    hasCriticalOperations,
  } = useBatchProgress();

  const {
    forceProcess,
    clearPending,
    pendingCount,
  } = useBatchOperations();

  // Don't render if not visible or no operations
  if (!visible || (totalPending === 0 && !isProcessing)) {
    return null;
  }

  const handleSyncPress = async () => {
    if (onSyncPress) {
      onSyncPress();
      return;
    }

    try {
      await forceProcess();
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        'Failed to process batch operations. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearPress = () => {
    Alert.alert(
      'Clear Operations',
      'Are you sure you want to clear all pending operations? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: clearPending 
        },
      ]
    );
  };

  const getStatusInfo = () => {
    if (isProcessing && progress) {
      return {
        icon: 'refresh',
        color: colors.primary,
        text: `Processing (${progress.progress}%)`,
        subtext: progress.currentOperation || 'Syncing operations...',
      };
    }
    
    if (totalPending > 0) {
      return {
        icon: 'clock-o',
        color: hasCriticalOperations ? colors.error : colors.warning,
        text: `${totalPending} operation${totalPending > 1 ? 's' : ''} pending`,
        subtext: hasCriticalOperations ? 
          `${pendingCount.critical} critical, ${pendingCount.normal} normal, ${pendingCount.low} low` :
          'Waiting to sync',
      };
    }
    
    return {
      icon: 'check-circle',
      color: colors.success,
      text: 'All operations completed',
      subtext: 'Everything synchronized',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.card,
        borderColor: statusInfo.color,
      },
      position === 'top' && styles.topPosition,
      position === 'bottom' && styles.bottomPosition,
      style,
    ]}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={statusInfo.color} />
          ) : (
            <FontAwesome
              name={statusInfo.icon as any}
              size={16}
              color={statusInfo.color}
            />
          )}
        </View>

        {/* Status Text */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.statusText,
            { color: colors.text }
          ]}>
            {statusInfo.text}
          </Text>
          <Text style={[
            styles.subtextText,
            { color: colors.placeholder }
          ]}>
            {statusInfo.subtext}
          </Text>
        </View>

        {/* Operation Count Badges */}
        {totalPending > 0 && detailed && (
          <View style={styles.badgeContainer}>
            {pendingCount.critical > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={[styles.badgeText, { color: colors.background }]}>
                  {pendingCount.critical}
                </Text>
              </View>
            )}
            {pendingCount.normal > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                <Text style={[styles.badgeText, { color: colors.background }]}>
                  {pendingCount.normal}
                </Text>
              </View>
            )}
            {pendingCount.low > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.success }]}>
                <Text style={[styles.badgeText, { color: colors.background }]}>
                  {pendingCount.low}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {showSyncButton && totalPending > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleSyncPress}
              disabled={isProcessing}
            >
              <Text style={[styles.actionButtonText, { color: colors.background }]}>
                {isProcessing ? 'Syncing...' : 'Sync'}
              </Text>
            </TouchableOpacity>
          )}
          
          {detailed && totalPending > 0 && !isProcessing && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.border }]}
              onPress={handleClearPress}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      {isProcessing && progress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: statusInfo.color,
                  width: `${progress.progress}%`
                }
              ]} 
            />
          </View>
          
          {detailed && (
            <View style={styles.progressDetails}>
              <Text style={[styles.progressText, { color: colors.placeholder }]}>
                {progress.completedOperations} of {progress.totalOperations} completed
              </Text>
              {progress.estimatedTimeRemaining && (
                <Text style={[styles.progressText, { color: colors.placeholder }]}>
                  ~{Math.ceil(progress.estimatedTimeRemaining)}s remaining
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.m,
    borderWidth: 1,
    marginHorizontal: spacing.m,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topPosition: {
    marginTop: spacing.s,
  },
  bottomPosition: {
    marginBottom: spacing.s,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  iconContainer: {
    marginRight: spacing.s,
    width: 20,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtextText: {
    ...typography.caption,
    fontSize: 11,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.xs,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.s,
  },
  actionButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
  },
  actionButtonText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    ...typography.caption,
    fontSize: 10,
  },
});

export default BatchProgressBar; 