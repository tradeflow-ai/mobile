/**
 * Optimistic Status Bar Component
 * Shows users the status of optimistic operations with progress and feedback
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useOptimisticUpdates } from '@/hooks/useOptimisticUpdates';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';

// ==================== COMPONENT PROPS ====================

export interface OptimisticStatusBarProps {
  /** Whether to show the status bar */
  visible?: boolean;
  /** Position of the status bar */
  position?: 'top' | 'bottom';
  /** Custom styles */
  style?: any;
  /** Callback when status bar is pressed */
  onPress?: () => void;
}

// ==================== MAIN COMPONENT ====================

export const OptimisticStatusBar: React.FC<OptimisticStatusBarProps> = ({
  visible = true,
  position = 'bottom',
  style,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    operations,
    pendingCount,
    hasErrors,
    isOperating,
  } = useOptimisticUpdates();

  // Don't render if not visible or no operations
  if (!visible || operations.length === 0) {
    return null;
  }

  // Get the most recent error for display
  const latestError = operations
    .filter(op => op.status === 'error')
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  // Get the status to display
  const getStatusInfo = () => {
    if (hasErrors) {
      return {
        icon: 'exclamation-circle',
        color: colors.error,
        text: `${latestError?.type || 'Operation'} failed`,
        subtext: 'Tap to retry',
      };
    }
    
    if (isOperating) {
      return {
        icon: 'clock-o',
        color: colors.warning,
        text: `${pendingCount} operation${pendingCount > 1 ? 's' : ''} pending`,
        subtext: 'Syncing...',
      };
    }
    
    return {
      icon: 'check-circle',
      color: colors.success,
      text: 'All operations completed',
      subtext: 'Everything up to date',
    };
  };

  const statusInfo = getStatusInfo();

  const renderContent = () => (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.card,
        borderColor: statusInfo.color,
      },
      position === 'top' && styles.topPosition,
      position === 'bottom' && styles.bottomPosition,
    ]}>
      {/* Status Icon */}
      <View style={styles.iconContainer}>
        {isOperating ? (
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

      {/* Operation Count Badge */}
      {pendingCount > 0 && (
        <View style={[
          styles.badge,
          { backgroundColor: statusInfo.color }
        ]}>
          <Text style={[
            styles.badgeText,
            { color: colors.background }
          ]}>
            {pendingCount}
          </Text>
        </View>
      )}

      {/* Action Icon */}
      {(hasErrors || onPress) && (
        <FontAwesome
          name="chevron-right"
          size={12}
          color={colors.placeholder}
          style={styles.actionIcon}
        />
      )}
    </View>
  );

  if (onPress || hasErrors) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        style={style}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={style}>
      {renderContent()}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
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
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  actionIcon: {
    marginLeft: spacing.s,
  },
});

export default OptimisticStatusBar; 