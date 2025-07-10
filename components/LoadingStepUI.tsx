/**
 * TradeFlow Mobile App - Loading Step UI Component
 * 
 * Displays the current AI agent processing status with animated indicators
 * and real-time connection status. Used throughout the Plan Your Day workflow
 * to show progress and provide feedback during agent execution.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { typography, spacing, radius } from '@/constants/Theme';

interface LoadingStepUIProps {
  /**
   * The current step being processed by the AI agent
   */
  step: string;
  
  /**
   * Whether the real-time connection is active
   * @default true
   */
  isConnected?: boolean;
  
  /**
   * Optional plan ID for debugging
   */
  planId?: string;
  
  /**
   * Additional subtitle text
   */
  subtitle?: string;
}

export const LoadingStepUI: React.FC<LoadingStepUIProps> = ({
  step,
  isConnected = true,
  planId,
  subtitle,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.content}>
          {/* Main Loading Indicator */}
          <View style={styles.loadingSection}>
            <ActivityIndicator 
              size="large" 
              color={colors.primary}
              style={styles.spinner}
            />
            
            <View style={styles.textSection}>
              <Text style={[styles.stepText, { color: colors.text }]}>
                {step}
              </Text>
              
              {subtitle && (
                <Text style={[styles.subtitleText, { color: colors.secondary }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          {/* Connection Status */}
          <View style={styles.statusSection}>
            <View style={[styles.statusIndicator, { 
              backgroundColor: isConnected ? colors.success : colors.warning 
            }]}>
              <FontAwesome 
                name={isConnected ? 'wifi' : 'exclamation-triangle'} 
                size={14} 
                color={colors.background}
              />
            </View>
            
            <Text style={[styles.statusText, { color: colors.secondary }]}>
              {isConnected ? 'Real-time updates active' : 'Connection issues'}
            </Text>
          </View>

          {/* Debug Info (Development Only) */}
          {planId && __DEV__ && (
            <View style={styles.debugSection}>
              <Text style={[styles.debugText, { color: colors.secondary }]}>
                Plan ID: {planId}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* AI Agent Explanation */}
      <Card style={styles.explanationCard}>
        <View style={styles.explanationContent}>
          <FontAwesome 
            name="lightbulb-o" 
            size={20} 
            color={colors.primary}
            style={styles.explanationIcon}
          />
          
          <Text style={[styles.explanationText, { color: colors.text }]}>
            Our AI agents are analyzing your jobs, optimizing routes, and checking inventory 
            to create the perfect daily plan for you.
          </Text>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    ...spacing.helpers.padding('l'),
  },
  card: {
    marginBottom: spacing.l,
  },
  content: {
    alignItems: 'center',
  },
  loadingSection: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  spinner: {
    marginBottom: spacing.m,
  },
  textSection: {
    alignItems: 'center',
  },
  stepText: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitleText: {
    ...typography.body,
    textAlign: 'center',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.s,
  },
  statusText: {
    ...typography.caption,
  },
  debugSection: {
    marginTop: spacing.s,
  },
  debugText: {
    ...typography.caption,
    fontFamily: 'monospace',
  },
  explanationCard: {
    backgroundColor: 'rgba(244, 164, 96, 0.1)', // Light primary color background
  },
  explanationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  explanationIcon: {
    marginRight: spacing.m,
    marginTop: spacing.xs,
  },
  explanationText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
  },
}); 