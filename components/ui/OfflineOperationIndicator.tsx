import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';

type OperationStatus = 'pending' | 'syncing' | 'failed' | 'synced' | 'offline';

interface OfflineOperationIndicatorProps {
  status: OperationStatus;
  operationId?: string;
  onRetry?: () => void;
  size?: 'small' | 'medium';
  showText?: boolean;
}

export const OfflineOperationIndicator: React.FC<OfflineOperationIndicatorProps> = ({
  status,
  operationId,
  onRetry,
  size = 'small',
  showText = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          color: colors.warning,
          backgroundColor: colors.warning + '20',
          icon: 'clock-o' as const,
          text: 'Pending',
          description: 'Waiting to sync',
        };
      case 'syncing':
        return {
          color: colors.primary,
          backgroundColor: colors.primary + '20',
          icon: 'refresh' as const,
          text: 'Syncing',
          description: 'Syncing now',
        };
      case 'failed':
        return {
          color: colors.error,
          backgroundColor: colors.error + '20',
          icon: 'exclamation-triangle' as const,
          text: 'Failed',
          description: 'Sync failed',
        };
      case 'offline':
        return {
          color: colors.placeholder,
          backgroundColor: colors.placeholder + '20',
          icon: 'wifi' as const,
          text: 'Offline',
          description: 'Created offline',
        };
      default:
        return {
          color: colors.success,
          backgroundColor: colors.success + '20',
          icon: 'check' as const,
          text: 'Synced',
          description: 'Synced successfully',
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Don't show indicator if synced and text is not requested
  if (status === 'synced' && !showText) {
    return null;
  }

  const handlePress = () => {
    if (status === 'failed' && onRetry) {
      onRetry();
    }
  };

  const isInteractive = status === 'failed' && onRetry;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: statusConfig.backgroundColor },
        size === 'medium' && styles.mediumContainer,
        isInteractive && styles.interactiveContainer,
      ]}
      onPress={isInteractive ? handlePress : undefined}
      disabled={!isInteractive}
      activeOpacity={isInteractive ? 0.7 : 1}
    >
      <FontAwesome
        name={statusConfig.icon}
        size={size === 'medium' ? 14 : 12}
        color={statusConfig.color}
        style={status === 'syncing' ? styles.spinningIcon : undefined}
      />
      {showText && (
        <Text
          style={[
            styles.text,
            { color: statusConfig.color },
            size === 'medium' && styles.mediumText,
          ]}
        >
          {statusConfig.text}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.s,
    minWidth: 20,
    minHeight: 20,
  },
  mediumContainer: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    minWidth: 24,
    minHeight: 24,
  },
  interactiveContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  text: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontSize: 11,
    fontWeight: '600',
  },
  mediumText: {
    fontSize: 12,
  },
  spinningIcon: {
    // Note: For actual spinning animation, we'd need to use Animated.View
    // This is a placeholder for the spinning effect
  },
}); 