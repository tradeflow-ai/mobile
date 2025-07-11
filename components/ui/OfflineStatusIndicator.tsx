/**
 * Offline Status Indicator Component
 * Compact status indicator for headers and small spaces
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
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing } from '@/constants/Theme';

// ==================== COMPONENT PROPS ====================

export interface OfflineStatusIndicatorProps {
  /** Size of the indicator */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show text label */
  showLabel?: boolean;
  /** Whether to show queued operations count */
  showQueueCount?: boolean;
  /** Custom styles */
  style?: any;
  /** Callback when indicator is pressed */
  onPress?: () => void;
}

// ==================== MAIN COMPONENT ====================

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  size = 'medium',
  showLabel = false,
  showQueueCount = false,
  style,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    isOnline,
    connectionQuality,
    queuedOperationsCount,
    syncInProgress,
    isManualOfflineMode,
    getStatusColor,
    getStatusIcon,
    getStatusText,
  } = useOfflineStatus();

  // Size configurations
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 12,
          containerSize: 20,
          textSize: 'caption' as const,
        };
      case 'large':
        return {
          iconSize: 18,
          containerSize: 32,
          textSize: 'body' as const,
        };
      default: // medium
        return {
          iconSize: 14,
          containerSize: 24,
          textSize: 'caption' as const,
        };
    }
  };

  const sizeConfig = getSizeConfig();
  // Override status for manual mode
  const statusColor = isManualOfflineMode ? '#9B59B6' : getStatusColor(); // Purple for manual mode
  const statusIcon = isManualOfflineMode ? 'hand-stop-o' : getStatusIcon();
  const statusText = isManualOfflineMode ? 'Manual Offline' : getStatusText();

  const renderIndicator = () => (
    <View style={styles.container}>
      {/* Status Icon */}
      <View style={[
        styles.statusIcon,
        {
          backgroundColor: statusColor,
          width: sizeConfig.containerSize,
          height: sizeConfig.containerSize,
          borderRadius: sizeConfig.containerSize / 2,
        }
      ]}>
        {syncInProgress ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
                     <FontAwesome
             name={statusIcon as any}
             size={sizeConfig.iconSize}
             color={colors.background}
           />
        )}
      </View>

      {/* Queued Operations Badge */}
      {showQueueCount && queuedOperationsCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text style={[styles.badgeText, { color: colors.background }]}>
            {queuedOperationsCount > 9 ? '9+' : queuedOperationsCount}
          </Text>
        </View>
      )}

      {/* Status Label */}
      {showLabel && (
        <Text style={[
          styles.label,
          typography[sizeConfig.textSize],
          { color: colors.text }
        ]}>
          {statusText}
        </Text>
      )}
    </View>
  );

  // Only make it pressable if onPress is provided (read-only status indicator)
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={style}>
        {renderIndicator()}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={style}>
      {renderIndicator()}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  statusIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  label: {
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
});

export default OfflineStatusIndicator; 