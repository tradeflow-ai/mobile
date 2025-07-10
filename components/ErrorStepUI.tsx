/**
 * TradeFlow Mobile App - Error Step UI Component
 * 
 * Displays error states during the AI agent workflow with retry functionality
 * and helpful error messages. Used throughout the Plan Your Day workflow when
 * agents fail or encounter issues.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { typography, spacing, radius } from '@/constants/Theme';

interface ErrorStepUIProps {
  /**
   * The error message to display
   */
  error: string;
  
  /**
   * Optional retry function
   */
  onRetry?: () => void;
  
  /**
   * Text for the retry button
   * @default "Retry"
   */
  retryText?: string;
  
  /**
   * Optional secondary action
   */
  onSecondaryAction?: () => void;
  
  /**
   * Text for the secondary action button
   */
  secondaryActionText?: string;
  
  /**
   * Whether to show technical details
   * @default false
   */
  showTechnicalDetails?: boolean;
  
  /**
   * Additional context for the error
   */
  context?: string;
}

export const ErrorStepUI: React.FC<ErrorStepUIProps> = ({
  error,
  onRetry,
  retryText = 'Retry',
  onSecondaryAction,
  secondaryActionText,
  showTechnicalDetails = false,
  context,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.content}>
          {/* Error Icon */}
          <View style={[styles.errorIcon, { backgroundColor: colors.error }]}>
            <FontAwesome 
              name="exclamation-triangle" 
              size={32} 
              color={colors.background}
            />
          </View>

          {/* Error Message */}
          <View style={styles.messageSection}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              Something went wrong
            </Text>
            
            <Text style={[styles.errorText, { color: colors.secondary }]}>
              {error}
            </Text>
            
            {context && (
              <Text style={[styles.contextText, { color: colors.secondary }]}>
                {context}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {onRetry && (
                             <Button
                 title={retryText}
                 onPress={onRetry}
                 variant="primary"
                 style={styles.retryButton}
               />
            )}
            
            {onSecondaryAction && secondaryActionText && (
              <Button
                title={secondaryActionText}
                onPress={onSecondaryAction}
                variant="outline"
                style={styles.secondaryButton}
              />
            )}
          </View>

          {/* Technical Details (Development Only) */}
          {showTechnicalDetails && __DEV__ && (
            <View style={styles.technicalSection}>
              <Text style={[styles.technicalTitle, { color: colors.secondary }]}>
                Technical Details
              </Text>
              <Text style={[styles.technicalText, { color: colors.secondary }]}>
                {error}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Help Card */}
      <Card style={styles.helpCard}>
        <View style={styles.helpContent}>
          <FontAwesome 
            name="question-circle-o" 
            size={20} 
            color={colors.primary}
            style={styles.helpIcon}
          />
          
          <View style={styles.helpTextSection}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>
              Need Help?
            </Text>
            <Text style={[styles.helpText, { color: colors.secondary }]}>
              Try refreshing the app or check your internet connection. 
              If the problem persists, the AI agents may be experiencing high load.
            </Text>
          </View>
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
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.l,
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  titleText: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  contextText: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionSection: {
    width: '100%',
    gap: spacing.m,
  },
  retryButton: {
    // Button styles are handled by the Button component
  },
  secondaryButton: {
    // Button styles are handled by the Button component
  },
  technicalSection: {
    marginTop: spacing.l,
    padding: spacing.m,
    backgroundColor: 'rgba(220, 53, 69, 0.1)', // Light error background
    borderRadius: radius.m,
    width: '100%',
  },
  technicalTitle: {
    ...typography.h4,
    marginBottom: spacing.s,
  },
  technicalText: {
    ...typography.caption,
    fontFamily: 'monospace',
  },
  helpCard: {
    backgroundColor: 'rgba(244, 164, 96, 0.1)', // Light primary color background
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpIcon: {
    marginRight: spacing.m,
    marginTop: spacing.xs,
  },
  helpTextSection: {
    flex: 1,
  },
  helpTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  helpText: {
    ...typography.body,
    lineHeight: 20,
  },
}); 