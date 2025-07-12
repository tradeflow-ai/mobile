/**
 * Connection Quality Indicator Component
 * Displays real-time connection quality with visual indicators
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '../useColorScheme';
import Colors from '../../constants/Colors';
import { typography, spacing, shadows, radius } from '../../constants/Theme';
import { useConnectionQuality, useConnectionQualityIndicators, useManualQualityTest } from '../../hooks/useConnectionQuality';

// ==================== TYPES ====================

interface ConnectionQualityIndicatorProps {
  variant?: 'compact' | 'detailed' | 'mini';
  showTestButton?: boolean;
  onPress?: () => void;
  style?: any;
}

interface ConnectionQualityBadgeProps {
  level: 'excellent' | 'good' | 'poor' | 'offline';
  color: string;
  size?: 'small' | 'medium' | 'large';
}

interface ConnectionStatsProps {
  speed: number;
  latency: number;
  qualityScore: number;
  isStable: boolean;
}

// ==================== MAIN COMPONENT ====================

export const ConnectionQualityIndicator: React.FC<ConnectionQualityIndicatorProps> = ({
  variant = 'compact',
  showTestButton = false,
  onPress,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { 
    connectionQuality, 
    qualityLevel, 
    qualityScore, 
    speed, 
    latency, 
    isStable, 
    isOnline 
  } = useConnectionQuality();
  
  const { 
    qualityColor, 
    qualityIcon, 
    qualityText, 
    speedText, 
    latencyText, 
    stabilityText 
  } = useConnectionQualityIndicators();
  
  const { isTesting, runTest, canTest } = useManualQualityTest();

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handleTestPress = async () => {
    if (canTest) {
      try {
        await runTest();
      } catch (error) {
        console.error('Connection quality test failed:', error);
      }
    }
  };

  if (variant === 'mini') {
    return (
      <TouchableOpacity
        style={[styles.miniContainer, style]}
        onPress={handlePress}
        disabled={!onPress}
      >
        <ConnectionQualityBadge
          level={qualityLevel}
          color={qualityColor}
          size="small"
        />
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { backgroundColor: colors.card },
          shadows.subtle(colorScheme),
          style,
        ]}
        onPress={handlePress}
        disabled={!onPress}
      >
        <View style={styles.compactContent}>
          <ConnectionQualityBadge
            level={qualityLevel}
            color={qualityColor}
            size="medium"
          />
          <View style={styles.compactInfo}>
            <Text style={[styles.qualityText, { color: colors.text }]}>
              {qualityText}
            </Text>
            <Text style={[styles.speedText, { color: colors.placeholder }]}>
              {speedText} • {latencyText}
            </Text>
          </View>
          {showTestButton && (
            <TouchableOpacity
              style={[styles.testButton, { borderColor: colors.border }]}
              onPress={handleTestPress}
              disabled={!canTest}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <FontAwesome name="refresh" size={14} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.detailedContainer,
        { backgroundColor: colors.card },
        shadows.subtle(colorScheme),
        style,
      ]}
    >
      <View style={styles.detailedHeader}>
        <View style={styles.detailedTitle}>
          <ConnectionQualityBadge
            level={qualityLevel}
            color={qualityColor}
            size="large"
          />
          <Text style={[styles.detailedQualityText, { color: colors.text }]}>
            {qualityText} Connection
          </Text>
        </View>
        {showTestButton && (
          <TouchableOpacity
            style={[styles.testButton, { borderColor: colors.border }]}
            onPress={handleTestPress}
            disabled={!canTest}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <FontAwesome name="refresh" size={14} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <ConnectionStats
        speed={speed}
        latency={latency}
        qualityScore={qualityScore}
        isStable={isStable}
      />
      
      <View style={styles.detailedFooter}>
        <Text style={[styles.statusText, { color: colors.placeholder }]}>
          {isOnline ? 'Connected' : 'Offline'} • {stabilityText}
        </Text>
        <Text style={[styles.scoreText, { color: qualityColor }]}>
          {qualityScore}% quality
        </Text>
      </View>
    </View>
  );
};

// ==================== SUB-COMPONENTS ====================

const ConnectionQualityBadge: React.FC<ConnectionQualityBadgeProps> = ({
  level,
  color,
  size = 'medium',
}) => {
  const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const containerSize = size === 'small' ? 20 : size === 'medium' ? 28 : 36;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color, width: containerSize, height: containerSize },
      ]}
    >
      <FontAwesome name="wifi" size={iconSize} color="white" />
    </View>
  );
};

const ConnectionStats: React.FC<ConnectionStatsProps> = ({
  speed,
  latency,
  qualityScore,
  isStable,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <FontAwesome name="download" size={14} color={colors.placeholder} />
        <Text style={[styles.statLabel, { color: colors.placeholder }]}>
          Speed
        </Text>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {speed.toFixed(1)} Mbps
        </Text>
      </View>
      
      <View style={styles.statItem}>
        <FontAwesome name="clock-o" size={14} color={colors.placeholder} />
        <Text style={[styles.statLabel, { color: colors.placeholder }]}>
          Latency
        </Text>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {latency}ms
        </Text>
      </View>
      
      <View style={styles.statItem}>
        <FontAwesome name="signal" size={14} color={colors.placeholder} />
        <Text style={[styles.statLabel, { color: colors.placeholder }]}>
          Quality
        </Text>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {qualityScore}%
        </Text>
      </View>
      
      <View style={styles.statItem}>
        <FontAwesome 
          name={isStable ? "check-circle" : "exclamation-triangle"} 
          size={14} 
          color={isStable ? colors.success : colors.warning} 
        />
        <Text style={[styles.statLabel, { color: colors.placeholder }]}>
          Stability
        </Text>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {isStable ? 'Stable' : 'Unstable'}
        </Text>
      </View>
    </View>
  );
};

// ==================== ADDITIONAL COMPONENTS ====================

export const ConnectionQualityBar: React.FC<{
  qualityScore: number;
  level: string;
  style?: any;
}> = ({ qualityScore, level, style }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { qualityColor } = useConnectionQualityIndicators();
  
  const barWidthPercent = Math.max(qualityScore, 5);
  
  return (
    <View style={[styles.qualityBarContainer, style]}>
      <View style={[styles.qualityBarBackground, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.qualityBarFill,
            { width: `${barWidthPercent}%`, backgroundColor: qualityColor },
          ]}
        />
      </View>
      <Text style={[styles.qualityBarText, { color: colors.text }]}>
        {qualityScore}%
      </Text>
    </View>
  );
};

export const ConnectionQualityPanel: React.FC<{
  showStats?: boolean;
  onClose?: () => void;
  style?: any;
}> = ({ showStats = true, onClose, style }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { connectionQuality, qualityHistory } = useConnectionQuality();
  const { isTesting, runTest, canTest } = useManualQualityTest();
  
  return (
    <View
      style={[
        styles.panelContainer,
        { backgroundColor: colors.card },
        shadows.subtle(colorScheme),
        style,
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={[styles.panelTitle, { color: colors.text }]}>
          Connection Quality
        </Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome name="times" size={16} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>
      
      <ConnectionQualityIndicator
        variant="detailed"
        showTestButton={true}
        style={styles.panelIndicator}
      />
      
      {showStats && qualityHistory.length > 0 && (
        <View style={styles.panelStats}>
          <Text style={[styles.panelStatsTitle, { color: colors.text }]}>
            Recent Tests
          </Text>
          <View style={styles.historyContainer}>
            {qualityHistory.slice(-5).map((quality, index) => (
              <View key={index} style={styles.historyItem}>
                <ConnectionQualityBadge
                  level={quality.level}
                  color={quality.level === 'excellent' ? '#10B981' : 
                         quality.level === 'good' ? '#F59E0B' : 
                         quality.level === 'poor' ? '#EF4444' : '#6B7280'}
                  size="small"
                />
                <Text style={[styles.historyText, { color: colors.placeholder }]}>
                  {quality.downloadSpeed.toFixed(1)} Mbps • {quality.latency}ms
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  // Mini variant
  miniContainer: {
    ...spacing.helpers.padding('xs'),
  },
  
  // Compact variant
  compactContainer: {
    ...spacing.helpers.padding('s'),
    borderRadius: radius.m,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  compactInfo: {
    flex: 1,
  },
  qualityText: {
    ...typography.body,
    fontWeight: '600',
  },
  speedText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  
  // Detailed variant
  detailedContainer: {
    ...spacing.helpers.padding('m'),
    borderRadius: radius.m,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  detailedTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  detailedQualityText: {
    ...typography.h4,
    fontWeight: '600',
  },
  detailedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.m,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statusText: {
    ...typography.caption,
  },
  scoreText: {
    ...typography.caption,
    fontWeight: '600',
  },
  
  // Badge
  badge: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.s,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
  },
  
  // Test button
  testButton: {
    width: 32,
    height: 32,
    borderRadius: radius.m,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Quality bar
  qualityBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  qualityBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: radius.s,
  },
  qualityBarFill: {
    height: '100%',
    borderRadius: radius.s,
  },
  qualityBarText: {
    ...typography.caption,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  
  // Panel
  panelContainer: {
    borderRadius: radius.m,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...spacing.helpers.padding('m'),
    paddingBottom: spacing.s,
  },
  panelTitle: {
    ...typography.h4,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelIndicator: {
    marginHorizontal: spacing.m,
  },
  panelStats: {
    ...spacing.helpers.padding('m'),
    paddingTop: spacing.s,
  },
  panelStatsTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  historyContainer: {
    gap: spacing.s,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  historyText: {
    ...typography.caption,
  },
});

// ==================== EXPORTS ====================

export default ConnectionQualityIndicator; 