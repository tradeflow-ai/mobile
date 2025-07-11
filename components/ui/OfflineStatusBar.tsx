/**
 * Offline Status Bar Component
 * Shows connection status, queued operations, and sync progress
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
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing } from '@/constants/Theme';

// ==================== COMPONENT PROPS ====================

export interface OfflineStatusBarProps {
  /** Whether to show the status bar */
  visible?: boolean;
  /** Whether to show detailed status information */
  detailed?: boolean;
  /** Whether to show sync button */
  showSyncButton?: boolean;
  /** Custom styles */
  style?: any;
  /** Callback when sync button is pressed */
  onSyncPress?: () => void;
}

// ==================== MAIN COMPONENT ====================

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  visible = true,
  detailed = false,
  showSyncButton = true,
  style,
  onSyncPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    isOnline,
    connectionQuality,
    queuedOperationsCount,
    syncInProgress,
    lastSync,
    estimatedSyncTime,
    getStatusColor,
    getStatusIcon,
    getStatusText,
    forceSync,
  } = useOfflineStatus();

  // Don't render if not visible or if online with no queued operations
  if (!visible || (isOnline && queuedOperationsCount === 0 && !syncInProgress)) {
    return null;
  }

  const handleSyncPress = async () => {
    if (onSyncPress) {
      onSyncPress();
      return;
    }

    if (!isOnline) {
      Alert.alert(
        'No Connection',
        'Cannot sync while offline. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await forceSync();
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        'Failed to sync data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();
  const statusText = getStatusText();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }, style]}>
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
          {syncInProgress ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <FontAwesome
              name={statusIcon}
              size={14}
              color={colors.background}
            />
          )}
        </View>

        {/* Status Text */}
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {statusText}
          </Text>
          
          {detailed && (
            <Text style={[styles.detailText, { color: colors.secondary }]}>
              {getDetailedStatus()}
            </Text>
          )}
        </View>

        {/* Sync Button */}
        {showSyncButton && queuedOperationsCount > 0 && (
          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: colors.primary }]}
            onPress={handleSyncPress}
            disabled={syncInProgress || !isOnline}
          >
            <Text style={[styles.syncButtonText, { color: colors.background }]}>
              {syncInProgress ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      {syncInProgress && estimatedSyncTime && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { backgroundColor: statusColor, width: '60%' }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.secondary }]}>
            Est. {estimatedSyncTime}s remaining
          </Text>
        </View>
      )}
    </View>
  );

  function getDetailedStatus(): string {
    if (!isOnline) {
      return `Connection: ${connectionQuality}`;
    }
    
    if (queuedOperationsCount > 0) {
      return `${queuedOperationsCount} operations queued`;
    }
    
    if (lastSync) {
      const timeSinceSync = Math.floor((Date.now() - lastSync.getTime()) / 1000 / 60);
      return `Last sync: ${timeSinceSync}m ago`;
    }
    
    return 'All data synchronized';
  }
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    ...spacing.helpers.padding('s'),
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    ...typography.body,
    fontWeight: '500',
  },
  detailText: {
    ...typography.caption,
    marginTop: 2,
  },
  syncButton: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  syncButtonText: {
    ...typography.caption,
    fontWeight: '600',
  },
  progressContainer: {
    ...spacing.helpers.paddingHorizontal('s'),
    paddingBottom: spacing.s,
  },
  progressBar: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  progressText: {
    ...typography.caption,
    textAlign: 'center',
  },
});

export default OfflineStatusBar; 